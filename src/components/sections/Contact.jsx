import { useState } from 'react'
import api from '../../utils/api'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [formStatus, setFormStatus] = useState({ loading: false, error: '', success: false })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    // Allow various phone formats
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
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
    
    if (formData.phone && !validatePhone(formData.phone)) {
      setFormStatus({ loading: false, error: 'Please enter a valid phone number', success: false })
      return
    }
    
    if (!formData.subject.trim()) {
      setFormStatus({ loading: false, error: 'Please enter a subject', success: false })
      return
    }
    
    if (!formData.message.trim()) {
      setFormStatus({ loading: false, error: 'Please enter a message', success: false })
      return
    }
    
    if (formData.message.trim().length < 10) {
      setFormStatus({ loading: false, error: 'Message must be at least 10 characters long', success: false })
      return
    }
    
    setFormStatus({ loading: true, error: '', success: false })

    try {
      await api.post('/contact/submit', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        subject: formData.subject,
        message: formData.message,
        formType: 'Contact'
      }, { includeAuth: false })

      setFormStatus({ loading: false, error: '', success: true })
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error) {
      setFormStatus({ 
        loading: false, 
        error: error.message || 'Failed to send message. Please try again.', 
        success: false 
      })
    }
  }

  return (
    <section id="contact" className="contact section">
      <div className="container section-title" data-aos="fade-up">
        <span className="subtitle">Contact</span>
        <h2>Contact Us</h2>
        <p>Ready to transform your business with our IT solutions? Get in touch with our expert team today</p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row align-items-stretch">
          <div className="col-lg-7 order-lg-1 order-2" data-aos="fade-right" data-aos-delay="200">
            <div className="contact-form-container">
              <div className="form-intro">
                <h2>Let's Start a Conversation</h2>
                <p>
                  Tell us about your IT needs and we'll provide you with a customized solution that fits your 
                  business requirements and budget.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="php-email-form contact-form">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-field">
                      <input
                        type="text"
                        name="name"
                        className="form-input"
                        id="userName"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="userName" className="field-label">Name</label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-field">
                      <input
                        type="email"
                        className="form-input"
                        name="email"
                        id="userEmail"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="userEmail" className="field-label">Email</label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-field">
                      <input
                        type="tel"
                        className="form-input"
                        name="phone"
                        id="userPhone"
                        placeholder="Your Phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      <label htmlFor="userPhone" className="field-label">Phone</label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-field">
                      <input
                        type="text"
                        className="form-input"
                        name="subject"
                        id="messageSubject"
                        placeholder="Subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="messageSubject" className="field-label">Subject</label>
                    </div>
                  </div>
                </div>

                <div className="form-field message-field">
                  <textarea
                    className="form-input message-input"
                    name="message"
                    id="userMessage"
                    rows="5"
                    placeholder="Tell us about your project"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                  <label htmlFor="userMessage" className="field-label">Message</label>
                </div>

                <div className="my-3">
                  {formStatus.loading && <div className="loading">Loading</div>}
                  {formStatus.error && <div className="error-message">{formStatus.error}</div>}
                  {formStatus.success && <div className="sent-message">Your message has been sent. Thank you!</div>}
                </div>

                <button type="submit" className="send-button" disabled={formStatus.loading}>
                  Send Message
                  <span className="button-arrow">→</span>
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-5 order-lg-2 order-1" data-aos="fade-left" data-aos-delay="300">
            <div className="contact-sidebar">
              <div className="contact-header">
                <h3>Get in Touch</h3>
                <p>
                  Contact our team for professional IT services, call centre solutions, and training programs. 
                  We're here to help your business succeed.
                </p>
              </div>

              <div className="contact-methods">
                <div className="contact-method" data-aos="fade-in" data-aos-delay="350">
                  <div className="contact-icon">
                    <i className="bi bi-geo-alt"></i>
                  </div>
                  <div className="contact-details">
                    <span className="method-label">Address</span>
                    <p>
                      Software Technology Park (THE BOX)<br />
                      F-11 Markaz, Islamabad, Pakistan
                    </p>
                  </div>
                </div>

                <div className="contact-method" data-aos="fade-in" data-aos-delay="400">
                  <div className="contact-icon">
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div className="contact-details">
                    <span className="method-label">Email</span>
                    <p>Info@ByteFlowinnovations.com</p>
                  </div>
                </div>

                <div className="contact-method" data-aos="fade-in" data-aos-delay="450">
                  <div className="contact-icon">
                    <i className="bi bi-telephone"></i>
                  </div>
                  <div className="contact-details">
                    <span className="method-label">Phone</span>
                    <p>+92-51-4718365</p>
                  </div>
                </div>

                <div className="contact-method" data-aos="fade-in" data-aos-delay="500">
                  <div className="contact-icon">
                    <i className="bi bi-clock"></i>
                  </div>
                  <div className="contact-details">
                    <span className="method-label">Hours</span>
                    <p>
                      24/7 Support Available<br />
                      Monday - Friday: 9AM - 6PM
                    </p>
                  </div>
                </div>
              </div>

              <div className="connect-section" data-aos="fade-up" data-aos-delay="550">
                <span className="connect-label">Connect with us</span>
                <div className="social-links">
                  <a href="#" className="social-link">
                    <i className="bi bi-linkedin"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="bi bi-twitter-x"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="bi bi-instagram"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="bi bi-facebook"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact

