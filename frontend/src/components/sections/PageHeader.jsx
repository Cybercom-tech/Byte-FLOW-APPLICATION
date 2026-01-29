import React from 'react'

function PageHeader({ title, description, primaryButton, secondaryButton }) {
  return (
    <section id="page-header" className="page-header section dark-background">
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center text-center">
          <div className="col-lg-8">
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="page-header-buttons" data-aos="fade-up" data-aos-delay="200">
              {primaryButton && (
                <a href={primaryButton.href} className="btn btn-primary">
                  {primaryButton.text}
                </a>
              )}
              {secondaryButton && (
                <a href={secondaryButton.href} className="btn btn-outline">
                  {secondaryButton.text}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PageHeader

