import { useState } from 'react'

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      number: '01',
      question: 'What IT services does ByteFlow Innovations provide?',
      answer: 'ByteFlow Innovations offers comprehensive IT services including network management, cybersecurity solutions, cloud computing, IT hardware and software procurement, call centre services, and professional IT training programs. We provide 24/7 support to ensure your business operations run smoothly.'
    },
    {
      number: '02',
      question: 'Do you provide 24/7 call centre support?',
      answer: 'Yes, we provide round-the-clock call centre support to ensure your customers receive assistance whenever they need it. Our dedicated team is trained to handle various customer inquiries, technical support, and service requests with professionalism and efficiency.'
    },
    {
      number: '03',
      question: 'What training courses do you offer?',
      answer: 'We offer comprehensive IT training courses including programming fundamentals, cybersecurity essentials, cloud computing, network management, and software development. Our courses are designed for all skill levels and include hands-on projects, expert instruction, and flexible learning schedules.'
    },
    {
      number: '04',
      question: 'How can I get started with your services?',
      answer: 'Getting started is easy! Simply contact us through our website, call us at +92-51-4718365, or email us at Info@ByteFlowinnovations.com. We\'ll schedule a consultation to understand your needs and recommend the best IT solutions for your business.'
    },
    {
      number: '05',
      question: 'Do you provide cybersecurity services?',
      answer: 'Yes, cybersecurity is one of our core services. We provide comprehensive security solutions including network protection, data encryption, threat monitoring, security audits, and staff training to ensure your business is protected against cyber threats.'
    }
  ]

  return (
    <section id="faq" className="faq section">
      <div className="container section-title" data-aos="fade-up">
        <span className="subtitle">F.A.Q</span>
        <h2>Frequently Asked Questions</h2>
        <p>Find answers to common questions about our IT services, call centre solutions, and training programs</p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="faq-wrapper">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${openIndex === index ? 'faq-active' : ''}`}
                  data-aos="fade-up"
                  data-aos-delay={150 + index * 50}
                >
                  <div
                    className="faq-header"
                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  >
                    <span className="faq-number">{faq.number}</span>
                    <h4>{faq.question}</h4>
                    <div className="faq-toggle">
                      <i className="bi bi-plus"></i>
                      <i className="bi bi-dash"></i>
                    </div>
                  </div>
                  <div className="faq-content">
                    <div className="content-inner">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQ

