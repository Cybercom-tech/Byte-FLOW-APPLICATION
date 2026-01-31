function CallCentreServices() {
  const services = [
    {
      icon: 'bi-clock',
      title: '24/7 Customer Support',
      description: 'Our dedicated team is available around the clock to assist with any inquiries or issues you may have. We ensure your customers receive support whenever they need it.'
    },
    {
      icon: 'bi-telephone-plus',
      title: 'Multi-Channel Communication',
      description: 'Connect with us through phone, email, or live chat. We ensure seamless communication across multiple channels to meet your customers\' preferences.'
    },
    {
      icon: 'bi-diagram-3',
      title: 'Advanced Call Routing',
      description: 'Our sophisticated call routing system directs your calls to the appropriate department or agent efficiently, reducing wait times and improving customer satisfaction.'
    },
    {
      icon: 'bi-graph-up',
      title: 'Real-Time Analytics',
      description: 'Get actionable insights with our real-time analytics tools that track and analyze customer interactions, helping you make data-driven decisions.'
    },
    {
      icon: 'bi-people',
      title: 'Experienced Staff',
      description: 'Our team is comprised of highly skilled professionals with extensive experience in customer service, ensuring quality interactions with every call.'
    },
    {
      icon: 'bi-house',
      title: 'Comfortable Work Environment',
      description: 'We provide a supportive and comfortable work environment to ensure our staff is motivated and productive, leading to better customer service.'
    }
  ]

  return (
    <section id="services" className="services section">
      <div className="container section-title" data-aos="fade-up">
        <span className="subtitle">Call Centre Services</span>
        <h2>Call Centre Excellence</h2>
        <p>Comprehensive call centre solutions designed to deliver exceptional customer experiences</p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row g-4">
          {services.map((service, index) => (
            <div key={index} className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={150 + index * 50}>
              <div className="service-card">
                <div className="service-icon">
                  <i className={`bi ${service.icon}`}></i>
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CallCentreServices

