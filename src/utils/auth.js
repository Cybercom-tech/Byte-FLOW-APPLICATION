// Authentication Utility
// Manages user authentication using backend API

import api, { setToken, removeToken, getToken } from './api'

const AUTH_STORAGE_KEY = 'user_auth'
const USER_STORAGE_KEY = 'user_data'

/**
 * Register a new user
 */
export const registerUser = async (userData) => {
  try {
    const { name, email, password, userType } = userData

    // Validate input
    if (!name || !name.trim()) {
      return { success: false, message: 'Name is required' }
    }
    if (!email || !email.trim()) {
      return { success: false, message: 'Email is required' }
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long' }
    }
    if (!userType || (userType !== 'student' && userType !== 'teacher' && userType !== 'admin')) {
      return { success: false, message: 'Invalid user type' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { success: false, message: 'Invalid email format' }
    }

    try {
      // Call backend API
      const response = await api.post('/auth/signup', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        userType: userType
      }, { includeAuth: false })

      // Store token and user data
      if (response.token) {
        setToken(response.token)
      }

      const sessionUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        userType: response.user.userType,
        loginDate: new Date().toISOString()
      }

      localStorage.setItem(AUTH_STORAGE_KEY, 'true')
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser))

      // Dispatch login event
      window.dispatchEvent(new Event('userLogin'))

      return { success: true, user: sessionUser }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred during registration'
      return { success: false, message: errorMessage }
    }
  } catch (error) {
    console.error('Error registering user:', error)
    return { success: false, message: 'An error occurred during registration' }
  }
}

/**
 * Login user with email and password
 */
export const loginUser = async (email, password) => {
  try {
    // Validate input
    if (!email || !email.trim()) {
      return { success: false, message: 'Email is required' }
    }
    if (!password) {
      return { success: false, message: 'Password is required' }
    }

    const emailLower = email.trim().toLowerCase()
    
    // Admin logins (fallback for hardcoded admin accounts)
    // Payment Admin login
    const isPaymentAdmin = (emailLower === 'payment@byteflow.com' || emailLower === 'paymentadmin') && 
                          (password === 'payment123' || password === 'payment')
    
    // General Admin (Content Moderator) login
    const isGeneralAdmin = (emailLower === 'admin@byteflow.com' || emailLower === 'admin' || emailLower === 'moderator@byteflow.com') && 
                          (password === 'admin123' || password === 'admin')
    
    if (isPaymentAdmin) {
      // Try to login via backend API first to get a real JWT token
      try {
        const response = await api.post('/auth/login', {
          email: emailLower,
          password: password
        }, { includeAuth: false })

        // Store token and user data from backend
        if (response.token) {
          setToken(response.token)
        }

        const paymentAdmin = {
          id: response.user?.id || 'admin-payment-1',
          name: response.user?.name || 'Payment Administrator',
          email: response.user?.email || 'payment@byteflow.com',
          userType: response.user?.userType || 'payment-admin',
          adminType: 'payment',
          loginDate: new Date().toISOString()
        }

        localStorage.setItem(AUTH_STORAGE_KEY, 'true')
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(paymentAdmin))
        window.dispatchEvent(new Event('userLogin'))
        return { success: true, user: paymentAdmin }
      } catch (backendError) {
        // If backend login fails, fall back to hardcoded admin (for development)
        // But this won't work for API calls that require a token
        console.warn('Backend admin login failed, using hardcoded admin (API calls may fail):', backendError)
        const paymentAdmin = {
          id: 'admin-payment-1',
          name: 'Payment Administrator',
          email: 'payment@byteflow.com',
          userType: 'payment-admin',
          adminType: 'payment',
          loginDate: new Date().toISOString()
        }
        localStorage.setItem(AUTH_STORAGE_KEY, 'true')
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(paymentAdmin))
        window.dispatchEvent(new Event('userLogin'))
        return { success: true, user: paymentAdmin, warning: 'Backend login failed - API calls may not work' }
      }
    }
    
    if (isGeneralAdmin) {
      // Try to login via backend API first to get a real JWT token
      try {
        const response = await api.post('/auth/login', {
          email: emailLower,
          password: password
        }, { includeAuth: false })

        // Store token and user data from backend
        if (response.token) {
          setToken(response.token)
        }

        const generalAdmin = {
          id: response.user?.id || 'admin-general-1',
          name: response.user?.name || 'Content Moderator',
          email: response.user?.email || 'admin@byteflow.com',
          userType: response.user?.userType || 'general-admin',
          adminType: 'general',
          loginDate: new Date().toISOString()
        }

        localStorage.setItem(AUTH_STORAGE_KEY, 'true')
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(generalAdmin))
        window.dispatchEvent(new Event('userLogin'))
        return { success: true, user: generalAdmin }
      } catch (backendError) {
        // If backend login fails, fall back to hardcoded admin (for development)
        // But this won't work for API calls that require a token
        console.warn('Backend admin login failed, using hardcoded admin (API calls may fail):', backendError)
        const generalAdmin = {
          id: 'admin-general-1',
          name: 'Content Moderator',
          email: 'admin@byteflow.com',
          userType: 'general-admin',
          adminType: 'general',
          loginDate: new Date().toISOString()
        }
        localStorage.setItem(AUTH_STORAGE_KEY, 'true')
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(generalAdmin))
        window.dispatchEvent(new Event('userLogin'))
        return { success: true, user: generalAdmin, warning: 'Backend login failed - API calls may not work' }
      }
    }

    // Regular user login via API
    try {
      const response = await api.post('/auth/login', {
        email: emailLower,
        password: password
      }, { includeAuth: false })

      // Store token and user data
      if (response.token) {
        setToken(response.token)
      }

      const sessionUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        userType: response.user.userType,
        loginDate: new Date().toISOString()
      }

      localStorage.setItem(AUTH_STORAGE_KEY, 'true')
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser))

      // Dispatch login event
      window.dispatchEvent(new Event('userLogin'))

      return { success: true, user: sessionUser }
    } catch (error) {
      // Check if user is banned
      if (error.status === 403 && (error.data?.banned || error.message?.includes('banned'))) {
        const banMessage = error.data?.message || error.message || 'Your account has been banned. Please contact support for assistance.'
        return { success: false, message: banMessage, banned: true }
      }
      const errorMessage = error.message || 'Invalid email or password'
      return { success: false, message: errorMessage }
    }
  } catch (error) {
    console.error('Error logging in user:', error)
    return { success: false, message: 'An error occurred during login' }
  }
}

/**
 * Get current user authentication state
 */
export const getAuthUser = () => {
  try {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY)
    const userData = localStorage.getItem(USER_STORAGE_KEY)
    
    if (auth && userData) {
      return {
        isAuthenticated: auth === 'true',
        user: JSON.parse(userData)
      }
    }
    
    return {
      isAuthenticated: false,
      user: null
    }
  } catch (error) {
    console.error('Error reading auth state:', error)
    return {
      isAuthenticated: false,
      user: null
    }
  }
}

/**
 * Logout user
 */
export const logoutUser = () => {
  try {
    removeToken()
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    
    // Dispatch logout event
    window.dispatchEvent(new Event('userLogout'))
    
    return { success: true }
  } catch (error) {
    console.error('Error logging out user:', error)
    return { success: false, message: 'Failed to logout' }
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const auth = getAuthUser()
  return auth.isAuthenticated
}

/**
 * Get current user
 */
export const getCurrentUser = () => {
  const auth = getAuthUser()
  return auth.user
}

/**
 * Check if user is a student
 */
export const isStudent = () => {
  const user = getCurrentUser()
  return user && user.userType === 'student'
}

/**
 * Check if user is a teacher
 */
export const isTeacher = () => {
  const user = getCurrentUser()
  return user && user.userType === 'teacher'
}

/**
 * Check if user is an admin (any type)
 */
export const isAdmin = () => {
  const user = getCurrentUser()
  if (!user) return false
  return user.userType === 'admin' || 
         user.userType === 'payment-admin' || 
         user.userType === 'general-admin' ||
         user.email === 'admin@byteflow.com' ||
         user.email === 'payment@byteflow.com'
}

/**
 * Check if user is a Payment Admin
 */
export const isPaymentAdmin = () => {
  const user = getCurrentUser()
  if (!user) return false
  return user.userType === 'payment-admin' || 
         (user.userType === 'admin' && user.adminType === 'payment') ||
         user.email === 'payment@byteflow.com'
}

/**
 * Check if user is a General Admin (Content Moderator)
 */
export const isGeneralAdmin = () => {
  const user = getCurrentUser()
  if (!user) return false
  return user.userType === 'general-admin' || 
         (user.userType === 'admin' && user.adminType === 'general') ||
         user.email === 'admin@byteflow.com' ||
         user.email === 'moderator@byteflow.com'
}

/**
 * Get user profile link based on user type
 */
export const getUserProfileLink = () => {
  const user = getCurrentUser()
  if (!user) return null
  
  if (user.userType === 'student') {
    return '/training/student'
  } else if (user.userType === 'teacher') {
    return `/training/teacher/${user.id || '1'}`
  }
  
  return null
}

/**
 * Check if email is already registered
 * Note: This now requires API call, but kept for backward compatibility
 */
export const isEmailRegistered = async (email) => {
  try {
    // Try to login to check if email exists
    // This is not ideal but maintains backward compatibility
    // In production, you might want a dedicated endpoint
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password: 'dummy' // Dummy password to check if email exists
    }, { includeAuth: false }).catch(() => null)
    
    // If we get a response, email exists (even if password is wrong)
    return response !== null
  } catch (error) {
    // If error is about invalid password, email exists
    // If error is about user not found, email doesn't exist
    return error.message && !error.message.includes('not found')
  }
}

/**
 * Get all registered users (deprecated - kept for backward compatibility)
 * Note: This is no longer accurate as users are stored in backend
 */
export const getRegisteredUsers = () => {
  try {
    // Return empty array as users are now in backend
    // This function is kept for backward compatibility
    return []
  } catch (error) {
    console.error('Error reading registered users:', error)
    return []
  }
}
