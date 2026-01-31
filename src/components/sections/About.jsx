const aboutImage = '/assets/img/about/about-1.webp'

function About() {
  return (
    <section id="about" className="about section">
      <div className="container section-title" data-aos="fade-up">
        <span className="subtitle">About Us</span>
        <h2>About Us</h2>
        <p>
          ByteFlow Innovations is an established and reputable IT company that operates Call Centre in Pakistan. 
          We offer a comprehensive suite of IT solutions and services.
        </p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row align-items-center">
          <div className="col-lg-6" data-aos="fade-right" data-aos-delay="200">
            <div className="content">
              <h2>Empowering organizations with digital transformation solutions</h2>
              <p className="lead">
                We empower organizations with the tools and strategies to excel in an increasingly digital landscape. 
                We're positioning ourselves to become market leader in Digital Transformation to increase productivity.
              </p>
              <p>
                Our range of services encompasses Network Architecture Virtualization, IT Consultancy, IT Services, 
                IT Hardware/Software, Networking, Licensed software, professional training and providing on-demand 
                customized IT solutions.
              </p>
              <div className="stats-wrapper">
                <div className="stat-item">
                  <span className="number purecounter" data-purecounter-start="0" data-purecounter-end="5" data-purecounter-duration="1"></span>
                  <span className="label">Years of Excellence</span>
                </div>
                <div className="stat-item">
                  <span className="number purecounter" data-purecounter-start="0" data-purecounter-end="200" data-purecounter-duration="1"></span>
                  <span className="label">Projects Completed</span>
                </div>
                <div className="stat-item">
                  <span className="number purecounter" data-purecounter-start="0" data-purecounter-end="24" data-purecounter-duration="1"></span>
                  <span className="label">Hours Support</span>
                </div>
              </div>
              <div className="cta-wrapper">
                <a href="#services" className="btn-link">
                  Read More
                  <i className="bi bi-arrow-right"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="col-lg-6" data-aos="fade-left" data-aos-delay="300">
            <div className="image-wrapper">
              <img src={aboutImage} alt="About us" className="img-fluid" />
              <div className="floating-element">
                <div className="quote-content">
                  <blockquote>
                    "Excellence is never an accident. It is always the result of high intention, sincere effort, 
                    and intelligent execution."
                  </blockquote>
                  <cite>— Aristotle</cite>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About

