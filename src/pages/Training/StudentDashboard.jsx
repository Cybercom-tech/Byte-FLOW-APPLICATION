import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { coursesData } from './coursesData'
import { getEnrolledCourses } from '../../utils/courseEnrollment'
import { getStudentMessages, markMessageAsRead, dismissMessage, getStudentOutgoingMessages } from '../../utils/studentTeacherManagement'
import { getCurrentUser, isAuthenticated, isStudent } from '../../utils/auth'
import { getAllCourses, getCourseInstructor, getInstructorAssignments } from '../../utils/courseManagement'
import { getTeacherProfile } from '../../utils/teacherProfile'
import api from '../../utils/api'
import ChatWidget from '../../components/ChatWidget'

function StudentDashboard() {
  const navigate = useNavigate()

  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [previousProgressMap, setPreviousProgressMap] = useState(new Map()) // Track previous progress values

  // State for teacher courses
  const [teacherCourses, setTeacherCourses] = useState([])

  // State for course completion modal
  const [completedCourse, setCompletedCourse] = useState(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  // PERFORMANCE OPTIMIZED: Load both enrolled and teacher courses in parallel on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Run both API calls in parallel for faster loading
        const [enrolledData, coursesData] = await Promise.allSettled([
          getEnrolledCourses(),
          getAllCourses()
        ])
        
        // Only update state if we got successful results
        // This preserves existing data on timeout/network errors
        if (enrolledData.status === 'fulfilled') {
          const data = enrolledData.value
          const coursesArray = Array.isArray(data) ? data : []
          setEnrolledCourses(coursesArray)
          
          // Initialize previous progress map and check for completed courses
          const progressMap = new Map()
          coursesArray.forEach(enrollment => {
            const courseIdStr = String(enrollment.courseId)
            const progress = enrollment.progress || 0
            progressMap.set(courseIdStr, progress)
            
            // Note: We'll check for completion in handleProgressUpdate after courses are loaded
          })
          setPreviousProgressMap(progressMap)
        } else {
          // On error, preserve existing data (don't reset to empty)
          console.warn('Error loading enrollments, preserving existing data:', enrolledData.reason?.message || enrolledData.reason)
        }
        
        if (coursesData.status === 'fulfilled') {
          const data = coursesData.value
          const coursesArray = Array.isArray(data) ? data : []
          setTeacherCourses(coursesArray)
          
          // After courses are loaded, check for recently completed courses
          if (enrolledData.status === 'fulfilled') {
            const enrollments = Array.isArray(enrolledData.value) ? enrolledData.value : []
            enrollments.forEach(enrollment => {
              const courseIdStr = String(enrollment.courseId)
              const progress = enrollment.progress || 0
              const isCompleted = enrollment.isCompleted || progress >= 100
              
              // Check if course is completed and was accessed recently (within last 10 minutes)
              if (isCompleted && enrollment.lastAccessed) {
                const lastAccessed = new Date(enrollment.lastAccessed)
                const now = new Date()
                const timeDiff = now - lastAccessed
                const completedRecently = timeDiff < 10 * 60 * 1000 // 10 minutes
                
                if (completedRecently) {
                  const course = coursesArray.find(c => 
                    String(c.id) === courseIdStr || 
                    Number(c.id) === Number(enrollment.courseId)
                  )
                  
                  if (course) {
                    console.log('Showing completion modal for recently completed course:', course.title)
                    setCompletedCourse({
                      courseId: enrollment.courseId,
                      courseTitle: course.title,
                      enrollment
                    })
                    setShowCompletionModal(true)
                  }
                }
              }
            })
          }
        } else {
          // On error, preserve existing data (don't reset to empty)
          console.warn('Error loading courses, preserving existing data:', coursesData.reason?.message || coursesData.reason)
        }
      } catch (error) {
        // This should rarely happen with Promise.allSettled, but handle it gracefully
        console.error('Error loading dashboard data:', error)
        // Don't reset to empty arrays - preserve existing data
      }
    }
    loadInitialData()
  }, [])

  // Listen for custom event from checkout page and refresh when needed
  useEffect(() => {
    const handleEnrollmentUpdate = async () => {
      try {
        const courses = await getEnrolledCourses()
        setEnrolledCourses(Array.isArray(courses) ? courses : [])
      } catch (error) {
        console.error('Error updating enrollments:', error)
      }
    }

    // Handle enrollment verification (automatic verification or admin confirmation)
    const handleEnrollmentVerified = async (event) => {
      const { courseId, studentId } = event.detail || {}
      const currentUser = getCurrentUser()
      
      console.log('Enrollment verified event received:', { courseId, studentId, currentUserId: currentUser?.id })
      
      // Always refresh if it's for the current student, or if studentId is not provided (refresh all)
      if (!studentId || String(studentId) === String(currentUser?.id)) {
        console.log(`Course ${courseId} verified! Refreshing enrollments immediately...`)
        // Force immediate refresh - use setTimeout to ensure state update happens
        setTimeout(async () => {
          try {
            const refreshed = await getEnrolledCourses()
            const coursesArray = Array.isArray(refreshed) ? refreshed : []
            console.log('Refreshed enrollments:', coursesArray.map(e => ({ 
              courseId: e.courseId, 
              status: e.status,
              studentId: e.studentId
            })))
            setEnrolledCourses([...coursesArray]) // Create new array to force re-render
          } catch (error) {
            console.error('Error refreshing enrollments:', error)
          }
        }, 50)
      }
    }

    // Handle storage events (for cross-tab updates)
    const handleStorageChange = async (event) => {
      // Check if the storage key is for enrollments
      if (event.key === 'student_enrollments' || event.key === null) {
        console.log('Storage changed, refreshing enrollments...')
        try {
          const refreshed = await getEnrolledCourses()
          const coursesArray = Array.isArray(refreshed) ? refreshed : []
          console.log('Refreshed enrollments from storage:', coursesArray.map(e => ({ 
            courseId: e.courseId, 
            status: e.status 
          })))
          setEnrolledCourses(coursesArray)
        } catch (error) {
          console.error('Error refreshing from storage:', error)
        }
      }
    }

    // Handle enrollment progress updates
    const handleProgressUpdate = async () => {
      try {
        const courses = await getEnrolledCourses()
        const coursesArray = Array.isArray(courses) ? courses : []
        
        // Check for newly completed courses
        coursesArray.forEach(enrollment => {
          const courseIdStr = String(enrollment.courseId)
          const previousProgress = previousProgressMap.get(courseIdStr) || 0
          const currentProgress = enrollment.progress || 0
          const isCompleted = enrollment.isCompleted || currentProgress >= 100
          
          // If course just completed (was < 100%, now >= 100%)
          if (previousProgress < 100 && isCompleted) {
            const allCourses = [...coursesData, ...teacherCourses]
            const course = allCourses.find(c => 
              String(c.id) === courseIdStr || 
              Number(c.id) === Number(enrollment.courseId)
            )
            
            if (course && !showCompletionModal) {
              console.log('Course completed detected:', course.title, { previousProgress, currentProgress, isCompleted })
              setCompletedCourse({
                courseId: enrollment.courseId,
                courseTitle: course.title,
                enrollment
              })
              setShowCompletionModal(true)
            }
          }
        })
        
        // Update previous progress map
        const newProgressMap = new Map()
        coursesArray.forEach(enrollment => {
          const courseIdStr = String(enrollment.courseId)
          newProgressMap.set(courseIdStr, enrollment.progress || 0)
        })
        setPreviousProgressMap(newProgressMap)
        
        setEnrolledCourses(coursesArray)
      } catch (error) {
        console.error('Error refreshing enrollments after progress update:', error)
      }
    }

    // Handle course completion
    const handleCourseCompleted = async (event) => {
      const { courseId, enrollment } = event.detail || {}
      console.log('Course completed event received:', { courseId, enrollment })
      
      if (!courseId || !enrollment) {
        console.warn('Course completed event missing data:', event.detail)
        return
      }

      try {
        // Get course details
        const allCourses = [...coursesData, ...teacherCourses]
        const course = allCourses.find(c => 
          String(c.id) === String(courseId) || 
          Number(c.id) === Number(courseId)
        )

        if (course) {
          console.log('Showing completion modal for course:', course.title)
          setCompletedCourse({
            courseId,
            courseTitle: course.title,
            enrollment
          })
          setShowCompletionModal(true)
        } else {
          console.warn('Course not found for completion:', courseId)
        }
      } catch (error) {
        console.error('Error handling course completion:', error)
      }
    }

    // Listen for custom events
    window.addEventListener('courseEnrolled', handleEnrollmentUpdate)
    window.addEventListener('enrollmentVerified', handleEnrollmentVerified)
    window.addEventListener('enrollmentProgressUpdated', handleProgressUpdate)
    window.addEventListener('courseCompleted', handleCourseCompleted)
    
    // Listen for storage events (works across tabs/windows)
    window.addEventListener('storage', handleStorageChange)
    
    // Also refresh when window gains focus (user returns to tab)
    const handleFocus = async () => {
      try {
        const courses = await getEnrolledCourses()
        // Only update if we got valid data (preserves existing data on error)
        if (Array.isArray(courses) && courses !== null) {
          // Don't replace with empty if we had data before
          setEnrolledCourses(prev => {
            if (prev.length > 0 && courses.length === 0) return prev
            return courses
          })
        }
      } catch (error) {
        console.warn('Error refreshing on focus, preserving existing data:', error.message || error)
      }
    }
    window.addEventListener('focus', handleFocus)

    // Refresh when component becomes visible (handles navigation from checkout)
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          const courses = await getEnrolledCourses()
          // Only update if we got valid data (preserves existing data on error)
          if (Array.isArray(courses) && courses !== null) {
            // Don't replace with empty if we had data before
            setEnrolledCourses(prev => {
              if (prev.length > 0 && courses.length === 0) return prev
              return courses
            })
          }
        } catch (error) {
          console.warn('Error refreshing on visibility change, preserving existing data:', error.message || error)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Poll for enrollment updates (check every 5 seconds if on dashboard)
    // This ensures the dashboard updates when admin confirms payment
    // Reduced frequency to prevent unnecessary re-renders and flickering
    const pollInterval = setInterval(async () => {
      try {
        const refreshed = await getEnrolledCourses()
        // Only update if we got valid data (null indicates error, preserve existing)
        if (refreshed === null || !Array.isArray(refreshed)) {
          return // Preserve existing data on error
        }
        const refreshedArray = refreshed
        // Only update if the data actually changed (compare by course IDs and statuses)
        setEnrolledCourses(prev => {
          // If we had data before and got empty now, only update if it's likely intentional
          // (e.g., all enrollments were cancelled). Otherwise preserve existing.
          if (prev.length > 0 && refreshedArray.length === 0) {
            // Keep existing data - empty result is likely a transient error
            return prev
          }
          // Compare by courseId, status, and progress to detect all changes
          const prevKey = prev.map(e => `${e.courseId}-${e.status}-${e.progress || 0}`).sort().join(',')
          const newKey = refreshedArray.map(e => `${e.courseId}-${e.status}-${e.progress || 0}`).sort().join(',')
          if (prevKey !== newKey) {
            return refreshedArray
          }
          return prev // Return previous array to maintain reference stability
        })
      } catch (error) {
        console.warn('Error polling enrollments, preserving existing data:', error.message || error)
        // Don't update state on error - preserve existing data
      }
    }, 5000) // Changed from 1000ms to 5000ms

    return () => {
      window.removeEventListener('courseEnrolled', handleEnrollmentUpdate)
      window.removeEventListener('enrollmentVerified', handleEnrollmentVerified)
      window.removeEventListener('enrollmentProgressUpdated', handleProgressUpdate)
      window.removeEventListener('courseCompleted', handleCourseCompleted)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(pollInterval)
    }
  }, [])
  
  // Get course details for enrolled courses (active and pending)
  const enrolledCoursesWithDetails = useMemo(() => {
    try {
      // Ensure enrolledCourses is an array
      if (!Array.isArray(enrolledCourses)) {
        console.warn('enrolledCourses is not an array:', enrolledCourses)
        return []
      }
      
      // Use state for teacherCourses (already fetched in useEffect)
      const allCourses = [...coursesData, ...teacherCourses]
    
      return enrolledCourses.map(enrolled => {
      // Handle both string and number courseId types
      const course = allCourses.find(c => 
        String(c.id) === String(enrolled.courseId) || 
        Number(c.id) === Number(enrolled.courseId)
      )
      if (!course) return null
      
      // Use course teacher directly (instructor names are loaded separately if needed)
      // Don't call async getCourseInstructor here - it would return a Promise
      const instructor = course.teacher || course.instructor || 'Instructor'
      
      // Preserve enrollment status (pending/active/completed) separately from course status (pending/approved/rejected)
      const enrollmentStatus = enrolled.status // This is the enrollment status: 'pending', 'active', 'completed'
      const courseApprovalStatus = course.status // This is the course approval status: 'pending', 'approved', 'rejected'
      
      return {
        ...course, // Course details first
        ...enrolled, // Enrollment data second (overwrites course properties where needed)
        id: course.id, // IMPORTANT: Preserve course ID (don't let enrollment id overwrite it)
        enrollmentId: enrolled.id, // Store enrollment ID separately if needed
        status: enrollmentStatus, // IMPORTANT: Preserve enrollment status, not course status
        courseApprovalStatus: courseApprovalStatus, // Store course approval status separately
        teacher: instructor
      }
      }).filter(course => course !== null) // Remove any null entries
    } catch (error) {
      console.error('Error processing enrolled courses:', error)
      return []
    }
  }, [enrolledCourses, teacherCourses])

  // Separate active, completed, and pending enrollments
  const activeEnrollments = useMemo(() => {
    try {
      return (enrolledCoursesWithDetails || []).filter(course => 
        course && 
        (course.status === 'active' || !course.status) && 
        (course.progress || 0) < 100 // Not completed yet
      )
    } catch (error) {
      console.error('Error filtering active enrollments:', error)
      return []
    }
  }, [enrolledCoursesWithDetails])

  const completedEnrollments = useMemo(() => {
    try {
      return (enrolledCoursesWithDetails || []).filter(course => 
        course && 
        (course.status === 'active' || !course.status || course.status === 'completed') && 
        (course.progress || 0) >= 100 // Completed courses
      )
    } catch (error) {
      console.error('Error filtering completed enrollments:', error)
      return []
    }
  }, [enrolledCoursesWithDetails])

  const pendingEnrollments = useMemo(() => {
    try {
      return (enrolledCoursesWithDetails || []).filter(course => course && course.status === 'pending')
    } catch (error) {
      console.error('Error filtering pending enrollments:', error)
      return []
    }
  }, [enrolledCoursesWithDetails])

  // Create a stable key from activeEnrollments to prevent unnecessary recalculations
  // This only changes when course IDs actually change, not when array reference changes
  const activeEnrollmentsKey = useMemo(() => {
    return activeEnrollments
      .map(c => c ? String(c.id || c.courseId) : '')
      .filter(Boolean)
      .sort()
      .join(',')
  }, [activeEnrollments])

  // Calculate statistics (include all enrollments: active + completed)
  const allEnrollments = [...(activeEnrollments || []), ...(completedEnrollments || [])]
  const totalCourses = allEnrollments.length
  const totalProgress = allEnrollments.reduce((sum, course) => sum + (course?.progress || 0), 0)
  const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0
  const completedCourses = (completedEnrollments || []).length

  // Get student messages and Zoom links
  const [messages, setMessages] = useState([])
  const [outgoingMessages, setOutgoingMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [upcomingClassPage, setUpcomingClassPage] = useState(0)
  

  // Filter out expired messages (where date/time has passed)
  const filterExpiredMessages = (msgs) => {
    // Ensure msgs is an array
    if (!Array.isArray(msgs)) {
      console.warn('filterExpiredMessages: msgs is not an array', msgs)
      return []
    }
    const now = new Date()
    return msgs.filter(msg => {
      if (msg.messageType === 'zoom_link' && msg.date && msg.time) {
        try {
          // Parse date and time
          const [year, month, day] = msg.date.split('-').map(Number)
          const [hours, minutes] = msg.time.split(':').map(Number)
          const msgDateTime = new Date(year, month - 1, day, hours, minutes)
          
          // If message date/time has passed, exclude it
          if (msgDateTime < now) {
            return false
          }
        } catch (e) {
          // If parsing fails, keep the message
          return true
        }
      }
      return true
    })
  }

  const loadMessages = async () => {
    try {
      const currentUser = getCurrentUser()
      if (currentUser) {
        const studentId = currentUser.id || '1'
        let studentMessages = await getStudentMessages(studentId)
        
        // Ensure it's an array
        if (!Array.isArray(studentMessages)) {
          studentMessages = []
        }
        
        // Filter out expired messages (but keep zoom links for upcoming classes)
        studentMessages = filterExpiredMessages(studentMessages)
        
        // Load outgoing messages
        const outgoing = await getStudentOutgoingMessages(studentId)
        const outgoingArray = Array.isArray(outgoing) ? outgoing : []
        
        setMessages(studentMessages)
        setOutgoingMessages(outgoingArray)
        setUnreadCount(studentMessages.filter(m => !m.read).length)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
      setOutgoingMessages([])
      setUnreadCount(0)
    }
  }


  // State for student messages (needed for upcomingClasses)
  const [studentMessagesForClasses, setStudentMessagesForClasses] = useState([])

  // Use a ref to store a stable time that only updates every minute
  // This prevents flickering when checking if classes are expired
  const getInitialStableTime = () => {
    const now = new Date()
    now.setSeconds(0, 0)
    return now
  }
  const stableTimeRef = useRef(getInitialStableTime())
  
  // State to track stable time for useMemo dependency
  const [stableTime, setStableTime] = useState(getInitialStableTime())

  // Update stable time every minute
  useEffect(() => {
    const updateStableTime = () => {
      const now = new Date()
      now.setSeconds(0, 0)
      stableTimeRef.current = now
      setStableTime(new Date(now)) // Update state to trigger useMemo recalculation
    }
    
    // Update immediately
    updateStableTime()
    
    // Update every minute
    const interval = setInterval(updateStableTime, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // Create a stable key from studentMessagesForClasses to prevent unnecessary recalculations
  // This only changes when message IDs actually change, not when array reference changes
  const messagesKey = useMemo(() => {
    if (!Array.isArray(studentMessagesForClasses)) return ''
    return studentMessagesForClasses
      .map(m => m ? String(m.id) : '')
      .filter(Boolean)
      .sort()
      .join(',')
  }, [studentMessagesForClasses])

  // Load messages for upcoming classes
  useEffect(() => {
    const loadMessagesForClasses = async () => {
      try {
        const currentUser = getCurrentUser()
        if (currentUser) {
          const studentId = currentUser.id || '1'
          let messages = await getStudentMessages(studentId)
          if (!Array.isArray(messages)) {
            messages = []
          }
          // Don't filter expired messages here - let upcomingClasses useMemo handle it
          // This prevents flickering as messages are filtered/unfiltered
          // Only update state if messages actually changed (by comparing IDs)
          setStudentMessagesForClasses(prev => {
            // If we have previous messages and new messages are empty, don't update
            // This prevents messages from disappearing due to temporary API issues
            if (prev.length > 0 && messages.length === 0) {
              console.warn('Received empty messages array, keeping previous messages to prevent disappearing')
              return prev
            }
            
            const prevIds = prev.map(m => String(m?.id || '')).sort().join(',')
            const newIds = messages.map(m => String(m?.id || '')).sort().join(',')
            if (prevIds !== newIds) {
              return messages
            }
            return prev // Keep previous array to maintain reference stability
          })
        }
      } catch (error) {
        console.error('Error loading messages for classes:', error)
        // Don't reset to empty array on error - keep existing messages
        // This prevents messages from disappearing when there's a temporary error
      }
    }
    loadMessagesForClasses()
    
    // Also listen for messages updated event
    const handleMessagesUpdated = async () => {
      await loadMessagesForClasses()
    }
    window.addEventListener('messagesUpdated', handleMessagesUpdated)
    
    // Refresh messages periodically but less frequently (every 5 seconds instead of 2)
    const interval = setInterval(loadMessagesForClasses, 5000)
    
    return () => {
      window.removeEventListener('messagesUpdated', handleMessagesUpdated)
      clearInterval(interval)
    }
  }, []) // Only load once on mount, not when activeEnrollments change

  // Generate upcoming classes from enrolled courses with schedules and Zoom link messages
  const upcomingClasses = useMemo(() => {
    try {
      const classes = []
      const currentUser = getCurrentUser()
      const studentId = currentUser?.id || '1'
      // Use current time for expiration checks to ensure accuracy
      // The stableTime dependency ensures useMemo only recalculates every minute
      const now = new Date()
      
      // Use state for student messages (already loaded asynchronously)
      let studentMessages = studentMessagesForClasses
      
      // Ensure it's an array
      if (!Array.isArray(studentMessages)) {
        studentMessages = []
      }
      
      // Add classes from course schedules
      activeEnrollments.forEach((course, index) => {
        if (course && course.schedule) {
          classes.push({
            id: `class-${course.id}-${index}`,
            courseId: course.id,
            courseTitle: course.title,
            sessionTitle: `${course.title} - Live Session`,
            schedule: course.schedule,
            teacher: course.teacher || 'Instructor',
            type: 'live',
            source: 'schedule'
          })
        }
      })
      
      // Add classes from Zoom link messages (with date/time)
      studentMessages.forEach((msg) => {
        if (msg.messageType === 'zoom_link') {
          // Handle courseId matching - can be string, number, or ObjectId
          const course = activeEnrollments.find(c => 
            c && (
              String(c.id) === String(msg.courseId) || 
              String(c.courseId) === String(msg.courseId)
            )
          )
          if (course) {
            // Check if message date/time has passed
            // Only filter if both date and time are present
            let isExpired = false
            if (msg.date && msg.time) {
              try {
                // Handle date format - could be YYYY-MM-DD or ISO string
                let dateObj
                if (msg.date.includes('T')) {
                  // ISO format
                  dateObj = new Date(msg.date)
                } else {
                  // YYYY-MM-DD format
                  const [year, month, day] = msg.date.split('-').map(Number)
                  dateObj = new Date(year, month - 1, day)
                }
                
                // Parse time
                const [hours, minutes] = msg.time.split(':').map(Number)
                const msgDateTime = new Date(dateObj)
                msgDateTime.setHours(hours, minutes, 0, 0)
                
                // Add a buffer of 2 hours - don't hide classes until 2 hours after they've passed
                // This prevents flickering and ensures classes stay visible during and after the session
                const twoHoursLater = new Date(msgDateTime.getTime() + 2 * 60 * 60 * 1000)
                isExpired = twoHoursLater < now
              } catch (e) {
                // If parsing fails, don't exclude - keep the class visible
                console.warn('Error parsing date/time for message:', e)
              }
            }
            
            if (isExpired) {
              return // Skip expired classes
            }
            
            // Format date and time
            let dateTimeStr = ''
            if (msg.date) {
              try {
                // Handle date string (could be YYYY-MM-DD format or ISO string)
                const date = new Date(msg.date)
                if (!isNaN(date.getTime())) {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  dateTimeStr = `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
                } else {
                  // If date parsing fails, use the raw string
                  dateTimeStr = msg.date
                }
              } catch (e) {
                dateTimeStr = msg.date
              }
            }
            if (msg.time) {
              try {
                const [hours, minutes] = msg.time.split(':')
                const hour = parseInt(hours)
                if (!isNaN(hour)) {
                  const ampm = hour >= 12 ? 'pm' : 'am'
                  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                  const timeStr = `${displayHour}:${minutes} ${ampm}`
                  dateTimeStr = dateTimeStr ? `${dateTimeStr} at ${timeStr}` : timeStr
                } else {
                  dateTimeStr = dateTimeStr ? `${dateTimeStr} at ${msg.time}` : msg.time
                }
              } catch (e) {
                dateTimeStr = dateTimeStr ? `${dateTimeStr} at ${msg.time}` : msg.time
              }
            }
          
            // Extract Zoom link from message (with or without protocol)
            // Try multiple patterns to catch different URL formats
            let zoomLink = null
            const patterns = [
              /(https?:\/\/[^\s\n]+)/,  // URLs with protocol
              /(zoom\.us\/[^\s\n]+)/i,   // Zoom-specific URLs
              /([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s\n]*)/  // Domain-like patterns
            ]
            
            for (const pattern of patterns) {
              const match = msg.message.match(pattern)
              if (match && match[0]) {
                zoomLink = match[0].trim()
                break
              }
            }
            
            // Only add to upcoming classes if we have a zoom link
            if (zoomLink) {
              classes.push({
                id: `zoom-${msg.id}`,
                courseId: msg.courseId,
                courseTitle: course.title,
                sessionTitle: `${course.title} - Zoom Meeting`,
                schedule: dateTimeStr || 'Scheduled',
                teacher: msg.teacherName || course.teacher || 'Instructor',
                type: 'live',
                source: 'zoom_link',
                messageId: msg.id,
                zoomLink: zoomLink,
                dateTime: msg.date && msg.time ? (() => {
                  try {
                    // Handle date format - could be YYYY-MM-DD or ISO string
                    let dateObj
                    if (msg.date.includes('T')) {
                      dateObj = new Date(msg.date)
                    } else {
                      const [year, month, day] = msg.date.split('-').map(Number)
                      dateObj = new Date(year, month - 1, day)
                    }
                    
                    // Parse time and set hours/minutes
                    const [hours, minutes] = msg.time.split(':').map(Number)
                    dateObj.setHours(hours, minutes, 0, 0)
                    return dateObj
                  } catch (e) {
                    console.warn('Error parsing date/time:', e)
                    return null
                  }
                })() : null
              })
            }
          }
        }
      })
      
      // Sort by date if available, otherwise keep original order
      const sortedClasses = classes.sort((a, b) => {
        // Prioritize Zoom link messages with dates
        if (a.source === 'zoom_link' && b.source === 'schedule') return -1
        if (a.source === 'schedule' && b.source === 'zoom_link') return 1
        // Sort by date if available
        if (a.dateTime && b.dateTime) {
          return a.dateTime - b.dateTime
        }
        if (a.dateTime) return -1
        if (b.dateTime) return 1
        return 0
      })
      
      return sortedClasses
    } catch (error) {
      console.error('Error generating upcoming classes:', error)
      return []
    }
  }, [activeEnrollmentsKey, messagesKey, activeEnrollments, studentMessagesForClasses, stableTime])
  
  // Paginated upcoming classes (3 per page)
  const classesPerPage = 3
  const paginatedClasses = upcomingClasses.slice(upcomingClassPage * classesPerPage, (upcomingClassPage + 1) * classesPerPage)
  const totalClassPages = Math.ceil(upcomingClasses.length / classesPerPage)

  useEffect(() => {
    const loadMessagesAsync = async () => {
      await loadMessages()
    }
    
    loadMessagesAsync()
    
    // Refresh messages when window gains focus
    const handleFocus = async () => {
      await loadMessages()
    }
    window.addEventListener('focus', handleFocus)
    
    // Listen for messages updated event (when teacher sends new message)
    const handleMessagesUpdated = async () => {
      // Clear cache and reload messages
      await loadMessages()
    }
    window.addEventListener('messagesUpdated', handleMessagesUpdated)
    
    // Refresh messages periodically
    const interval = setInterval(loadMessagesAsync, 2000) // Every 2 seconds
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('messagesUpdated', handleMessagesUpdated)
      clearInterval(interval)
    }
  }, [enrolledCourses]) // Refresh when enrollments change
  
  // Reset upcoming class page when classes change
  useEffect(() => {
    setUpcomingClassPage(0)
  }, [upcomingClasses.length])


  // Get all assigned teachers from enrolled courses (async - loaded in useEffect)
  const [assignedTeachers, setAssignedTeachers] = useState([])
  // Map course IDs to instructor names for use in course cards
  const [courseInstructorMap, setCourseInstructorMap] = useState(new Map())
  
  useEffect(() => {
    const loadAssignedTeachers = async () => {
      if (activeEnrollments.length === 0) {
        setAssignedTeachers([])
        setCourseInstructorMap(new Map())
        return
      }
      
      const teachersMap = new Map()
      const instructorNameMap = new Map() // Map courseId -> instructor name
      const assignments = getInstructorAssignments()
      
      // Process all courses and fetch instructor information
      for (const course of activeEnrollments) {
        let teacherId = null
        let teacherName = null // Start with null, don't use placeholder from coursesData
        let teacherTitle = null // Start with null to detect if we get actual title from API
        const courseId = course.id || course.courseId
        
        // Try to get instructor name from API (works for both database and default courses)
        try {
          const courseIdToCheck = String(courseId)
          // Call API directly to get full instructor info (name and title)
          const response = await api.get(`/course/${courseIdToCheck}/instructor`, { includeAuth: false })
          if (response && response.instructor) {
            // Get actual teacher name from API response
            const apiName = response.instructor.name || response.instructor.fullName
            if (apiName && apiName !== 'Course Instructor' && apiName !== 'Instructor') {
              teacherName = apiName
            }
            // Get actual title from API response - validate it's not an error
            const apiTitle = response.instructor.title || response.instructor.profTitle
            if (apiTitle && 
                typeof apiTitle === 'string' && 
                !apiTitle.includes('Error') && 
                !apiTitle.includes('error') &&
                !apiTitle.includes('API') &&
                apiTitle.length < 100) {
              teacherTitle = apiTitle
            }
            teacherId = response.instructor.id || teacherId
            // Store instructor name for this course
            if (teacherName) {
              instructorNameMap.set(String(courseId), teacherName)
            }
          }
        } catch (error) {
          // Silently handle API errors - fallback to getCourseInstructor utility
          try {
            const instructorName = await getCourseInstructor(courseId)
            if (instructorName && instructorName !== 'Course Instructor' && instructorName !== 'Instructor') {
              teacherName = instructorName
              instructorNameMap.set(String(courseId), instructorName)
            }
          } catch (fallbackError) {
            // Silently handle fallback error
          }
        }
        
        // Check if it's a teacher-created course from database
        const teacherCourse = teacherCourses.find(c => String(c.id) === String(courseId))
        if (teacherCourse) {
          // For database courses, use the teacherName/instructor from course data
          if (!teacherName && teacherCourse.teacherName && teacherCourse.teacherName !== 'Course Instructor') {
            teacherName = teacherCourse.teacherName
          }
          if (!teacherName && teacherCourse.instructor && teacherCourse.instructor !== 'Course Instructor') {
            teacherName = teacherCourse.instructor
          }
          if (teacherCourse.teacherId) {
            teacherId = teacherCourse.teacherId
          }
        }
        
        // Check instructor assignments to get teacherId
        const assignment = assignments[course.id]
        if (assignment && assignment.teacherId) {
          teacherId = assignment.teacherId
        } else if (teacherCourse && teacherCourse.createdBy) {
          teacherId = teacherCourse.createdBy
        }
        
        // Final fallback - only use generic name if we couldn't get actual name
        if (!teacherName) {
          teacherName = 'Instructor'
        }
        if (!teacherTitle) {
          teacherTitle = 'Course Instructor'
        }
        
        // Use teacherId as key, or fallback to teacher name
        const key = teacherId || teacherName
        
        if (!teachersMap.has(key)) {
          teachersMap.set(key, {
            teacherId: teacherId,
            name: teacherName, // Use the fetched instructor name
            title: teacherTitle,
            bio: `Teaching course${activeEnrollments.length > 1 ? 's' : ''}`,
            courses: [course.title],
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&size=200&background=c85716&color=fff`
          })
        } else {
          // Add course to existing teacher
          const existing = teachersMap.get(key)
          if (!existing.courses.includes(course.title)) {
            existing.courses.push(course.title)
          }
        }
      }
      
      setAssignedTeachers(Array.from(teachersMap.values()))
      setCourseInstructorMap(instructorNameMap)
    }
    
    loadAssignedTeachers()
  }, [activeEnrollments, teacherCourses])

  // State for current instructor index
  const [currentInstructorIndex, setCurrentInstructorIndex] = useState(0)
  
  // Reset to first instructor when teachers list changes
  useEffect(() => {
    if (assignedTeachers.length > 0 && currentInstructorIndex >= assignedTeachers.length) {
      setCurrentInstructorIndex(0)
    }
  }, [assignedTeachers.length, currentInstructorIndex])
  
  const currentInstructor = assignedTeachers[currentInstructorIndex] || null


  const handleMarkAsRead = (messageId) => {
    markMessageAsRead(messageId)
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleDismissMessage = (messageId, e) => {
    e.stopPropagation() // Prevent triggering mark as read
    dismissMessage(messageId)
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== messageId)
      return filtered
    })
    setUnreadCount(prev => {
      const dismissedMsg = messages.find(m => m.id === messageId)
      return dismissedMsg && !dismissedMsg.read ? Math.max(0, prev - 1) : prev
    })
  }

  // Check if a message type is dismissible (simple messages)
  const isDismissible = (messageType) => {
    // Allow dismissing info, announcement, and reminder messages
    // But not zoom_link messages as they are important
    return messageType === 'info' || messageType === 'announcement' || messageType === 'reminder'
  }

  // Get course name from courseId
  const getCourseName = (courseId) => {
    if (!courseId) return 'General'
    try {
      const allCourses = [...coursesData, ...teacherCourses]
      const course = allCourses.find(c => c && c.id === parseInt(courseId))
      return course && course.title ? course.title : 'Unknown Course'
    } catch (error) {
      console.error('Error getting course name:', error)
      return 'Unknown Course'
    }
  }


  // Normalize URL - add https:// if protocol is missing
  const normalizeUrl = (url) => {
    if (!url) return ''
    // Remove any whitespace
    url = url.trim()
    // If it already has http:// or https://, return as is
    if (url.match(/^https?:\/\//i)) {
      return url
    }
    // If it looks like a domain (contains a dot and no spaces), add https://
    if (url.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/)) {
      return `https://${url}`
    }
    // Otherwise return as is (might be a relative path or invalid)
    return url
  }

  // Convert URLs in text to clickable links
  const renderMessageWithLinks = (text) => {
    if (!text || typeof text !== 'string') return ''
    
    try {
      // Regular expression to match URLs (with or without protocol)
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
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0056b3'
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#0d6efd'
                e.currentTarget.style.textDecoration = 'underline'
              }}
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part || ''}</span>
      })
    } catch (error) {
      console.error('Error rendering message with links:', error)
      return text || ''
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
  }

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'pm' : 'am'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getSessionIcon = (type) => {
    switch(type) {
      case 'live':
        return 'bi-camera-video'
      case 'qa':
        return 'bi-question-circle'
      case 'workshop':
        return 'bi-lightbulb'
      default:
        return 'bi-calendar-event'
    }
  }

  const getSessionColor = (type) => {
    switch(type) {
      case 'live':
        return '#dc3545'
      case 'qa':
        return '#0d6efd'
      case 'workshop':
        return '#198754'
      default:
        return '#6c757d'
    }
  }

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated() || !isStudent()) {
      navigate('/training/auth')
    }
  }, [navigate])

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#110a06', marginBottom: '0.5rem' }}>
            My Dashboard
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
            View your upcoming live Zoom sessions and manage your enrolled courses.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#c85716', marginBottom: '0.5rem' }}>
                {totalCourses}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Enrolled Courses</div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#198754', marginBottom: '0.5rem' }}>
                {averageProgress}%
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Average Progress</div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0d6efd', marginBottom: '0.5rem' }}>
                {completedCourses}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Completed Courses</div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ffc107', marginBottom: '0.5rem' }}>
                {upcomingClasses.length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Upcoming Classes</div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Main Content - Enrolled Courses */}
          <div className="col-lg-8">
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#110a06', margin: 0 }}>
                  My Courses
                </h3>
                <Link
                  to="/training/catalog"
                  style={{
                    color: '#c85716',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Browse More Courses
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {/* Pending Enrollments */}
              {pendingEnrollments.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: '#110a06',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className="bi bi-clock-history" style={{ color: '#ffc107' }}></i>
                    Pending Enrollments ({pendingEnrollments.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {pendingEnrollments.map((course) => (
                      <div
                        key={course.id}
                        style={{
                          border: '1px solid #ffc107',
                          borderRadius: '8px',
                          padding: '1.5rem',
                          backgroundColor: '#fff3cd'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h5 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#110a06',
                            margin: 0
                          }}>
                            {course.title}
                          </h5>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: '#ffc107',
                            color: '#856404'
                          }}>
                            Pending Verification
                          </span>
                        </div>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#856404',
                          marginBottom: '0.5rem'
                        }}>
                          Payment Method: {course.paymentMethod}
                        </p>
                        {course.transactionId && (
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#856404',
                            marginBottom: '0.5rem'
                          }}>
                            Transaction ID: <strong>{course.transactionId}</strong>
                          </p>
                        )}
                        <p style={{
                          fontSize: '0.85rem',
                          color: '#856404',
                          margin: 0
                        }}>
                          <i className="bi bi-info-circle" style={{ marginRight: '0.25rem' }}></i>
                          Your enrollment is pending verification. Your course will be activated once payment is confirmed.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Enrollments Section */}
              {activeEnrollments.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: '#110a06',
                    marginBottom: '1rem'
                  }}>
                    Active Courses ({activeEnrollments.length})
                  </h4>
                </div>
              )}

              {activeEnrollments.length === 0 && pendingEnrollments.length === 0 && completedEnrollments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#6c757d'
                }}>
                  <i className="bi bi-book" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                  <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No enrolled courses yet</p>
                  <Link
                    to="/training/catalog"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#c85716',
                      color: '#ffffff',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    Explore Courses
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {activeEnrollments.map((course) => (
                    <Link
                      key={course.id}
                      to={`/training/course/${course.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      >
                        {/* Course Image */}
                        <div style={{
                          width: '200px',
                          height: '150px',
                          flexShrink: 0,
                          overflow: 'hidden'
                        }}>
                          <img
                            src={course.image}
                            alt={course.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>

                        {/* Course Info */}
                        <div style={{
                          flex: 1,
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <h4 style={{
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                color: '#110a06',
                                margin: 0,
                                marginBottom: '0.5rem'
                              }}>
                                {course.title}
                              </h4>
                              {course.badge && (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  backgroundColor: course.badge === 'Bestseller' ? '#0dcaf0' : '#fd7e14',
                                  color: '#ffffff',
                                  marginLeft: '1rem'
                                }}>
                                  {course.badge}
                                </span>
                              )}
                            </div>
                            <p style={{
                              fontSize: '0.9rem',
                              color: '#6c757d',
                              marginBottom: '0.75rem'
                            }}>
                              {courseInstructorMap.get(String(course.id || course.courseId)) || course.teacher || 'Instructor'} • {course.level}
                            </p>
                            <p style={{
                              fontSize: '0.85rem',
                              color: '#6c757d',
                              marginBottom: '1rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {course.description}
                            </p>
                          </div>

                          {/* Session Info */}
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.75rem'
                            }}>
                              <i className="bi bi-camera-video" style={{ color: '#c85716', fontSize: '1rem' }}></i>
                              <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#110a06' }}>
                                Live Zoom Sessions
                              </span>
                            </div>
                            
                            <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                              Check your messages and upcoming classes for Zoom meeting links. Sessions are delivered live at the scheduled time.
                            </p>
                            
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.85rem',
                              color: '#6c757d'
                            }}>
                              <span>
                                <i className="bi bi-calendar-check" style={{ marginRight: '0.25rem' }}></i>
                                Enrolled: {formatDate(course.enrolledDate)}
                              </span>
                              <span>
                                <i className="bi bi-broadcast-pin" style={{ marginRight: '0.25rem' }}></i>
                                Live attendance required
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Completed Courses Section */}
                  {completedEnrollments.length > 0 && (
                    <>
                      <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                        <h4 style={{
                          fontSize: '1.2rem',
                          fontWeight: '600',
                          color: '#110a06',
                          marginBottom: '1rem'
                        }}>
                          Completed Courses ({completedEnrollments.length})
                        </h4>
                      </div>
                      {completedEnrollments.map((course) => (
                        <Link
                          key={course.id}
                          to={`/training/course/${course.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div style={{
                            border: '2px solid #198754',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            display: 'flex',
                            cursor: 'pointer',
                            backgroundColor: '#f8fff9',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 135, 84, 0.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                          >
                            {/* Completed Badge */}
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              zIndex: 10,
                              padding: '6px 12px',
                              backgroundColor: '#198754',
                              color: '#ffffff',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <i className="bi bi-check-circle-fill"></i>
                              Completed
                            </div>

                            {/* Course Image */}
                            <div style={{
                              width: '200px',
                              height: '150px',
                              flexShrink: 0,
                              overflow: 'hidden',
                              opacity: 0.9
                            }}>
                              <img
                                src={course.image}
                                alt={course.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>

                            {/* Course Info */}
                            <div style={{
                              flex: 1,
                              padding: '1.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                  <h4 style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '600',
                                    color: '#110a06',
                                    margin: 0,
                                    marginBottom: '0.5rem'
                                  }}>
                                    {course.title}
                                  </h4>
                                </div>
                                <p style={{
                                  fontSize: '0.9rem',
                                  color: '#6c757d',
                                  marginBottom: '0.75rem'
                                }}>
                                  {courseInstructorMap.get(String(course.id || course.courseId)) || course.teacher || 'Instructor'} • {course.level}
                                </p>
                                <p style={{
                                  fontSize: '0.85rem',
                                  color: '#6c757d',
                                  marginBottom: '1rem',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {course.description}
                                </p>
                              </div>

                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.85rem',
                                color: '#198754',
                                fontWeight: '600'
                              }}>
                                <span>
                                  <i className="bi bi-check-circle-fill" style={{ marginRight: '0.25rem' }}></i>
                                  Progress: 100%
                                </span>
                                <span>
                                  <i className="bi bi-calendar-check" style={{ marginRight: '0.25rem' }}></i>
                                  Completed
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Assigned Teachers Card */}
            {currentInstructor && (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h5 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#110a06',
                    margin: 0
                  }}>
                    Your Instructors
                  </h5>
                  {assignedTeachers.length > 1 && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setCurrentInstructorIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentInstructorIndex === 0}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: currentInstructorIndex === 0 ? '#e9ecef' : '#c85716',
                          color: currentInstructorIndex === 0 ? '#6c757d' : '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: currentInstructorIndex === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px'
                        }}
                        title="Previous instructor"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <span style={{ fontSize: '0.8rem', color: '#6c757d', minWidth: '40px', textAlign: 'center' }}>
                        {currentInstructorIndex + 1}/{assignedTeachers.length}
                      </span>
                      <button
                        onClick={() => setCurrentInstructorIndex(prev => Math.min(assignedTeachers.length - 1, prev + 1))}
                        disabled={currentInstructorIndex >= assignedTeachers.length - 1}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: currentInstructorIndex >= assignedTeachers.length - 1 ? '#e9ecef' : '#c85716',
                          color: currentInstructorIndex >= assignedTeachers.length - 1 ? '#6c757d' : '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: currentInstructorIndex >= assignedTeachers.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px'
                        }}
                        title="Next instructor"
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img
                      src={currentInstructor.image}
                      alt={currentInstructor.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h6 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#110a06',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>
                      {currentInstructor.name}
                    </h6>
                    {currentInstructor.title && 
                     !String(currentInstructor.title).includes('API') && 
                     !String(currentInstructor.title).includes('Error') && 
                     !String(currentInstructor.title).includes('error') && 
                     String(currentInstructor.title).length < 100 && (
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#6c757d',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        {currentInstructor.title}
                      </p>
                    )}
                    {currentInstructor.courses && currentInstructor.courses.length > 0 && (
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#6c757d',
                        margin: 0
                      }}>
                        Teaching {currentInstructor.courses.length} course{currentInstructor.courses.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                {currentInstructor.teacherId && (
                  <Link
                    to={`/training/teacher/${currentInstructor.teacherId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '8px 16px',
                      backgroundColor: '#c85716',
                      color: '#ffffff',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#a0450f'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#c85716'
                    }}
                  >
                    <i className="bi bi-person-circle"></i>
                    View Profile
                  </Link>
                )}
              </div>
            )}

            {/* Upcoming Classes */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h5 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#110a06',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="bi bi-calendar-event"></i>
                Upcoming Classes
              </h5>
              {upcomingClasses.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: 0 }}>
                  No upcoming classes scheduled
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {paginatedClasses.map((classItem) => (
                      <div
                        key={classItem.id}
                        style={{
                          padding: '1rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            backgroundColor: getSessionColor(classItem.type),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <i className={`bi ${getSessionIcon(classItem.type)}`} style={{ color: '#ffffff', fontSize: '1rem' }}></i>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h6 style={{
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              color: '#110a06',
                              margin: 0,
                              marginBottom: '0.25rem'
                            }}>
                              {classItem.courseTitle}
                            </h6>
                            <p style={{
                              fontSize: '0.85rem',
                              color: '#6c757d',
                              margin: 0,
                              marginBottom: '0.5rem'
                            }}>
                              <i className="bi bi-person" style={{ marginRight: '0.25rem' }}></i>
                              {classItem.teacher}
                            </p>
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#6c757d',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              marginBottom: classItem.zoomLink ? '0.5rem' : '0'
                            }}>
                              <i className="bi bi-clock" style={{ marginRight: '0.25rem' }}></i>
                              <span>{classItem.schedule}</span>
                            </div>
                            {classItem.zoomLink && (
                              <a
                                href={normalizeUrl(classItem.zoomLink)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.8rem',
                                  color: '#c85716',
                                  textDecoration: 'underline',
                                  fontWeight: '500',
                                  marginTop: '0.25rem',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '0.8'
                                  e.currentTarget.style.textDecoration = 'underline'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1'
                                  e.currentTarget.style.textDecoration = 'underline'
                                }}
                              >
                                <i className="bi bi-camera-video"></i>
                                Join Zoom Meeting
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalClassPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => setUpcomingClassPage(prev => Math.max(0, prev - 1))}
                        disabled={upcomingClassPage === 0}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: upcomingClassPage === 0 ? '#e9ecef' : '#c85716',
                          color: upcomingClassPage === 0 ? '#6c757d' : '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: upcomingClassPage === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <i className="bi bi-chevron-left"></i>
                        Previous
                      </button>
                      <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                        Page {upcomingClassPage + 1} of {totalClassPages}
                      </span>
                      <button
                        onClick={() => setUpcomingClassPage(prev => Math.min(totalClassPages - 1, prev + 1))}
                        disabled={upcomingClassPage >= totalClassPages - 1}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: upcomingClassPage >= totalClassPages - 1 ? '#e9ecef' : '#c85716',
                          color: upcomingClassPage >= totalClassPages - 1 ? '#6c757d' : '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: upcomingClassPage >= totalClassPages - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        Next
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <ChatWidget userType="student" />

      {/* Course Completion Modal */}
      {showCompletionModal && completedCourse && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setShowCompletionModal(false)}
          >
            {/* Modal */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '2.5rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowCompletionModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#6c757d',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>

              {/* Success Icon */}
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#d1e7dd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  animation: 'scaleIn 0.3s ease-out'
                }}
              >
                <i 
                  className="bi bi-check-circle-fill" 
                  style={{ 
                    fontSize: '4rem', 
                    color: '#198754' 
                  }}
                ></i>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: '#110a06',
                  marginBottom: '1rem',
                  lineHeight: 1.3
                }}
              >
                🎉 Congratulations! 🎉
              </h2>

              {/* Message */}
              <p
                style={{
                  fontSize: '1.1rem',
                  color: '#495057',
                  marginBottom: '1.5rem',
                  lineHeight: 1.6
                }}
              >
                You have successfully completed <strong>{completedCourse.courseTitle}</strong>!
              </p>

              {/* Certificate Message */}
              <div
                style={{
                  backgroundColor: '#e7f3ff',
                  border: '1px solid #b3d9ff',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <i 
                    className="bi bi-envelope-check-fill" 
                    style={{ 
                      fontSize: '1.5rem', 
                      color: '#0d6efd' 
                    }}
                  ></i>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#004085'
                    }}
                  >
                    Certificate of Completion
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: '#004085',
                    margin: 0,
                    lineHeight: 1.5
                  }}
                >
                  Your certificate of completion will be sent to your email address. Please check your inbox!
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowCompletionModal(false)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#198754',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#157347'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#198754'}
              >
                Continue
              </button>
            </div>
          </div>

          {/* Add CSS animation */}
          <style>{`
            @keyframes scaleIn {
              from {
                transform: scale(0);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default StudentDashboard;
