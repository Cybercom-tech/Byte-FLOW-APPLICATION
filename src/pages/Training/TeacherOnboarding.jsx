import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/sections/PageHeader'
import { getCurrentUser, isAuthenticated, isTeacher } from '../../utils/auth'
import { saveTeacherProfile, getTeacherProfile } from '../../utils/teacherProfile'
import ChatWidget from '../../components/ChatWidget'

const steps = [
  { id: 1, name: 'Personal Info', shortName: 'Personal Info' },
  { id: 2, name: 'Profile', shortName: 'Profile' },
  { id: 3, name: 'Education', shortName: 'Education' },
  { id: 4, name: 'Experience', shortName: 'Experience' },
  { id: 5, name: 'Certificates', shortName: 'Certificates' },
  { id: 6, name: 'Payment Model', shortName: 'Payment' },
]

function TeacherOnboarding() {
  const navigate = useNavigate()
  const dataLoadedRef = useRef(false)
  
  const [stepIndex, setStepIndex] = useState(0)
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    // About Me
    aboutMe: '',
    // Education
    education: [],
    // Experience
    experience: [],
    // Certificates
    certificates: [],
    // Payment Model
    paymentModel: 'percentage',
    percentage: '',
    fixedAmount: '',
    availability: '',
  })

  // Authentication check - only teachers can access onboarding
  useEffect(() => {
    if (!isAuthenticated() || !isTeacher()) {
      navigate('/training/auth')
      return
    }
  }, [navigate])

  // Load existing profile data or draft data when component mounts (ONLY ONCE)
  useEffect(() => {
    if (dataLoadedRef.current) return // Prevent multiple loads
    dataLoadedRef.current = true

    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        navigate('/training/auth')
        return
      }
      
      let loadedData = null

      // First, try to load existing saved profile
      if (currentUser.userType === 'teacher') {
        const userId = currentUser.id || '1'
        const savedProfile = getTeacherProfile(userId)
        
        if (savedProfile) {
          console.log('Loading saved profile:', savedProfile)
          loadedData = {
            fullName: savedProfile.fullName || currentUser.name || '',
            title: savedProfile.title || '',
            email: savedProfile.email || currentUser.email || '',
            phone: savedProfile.phone || '',
            location: savedProfile.location || '',
            aboutMe: savedProfile.aboutMe || '',
            education: Array.isArray(savedProfile.education) ? savedProfile.education : [],
            experience: Array.isArray(savedProfile.experience) ? savedProfile.experience : [],
            certificates: Array.isArray(savedProfile.certificates) ? savedProfile.certificates : [],
            paymentModel: savedProfile.paymentModel || 'percentage',
            percentage: savedProfile.percentage || '',
            fixedAmount: savedProfile.fixedAmount || '',
            availability: savedProfile.availability || '',
          }
        }
      }

      // If no saved profile, try to load draft data
      if (!loadedData) {
        const draft = localStorage.getItem('teacherOnboardingDraft')
        if (draft) {
          const draftData = JSON.parse(draft)
          console.log('Loading draft data:', draftData)
          loadedData = {
            fullName: draftData.fullName || currentUser?.name || '',
            title: draftData.title || '',
            email: draftData.email || currentUser?.email || '',
            phone: draftData.phone || '',
            location: draftData.location || '',
            aboutMe: draftData.aboutMe || '',
            education: Array.isArray(draftData.education) ? draftData.education : [],
            experience: Array.isArray(draftData.experience) ? draftData.experience : [],
            certificates: Array.isArray(draftData.certificates) ? draftData.certificates : [],
            paymentModel: draftData.paymentModel || 'percentage',
            percentage: draftData.percentage || '',
            fixedAmount: draftData.fixedAmount || '',
            availability: draftData.availability || '',
          }
        }
      }

      // Initialize with user data if available
      if (!loadedData && currentUser) {
        loadedData = {
          fullName: currentUser.name || '',
          title: '',
          email: currentUser.email || '',
          phone: '',
          location: '',
          aboutMe: '',
          education: [],
          experience: [],
          certificates: [],
          paymentModel: 'percentage',
          percentage: '',
          fixedAmount: '',
          availability: '',
        }
      }

      // Update form data if we have loaded data (but only if user hasn't added items yet)
      if (loadedData && !userHasAddedItems.current) {
        console.log('Setting formData with loaded data:', loadedData)
        console.log('Education array length:', loadedData.education.length)
        setFormData(loadedData)
      } else if (userHasAddedItems.current) {
        console.log('Skipping formData reset - user has added items')
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, []) // Only run once on mount

  // Debug: Log formData changes
  useEffect(() => {
    console.log('FormData changed - Education:', formData.education.length, 'Experience:', formData.experience.length, 'Certificates:', formData.certificates.length)
    console.log('Full formData:', formData)
  }, [formData.education, formData.experience, formData.certificates])
  
  // Prevent useEffect from resetting formData after user adds items
  const userHasAddedItems = useRef(false)

  const [editingEducation, setEditingEducation] = useState(null)
  const [editingExperience, setEditingExperience] = useState(null)
  const [editingCertificate, setEditingCertificate] = useState(null)

  // Education form state
  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    currentlyStudying: false,
  })

  // Experience form state
  const [experienceForm, setExperienceForm] = useState({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
    description: '',
  })

  // Certificate form state
  const [certificateForm, setCertificateForm] = useState({
    certificateName: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
  })

  const goNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1)
    }
  }

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Education handlers
  const handleEducationFormChange = (field, value) => {
    setEducationForm(prev => ({ ...prev, [field]: value }))
  }

  const addEducation = () => {
    console.log('addEducation function called!')
    console.log('educationForm:', educationForm)
    console.log('Current formData before add:', formData)
    
    if (educationForm.institution && educationForm.degree) {
      userHasAddedItems.current = true
      const newEducation = {
        id: Date.now(),
        ...educationForm,
      }
      console.log('Adding education:', newEducation)
      console.log('Current formData.education before update:', formData.education)
      
      setFormData(prev => {
        console.log('Inside setFormData - prev.education:', prev.education)
        const currentEducation = Array.isArray(prev.education) ? prev.education : []
        console.log('currentEducation array:', currentEducation)
        const updated = {
          ...prev,
          education: [...currentEducation, newEducation],
        }
        console.log('Updated formData education:', updated.education)
        console.log('Education count after add:', updated.education.length)
        console.log('Full updated formData:', updated)
        return updated
      })
      
      // Verify the update happened
      setTimeout(() => {
        console.log('After addEducation - checking formData state...')
      }, 100)
      
      setEducationForm({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        currentlyStudying: false,
      })
      setEditingEducation(null)
    } else {
      console.warn('Cannot add education - missing institution or degree', educationForm)
      alert('Please fill in Institution Name and Degree fields')
    }
  }

  const editEducation = (edu) => {
    setEducationForm(edu)
    setEditingEducation(edu.id)
  }

  const updateEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === editingEducation ? { ...educationForm, id: edu.id } : edu
      ),
    }))
    setEducationForm({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      currentlyStudying: false,
    })
    setEditingEducation(null)
  }

  const deleteEducation = (id) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }))
  }

  // Experience handlers
  const handleExperienceFormChange = (field, value) => {
    setExperienceForm(prev => ({ ...prev, [field]: value }))
  }

  const addExperience = () => {
    if (experienceForm.company && experienceForm.position) {
      const newExperience = {
        id: Date.now(),
        ...experienceForm,
      }
      console.log('Adding experience:', newExperience)
      setFormData(prev => {
        const currentExperience = Array.isArray(prev.experience) ? prev.experience : []
        const updated = {
          ...prev,
          experience: [...currentExperience, newExperience],
        }
        console.log('Updated formData experience:', updated.experience)
        console.log('Experience count after add:', updated.experience.length)
        return updated
      })
      setExperienceForm({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: '',
      })
      setEditingExperience(null)
    }
  }

  const editExperience = (exp) => {
    setExperienceForm(exp)
    setEditingExperience(exp.id)
  }

  const updateExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === editingExperience ? { ...experienceForm, id: exp.id } : exp
      ),
    }))
    setExperienceForm({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: '',
    })
    setEditingExperience(null)
  }

  const deleteExperience = (id) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }))
  }


  // Certificate handlers
  const handleCertificateFormChange = (field, value) => {
    setCertificateForm(prev => ({ ...prev, [field]: value }))
  }

  const addCertificate = () => {
    if (certificateForm.certificateName) {
      const newCertificate = {
        id: Date.now(),
        ...certificateForm,
      }
      console.log('Adding certificate:', newCertificate)
      setFormData(prev => {
        const currentCertificates = Array.isArray(prev.certificates) ? prev.certificates : []
        const updated = {
          ...prev,
          certificates: [...currentCertificates, newCertificate],
        }
        console.log('Updated formData certificates:', updated.certificates)
        console.log('Certificates count after add:', updated.certificates.length)
        return updated
      })
      setCertificateForm({
        certificateName: '',
        issuingOrganization: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
      })
      setEditingCertificate(null)
    }
  }

  const editCertificate = (cert) => {
    setCertificateForm(cert)
    setEditingCertificate(cert.id)
  }

  const updateCertificate = () => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.map(cert =>
        cert.id === editingCertificate ? { ...certificateForm, id: cert.id } : cert
      ),
    }))
    setCertificateForm({
      certificateName: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
    })
    setEditingCertificate(null)
  }

  const deleteCertificate = (id) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter(cert => cert.id !== id),
    }))
  }

  const saveDraft = () => {
    try {
      const currentUser = getCurrentUser()
      
      // Use functional update to get latest state
      setFormData(currentFormData => {
        // Save to localStorage with latest data
        const dataToSave = {
          ...currentFormData,
          education: Array.isArray(currentFormData.education) ? [...currentFormData.education] : [],
          experience: Array.isArray(currentFormData.experience) ? [...currentFormData.experience] : [],
          certificates: Array.isArray(currentFormData.certificates) ? [...currentFormData.certificates] : [],
        }
        
        console.log('Saving draft - formData:', currentFormData)
        console.log('Saving draft - education array:', currentFormData.education)
        console.log('Saving draft - education length:', currentFormData.education?.length)
        
        localStorage.setItem('teacherOnboardingDraft', JSON.stringify(dataToSave))
        
        // Also save to profile if user is logged in
        if (currentUser && currentUser.userType === 'teacher') {
          const profileData = {
            fullName: currentFormData.fullName || currentUser.name,
            title: currentFormData.title,
            email: currentFormData.email || currentUser.email,
            phone: currentFormData.phone,
            location: currentFormData.location,
            aboutMe: currentFormData.aboutMe,
            education: Array.isArray(currentFormData.education) ? [...currentFormData.education] : [],
            experience: Array.isArray(currentFormData.experience) ? [...currentFormData.experience] : [],
            certificates: Array.isArray(currentFormData.certificates) ? [...currentFormData.certificates] : [],
            paymentModel: currentFormData.paymentModel,
            percentage: currentFormData.percentage,
          fixedAmount: currentFormData.fixedAmount,
          availability: currentFormData.availability,
        }
        console.log('Saving draft to profile with arrays:', {
          education: profileData.education.length,
          experience: profileData.experience.length,
          certificates: profileData.certificates.length,
        })
        console.log('Education array:', profileData.education)
        
        // Save draft asynchronously (don't block the UI)
        ;(async () => {
          try {
            await saveTeacherProfile(currentUser.id || '1', profileData)
            // Wait a bit for the backend to process, then verify
            await new Promise(resolve => setTimeout(resolve, 200))
            const saved = await getTeacherProfile(currentUser.id || '1')
            console.log('Draft saved - verifying:', saved?.education?.length)
          } catch (error) {
            console.error('Error saving draft:', error)
          }
        })()
        }
        
        alert('Draft saved successfully!')
        return currentFormData // Return unchanged state
      })
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft. Please try again.')
    }
  }

  // Frontend validation function
  const validateFormData = (formData, currentUser) => {
    const errors = []
    
    // Required fields validation
    if (!formData.fullName || formData.fullName.trim() === '') {
      errors.push('Full Name is required')
    }
    
    if (!formData.title || formData.title.trim() === '') {
      errors.push('Professional Title is required')
    }
    
    if (!formData.email || formData.email.trim() === '') {
      errors.push('Email Address is required')
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        errors.push('Please enter a valid email address')
      }
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      errors.push('Phone Number is required')
    }
    
    if (!formData.location || formData.location.trim() === '') {
      errors.push('Location is required')
    }
    
    if (!formData.aboutMe || formData.aboutMe.trim() === '') {
      errors.push('About Me is required')
    }
    // Note: Removed minimum length requirement - backend doesn't enforce it
    
    // Validate education entries if any exist
    if (Array.isArray(formData.education) && formData.education.length > 0) {
      formData.education.forEach((edu, index) => {
        if (!edu.institution || edu.institution.trim() === '') {
          errors.push(`Education entry ${index + 1}: Institution Name is required`)
        }
        if (!edu.degree || edu.degree.trim() === '') {
          errors.push(`Education entry ${index + 1}: Degree is required`)
        }
        if (!edu.startDate) {
          errors.push(`Education entry ${index + 1}: Start Date is required`)
        }
      })
    }
    
    // Validate experience entries if any exist
    if (Array.isArray(formData.experience) && formData.experience.length > 0) {
      formData.experience.forEach((exp, index) => {
        if (!exp.company || exp.company.trim() === '') {
          errors.push(`Experience entry ${index + 1}: Company Name is required`)
        }
        if (!exp.position || exp.position.trim() === '') {
          errors.push(`Experience entry ${index + 1}: Position is required`)
        }
        if (!exp.startDate) {
          errors.push(`Experience entry ${index + 1}: Start Date is required`)
        }
      })
    }
    
    // Validate certificate entries if any exist
    if (Array.isArray(formData.certificates) && formData.certificates.length > 0) {
      formData.certificates.forEach((cert, index) => {
        // Check for certificateName (used in form) or name (alternative)
        const certificateName = cert.certificateName || cert.name || ''
        if (!certificateName || certificateName.trim() === '') {
          errors.push(`Certificate entry ${index + 1}: Certificate Name is required`)
        }
        // Check for issuingOrganization (used in form) or organization (alternative)
        const organization = cert.issuingOrganization || cert.organization || ''
        if (!organization || organization.trim() === '') {
          errors.push(`Certificate entry ${index + 1}: Issuing Organization is required`)
        }
      })
    }
    
    return errors
  }

  const handleSubmit = async () => {
    // Get current user
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.userType !== 'teacher') {
      alert('Please login as a teacher to complete onboarding.')
      navigate('/training/auth')
      return
    }

    try {
      // Use formData state directly - React guarantees it's the latest when handler is called
      console.log('=== VALIDATING FORM DATA ===')
      console.log('Current formData:', formData)
      
      // Validate form data before saving
      const validationErrors = validateFormData(formData, currentUser)
      console.log('Validation errors:', validationErrors)
      
      // Check validation errors before proceeding
      if (validationErrors.length > 0) {
        const errorMessage = 'Please fix the following errors:\n\n' + validationErrors.join('\n')
        alert(errorMessage)
        // Scroll to top to show errors
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      
      console.log('Validation passed, preparing data to save')
      
      // Prepare profile data to save
      const profileDataToSave = {
        fullName: formData.fullName || currentUser.name,
        title: formData.title || '',
        email: formData.email || currentUser.email,
        phone: formData.phone || '',
        location: formData.location || '',
        aboutMe: formData.aboutMe || '',
        education: Array.isArray(formData.education) ? [...formData.education] : [],
        experience: Array.isArray(formData.experience) ? [...formData.experience] : [],
        certificates: Array.isArray(formData.certificates) ? [...formData.certificates] : [],
        paymentModel: formData.paymentModel || 'percentage',
        percentage: formData.percentage || '',
        fixedAmount: formData.fixedAmount || '',
        availability: formData.availability || '',
      }
      
      console.log('=== SAVING PROFILE ===')
      console.log('Profile data to save:', profileDataToSave)
      console.log('Education count:', profileDataToSave.education.length)
      console.log('Experience count:', profileDataToSave.experience.length)
      console.log('Certificates count:', profileDataToSave.certificates.length)
      
      // Wait for state update, then save (async operations outside setFormData)
      console.log('Calling saveTeacherProfile with:', profileDataToSave)
      console.log('User ID:', currentUser.id || '1')
      
      const result = await saveTeacherProfile(currentUser.id || '1', profileDataToSave)
      console.log('Save result:', result)
      
      if (result && result.success) {
        console.log('Profile saved successfully!')
        console.log('Saved teacher data:', result.teacher)
        
        // Clear draft data
        localStorage.removeItem('teacherOnboardingDraft')
        
        // Use the saved teacher data from the response instead of fetching again
        // This avoids "Failed to fetch" errors and uses the data we just saved
        if (result.teacher) {
          console.log('=== VERIFICATION USING SAVED DATA ===')
          console.log('Saved teacher data:', result.teacher)
          console.log('Verified fullName:', result.teacher.fullName)
          console.log('Verified profTitle:', result.teacher.profTitle)
          console.log('Verified education count:', result.teacher.education?.length || 0)
          console.log('Verified experience count:', result.teacher.experience?.length || 0)
          console.log('Verified certificates count:', result.teacher.certificatesCourses?.length || 0)
          
          // Verify key fields were saved
          const hasBasicInfo = result.teacher.fullName && result.teacher.profTitle && result.teacher.phoneNumber
          if (!hasBasicInfo) {
            console.error('Verification failed - basic info missing')
            alert('Warning: Profile may not have saved correctly. Please check your profile.')
          } else {
            console.log('Verification successful - profile data confirmed saved')
          }
        }
        
        // Show success message
        alert('Profile saved successfully!')
        
        // Clear cache to ensure fresh data is loaded on profile page
        const { clearTeacherProfileCache } = await import('../../utils/teacherProfile')
        clearTeacherProfileCache()
        
        // Navigate to profile page
        setTimeout(() => {
          navigate(`/training/teacher/${currentUser.id || '1'}`)
        }, 50)
      } else {
        console.error('Save failed:', result)
        const errorDetails = result?.errors ? `\n\nDetails: ${Array.isArray(result.errors) ? result.errors.join(', ') : result.errors}` : ''
        const errorMessage = result?.message || 'Unknown error occurred while saving'
        alert('Failed to save profile: ' + errorMessage + errorDetails)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      const errorMessage = error.message || 'An error occurred while saving your profile. Please try again.'
      alert('Error: ' + errorMessage)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  return (
    <>
      <PageHeader
        title="Become an Instructor"
        description="Join our community of experts and share your knowledge with the world."
        primaryButton={{ href: '/training', text: 'Back to Welcome' }}
        secondaryButton={{ href: '/training/auth', text: 'Return to Auth' }}
      />

      <section className="section" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div className="container" data-aos="fade-up">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Progress Indicator */}
              <div className="teacher-onboarding-progress mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  {steps.map((step, index) => (
                    <div key={step.id} className="d-flex align-items-center flex-grow-1">
                      <div className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                        <div
                          className={`progress-step ${index <= stepIndex ? 'completed' : ''} ${index === stepIndex ? 'active' : ''}`}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: index < stepIndex ? '#c85716' : index === stepIndex ? '#c85716' : '#e9ecef',
                            color: index <= stepIndex ? '#ffffff' : '#6c757d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '14px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {index < stepIndex ? (
                            <i className="bi bi-check" style={{ fontSize: '20px' }}></i>
                          ) : (
                            step.id
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: index <= stepIndex ? '#c85716' : '#6c757d',
                            fontWeight: index === stepIndex ? '600' : '400',
                            textAlign: 'center',
                          }}
                        >
                          {step.shortName}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className="progress-line"
                          style={{
                            flex: 1,
                            height: '2px',
                            backgroundColor: index < stepIndex ? '#c85716' : '#e9ecef',
                            margin: '0 10px',
                            marginTop: '-20px',
                            transition: 'all 0.3s ease',
                          }}
                        ></div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>

              {/* Form Card */}
              <div
                className="card"
                style={{
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  padding: '40px',
                }}
              >
                {/* Step 1: Personal Info */}
                  {stepIndex === 0 && (
                  <div>
                    <h3 style={{ color: '#110a06', marginBottom: '8px', fontWeight: '600' }}>
                      Personal Information
                    </h3>
                    <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '14px' }}>
                      Provide your basic personal details to get started.
                    </p>

                    <div className="row gy-3">
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Full Name <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., John Doe"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Professional Title <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., Senior Cloud Engineer"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Email Address <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="e.g., john.doe@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Phone Number <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="e.g., +1 (555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Location <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., San Francisco, CA, USA"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          required
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  )}

                {/* Step 2: About Me */}
                  {stepIndex === 1 && (
                  <div>
                    <h3 style={{ color: '#110a06', marginBottom: '8px', fontWeight: '600' }}>
                      Profile
                    </h3>
                    <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '14px' }}>
                      Tell students about your teaching style, expertise, and what makes you unique.
                    </p>

                    <div className="col-12">
                      <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                        About Me <span style={{ color: '#dc3545' }}>*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows="8"
                        placeholder="Describe your background, teaching philosophy, and what students can expect from your courses..."
                        value={formData.aboutMe}
                        onChange={(e) => handleInputChange('aboutMe', e.target.value)}
                        style={{
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          padding: '12px 14px',
                          resize: 'vertical',
                        }}
                      />
                      <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Minimum 100 characters recommended
                      </small>
                    </div>
                    </div>
                  )}

                {/* Step 3: Educational Background */}
                  {stepIndex === 2 && (
                  <div>
                    <h3 style={{ color: '#110a06', marginBottom: '8px', fontWeight: '600' }}>
                      Educational Background
                    </h3>
                    <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '14px' }}>
                      Add your academic qualifications, starting with the most recent.
                    </p>

                    {/* Existing Education Entries */}
                    {formData.education.length > 0 && (
                      <div className="mb-4">
                        {formData.education.map((edu) => (
                          <div
                            key={edu.id}
                            style={{
                              padding: '16px',
                              border: '1px solid #e9ecef',
                              borderRadius: '8px',
                              marginBottom: '12px',
                              backgroundColor: '#f8f9fa',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div style={{ flex: 1 }}>
                                <h5 style={{ color: '#110a06', marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                                  {edu.degree}
                                </h5>
                                {edu.fieldOfStudy && (
                                  <p style={{ color: '#6c757d', marginBottom: '4px', fontSize: '14px' }}>
                                    {edu.fieldOfStudy}
                                  </p>
                                )}
                                <p style={{ color: '#6c757d', marginBottom: '0', fontSize: '14px' }}>
                                  {edu.institution}
                                </p>
                                <p style={{ color: '#6c757d', marginBottom: '0', fontSize: '13px' }}>
                                  {formatDate(edu.startDate)} - {edu.currentlyStudying ? 'Present' : formatDate(edu.endDate)}
                                </p>
                              </div>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => editEducation(edu)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#c85716',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                  }}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil" style={{ fontSize: '18px' }}></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteEducation(edu.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc3545',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                  }}
                                  title="Delete"
                                >
                                  <i className="bi bi-trash" style={{ fontSize: '18px' }}></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Education Form */}
                    <div className="row gy-3">
                      <div className="col-md-12">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Institution Name <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., University of California"
                          value={educationForm.institution}
                          onChange={(e) => handleEducationFormChange('institution', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Degree <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., Bachelor of Science"
                          value={educationForm.degree}
                          onChange={(e) => handleEducationFormChange('degree', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Field of Study
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., Software Engineering"
                          value={educationForm.fieldOfStudy}
                          onChange={(e) => handleEducationFormChange('fieldOfStudy', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Start Date
                        </label>
                        <input
                          type="month"
                          className="form-control"
                          value={educationForm.startDate}
                          onChange={(e) => handleEducationFormChange('startDate', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          End Date
                        </label>
                        <input
                          type="month"
                          className="form-control"
                          value={educationForm.endDate}
                          onChange={(e) => handleEducationFormChange('endDate', e.target.value)}
                          disabled={educationForm.currentlyStudying}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                            opacity: educationForm.currentlyStudying ? 0.5 : 1,
                          }}
                        />
                        <div className="form-check mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={educationForm.currentlyStudying}
                            onChange={(e) => handleEducationFormChange('currentlyStudying', e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label className="form-check-label" style={{ fontSize: '13px', color: '#6c757d', cursor: 'pointer' }}>
                            Currently studying here
                          </label>
                        </div>
                      </div>
                      <div className="col-12 mt-3">
                        <button
                          type="button"
                          onClick={editingEducation ? updateEducation : addEducation}
                          className="btn"
                          style={{
                            backgroundColor: '#c85716',
                            color: '#ffffff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.95rem',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#b04a12'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#c85716'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <i className="bi bi-plus-circle" style={{ fontSize: '18px' }}></i>
                          {editingEducation ? 'Update This Institution' : 'Add This Institution'}
                        </button>
                      </div>
                    </div>
                  </div>
                  )}

                {/* Step 4: Professional Experience */}
                  {stepIndex === 3 && (
                  <div>
                    <h3 style={{ color: '#110a06', marginBottom: '8px', fontWeight: '600' }}>
                      Professional Experience
                    </h3>
                    <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '14px' }}>
                      Add your professional work experience, starting with the most recent.
                    </p>

                    {/* Existing Experience Entries */}
                    {formData.experience.length > 0 && (
                      <div className="mb-4">
                        {formData.experience.map((exp) => (
                          <div
                            key={exp.id}
                            style={{
                              padding: '16px',
                              border: '1px solid #e9ecef',
                              borderRadius: '8px',
                              marginBottom: '12px',
                              backgroundColor: '#f8f9fa',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div style={{ flex: 1 }}>
                                <h5 style={{ color: '#110a06', marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                                  {exp.position}
                                </h5>
                                <p style={{ color: '#6c757d', marginBottom: '4px', fontSize: '14px' }}>
                                  {exp.company}
                                </p>
                                <p style={{ color: '#6c757d', marginBottom: '4px', fontSize: '13px' }}>
                                  {formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                                </p>
                                {exp.description && (
                                  <p style={{ color: '#6c757d', marginBottom: '0', fontSize: '13px', marginTop: '8px' }}>
                                    {exp.description}
                                  </p>
                                )}
                              </div>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => editExperience(exp)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#c85716',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                  }}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil" style={{ fontSize: '18px' }}></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteExperience(exp.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc3545',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                  }}
                                  title="Delete"
                                >
                                  <i className="bi bi-trash" style={{ fontSize: '18px' }}></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                    {/* Experience Form */}
                    <div className="row gy-3">
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Company Name <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., Google Inc."
                          value={experienceForm.company}
                          onChange={(e) => handleExperienceFormChange('company', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Position <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., Senior Software Engineer"
                          value={experienceForm.position}
                          onChange={(e) => handleExperienceFormChange('position', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Start Date
                        </label>
                        <input
                          type="month"
                          className="form-control"
                          value={experienceForm.startDate}
                          onChange={(e) => handleExperienceFormChange('startDate', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          End Date
                        </label>
                        <input
                          type="month"
                          className="form-control"
                          value={experienceForm.endDate}
                          onChange={(e) => handleExperienceFormChange('endDate', e.target.value)}
                          disabled={experienceForm.currentlyWorking}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                            opacity: experienceForm.currentlyWorking ? 0.5 : 1,
                          }}
                        />
                        <div className="form-check mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={experienceForm.currentlyWorking}
                            onChange={(e) => handleExperienceFormChange('currentlyWorking', e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label className="form-check-label" style={{ fontSize: '13px', color: '#6c757d', cursor: 'pointer' }}>
                            Currently working here
                          </label>
                        </div>
                      </div>
                    <div className="col-12">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Description
                        </label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Describe your responsibilities and achievements..."
                          value={experienceForm.description}
                          onChange={(e) => handleExperienceFormChange('description', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <div className="col-12 mt-3">
                        <button
                          type="button"
                          onClick={editingExperience ? updateExperience : addExperience}
                          className="btn"
                          style={{
                            backgroundColor: '#c85716',
                            color: '#ffffff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.95rem',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#b04a12'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#c85716'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <i className="bi bi-plus-circle" style={{ fontSize: '18px' }}></i>
                          {editingExperience ? 'Update This Experience' : 'Add This Experience'}
                        </button>
                      </div>
                    </div>
                    </div>
                  )}

                {/* Step 5: Certificates */}
                  {stepIndex === 4 && (
                  <div>
                    <h3 style={{ color: '#110a06', marginBottom: '8px', fontWeight: '600' }}>
                      Certificates
                    </h3>
                    <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '14px' }}>
                      Add your professional certificates.
                    </p>

                    {/* Certificates Section */}
                    <div>
                      <h5 style={{ color: '#110a06', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                        Professional Certificates
                      </h5>

                      {/* Existing Certificates */}
                      {formData.certificates.length > 0 && (
                        <div className="mb-4">
                          {formData.certificates.map((cert) => (
                            <div
                              key={cert.id}
                              style={{
                                padding: '16px',
                                border: '1px solid #e9ecef',
                                borderRadius: '8px',
                                marginBottom: '12px',
                                backgroundColor: '#f8f9fa',
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start">
                                <div style={{ flex: 1 }}>
                                  <h5 style={{ color: '#110a06', marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                                    {cert.certificateName}
                                  </h5>
                                  <p style={{ color: '#6c757d', marginBottom: '4px', fontSize: '14px' }}>
                                    {cert.issuingOrganization}
                                  </p>
                                  {cert.credentialId && (
                                    <p style={{ color: '#6c757d', marginBottom: '4px', fontSize: '13px' }}>
                                      Credential ID: {cert.credentialId}
                                    </p>
                                  )}
                                  <p style={{ color: '#6c757d', marginBottom: '0', fontSize: '13px' }}>
                                    Issued: {formatDate(cert.issueDate)}
                                    {cert.expiryDate && ` - Expires: ${formatDate(cert.expiryDate)}`}
                                  </p>
                                </div>
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => editCertificate(cert)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#c85716',
                                      cursor: 'pointer',
                                      padding: '4px 8px',
                                    }}
                                    title="Edit"
                                  >
                                    <i className="bi bi-pencil" style={{ fontSize: '18px' }}></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteCertificate(cert.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#dc3545',
                                      cursor: 'pointer',
                                      padding: '4px 8px',
                                    }}
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash" style={{ fontSize: '18px' }}></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Certificate Form */}
                      <div className="row gy-3">
                        <div className="col-md-6">
                          <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                            Certificate Name <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., AWS Solutions Architect"
                            value={certificateForm.certificateName}
                            onChange={(e) => handleCertificateFormChange('certificateName', e.target.value)}
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '10px 14px',
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                            Issuing Organization <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., Amazon Web Services"
                            value={certificateForm.issuingOrganization}
                            onChange={(e) => handleCertificateFormChange('issuingOrganization', e.target.value)}
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '10px 14px',
                            }}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                            Issue Date
                          </label>
                          <input
                            type="month"
                            className="form-control"
                            value={certificateForm.issueDate}
                            onChange={(e) => handleCertificateFormChange('issueDate', e.target.value)}
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '10px 14px',
                            }}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                            Expiry Date
                          </label>
                          <input
                            type="month"
                            className="form-control"
                            placeholder="Leave empty if no expiry"
                            value={certificateForm.expiryDate}
                            onChange={(e) => handleCertificateFormChange('expiryDate', e.target.value)}
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '10px 14px',
                            }}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                            Credential ID
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Optional"
                            value={certificateForm.credentialId}
                            onChange={(e) => handleCertificateFormChange('credentialId', e.target.value)}
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '10px 14px',
                            }}
                          />
                      </div>
                      <div className="col-12 mt-3">
                          <button
                            type="button"
                            onClick={editingCertificate ? updateCertificate : addCertificate}
                            className="btn"
                            style={{
                              backgroundColor: '#c85716',
                              color: '#ffffff',
                              border: 'none',
                              padding: '12px 24px',
                              borderRadius: '6px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '0.95rem',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#b04a12'
                              e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#c85716'
                              e.currentTarget.style.transform = 'translateY(0)'
                            }}
                          >
                            <i className="bi bi-plus-circle" style={{ fontSize: '18px' }}></i>
                            {editingCertificate ? 'Update Certificate' : 'Add Certificate'}
                          </button>
                      </div>
                      </div>
                    </div>
                  </div>
                  )}

                {/* Step 6: Payment Model */}
                  {stepIndex === 5 && (
                  <div>
                    <h3 style={{ color: '#110a06', marginBottom: '8px', fontWeight: '600' }}>
                      Payment Model
                    </h3>
                    <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '14px' }}>
                      Select your preferred payment model and provide additional details.
                    </p>

                    <div className="row gy-3">
                      <div className="col-md-12">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Preferred Payment Model <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <select
                          className="form-select"
                          value={formData.paymentModel}
                          onChange={(e) => handleInputChange('paymentModel', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        >
                          <option value="percentage">Percentage-based (Revenue Share)</option>
                          <option value="fixed">Fixed Pay per Course</option>
                        </select>
                        <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          {formData.paymentModel === 'percentage'
                            ? 'You will receive a percentage of the course revenue'
                            : 'You will receive a fixed amount per course'}
                        </small>
                      </div>
                      {formData.paymentModel === 'percentage' && (
                        <div className="col-md-12">
                          <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                            Percentage (%) <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g., 50"
                            min="1"
                            max="100"
                            value={formData.percentage}
                            onChange={(e) => handleInputChange('percentage', e.target.value)}
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '10px 14px',
                            }}
                          />
                      </div>
                      )}
                      {formData.paymentModel === 'fixed' && (
                        <div className="col-md-12">
                          <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                            Fixed Amount per Course <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g., 5000"
                            min="0"
                            value={formData.fixedAmount}
                            onChange={(e) => handleInputChange('fixedAmount', e.target.value)}
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '10px 14px',
                            }}
                          />
                        </div>
                      )}
                      <div className="col-md-12">
                        <label className="form-label" style={{ color: '#110a06', fontWeight: '500', marginBottom: '8px' }}>
                          Availability
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., Weeknights, Weekends, Flexible"
                          value={formData.availability}
                          onChange={(e) => handleInputChange('availability', e.target.value)}
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '10px 14px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div
                  className="d-flex justify-content-between align-items-center mt-4 pt-4"
                  style={{ borderTop: '1px solid #e9ecef' }}
                >
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={stepIndex === 0}
                    className="btn"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#110a06',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      padding: '10px 24px',
                      fontWeight: '500',
                      cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
                      opacity: stepIndex === 0 ? 0.5 : 1,
                    }}
                  >
                    Back
                  </button>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="btn"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#110a06',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '10px 24px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      Save as Draft
                    </button>
                    {stepIndex < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={goNext}
                        className="btn btn-primary"
                        style={{
                          backgroundColor: '#c85716',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 24px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Next Step
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        style={{
                          backgroundColor: '#c85716',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 24px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Complete Registration
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ChatWidget userType="teacher" />
    </>
  )
}

export default TeacherOnboarding
