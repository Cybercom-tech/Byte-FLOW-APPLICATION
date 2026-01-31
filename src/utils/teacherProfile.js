// Teacher Profile Utility
// Manages teacher profile data using backend API

import api from './api'
import { getCurrentUser } from './auth'

// Cache for teacher profile
let profileCache = null
let cacheTimestamp = null
let profileExistsCache = null // Cache for "profile exists" check (true/false/null)
let profileExistsTimestamp = null
let pendingProfileRequest = null // Promise for pending profile request to prevent duplicates
const CACHE_DURATION = 120000 // 2 minutes - longer cache for better performance
const PROFILE_EXISTS_CACHE_DURATION = 60000 // 1 minute for negative cache

/**
 * Fetch teacher profile from API
 * Uses a shared pending request to prevent duplicate concurrent calls
 */
const fetchTeacherProfile = async () => {
  // If there's already a pending request, wait for it
  if (pendingProfileRequest) {
    return await pendingProfileRequest
  }

  // Create new request
  pendingProfileRequest = (async () => {
    try {
      const response = await api.post('/teacher/me', {})
      pendingProfileRequest = null
      return response
    } catch (error) {
      pendingProfileRequest = null
      // Don't log 404 errors - teacher profile not existing is expected for new teachers
      // Don't log network errors if they're just temporary connection issues
      if (error.status !== 404) {
        // Only log if it's not a network error (Failed to fetch)
        if (error.message && !error.message.includes('Failed to fetch')) {
          console.error('Error fetching teacher profile:', error)
        }
      }
      return null
    }
  })()

  return await pendingProfileRequest
}

/**
 * Save teacher profile data (create profile)
 */
export const saveTeacherProfile = async (userId, profileData) => {
  try {
    console.log('Saving teacher profile with data:', profileData)
    const response = await api.post('/teacher/create-profile', profileData)
    console.log('Save response:', response)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    profileExistsCache = null
    profileExistsTimestamp = null
    
    // Check if response has teacher data
    // Backend returns: { message: "...", teacher: {...} }
    console.log('Full API response:', JSON.stringify(response, null, 2))
    
    if (response) {
      const teacherData = response.teacher || response
      
      console.log('Extracted teacher data:', teacherData)
      console.log('Teacher data keys:', teacherData ? Object.keys(teacherData) : 'null')
      
      if (teacherData && teacherData._id) {
        // Verify it's a valid teacher object (has _id)
        // Update cache with new profile immediately after save
        profileCache = teacherData
        cacheTimestamp = Date.now()
        profileExistsCache = true
        profileExistsTimestamp = Date.now()
        // Clear pending request to allow fresh fetches
        pendingProfileRequest = null
        
        console.log('Profile saved successfully, teacher data:', {
          id: teacherData._id,
          fullName: teacherData.fullName,
          profTitle: teacherData.profTitle,
          educationCount: teacherData.education?.length || 0,
          experienceCount: teacherData.experience?.length || 0,
          certificatesCount: teacherData.certificatesCourses?.length || 0
        })
        return { success: true, teacher: teacherData }
      } else {
        console.warn('Response received but no valid teacher data found:', {
          response,
          teacherData,
          hasId: teacherData?._id
        })
        return { success: false, message: 'Server response missing valid teacher data' }
      }
    } else {
      console.error('No response received from server')
      return { success: false, message: 'No response from server' }
    }
  } catch (error) {
    console.error('Error saving teacher profile:', error)
    
    // Extract detailed error message
    let errorMessage = 'Failed to save profile'
    if (error.data) {
      if (error.data.errors && Array.isArray(error.data.errors)) {
        errorMessage = `Validation errors: ${error.data.errors.join(', ')}`
      } else if (error.data.missingFields && Array.isArray(error.data.missingFields)) {
        errorMessage = `Missing required fields: ${error.data.missingFields.join(', ')}`
      } else if (error.data.message) {
        errorMessage = error.data.message
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return { success: false, message: errorMessage, errors: error.data?.errors || error.data?.missingFields }
  }
}

/**
 * Clear teacher profile cache (useful after saving)
 */
export const clearTeacherProfileCache = () => {
  profileCache = null
  cacheTimestamp = null
  profileExistsCache = null
  profileExistsTimestamp = null
  pendingProfileRequest = null
  console.log('Teacher profile cache cleared')
}

/**
 * Get teacher profile by user ID (own profile only)
 */
export const getTeacherProfile = async (userId) => {
  try {
    const currentUser = getCurrentUser()
    
    // Only allow getting own profile through this function
    if (!currentUser || String(currentUser.id) !== String(userId)) {
      return null
    }

    const now = Date.now()
    
    // Use cache if available
    if (profileCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      // Update exists cache when we have a profile
      profileExistsCache = true
      profileExistsTimestamp = now
      return profileCache
    }

    // Check negative cache first - if we recently confirmed profile doesn't exist, skip API call
    if (profileExistsCache === false && profileExistsTimestamp && (now - profileExistsTimestamp) < PROFILE_EXISTS_CACHE_DURATION) {
      return null
    }

    const profile = await fetchTeacherProfile()
    
    if (!profile) {
      // Cache that profile doesn't exist
      profileExistsCache = false
      profileExistsTimestamp = now
      return null
    }

    // Update cache
    profileCache = profile
    cacheTimestamp = now
    profileExistsCache = true
    profileExistsTimestamp = now

    return profile
  } catch (error) {
    // Cache that profile doesn't exist on error (likely 404)
    if (error.status === 404) {
      const now = Date.now()
      profileExistsCache = false
      profileExistsTimestamp = now
    }
    return null
  }
}

// Cache for public teacher profiles (by teacherId)
const publicProfileCache = new Map()
const PUBLIC_PROFILE_CACHE_DURATION = 60000 // 1 minute

/**
 * Get public teacher profile by teacher ID (for viewing other teachers' profiles)
 * This can be called by students or anyone to view a teacher's public profile
 */
export const getPublicTeacherProfile = async (teacherId) => {
  try {
    if (!teacherId) {
      return null
    }

    // Ensure teacherId is always a string (handle MongoDB ObjectId objects)
    const teacherIdString = typeof teacherId === 'object' && teacherId !== null
      ? (teacherId._id ? String(teacherId._id) : String(teacherId))
      : String(teacherId)

    const now = Date.now()
    const cacheKey = teacherIdString
    
    // Check cache first
    const cached = publicProfileCache.get(cacheKey)
    if (cached && (now - cached.timestamp) < PUBLIC_PROFILE_CACHE_DURATION) {
      return cached.profile
    }

    // Fetch from API (public endpoint, no auth required)
    const response = await api.get(`/teacher/profile/${teacherIdString}`, { includeAuth: false })
    
    if (response && response.teacher) {
      // Cache the result
      publicProfileCache.set(cacheKey, {
        profile: response.teacher,
        timestamp: now
      })
      return response.teacher
    }
    
    return null
  } catch (error) {
    // Don't log 404 errors - profile not found is expected for some IDs
    if (error.status !== 404) {
      console.error('Error fetching public teacher profile:', error)
    }
    return null
  }
}

/**
 * Check if teacher profile exists (uses cache if available)
 * Returns true if profile exists, false otherwise
 */
export const hasTeacherProfile = async () => {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.userType !== 'teacher') {
      return false
    }

    const now = Date.now()
    
    // Check profile cache first (if we have a profile, it exists)
    if (profileCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return true
    }

    // Check negative cache (if we recently checked and it didn't exist)
    if (profileExistsCache === false && profileExistsTimestamp && (now - profileExistsTimestamp) < PROFILE_EXISTS_CACHE_DURATION) {
      return false
    }

    // Try to fetch profile
    const profile = await fetchTeacherProfile()
    if (profile) {
      profileCache = profile
      cacheTimestamp = now
      profileExistsCache = true
      profileExistsTimestamp = now
      return true
    } else {
      // Cache negative result
      profileExistsCache = false
      profileExistsTimestamp = now
      return false
    }
  } catch (error) {
    // Cache negative result on error (likely 404)
    if (error.status === 404) {
      const now = Date.now()
      profileExistsCache = false
      profileExistsTimestamp = now
    }
    return false
  }
}

/**
 * Get all teacher profiles
 * Note: Backend doesn't have endpoint for all profiles, kept for backward compatibility
 */
export const getTeacherProfiles = () => {
  // Backend doesn't expose all teacher profiles
  // This is kept for backward compatibility
  return {}
}

/**
 * Update teacher profile
 */
export const updateTeacherProfile = async (userId, updates) => {
  try {
    // Teacher profile updates are done through specific endpoints
    // This function is kept for backward compatibility
    // Individual fields should be updated via their specific endpoints
    
    // If updating basic profile fields, use create-profile endpoint
    // (which updates if profile exists)
    const response = await api.post('/teacher/create-profile', updates)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true, teacher: response.teacher }
  } catch (error) {
    console.error('Error updating teacher profile:', error)
    const errorMessage = error.message || 'Failed to update profile'
    return { success: false, message: errorMessage }
  }
}

/**
 * Add education to teacher profile
 */
export const addEducation = async (educationData) => {
  try {
    const response = await api.post('/teacher/education', educationData)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true, teacher: response.teacher }
  } catch (error) {
    console.error('Error adding education:', error)
    const errorMessage = error.message || 'Failed to add education'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get educations for teacher
 */
export const getEducations = async () => {
  try {
    const response = await api.get('/teacher/education')
    return response.educations || []
  } catch (error) {
    console.error('Error getting educations:', error)
    return []
  }
}

/**
 * Update education
 */
export const updateEducation = async (educationId, updates) => {
  try {
    const response = await api.put(`/teacher/education/${educationId}`, updates)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true, education: response.education }
  } catch (error) {
    console.error('Error updating education:', error)
    const errorMessage = error.message || 'Failed to update education'
    return { success: false, message: errorMessage }
  }
}

/**
 * Delete education
 */
export const deleteEducation = async (educationId) => {
  try {
    await api.delete(`/teacher/education/${educationId}`)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting education:', error)
    const errorMessage = error.message || 'Failed to delete education'
    return { success: false, message: errorMessage }
  }
}

/**
 * Add experience to teacher profile
 */
export const addExperience = async (experienceData) => {
  try {
    const response = await api.post('/teacher/experience', experienceData)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true, teacher: response.teacher }
  } catch (error) {
    console.error('Error adding experience:', error)
    const errorMessage = error.message || 'Failed to add experience'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get experiences for teacher
 */
export const getExperiences = async () => {
  try {
    const response = await api.get('/teacher/experience')
    return response.experiences || []
  } catch (error) {
    console.error('Error getting experiences:', error)
    return []
  }
}

/**
 * Update experience
 */
export const updateExperience = async (experienceId, updates) => {
  try {
    const response = await api.put(`/teacher/experience/${experienceId}`, updates)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true, experience: response.experience }
  } catch (error) {
    console.error('Error updating experience:', error)
    const errorMessage = error.message || 'Failed to update experience'
    return { success: false, message: errorMessage }
  }
}

/**
 * Delete experience
 */
export const deleteExperience = async (experienceId) => {
  try {
    await api.delete(`/teacher/experience/${experienceId}`)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting experience:', error)
    const errorMessage = error.message || 'Failed to delete experience'
    return { success: false, message: errorMessage }
  }
}

/**
 * Add certificate to teacher profile
 */
export const addCertificate = async (certificateData) => {
  try {
    const response = await api.post('/teacher/certificate', certificateData)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true, teacher: response.teacher }
  } catch (error) {
    console.error('Error adding certificate:', error)
    const errorMessage = error.message || 'Failed to add certificate'
    return { success: false, message: errorMessage }
  }
}

/**
 * Get certificates for teacher
 */
export const getCertificates = async () => {
  try {
    const response = await api.get('/teacher/certificate')
    return response.certificates || []
  } catch (error) {
    console.error('Error getting certificates:', error)
    return []
  }
}

/**
 * Update certificate
 */
export const updateCertificate = async (certificateId, updates) => {
  try {
    const response = await api.put(`/teacher/certificate/${certificateId}`, updates)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true, certificate: response.certificate }
  } catch (error) {
    console.error('Error updating certificate:', error)
    const errorMessage = error.message || 'Failed to update certificate'
    return { success: false, message: errorMessage }
  }
}

/**
 * Delete certificate
 */
export const deleteCertificate = async (certificateId) => {
  try {
    await api.delete(`/teacher/certificate/${certificateId}`)
    
    // Clear cache
    profileCache = null
    cacheTimestamp = null
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting certificate:', error)
    const errorMessage = error.message || 'Failed to delete certificate'
    return { success: false, message: errorMessage }
  }
}

// ==================== REVIEW FUNCTIONS ====================

/**
 * Get all reviews for a teacher (public, no auth required)
 */
export const getTeacherReviews = async (teacherId) => {
  try {
    if (!teacherId) {
      return { reviews: [], totalReviews: 0, averageRating: 0 }
    }
    
    // Ensure teacherId is always a string (handle MongoDB ObjectId objects)
    const teacherIdString = typeof teacherId === 'object' && teacherId !== null
      ? (teacherId._id ? String(teacherId._id) : String(teacherId))
      : String(teacherId)
    
    const response = await api.get(`/reviews/teacher/${teacherIdString}`, { includeAuth: false })
    return {
      reviews: response.reviews || [],
      totalReviews: response.totalReviews || 0,
      averageRating: response.averageRating || 0
    }
  } catch (error) {
    console.error('Error fetching teacher reviews:', error)
    return { reviews: [], totalReviews: 0, averageRating: 0 }
  }
}

/**
 * Get completed courses available for review (for a specific teacher)
 */
export const getCompletedCoursesForReview = async (teacherId) => {
  try {
    if (!teacherId) {
      return { courses: [], totalCompleted: 0, totalReviewed: 0 }
    }
    
    const response = await api.get(`/reviews/completed-courses/${teacherId}`)
    return {
      courses: response.courses || [],
      totalCompleted: response.totalCompleted || 0,
      totalReviewed: response.totalReviewed || 0
    }
  } catch (error) {
    console.error('Error fetching completed courses for review:', error)
    return { courses: [], totalCompleted: 0, totalReviewed: 0 }
  }
}

/**
 * Create a review for a course
 */
export const createReview = async (teacherId, courseId, rating, reviewText) => {
  try {
    const response = await api.post('/reviews', {
      teacherId,
      courseId,
      rating,
      reviewText
    })
    
    return { 
      success: true, 
      review: response.review,
      message: response.message 
    }
  } catch (error) {
    console.error('Error creating review:', error)
    const errorMessage = error.data?.message || error.message || 'Failed to submit review'
    return { success: false, message: errorMessage }
  }
}

/**
 * Update an existing review
 */
export const updateReview = async (reviewId, rating, reviewText) => {
  try {
    const response = await api.put(`/reviews/${reviewId}`, {
      rating,
      reviewText
    })
    
    return { 
      success: true, 
      review: response.review,
      message: response.message 
    }
  } catch (error) {
    console.error('Error updating review:', error)
    const errorMessage = error.data?.message || error.message || 'Failed to update review'
    return { success: false, message: errorMessage }
  }
}

/**
 * Delete a review
 */
export const deleteReview = async (reviewId) => {
  try {
    await api.delete(`/reviews/${reviewId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting review:', error)
    const errorMessage = error.data?.message || error.message || 'Failed to delete review'
    return { success: false, message: errorMessage }
  }
}

/**
 * Check if current user can review a specific course
 */
export const canReviewCourse = async (teacherId, courseId) => {
  try {
    const response = await api.get(`/reviews/can-review/${teacherId}/${courseId}`)
    return {
      canReview: response.canReview || false,
      reason: response.reason || '',
      existingReview: response.existingReview || null
    }
  } catch (error) {
    console.error('Error checking review eligibility:', error)
    return { canReview: false, reason: 'Error checking eligibility' }
  }
}