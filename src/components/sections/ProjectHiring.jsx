import { useState } from 'react'
import api from '../../utils/api'

function ProjectHiring() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    projectDetails: '',
    contactTime: ''
  })
  const [formStatus, setFormStatus] = useState({ loading: false, error: '', success: false })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormStatus({ loading: true, error: '', success: false })

    try {
      await api.post('/contact/submit', {
        name: formData.contactPerson,
        email: formData.contactEmail,
        phone: formData.contactPhone,
        subject: 'Project Hiring Request',
        message: formData.projectDetails,
        formType: 'Project Hiring',
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        projectDetails: formData.projectDetails,
        contactTime: formData.contactTime
      }, { includeAuth: false })

      setFormStatus({ loading: false, error: '', success: true })
      setFormData({
        companyName: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        projectDetails: '',
        contactTime: ''
      })
    } catch (error) {
      setFormStatus({ 
        loading: false, 
        error: error.message || 'Failed to send request. Please try again.', 
        success: false 
      })
    }
  }

  return (
    <section id="project-hiring" className="project-hiring section">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="section-title text-center">
              <span className="subtitle">Hire Our Services</span>
              <h2>Project Hiring</h2>
              <p>Need call centre services for your project? Get in touch with us to discuss your requirements</p>
            </div>

            <div className="hiring-form">
              <form onSubmit={handleSubmit} className="php-email-form">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="company-name">Company Name *</label>
                      <input
                        type="text"
                        name="companyName"
                        className="form-control"
                        id="company-name"
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="contact-person">Contact Person *</label>
                      <input
                        type="text"
                        name="contactPerson"
                        className="form-control"
                        id="contact-person"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="contact-email">Email *</label>
                      <input
                        type="email"
                        name="contactEmail"
                        className="form-control"
                        id="contact-email"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="contact-phone">Phone Number *</label>
                      <input
                        type="tel"
                        name="contactPhone"
                        className="form-control"
                        id="contact-phone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="project-details">Project Details *</label>
                  <textarea
                    name="projectDetails"
                    className="form-control"
                    id="project-details"
                    rows="4"
                    placeholder="Please describe your project requirements..."
                    value={formData.projectDetails}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="contact-time">Preferred Contact Time</label>
                  <input
                    type="text"
                    name="contactTime"
                    className="form-control"
                    id="contact-time"
                    placeholder="e.g., 9 AM - 5 PM, Monday to Friday"
                    value={formData.contactTime}
                    onChange={handleChange}
                  />
                </div>
                <div className="text-center">
                  <button type="submit" className="btn btn-primary" disabled={formStatus.loading}>
                    Submit Project Request
                  </button>
                </div>
                <div className="my-3">
                  {formStatus.loading && <div className="loading">Loading</div>}
                  {formStatus.error && <div className="error-message">{formStatus.error}</div>}
                  {formStatus.success && <div className="sent-message">Your project request has been sent. We'll contact you soon!</div>}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProjectHiring

