import { useState, useEffect } from 'react'
import PageHeader from '../../components/sections/PageHeader'
import { getAuthUser } from '../../utils/auth'

function TrainingWelcome() {
  const [authState, setAuthState] = useState(getAuthUser())

  useEffect(() => {
    const handleLogin = () => {
      setAuthState(getAuthUser())
    }
    
    const handleLogout = () => {
      setAuthState(getAuthUser())
    }

    window.addEventListener('userLogin', handleLogin)
    window.addEventListener('userLogout', handleLogout)
    
    return () => {
      window.removeEventListener('userLogin', handleLogin)
      window.removeEventListener('userLogout', handleLogout)
    }
  }, [])

  return (
    <>
      <PageHeader
        title="IT Training Platform"
        description="Learn in-demand IT skills with expert instructors. Flexible schedules, hands-on projects, and career-focused tracks for students and professionals."
        primaryButton={!authState.isAuthenticated ? { href: '/training/auth', text: 'Login / Sign Up' } : null}
        secondaryButton={{ href: '/training/catalog', text: 'Browse Courses' }}
      />

      <section className="section" id="training-overview">
        <div className="container" data-aos="fade-up">
          <div className="row g-4">
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="150">
              <div className="service-card">
                <div className="service-icon">
                  <i className="bi bi-laptop"></i>
                </div>
                <h3>Hands-on Learning</h3>
                <p>Practice with real-world labs and guided projects to build job-ready skills.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
              <div className="service-card">
                <div className="service-icon">
                  <i className="bi bi-people"></i>
                </div>
                <h3>Expert Instructors</h3>
                <p>Learn from seasoned professionals with proven industry experience.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="250">
              <div className="service-card">
                <div className="service-icon">
                  <i className="bi bi-award"></i>
                </div>
                <h3>Career Outcomes</h3>
                <p>Structured tracks, mentorship, and certificates to advance your career.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="training-cta">
        <div className="container" data-aos="fade-up">
          <div className="row align-items-center gy-4">
            <div className="col-lg-8">
              <h3 className="mb-2">Ready to start learning?</h3>
              <p className="mb-0">Create your student account or explore the course catalog to find your next skill.</p>
            </div>
            <div className="col-lg-4 text-lg-end">
              {!authState.isAuthenticated && (
                <a href="/training/auth" className="btn btn-primary me-2">Get Started</a>
              )}
              <a href="/training/catalog" className="btn btn-outline">Explore Courses</a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default TrainingWelcome


