import { Routes, Route, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollTop from './components/ScrollTop'
import RouteScrollToTop from './components/RouteScrollToTop'
import Preloader from './components/Preloader'
import { isAuthenticated, getCurrentUser, logoutUser } from './utils/auth'
import api from './utils/api'
import AOS from 'aos'

// Lazy load all route components for code splitting
const Home = lazy(() => import('./pages/Home'))
const CallCentre = lazy(() => import('./pages/CallCentre'))
const TrainingWelcome = lazy(() => import('./pages/Training/Welcome'))
const TrainingAuth = lazy(() => import('./pages/Training/Auth'))
const TeacherOnboarding = lazy(() => import('./pages/Training/TeacherOnboarding'))
const TrainingCatalog = lazy(() => import('./pages/Training/Catalog'))
const CourseDetail = lazy(() => import('./pages/Training/CourseDetail'))
const Checkout = lazy(() => import('./pages/Training/Checkout'))
const StudentDashboard = lazy(() => import('./pages/Training/StudentDashboard'))
const TeacherProfile = lazy(() => import('./pages/Training/TeacherProfile'))
const TeacherCourses = lazy(() => import('./pages/Training/TeacherCourses'))
const TeacherDashboard = lazy(() => import('./pages/Training/TeacherDashboard'))
const PaymentManagement = lazy(() => import('./pages/Training/PaymentManagement'))
const PaymentOverview = lazy(() => import('./pages/Training/PaymentOverview'))
const AdminAuth = lazy(() => import('./pages/Training/AdminAuth'))
const CourseModeration = lazy(() => import('./pages/Training/CourseModeration'))
const UserManagement = lazy(() => import('./pages/Training/UserManagement'))
const CertificateManagement = lazy(() => import('./pages/Training/CertificateManagement'))

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh' 
  }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
)

function App() {
  const navigate = useNavigate()
  const [showBanMessage, setShowBanMessage] = useState(false)
  const [banMessage, setBanMessage] = useState('')

  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  }, [])

  // Listen for ban events from API errors (when middleware detects banned user)
  useEffect(() => {
    const handleBanEvent = (event) => {
      const message = event.detail?.message || 'Your account has been banned. Please contact support for assistance.'
      setBanMessage(message)
      setShowBanMessage(true)
      logoutUser()
      setTimeout(() => {
        navigate('/training/auth')
        setShowBanMessage(false)
      }, 5000)
    }

    window.addEventListener('userBanned', handleBanEvent)

    return () => {
      window.removeEventListener('userBanned', handleBanEvent)
    }
  }, [navigate])

  return (
    <div className="App">
      <Preloader />
      {showBanMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: '#dc3545',
          color: '#ffffff',
          padding: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', fontSize: '1.1rem', fontWeight: '500' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.5rem' }}></i>
            {banMessage}
          </div>
        </div>
      )}
      <Header />
      <main className="main">
        <RouteScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/callcentre" element={<CallCentre />} />
            <Route path="/training" element={<TrainingWelcome />} />
            <Route path="/training/auth" element={<TrainingAuth />} />
            <Route path="/training/onboarding" element={<TeacherOnboarding />} />
            <Route path="/training/catalog" element={<TrainingCatalog />} />
            <Route path="/training/course/:id" element={<CourseDetail />} />
            <Route path="/training/checkout/:id" element={<Checkout />} />
            <Route path="/training/student" element={<StudentDashboard />} />
            <Route path="/training/teacher/:id" element={<TeacherProfile />} />
            <Route path="/training/teacher-courses" element={<TeacherCourses />} />
            <Route path="/training/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/training/payment-management" element={<PaymentManagement />} />
            <Route path="/training/payment-overview" element={<PaymentOverview />} />
            <Route path="/training/admin-auth" element={<AdminAuth />} />
            <Route path="/training/course-moderation" element={<CourseModeration />} />
            <Route path="/training/user-management" element={<UserManagement />} />
            <Route path="/training/certificate-management" element={<CertificateManagement />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <ScrollTop />
    </div>
  )
  
}

export default App

