import { useState } from 'react'
const features1 = '/assets/img/features/features-1.webp'
const features2 = '/assets/img/features/features-2.webp'
const features4 = '/assets/img/features/features-4.webp'
const features5 = '/assets/img/features/features-5.webp'

function Features() {
  const [activeTab, setActiveTab] = useState(1)

  const tabs = [
    {
      id: 1,
      number: '01',
      title: 'Innovation',
      subtitle: 'Creative solutions',
      badge: { icon: 'bi-lightbulb', text: 'Innovation Hub' },
      heading: 'Advanced IT Infrastructure',
      description: 'We provide cutting-edge IT infrastructure solutions that ensure your business operates at peak efficiency. Our comprehensive approach covers network architecture, cloud computing, and cybersecurity to keep your systems secure and optimized.',
      stats: [
        { value: '145%', label: 'Innovation Rate' },
        { value: '28K', label: 'Ideas Generated' }
      ],
      points: [
        'Reliable network architecture and high availability',
        'Secure cloud deployments with best‑practice controls',
        'Proactive monitoring and rapid incident response'
      ],
      image: features2,
      floatingCard: { icon: 'bi-lightning-charge', label: 'Speed', value: '3x Faster' }
    },
    {
      id: 2,
      number: '02',
      title: 'Strategy',
      subtitle: 'Business growth',
      badge: { icon: 'bi-compass', text: 'Strategic Planning' },
      heading: '24/7 Call Centre Excellence',
      description: 'Our dedicated call centre team provides round-the-clock customer support with exceptional service quality. We ensure your customers receive prompt, professional assistance whenever they need it, building lasting relationships and trust.',
      stats: [
        { value: '234%', label: 'Growth Rate' },
        { value: '156', label: 'Strategies' }
      ],
      points: [
        '24/7 customer support with SLA‑backed response times',
        'Multi‑channel communication: phone, email, and live chat',
        'Advanced call routing and quality assurance'
      ],
      image: features4,
      floatingCard: { icon: 'bi-graph-up-arrow', label: 'Growth', value: '+189% ROI' }
    },
    {
      id: 3,
      number: '03',
      title: 'Performance',
      subtitle: 'Optimal results',
      badge: { icon: 'bi-speedometer2', text: 'High Performance' },
      heading: 'Professional IT Training',
      description: 'Our comprehensive training programs equip professionals with the latest IT skills and knowledge. From cybersecurity to cloud computing, we provide hands-on learning experiences that advance careers and enhance technical expertise.',
      stats: [
        { value: '99.8%', label: 'System Uptime' },
        { value: '2.4s', label: 'Load Time' }
      ],
      points: [
        'Instructor‑led courses with hands‑on labs',
        'Beginner to advanced learning tracks',
        'Industry‑aligned, job‑ready curriculum'
      ],
      image: features1,
      floatingCard: { icon: 'bi-cpu', label: 'Power', value: '128 Cores' }
    },
    {
      id: 4,
      number: '04',
      title: 'Integration',
      subtitle: 'Seamless workflow',
      badge: { icon: 'bi-puzzle', text: 'Smart Integration' },
      heading: 'Cybersecurity Solutions',
      description: 'Protect your business with our advanced cybersecurity solutions. We implement comprehensive security measures including network protection, data encryption, and threat monitoring to safeguard your valuable information and maintain business continuity.',
      stats: [
        { value: '450+', label: 'Integrations' },
        { value: '85%', label: 'Automation' }
      ],
      points: [
        'Continuous threat monitoring and alerting',
        'Compliance, audits, and security awareness training'
      ],
      image: features5,
      floatingCard: { icon: 'bi-link-45deg', label: 'Connected', value: '24/7 Sync' }
    }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <section id="features" className="features section">
      <div className="container section-title" data-aos="fade-up">
        <span className="subtitle">Features</span>
        <h2>Why Choose ByteFlow Innovations</h2>
        <p>
          Discover our comprehensive IT solutions and innovative features designed to transform your business operations
        </p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="tabs-wrapper">
          <div className="tabs-header" data-aos="fade-up" data-aos-delay="200">
            <ul className="nav nav-tabs">
              {tabs.map((tab) => (
                <li key={tab.id} className="nav-item">
                  <button
                    className={`nav-link ${activeTab === tab.id ? 'active show' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    <div className="tab-content-preview">
                      <span className="tab-number">{tab.number}</span>
                      <div className="tab-text">
                        <h6>{tab.title}</h6>
                        <small>{tab.subtitle}</small>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="tab-content" data-aos="fade-up" data-aos-delay="300">
            {activeTabData && (
              <div className="tab-pane fade active show">
                <div className="row align-items-center">
                  <div className="col-lg-6">
                    <div className="content-area">
                      <div className="content-badge">
                        <i className={`bi ${activeTabData.badge.icon}`}></i>
                        <span>{activeTabData.badge.text}</span>
                      </div>
                      <h3>{activeTabData.heading}</h3>
                      <p>{activeTabData.description}</p>

                      <div className="highlight-stats">
                        {activeTabData.stats.map((stat, index) => (
                          <div key={index} className="stat-item">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="feature-points">
                        {activeTabData.points.map((point, index) => (
                          <div key={index} className="point-item">
                            <i className="bi bi-arrow-right"></i>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="visual-content">
                      <img src={activeTabData.image} alt="" className="img-fluid" />
                      <div className="floating-element">
                        <div className="floating-card">
                          <i className={`bi ${activeTabData.floatingCard.icon}`}></i>
                          <div className="card-info">
                            <span>{activeTabData.floatingCard.label}</span>
                            <strong>{activeTabData.floatingCard.value}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features

