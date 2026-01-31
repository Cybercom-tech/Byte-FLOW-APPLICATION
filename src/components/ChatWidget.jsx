import React, { useState, useEffect, useRef, useMemo, memo } from 'react'
import { getCurrentUser } from '../utils/auth'
import { 
  getStudentMessages, 
  getStudentOutgoingMessages, 
  sendMessageToTeacher,
  getCourseTeacher,
  getTeacherMessages,
  sendMessageToStudents,
  markMessageAsRead,
  markTeacherMessageAsRead,
  getCourseStudents,
  getTeacherStudents
} from '../utils/studentTeacherManagement'
import { getAllCourses } from '../utils/courseManagement'
import { coursesData } from '../pages/Training/coursesData'
import { getEnrolledCourses } from '../utils/courseEnrollment'

function ChatWidget({ userType = 'student' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [chatMessages, setChatMessages] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [teacherActiveStudents, setTeacherActiveStudents] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [courseStudentsMap, setCourseStudentsMap] = useState(new Map()) // Cache for course students
  const [allCoursesList, setAllCoursesList] = useState([]) // Cache for all courses (for course name lookup)
  const [unreadCountsPerChat, setUnreadCountsPerChat] = useState(new Map()) // Track unread count per conversation
  const [chatOpenedAt, setChatOpenedAt] = useState(null) // Track when current chat was opened
  const [newMessagesSinceOpen, setNewMessagesSinceOpen] = useState(new Set()) // Track message IDs that arrived after opening
  const [newMessagesBannerVisible, setNewMessagesBannerVisible] = useState(false) // Show/hide "x new messages" banner
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const availableCoursesLoggedRef = useRef(false) // Track if we've logged the "no courses" warning
  const isLoadingMessagesRef = useRef(false) // Prevent multiple simultaneous loads
  const locallyMarkedAsReadRef = useRef(new Set()) // Track message IDs marked as read locally (for instant UI update)
  const currentUser = useMemo(() => getCurrentUser(), [])
  
  // Calculate currentChatKey early (used in multiple places)
  // For students: convert to string to match the courseId keys in chatMessages (JS object keys are strings)
  // For teachers: use the string key format (courseId_studentId)
  const currentChatKey = userType === 'student' 
    ? (selectedCourse ? String(selectedCourse) : null)
    : (selectedCourse ? selectedCourse : null)
  
  // Load messages based on user type
  const loadMessages = async () => {
    if (!currentUser) return
    
    // Prevent multiple simultaneous loads (causes flickering)
    if (isLoadingMessagesRef.current) {
      return
    }
    
    isLoadingMessagesRef.current = true

    try {
      if (userType === 'student') {
        const studentId = currentUser.id || '1'
        // getStudentMessages now returns both incoming and outgoing messages
        let allStudentMessages = await getStudentMessages(studentId)
        
        // Ensure array
        if (!Array.isArray(allStudentMessages)) allStudentMessages = []
        
        // Get enrolled courses to check completion status (use state)
        const enrolledCoursesArray = Array.isArray(enrolledCourses) ? enrolledCourses : []
        const courseCompletionMap = new Map()
        enrolledCoursesArray.forEach(enrollment => {
          const courseId = String(enrollment.courseId)
          const progressValue = typeof enrollment.progress === 'number' 
            ? enrollment.progress 
            : parseFloat(enrollment.progress || '0')
          const isCompleted = !isNaN(progressValue) && progressValue >= 100
          courseCompletionMap.set(courseId, {
            isCompleted: isCompleted,
            status: enrollment.status
          })
        })
        
        // Filter expired messages
        const now = new Date()
        allStudentMessages = allStudentMessages.filter(msg => {
          if (msg.messageType === 'zoom_link' && msg.date && msg.time) {
            try {
              const [year, month, day] = msg.date.split('-').map(Number)
              const [hours, minutes] = msg.time.split(':').map(Number)
              const msgDateTime = new Date(year, month - 1, day, hours, minutes)
              return msgDateTime >= now
            } catch (e) {
              return true
            }
          }
          return true
        })

        // Separate incoming and outgoing for display purposes
        const incomingMessages = allStudentMessages.filter(m => m.direction === 'teacher_to_student' || !m.direction)
        const outgoingMessages = allStudentMessages.filter(m => m.direction === 'student_to_teacher')
        

        // Group by course, but filter out completed courses
        const allMessages = allStudentMessages
        const grouped = {}
        allMessages.forEach(msg => {
          // Use string keys for consistency (JavaScript object keys are always strings)
          const courseId = String(msg.courseId)
          const courseStatus = courseCompletionMap.get(courseId)
          
          // Only include messages from non-completed courses
          // If course status doesn't exist, exclude it (course might not be enrolled anymore)
          if (!courseStatus || courseStatus.isCompleted) {
            return
          }
          
          if (!grouped[courseId]) {
            grouped[courseId] = []
          }
          grouped[courseId].push(msg)
        })

        // Final cleanup: Remove any groups that belong to completed courses
        Object.keys(grouped).forEach(courseId => {
          const courseStatus = courseCompletionMap.get(courseId)
          if (!courseStatus || courseStatus.isCompleted) {
            delete grouped[courseId]
            return
          }
          grouped[courseId].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
        })

        setChatMessages(grouped)
        // Filter messages to exclude completed courses (use incoming messages for unread count)
        const activeMessages = incomingMessages.filter(msg => {
          const courseId = String(msg.courseId)
          const courseStatus = courseCompletionMap.get(courseId)
          return courseStatus && !courseStatus.isCompleted
        })
        setMessages(activeMessages)
        // Exclude locally marked-as-read messages from unread count
        setUnreadCount(activeMessages.filter(m => !m.read && !locallyMarkedAsReadRef.current.has(m.id)).length)
        
        // Calculate unread counts per chat (excluding locally marked-as-read)
        const unreadCountsMap = new Map()
        Object.keys(grouped).forEach(courseId => {
          const courseStatus = courseCompletionMap.get(courseId)
          if (courseStatus && !courseStatus.isCompleted) {
            const unread = grouped[courseId].filter(m => 
              (m.direction === 'teacher_to_student' || !m.direction) && !m.read && !locallyMarkedAsReadRef.current.has(m.id)
            ).length
            if (unread > 0) {
              unreadCountsMap.set(courseId, unread)
            }
          }
        })
        setUnreadCountsPerChat(unreadCountsMap)

        // Auto-select first course with messages (only if no selection and widget is open)
        if (!selectedCourse && isOpen && Object.keys(grouped).length > 0) {
          const firstCourseId = Object.keys(grouped)[0]
          // Use setTimeout to avoid flickering during render
          // Keep as string to handle both numeric IDs and MongoDB ObjectIds
          setTimeout(() => {
            setSelectedCourse(firstCourseId)
          }, 0)
        }
      } else {
        // Teacher
        const teacherId = currentUser.id || '1'
        // Get all messages (both incoming and outgoing)
        let allTeacherMessages = await getTeacherMessages(teacherId)
        
        // Ensure array
        if (!Array.isArray(allTeacherMessages)) {
          allTeacherMessages = []
        }
        
        // Filter expired messages (same as student side)
        const now = new Date()
        allTeacherMessages = allTeacherMessages.filter(msg => {
          if (msg.messageType === 'zoom_link' && msg.date && msg.time) {
            try {
              const [year, month, day] = msg.date.split('-').map(Number)
              const [hours, minutes] = msg.time.split(':').map(Number)
              const msgDateTime = new Date(year, month - 1, day, hours, minutes)
              return msgDateTime >= now
            } catch (e) {
              return true
            }
          }
          return true
        })
        
        // Separate incoming and outgoing for display purposes
        const incomingMessages = allTeacherMessages.filter(m => m.direction === 'student_to_teacher')
        const outgoingMessages = allTeacherMessages.filter(m => m.direction === 'teacher_to_student' || !m.direction)
        
        
        // Get all enrolled students to check completion status
        const allEnrolledStudents = new Map()
        
        try {
          // Get unique courseIds from messages (use Set to avoid duplicates)
          const allCourses = new Set()
          allTeacherMessages.forEach(msg => {
            if (msg.courseId) {
              const courseIdStr = String(msg.courseId)
              allCourses.add(courseIdStr)
            }
          })
          
          // Fetch students for all courses in parallel (not sequentially) to prevent flickering
          const courseStudentPromises = Array.from(allCourses).map(async (courseIdStr) => {
            try {
              // Check cache first
              const cached = courseStudentsMap.get(courseIdStr) || courseStudentsMap.get(parseInt(courseIdStr))
              if (cached && Array.isArray(cached)) {
                return { courseId: courseIdStr, students: cached }
              }
              
              // Fetch from API
              const enrolledStudents = await getCourseStudents(courseIdStr)
              const enrolledArray = Array.isArray(enrolledStudents) ? enrolledStudents : []
              
              // Update cache
              if (enrolledArray.length > 0) {
                const newMap = new Map(courseStudentsMap)
                newMap.set(courseIdStr, enrolledArray)
                setCourseStudentsMap(newMap)
              }
              
              return { courseId: courseIdStr, students: enrolledArray }
            } catch (error) {
              console.error(`Error getting students for course ${courseIdStr}:`, error)
              return { courseId: courseIdStr, students: [] }
            }
          })
          
          // Wait for all course student fetches to complete in parallel
          const courseStudentResults = await Promise.all(courseStudentPromises)
          
          // Build completion status map
          courseStudentResults.forEach(({ courseId, students }) => {
            students.forEach(student => {
              const studentIdStr = String(student.studentId || student._id)
              const key = `${courseId}_${studentIdStr}`
              allEnrolledStudents.set(key, {
                isCompleted: student.isCompleted || (student.progress || 0) >= 100
              })
            })
          })
        } catch (error) {
          console.error('Error checking student completion status:', error)
        }
        
        // Group by courseId_studentId, but filter out completed students
        const grouped = {}
        allTeacherMessages.forEach(msg => {
          if (!msg.courseId || !msg.studentId) return
          
          // Use string courseId to handle both numeric IDs and ObjectIds
          const courseIdStr = String(msg.courseId)
          const studentIdStr = String(msg.studentId)
          const key = `${courseIdStr}_${studentIdStr}`
          
          const studentStatus = allEnrolledStudents.get(key)
          // Only include if student status exists and is NOT completed
          if (!studentStatus || studentStatus.isCompleted) {
            return
          }
          
          if (!grouped[key]) {
            grouped[key] = []
          }
          grouped[key].push(msg)
        })

        // Final cleanup: Remove any groups that belong to completed students and sort
        Object.keys(grouped).forEach(key => {
          const studentStatus = allEnrolledStudents.get(key)
          if (!studentStatus || studentStatus.isCompleted) {
            delete grouped[key]
            return
          }
          // Sort by sentAt (consistent with student side)
          grouped[key].sort((a, b) => {
            const dateA = a.sentAt ? new Date(a.sentAt) : new Date(0)
            const dateB = b.sentAt ? new Date(b.sentAt) : new Date(0)
            return dateA - dateB
          })
        })

        setChatMessages(grouped)
        // Filter unread count to exclude completed students (only incoming messages)
        const activeUnreadMessages = incomingMessages.filter(m => {
          if (!m.courseId || !m.studentId) return false
          const courseIdStr = String(m.courseId)
          const studentIdStr = String(m.studentId)
          const key = `${courseIdStr}_${studentIdStr}`
          const studentStatus = allEnrolledStudents.get(key)
          return studentStatus && !studentStatus.isCompleted
        })
        setMessages(activeUnreadMessages)
        // Exclude locally marked-as-read messages from unread count
        setUnreadCount(activeUnreadMessages.filter(m => !m.read && !locallyMarkedAsReadRef.current.has(m.id)).length)
        
        // Calculate unread counts per chat (excluding locally marked-as-read)
        const unreadCountsMap = new Map()
        Object.keys(grouped).forEach(key => {
          const studentStatus = allEnrolledStudents.get(key)
          if (studentStatus && !studentStatus.isCompleted) {
            const unread = grouped[key].filter(m => 
              m.direction === 'student_to_teacher' && !m.read && !locallyMarkedAsReadRef.current.has(m.id)
            ).length
            if (unread > 0) {
              unreadCountsMap.set(key, unread)
            }
          }
        })
        setUnreadCountsPerChat(unreadCountsMap)
        
        // Auto-select first chat with messages (only if no selection and widget is open)
        // Don't auto-select if user just changed dropdown to empty
        if (!selectedCourse && isOpen && Object.keys(grouped).length > 0) {
          const firstChatKey = Object.keys(grouped)[0]
          // Use setTimeout to avoid flickering during render
          setTimeout(() => {
            setSelectedCourse(firstChatKey)
          }, 0)
        }

        try {
          // Get students from courses teacher created
          let teacherStudents = await getTeacherStudents(teacherId)
          let teacherStudentsArray = Array.isArray(teacherStudents) ? teacherStudents : []
          
          // Also get students from courses teacher is assigned to (but didn't create)
          try {
            const { getCoursesAssignedToTeacher } = await import('../utils/courseManagement')
            const assignedCourseIds = await getCoursesAssignedToTeacher(teacherId)
            
            // Fetch students for all assigned courses in parallel (not sequentially) to prevent flickering
            const assignedCoursePromises = assignedCourseIds.map(async (courseId) => {
              try {
                const courseStudents = await getCourseStudents(courseId)
                const courseStudentsArray = Array.isArray(courseStudents) ? courseStudents : []
                
                // Transform to match teacherStudents format
                return courseStudentsArray.map(student => ({
                  studentId: student.studentId || student._id,
                  courseId: courseId,
                  enrolledDate: student.enrolledDate,
                  enrollmentStatus: student.enrollmentStatus || 'active',
                  progress: student.progress || 0,
                  email: student.email || '',
                  name: student.name || 'Student'
                }))
              } catch (error) {
                return []
              }
            })
            
            const assignedStudentsArrays = await Promise.all(assignedCoursePromises)
            assignedStudentsArrays.forEach(students => {
              teacherStudentsArray = [...teacherStudentsArray, ...students]
            })
          } catch (error) {
            // Silently handle error
          }
          
          const activeStudents = teacherStudentsArray.filter(student => {
            const isCompleted = student.isCompleted || (student.progress || 0) >= 100
            return !isCompleted
          })
          
          setTeacherActiveStudents(activeStudents)
        } catch (error) {
          console.error('Error loading teacher students for chat:', error)
          setTeacherActiveStudents([])
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      isLoadingMessagesRef.current = false
    }
  }

  // Load enrolled courses on mount and when user changes
  useEffect(() => {
    const loadEnrolledCourses = async () => {
      if (userType === 'student' && currentUser) {
        try {
          const courses = await getEnrolledCourses()
          // Only update if we got valid data (preserves existing data on error)
          if (Array.isArray(courses) && courses.length > 0) {
            setEnrolledCourses(courses)
          } else if (courses !== null && Array.isArray(courses)) {
            // Empty array is valid (no enrollments)
            setEnrolledCourses(courses)
          }
          // If courses is null/undefined, preserve existing data
        } catch (error) {
          console.warn('Error loading enrolled courses, preserving existing data:', error.message || error)
          // Don't reset to empty array - preserve existing data
        }
      }
    }
    loadEnrolledCourses()
  }, [currentUser?.id, userType])

  // Load all courses for course name lookup (for both students and teachers)
  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        const courses = await getAllCourses()
        // Only update if we got valid data (preserves existing data on error)
        if (Array.isArray(courses) && courses.length > 0) {
          setAllCoursesList(courses)
        } else if (courses !== null && Array.isArray(courses)) {
          // Empty array might be valid
          setAllCoursesList(courses)
        }
        // If courses is null/undefined, preserve existing data
      } catch (error) {
        console.warn('Error loading all courses, preserving existing data:', error.message || error)
        // Don't reset to empty array - preserve existing data
      }
    }
    loadAllCourses()
  }, [])

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [currentUser?.id, userType, enrolledCourses])

  // Track when chat is opened/selected to detect new messages
  useEffect(() => {
    if (selectedCourse && isOpen) {
      // Set timestamp when chat is opened
      setChatOpenedAt(Date.now())
      // Clear previous new messages tracking
      setNewMessagesSinceOpen(new Set())
      setNewMessagesBannerVisible(false)
    } else if (!selectedCourse || !isOpen) {
      // Reset when chat is closed or deselected
      setChatOpenedAt(null)
      setNewMessagesSinceOpen(new Set())
      setNewMessagesBannerVisible(false)
    }
  }, [selectedCourse, isOpen])

  // Detect new messages that arrive after chat is opened
  useEffect(() => {
    if (!chatOpenedAt || !selectedCourse || !currentChatKey) return
    
    const currentMessages = chatMessages[currentChatKey] || []
    const newIds = new Set()
    
    currentMessages.forEach(msg => {
      if (!msg || !msg.id) return
      const isFromOther = userType === 'student' 
        ? (msg.direction === 'teacher_to_student' || !msg.direction)
        : (msg.direction === 'student_to_teacher')
      
      if (isFromOther) {
        const msgTime = msg.sentAt ? new Date(msg.sentAt).getTime() : 0
        // Message arrived after chat was opened
        if (msgTime > chatOpenedAt) {
          newIds.add(msg.id)
        }
      }
    })
    
    if (newIds.size > 0) {
      setNewMessagesSinceOpen(prev => {
        const combined = new Set([...prev, ...newIds])
        setNewMessagesBannerVisible(true)
        return combined
      })
    }
  }, [chatMessages, chatOpenedAt, selectedCourse, currentChatKey, userType])

  // Reload messages when course selection changes to ensure we have the latest data
  useEffect(() => {
    if (selectedCourse && currentUser) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        loadMessages()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [selectedCourse])

  // Track if user is manually scrolling
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const scrollTimeoutRef = useRef(null)

  // Handle scroll events
  const handleScroll = () => {
    setIsUserScrolling(true)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false)
    }, 500)
    
    // Hide "new messages" banner when scrolled past new messages
    if (newMessagesBannerVisible && messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const scrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      const scrollHeight = container.scrollHeight
      
      // If scrolled near bottom (within 100px), hide banner
      if (scrollHeight - scrollTop - containerHeight < 100) {
        setNewMessagesBannerVisible(false)
      }
    }
  }

  // Auto-scroll to bottom only when:
  // 1. New messages arrive (and user isn't manually scrolling)
  // 2. Course selection changes
  // 3. Chat window opens
  useEffect(() => {
    if (messagesContainerRef.current && isOpen && selectedCourse) {
      const container = messagesContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
      
      // Only auto-scroll if user is near bottom (within 150px) or it's a new course selection
      if (isNearBottom) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          if (messagesContainerRef.current && !isUserScrolling) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        })
      }
    }
  }, [chatMessages, selectedCourse, isOpen, isUserScrolling])

  // Scroll to bottom when course changes or window opens
  useEffect(() => {
    if (messagesContainerRef.current && isOpen && selectedCourse) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      })
    }
  }, [selectedCourse, isOpen])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || newMessage.trim().length < 5) {
      return
    }

    if (userType === 'student') {
      if (!selectedCourse) return
      // Use state for enrolled courses
      // Match by string to handle both numeric IDs and MongoDB ObjectIds
      const enrollment = enrolledCourses.find(e => String(e.courseId) === String(selectedCourse))
      const progressValue = enrollment && typeof enrollment.progress === 'number'
        ? enrollment.progress
        : parseFloat(enrollment?.progress || '0')
      if (!enrollment || progressValue >= 100 || enrollment.status === 'completed') {
        alert('This course has been completed. Messaging is no longer available.')
        setSelectedCourse(null)
        return
      }
      const studentId = currentUser.id || '1'
      const studentName = currentUser.name || 'Student'
      
      // Store message text for optimistic update
      const messageText = newMessage.trim()
      
      try {
        const teacher = await getCourseTeacher(selectedCourse)

        if (!teacher || !teacher.teacherId) {
          alert('Unable to find the instructor for this course. Please contact support or try again later.')
          return
        }
        
        // Optimistically add message to UI immediately
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          studentId: studentId,
          courseId: selectedCourse,
          message: messageText,
          direction: 'student_to_teacher',
          sentAt: new Date().toISOString(),
          read: false,
          messageType: 'student_message'
        }
        
        const currentChatKey = String(selectedCourse)
        setChatMessages(prev => {
          const updated = { ...prev }
          if (!updated[currentChatKey]) {
            updated[currentChatKey] = []
          }
          updated[currentChatKey] = [...updated[currentChatKey], optimisticMessage]
          return updated
        })
        
        // Clear input immediately
        setNewMessage('')
        
        // Scroll to bottom immediately
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        })
        
        const result = await sendMessageToTeacher(
          studentId,
          selectedCourse,
          teacher.teacherId,
          messageText,
          studentName
        )
        
        if (result.success) {
          // Reload messages immediately to get the real message from server
          loadMessages()
        } else {
          // Remove optimistic message on failure
          setChatMessages(prev => {
            const updated = { ...prev }
            if (updated[currentChatKey]) {
              updated[currentChatKey] = updated[currentChatKey].filter(m => m.id !== optimisticMessage.id)
            }
            return updated
          })
          // Restore message text
          setNewMessage(messageText)
          console.error('Failed to send message:', result.message || 'Unknown error')
          alert(result.message || 'Failed to send message. Please try again.')
        }
      } catch (error) {
        // Remove optimistic message on error
        const currentChatKey = String(selectedCourse)
        setChatMessages(prev => {
          const updated = { ...prev }
          if (updated[currentChatKey]) {
            updated[currentChatKey] = updated[currentChatKey].filter(m => {
              // Keep all messages except the optimistic one we just added
              return !(m.id?.startsWith('temp-') && m.message === messageText)
            })
          }
          return updated
        })
        // Restore message text
        setNewMessage(messageText)
        console.error('Error sending message:', error)
        alert('Error sending message. Please try again.')
      }
    } else {
      // Teacher
      if (!selectedCourse) return
      const [courseId, studentId] = selectedCourse.split('_')
      const teacherId = currentUser.id || '1'
      const teacherName = currentUser.name || 'Teacher'

      // Store message text for optimistic update
      const messageText = newMessage.trim()
      const currentChatKey = selectedCourse

      // Verify the student is actually enrolled in the course (use cached data first)
      try {
        // First check cache to avoid unnecessary API call
        const courseIdStr = String(courseId)
        const courseIdNum = parseInt(courseIdStr)
        let enrolledArray = []
        let student = null
        
        // Check cache first
        const cached = courseStudentsMap.get(courseIdStr) || courseStudentsMap.get(courseIdNum) || courseStudentsMap.get(parseInt(courseIdStr))
        if (cached && Array.isArray(cached)) {
          enrolledArray = cached
          student = enrolledArray.find(s => String(s.studentId) === String(studentId))
        }
        
        // Only fetch from API if not in cache
        if (!student) {
          const enrolledStudents = await getCourseStudents(courseId)
          enrolledArray = Array.isArray(enrolledStudents) ? enrolledStudents : []
          student = enrolledArray.find(s => String(s.studentId) === String(studentId))
          
          // Update cache
          if (enrolledArray.length > 0) {
            const newMap = new Map(courseStudentsMap)
            newMap.set(courseIdStr, enrolledArray)
            if (!isNaN(courseIdNum)) {
              newMap.set(courseIdNum, enrolledArray)
            }
            setCourseStudentsMap(newMap)
          }
        }
        
        if (!student) {
          alert('Error: Student not found in course enrollment. Please refresh and try again.')
          console.error('Student not enrolled:', { courseId, studentId, enrolledStudents: enrolledArray })
          return
        }

        if (student.isCompleted || (student.progress || 0) >= 100) {
          alert('This student has completed the course. Messaging is no longer available.')
          setSelectedCourse(null)
          return
        }

        // Use the actual studentId from enrollment to ensure correctness
        const actualStudentId = student.studentId

        // Optimistically add message to UI immediately
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          teacherId: teacherId,
          studentId: actualStudentId,
          courseId: courseId,
          message: messageText,
          direction: 'teacher_to_student',
          sentAt: new Date().toISOString(),
          read: false,
          messageType: 'info'
        }
        
        setChatMessages(prev => {
          const updated = { ...prev }
          if (!updated[currentChatKey]) {
            updated[currentChatKey] = []
          }
          updated[currentChatKey] = [...updated[currentChatKey], optimisticMessage]
          return updated
        })
        
        // Clear input immediately
        setNewMessage('')
        
        // Scroll to bottom immediately
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        })

        // courseId can be numeric or ObjectId string - API will handle it
        const result = await sendMessageToStudents(
          teacherId,
          courseId, // Keep as string, API handles both formats
          [actualStudentId], // Use actual studentId from enrollment
          messageText,
          'info',
          '',
          '',
          teacherName
        )
        
        if (result.success) {
          // Reload messages immediately to get the real message from server
          loadMessages()
        } else {
          // Remove optimistic message on failure
          setChatMessages(prev => {
            const updated = { ...prev }
            if (updated[currentChatKey]) {
              updated[currentChatKey] = updated[currentChatKey].filter(m => m.id !== optimisticMessage.id)
            }
            return updated
          })
          // Restore message text
          setNewMessage(messageText)
          console.error('Failed to send message:', result.message || 'Unknown error')
          alert(result.message || 'Failed to send message. Please try again.')
        }
      } catch (error) {
        // Remove optimistic message on error
        setChatMessages(prev => {
          const updated = { ...prev }
          if (updated[currentChatKey]) {
            updated[currentChatKey] = updated[currentChatKey].filter(m => {
              // Keep all messages except the optimistic one we just added
              return !(m.id?.startsWith('temp-') && m.message === messageText)
            })
          }
          return updated
        })
        // Restore message text
        setNewMessage(messageText)
        console.error('Error sending message:', error)
        alert('Error sending message. Please try again.')
      }
    }
  }

  const handleMarkAsRead = (messageId) => {
    if (userType === 'student') {
      markMessageAsRead(messageId)
    } else {
      markTeacherMessageAsRead(messageId)
    }
    loadMessages()
  }

  // Track which chats we've already marked as read to avoid infinite loops
  const markedAsReadRef = useRef(new Set())
  const lastSelectedCourseRef = useRef(null)

  // Auto-mark all unread messages as read when a chat is opened or course changes
  useEffect(() => {
    // Only run when chat is opened and a course is selected
    if (!isOpen || !selectedCourse || !currentChatKey) {
      return
    }

    // Check if chatMessages has been loaded
    if (!chatMessages || !chatMessages[currentChatKey]) {
      return
    }

    const chatKey = currentChatKey
    const courseChanged = lastSelectedCourseRef.current !== selectedCourse
    
    // Reset tracking when course changes
    if (courseChanged) {
      markedAsReadRef.current.clear()
      lastSelectedCourseRef.current = selectedCourse
    }
    
    // Skip if we've already marked this chat as read
    if (markedAsReadRef.current.has(chatKey)) {
      return
    }

    const messages = chatMessages[chatKey]
    if (!messages || !Array.isArray(messages)) {
      return
    }

    const unreadMessages = messages.filter(msg => {
      if (!msg) return false
      // Exclude messages already marked as read locally
      if (msg.id && locallyMarkedAsReadRef.current.has(msg.id)) return false
      if (userType === 'student') {
        return (msg.direction === 'teacher_to_student' || !msg.direction) && !msg.read
      } else {
        return msg.direction === 'student_to_teacher' && !msg.read
      }
    })

    // Mark all unread messages as read
    if (unreadMessages.length > 0) {
      // Add to locally marked as read set FIRST (for instant UI update)
      unreadMessages.forEach(msg => {
        if (msg && msg.id) {
          locallyMarkedAsReadRef.current.add(msg.id)
        }
      })
      
      // Clear red dot optimistically for this chat
      setUnreadCountsPerChat(prev => {
        const updated = new Map(prev)
        updated.delete(chatKey)
        return updated
      })
      
      // Update unread count optimistically (immediately reduce count)
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - unreadMessages.length)
        return newCount
      })
      
      // Clear new messages tracking for read messages
      setNewMessagesSinceOpen(prev => {
        const updated = new Set(prev)
        unreadMessages.forEach(msg => {
          if (msg && msg.id) {
            updated.delete(msg.id)
          }
        })
        return updated
      })
      
      // Hide banner if all new messages are read
      setNewMessagesBannerVisible(false)
      
      unreadMessages.forEach(msg => {
        if (msg && msg.id) {
          try {
            if (userType === 'student') {
              markMessageAsRead(msg.id)
            } else {
              markTeacherMessageAsRead(msg.id)
            }
          } catch (error) {
            console.error('Error marking message as read:', error)
          }
        }
      })
      // Mark this chat as processed
      markedAsReadRef.current.add(chatKey)
      // Reload messages to update the UI and unread count (with shorter delay for faster update)
      setTimeout(() => {
        try {
          loadMessages()
        } catch (error) {
          console.error('Error reloading messages:', error)
        }
      }, 100)
    } else {
      // No unread messages, still mark as processed
      markedAsReadRef.current.add(chatKey)
      // Clear banner if no new messages
      setNewMessagesBannerVisible(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, isOpen, currentChatKey, userType])

  const normalizeUrl = (url) => {
    if (!url) return ''
    url = url.trim()
    if (url.match(/^https?:\/\//i)) return url
    if (url.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/)) {
      return `https://${url}`
    }
    return url
  }

  const renderMessageWithLinks = (text) => {
    if (!text || typeof text !== 'string') return ''
    const urlRegex = /(https?:\/\/[^\s\n]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s\n]*)/g
    const parts = text.split(urlRegex)
    
    return parts.map((part, index) => {
      if (part && part.match(urlRegex)) {
        const normalizedUrl = normalizeUrl(part)
        return (
          <a
            key={index}
            href={normalizedUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: '#0d6efd',
              textDecoration: 'underline',
              wordBreak: 'break-all',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {part}
          </a>
        )
      }
      return <span key={index}>{part || ''}</span>
    })
  }

  // Get course name
  const getCourseName = (courseId) => {
    try {
      const allCourses = [...coursesData, ...allCoursesList]
      const courseIdStr = String(courseId)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/
      const isObjectId = objectIdPattern.test(courseIdStr)
      
      // Helper to match course IDs exactly (same logic as getAvailableCourses)
      const matchCourseId = (c) => {
        if (!c) return false
        
        // For MongoDB ObjectIds - must match exactly
        if (isObjectId) {
          if (c._id && String(c._id) === courseIdStr) return true
          if (c.id && String(c.id) === courseIdStr) return true
          return false
        }
        
        // For numeric IDs - must match exactly
        const courseIdNum = parseInt(courseIdStr)
        if (!isNaN(courseIdNum)) {
          const cIdStr = String(c.id || '')
          const cIsObjectId = objectIdPattern.test(cIdStr)
          // Don't match ObjectIds with numeric IDs
          if (cIsObjectId) return false
          
          const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id
          if (cId === courseIdNum || String(c.id) === courseIdStr) return true
        }
        
        // Fallback: exact string match
        if (String(c.id) === courseIdStr || (c._id && String(c._id) === courseIdStr)) {
          return true
        }
        
        return false
      }
      
      const course = allCourses.find(matchCourseId)
      return course && course.title ? course.title : 'Unknown Course'
    } catch (error) {
      return 'Unknown Course'
    }
  }

  // Get available courses for student
  const getAvailableCourses = () => {
    if (userType !== 'student') return []
    try {
      // Use state for enrolled courses
      const enrolled = Array.isArray(enrolledCourses) ? enrolledCourses : []
      // Use state for all courses (includes teacher-created courses)
      const allCourses = [...coursesData, ...allCoursesList]
      
      const available = enrolled
        .filter(e => {
          const statusAllowed = e.status === 'active' || !e.status
          const progressValue = typeof e.progress === 'number' ? e.progress : parseFloat(e.progress || '0')
          const isCompleted = !isNaN(progressValue) && progressValue >= 100
          return statusAllowed && !isCompleted
        })
        .map(e => {
          const courseIdStr = String(e.courseId)
          
          // Helper to match course IDs (handles both numeric IDs and MongoDB ObjectIds)
          // IMPORTANT: Must match EXACTLY to prevent wrong course selection
          const matchCourseId = (c) => {
            if (!c) return false
            
            const objectIdPattern = /^[0-9a-fA-F]{24}$/
            const enrollmentIsObjectId = objectIdPattern.test(courseIdStr)
            
            // For MongoDB ObjectIds (24 hex characters) - must match exactly
            if (enrollmentIsObjectId) {
              // First check course._id (primary MongoDB field)
              if (c._id && String(c._id) === courseIdStr) {
                return true
              }
              // Then check course.id if it's the ObjectId (transformed from _id)
              if (c.id && String(c.id) === courseIdStr) {
                return true
              }
              // Don't match numeric IDs when enrollment has an ObjectId
              return false
            }
            
            // For numeric IDs (default courses) - must match exactly
            const courseIdNum = parseInt(courseIdStr)
            if (!isNaN(courseIdNum)) {
              // Check if course.id is an ObjectId - if so, don't match
              const cIdStr = String(c.id || '')
              const cIsObjectId = objectIdPattern.test(cIdStr)
              
              // If course.id is an ObjectId, don't match with numeric enrollment ID
              if (cIsObjectId) {
                return false
              }
              
              // Match numeric IDs
              const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id
              if (cId === courseIdNum || String(c.id) === courseIdStr) {
                return true
              }
            }
            
            // Fallback: exact string match (for any other string IDs)
            if (String(c.id) === courseIdStr || (c._id && String(c._id) === courseIdStr)) {
              return true
            }
            
            return false
          }
          
          // Try to find course by ID (handle both number, string, and ObjectId formats)
          let course = allCourses.find(matchCourseId)
          
          // If course not found but enrollment has course data, use that
          if (!course && e.course && e.course.courseTitle) {
            return {
              id: e.courseId,
              _id: e.courseId, // Include _id for ObjectId courses
              title: e.course.courseTitle
            }
          }
          
          // If still no course found, try to use courseId as title (fallback)
          if (!course) {
            return {
              id: e.courseId,
              _id: e.courseId, // Include _id for ObjectId courses
              title: `Course ${courseIdStr}`
            }
          }
          
          // Return course with both id and _id to ensure proper matching
          const courseId = course._id || course.id || e.courseId
          return { 
            id: courseId,
            _id: course._id || (typeof courseId === 'object' ? courseId : null), // Include _id if available
            title: course.title || course.courseTitle || 'Unknown Course' 
          }
        })
        .filter(c => c !== null)
      
      return available
    } catch (error) {
      console.error('Error in getAvailableCourses:', error)
      return []
    }
  }

  // Load course students for all courses with messages (for teacher dropdown)
  useEffect(() => {
    const loadCourseStudents = async () => {
      if (userType !== 'teacher') return
      
      const newMap = new Map()
      const allCourses = new Set()
      
      // Get all unique course IDs from chatMessages
      Object.keys(chatMessages).forEach(key => {
        const [courseId] = key.split('_')
        const courseIdStr = String(courseId)
        // Handle both numeric IDs and ObjectIds
        const courseIdNum = parseInt(courseIdStr)
        if (!isNaN(courseIdNum)) {
          allCourses.add(courseIdNum)
          allCourses.add(courseIdStr) // Also add as string for lookup
        } else if (courseIdStr.length === 24) {
          // Likely an ObjectId (24 hex characters)
          allCourses.add(courseIdStr)
        }
      })
      
      // Also add courses from teacherActiveStudents
      teacherActiveStudents.forEach(student => {
        if (student.courseId) {
          const courseIdStr = String(student.courseId)
          const courseIdNum = parseInt(courseIdStr)
          if (!isNaN(courseIdNum)) {
            allCourses.add(courseIdNum)
            allCourses.add(courseIdStr) // Also add as string
          } else {
            allCourses.add(courseIdStr) // Add ObjectId as string
          }
        }
      })
      
      // Load students for all courses in parallel (not sequentially) to prevent delay
      const courseStudentPromises = Array.from(allCourses).map(async (courseId) => {
        try {
          // Check cache first
          const cached = courseStudentsMap.get(courseId) || courseStudentsMap.get(String(courseId)) || courseStudentsMap.get(parseInt(courseId))
          if (cached && Array.isArray(cached)) {
            return { courseId, students: cached }
          }
          
          // getCourseStudents accepts both numeric and string courseIds
          const enrolledStudents = await getCourseStudents(courseId)
          const enrolledArray = Array.isArray(enrolledStudents) ? enrolledStudents : []
          
          return { courseId, students: enrolledArray }
        } catch (error) {
          console.error(`Error loading students for course ${courseId}:`, error)
          return { courseId, students: [] }
        }
      })
      
      // Wait for all course student fetches to complete in parallel
      const courseStudentResults = await Promise.all(courseStudentPromises)
      
      // Build the map from results
      courseStudentResults.forEach(({ courseId, students }) => {
        // Store with both numeric and string keys for easy lookup
        newMap.set(courseId, students)
        if (typeof courseId === 'number') {
          newMap.set(String(courseId), students)
        } else if (!isNaN(parseInt(courseId))) {
          newMap.set(parseInt(courseId), students)
        }
      })
      
      setCourseStudentsMap(newMap)
    }
    
    loadCourseStudents()
  }, [chatMessages, teacherActiveStudents, userType])

  // Get available chats for teacher
  const getAvailableChats = () => {
    if (userType !== 'teacher') return []
    
    const conversationsMap = new Map()
    
    // First, add conversations from existing messages
    Object.keys(chatMessages).forEach(key => {
      const [courseId, studentId] = key.split('_')
      // Handle both numeric and ObjectId courseIds
      const courseIdStr = String(courseId)
      const courseIdNum = parseInt(courseIdStr)
      const isValidCourseId = !isNaN(courseIdNum) || courseIdStr.length === 24 // ObjectId is 24 chars
      
      if (!isValidCourseId) return
      
      const courseName = getCourseName(courseId)
      const msgs = chatMessages[key]
      const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null
      
      // Get actual student name from cached enrollment data
      let studentName = null
      let isEnrolled = false
      let studentRecord = null
      
      // Try to find student in courseStudentsMap (use string key to match grouping format)
      const enrolledStudents = courseStudentsMap.get(courseIdStr) || courseStudentsMap.get(courseIdNum) || []
      studentRecord = enrolledStudents.find(s => 
        String(s.studentId) === String(studentId) || 
        String(s.studentId?._id || s.studentId) === String(studentId)
      )
      
      if (studentRecord && studentRecord.name) {
        studentName = studentRecord.name
        isEnrolled = true
      }
      
      // Fallback: use message data if available
      if (!isEnrolled && lastMsg?.studentName) {
        if (lastMsg.direction === 'student_to_teacher') {
          studentName = lastMsg.studentName
          isEnrolled = true
        }
      }
      
      // Only include if we found a valid enrolled student who is NOT completed
      if (isEnrolled && studentName) {
        const isCompleted = studentRecord && (
          studentRecord.isCompleted || 
          (studentRecord.progress && parseFloat(studentRecord.progress) >= 100)
        )
        if (!isCompleted) {
          conversationsMap.set(key, {
            key,
            courseId: courseIdNum || courseIdStr,
            studentId,
            courseName,
            studentName
          })
        }
      }
    })

    // Add all active students (even without existing chats) so teacher can start new conversations
    const activeStudentsArray = Array.isArray(teacherActiveStudents) ? teacherActiveStudents : []
    activeStudentsArray.forEach(student => {
      if (!student || !student.courseId || !student.studentId) return
      
      const courseId = student.courseId
      const courseIdStr = String(courseId)
      const key = `${courseIdStr}_${student.studentId}`
      
      // Skip if already added from messages
      if (conversationsMap.has(key)) return
      
      // Check if student is completed
      const isCompleted = student.isCompleted || (student.progress && parseFloat(student.progress) >= 100)
      if (isCompleted) return
      
      // Add to conversations
      conversationsMap.set(key, {
        key,
        courseId: courseId,
        studentId: student.studentId,
        courseName: getCourseName(courseId),
        studentName: student.name || 'Student'
      })
    })

    // Convert map to array
    return Array.from(conversationsMap.values())
  }

  const availableCourses = useMemo(() => {
    const courses = userType === 'student' ? getAvailableCourses() : getAvailableChats()
    // Only log if we expect courses but don't have any (for debugging)
    if (courses.length === 0 && process.env.NODE_ENV === 'development') {
      // Only log once using a ref to track if we've already logged
      if (!availableCoursesLoggedRef.current) {
        availableCoursesLoggedRef.current = true
      }
    } else if (courses.length > 0) {
      // Reset the flag if courses are found
      availableCoursesLoggedRef.current = false
    }
    return courses
  }, [userType, chatMessages, teacherActiveStudents, courseStudentsMap, enrolledCourses, allCoursesList])

  // Ensure selected course/chat remains valid (clears when course completes)
  useEffect(() => {
    if (!selectedCourse) {
      return
    }

    if (userType === 'student') {
      // Match by both id and _id to handle teacher-created courses with MongoDB ObjectIds
      const stillAvailable = availableCourses.some(course => {
        const courseId = course.id || course._id
        const selectedId = selectedCourse
        return String(courseId) === String(selectedId) || 
               (course._id && String(course._id) === String(selectedId)) ||
               (course.id && String(course.id) === String(selectedId))
      })
      if (!stillAvailable) {
        setSelectedCourse(null)
      }
    } else {
      const stillAvailable = availableCourses.some(chat => chat.key === selectedCourse)
      if (!stillAvailable) {
        setSelectedCourse(null)
      }
    }
  }, [availableCourses, selectedCourse, userType])

  const isMessagingAllowed = Boolean(selectedCourse)

  return (
    <>
      {/* Floating Chat Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '70px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c85716 0%, #ff6b35 100%)',
          boxShadow: '0 4px 12px rgba(200, 87, 22, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'transform 0.2s, box-shadow 0.2s',
          border: '3px solid #ffffff'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(200, 87, 22, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(200, 87, 22, 0.4)'
        }}
      >
        <i className="bi bi-chat-dots" style={{ fontSize: '24px', color: '#ffffff' }}></i>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#dc3545',
              color: '#ffffff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '600',
              border: '2px solid #ffffff'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '150px',
            right: '20px',
            width: '380px',
            height: '600px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            overflow: 'hidden',
            border: '1px solid #e9ecef'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #c85716 0%, #ff6b35 100%)',
              padding: '1rem 1.25rem',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '16px 16px 0 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-chat-dots" style={{ fontSize: '20px' }}></i>
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                  {userType === 'student' ? 'Chat with Teacher' : 'Messages'}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'We reply immediately'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="bi bi-chevron-down"></i>
            </button>
          </div>

          {/* Course/Chat Selection */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #e9ecef', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={selectedCourse ? String(selectedCourse) : ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (!value) {
                    setSelectedCourse(null)
                    return
                  }
                  // Keep as string for both students and teachers to handle MongoDB ObjectIds
                  // For students: can be numeric ID (default courses) or ObjectId string (teacher-created courses)
                  // For teachers: format is "courseId_studentId" (string)
                  // Use setTimeout to prevent flickering during state update
                  const newSelection = value // Keep as string to handle both numeric and ObjectId formats
                  setTimeout(() => {
                    setSelectedCourse(newSelection)
                  }, 0)
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  paddingRight: selectedCourse && (() => {
                    const chatKey = userType === 'student' ? String(selectedCourse) : selectedCourse
                    const unreadCount = unreadCountsPerChat.get(chatKey) || 0
                    return unreadCount > 0 ? '30px' : '12px'
                  })(),
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="">Select {userType === 'student' ? 'course' : 'a student'}...</option>
                {Array.isArray(availableCourses) && availableCourses.length > 0 ? (
                  availableCourses.map(item => {
                    if (!item) return null
                    const key = userType === 'student' ? (item.id || item.courseId) : (item.key || `${item.courseId}_${item.studentId}`)
                    const value = userType === 'student' ? (item.id || item.courseId) : (item.key || `${item.courseId}_${item.studentId}`)
                    const chatKey = userType === 'student' ? String(key) : key
                    const unreadCount = unreadCountsPerChat.get(chatKey) || 0
                    const baseLabel = userType === 'student' 
                      ? (item.title || `Course ${item.id || item.courseId}`)
                      : `${item.courseName || 'Course'} - ${item.studentName || 'Student'}`
                    // Add red dot indicator for chats with unread messages
                    const label = unreadCount > 0 ? `● ${baseLabel}` : baseLabel
                    
                    return (
                      <option key={key} value={value}>
                        {label}
                      </option>
                    )
                  })
                ) : (
                  <option value="" disabled>No {userType === 'student' ? 'courses' : 'students'} available</option>
                )}
              </select>
              {/* Red dot indicator for selected option */}
              {selectedCourse && (() => {
                const chatKey = userType === 'student' ? String(selectedCourse) : selectedCourse
                const unreadCount = unreadCountsPerChat.get(chatKey) || 0
                if (unreadCount > 0) {
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#dc3545',
                        pointerEvents: 'none',
                        zIndex: 1
                      }}
                    />
                  )
                }
                return null
              })()}
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              minHeight: 0, // Critical for flex scrolling
              maxHeight: '100%', // Ensure it doesn't exceed container
              WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
              overscrollBehavior: 'contain' // Prevent scroll chaining
            }}
          >
            {selectedCourse && currentChatKey && chatMessages[currentChatKey] && Array.isArray(chatMessages[currentChatKey]) && chatMessages[currentChatKey].length > 0 && (() => {
              // Additional check: verify the selected chat/course doesn't belong to a completed student/course
              if (userType === 'teacher') {
                const [courseId, studentId] = currentChatKey.split('_')
                const courseIdStr = String(courseId)
                try {
                  // Use string key to match grouping format
                  const enrolledStudents = courseStudentsMap.get(courseIdStr) || courseStudentsMap.get(parseInt(courseIdStr)) || []
                  const student = enrolledStudents.find(s => String(s.studentId) === String(studentId))
                  if (student && (student.isCompleted || (student.progress && parseFloat(student.progress) >= 100))) {
                    return false
                  }
                } catch (error) {
                  console.error('Error checking student completion:', error)
                }
              } else if (userType === 'student') {
                // Check if the selected course is completed
                try {
                  // Use state for enrolled courses
                  const enrollment = enrolledCourses.find(e => String(e.courseId) === String(currentChatKey))
                  if (enrollment) {
                    const progressValue = typeof enrollment.progress === 'number' 
                      ? enrollment.progress 
                      : parseFloat(enrollment.progress || '0')
                    if (!isNaN(progressValue) && progressValue >= 100) {
                      return false
                    }
                  }
                } catch (error) {
                  console.error('Error checking course completion:', error)
                }
              }
              return true
            })() ? (
              <>
                {(() => {
                  const messages = chatMessages[currentChatKey] || []
                  // Find first new message index
                  let firstNewMessageIndex = -1
                  if (newMessagesBannerVisible && newMessagesSinceOpen.size > 0) {
                    firstNewMessageIndex = messages.findIndex(msg => 
                      msg && msg.id && newMessagesSinceOpen.has(msg.id)
                    )
                  }
                  
                  return messages.map((msg, index) => {
                    if (!msg || !msg.id) return null
                    const isFromOther = userType === 'student' 
                      ? (msg.direction === 'teacher_to_student' || !msg.direction)
                      : (msg.direction === 'student_to_teacher')
                    const isZoomLink = msg.messageType === 'zoom_link'
                    const isNewMessage = newMessagesSinceOpen.has(msg.id)
                    const showBanner = index === firstNewMessageIndex && newMessagesBannerVisible

                    return (
                      <React.Fragment key={msg.id}>
                        {showBanner && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              marginBottom: '0.5rem',
                              marginTop: '0.5rem',
                              position: 'sticky',
                              top: '10px',
                              zIndex: 10
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: '#c85716',
                                color: '#ffffff',
                                padding: '6px 12px',
                                borderRadius: '16px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                cursor: 'pointer',
                                transition: 'opacity 0.3s'
                              }}
                              onClick={() => {
                                setNewMessagesBannerVisible(false)
                                // Scroll to first new message
                                requestAnimationFrame(() => {
                                  const element = document.querySelector(`[data-message-id="${msg.id}"]`)
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                  }
                                })
                              }}
                            >
                              {newMessagesSinceOpen.size} new message{newMessagesSinceOpen.size > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                        <div
                          key={msg.id}
                          data-message-id={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isFromOther ? 'flex-start' : 'flex-end',
                            marginBottom: '0.5rem',
                            opacity: isNewMessage && newMessagesBannerVisible ? 0.7 : 1,
                            transition: 'opacity 0.3s'
                          }}
                        >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          backgroundColor: isFromOther
                            ? (isZoomLink ? '#fff3cd' : '#ffffff')
                            : '#c85716',
                          color: isFromOther ? '#110a06' : '#ffffff',
                          border: isFromOther ? '1px solid #e9ecef' : 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {isFromOther ? renderMessageWithLinks(msg.message || '') : (msg.message || '')}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: isFromOther ? '#6c757d' : 'rgba(255,255,255,0.7)',
                            marginTop: '0.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>
                            {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {/* "New" tag removed - messages are auto-marked as read when chat opens */}
                        </div>
                      </div>
                    </div>
                      </React.Fragment>
                    )
                  })
                })()}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                <i className="bi bi-chat" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: '#dee2e6' }}></i>
                <p style={{ fontSize: '0.9rem' }}>
                  {selectedCourse ? 'No messages yet. Start the conversation!' : (userType === 'student' ? 'Select a course to view messages' : 'Select a student to view messages')}
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: '1rem', borderTop: '1px solid #e9ecef', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                rows="2"
                placeholder={isMessagingAllowed ? 'Type your message... (min 5 chars)' : (userType === 'student' ? 'Select an active course to send messages' : 'Select a student to send messages')}
                disabled={!isMessagingAllowed}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  resize: 'none',
                  fontFamily: 'inherit',
                  backgroundColor: isMessagingAllowed ? '#ffffff' : '#f1f3f5',
                  cursor: isMessagingAllowed ? 'text' : 'not-allowed',
                  color: isMessagingAllowed ? '#110a06' : '#6c757d'
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: newMessage.trim().length >= 5 && isMessagingAllowed ? '#c85716' : '#f1f3f5',
                  color: newMessage.trim().length >= 5 && isMessagingAllowed ? '#ffffff' : '#adb5bd',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: isMessagingAllowed ? 'pointer' : 'not-allowed',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isMessagingAllowed ? 1 : 0.6
                }}
                disabled={!isMessagingAllowed}
              >
                <i className="bi bi-send" style={{ fontSize: '1.1rem' }}></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Memoize ChatWidget to prevent unnecessary re-renders
export default memo(ChatWidget)

