// Payment Screenshot Management Utility
// Manages payment screenshots for bank transfer verification using backend API

import api from './api'
import { createNotification } from './notifications'
import { coursesData } from '../pages/Training/coursesData'
import { getAllCourses } from './courseManagement'

/**
 * Helper function to get course title by courseId
 * Checks both coursesData (default courses) and teacher-created courses
 * @param {string|number} courseId - The course ID to look up
 * @param {Array} allTeacherCourses - Pre-fetched array of teacher-created courses (optional, for performance)
 */
const getCourseTitleById = (courseId, allTeacherCourses = null) => {
  if (!courseId) return ''
  
  const courseIdStr = String(courseId)
  
  // First check default courses (coursesData)
  const defaultCourse = coursesData.find(c => String(c.id) === courseIdStr)
  if (defaultCourse && defaultCourse.title) {
    return defaultCourse.title
  }
  
  // Then check teacher-created courses (use provided array or return empty)
  if (allTeacherCourses && Array.isArray(allTeacherCourses)) {
    const teacherCourse = allTeacherCourses.find(
      c => String(c.id) === courseIdStr || String(c._id) === courseIdStr
    )
    if (teacherCourse && (teacherCourse.title || teacherCourse.courseTitle)) {
      return teacherCourse.title || teacherCourse.courseTitle
    }
  }
  
  return ''
}

/**
 * Get all payment screenshots (for admin)
 */
export const getAllPaymentScreenshots = async () => {
  try {
    const response = await api.get('/admin/payments')
    
    // Ensure response is an object and enrollments is an array
    if (!response || typeof response !== 'object') {
      console.warn('Invalid response format from API:', response)
      return []
    }
    
    // Handle different possible response structures
    let enrollments = []
    if (Array.isArray(response.enrollments)) {
      enrollments = response.enrollments
    } else if (Array.isArray(response.data?.enrollments)) {
      enrollments = response.data.enrollments
    } else if (Array.isArray(response)) {
      enrollments = response
    } else {
      console.warn('No enrollments array found in response:', response)
      return []
    }
    
    // Ensure enrollments is an array before mapping
    if (!Array.isArray(enrollments)) {
      console.warn('Enrollments is not an array:', enrollments)
      return []
    }
    
    // Pre-fetch teacher-created courses once (for performance)
    let allTeacherCourses = []
    try {
      allTeacherCourses = await getAllCourses(false)
      if (!Array.isArray(allTeacherCourses)) {
        allTeacherCourses = []
      }
    } catch (error) {
      console.warn('Error fetching teacher courses for title lookup:', error)
      allTeacherCourses = []
    }
    
    // Transform to frontend format
    const transformed = enrollments.map((enrollment, index) => {
      // Debug: Log first enrollment to check screenshot field
      if (index === 0) {
        console.log('Sample enrollment data:', {
          _id: enrollment._id,
          paymentScreenshot: enrollment.paymentScreenshot,
          paymentScreenshotType: typeof enrollment.paymentScreenshot,
          paymentScreenshotLength: enrollment.paymentScreenshot?.length,
          hasPaymentScreenshot: enrollment.hasOwnProperty('paymentScreenshot')
        })
      }
      // Safely extract and convert courseId to string
      let courseId = enrollment.courseId
      if (courseId && typeof courseId === 'object') {
        courseId = courseId._id || courseId.toString()
      }
      if (courseId) {
        courseId = String(courseId)
      }
      
      // Extract courseTitle and instructorName from backend response
      let courseTitle = enrollment.courseTitle || ''
      let instructorName = enrollment.instructorName || ''
      
      // If courseTitle is missing, try to get it from populated courseId
      if (!courseTitle && typeof enrollment.courseId === 'object' && enrollment.courseId.courseTitle) {
        courseTitle = enrollment.courseId.courseTitle
      }
      
      // If courseTitle is still missing, try to look it up (for string courseIds/default courses)
      if (!courseTitle && courseId) {
        const courseIdStr = String(courseId)
        const objectIdPattern = /^[0-9a-fA-F]{24}$/
        const isObjectId = objectIdPattern.test(courseIdStr)
        
        // Only look up if it's NOT a MongoDB ObjectId (i.e., it's a string/numeric ID)
        if (!isObjectId) {
          courseTitle = getCourseTitleById(courseId, allTeacherCourses) || courseTitle
        }
      }
      
      // If instructorName is missing, try to get it from course data or API
      if (!instructorName && courseId) {
        // Try to get instructor from course data
        const courseIdStr = String(courseId)
        const defaultCourse = coursesData.find(c => String(c.id) === courseIdStr)
        if (defaultCourse && defaultCourse.teacher) {
          instructorName = defaultCourse.teacher
        } else if (allTeacherCourses && Array.isArray(allTeacherCourses)) {
          const teacherCourse = allTeacherCourses.find(
            c => String(c.id) === courseIdStr || String(c._id) === courseIdStr
          )
          if (teacherCourse && (teacherCourse.instructor || teacherCourse.teacher)) {
            instructorName = teacherCourse.instructor || teacherCourse.teacher
          }
        }
      }
      
      // Safely extract and convert studentId to string
      let studentId = enrollment.studentId
      if (studentId && typeof studentId === 'object') {
        studentId = studentId._id || studentId.userId || studentId.toString()
      }
      if (studentId) {
        studentId = String(studentId)
      }
      
      // Extract student name - enrollment doesn't have studentName, so use a default
      // The backend would need to populate this separately if needed
      const studentName = enrollment.studentName || 'Student'
      
      // Safely convert _id to string for React keys
      let enrollmentId = enrollment._id
      if (enrollmentId && typeof enrollmentId === 'object') {
        enrollmentId = enrollmentId.toString()
      } else if (enrollmentId) {
        enrollmentId = String(enrollmentId)
      }
      
      return {
        id: enrollmentId || '',
        enrollmentId: enrollmentId || '',
        courseId: courseId || '',
        courseTitle: courseTitle || '',
        instructorName: instructorName || 'Course Instructor',
        studentId: studentId || '',
        studentName: studentName || 'Student',
        screenshotUrl: (enrollment.paymentScreenshot && enrollment.paymentScreenshot.trim() !== '') ? enrollment.paymentScreenshot : null,
        status: enrollment.status === 'pending' ? 'pending' : 
                enrollment.status === 'active' ? 'confirmed' : 
                enrollment.status === 'cancelled' ? 'cancelled' : 'pending',
        submittedAt: enrollment.createdAt ? (typeof enrollment.createdAt === 'string' ? enrollment.createdAt : enrollment.createdAt.toString()) : null,
        amountPaid: typeof enrollment.amountPaid === 'number' ? enrollment.amountPaid : 0,
        transactionId: enrollment.transactionId || null,
        rejectionReason: enrollment.rejectionReason || null,
        rejectedAt: enrollment.rejectedAt || null
      }
    })
    
    // Ensure we return an array
    return Array.isArray(transformed) ? transformed : []
  } catch (error) {
    console.error('Error reading payment screenshots:', error)
    return []
  }
}

/**
 * Get payment screenshot by enrollment ID
 */
export const getPaymentScreenshot = async (enrollmentId) => {
  try {
    const screenshots = await getAllPaymentScreenshots()
    return screenshots.find(s => s.enrollmentId === enrollmentId) || null
  } catch (error) {
    console.error('Error getting payment screenshot:', error)
    return null
  }
}

/**
 * Get payment screenshot by course ID and student ID
 */
export const getPaymentScreenshotByCourseAndStudent = async (courseId, studentId) => {
  try {
    const screenshots = await getAllPaymentScreenshots()
    return screenshots.find(s => 
      String(s.courseId) === String(courseId) && 
      String(s.studentId) === String(studentId)
    ) || null
  } catch (error) {
    console.error('Error getting payment screenshot:', error)
    return null
  }
}

/**
 * Add a payment screenshot
 * Note: This is typically done during enrollment, but kept for backward compatibility
 */
export const addPaymentScreenshot = async (screenshotData) => {
  try {
    // Payment screenshots are typically added during enrollment
    // This function is kept for backward compatibility
    // The screenshot should be included in the enrollment data
    
    // If this is a new payment, notify admins
    // Note: Backend will create the notification with proper course title
    // This is kept for backward compatibility but backend notification is primary
    try {
      // Get actual course title from coursesData if not provided
      let courseTitle = screenshotData.courseTitle || ''
      if (!courseTitle && screenshotData.courseId) {
        const courseIdStr = String(screenshotData.courseId)
        const defaultCourse = coursesData.find(c => String(c.id) === courseIdStr)
        if (defaultCourse && defaultCourse.title) {
          courseTitle = defaultCourse.title
        }
      }
      
      // Only create notification if we have a proper course title
      if (courseTitle && courseTitle !== 'Course' && !courseTitle.startsWith('Default Course')) {
        await createNotification({
          userId: 'admin', // This will be handled by backend
          type: 'new_payment',
          title: 'New Payment Received',
          message: `New payment of PKR ${(screenshotData.amountPaid || 0).toLocaleString()} received from "${screenshotData.studentName || 'Student'}" for "${courseTitle}".`,
          data: {
            courseId: screenshotData.courseId,
            courseTitle: courseTitle,
            studentId: screenshotData.studentId,
            studentName: screenshotData.studentName,
            amountPaid: screenshotData.amountPaid,
            transactionId: screenshotData.transactionId
          }
        })
      }
    } catch (error) {
      console.error('Error creating new payment notification:', error)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error adding payment screenshot:', error)
    return { success: false, message: 'Failed to save screenshot' }
  }
}

/**
 * Update payment screenshot status (admin function)
 * This verifies the payment and activates the enrollment
 */
export const updatePaymentScreenshotStatus = async (screenshotId, status) => {
  try {
    // Use admin API to verify payment
    // screenshotId is actually enrollmentId in backend
    const response = await api.put(`/admin/enrollments/${screenshotId}/verify-payment`, {})
    
    return { success: true, enrollment: response.enrollment }
  } catch (error) {
    console.error('Error updating payment screenshot status:', error)
    const errorMessage = error.message || 'Failed to update status'
    return { success: false, message: errorMessage }
  }
}

/**
 * Reject payment and cancel enrollment (admin function)
 * This rejects the payment and cancels the enrollment
 */
export const rejectPaymentScreenshot = async (screenshotId, reason) => {
  try {
    // Use admin API to reject payment
    // screenshotId is actually enrollmentId in backend
    const response = await api.put(`/admin/enrollments/${screenshotId}/reject-payment`, {
      reason: reason || 'Payment verification failed'
    })
    
    return { success: true, enrollment: response.enrollment }
  } catch (error) {
    console.error('Error rejecting payment:', error)
    const errorMessage = error.message || 'Failed to reject payment'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get pending payment screenshots (for admin)
 */
export const getPendingPaymentScreenshots = async () => {
  try {
    const screenshots = await getAllPaymentScreenshots()
    return screenshots.filter(s => s.status === 'pending')
  } catch (error) {
    console.error('Error getting pending payment screenshots:', error)
    return []
  }
}

/**
 * Get confirmed payment screenshots (for admin)
 */
export const getConfirmedPaymentScreenshots = async () => {
  try {
    const screenshots = await getAllPaymentScreenshots()
    return screenshots.filter(s => s.status === 'confirmed')
  } catch (error) {
    console.error('Error getting confirmed payment screenshots:', error)
    return []
  }
}

/**
 * Check if payment is confirmed for a course enrollment
 */
export const isPaymentConfirmed = async (courseId, studentId) => {
  try {
    const screenshot = await getPaymentScreenshotByCourseAndStudent(courseId, studentId)
    return screenshot && screenshot.status === 'confirmed'
  } catch (error) {
    console.error('Error checking payment confirmation:', error)
    return false
  }
}
