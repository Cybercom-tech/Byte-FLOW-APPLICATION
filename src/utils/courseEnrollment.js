// Course Enrollment Utility
// Manages student course enrollments using backend API

import { getCurrentUser, isAuthenticated, isStudent } from './auth'
import api from './api'

// Cache for enrollments to avoid repeated API calls
let enrollmentsCache = null
let cacheTimestamp = null
const CACHE_DURATION = 30000 // 30 seconds

/**
 * Create student profile if it doesn't exist
 */
const ensureStudentProfile = async () => {
  try {
    if (!isAuthenticated() || !isStudent()) {
      return false
    }

    // Try to create student profile (will fail silently if already exists)
    try {
      await api.post('/student/profile', {}, { includeAuth: true })
      return true
    } catch (error) {
      // If profile already exists (400 status), that's fine - return true silently
      if (error.status === 400) {
        // Don't log - this is expected when profile already exists
        return true
      }
      // For other errors (500, network errors, etc.), log but don't fail
      // Only log if it's not a 400 (which we handle silently above)
      if (error.status !== 400) {
        console.warn('Could not create student profile:', error.message || error.data?.message)
      }
      return false
    }
  } catch (error) {
    // Only log unexpected errors
    if (error.status !== 400) {
      console.warn('Error ensuring student profile:', error)
    }
    return false
  }
}

/**
 * Fetch enrollments from API
 */
const fetchEnrollments = async () => {
  try {
    if (!isAuthenticated() || !isStudent()) {
      return []
    }

    // Ensure student profile exists before fetching enrollments
    await ensureStudentProfile()

    // Use longer timeout (15s) for enrollment fetching - backend may be slow on first request
    const response = await api.get('/student/enrollments', { timeout: 15000 })
    return response.enrollments || []
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    // If student not found, try to create profile and retry once
    if (error.status === 404 && error.message?.includes('Student not found')) {
      try {
        await ensureStudentProfile()
        const retryResponse = await api.get('/student/enrollments', { timeout: 15000 })
        return retryResponse.enrollments || []
      } catch (retryError) {
        console.error('Error fetching enrollments after profile creation:', retryError)
        // Return null to indicate error (allows preserving existing data)
        return null
      }
    }
    // Return null to indicate error (allows preserving existing data)
    return null
  }
}

/**
 * Get all enrolled courses for the current student
 */
export const getEnrolledCourses = async () => {
  try {
    if (!isAuthenticated() || !isStudent()) {
      return []
    }

    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return []
    }

    // Use cache if available and fresh
    const now = Date.now()
    if (enrollmentsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return enrollmentsCache
    }

    // Fetch from API
    const enrollments = await fetchEnrollments()
    
    // If fetch returned null (error occurred), return cached data if available, otherwise empty array
    if (enrollments === null) {
      return enrollmentsCache || []
    }
    
    // Transform backend format to frontend format
    const transformedEnrollments = enrollments.map(enrollment => ({
      id: enrollment._id,
      courseId: typeof enrollment.courseId === 'object' ? enrollment.courseId._id : enrollment.courseId,
      studentId: typeof enrollment.studentId === 'object' ? enrollment.studentId._id : enrollment.studentId,
      status: enrollment.status,
      progress: enrollment.progress || 0,
      currentSection: enrollment.currentSection || 'Introduction',
      completedSections: enrollment.completedSections || [],
      lastAccessed: enrollment.lastAccessed ? new Date(enrollment.lastAccessed).toISOString().split('T')[0] : null,
      enrolledDate: enrollment.createdAt ? new Date(enrollment.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: enrollment.paymentMethod,
      transactionId: enrollment.transactionId,
      amountPaid: enrollment.amountPaid || 0,
      verificationRequired: enrollment.verificationRequired || false,
      verifiedAt: enrollment.verifiedAt,
      course: enrollment.courseId // Include full course data if populated
    }))

    // Update cache
    enrollmentsCache = transformedEnrollments
    cacheTimestamp = now

    return transformedEnrollments
  } catch (error) {
    console.error('Error reading enrollments:', error)
    return []
  }
}

/**
 * Check if a student is enrolled in a specific course (active enrollment only)
 */
export const isEnrolled = async (courseId) => {
  try {
    const enrollments = await getEnrolledCourses()
    const courseIdStr = String(courseId)
    
    // Check if there's an active enrollment
    const activeEnrollment = enrollments.find(enrollment => 
      String(enrollment.courseId) === courseIdStr && enrollment.status === 'active'
    )
    
    return !!activeEnrollment
  } catch (error) {
    console.error('Error checking enrollment:', error)
    return false
  }
}

/**
 * Check if a student has a pending enrollment for a course
 */
export const hasPendingEnrollment = async (courseId) => {
  try {
    const enrollments = await getEnrolledCourses()
    const courseIdStr = String(courseId)
    return enrollments.some(enrollment => 
      String(enrollment.courseId) === courseIdStr && enrollment.status === 'pending'
    )
  } catch (error) {
    console.error('Error checking pending enrollment:', error)
    return false
  }
}

/**
 * Enroll a student in a course
 * @param {Object} courseData - Course enrollment data
 * @param {string} courseData.courseId - Course ID
 * @param {boolean} courseData.requiresVerification - Whether enrollment requires manual verification (for bank transfers)
 * @param {string} courseData.paymentMethod - Payment method used
 * @param {string} courseData.transactionId - Transaction ID
 * @param {number} courseData.amountPaid - Amount paid
 */
export const enrollInCourse = async (courseData) => {
  try {
    // Require authentication
    if (!isAuthenticated() || !isStudent()) {
      return { success: false, message: 'You must be logged in as a student to enroll in courses' }
    }

    const currentUser = getCurrentUser()
    if (!currentUser) {
      return { success: false, message: 'User not found. Please login again.' }
    }

    try {
      // Call backend API
      const response = await api.post('/student/enroll', {
        courseId: courseData.courseId,
        paymentMethod: courseData.paymentMethod || null,
        transactionId: courseData.transactionId || null,
        amountPaid: courseData.amountPaid || 0,
        paymentScreenshot: courseData.paymentScreenshot || null, // Include screenshot
        requiresVerification: courseData.requiresVerification || false
      })

      // Clear cache to force refresh
      enrollmentsCache = null
      cacheTimestamp = null

      // Transform response to match frontend format
      const enrollment = response.enrollment
      const transformedEnrollment = {
        id: enrollment._id,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        status: enrollment.status,
        progress: enrollment.progress || 0,
        currentSection: enrollment.currentSection || 'Introduction',
        completedSections: enrollment.completedSections || [],
        lastAccessed: enrollment.lastAccessed ? new Date(enrollment.lastAccessed).toISOString().split('T')[0] : null,
        enrolledDate: enrollment.createdAt ? new Date(enrollment.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: enrollment.paymentMethod,
        transactionId: enrollment.transactionId,
        amountPaid: enrollment.amountPaid || 0,
        verificationRequired: enrollment.verificationRequired || false
      }

      // Dispatch event for enrollment
      window.dispatchEvent(new CustomEvent('enrollmentCreated', {
        detail: { enrollment: transformedEnrollment }
      }))

      return { success: true, enrollment: transformedEnrollment, message: response.message }
    } catch (error) {
      console.error('Enrollment API error:', error)
      
      // Extract error message from different error formats
      let errorMessage = 'Failed to enroll in course'
      
      if (error.data?.message) {
        errorMessage = error.data.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      // Provide more helpful error messages for common cases
      if (error.status === 404) {
        if (errorMessage.includes('Course not found') || errorMessage.includes('not approved')) {
          errorMessage = 'This course is not available for enrollment. It may not exist in the system or may not be approved yet. Please contact support if you believe this is an error.'
        } else if (errorMessage.includes('Invalid course ID') || errorMessage.includes('numeric IDs between')) {
          // Use the backend's specific error message for invalid course IDs
          errorMessage = errorMessage
        } else if (errorMessage.includes('Student not found')) {
          errorMessage = 'Student profile not found. Please try logging out and logging back in.'
        }
      } else if (error.status === 403) {
        if (errorMessage.includes('not approved for enrollment yet')) {
          // Use the backend's specific message
          errorMessage = errorMessage
        } else {
          errorMessage = 'You do not have permission to enroll in this course.'
        }
      } else if (error.status === 400) {
        errorMessage = errorMessage || 'Invalid enrollment request. Please check your information and try again.'
      } else if (error.status === 0 || error.isNetworkError) {
        errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.'
      } else if (error.isTimeout) {
        errorMessage = 'Request timed out. The server may be slow. Please try again.'
      }
      
      return { success: false, message: errorMessage, status: error.status }
    }
  } catch (error) {
    console.error('Error enrolling in course:', error)
    return { success: false, message: 'Failed to enroll in course' }
  }
}

/**
 * Verify and activate a pending enrollment (admin function)
 * Note: This is now handled by admin API, kept for backward compatibility
 */
export const verifyEnrollment = async (courseId, studentId = null) => {
  // This function is now handled by admin API
  // Keeping for backward compatibility but it should use admin endpoint
  console.warn('verifyEnrollment should be called via admin API')
  return { success: false, message: 'Use admin API to verify enrollments' }
}

/**
 * Get pending enrollments (for admin)
 */
export const getPendingEnrollments = async () => {
  try {
    const enrollments = await getEnrolledCourses()
    return enrollments.filter(e => e.status === 'pending')
  } catch (error) {
    console.error('Error getting pending enrollments:', error)
    return []
  }
}

/**
 * Update course progress (only for active enrollments)
 */
export const updateCourseProgress = async (courseId, progress, currentSection = null, completedSections = null) => {
  try {
    if (!isAuthenticated() || !isStudent()) {
      return { success: false, message: 'Authentication required' }
    }

    // Get enrollments to find enrollmentId
    const enrollments = await getEnrolledCourses()
    const courseIdStr = String(courseId)
    const enrollment = enrollments.find(e => 
      String(e.courseId) === courseIdStr && e.status === 'active'
    )

    if (!enrollment || !enrollment.id) {
      return { success: false, message: 'Active enrollment not found' }
    }

    try {
      const previousProgress = enrollment.progress || 0
      const newProgress = Math.min(100, Math.max(0, progress))
      
      // Call backend API
      const response = await api.put(`/student/enrollments/${enrollment.id}/progress`, {
        progress: newProgress,
        currentSection: currentSection,
        completedSections: completedSections
      })

      // Clear cache
      enrollmentsCache = null
      cacheTimestamp = null

      // Check if course was just completed (progress reached 100% from less than 100%)
      const wasJustCompleted = previousProgress < 100 && (newProgress >= 100 || response.enrollment?.isCompleted)
      
      console.log('Progress update:', {
        courseId,
        previousProgress,
        newProgress,
        isCompleted: response.enrollment?.isCompleted,
        wasJustCompleted
      })

      // Dispatch event to notify dashboard to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('enrollmentProgressUpdated', {
          detail: { courseId, enrollment: response.enrollment }
        }))

        // Dispatch special event for course completion
        if (wasJustCompleted) {
          console.log('Dispatching courseCompleted event for course:', courseId)
          window.dispatchEvent(new CustomEvent('courseCompleted', {
            detail: { 
              courseId, 
              enrollment: response.enrollment,
              previousProgress,
              newProgress
            }
          }))
        }
      }

      return { success: true, enrollment: response.enrollment, wasJustCompleted }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update progress'
      return { success: false, message: errorMessage }
    }
  } catch (error) {
    console.error('Error updating progress:', error)
    return { success: false, message: 'Failed to update progress' }
  }
}

/**
 * Get completed sections for a student in a course (works for teachers too)
 */
export const getCompletedSections = async (courseId, studentId) => {
  try {
    const enrollments = await getEnrolledCourses()
    const courseIdStr = String(courseId)
    const enrollment = enrollments.find(e => 
      String(e.courseId) === courseIdStr && 
      String(e.studentId) === String(studentId) && 
      e.status === 'active'
    )
    
    return enrollment?.completedSections || []
  } catch (error) {
    console.error('Error getting completed sections:', error)
    return []
  }
}

/**
 * Mark a section as completed for a student (works for teachers too)
 */
export const markSectionCompleted = async (courseId, studentId, sectionIndex) => {
  try {
    // Get enrollments to find enrollmentId
    const enrollments = await getEnrolledCourses()
    const courseIdStr = String(courseId)
    const enrollment = enrollments.find(e => 
      String(e.courseId) === courseIdStr && 
      String(e.studentId) === String(studentId) && 
      e.status === 'active'
    )
    
    if (!enrollment || !enrollment.id) {
      return { success: false, message: 'Active enrollment not found' }
    }

    // Get current completed sections
    const completedSections = enrollment.completedSections || []
    
    // Add section if not already completed
    if (!completedSections.includes(sectionIndex)) {
      completedSections.push(sectionIndex)
      completedSections.sort((a, b) => a - b)
    }

    // Update via API
    const result = await updateCourseProgress(courseId, enrollment.progress, enrollment.currentSection, completedSections)
    
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
 * Unmark a section as completed for a student (works for teachers too)
 */
export const unmarkSectionCompleted = async (courseId, studentId, sectionIndex) => {
  try {
    // Get enrollments to find enrollmentId
    const enrollments = await getEnrolledCourses()
    const courseIdStr = String(courseId)
    const enrollment = enrollments.find(e => 
      String(e.courseId) === courseIdStr && 
      String(e.studentId) === String(studentId) && 
      e.status === 'active'
    )
    
    if (!enrollment || !enrollment.id) {
      return { success: false, message: 'Active enrollment not found' }
    }

    // Remove section from completed
    const completedSections = (enrollment.completedSections || []).filter(idx => idx !== sectionIndex)

    // Update via API
    const result = await updateCourseProgress(courseId, enrollment.progress, enrollment.currentSection, completedSections)
    
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
 * Calculate and update progress based on completed sections (works for teachers too)
 */
export const calculateAndUpdateProgress = async (courseId, studentId, totalSections) => {
  try {
    const completedSections = await getCompletedSections(courseId, studentId)
    const progress = totalSections > 0 
      ? Math.round((completedSections.length / totalSections) * 100)
      : 0
    
    // Get enrollment to update
    const enrollments = await getEnrolledCourses()
    const courseIdStr = String(courseId)
    const enrollment = enrollments.find(e => 
      String(e.courseId) === courseIdStr && 
      String(e.studentId) === String(studentId) && 
      e.status === 'active'
    )
    
    if (enrollment) {
      const result = await updateCourseProgress(courseId, progress, enrollment.currentSection, completedSections)
      if (result.success) {
        return { success: true, progress, completedCount: completedSections.length }
      }
      return result
    }
    
    return { success: false, message: 'Active enrollment not found' }
  } catch (error) {
    console.error('Error calculating progress:', error)
    return { success: false, message: 'Failed to calculate progress' }
  }
}

/**
 * Remove enrollment (for testing/admin purposes)
 * Note: This should use admin API in production
 */
export const removeEnrollment = async (courseId) => {
  // This function should use admin API
  console.warn('removeEnrollment should be called via admin API')
  return { success: false, message: 'Use admin API to remove enrollments' }
}
