import { useState, useEffect, useMemo, memo, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getAuthUser, logoutUser, getUserProfileLink, getCurrentUser, isAdmin, isGeneralAdmin, isPaymentAdmin } from '../utils/auth'
import { getTeacherProfile } from '../utils/teacherProfile'
import { getUnreadNotificationCount } from '../utils/notifications'
import NotificationDropdown from './NotificationDropdown'
const logo = '/assets/img/logo.png'

// Debounce utility
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function Header() {
  const [isMobileNavActive, setIsMobileNavActive] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [authState, setAuthState] = useState(getAuthUser())
  const [teacherProfile, setTeacherProfile] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = debounce(() => {
      setIsScrolled(window.scrollY > 100)
    }, 10) // Debounce scroll for better performance

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load teacher profile if user is a teacher
  useEffect(() => {
    const loadTeacherProfile = async () => {
      if (authState.user && authState.user.userType === 'teacher') {
        const currentUser = getCurrentUser()
        if (currentUser) {
          try {
            const profile = await getTeacherProfile(currentUser.id || '1')
            setTeacherProfile(profile)
          } catch (error) {
            // 404 is expected if profile doesn't exist yet
            setTeacherProfile(null)
          }
        }
      } else {
        setTeacherProfile(null)
      }
    }
    loadTeacherProfile()
  }, [authState.user?.id, authState.user?.userType])

  // Listen for auth state changes
  useEffect(() => {
    const handleLogin = () => {
      setAuthState(getAuthUser())
    }
    
    const handleLogout = () => {
      setAuthState(getAuthUser())
      setUserMenuOpen(false)
    }

    window.addEventListener('userLogin', handleLogin)
    window.addEventListener('userLogout', handleLogout)
    
    // Close user menu when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-item') && !event.target.closest('.user-dropdown-menu')) {
        setUserMenuOpen(false)
      }
      if (notificationMenuOpen && !event.target.closest('.notification-menu-item') && !event.target.closest('.notification-dropdown')) {
        setNotificationMenuOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      window.removeEventListener('userLogin', handleLogin)
      window.removeEventListener('userLogout', handleLogout)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [userMenuOpen, notificationMenuOpen])

  // Update auth state when location changes (in case of login/logout on other pages)
  // Use useMemo to avoid unnecessary re-renders
  const currentAuth = useMemo(() => getAuthUser(), [location.pathname])
  
  useEffect(() => {
    setAuthState(currentAuth)
  }, [currentAuth])

  // Load notification count - only when auth state changes, not on every route change
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (authState.isAuthenticated && authState.user) {
        // Use requestIdleCallback for non-critical updates
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            getUnreadNotificationCount(authState.user.id).then(count => {
              setUnreadNotificationCount(count)
            })
          })
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            getUnreadNotificationCount(authState.user.id).then(count => {
              setUnreadNotificationCount(count)
            })
          }, 100)
        }
      } else {
        setUnreadNotificationCount(0)
      }
    }

    loadNotificationCount()

    // Listen for new notifications
    const handleNewNotification = async (event) => {
      if (event.detail && authState.user && String(event.detail.userId) === String(authState.user.id)) {
        await loadNotificationCount()
      }
    }

    const handleNotificationRead = async () => {
      await loadNotificationCount()
    }

    // Listen for storage changes (cross-tab updates)
    const handleStorageChange = (event) => {
      if (event.key === 'user_notifications' || event.key === null) {
        loadNotificationCount()
      }
    }

    window.addEventListener('newNotification', handleNewNotification)
    window.addEventListener('notificationRead', handleNotificationRead)
    window.addEventListener('allNotificationsRead', handleNotificationRead)
    window.addEventListener('storage', handleStorageChange)

    // Refresh notification count every 3 seconds
    // Poll less frequently for better performance - every 30 seconds instead of 3
    const interval = setInterval(loadNotificationCount, 30000)

    return () => {
      window.removeEventListener('newNotification', handleNewNotification)
      window.removeEventListener('notificationRead', handleNotificationRead)
      window.removeEventListener('allNotificationsRead', handleNotificationRead)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [authState.isAuthenticated, authState.user])

  const handleLogout = () => {
    logoutUser()
    navigate('/training')
    setUserMenuOpen(false)
  }

  const userProfileLink = getUserProfileLink()

  const toggleMobileNav = () => {
    setIsMobileNavActive(!isMobileNavActive)
    document.body.classList.toggle('mobile-nav-active')
  }

  const closeMobileNav = () => {
    setIsMobileNavActive(false)
    document.body.classList.remove('mobile-nav-active')
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' && !location.hash
    }
    return location.pathname === path || location.pathname.startsWith(path)
  }

  // Check if we're in the training section
  const isTrainingSection = location.pathname.startsWith('/training')

  // Get user's full name (checking both user.name and teacher profile)
  const getUserFullName = () => {
    if (authState.user) {
      // For teachers, check if there's a teacher profile with fullName (use state)
      if (authState.user.userType === 'teacher' && teacherProfile && teacherProfile.fullName) {
        return teacherProfile.fullName.trim()
      }
      // Fallback to user.name
      if (authState.user.name) {
        return authState.user.name.trim()
      }
    }
    return null
  }

  // Get user's first name
  const getUserFirstName = () => {
    const fullName = getUserFullName()
    if (fullName && fullName.length > 0) {
      // Get first word (first name)
      return fullName.split(' ')[0]
    }
    return null
  }

  // Get user initial (first letter of first name)
  const getUserInitial = () => {
    const firstName = getUserFirstName()
    if (firstName && firstName.length > 0) {
      const firstLetter = firstName.charAt(0).toUpperCase()
      return firstLetter
    }
    return 'U'
  }

  return (
    <header id="header" className={`header fixed-top ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container-fluid container-xl position-relative"></div>
      <div className="nav-wrap">
        <div
          className="container d-flex justify-content-between align-items-center position-relative"
          style={{ flexWrap: 'nowrap', gap: '12px' }}
        >
          <Link to="/" className="logo d-flex align-items-center">
            <img src={logo} alt="ByteFlow Innovations Logo" className="logo-img me-2" />
            <h1 className="sitename">ByteFlow Innovations</h1>
          </Link>

          <div
            className="header-actions d-flex align-items-center"
            style={{ gap: '12px', flexWrap: 'nowrap', flex: '0 0 auto' }}
          >
            <nav
              id="navmenu"
              className={`navmenu ${isMobileNavActive ? 'mobile-nav-active' : ''}`}
              style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}
            >
              <ul>
              {isTrainingSection ? (
                // Training Section Navigation
                <>
                  <li>
                    <Link 
                      to="/" 
                      className={location.pathname === '/' ? 'active' : ''}
                      onClick={closeMobileNav}
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/training" 
                      className={location.pathname === '/training' || 
                                location.pathname === '/training/auth' || 
                                location.pathname === '/training/onboarding' ? 'active' : ''}
                      onClick={closeMobileNav}
                    >
                      Training Home
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/training/catalog" 
                      className={location.pathname === '/training/catalog' || 
                                location.pathname.startsWith('/training/course/') || 
                                location.pathname.startsWith('/training/checkout/') ? 'active' : ''}
                      onClick={closeMobileNav}
                    >
                      Browse Courses
                    </Link>
                  </li>
                  {authState.isAuthenticated && authState.user?.userType === 'student' && (
                    <li>
                      <Link 
                        to="/training/student" 
                        className={location.pathname === '/training/student' ? 'active' : ''}
                        onClick={closeMobileNav}
                      >
                        Dashboard
                      </Link>
                    </li>
                  )}
                  {authState.isAuthenticated && authState.user?.userType === 'teacher' && userProfileLink && (
                    <li>
                      <Link 
                        to={userProfileLink} 
                        className={location.pathname.startsWith('/training/teacher/') ? 'active' : ''}
                        onClick={closeMobileNav}
                      >
                        My Profile
                      </Link>
                    </li>
                  )}
                  {authState.isAuthenticated && isPaymentAdmin() && (
                    <li>
                      <Link 
                        to="/training/payment-management" 
                        className={location.pathname === '/training/payment-management' ? 'active' : ''}
                        onClick={closeMobileNav}
                      >
                        Payment Management
                      </Link>
                    </li>
                  )}
                  {authState.isAuthenticated && isGeneralAdmin() && (
                    <>
                      <li>
                        <Link 
                          to="/training/course-moderation" 
                          className={location.pathname === '/training/course-moderation' ? 'active' : ''}
                          onClick={closeMobileNav}
                        >
                          Course Moderation
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/training/user-management" 
                          className={location.pathname === '/training/user-management' ? 'active' : ''}
                          onClick={closeMobileNav}
                        >
                          User Management
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/training/certificate-management" 
                          className={location.pathname === '/training/certificate-management' ? 'active' : ''}
                          onClick={closeMobileNav}
                        >
                          Certificate Management
                        </Link>
                      </li>
                    </>
                  )}
                </>
              ) : (
                // Main Site Navigation
                <>
                  <li>
                    <a 
                      href="/#hero" 
                      className={location.pathname === '/' && !location.hash ? 'active' : ''}
                      onClick={(e) => {
                        if (location.pathname === '/') {
                          e.preventDefault()
                          const element = document.querySelector('#hero')
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                        closeMobileNav()
                      }}
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/#about" 
                      className={location.hash === '#about' ? 'active' : ''}
                      onClick={(e) => {
                        if (location.pathname === '/') {
                          e.preventDefault()
                          const element = document.querySelector('#about')
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                        closeMobileNav()
                      }}
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/#services" 
                      className={location.hash === '#services' ? 'active' : ''}
                      onClick={(e) => {
                        if (location.pathname === '/') {
                          e.preventDefault()
                          const element = document.querySelector('#services')
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                        closeMobileNav()
                      }}
                    >
                      Services
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/#contact" 
                      className={location.hash === '#contact' ? 'active' : ''}
                      onClick={(e) => {
                        if (location.pathname === '/') {
                          e.preventDefault()
                          const element = document.querySelector('#contact')
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                        closeMobileNav()
                      }}
                    >
                      Contact
                    </a>
                  </li>
                  <li>
                    <Link 
                      to="/training" 
                      className={isTrainingSection ? 'active' : ''}
                      onClick={closeMobileNav}
                    >
                      Training
                    </Link>
                  </li>
                </>
              )}
              
              {/* User Menu and login buttons now render outside the nav list */}
            </ul>
            <i 
              className={`mobile-nav-toggle d-xl-none bi ${isMobileNavActive ? 'bi-x' : 'bi-list'}`}
              onClick={toggleMobileNav}
            ></i>
          </nav>

          {isTrainingSection && (
            <>
              {authState.isAuthenticated && authState.user ? (
                <>
                  {/* Notification Bell */}
                  <div className="notification-menu-item" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setNotificationMenuOpen(!notificationMenuOpen)
                        setUserMenuOpen(false) // Close user menu if open
                        closeMobileNav()
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: 0,
                        marginLeft: '10px',
                        transition: 'all 0.2s',
                        outline: 'none',
                        position: 'relative',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
                        e.currentTarget.style.borderColor = '#c85716'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                      className="notification-bell-btn"
                      title="Notifications"
                    >
                      <i className="bi bi-bell"></i>
                      {unreadNotificationCount > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#dc3545',
                            color: '#ffffff',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        >
                          {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {notificationMenuOpen && (
                      <div className="notification-dropdown" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1050 }}>
                        <NotificationDropdown
                          isOpen={notificationMenuOpen}
                          onClose={() => setNotificationMenuOpen(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="user-menu-item" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                    onClick={(e) => {
                      e.preventDefault()
                      setUserMenuOpen(!userMenuOpen)
                      closeMobileNav()
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#c85716',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      padding: 0,
                      marginLeft: '10px',
                      transition: 'all 0.2s',
                      outline: 'none',
                      boxShadow: '0 2px 6px rgba(200, 87, 22, 0.3)',
                      lineHeight: '1',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#b04a12'
                      e.currentTarget.style.transform = 'scale(1.1)'
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(200, 87, 22, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#c85716'
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(200, 87, 22, 0.3)'
                    }}
                    className="user-avatar-btn"
                    title={getUserFirstName() || 'User'}
                  >
                    {getUserInitial()}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div 
                      className="user-dropdown-menu"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '220px',
                        zIndex: 1002,
                        padding: '0.5rem 0'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <style>{`
                        @keyframes fadeIn {
                          from {
                            opacity: 0;
                            transform: translateY(-10px);
                          }
                          to {
                            opacity: 1;
                            transform: translateY(0);
                          }
                        }
                        .user-dropdown-menu {
                          animation: fadeIn 0.2s ease-in;
                        }
                      `}</style>
                      {/* User Info */}
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #e9ecef',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#110a06', marginBottom: '0.25rem' }}>
                          {getUserFirstName() || 'User'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                          {authState.user.email || 'user@example.com'}
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      {authState.user.userType === 'teacher' && userProfileLink && (
                        <Link
                          to={userProfileLink}
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: '#110a06',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <i className="bi bi-person-circle" style={{ fontSize: '1.1rem', color: '#6c757d' }}></i>
                          <span>My Profile</span>
                        </Link>
                      )}
                      
                      {authState.user.userType === 'teacher' && (
                        <>
                          <Link
                            to="/training/teacher-dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              color: '#110a06',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <i className="bi bi-speedometer2" style={{ fontSize: '1.1rem', color: '#6c757d' }}></i>
                            <span>Dashboard</span>
                          </Link>
                          <Link
                            to="/training/teacher-courses"
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              color: '#110a06',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                          <i className="bi bi-kanban" style={{ fontSize: '1.1rem', color: '#6c757d' }}></i>
                            <span>Manage Courses</span>
                          </Link>
                        </>
                      )}
                      
                      {authState.user.userType === 'student' && (
                        <Link
                          to="/training/student"
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: '#110a06',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <i className="bi bi-speedometer2" style={{ fontSize: '1.1rem', color: '#6c757d' }}></i>
                          <span>Dashboard</span>
                        </Link>
                      )}
                      
                      {isPaymentAdmin() && (
                        <Link
                          to="/training/payment-management"
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: '#110a06',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            transition: 'background-color 0.2s',
                            backgroundColor: location.pathname === '/training/payment-management' ? '#f8f9fa' : 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => {
                            if (location.pathname !== '/training/payment-management') {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <i className="bi bi-credit-card" style={{ fontSize: '1.1rem', color: '#c85716' }}></i>
                          <span style={{ fontWeight: location.pathname === '/training/payment-management' ? '600' : '400' }}>
                            Payment Management
                          </span>
                        </Link>
                      )}
                      
                      {isGeneralAdmin() && (
                        <>
                          <Link
                            to="/training/course-moderation"
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              color: '#110a06',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.2s',
                              backgroundColor: location.pathname === '/training/course-moderation' ? '#f8f9fa' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => {
                              if (location.pathname !== '/training/course-moderation') {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <i className="bi bi-check-circle" style={{ fontSize: '1.1rem', color: '#198754' }}></i>
                            <span style={{ fontWeight: location.pathname === '/training/course-moderation' ? '600' : '400' }}>
                              Course Moderation
                            </span>
                          </Link>
                          <Link
                            to="/training/payment-overview"
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              color: '#110a06',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.2s',
                              backgroundColor: location.pathname === '/training/payment-overview' ? '#f8f9fa' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8f9fa'
                            }}
                            onMouseLeave={(e) => {
                              if (location.pathname !== '/training/payment-overview') {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <i className="bi bi-bar-chart-line" style={{ fontSize: '1.1rem', color: '#c85716' }}></i>
                            <span style={{ fontWeight: location.pathname === '/training/payment-overview' ? '600' : '400' }}>
                              Payment Oversight
                            </span>
                          </Link>
                          <Link
                            to="/training/user-management"
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              color: '#110a06',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.2s',
                              backgroundColor: location.pathname === '/training/user-management' ? '#f8f9fa' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => {
                              if (location.pathname !== '/training/user-management') {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <i className="bi bi-people" style={{ fontSize: '1.1rem', color: '#0d6efd' }}></i>
                            <span style={{ fontWeight: location.pathname === '/training/user-management' ? '600' : '400' }}>
                              User Management
                            </span>
                          </Link>
                          <Link
                            to="/training/certificate-management"
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              color: '#110a06',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.2s',
                              backgroundColor: location.pathname === '/training/certificate-management' ? '#f8f9fa' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => {
                              if (location.pathname !== '/training/certificate-management') {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <i className="bi bi-award" style={{ fontSize: '1.1rem', color: '#ffc107' }}></i>
                            <span style={{ fontWeight: location.pathname === '/training/certificate-management' ? '600' : '400' }}>
                              Certificate Management
                            </span>
                          </Link>
                        </>
                      )}
                      
                      <Link
                        to="/training/catalog"
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          color: '#110a06',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <i className="bi bi-search" style={{ fontSize: '1.1rem', color: '#6c757d' }}></i>
                        <span>Browse Courses</span>
                      </Link>
                      
                      <div style={{ borderTop: '1px solid #e9ecef', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#dc3545',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <i className="bi bi-box-arrow-right" style={{ fontSize: '1.1rem' }}></i>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </>
              ) : (
                <div className="header-login-buttons d-flex align-items-center" style={{ gap: '8px' }}>
                  <Link
                    to="/training/auth"
                    onClick={closeMobileNav}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '8px 16px',
                      backgroundColor: '#c85716',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                      border: 'none',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b04a12'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c85716'}
                  >
                    <i className="bi bi-box-arrow-in-right"></i>
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/training/admin-auth"
                    onClick={closeMobileNav}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                      border: 'none',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                  >
                    <i className="bi bi-shield-lock"></i>
                    <span>Admin Login</span>
                  </Link>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}

// Memoize Header to prevent unnecessary re-renders
export default memo(Header)
