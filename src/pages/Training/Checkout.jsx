import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { coursesData } from './coursesData'
import { enrollInCourse, verifyEnrollment } from '../../utils/courseEnrollment'
import { verifyPaymentByTransaction, pollPaymentStatus } from '../../utils/paymentVerification'
import { isAuthenticated, isStudent, getCurrentUser } from '../../utils/auth'
import { addPaymentScreenshot } from '../../utils/paymentScreenshot'
import { getAllCourses } from '../../utils/courseManagement'
import ChatWidget from '../../components/ChatWidget'
import api from '../../utils/api'

function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()

  // All state hooks must be declared first, before any conditional returns
  const [allCourses, setAllCourses] = useState(coursesData)
  const [teacherCoursesFull, setTeacherCoursesFull] = useState([])
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
    accountNumber: ''
  })
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState(null) // 'verifying', 'verified', 'pending'
  const [transactionId, setTransactionId] = useState(null)
  const [formErrors, setFormErrors] = useState({}) // Track validation errors

  // Load teacher-created and admin-created courses and merge with default courses
  useEffect(() => {
    const loadTeacherCourses = async () => {
      try {
        const teacherCourses = await getAllCourses()
        const teacherCoursesArray = Array.isArray(teacherCourses) ? teacherCourses : []
        const merged = [...coursesData]
        
        // Helper to match course IDs (handles both numeric and MongoDB ObjectIds)
        const matchCourseId = (c1, c2) => {
          const id1 = c1.id || c1._id
          const id2 = c2.id || c2._id
          return String(id1) === String(id2)
        }
        
        teacherCoursesArray.forEach(courseEntry => {
          // Find existing course by matching ID (handles both numeric and ObjectId)
          const idx = merged.findIndex(c => matchCourseId(c, courseEntry))
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...courseEntry }
          } else {
            merged.push(courseEntry)
          }
        })
        setAllCourses(merged)
        
        // Load all courses including pending (for fallback)
        const allTeacherCourses = await getAllCourses(true)
        const allTeacherCoursesArray = Array.isArray(allTeacherCourses) ? allTeacherCourses : []
        setTeacherCoursesFull(allTeacherCoursesArray)
      } catch (error) {
        console.error('Error loading teacher/admin courses:', error)
        // If error, just use default courses
        setAllCourses(coursesData)
        setTeacherCoursesFull([])
      }
    }
    loadTeacherCourses()
  }, [])

  // Authentication check - only students can checkout
  useEffect(() => {
    if (!isAuthenticated() || !isStudent()) {
      navigate('/training/auth')
      return
    }

    // Pre-fill user data from authentication
    const currentUser = getCurrentUser()
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        fullName: currentUser.name || '',
        email: currentUser.email || ''
      }))
    }
  }, [navigate])

  // Listen for verification status updates - must be declared before any conditional returns
  useEffect(() => {
    if (showSuccess && completedPaymentMethod === 'bank') {
      const handleVerificationUpdate = (event) => {
        if (event.detail && event.detail.verified) {
          setVerificationStatus('verified')
        }
      }
      
      window.addEventListener('enrollmentVerified', handleVerificationUpdate)
      
      return () => {
        window.removeEventListener('enrollmentVerified', handleVerificationUpdate)
      }
    }
  }, [showSuccess, completedPaymentMethod])

  const paymentMethod = 'bank' // Only bank transfer is available

  const course = useMemo(() => {
    if (!id) return null
    
    // Helper function to match course IDs (handles both numeric IDs and MongoDB ObjectIds)
    // Works for default courses, teacher-created courses, and admin-created courses
    // IMPORTANT: Must match EXACTLY to prevent wrong course selection
    const matchCourseId = (course) => {
      if (!course) return false
      
      const idStr = String(id)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/
      const isObjectId = objectIdPattern.test(idStr)
      
      // For MongoDB ObjectIds (24 hex characters) - must match exactly
      if (isObjectId) {
        // First check course._id (primary MongoDB field)
        if (course._id && String(course._id) === idStr) {
          return true
        }
        // Then check course.id if it's the ObjectId (transformed from _id)
        if (course.id && String(course.id) === idStr) {
          return true
        }
        // Don't match numeric IDs when we're looking for an ObjectId
        return false
      }
      
      // For numeric IDs (default courses) - must match exactly
      if (!isNaN(parseInt(idStr))) {
        const courseIdNum = parseInt(idStr)
        const cId = typeof course.id === 'string' ? parseInt(course.id) : course.id
        // Only match if it's a numeric ID, not an ObjectId
        const cIdStr = String(course.id)
        const cIsObjectId = objectIdPattern.test(cIdStr)
        
        // If course.id is an ObjectId, don't match with numeric ID
        if (cIsObjectId) {
          return false
        }
        
        // Match numeric IDs
        if (cId === courseIdNum || String(course.id) === idStr) {
          return true
        }
      }
      
      // Fallback: exact string match (for any other string IDs)
      if (String(course.id) === idStr || (course._id && String(course._id) === idStr)) {
        return true
      }
      
      return false
    }
    
    // First check in allCourses (merged default + approved teacher/admin courses)
    const baseCourse = allCourses.find(matchCourseId)
    if (baseCourse && (!baseCourse.status || baseCourse.status === 'approved')) {
      return baseCourse
    }
    
    // Then check in teacherCoursesFull (includes all courses regardless of status - teacher and admin created)
    const fallbackCourse = teacherCoursesFull.find(matchCourseId)
    if (fallbackCourse && (!fallbackCourse.status || fallbackCourse.status === 'approved')) {
      return fallbackCourse
    }
    
    // Return baseCourse if found, otherwise null
    return baseCourse || null
  }, [id, allCourses, teacherCoursesFull])

  // Early return after all hooks are declared
  if (!course) {
    return (
      <div style={{ paddingTop: '150px', minHeight: '100vh', textAlign: 'center' }}>
        <h1>Course not found</h1>
        <Link to="/training/catalog">Back to Catalog</Link>
      </div>
    )
  }

  const currentPrice = course.price ?? course.originalPrice ?? 0
  const originalPrice = course.originalPrice ?? course.price ?? 0
  const hasDiscount = originalPrice > currentPrice
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0
  const tax = Math.round(currentPrice * 0.15) // 15% tax
  const total = currentPrice + tax

  // Attempt automatic verification for bank transfers
  const attemptAutomaticVerification = async (courseId, transactionId, amount, bankName) => {
    try {
      console.log('Attempting automatic verification...', { courseId, transactionId, amount, bankName })
      
      // Try to verify payment using the verification API
      // Default to 'jazzcash' but can be configured based on bankName or user selection
      const paymentGateway = bankName?.toLowerCase().includes('jazz') ? 'jazzcash' : 
                            bankName?.toLowerCase().includes('easy') ? 'easypaisa' : 'jazzcash'
      
      const verificationResult = await verifyPaymentByTransaction(
        transactionId,
        amount,
        courseId,
        bankName,
        paymentGateway
      )

      if (verificationResult.success && verificationResult.verified) {
        // Payment verified automatically - activate enrollment
        console.log('Payment verified automatically! Activating enrollment...')
        const verifyResult = await verifyEnrollment(courseId)
        
        if (verifyResult.success) {
          // Notify user that verification was successful
          window.dispatchEvent(new CustomEvent('enrollmentVerified', {
            detail: { courseId, transactionId, verified: true }
          }))
          
          console.log('✅ Payment verified automatically! Enrollment activated.')
          return true
        }
      } else {
        // Automatic verification failed or not available - start polling
        console.log('Automatic verification not available, starting polling...', verificationResult.message)
        // Poll for payment status (useful for payment gateways that process asynchronously)
        // Polling happens in background - status will update when verified
        startPollingForVerification(courseId, transactionId, amount)
      }
    } catch (error) {
      console.warn('Automatic verification attempt failed:', error)
      // Fall back to polling for verification
      startPollingForVerification(courseId, transactionId, amount)
    }
    return false
  }

  // Poll for payment verification status
  const startPollingForVerification = async (courseId, transactionId, amount) => {
    try {
      console.log('Starting polling for payment verification...', { courseId, transactionId, amount })
      
      // Poll 30 times, every 2 seconds (1 minute total)
      // In production, you might want to poll longer or use webhooks
      const pollResult = await pollPaymentStatus(transactionId, 30, 2000, amount, courseId)
      
      if (pollResult.success && pollResult.verified) {
        // Payment verified - activate enrollment
        console.log('Payment verified through polling! Activating enrollment...')
        const verifyResult = await verifyEnrollment(courseId)
        
        if (verifyResult.success) {
          window.dispatchEvent(new CustomEvent('enrollmentVerified', {
            detail: { courseId, transactionId, verified: true, method: 'polling' }
          }))
          
          // Dispatch event to update UI (status will be updated via event listener)
          // The success page listens for this event and updates accordingly
          
          console.log('✅ Payment verified through polling! Enrollment activated.')
        }
      } else {
        console.log('Polling completed but payment not yet verified:', pollResult.reason)
        console.log('Enrollment remains pending - manual verification required')
      }
    } catch (error) {
      console.warn('Polling for verification failed:', error)
      // Enrollment remains pending - requires manual verification
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  const validateCardNumber = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '')
    return /^\d{13,19}$/.test(cleaned)
  }

  const validateExpiryDate = (expiryDate) => {
    if (!expiryDate) return false
    const [month, year] = expiryDate.split('/').map(Number)
    if (!month || !year || month < 1 || month > 12) return false
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100
    const currentMonth = currentDate.getMonth() + 1
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false
    return true
  }

  const validateCVV = (cvv) => {
    return /^\d{3,4}$/.test(cvv)
  }

  // Handle screenshot upload
  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      
      setScreenshot(file)
      // Clear error when user uploads screenshot
      if (formErrors.screenshot) {
        setFormErrors(prev => ({ ...prev, screenshot: null }))
      }
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Convert file to base64 for storage
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // Handle form submission with bank transfer and screenshot
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated() || !isStudent()) {
      alert('Please login as a student to enroll in courses')
      navigate('/training/auth')
      return
    }
    
    // Validate required fields
    const errors = {}
    if (!formData.bankName || formData.bankName.trim() === '') {
      errors.bankName = 'Bank name is required'
    }
    if (!formData.accountNumber || formData.accountNumber.trim() === '') {
      errors.accountNumber = 'Transaction ID is required'
    }
    if (!screenshot) {
      errors.screenshot = 'Please upload a screenshot of your bank transfer'
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0]
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        errorElement.focus()
      }
      return
    }
    
    // Clear any previous errors
    setFormErrors({})
    
    setIsProcessing(true)
    
    try {
      const currentUser = getCurrentUser()
      
      // Use user-entered transaction ID or generate one if not provided
      const transactionId = formData.accountNumber.trim() || `TXN-BT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Convert screenshot to base64
      const screenshotUrl = await fileToBase64(screenshot)

      // Enroll student in course (with pending status for bank transfer)
      // Use _id if available (MongoDB ObjectId for teacher-created courses), otherwise use id as string
      const courseIdToSend = course._id || String(course.id)
      
      // Determine if this is an ObjectId (MongoDB) or numeric ID (default course)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(courseIdToSend))
      const isDefaultCourse = !isObjectId && !course._id
      
      console.log('Attempting enrollment:', {
        courseId: courseIdToSend,
        courseType: isObjectId ? 'Teacher-created (MongoDB ObjectId)' : isDefaultCourse ? 'Default course (numeric ID)' : 'Unknown',
        course: { 
          id: course.id, 
          _id: course._id, 
          title: course.title,
          status: course.status,
          isApproved: course.isApproved
        }
      })
      
      // Log info for default courses (they're handled specially by backend)
      if (isDefaultCourse) {
        console.log('Enrolling in default course. Backend will allow enrollment even if course is not in database.')
      }
      
      const enrollmentResult = await enrollInCourse({
        courseId: courseIdToSend,
        paymentMethod: 'Bank Transfer',
        transactionId: transactionId,
        amountPaid: total,
        paymentScreenshot: screenshotUrl, // Include screenshot in enrollment
        firstSection: course.sections && course.sections.length > 0 ? course.sections[0].title : 'Introduction',
        requiresVerification: true // Bank transfers need verification
      })

      if (enrollmentResult.success) {
        // Save screenshot
        const screenshotResult = await addPaymentScreenshot({
          enrollmentId: enrollmentResult.enrollment.courseId + '_' + currentUser.id,
          courseId: courseIdToSend,
          studentId: currentUser.id,
          studentName: currentUser.name || formData.fullName,
          courseTitle: course.title,
          screenshotUrl: screenshotUrl,
          amountPaid: total,
          transactionId: transactionId
        })
        
        if (!screenshotResult.success) {
          console.error('Failed to save screenshot:', screenshotResult.message)
        }

        setIsProcessing(false)
        setShowSuccess(true)
        setCompletedPaymentMethod('bank')
        setVerificationStatus('pending')
        setTransactionId(transactionId)
        
        // Dispatch custom event to notify dashboard of new enrollment
        window.dispatchEvent(new Event('courseEnrolled'))
        
        // Redirect after delay to show pending message
        setTimeout(() => {
          navigate('/training/student')
        }, 2000)
      } else {
        // Provide more context about the enrollment failure
        const errorMsg = enrollmentResult.message || 'Failed to enroll in course'
        console.error('Enrollment failed:', {
          message: errorMsg,
          status: enrollmentResult.status,
          courseId: courseIdToSend,
          course: { id: course.id, _id: course._id, title: course.title }
        })
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error processing enrollment:', error)
      setIsProcessing(false)
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'An error occurred during enrollment. Please try again or contact support.'
      
      // Add helpful context for common errors
      if (errorMessage.includes('Course not found') || errorMessage.includes('not approved')) {
        errorMessage = `${errorMessage}\n\nIf this is a course you created, please ensure it has been approved by an admin.`
      }
      
      alert(errorMessage)
    }
  }

  
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value)
    setFormData(prev => ({
      ...prev,
      cardNumber: formatted
    }))
  }


  if (showSuccess) {
    const isBankTransfer = completedPaymentMethod === 'bank'
    
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '3rem',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            {isBankTransfer ? (
              // Bank Transfer - Pending Verification
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <i className="bi bi-clock-history" style={{ fontSize: '3rem', color: '#ffffff' }}></i>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#110a06', marginBottom: '1rem' }}>
                  Payment Submitted Successfully!
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
                  Your enrollment request for <strong>{course.title}</strong> has been submitted.
                </p>
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  textAlign: 'left'
                }}>
                  <h5 style={{ fontSize: '1rem', fontWeight: '600', color: '#856404', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-info-circle-fill"></i>
                    Verification Required
                  </h5>
                  <p style={{ fontSize: '0.95rem', color: '#856404', marginBottom: '1rem' }}>
                    Your enrollment is <strong>pending verification</strong>. Once the admin confirms your bank transfer payment screenshot, you will be automatically enrolled in the course.
                  </p>
                  <ul style={{ fontSize: '0.9rem', color: '#856404', margin: 0, paddingLeft: '1.5rem' }}>
                    <li>Your payment screenshot has been submitted</li>
                    <li>Verification typically takes 1-3 business days</li>
                    <li>You will receive an email confirmation once verified</li>
                    <li>Check your dashboard for status updates</li>
                  </ul>
                </div>
                {transactionId && (
                  <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '1rem' }}>
                    Transaction ID: <strong>{transactionId}</strong>
                  </p>
                )}
                <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '2rem' }}>
                  After verification, you will receive Zoom meeting links and schedule details via email.
                </p>
              </>
            ) : (
              // Card Payment - Immediate Success
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#198754',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem', color: '#ffffff' }}></i>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#110a06', marginBottom: '1rem' }}>
                  Payment Successful!
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1rem' }}>
                  You have successfully enrolled in <strong>{course.title}</strong>.
                </p>
                <p style={{ fontSize: '0.95rem', color: '#198754', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-check-circle-fill"></i>
                  Enrollment confirmation email has been sent
                </p>
                <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '2rem' }}>
                  You will be redirected to your dashboard shortly.
                </p>
              </>
            )}
            <Link
              to="/training/student"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#c85716',
                color: '#ffffff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ORIGINAL SUCCESS PAGE CODE - COMMENTED OUT FOR TESTING
  if (showSuccess) {
    const isBankTransfer = completedPaymentMethod === 'bank'
    
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '3rem',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            {isBankTransfer ? (
              // Bank Transfer - Pending Verification
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <i className="bi bi-clock-history" style={{ fontSize: '3rem', color: '#ffffff' }}></i>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#110a06', marginBottom: '1rem' }}>
                  Payment Submitted Successfully!
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
                  Your enrollment request for <strong>{course.title}</strong> has been submitted.
                </p>
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  textAlign: 'left'
                }}>
                  <h5 style={{ fontSize: '1rem', fontWeight: '600', color: '#856404', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-info-circle-fill"></i>
                    Verification Required
                  </h5>
                  <p style={{ fontSize: '0.95rem', color: '#856404', marginBottom: '1rem' }}>
                    Your enrollment is <strong>pending verification</strong>. Once ByteFlow confirms your bank transfer payment, you will be automatically enrolled in the course.
                  </p>
                  <ul style={{ fontSize: '0.9rem', color: '#856404', margin: 0, paddingLeft: '1.5rem' }}>
                    <li>Please ensure you have completed the bank transfer</li>
                    <li>Keep your transaction ID for reference: <strong>{formData.accountNumber || 'N/A'}</strong></li>
                    <li>Verification typically takes 1-3 business days</li>
                    <li>You will receive an email confirmation once verified</li>
                  </ul>
                </div>
                {verificationStatus === 'verifying' && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#e7f3ff',
                    border: '1px solid #0d6efd',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '1rem', height: '1rem' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span style={{ fontSize: '0.95rem', color: '#0d6efd', fontWeight: '500' }}>
                      Verifying payment automatically...
                    </span>
                  </div>
                )}
                {verificationStatus === 'verified' && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#d1e7dd',
                    border: '1px solid #198754',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '1.2rem' }}></i>
                    <span style={{ fontSize: '0.95rem', color: '#198754', fontWeight: '500' }}>
                      Payment verified! Your enrollment is now active.
                    </span>
                  </div>
                )}
                <p style={{ fontSize: '0.95rem', color: '#198754', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-envelope-check"></i>
                  Verification request email has been sent to ByteFlow
                </p>
                {transactionId && (
                  <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '1rem' }}>
                    Transaction ID: <strong>{transactionId}</strong>
                  </p>
                )}
                <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '2rem' }}>
                  {verificationStatus === 'verified' 
                    ? 'You will receive Zoom meeting links and schedule details via email. Check your dashboard for upcoming sessions.' 
                    : 'After verification, you will receive Zoom meeting links and schedule details via email.'}
                </p>
              </>
            ) : (
              // Card Payment - Immediate Success
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#198754',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem', color: '#ffffff' }}></i>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#110a06', marginBottom: '1rem' }}>
                  Payment Successful!
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1rem' }}>
                  You have successfully enrolled in <strong>{course.title}</strong>.
                </p>
                <p style={{ fontSize: '0.95rem', color: '#198754', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-check-circle-fill"></i>
                  Enrollment confirmation email has been sent to ByteFlow
                </p>
                <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '2rem' }}>
                  You will be redirected to your dashboard shortly.
                </p>
              </>
            )}
            <Link
              to="/training/student"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#c85716',
                color: '#ffffff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }
  */

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '1.5rem' }}>
          <Link to="/training/catalog" style={{ color: '#6c757d', textDecoration: 'none' }}>
            Training
          </Link>
          <span style={{ margin: '0 8px', color: '#6c757d' }}> &gt; </span>
          <Link to={`/training/course/${id}`} style={{ color: '#6c757d', textDecoration: 'none' }}>
            {course.title}
          </Link>
          <span style={{ margin: '0 8px', color: '#6c757d' }}> &gt; </span>
          <span style={{ color: '#110a06' }}>Checkout</span>
        </nav>

        {/* Back Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to={`/training/course/${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#c85716',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Course
          </Link>
        </div>

        <div className="row g-4">
          {/* Left Column - Payment Form */}
          <div className="col-lg-8">
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#110a06',
                marginBottom: '1.5rem'
              }}>
                Payment Information
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Bank Transfer Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <h5 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#110a06',
                      marginBottom: '1rem'
                    }}>
                      Bank Transfer Details
                    </h5>
                    
                    {/* Bank Account Information */}
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef',
                      marginBottom: '1.5rem'
                    }}>
                      <h6 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#110a06',
                        marginBottom: '1rem'
                      }}>
                        Transfer Money to This Account:
                      </h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <strong style={{ color: '#6c757d', fontSize: '0.9rem' }}>Bank Name:</strong>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#110a06', fontWeight: '500' }}>
                            ABC Bank
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: '#6c757d', fontSize: '0.9rem' }}>Account Title:</strong>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#110a06', fontWeight: '500' }}>
                            ByteFlow Innovations
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: '#6c757d', fontSize: '0.9rem' }}>Account Number:</strong>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#110a06', fontWeight: '500' }}>
                            1234567890123
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: '#6c757d', fontSize: '0.9rem' }}>IBAN:</strong>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#110a06', fontWeight: '500' }}>
                            PK36SCBL0000001123456702
                          </p>
                        </div>
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: '#fff3cd',
                          borderRadius: '6px',
                          border: '1px solid #ffc107'
                        }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404' }}>
                            <strong>Amount to Transfer:</strong> PKR {total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bank Name and Transaction ID Fields */}
                    <div className="row g-3" style={{ marginBottom: '1.5rem' }}>
                      <div className="col-12">
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontSize: '0.9rem', 
                          fontWeight: '500', 
                          color: '#110a06' 
                        }}>
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={(e) => {
                            handleInputChange(e)
                            // Clear error when user starts typing
                            if (formErrors.bankName) {
                              setFormErrors(prev => ({ ...prev, bankName: null }))
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: formErrors.bankName ? '2px solid #dc3545' : '1px solid #dee2e6',
                            borderRadius: '6px',
                            fontSize: '0.95rem'
                          }}
                          placeholder="e.g., JazzCash, EasyPaisa, Bank Name"
                        />
                        {formErrors.bankName && (
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#dc3545' }}>
                            {formErrors.bankName}
                          </p>
                        )}
                      </div>
                      <div className="col-12">
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontSize: '0.9rem', 
                          fontWeight: '500', 
                          color: '#110a06' 
                        }}>
                          Transaction ID / Reference Number *
                        </label>
                        <input
                          type="text"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={(e) => {
                            handleInputChange(e)
                            // Clear error when user starts typing
                            if (formErrors.accountNumber) {
                              setFormErrors(prev => ({ ...prev, accountNumber: null }))
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: formErrors.accountNumber ? '2px solid #dc3545' : '1px solid #dee2e6',
                            borderRadius: '6px',
                            fontSize: '0.95rem'
                          }}
                          placeholder="Enter transaction ID or reference number"
                        />
                        {formErrors.accountNumber && (
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#dc3545' }}>
                            {formErrors.accountNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Screenshot Upload */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.9rem', 
                        fontWeight: '500', 
                        color: '#110a06' 
                      }}>
                        Upload Payment Screenshot *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: formErrors.screenshot ? '2px solid #dc3545' : '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          marginBottom: '0.5rem'
                        }}
                      />
                      {formErrors.screenshot && (
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#dc3545' }}>
                          {formErrors.screenshot}
                        </p>
                      )}
                      <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: 0 }}>
                        Please upload a screenshot of your bank transfer confirmation. Maximum file size: 5MB
                      </p>
                      
                      {/* Screenshot Preview */}
                      {screenshotPreview && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <p style={{ fontSize: '0.9rem', fontWeight: '500', color: '#110a06', marginBottom: '0.5rem' }}>
                            Preview:
                          </p>
                          <img
                            src={screenshotPreview}
                            alt="Screenshot preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '300px',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshot(null)
                              setScreenshotPreview(null)
                            }}
                            style={{
                              marginTop: '0.5rem',
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: isProcessing ? '#6c757d' : '#c85716',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.backgroundColor = '#b04a12'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.backgroundColor = '#c85716'
                    }
                  }}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" style={{ marginRight: '0.5rem' }}></span>
                      Processing Payment...
                    </>
                  ) : (
                    `Complete Purchase - PKR ${total.toLocaleString()}`
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="col-lg-4">
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              position: 'sticky',
              top: '120px'
            }}>
              <h5 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#110a06',
                marginBottom: '1.5rem'
              }}>
                Order Summary
              </h5>

              {/* Course Card */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid #e9ecef'
              }}>
                <div style={{
                  width: '100px',
                  height: '70px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img
                    src={course.image}
                    alt={course.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h6 style={{
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#110a06',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    {course.title}
                  </h6>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#6c757d',
                    margin: 0
                  }}>
                    by {course.teacher}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Course Price</span>
                  <span style={{ fontSize: '0.9rem', color: '#110a06', fontWeight: '500' }}>
                    PKR {course.price.toLocaleString()}
                  </span>
                </div>
                {course.originalPrice > course.price && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Discount</span>
                    <span style={{ fontSize: '0.9rem', color: '#198754', fontWeight: '500' }}>
                      -PKR {(course.originalPrice - course.price).toLocaleString()} ({discountPercentage}%)
                    </span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Tax (15%)</span>
                  <span style={{ fontSize: '0.9rem', color: '#110a06', fontWeight: '500' }}>
                    PKR {tax.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  borderTop: '1px solid #e9ecef',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#110a06' }}>Total</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#c85716' }}>
                    PKR {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Course Includes */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                <h6 style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#110a06',
                  marginBottom: '0.75rem'
                }}>
                  This course includes:
                </h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '0.85rem' }}></i>
                    <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>{course.totalLectures} live sessions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '0.85rem' }}></i>
                    <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>{course.totalDuration}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '0.85rem' }}></i>
                    <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>Certificate of completion</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '0.85rem' }}></i>
                    <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>Live virtual classroom access</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#6c757d'
              }}>
                <i className="bi bi-shield-lock-fill" style={{ color: '#198754' }}></i>
                <span>Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatWidget userType="student" />
    </div>
  )
}

export default Checkout

