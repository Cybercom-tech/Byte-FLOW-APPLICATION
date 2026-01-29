// Student-Teacher Management Utility
// Manages relationships between teachers and students, Zoom links, and communications using backend API

import api from './api'
import { getCurrentUser } from './auth'

// Cache for messages and zoom links
let messagesCache = null
let zoomLinksCache = null
let cacheTimestamp = null
let cacheType = null // 'student' or 'teacher' - to prevent cache mixing
const CACHE_DURATION = 30000 // 30 seconds

/**
 * Get all Zoom links for courses
 */
export const getZoomLinks = async () => {
  try {
    // This would require fetching all courses and their zoom links
    // For now, return empty object - zoom links are fetched per course
    return {}
  } catch (error) {
    console.error('Error reading Zoom links:', error)
    return {}
  }
}

/**
 * Set Zoom link for a course (via API)
 */
export const setZoomLink = async (courseId, zoomLink, meetingId = '', password = '', date = '', time = '') => {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.userType !== 'teacher') {
      return { success: false, message: 'Only teachers can set Zoom links' }
    }

    // Get students enrolled in this course first
    const enrollmentsResponse = await api.get('/student/enrollments')
    const enrollments = enrollmentsResponse.enrollments || []
    const courseEnrollments = enrollments.filter(e => 
      String(e.courseId) === String(courseId) && e.status === 'active'
    )
    const studentIds = courseEnrollments.map(e => e.studentId._id || e.studentId)

    if (studentIds.length === 0) {
      return { success: false, message: 'No students enrolled in this course' }
    }

    // Send zoom link via API
    const response = await api.post('/messages/teacher/zoom-link', {
      courseId,
      studentIds,
      zoomLink,
      meetingId,
      password,
      date,
      time
    })

    // Clear cache
    zoomLinksCache = null
    cacheTimestamp = null

    return { success: true, zoomLink: response.zoomLink }
  } catch (error) {
    console.error('Error setting Zoom link:', error)
    const errorMessage = error.message || 'Failed to save Zoom link'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get Zoom link for a specific course
 */
export const getZoomLink = async (courseId) => {
  try {
    const response = await api.get(`/messages/zoom-link/${courseId}`, { includeAuth: false })
    const zoomLink = response.zoomLink
    
    if (!zoomLink) {
      return null
    }

    return {
      zoomLink: zoomLink.zoomLink,
      meetingId: zoomLink.meetingId || '',
      password: zoomLink.password || '',
      date: zoomLink.date || '',
      time: zoomLink.time || '',
      updatedAt: zoomLink.updatedAt
    }
  } catch (error) {
    // If not found, return null (404 is expected)
    if (error.status === 404) {
      return null
    }
    console.error('Error getting Zoom link:', error)
    return null
  }
}

/**
 * Get all students enrolled in courses taught by a teacher
 * PERFORMANCE NOTE: The backend will return 403/404 if teacher profile doesn't exist,
 * so we skip the profile check and let the API handle it
 */
export const getTeacherStudents = async (teacherId) => {
  try {
    // Skip profile check - backend will handle authorization
    // This avoids an extra API call
    const response = await api.get('/teacher/students')
    const students = response.students || []
    
    // Backend returns students with a 'courses' array, but we need one entry per student-course pair
    // Flatten the structure: if student has courses array, create one entry per course
    const flattenedStudents = []
    
    students.forEach(student => {
      const baseStudent = {
        studentId: student.studentId || student._id,
        email: student.email || '',
        name: student.name || 'Student'
      }
      
      // If student has courses array (backend format), flatten it
      if (Array.isArray(student.courses) && student.courses.length > 0) {
        student.courses.forEach(course => {
          flattenedStudents.push({
            ...baseStudent,
            courseId: course.courseId || course._id,
            enrolledDate: course.enrolledDate,
            enrollmentStatus: 'active',
            progress: course.progress || 0
          })
        })
      } else {
        // Fallback: if no courses array, use direct properties (old format)
        flattenedStudents.push({
          ...baseStudent,
          courseId: student.courseId,
          enrolledDate: student.enrolledDate,
          enrollmentStatus: student.status || 'active',
          progress: student.progress || 0
        })
      }
    })
    
    return flattenedStudents
  } catch (error) {
    // Don't log 404 errors - teacher profile not existing is expected for new teachers
    if (error.status !== 404) {
      console.error('Error getting teacher students:', error)
    }
    return []
  }
}

/**
 * Get students for a specific course (includes both active and completed)
 */
export const getCourseStudents = async (courseId) => {
  try {
    const response = await api.get(`/teacher/courses/${courseId}/students`)
    const students = response.students || []
    
    // Transform to frontend format
    return students.map(student => ({
      studentId: student._id || student.studentId,
      courseId: student.courseId,
      enrolledDate: student.enrolledDate,
      enrollmentStatus: student.status || 'active',
      progress: student.progress || 0,
      email: student.email || '',
      name: student.name || 'Student',
      isCompleted: (student.progress || 0) >= 100
    }))
  } catch (error) {
    // Don't log 403/404 errors - teacher profile not existing is expected for new teachers
    if (error.status !== 403 && error.status !== 404) {
      console.error('Error getting course students:', error)
    }
    return []
  }
}

/**
 * Send message/notification to students
 */
export const sendMessageToStudents = async (teacherId, courseId, studentIds, message, messageType = 'info', date = '', time = '', teacherName = '', replyTo = null) => {
  try {
    const response = await api.post('/messages/teacher/send', {
      courseId,
      studentIds,
      message,
      messageType,
      date,
      time
    })

    // Clear cache
    messagesCache = null
    cacheTimestamp = null
    cacheType = null

    return { success: true, messages: response.messages || [] }
  } catch (error) {
    console.error('Error sending message:', error)
    const errorMessage = error.message || 'Failed to send message'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get messages for a student (incoming from teachers)
 */
export const getStudentMessages = async (studentId) => {
  try {
    // Use cache if available and valid
    const now = Date.now()
    if (messagesCache && cacheTimestamp && cacheType === 'student' && (now - cacheTimestamp) < CACHE_DURATION && Array.isArray(messagesCache) && messagesCache.length >= 0) {
      // API already returns messages for current student, so cache should already be filtered
      // Just return the cached messages (they're already for this student)
      return messagesCache
    }

    const response = await api.get('/messages/student/messages')
    const messages = response.messages || []
    
    // Transform to frontend format
    const transformedMessages = messages.map(msg => {
      // Handle courseId - can be ObjectId, string, or number (Mixed type)
      let courseId = msg.courseId;
      let courseTitle = '';
      
      if (typeof msg.courseId === 'object' && msg.courseId !== null) {
        // It's a populated ObjectId
        courseId = msg.courseId._id || msg.courseId;
        courseTitle = msg.courseId.courseTitle || '';
      } else {
        // It's a string or number (Mixed type)
        courseId = msg.courseId;
        courseTitle = '';
      }
      
      return {
        id: msg._id,
        teacherId: typeof msg.teacherId === 'object' ? msg.teacherId._id : msg.teacherId,
        teacherName: typeof msg.teacherId === 'object' ? (msg.teacherId.fullName || 'Instructor') : 'Instructor',
        courseId: courseId,
        courseTitle: courseTitle,
        studentId: typeof msg.studentId === 'object' ? msg.studentId._id : msg.studentId,
        message: msg.message,
        messageType: msg.messageType || 'info',
        date: msg.meetingDate ? (typeof msg.meetingDate === 'string' ? msg.meetingDate.split('T')[0] : new Date(msg.meetingDate).toISOString().split('T')[0]) : '',
        time: msg.meetingTime || '',
        sentAt: msg.createdAt,
        read: msg.read || false,
        direction: msg.direction || 'teacher_to_student',
        replyTo: msg.replyTo || null,
        zoomLink: msg.zoomLink || null,
        meetingId: msg.meetingId || null,
        password: msg.password || null
      };
    });

    // Update cache - always update even if empty to prevent stale data
    messagesCache = transformedMessages
    cacheTimestamp = now
    cacheType = 'student' // Mark cache as student messages

    return transformedMessages
  } catch (error) {
    console.error('Error getting student messages:', error)
    // Return cached messages if available, even if expired, to prevent disappearing
    if (messagesCache && Array.isArray(messagesCache)) {
      return messagesCache
    }
    return []
  }
}

/**
 * Get messages sent by a student (outgoing to teachers)
 */
export const getStudentOutgoingMessages = async (studentId) => {
  try {
    // Student messages are included in getStudentMessages but filtered by direction
    const allMessages = await getStudentMessages(studentId)
    return allMessages.filter(m => m.direction === 'student_to_teacher')
  } catch (error) {
    console.error('Error getting student outgoing messages:', error)
    return []
  }
}

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId) => {
  try {
    await api.put(`/messages/${messageId}/read`, {})
    
    // Clear cache
    messagesCache = null
    cacheTimestamp = null
    cacheType = null
    
    return { success: true }
  } catch (error) {
    console.error('Error marking message as read:', error)
    const errorMessage = error.message || 'Failed to mark message as read'
    return { success: false, message: errorMessage }
  }
}

/**
 * Dismiss/delete a message (for simple messages like info, announcement, reminder)
 * Note: Backend doesn't have delete endpoint, kept for backward compatibility
 */
export const dismissMessage = async (messageId) => {
  // Backend doesn't support deleting messages
  // Marking as read is the closest equivalent
  return await markMessageAsRead(messageId)
}

/**
 * Send Zoom link to students
 */
export const sendZoomLinkToStudents = async (teacherId, courseId, studentIds, zoomLink, meetingId = '', password = '', date = '', time = '', teacherName = '') => {
  try {
    const response = await api.post('/messages/teacher/zoom-link', {
      courseId,
      studentIds,
      zoomLink,
      meetingId,
      password,
      date,
      time
    })

    // Clear cache immediately to ensure new messages show up
    messagesCache = null
    zoomLinksCache = null
    cacheTimestamp = null
    
    // Clear notification cache so new notifications appear
    const { clearNotificationCache } = await import('./notifications')
    clearNotificationCache()
    
    // Dispatch event to notify other components to refresh messages
    window.dispatchEvent(new CustomEvent('messagesUpdated'))
    
    // Dispatch event to notify notification system
    window.dispatchEvent(new CustomEvent('newNotification', { 
      detail: { 
        userId: null, // Will be handled by notification system
        type: 'Announcement'
      } 
    }))

    return { success: true, zoomLink: response.zoomLink }
  } catch (error) {
    console.error('Error sending Zoom link:', error)
    // Extract error message from response
    const errorMessage = error.data?.message || error.message || error.response?.data?.message || 'Failed to send Zoom link'
    console.error('Error details:', {
      message: errorMessage,
      status: error.status,
      data: error.data
    })
    return { success: false, message: errorMessage }
  }
}

/**
 * Get courses taught by a teacher
 * Note: This is now handled by courseManagement utility
 * PERFORMANCE OPTIMIZED: Runs both course fetches in parallel
 */
export const getTeacherCourses = async (teacherId) => {
  try {
    const { getCoursesByTeacher, getCoursesAssignedToTeacher } = await import('./courseManagement')
    
    // PERFORMANCE FIX: Run both API calls in parallel instead of sequentially
    const [createdCourses, assignedCourseIds] = await Promise.all([
      getCoursesByTeacher(teacherId),
      getCoursesAssignedToTeacher(teacherId)
    ])
    
    // Combine both arrays and return unique course IDs
    const allCourseIds = [
      ...createdCourses.map(c => c.id || c._id),
      ...assignedCourseIds
    ].filter(Boolean)
    
    // Remove duplicates
    return [...new Set(allCourseIds.map(id => String(id)))]
  } catch (error) {
    console.error('Error getting teacher courses:', error)
    return []
  }
}

/**
 * Send message from student to teacher
 */
export const sendMessageToTeacher = async (studentId, courseId, teacherId, message, studentName = '', replyTo = null) => {
  try {
    const response = await api.post('/messages/student/send', {
      courseId,
      teacherId,
      message,
      replyTo
    })

    // Clear cache
    messagesCache = null
    cacheTimestamp = null
    cacheType = null

    return { success: true, message: response.message }
  } catch (error) {
    console.error('Error sending message to teacher:', error)
    const errorMessage = error.message || 'Failed to send message'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get messages for a teacher (both from students and sent by teacher)
 */
export const getTeacherMessages = async (teacherId) => {
  try {
    // Don't block on profile check - backend will handle authorization
    // This allows messages to load even if profile check fails or is cached incorrectly

    // Use cache if available and valid
    const now = Date.now()
    if (messagesCache && cacheTimestamp && cacheType === 'teacher' && (now - cacheTimestamp) < CACHE_DURATION && Array.isArray(messagesCache)) {
      // Cache is for teacher messages and still valid
      return messagesCache
    }

    const response = await api.get('/messages/teacher/messages')
    const messages = response.messages || []
    
    // Transform to frontend format
    const transformedMessages = messages.map(msg => {
      // Handle courseId - can be ObjectId, string, or number (Mixed type)
      let courseId = msg.courseId;
      let courseTitle = '';
      
      if (typeof msg.courseId === 'object' && msg.courseId !== null) {
        // It's a populated ObjectId
        courseId = msg.courseId._id || msg.courseId;
        courseTitle = msg.courseId.courseTitle || '';
      } else {
        // It's a string or number (Mixed type)
        courseId = msg.courseId;
        courseTitle = '';
      }
      
      return {
        id: msg._id,
        teacherId: typeof msg.teacherId === 'object' ? msg.teacherId._id : msg.teacherId,
        studentId: typeof msg.studentId === 'object' ? msg.studentId._id : msg.studentId,
        studentName: typeof msg.studentId === 'object' ? (msg.studentId.name || msg.studentId.fullName || 'Student') : 'Student',
        courseId: courseId,
        courseTitle: courseTitle,
        message: msg.message,
        messageType: msg.messageType || (msg.direction === 'student_to_teacher' ? 'student_message' : 'info'),
        sentAt: msg.createdAt,
        read: msg.read || false,
        direction: msg.direction || 'student_to_teacher',
        replyTo: msg.replyTo || null,
        zoomLink: msg.zoomLink || null,
        meetingId: msg.meetingId || null,
        password: msg.password || null,
        date: msg.meetingDate ? (typeof msg.meetingDate === 'string' ? msg.meetingDate.split('T')[0] : new Date(msg.meetingDate).toISOString().split('T')[0]) : '',
        time: msg.meetingTime || ''
      }
    })

    // Update cache
    messagesCache = transformedMessages
    cacheTimestamp = now
    cacheType = 'teacher' // Mark cache as teacher messages

    return transformedMessages
  } catch (error) {
    // Return cached messages if available, even if expired (only if they're teacher messages)
    if (messagesCache && cacheType === 'teacher' && Array.isArray(messagesCache)) {
      return messagesCache
    }
    return []
  }
}

/**
 * Mark teacher message as read (for messages from students)
 */
export const markTeacherMessageAsRead = async (messageId) => {
  // Same as markMessageAsRead
  return await markMessageAsRead(messageId)
}

/**
 * Get teacher for a course (to find who to send message to)
 * Works for both default courses (numeric IDs) and database courses (MongoDB ObjectIds)
 */
export const getCourseTeacher = async (courseId) => {
  try {
    const courseIdStr = String(courseId)
    
    // First try the API endpoint which handles both numeric and ObjectId course IDs
    try {
      const response = await api.get(`/course/${courseIdStr}/instructor`, { includeAuth: false })
      if (response.instructor && response.instructor.id) {
        return {
          teacherId: response.instructor.id,
          teacherName: response.instructor.name || response.instructor.fullName || 'Instructor'
        }
      }
    } catch (apiError) {
      // If 404, course might not have an assigned instructor - continue to fallback
      if (apiError.status !== 404) {
        console.error('Error getting course instructor from API:', apiError)
      }
    }
    
    // Fallback: try getCourseById (for database courses)
    const { getCourseById } = await import('./courseManagement')
    const course = await getCourseById(courseId)
    
    if (course && course.teacherId) {
      return {
        teacherId: course.teacherId,
        teacherName: course.instructor || course.teacher || 'Instructor'
      }
    }
    
    // If still no teacher found, return null
    return null
  } catch (error) {
    console.error('Error getting course teacher:', error)
    return null
  }
}

/**
 * Update student enrollment info with student details
 * Note: This is now handled by backend, kept for backward compatibility
 */
export const updateEnrollmentWithStudentInfo = async (courseId, studentId, studentInfo) => {
  // This is now handled by backend automatically
  // Keeping for backward compatibility
  return { success: true }
}

/**
 * Get student progress for a course (teacher function)
 * This allows teachers to view a student's progress in their course
 */
export const getStudentProgressForTeacher = async (courseId, studentId) => {
  try {
    const response = await api.get(`/teacher/courses/${courseId}/students/${studentId}/progress`)
    return response.progress || { completedSections: [], progress: 0 }
  } catch (error) {
    console.error('Error getting student progress:', error)
    return { completedSections: [], progress: 0 }
  }
}

/**
 * Update student progress (teacher function)
 * This allows teachers to mark sections as complete/incomplete for students
 */
export const updateStudentProgressForTeacher = async (courseId, studentId, progressData) => {
  try {
    const response = await api.put(`/teacher/courses/${courseId}/students/${studentId}/progress`, progressData)
    return { success: true, enrollment: response.enrollment }
  } catch (error) {
    console.error('Error updating student progress:', error)
    return { success: false, message: error.message || 'Failed to update student progress' }
  }
}

/**
 * Mark a section as completed for a student (teacher function)
 * @deprecated Use toggleSectionForTeacher for better performance
 */
export const markSectionCompletedForTeacher = async (courseId, studentId, sectionIndex) => {
  try {
    // Get current progress first
    const currentProgress = await getStudentProgressForTeacher(courseId, studentId)
    const completedSections = currentProgress.completedSections || []
    
    // Add section if not already completed
    if (!completedSections.includes(sectionIndex)) {
      completedSections.push(sectionIndex)
      completedSections.sort((a, b) => a - b)
    }

    // Update via API
    const result = await updateStudentProgressForTeacher(courseId, studentId, {
      completedSections: completedSections
    })
    
    if (result.success) {
      return { success: true, completedSections: completedSections }
    }
    
    return result
  } catch (error) {
    console.error('Error marking section completed:', error)
    return { success: false, message: 'Failed to mark section as completed' }
  }
}

/**
 * Unmark a section as completed for a student (teacher function)
 * @deprecated Use toggleSectionForTeacher for better performance
 */
export const unmarkSectionCompletedForTeacher = async (courseId, studentId, sectionIndex) => {
  try {
    // Get current progress first
    const currentProgress = await getStudentProgressForTeacher(courseId, studentId)
    const completedSections = (currentProgress.completedSections || []).filter(idx => idx !== sectionIndex)

    // Update via API
    const result = await updateStudentProgressForTeacher(courseId, studentId, {
      completedSections: completedSections
    })
    
    if (result.success) {
      return { success: true, completedSections: completedSections }
    }
    
    return result
  } catch (error) {
    console.error('Error unmarking section completed:', error)
    return { success: false, message: 'Failed to unmark section as completed' }
  }
}

/**
 * Calculate and update progress based on completed sections (teacher function)
 * @deprecated Use toggleSectionForTeacher for better performance
 */
export const calculateAndUpdateProgressForTeacher = async (courseId, studentId, totalSections) => {
  try {
    const currentProgress = await getStudentProgressForTeacher(courseId, studentId)
    const completedSections = currentProgress.completedSections || []
    const progress = totalSections > 0 
      ? Math.round((completedSections.length / totalSections) * 100)
      : 0
    
    const result = await updateStudentProgressForTeacher(courseId, studentId, {
      progress: progress,
      completedSections: completedSections
    })
    
    if (result.success) {
      return { success: true, progress, completedCount: completedSections.length }
    }
    
    return result
  } catch (error) {
    console.error('Error calculating progress:', error)
    return { success: false, message: 'Failed to calculate progress' }
  }
}

/**
 * OPTIMIZED: Toggle section completion and update progress in a single API call
 * This function performs optimistic updates for instant UI feedback
 * 
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID
 * @param {number} sectionIndex - Section index to toggle
 * @param {boolean} isCompleting - true if marking complete, false if unmarking
 * @param {number[]} currentCompletedSections - Current completed sections (for optimistic update)
 * @param {number} totalSections - Total number of sections in course
 * @returns {Object} Result with new completedSections, progress, and success status
 */
export const toggleSectionForTeacher = async (courseId, studentId, sectionIndex, isCompleting, currentCompletedSections, totalSections) => {
  try {
    // Calculate new completed sections locally (no API call needed)
    let newCompletedSections
    if (isCompleting) {
      newCompletedSections = [...currentCompletedSections]
      if (!newCompletedSections.includes(sectionIndex)) {
        newCompletedSections.push(sectionIndex)
        newCompletedSections.sort((a, b) => a - b)
      }
    } else {
      newCompletedSections = currentCompletedSections.filter(idx => idx !== sectionIndex)
    }
    
    // Calculate new progress locally
    const newProgress = totalSections > 0 
      ? Math.round((newCompletedSections.length / totalSections) * 100)
      : 0

    // Single API call to update everything
    const result = await updateStudentProgressForTeacher(courseId, studentId, {
      completedSections: newCompletedSections,
      progress: newProgress
    })
    
    if (result.success) {
      return { 
        success: true, 
        completedSections: newCompletedSections, 
        progress: newProgress,
        completedCount: newCompletedSections.length
      }
    }
    
    return { ...result, completedSections: currentCompletedSections }
  } catch (error) {
    console.error('Error toggling section:', error)
    return { success: false, message: 'Failed to update section', completedSections: currentCompletedSections }
  }
}
