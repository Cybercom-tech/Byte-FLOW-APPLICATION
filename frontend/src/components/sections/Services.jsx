import { Link } from 'react-router-dom'
const servicesImage = '/assets/img/services/services-3.webp'

function Services() {
  return (
    <section id="services" className="services section">
      <div className="container section-title" data-aos="fade-up">
        <span className="subtitle">Services</span>
        <h2>Services</h2>
        <p>We provide comprehensive IT solutions and call centre services to meet your business needs</p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="services-showcase mt-5">
          <div className="row g-0">
            <div className="col-lg-6">
              <div className="featured-service" data-aos="fade-right" data-aos-delay="200">
                <div className="service-image">
                  <img src={servicesImage} alt="Featured Service" className="img-fluid" />
                </div>
                <div className="service-overlay">
                  <div className="overlay-content">
                    <h3>Our Services</h3>
                    <p>
                      ByteFlow Innovations offers comprehensive IT solutions including Call Centre Services, IT Training, 
                      Software Development, and IT/Hardware solutions. We provide 24/7 support and professional services 
                      to help your business thrive in the digital age.
                    </p>
                    <a href="#contact" className="service-link">
                      <span>View All Services</span>
                      <i className="bi bi-arrow-right"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="services-list">
                <div className="service-item" data-aos="fade-left" data-aos-delay="100">
                  <div className="service-icon">
                    <i className="bi bi-telephone"></i>
                  </div>
                  <div className="service-content">
                    <h4><Link to="/callcentre">Call Centre Services</Link></h4>
                    <p>
                      Professional 24/7 call centre services with dedicated support teams. We provide exceptional 
                      customer service, technical support, and business inquiries handling to ensure your customers 
                      receive prompt and professional assistance.
                    </p>
                  </div>
                </div>

                <div className="service-item" data-aos="fade-left" data-aos-delay="200">
                  <div className="service-icon">
                    <i className="bi bi-mortarboard"></i>
                  </div>
                  <div className="service-content">
                    <h4><Link to="/training">IT Training Services</Link></h4>
                    <p>
                      Comprehensive IT training programs covering programming, cybersecurity, cloud computing, and 
                      network management. Our expert instructors provide hands-on learning experiences to advance your 
                      technical skills and career.
                    </p>
                  </div>
                </div>

                <div className="service-item" data-aos="fade-left" data-aos-delay="300">
                  <div className="service-icon">
                    <i className="bi bi-code-slash"></i>
                  </div>
                  <div className="service-content">
                    <h4><a href="#contact">Software Development</a></h4>
                    <p>
                      Custom software development solutions tailored to your business needs. We create scalable 
                      applications, web platforms, and mobile solutions using modern technologies to drive your 
                      digital transformation.
                    </p>
                  </div>
                </div>

                <div className="service-item" data-aos="fade-left" data-aos-delay="400">
                  <div className="service-icon">
                    <i className="bi bi-hdd-network"></i>
                  </div>
                  <div className="service-content">
                    <h4><a href="#contact">IT Hardware Solutions</a></h4>
                    <p>
                      Complete IT hardware procurement, installation, and maintenance services. We provide servers, 
                      workstations, networking equipment, and peripherals to support your business operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services

