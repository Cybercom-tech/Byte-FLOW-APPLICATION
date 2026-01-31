import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../utils/auth'
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearNotificationCache, NOTIFICATION_TYPES } from '../utils/notifications'

function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  const currentUser = getCurrentUser()
  const userId = currentUser?.id

  // Load notifications
  const loadNotifications = async () => {
    if (!userId) return
    
    try {
      const allNotifications = await getNotifications(userId, false)
      const unread = await getUnreadNotificationCount(userId)
      setNotifications(Array.isArray(allNotifications) ? allNotifications : [])
      setUnreadCount(typeof unread === 'number' ? unread : 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    if (!userId || !isOpen) return
    
    // Clear cache when dropdown opens to ensure fresh data
    clearNotificationCache()
    loadNotifications()

    // Listen for new notifications
    const handleNewNotification = async (event) => {
      if (event.detail && String(event.detail.userId) === String(userId)) {
        await loadNotifications()
      }
    }

    // Listen for notification reads
    const handleNotificationRead = async () => {
      await loadNotifications()
    }

    // Listen for storage changes (cross-tab updates)
    const handleStorageChange = async (event) => {
      if (event.key === 'user_notifications' || event.key === null) {
        await loadNotifications()
      }
    }

    window.addEventListener('newNotification', handleNewNotification)
    window.addEventListener('notificationRead', handleNotificationRead)
    window.addEventListener('allNotificationsRead', handleNotificationRead)
    window.addEventListener('storage', handleStorageChange)

    // Refresh notifications every 2 seconds when dropdown is open
    const interval = setInterval(() => {
      loadNotifications()
    }, 2000)

    return () => {
      window.removeEventListener('newNotification', handleNewNotification)
      window.removeEventListener('notificationRead', handleNotificationRead)
      window.removeEventListener('allNotificationsRead', handleNotificationRead)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [userId, isOpen])

  const handleMarkAsRead = async (notificationId) => {
    // Optimistically update UI immediately
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    
    // Mark as read via API
    await markNotificationAsRead(notificationId)
    
    // Reload to ensure consistency
    await loadNotifications()
  }

  const handleMarkAllAsRead = async () => {
    if (markingAllRead || !userId) return
    
    setMarkingAllRead(true)
    
    // Optimistically update UI immediately
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    
    // Mark all as read via API
    await markAllNotificationsAsRead(userId)
    
    // Reload to ensure consistency
    await loadNotifications()
    
    setMarkingAllRead(false)
  }

  const handleDelete = (notificationId, e) => {
    e.stopPropagation()
    deleteNotification(notificationId)
    loadNotifications()
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    const typeConfig = NOTIFICATION_TYPES[type] || { icon: 'bi-bell-fill', color: '#6c757d', bgColor: '#f8f9fa' }
    return typeConfig
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1040,
          backgroundColor: 'rgba(0,0,0,0.1)'
        }}
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '600px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8f9fa'
          }}
        >
          <h6 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#110a06' }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: '0.5rem',
                padding: '2px 8px',
                backgroundColor: '#dc3545',
                color: '#ffffff',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {unreadCount}
              </span>
            )}
          </h6>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              style={{
                padding: '4px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '0.85rem',
                color: '#6c757d',
                cursor: markingAllRead ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#6c757d' }}>
              <i className="bi bi-bell-slash" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'block', opacity: 0.5 }}></i>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const typeConfig = getNotificationIcon(notification.type)
              const isUnread = !notification.read
              
              return (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (isUnread) {
                      handleMarkAsRead(notification.id)
                    }
                  }}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: isUnread ? '#f8f9fa' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isUnread ? '#f8f9fa' : '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: typeConfig.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <i
                        className={`bi ${typeConfig.icon}`}
                        style={{ fontSize: '1.2rem', color: typeConfig.color }}
                      ></i>
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h6 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '0.95rem', fontWeight: isUnread ? '600' : '500', color: '#110a06' }}>
                            {notification.title}
                          </h6>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6c757d', lineHeight: '1.4' }}>
                            {notification.message}
                          </p>
                        </div>
                        {isUnread && (
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#0d6efd',
                              flexShrink: 0,
                              marginTop: '4px'
                            }}
                          ></div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#adb5bd' }}>
                          {formatTime(notification.createdAt)}
                        </span>
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          style={{
                            padding: '4px 6px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            color: '#adb5bd',
                            cursor: 'pointer',
                            opacity: 0.8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '24px',
                            minHeight: '24px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#dc3545'
                            e.currentTarget.style.opacity = 1
                            e.currentTarget.style.backgroundColor = '#fff5f5'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#adb5bd'
                            e.currentTarget.style.opacity = 0.8
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          title="Delete notification"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationDropdown

