// Notification Utility
// Manages notifications using backend API

import api from './api'
import { getCurrentUser } from './auth'
import { coursesData } from '../pages/Training/coursesData'
import { getAllCourses } from './courseManagement'

// Cache for notifications
let notificationsCache = null
let cacheTimestamp = null
const CACHE_DURATION = 10000 // 10 seconds

/**
 * Clear notification cache (useful when notifications are updated)
 */
export const clearNotificationCache = () => {
  notificationsCache = null
  cacheTimestamp = null
}

/**
 * Update notification in cache (optimistic update)
 */
const updateNotificationInCache = (notificationId, updates) => {
  if (notificationsCache && Array.isArray(notificationsCache)) {
    const index = notificationsCache.findIndex(n => String(n.id) === String(notificationId))
    if (index !== -1) {
      notificationsCache[index] = { ...notificationsCache[index], ...updates }
    }
  }
}

/**
 * Fetch notifications from API
 */
const fetchNotifications = async () => {
  try {
    const response = await api.get('/notifications/mynotification')
    return response.notifications || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Get all notifications for a user
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @param {boolean} unreadOnly - Whether to return only unread notifications
 */
export const getNotifications = async (userId = null, unreadOnly = false) => {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser && !userId) {
      return []
    }

    // Use cache if available and fresh
    const now = Date.now()
    if (notificationsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      let userNotifications = notificationsCache
      
      // Filter by userId if provided
      if (userId) {
        userNotifications = userNotifications.filter(n => String(n.userId) === String(userId))
      }
      
      if (unreadOnly) {
        userNotifications = userNotifications.filter(n => !n.read)
      }
      
      return userNotifications
    }

    // Fetch from API
    const notifications = await fetchNotifications()
    
    // Pre-fetch teacher courses for course title enrichment
    let allTeacherCourses = []
    try {
      allTeacherCourses = await getAllCourses(false)
      if (!Array.isArray(allTeacherCourses)) {
        allTeacherCourses = []
      }
    } catch (error) {
      console.warn('Error fetching teacher courses for notification enrichment:', error)
    }
    
    // Helper function to get course title by ID
    const getCourseTitleById = (courseId) => {
      if (!courseId) return null
      
      const courseIdStr = String(courseId)
      
      // Try to find in coursesData (default courses)
      const defaultCourse = coursesData.find(c => String(c.id) === courseIdStr)
      if (defaultCourse && defaultCourse.title) {
        return defaultCourse.title
      }
      
      // Try to find in teacher courses
      const teacherCourse = allTeacherCourses.find(
        c => String(c.id) === courseIdStr || String(c._id) === courseIdStr
      )
      if (teacherCourse && (teacherCourse.title || teacherCourse.courseTitle)) {
        return teacherCourse.title || teacherCourse.courseTitle
      }
      
      return null
    }
    
    // Helper function to enrich course names in messages
    const enrichCourseNameInMessage = (message, notificationData = {}) => {
      if (!message || typeof message !== 'string') return message
      
      let enrichedMessage = message
      
      // First, try to get course ID from notification data
      const courseIdFromData = notificationData.courseId || notificationData.course_id
      if (courseIdFromData) {
        const courseTitle = getCourseTitleById(courseIdFromData)
        if (courseTitle) {
          // Replace generic course names with actual title
          enrichedMessage = enrichedMessage.replace(/"Course \d+"/g, `"${courseTitle}"`)
          enrichedMessage = enrichedMessage.replace(/"Default Course \d+"/g, `"${courseTitle}"`)
          enrichedMessage = enrichedMessage.replace(/for "Course"/g, `for "${courseTitle}"`)
          enrichedMessage = enrichedMessage.replace(/for "the course"/g, `for "${courseTitle}"`)
          enrichedMessage = enrichedMessage.replace(/"Course"/g, `"${courseTitle}"`)
        }
      }
      
      // Pattern to match generic course names like "Course 4", "Default Course 4", "Course", "the course"
      const patterns = [
        { pattern: /"Course (\d+)"/g, extractId: (match) => match[1] },  // "Course 4"
        { pattern: /"Default Course (\d+)"/g, extractId: (match) => match[1] },  // "Default Course 4"
        { pattern: /for "Course"/g, extractId: null },  // for "Course"
        { pattern: /for "the course"/g, extractId: null },  // for "the course"
        { pattern: /"Course"/g, extractId: null }  // "Course"
      ]
      
      // Try to find course ID in the message and replace with actual course title
      patterns.forEach(({ pattern, extractId }) => {
        enrichedMessage = enrichedMessage.replace(pattern, (match, ...args) => {
          if (extractId) {
            const courseId = extractId([match, ...args])
            if (courseId) {
              const courseTitle = getCourseTitleById(courseId)
              if (courseTitle) {
                return `"${courseTitle}"`
              }
            }
          }
          return match // Keep original if we can't determine the course
        })
      })
      
      return enrichedMessage
    }
    
    // Transform backend format to frontend format
    const transformedNotifications = notifications.map(notification => {
      // Enrich message with actual course names (use notification data if available)
      const enrichedMessage = enrichCourseNameInMessage(notification.message, notification.data || {})
      
      return {
        id: notification._id,
        userId: notification.receiverId,
        type: notification.type,
        title: notification.title || getNotificationTitle(notification.type),
        message: enrichedMessage,
        data: notification.data || {},
        read: notification.isRead || false,
        createdAt: notification.createdAt
      }
    })

    // Sort by date (newest first)
    transformedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Update cache
    notificationsCache = transformedNotifications
    cacheTimestamp = now

    // Filter by userId if provided
    let userNotifications = transformedNotifications
    if (userId) {
      userNotifications = transformedNotifications.filter(n => String(n.userId) === String(userId))
    }

    if (unreadOnly) {
      userNotifications = userNotifications.filter(n => !n.read)
    }

    return userNotifications
  } catch (error) {
    console.error('Error reading notifications:', error)
    return []
  }
}

/**
 * Get notification title based on type
 */
const getNotificationTitle = (type) => {
  const titles = {
    payment_approved: 'Payment Approved!',
    payment_rejected: 'Payment Rejected',
    student_assigned: 'New Student Enrolled!',
    course_approved: 'Course Approved!',
    new_payment: 'New Payment Received',
    course_submitted: 'New Course Submitted',
    course_completed: 'Course Completed!',
    General: 'General Notification',
    Announcement: 'New Announcement',
    Reminder: 'Reminder'
  }
  return titles[type] || 'Notification'
}

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId = null) => {
  try {
    const notifications = await getNotifications(userId, true)
    return notifications.length
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}

/**
 * Create a new notification
 * Note: This is typically done by backend, but kept for backward compatibility
 * @param {Object} notificationData
 */
export const createNotification = async (notificationData) => {
  try {
    // For teacher broadcast, use API
    const currentUser = getCurrentUser()
    if (currentUser && currentUser.userType === 'teacher') {
      try {
        const response = await api.post('/notifications/broadcast', {
          type: notificationData.type,
          message: notificationData.message || notificationData.title
        })
        
        // Clear cache to force refresh
        clearNotificationCache()
        
        // Dispatch event for new notifications
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: { count: response.count }
        }))
        
        return { success: true, count: response.count }
      } catch (error) {
        console.error('Error broadcasting notification:', error)
      }
    }
    
    // For other cases, notifications are created by backend
    // This function is kept for backward compatibility
    return { success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, message: 'Failed to create notification' }
  }
}

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    // Optimistically update cache immediately
    updateNotificationInCache(notificationId, { read: true })
    
    // Dispatch event immediately for instant UI update
    window.dispatchEvent(new CustomEvent('notificationRead', {
      detail: { notificationId }
    }))
    
    // Make API call
    await api.put(`/notifications/${notificationId}/read`, {})
    
    // Clear cache to force refresh on next fetch (ensures consistency)
    clearNotificationCache()
    
    // Dispatch event again after API call completes
    window.dispatchEvent(new CustomEvent('notificationRead', {
      detail: { notificationId }
    }))
    
    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    
    // Revert optimistic update on error
    updateNotificationInCache(notificationId, { read: false })
    
    // Clear cache to force refresh
    clearNotificationCache()
    
    // Dispatch error event
    window.dispatchEvent(new CustomEvent('notificationReadError', {
      detail: { notificationId, error }
    }))
    
    const errorMessage = error.message || 'Failed to mark notification as read'
    return { success: false, message: errorMessage }
  }
}

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId = null) => {
  try {
    const notifications = await getNotifications(userId, true)
    
    // Optimistically update all notifications in cache
    if (notificationsCache && Array.isArray(notificationsCache)) {
      notifications.forEach(notification => {
        updateNotificationInCache(notification.id, { read: true })
      })
    }
    
    // Dispatch event immediately
    window.dispatchEvent(new CustomEvent('allNotificationsRead', {
      detail: { userId, count: notifications.length }
    }))
    
    // Mark each unread notification as read via API
    const promises = notifications.map(notification => 
      api.put(`/notifications/${notification.id}/read`, {}).catch(err => {
        console.error(`Error marking notification ${notification.id} as read:`, err)
        // Revert optimistic update on error
        updateNotificationInCache(notification.id, { read: false })
      })
    )
    
    await Promise.all(promises)
    
    // Clear cache to force refresh
    clearNotificationCache()
    
    // Dispatch event again after API calls complete
    window.dispatchEvent(new CustomEvent('allNotificationsRead', {
      detail: { userId, count: notifications.length }
    }))
    
    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    clearNotificationCache()
    return { success: false, message: 'Failed to mark all notifications as read' }
  }
}

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    // Optimistically remove from cache immediately
    if (notificationsCache && Array.isArray(notificationsCache)) {
      notificationsCache = notificationsCache.filter(n => String(n.id) !== String(notificationId))
    }
    
    // Dispatch event immediately for instant UI update
    window.dispatchEvent(new CustomEvent('notificationDeleted', {
      detail: { notificationId }
    }))
    
    // Make API call to delete notification
    await api.delete(`/notifications/${notificationId}`)
    
    // Clear cache to force refresh on next fetch (ensures consistency)
    clearNotificationCache()
    
    // Dispatch event again after API call completes
    window.dispatchEvent(new CustomEvent('notificationDeleted', {
      detail: { notificationId }
    }))
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting notification:', error)
    
    // Clear cache to force refresh (to restore deleted notification if API call failed)
    clearNotificationCache()
    
    // Dispatch error event
    window.dispatchEvent(new CustomEvent('notificationDeleteError', {
      detail: { notificationId, error }
    }))
    
    const errorMessage = error.message || 'Failed to delete notification'
    return { success: false, message: errorMessage }
  }
}

// Notification type definitions with icons and colors
export const NOTIFICATION_TYPES = {
  payment_approved: {
    icon: 'bi-check-circle-fill',
    color: '#198754',
    bgColor: '#d1e7dd'
  },
  payment_rejected: {
    icon: 'bi-x-circle-fill',
    color: '#dc3545',
    bgColor: '#f8d7da'
  },
  student_assigned: {
    icon: 'bi-person-plus-fill',
    color: '#0d6efd',
    bgColor: '#cfe2ff'
  },
  course_approved: {
    icon: 'bi-check-circle-fill',
    color: '#198754',
    bgColor: '#d1e7dd'
  },
  new_payment: {
    icon: 'bi-currency-dollar',
    color: '#ffc107',
    bgColor: '#fff3cd'
  },
  course_submitted: {
    icon: 'bi-file-earmark-plus-fill',
    color: '#0d6efd',
    bgColor: '#cfe2ff'
  },
  course_completed: {
    icon: 'bi-trophy-fill',
    color: '#ffc107',
    bgColor: '#fff3cd'
  }
}
