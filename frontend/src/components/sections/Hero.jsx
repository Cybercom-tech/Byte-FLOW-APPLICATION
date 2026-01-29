import React from 'react'

const video = '/assets/img/video/video-2.mp4'

function Hero() {
  return (
    <section id="hero" className="hero section dark-background">
      <div className="video-background">
        <video autoPlay muted loop playsInline>
          <source src={video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay"></div>
      </div>

      <div className="hero-content">
        <div className="container position-relative">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h1 data-aos="fade-up" data-aos-delay="100">
                WELCOME TO<br />
                <span className="highlight">Byte Flow Innovations</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200">
                We're here to provide you with exceptional customer service, ensuring your needs are met promptly 
                and professionally. Whether you have a question, need support, or want to share feedback, our 
                dedicated team is ready to assist you 24/7. Your satisfaction is our priority!
              </p>
              <div className="hero-buttons" data-aos="fade-up" data-aos-delay="300">
                <a href="#contact" className="btn btn-primary">CONTACT US</a>
                <a href="#services" className="btn btn-outline">View Services</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

