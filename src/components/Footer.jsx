import { Link } from 'react-router-dom'
import { useState } from 'react'
import api from '../utils/api'
const logo = '/assets/img/logo.png'

function Footer() {
  const [email, setEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState({ loading: false, error: '', success: false })

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    setNewsletterStatus({ loading: true, error: '', success: false })

    try {
      await api.post('/newsletter/subscribe', { email }, { includeAuth: false })
      setNewsletterStatus({ loading: false, error: '', success: true })
      setEmail('')
    } catch (error) {
      setNewsletterStatus({ 
        loading: false, 
        error: error.message || 'Failed to subscribe. Please try again.', 
        success: false 
      })
    }
  }

  return (
    <footer id="footer" className="footer dark-background">
      <div className="container">
        <div className="row gy-5">
          <div className="col-lg-4">
            <div className="footer-content">
              <Link to="/" className="logo d-flex align-items-center mb-4">
                <img src={logo} alt="ByteFlow Innovations Logo" className="logo-img me-2" />
                <span className="sitename">ByteFlow Innovations</span>
              </Link>
              <p className="mb-4">
                Byteflow's competitive advantage lies in its exceptional commitment to excellence across several areas, 
                constant innovation, and outstanding after-sales services.
              </p>

              <div className="newsletter-form">
                <h5>Subscribe To Our Newsletter</h5>
                <p>
                  Subscribe to our newsletter to stay updated with the latest news, insights, and exclusive content. 
                  Receive curated articles, industry trends, and special offers directly in your inbox, ensuring you 
                  never miss important updates. Join our community and stay informed with valuable information delivered right to you.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="php-email-form">
                  <div className="input-group">
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-subscribe" disabled={newsletterStatus.loading}>
                      <i className="bi bi-send"></i>
                    </button>
                  </div>
                  {newsletterStatus.loading && <div className="loading">Loading</div>}
                  {newsletterStatus.error && <div className="error-message">{newsletterStatus.error}</div>}
                  {newsletterStatus.success && <div className="sent-message">Thank you for subscribing!</div>}
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-6">
            <div className="footer-links">
              <h4>Byte Innovations</h4>
              <ul>
                <li><Link to="/#about"><i className="bi bi-chevron-right"></i> About</Link></li>
                <li><Link to="/#services"><i className="bi bi-chevron-right"></i> Services</Link></li>
                <li><Link to="/#training"><i className="bi bi-chevron-right"></i> Training</Link></li>
                <li><Link to="/#contact"><i className="bi bi-chevron-right"></i> Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="col-lg-2 col-6">
            <div className="footer-links">
              <h4>Company</h4>
              <ul>
                <li><Link to="/callcentre"><i className="bi bi-chevron-right"></i> Call Centre</Link></li>
                <li><Link to="/#services"><i className="bi bi-chevron-right"></i> IT Training Services</Link></li>
                <li><Link to="/#training"><i className="bi bi-chevron-right"></i> Software Development</Link></li>
                <li><Link to="/#contact"><i className="bi bi-chevron-right"></i> IT Hardware/Software</Link></li>
              </ul>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="footer-contact">
              <h4>Get in Touch</h4>
              <div className="contact-item">
                <div className="contact-icon">
                  <i className="bi bi-geo-alt"></i>
                </div>
                <div className="contact-info">
                  <p>First Floor, The Box, Software Technology Park, F-11 Markaz, Islamabad<br />Pakistan</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <i className="bi bi-telephone"></i>
                </div>
                <div className="contact-info">
                  <p>+92-51-4718365</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <i className="bi bi-envelope"></i>
                </div>
                <div className="contact-info">
                  <p>Info@ByteFlowinnovations.com</p>
                </div>
              </div>

              <div className="social-links">
                <a href="#"><i className="bi bi-facebook"></i></a>
                <a href="#"><i className="bi bi-twitter-x"></i></a>
                <a href="#"><i className="bi bi-linkedin"></i></a>
                <a href="#"><i className="bi bi-youtube"></i></a>
                <a href="#"><i className="bi bi-github"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="copyright">
                <p>
                  © <span>All Rights Reserved By</span>{' '}
                  <strong className="px-1 sitename">ByteFlow Innovations</strong>
                </p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="footer-bottom-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
              </div>
              <div className="credits">
                Created by <a href="https://pk.linkedin.com/in/nimra-khan-b92a05282">Nimra Khan</a> |{' '}
                <a href="https://pk.linkedin.com/in/laibaishtiaq">Laiba Ishtiaq</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

