import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/sections/PageHeader'
import { loginUser, isAuthenticated, isPaymentAdmin, isGeneralAdmin } from '../../utils/auth'

function AdminAuth() {
  const navigate = useNavigate()
  const [adminType, setAdminType] = useState('payment-admin') // 'payment-admin' or 'general-admin'
  
  // Debug: Log component mount
  useEffect(() => {
    console.log('AdminAuth component mounted')
  }, [])
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  
  // Check if user is already authenticated
  useEffect(() => {
    try {
      if (isAuthenticated()) {
        if (isPaymentAdmin()) {
          navigate('/training/payment-management')
        } else if (isGeneralAdmin()) {
          navigate('/training/course-moderation')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }, [navigate])

  // Clear errors when switching admin type
  useEffect(() => {
    setErrors({})
    setGeneralError('')
    setFormData({
      email: '',
      password: ''
    })
  }, [adminType])
  
  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  // Validate form
  const validateForm = () => {
    const newErrors = {}
    setGeneralError('')
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
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
      const result = await loginUser(formData.email, formData.password)
      
      if (result.success) {
        // Check if logged in user matches selected admin type
        if (adminType === 'payment-admin' && !isPaymentAdmin()) {
          setGeneralError('Invalid credentials for Payment Admin')
          setIsProcessing(false)
          return
        }
        
        if (adminType === 'general-admin' && !isGeneralAdmin()) {
          setGeneralError('Invalid credentials for General Admin')
          setIsProcessing(false)
          return
        }
        
        // Redirect based on admin type
        if (adminType === 'payment-admin') {
          navigate('/training/payment-management')
        } else {
          navigate('/training/course-moderation')
        }
      } else {
        setGeneralError(result.message || 'Login failed. Please check your credentials.')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setGeneralError('An error occurred during login. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    if (generalError) {
      setGeneralError('')
    }
  }

  return (
    <>
      <PageHeader
        title="Admin Login"
        description="Login as Payment Admin or General Admin (Content Moderator)"
        primaryButton={{ href: '/training', text: 'Back to Welcome' }}
        secondaryButton={{ href: '/training/catalog', text: 'Browse Courses' }}
      />

      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card p-4" style={{ marginTop: '2rem' }}>
                {/* Admin Type Selection */}
                <div className="d-flex justify-content-center mb-3">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${adminType === 'payment-admin' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setAdminType('payment-admin')}
                      style={{
                        backgroundColor: adminType === 'payment-admin' ? '#c85716' : 'transparent',
                        color: adminType === 'payment-admin' ? '#ffffff' : '#110a06',
                        borderColor: adminType === 'payment-admin' ? '#c85716' : '#e9ecef'
                      }}
                    >
                      <i className="bi bi-credit-card" style={{ marginRight: '0.5rem' }}></i>
                      Payment Admin
                    </button>
                    <button
                      type="button"
                      className={`btn ${adminType === 'general-admin' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setAdminType('general-admin')}
                      style={{
                        backgroundColor: adminType === 'general-admin' ? '#198754' : 'transparent',
                        color: adminType === 'general-admin' ? '#ffffff' : '#110a06',
                        borderColor: adminType === 'general-admin' ? '#198754' : '#e9ecef'
                      }}
                    >
                      <i className="bi bi-shield-check" style={{ marginRight: '0.5rem' }}></i>
                      General Admin
                    </button>
                  </div>
                </div>
                <p className="text-center text-muted small mb-4">
                  {adminType === 'payment-admin' 
                    ? 'Manage payment confirmations and student enrollments'
                    : 'Moderate courses, manage users, and approve/reject content'}
                </p>

                {generalError && (
                  <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                    <i className="bi bi-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                    {generalError}
                  </div>
                )}

                <form className="row gy-3" onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <div className="col-12">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={adminType === 'payment-admin' ? 'payment@byteflow.com' : 'admin@byteflow.com'}
                      required
                      disabled={isProcessing}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  {/* Password Field */}
                  <div className="col-12">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      disabled={isProcessing}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>

                  {/* Info Box */}
                  <div className="col-12">
                    <div className="alert alert-info" style={{ fontSize: '0.85rem', margin: 0 }}>
                      <i className="bi bi-info-circle" style={{ marginRight: '0.5rem' }}></i>
                      <strong>Note:</strong> Admins can only login, not register. Use the credentials provided by the system administrator.
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="col-12 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isProcessing}
                      style={{
                        backgroundColor: adminType === 'payment-admin' ? '#c85716' : '#198754',
                        borderColor: adminType === 'payment-admin' ? '#c85716' : '#198754'
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Logging in...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Login as {adminType === 'payment-admin' ? 'Payment Admin' : 'General Admin'}
                        </>
                      )}
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

export default AdminAuth

