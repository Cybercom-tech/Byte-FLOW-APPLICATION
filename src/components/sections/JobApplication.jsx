import { useState } from 'react'
import api from '../../utils/api'

function JobApplication() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    resume: null,
    coverLetter: ''
  })
  const [formStatus, setFormStatus] = useState({ loading: false, error: '', success: false })

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0]
      })
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      })
    }
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  const validateFile = (file) => {
    if (!file) return 'Resume is required'
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF or Word document (.pdf, .doc, .docx)'
    }
    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      setFormStatus({ loading: false, error: 'Please enter your name', success: false })
      return
    }
    
    if (!formData.email.trim()) {
      setFormStatus({ loading: false, error: 'Please enter your email', success: false })
      return
    }
    
    if (!validateEmail(formData.email)) {
      setFormStatus({ loading: false, error: 'Please enter a valid email address', success: false })
      return
    }
    
    if (!formData.phone.trim()) {
      setFormStatus({ loading: false, error: 'Please enter your phone number', success: false })
      return
    }
    
    if (!validatePhone(formData.phone)) {
      setFormStatus({ loading: false, error: 'Please enter a valid phone number', success: false })
      return
    }
    
    const fileError = validateFile(formData.resume)
    if (fileError) {
      setFormStatus({ loading: false, error: fileError, success: false })
      return
    }
    
    setFormStatus({ loading: true, error: '', success: false })

    try {
      // Note: File upload (resume) would need multipart/form-data handling
      // For now, we'll send the form data without the file
      // You can implement file upload separately if needed
      await api.post('/contact/submit', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: 'Job Application',
        message: formData.coverLetter || 'Job application submitted',
        formType: 'Job Application',
        resume: formData.resume ? formData.resume.name : '', // Just the filename for now
        coverLetter: formData.coverLetter
      }, { includeAuth: false })

      setFormStatus({ loading: false, error: '', success: true })
      setFormData({ name: '', email: '', phone: '', resume: null, coverLetter: '' })
    } catch (error) {
      setFormStatus({ 
        loading: false, 
        error: error.message || 'Failed to submit application. Please try again.', 
        success: false 
      })
    }
  }

  return (
    <section id="job-application" className="job-application section light-background">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="section-title text-center">
              <span className="subtitle">Join Our Team</span>
              <h2>Apply for a Job</h2>
              <p>Join our experienced call centre team and be part of providing exceptional customer service</p>
            </div>

            <div className="application-form">
              <form onSubmit={handleSubmit} className="php-email-form">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="name">Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="resume">Resume *</label>
                      <input
                        type="file"
                        name="resume"
                        className="form-control"
                        id="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="cover-letter">Cover Letter</label>
                  <textarea
                    name="coverLetter"
                    className="form-control"
                    id="cover-letter"
                    rows="5"
                    placeholder="Tell us why you want to join our team..."
                    value={formData.coverLetter}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <div className="text-center">
                  <button type="submit" className="btn btn-primary" disabled={formStatus.loading}>
                    Submit Application
                  </button>
                </div>
                <div className="my-3">
                  {formStatus.loading && <div className="loading">Loading</div>}
                  {formStatus.error && <div className="error-message">{formStatus.error}</div>}
                  {formStatus.success && <div className="sent-message">Your application has been sent. Thank you!</div>}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default JobApplication

