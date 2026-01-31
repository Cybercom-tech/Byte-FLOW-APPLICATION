// Course Management Utility
// Manages courses using backend API

import api, { getToken } from './api'

// Cache for courses
let coursesCache = null
let cacheTimestamp = null
const CACHE_DURATION = 180000 // 3 minutes - longer cache for better performance

/**
 * Fetch courses from API
 */
const fetchCourses = async (includePending = false) => {
  try {
    const queryParam = includePending ? '?includePending=true' : ''
    // Use longer timeout (15s) for course fetching - backend may be slow on first request
    const response = await api.get(`/course/all-courses${queryParam}`, { includeAuth: false, timeout: 15000 })
    return response.courses || []
  } catch (error) {
    console.error('Error fetching courses:', error)
    // Return null instead of empty array to indicate error (allows preserving existing data)
    return null
  }
}

/**
 * Get all courses (both default and teacher-created)
 * @param {boolean} includePending - Whether to include pending courses (default: false for students, true for admins)
 */
export const getAllCourses = async (includePending = false) => {
  try {
    // Use cache if available and fresh (only for non-pending requests)
    const now = Date.now()
    if (!includePending && coursesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return coursesCache
    }

    // Fetch from API
    const courses = await fetchCourses(includePending)
    
    // If fetch returned null (error occurred), return cached data if available, otherwise empty array
    if (courses === null) {
      return coursesCache || []
    }
    
    // Transform backend format to frontend format
    const transformedCourses = courses.map(course => ({
      id: course._id, // Use _id as id for consistency
      _id: course._id, // Also keep _id for MongoDB ObjectId matching
      title: course.courseTitle || course.title || 'Untitled Course',
      description: course.shortDescription || course.description || '',
      fullDescription: course.longDescription || course.fullDescription || course.description || '',
      instructor: course.teacherId ? (typeof course.teacherId === 'object' ? course.teacherId.fullName : course.teacherId) : null,
      teacherId: course.teacherId ? (typeof course.teacherId === 'object' ? course.teacherId._id : course.teacherId) : null,
      teacherName: course.teacherId ? (typeof course.teacherId === 'object' ? course.teacherId.fullName : null) : null,
      teacher: course.teacherId ? (typeof course.teacherId === 'object' ? course.teacherId.fullName : null) : null,
      price: course.totalPriceOfCourse || course.price || 0,
      originalPrice: course.originalPriceOfCourse || course.originalPrice || course.totalPriceOfCourse || course.price || 0,
      duration: course.duration || '',
      level: Array.isArray(course.courseLevel) && course.courseLevel.length > 0 ? course.courseLevel[0] : (course.level || 'Beginner'),
      category: Array.isArray(course.courseCategories) && course.courseCategories.length > 0 ? course.courseCategories[0] : (course.category || ''),
      image: course.courseImage || course.image || course.thumbnail || '',
      learnings: course.learningOutcomeOfCourse || course.learnings || [],
      requirements: course.requirements || [],
      sections: course.contentOfCourse ? course.contentOfCourse.map((content, idx) => ({
        title: content.sectionTitle || `Section ${idx + 1}`,
        lectures: 1,
        duration: content.estimatedTime || '0min',
        items: content.topicTitle ? content.topicTitle.split(',').map((topic, itemIdx) => ({
          title: topic.trim(),
          duration: content.estimatedTime ? (content.estimatedTime.split(',')[itemIdx] || content.estimatedTime) : '0min',
          type: 'session'
        })) : []
      })) : (course.sections || []),
      status: course.isApproved ? 'approved' : (course.rejectedAt ? 'rejected' : (course.status || 'pending')),
      submittedAt: course.submittedAt || course.createdAt,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      // Include other course fields
      ...course
    }))

    // Update cache (only for non-pending)
    if (!includePending) {
      coursesCache = transformedCourses
      cacheTimestamp = now
    }

    return transformedCourses
  } catch (error) {
    console.error('Error reading courses:', error)
    return []
  }
}

/**
 * Get pending courses (for admin review)
 */
export const getPendingCourses = async () => {
  try {
    const courses = await getAllCourses(true)
    return courses.filter(c => c.status === 'pending' || !c.status)
  } catch (error) {
    console.error('Error reading pending courses:', error)
    return []
  }
}

/**
 * Approve a course (admin function)
 */
export const approveCourse = async (courseId, adminId, adminName) => {
  try {
    // Check if token exists before making the request
    const token = getToken()
    if (!token) {
      console.error('No authentication token found. Please log out and log back in.')
      return { 
        success: false, 
        message: 'No authentication token found. Please log out and log back in to refresh your session.' 
      }
    }

    // Ensure the API call includes authentication
    const response = await api.put(`/admin/courses/${courseId}/approve`, {}, { includeAuth: true })
    
    // Clear cache
    coursesCache = null
    cacheTimestamp = null
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('courseApproved', {
      detail: { courseId, adminId }
    }))
    
    return { success: true, course: response.course }
  } catch (error) {
    console.error('Error approving course:', error)
    const errorMessage = error.message || 'Failed to approve course'
    
    // Provide more helpful error messages
    if (errorMessage.includes('No token provided') || errorMessage.includes('Access denied')) {
      return { 
        success: false, 
        message: 'Authentication failed. Please log out and log back in. Make sure the admin account exists in the backend database.' 
      }
    }
    
    return { success: false, message: errorMessage }
  }
}

/**
 * Reject a course (admin function)
 */
export const rejectCourse = async (courseId, adminId, adminName, reason = '') => {
  try {
    // Check if token exists before making the request
    const token = getToken()
    if (!token) {
      console.error('No authentication token found. Please log out and log back in.')
      return { 
        success: false, 
        message: 'No authentication token found. Please log out and log back in to refresh your session.' 
      }
    }

    // Ensure the API call includes authentication
    const response = await api.put(`/admin/courses/${courseId}/reject`, {
      reason: reason
    }, { includeAuth: true })
    
    // Clear cache
    coursesCache = null
    cacheTimestamp = null
    
    return { success: true, course: response.course }
  } catch (error) {
    console.error('Error rejecting course:', error)
    const errorMessage = error.message || 'Failed to reject course'
    
    // Provide more helpful error messages
    if (errorMessage.includes('No token provided') || errorMessage.includes('Access denied')) {
      return { 
        success: false, 
        message: 'Authentication failed. Please log out and log back in. Make sure the admin account exists in the backend database.' 
      }
    }
    
    return { success: false, message: errorMessage }
  }
}

/**
 * Save a new course created by a teacher or update an existing course
 * Courses are saved with 'pending' status and need admin approval
 * If courseData.id is a MongoDB ObjectId, it will update the existing course
 */
export const saveTeacherCourse = async (courseData) => {
  try {
    // Check if this is an update (course has a MongoDB ObjectId)
    // Check both id and _id fields for MongoDB ObjectId
    const courseId = courseData._id || courseData.id
    const objectIdPattern = /^[0-9a-fA-F]{24}$/
    const courseIdStr = courseId ? String(courseId) : ''
    const isUpdate = courseIdStr && objectIdPattern.test(courseIdStr)
    
    console.log('saveTeacherCourse - courseId:', courseId, 'courseIdStr:', courseIdStr, 'isUpdate:', isUpdate)
    
    let response
    if (isUpdate) {
      // Update existing course - remove id and _id from body since it's in the URL
      const { id, _id, ...updateData } = courseData
      console.log('Updating course with ID:', courseIdStr)
      response = await api.put(`/course/${courseIdStr}`, updateData, { includeAuth: true })
    } else {
      // Create new course - remove id and _id if they exist (backend will generate it)
      const { id, _id, ...createData } = courseData
      console.log('Creating new course')
      response = await api.post('/course/create-course', createData, { includeAuth: true })
    }
    
    // Clear cache
    coursesCache = null
    cacheTimestamp = null
    myCoursesCache = null
    myCoursesCacheTimestamp = null
    
    // Transform response - map backend field names to frontend field names
    const course = response.course || courseData
    const transformedCourse = {
      id: course._id || course.id,
      // Map backend fields to frontend fields
      title: course.courseTitle || course.title || '',
      description: course.shortDescription || course.description || '',
      fullDescription: course.longDescription || course.fullDescription || '',
      category: Array.isArray(course.courseCategories) && course.courseCategories.length > 0 
        ? course.courseCategories[0] 
        : (course.category || ''),
      level: Array.isArray(course.courseLevel) && course.courseLevel.length > 0
        ? course.courseLevel[0]
        : (course.level || 'Beginner'),
      price: course.totalPriceOfCourse || course.price || 0,
      originalPrice: course.originalPriceOfCourse || course.originalPrice || course.price || 0,
      image: course.courseImage || course.image || '',
      learnings: course.learningOutcomeOfCourse || course.learnings || [],
      requirements: course.requirements || [],
      sections: Array.isArray(course.contentOfCourse) ? course.contentOfCourse.map(content => ({
        title: content.sectionTitle || content.title || '',
        sectionTitle: content.sectionTitle || content.title || '',
        topicTitle: content.topicTitle || '',
        estimatedTime: content.estimatedTime || '',
        duration: content.estimatedTime || '',
        items: content.topicTitle ? content.topicTitle.split(', ').map((topic, index) => {
          const times = content.estimatedTime ? content.estimatedTime.split(', ') : []
          return {
            title: topic.trim(),
            duration: times[index] || '0 min',
            type: 'session'
          }
        }) : []
      })) : [],
      // Include all original fields
      ...course,
      status: course.isApproved ? 'approved' : (course.rejectedAt ? 'rejected' : 'pending')
    }
    
    return { success: true, course: transformedCourse }
  } catch (error) {
    console.error('Error saving course:', error)
    console.error('Error data:', error.data)
    console.error('Error status:', error.status)
    
    // Extract detailed error message
    let errorMessage = 'Failed to save course'
    
    // Handle network errors (Failed to fetch)
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ERR_FAILED'))) {
      errorMessage = 'Network error: Unable to connect to the server. Please check that the backend server is running at http://localhost:5000 (or your configured API URL) and that CORS is properly configured.'
    }
    // Handle authentication errors
    else if (error.status === 401 || error.message?.includes('No token') || error.message?.includes('Unauthorized')) {
      errorMessage = 'Authentication required. Please log out and log back in to refresh your session.'
    }
    // Handle API errors with data
    else if (error.data) {
      console.error('Error data details:', JSON.stringify(error.data, null, 2))
      
      if (error.data.missingFields && Array.isArray(error.data.missingFields)) {
        errorMessage = `Missing required fields: ${error.data.missingFields.join(', ')}`
      } else if (error.data.errors && Array.isArray(error.data.errors)) {
        const errorDetails = error.data.errors.map(e => {
          if (typeof e === 'object' && e.message) {
            return `${e.field || 'Unknown'}: ${e.message}`
          }
          return e.message || e
        }).join(', ')
        errorMessage = `Validation errors: ${errorDetails}`
      } else if (error.data.message) {
        errorMessage = error.data.message
      }
    } 
    // Handle error messages
    else if (error.message) {
      errorMessage = error.message
    }
    
    return { success: false, message: errorMessage, errorDetails: error.data }
  }
}

/**
 * Get instructor assignments (which teacher teaches which course)
 * Note: This is now handled by backend, kept for backward compatibility
 */
export const getInstructorAssignments = () => {
  // This is now handled by backend through course.teacherId
  // Keeping for backward compatibility
  return {}
}

/**
 * Assign a teacher as instructor to an existing course
 */
export const assignInstructorToCourse = async (courseId, teacherId, teacherName) => {
  try {
    // Check if teacher profile exists first
    const { hasTeacherProfile } = await import('./teacherProfile')
    const hasProfile = await hasTeacherProfile()
    
    if (!hasProfile) {
      return { 
        success: false, 
        message: 'Please complete your teacher profile before assigning courses. Go to Teacher Onboarding to create your profile.' 
      }
    }

    // Convert courseId to string (supports both MongoDB ObjectIds and numeric IDs for default courses)
    const courseIdStr = String(courseId)
    
    const response = await api.post(`/course/${courseIdStr}/assign-teacher`, {})
    
    // Clear cache after assignment
    myCoursesCache = null
    myCoursesCacheTimestamp = null
    
    return { success: true, message: response.message || 'Successfully assigned to course' }
  } catch (error) {
    // Log all errors for debugging with full details
    console.error('Error assigning instructor to course:', {
      error,
      message: error.message,
      status: error.status,
      data: error.data,
      courseId,
      teacherId,
      stack: error.stack
    })
    
    // Extract error message from response
    let errorMessage = 'Failed to assign instructor to course'
    
    // Handle network errors (Failed to fetch)
    if (error.message && error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and ensure the backend server is running.'
    } 
    // Handle API errors with status codes
    else if (error.status === 404) {
      errorMessage = error.data?.message || 'Course not found'
    } else if (error.status === 400) {
      errorMessage = error.data?.message || 'Invalid request. You may already be assigned to this course.'
    } else if (error.status === 403) {
      errorMessage = error.data?.message || 'Access denied. Please ensure you have a teacher profile.'
    } else if (error.status === 500) {
      errorMessage = error.data?.message || 'Server error. Please try again later.'
    } 
    // Handle error messages from API response
    else if (error.message) {
      errorMessage = error.message
    } else if (error.data && error.data.message) {
      errorMessage = error.data.message
    } else if (error.data && typeof error.data === 'string') {
      errorMessage = error.data
    }
    
    return { success: false, message: errorMessage }
  }
}

/**
 * Get which courses are already taught by another teacher (for Select Existing Courses page)
 * @param {string[]|number[]} courseIds - List of course IDs to check
 * @returns {Promise<Record<string, { taughtBy: string } | null>>} assignmentStatus keyed by courseId
 */
export const getCoursesAssignmentStatus = async (courseIds) => {
  try {
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return {}
    }
    const idsParam = courseIds.map(c => encodeURIComponent(String(c))).join(',')
    // Use GET with query param so body parsing is not required; backend supports both POST and GET
    const response = await api.get(`/course/assignment-status?courseIds=${idsParam}`, { includeAuth: true })
    const status = response?.assignmentStatus ?? response?.data?.assignmentStatus
    return status && typeof status === 'object' ? status : {}
  } catch (error) {
    console.error('Error fetching courses assignment status:', error)
    return {}
  }
}

/**
 * Get instructor name for a course
 * Works for both database courses and default courses (numeric IDs)
 */
export const getCourseInstructor = async (courseId) => {
  try {
    // First try to get instructor from backend API (handles both database and assigned courses)
    const response = await api.get(`/course/${courseId}/instructor`, { includeAuth: false })
    if (response.instructor) {
      return response.instructor.name || response.instructor.fullName || null
    }
    
    // Fallback: check courses from getAllCourses (for database courses)
    const courses = await getAllCourses(true)
    const course = courses.find(c => String(c.id) === String(courseId))
    return course?.instructor || null
  } catch (error) {
    // If 404, course might not exist or have no instructor - that's okay
    if (error.status === 404) {
      // Fallback to checking courses list
      try {
        const courses = await getAllCourses(true)
        const course = courses.find(c => String(c.id) === String(courseId))
        return course?.instructor || null
      } catch (fallbackError) {
        return null
      }
    }
    console.error('Error getting course instructor:', error)
    return null
  }
}

// Cache for teacher's own courses to avoid duplicate API calls
let myCoursesCache = null
let myCoursesCacheTimestamp = null
const MY_COURSES_CACHE_DURATION = 180000 // 3 minutes - longer cache for better performance

// Track pending request to avoid duplicate concurrent calls
let pendingMyCoursesRequest = null

/**
 * Internal: Fetch teacher's courses from API (shared cache)
 * PERFORMANCE OPTIMIZED: Single API call shared between getCoursesByTeacher and getCoursesAssignedToTeacher
 */
const fetchMyCoursesWithCache = async () => {
  const now = Date.now()
  
  // Return cached data if fresh
  if (myCoursesCache && myCoursesCacheTimestamp && (now - myCoursesCacheTimestamp) < MY_COURSES_CACHE_DURATION) {
    return myCoursesCache
  }
  
  // If there's already a pending request, wait for it (prevent duplicate calls)
  if (pendingMyCoursesRequest) {
    return await pendingMyCoursesRequest
  }
  
  // Create new request
  pendingMyCoursesRequest = (async () => {
    try {
      // Check if teacher profile exists before making API call
      const { hasTeacherProfile } = await import('./teacherProfile')
      const hasProfile = await hasTeacherProfile()
      
      if (!hasProfile) {
        pendingMyCoursesRequest = null
        return { courses: [], hasProfile: false }
      }
      
      // Use longer timeout for this endpoint (15 seconds)
      const response = await api.get('/course/my-courses', { timeout: 15000 })
      const courses = response.courses || []
      
      // Cache the result
      myCoursesCache = { courses, hasProfile: true }
      myCoursesCacheTimestamp = Date.now()
      
      pendingMyCoursesRequest = null
      return myCoursesCache
    } catch (error) {
      pendingMyCoursesRequest = null
      throw error
    }
  })()
  
  return await pendingMyCoursesRequest
}

/**
 * Clear my courses cache (call after creating/modifying courses)
 */
export const clearMyCoursesCache = () => {
  myCoursesCache = null
  myCoursesCacheTimestamp = null
}

// Cache for public teacher courses
const publicTeacherCoursesCache = new Map()
const PUBLIC_TEACHER_COURSES_CACHE_DURATION = 60000 // 1 minute

/**
 * Get teacher stats (student count, etc.) - PUBLIC
 */
export const getPublicTeacherStats = async (teacherId) => {
  try {
    if (!teacherId) {
      return { studentsEnrolled: 0, coursesCount: 0 }
    }
    
    const response = await api.get(`/course/teacher-stats/${teacherId}`, { includeAuth: false })
    return {
      studentsEnrolled: response.studentsEnrolled || 0,
      coursesCount: response.coursesCount || 0
    }
  } catch (error) {
    console.error('Error fetching teacher stats:', error)
    return { studentsEnrolled: 0, coursesCount: 0 }
  }
}

/**
 * Get courses by a specific teacher ID (PUBLIC - for viewing other teachers' profiles)
 * This fetches both created and assigned courses for a teacher
 */
export const getPublicCoursesByTeacher = async (teacherId) => {
  try {
    if (!teacherId) {
      console.log('getPublicCoursesByTeacher: No teacherId provided')
      return []
    }
    
    const cacheKey = String(teacherId)
    const now = Date.now()
    
    // Check cache first
    const cached = publicTeacherCoursesCache.get(cacheKey)
    if (cached && (now - cached.timestamp) < PUBLIC_TEACHER_COURSES_CACHE_DURATION) {
      console.log('getPublicCoursesByTeacher: Using cached data for', teacherId)
      return cached.courses
    }
    
    console.log('getPublicCoursesByTeacher: Fetching for teacherId:', teacherId)
    // Call the public endpoint with longer timeout
    const response = await api.get(`/course/by-teacher/${teacherId}`, { includeAuth: false, timeout: 30000 })
    console.log('getPublicCoursesByTeacher: API response:', response)
    const courses = response.courses || []
    
    // Transform to frontend format
    const transformedCourses = courses.map(course => {
      const courseId = course._id || course.id || course.courseId
      
      return {
        id: courseId,
        title: course.courseTitle || course.title || '',
        description: course.shortDescription || course.description || '',
        fullDescription: course.longDescription || course.fullDescription || '',
        category: Array.isArray(course.courseCategories) && course.courseCategories.length > 0 
          ? course.courseCategories[0] 
          : (course.category || ''),
        level: Array.isArray(course.courseLevel) && course.courseLevel.length > 0
          ? course.courseLevel[0]
          : (course.level || 'Beginner'),
        price: course.totalPriceOfCourse || course.price || 0,
        originalPrice: course.originalPriceOfCourse || course.originalPrice || course.price || 0,
        image: course.courseImage || course.image || '',
        learnings: course.learningOutcomeOfCourse || course.learnings || [],
        requirements: course.requirements || [],
        sections: Array.isArray(course.contentOfCourse) ? course.contentOfCourse.map(content => ({
          title: content.sectionTitle || content.title || '',
          duration: content.estimatedTime || '',
        })) : [],
        isCreatedCourse: course.isCreatedCourse || false,
        isAssignedCourse: course.isAssignedCourse || false,
        status: course.isApproved ? 'approved' : (course.rejectedAt ? 'rejected' : 'pending'),
        ...course
      }
    })
    
    // Cache the result
    publicTeacherCoursesCache.set(cacheKey, {
      courses: transformedCourses,
      timestamp: now
    })
    
    return transformedCourses
  } catch (error) {
    console.error('Error fetching public teacher courses:', error)
    
    // On error, return cached data if available (even if stale)
    const cacheKey = String(teacherId)
    const cached = publicTeacherCoursesCache.get(cacheKey)
    if (cached) {
      console.log('getPublicCoursesByTeacher: Returning stale cache due to error')
      return cached.courses
    }
    
    return []
  }
}

/**
 * Get courses created by a specific teacher
 * PERFORMANCE OPTIMIZED: Uses shared cache to avoid duplicate API calls
 */
export const getCoursesByTeacher = async (teacherId) => {
  try {
    const { courses, hasProfile } = await fetchMyCoursesWithCache()
    
    if (!hasProfile) {
      return []
    }
    
    // Filter to only return courses CREATED by the teacher (not assigned courses)
    // Backend marks created courses with isCreatedCourse: true
    const createdCourses = courses.filter(course => {
      // Only include courses marked as created (exclude assigned courses)
      return course.isCreatedCourse === true && !course.isAssignedCourse
    })
    
    // Transform to frontend format - map backend field names to frontend field names
    return createdCourses.map(course => {
      // Handle both database courses
      const courseId = course._id || course.id || course.courseId
      
      // Map backend field names to frontend field names
      return {
        id: courseId,
        // Map backend fields to frontend fields
        title: course.courseTitle || course.title || '',
        description: course.shortDescription || course.description || '',
        fullDescription: course.longDescription || course.fullDescription || '',
        category: Array.isArray(course.courseCategories) && course.courseCategories.length > 0 
          ? course.courseCategories[0] 
          : (course.category || ''),
        level: Array.isArray(course.courseLevel) && course.courseLevel.length > 0
          ? course.courseLevel[0]
          : (course.level || 'Beginner'),
        price: course.totalPriceOfCourse || course.price || 0,
        originalPrice: course.originalPriceOfCourse || course.originalPrice || course.price || 0,
        image: course.courseImage || course.image || '',
        learnings: course.learningOutcomeOfCourse || course.learnings || [],
        requirements: course.requirements || [],
        sections: Array.isArray(course.contentOfCourse) ? course.contentOfCourse.map(content => ({
          title: content.sectionTitle || content.title || '',
          sectionTitle: content.sectionTitle || content.title || '',
          topicTitle: content.topicTitle || '',
          estimatedTime: content.estimatedTime || '',
          duration: content.estimatedTime || '',
          // Parse items from topicTitle and estimatedTime if needed
          items: content.topicTitle ? content.topicTitle.split(', ').map((topic, index) => {
            const times = content.estimatedTime ? content.estimatedTime.split(', ') : []
            return {
              title: topic.trim(),
              duration: times[index] || '0 min',
              type: 'session'
            }
          }) : []
        })) : [],
        // Include all original fields
        ...course,
        status: course.isApproved ? 'approved' : (course.rejectedAt ? 'rejected' : 'pending')
      }
    })
  } catch (error) {
    // Don't log 404/500 errors - teacher profile not existing is expected for new teachers
    if (error.status !== 404 && error.status !== 500) {
      console.error('Error getting teacher courses:', error)
    }
    return []
  }
}

/**
 * Get courses where a teacher is assigned as instructor (but didn't create)
 * This only returns courses they're assigned to, NOT courses they created
 * PERFORMANCE OPTIMIZED: Uses shared cache to avoid duplicate API calls
 */
export const getCoursesAssignedToTeacher = async (teacherId) => {
  try {
    const { courses, hasProfile } = await fetchMyCoursesWithCache()
    
    if (!hasProfile) {
      return []
    }
    
    // Filter to only return courses ASSIGNED to the teacher (not created courses)
    // Backend marks assigned courses with isAssignedCourse: true
    const assignedCourses = courses.filter(course => {
      // Only include courses marked as assigned (exclude created courses)
      return course.isAssignedCourse === true && !course.isCreatedCourse
    })
    
    // Return course IDs
    return assignedCourses.map(c => {
      // Handle both database courses and default courses (numeric IDs)
      return c.id || c._id || c.courseId
    }).filter(Boolean)
  } catch (error) {
    // Don't log 404/500 errors - teacher profile not existing is expected for new teachers
    if (error.status !== 404 && error.status !== 500) {
      console.error('Error getting assigned courses:', error)
    }
    return []
  }
}

/**
 * Remove instructor assignment from a course
 * Note: This is now handled by backend, kept for backward compatibility
 */
export const removeInstructorFromCourse = async (courseId) => {
  try {
    const response = await api.delete(`/course/${courseId}/assign-teacher`)
    
    // Clear cache after removal
    myCoursesCache = null
    myCoursesCacheTimestamp = null
    
    return { success: true, message: response.message }
  } catch (error) {
    console.error('Error removing instructor from course:', error)
    const errorMessage = error.message || 'Failed to remove instructor from course'
    return { success: false, message: errorMessage }
  }
}

/**
 * Delete a teacher-created course
 */
export const deleteTeacherCourse = async (courseId) => {
  try {
    await api.delete(`/course/${courseId}`)
    
    // Clear cache
    coursesCache = null
    cacheTimestamp = null
    myCoursesCache = null
    myCoursesCacheTimestamp = null
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting course:', error)
    const errorMessage = error.message || 'Failed to delete course'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get single course by ID
 * Handles both default courses (numeric IDs from coursesData) and database courses (MongoDB ObjectIds)
 */
export const getCourseById = async (courseId) => {
  try {
    const courseIdStr = String(courseId)
    
    // Check if courseId is a numeric ID (default course) or MongoDB ObjectId
    const objectIdPattern = /^[0-9a-fA-F]{24}$/
    const isObjectId = objectIdPattern.test(courseIdStr)
    const numericId = parseInt(courseIdStr)
    const isNumeric = !isNaN(numericId) && String(numericId) === courseIdStr
    
    // If it's a numeric ID, check coursesData first (default courses)
    if (isNumeric && !isObjectId) {
      const { coursesData } = await import('../pages/Training/coursesData')
      const defaultCourse = coursesData.find(c => c.id === numericId)
      if (defaultCourse) {
        return defaultCourse
      }
    }
    
    // If it's a MongoDB ObjectId or not found in coursesData, try API
    if (isObjectId || !isNumeric) {
      try {
        const response = await api.get(`/course/${courseId}`, { includeAuth: false })
        const course = response.course
        
        if (!course) {
          return null
        }
        
        // Transform to frontend format
        return {
          id: course._id,
          title: course.courseTitle || course.title,
          description: course.shortDescription || course.description,
          fullDescription: course.longDescription || course.fullDescription || course.description,
          instructor: course.teacherId ? (typeof course.teacherId === 'object' ? course.teacherId.fullName : course.teacherId) : null,
          teacherId: course.teacherId ? (typeof course.teacherId === 'object' ? course.teacherId._id : course.teacherId) : null,
          price: course.totalPriceOfCourse || course.price || 0,
          originalPrice: course.originalPriceOfCourse || course.originalPrice || course.price || 0,
          duration: course.duration || '',
          level: Array.isArray(course.courseLevel) && course.courseLevel.length > 0 ? course.courseLevel[0] : (course.level || 'Beginner'),
          category: Array.isArray(course.courseCategories) && course.courseCategories.length > 0 ? course.courseCategories[0] : (course.category || ''),
          image: course.courseImage || course.image || course.thumbnail || '',
          learnings: course.learningOutcomeOfCourse || course.learnings || [],
          requirements: course.requirements || [],
          sections: course.contentOfCourse ? course.contentOfCourse.map((content, idx) => ({
            title: content.sectionTitle || `Section ${idx + 1}`,
            lectures: 1,
            duration: content.estimatedTime || '0min',
            items: content.topicTitle ? content.topicTitle.split(',').map((topic, itemIdx) => ({
              title: topic.trim(),
              duration: content.estimatedTime ? (content.estimatedTime.split(',')[itemIdx] || content.estimatedTime) : '0min',
              type: 'session'
            })) : []
          })) : (course.sections || []),
          status: course.isApproved ? 'approved' : (course.rejectedAt ? 'rejected' : 'pending'),
          ...course
        }
      } catch (apiError) {
        // If 404, course doesn't exist in database - that's okay
        if (apiError.status === 404) {
          return null
        }
        // For other errors, log and return null
        console.error('Error getting course from API:', apiError)
        return null
      }
    }
    
    // If numeric ID not found in coursesData and not an ObjectId, return null
    return null
  } catch (error) {
    console.error('Error getting course:', error)
    return null
  }
}
