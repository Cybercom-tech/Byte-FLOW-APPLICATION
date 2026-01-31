import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/sections/PageHeader'
import { registerUser, loginUser, isAuthenticated } from '../../utils/auth'

function TrainingAuth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [userType, setUserType] = useState('student')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const user = JSON.parse(localStorage.getItem('user_data'))
      if (user?.userType === 'student') {
        navigate('/training/student')
      } else if (user?.userType === 'teacher') {
        navigate(`/training/teacher/${user.id}`)
      }
    }
  }, [navigate])

  // Clear errors when switching modes
  useEffect(() => {
    setErrors({})
    setGeneralError('')
    setFormData({
      name: '',
      email: '',
      password: ''
    })
  }, [mode, userType])
  
  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    return null
  }
  
  // Validate form
  const validateForm = () => {
    const newErrors = {}
    setGeneralError('')
    
    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordError = validatePassword(formData.password)
      if (passwordError) {
        newErrors.password = passwordError
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsProcessing(true)
    setGeneralError('')
    
    try {
      if (mode === 'signup') {
        
        // Register new user
        const result = await registerUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          userType: userType
        })

        if (result.success) {
          // Auto-login after registration
          const loginResult = await loginUser(formData.email.trim(), formData.password)
          
          if (loginResult.success) {
            // Redirect based on user type
            if (userType === 'teacher') {
              navigate('/training/onboarding')
            } else {
              navigate('/training/student')
            }
          } else {
            setGeneralError(loginResult.message || 'Registration successful but login failed. Please try logging in.')
          }
        } else {
          setGeneralError(result.message || 'Registration failed. Please try again.')
        }
      } else {
        // Login existing user
        const result = await loginUser(formData.email.trim(), formData.password)

        if (result.success) {
          // Check if user type matches
          if (result.user.userType !== userType) {
            setGeneralError(`This account is registered as a ${result.user.userType}, not a ${userType}. Please select the correct role.`)
            // Logout the user since type doesn't match
            localStorage.removeItem('user_auth')
            localStorage.removeItem('user_data')
          } else {
            // Redirect based on user type
            if (userType === 'student') {
              navigate('/training/student')
            } else {
              // Check if teacher has completed onboarding
              navigate(`/training/teacher/${result.user.id}`)
            }
          }
        } else {
          setGeneralError(result.message || 'Invalid email or password')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setGeneralError('An error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Login / Sign Up"
        description="Access your IT training portal. Choose your role and continue."
        primaryButton={{ href: '/training', text: 'Back to Welcome' }}
        secondaryButton={{ href: '/training/catalog', text: 'Browse Courses' }}
      />

      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card p-4">
                <div className="d-flex justify-content-between mb-3">
                  <div className="btn-group" role="group">
                    <button 
                      type="button"
                      className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-outline'}`} 
                      onClick={() => setMode('login')}
                    >
                      Login
                    </button>
                    <button 
                      type="button"
                      className={`btn ${mode === 'signup' ? 'btn-primary' : 'btn-outline'}`} 
                      onClick={() => setMode('signup')}
                    >
                      Sign Up
                    </button>
                  </div>
                  <div className="btn-group" role="group">
                    <button 
                      type="button"
                      className={`btn ${userType === 'student' ? 'btn-primary' : 'btn-outline'}`} 
                      onClick={() => setUserType('student')}
                    >
                      Student
                    </button>
                    <button 
                      type="button"
                      className={`btn ${userType === 'teacher' ? 'btn-primary' : 'btn-outline'}`} 
                      onClick={() => setUserType('teacher')}
                    >
                      Teacher
                    </button>
                  </div>
                </div>

                {generalError && (
                  <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                    {generalError}
                  </div>
                )}

                <form className="row gy-3" onSubmit={handleSubmit}>
                  {/* Name field - only shown for signup */}
                  {mode === 'signup' && (
                    <div className="col-12">
                      <label className="form-label">Full Name *</label>
                      <input 
                        type="text" 
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({...formData, name: e.target.value})
                          if (errors.name) {
                            setErrors({...errors, name: ''})
                          }
                          setGeneralError('')
                        }}
                        required
                        disabled={isProcessing}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                  )}
                  <div className="col-12">
                    <label className="form-label">Email *</label>
                    <input 
                      type="email" 
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value})
                        if (errors.email) {
                          setErrors({...errors, email: ''})
                        }
                        setGeneralError('')
                      }}
                      required
                      disabled={isProcessing}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Password *</label>
                    <input 
                      type="password" 
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({...formData, password: e.target.value})
                        if (errors.password) {
                          setErrors({...errors, password: ''})
                        }
                        setGeneralError('')
                      }}
                      required
                      disabled={isProcessing}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                    {mode === 'signup' && (
                      <small className="form-text text-muted">Password must be at least 6 characters long</small>
                    )}
                  </div>
                  {mode === 'signup' && userType === 'teacher' && (
                    <div className="col-12">
                      <div className="alert alert-info" style={{ fontSize: '0.85rem', margin: 0 }}>
                        <i className="bi bi-info-circle" style={{ marginRight: '0.5rem' }}></i>
                        After signing up as a teacher, you'll complete onboarding to set up your profile.
                      </div>
                    </div>
                  )}
                  <div className="col-12 d-flex justify-content-between align-items-center">
                    {mode === 'login' ? (
                      <span className="small text-muted">Don't have an account? Switch to Sign Up</span>
                    ) : (
                      <span className="small text-muted">Already have an account? Switch to Login</span>
                    )}
                    <button 
                      type="submit"
                      className="btn btn-primary"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : (mode === 'login' ? 'Login' : 'Create Account')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default TrainingAuth
