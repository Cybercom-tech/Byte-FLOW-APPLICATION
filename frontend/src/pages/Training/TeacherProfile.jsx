import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getAuthUser, getCurrentUser, isAuthenticated, isTeacher, isStudent } from '../../utils/auth'
import { getTeacherProfile, getPublicTeacherProfile, getTeacherReviews, getCompletedCoursesForReview, createReview } from '../../utils/teacherProfile'
import { getTeacherCourses, getTeacherStudents } from '../../utils/studentTeacherManagement'
import { getAllCourses, getCoursesByTeacher, getPublicCoursesByTeacher, getPublicTeacherStats } from '../../utils/courseManagement'
import { getEnrolledCourses } from '../../utils/courseEnrollment'
import { coursesData } from './coursesData'
import ChatWidget from '../../components/ChatWidget'

function TeacherProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [authState, setAuthState] = useState(getAuthUser())
  const [profileData, setProfileData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')
  const [teacherStats, setTeacherStats] = useState({
    studentsEnrolled: 0,
    coursesPublished: 0,
    averageRating: 0
  })
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [teacherCourses, setTeacherCourses] = useState([])
  const [courseIds, setCourseIds] = useState([])
  // New review-related state
  const [reviews, setReviews] = useState([])
  const [completedCoursesForReview, setCompletedCoursesForReview] = useState([])
  const [selectedCourseForReview, setSelectedCourseForReview] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  
  // Refs to prevent duplicate fetches and track mounted state
  const loadedIdRef = useRef(null)
  const isMountedRef = useRef(true)

  // Allow public viewing of teacher profiles (no authentication required)

  useEffect(() => {
    const handleLogin = () => {
      setAuthState(getAuthUser())
    }
    
    const handleLogout = () => {
      setAuthState(getAuthUser())
      navigate('/training/auth')
    }

    window.addEventListener('userLogin', handleLogin)
    window.addEventListener('userLogout', handleLogout)
    
    return () => {
      window.removeEventListener('userLogin', handleLogin)
      window.removeEventListener('userLogout', handleLogout)
    }
  }, [navigate])

  useEffect(() => {
    // Reset mounted ref
    isMountedRef.current = true
    
    const loadProfileData = async () => {
      // Prevent duplicate fetches for the same ID
      const currentId = id || 'default'
      if (loadedIdRef.current === currentId && profileData) {
        console.log('Data already loaded for this ID, skipping fetch')
        return
      }
      
      try {
        setIsLoading(true)
        // Load profile data
        const currentUser = getCurrentUser()
        const profileId = id || (currentUser?.id || '1')
        
        // Determine if viewing own profile or another teacher's profile
        const isViewingOwnProfile = currentUser && isTeacher() && String(currentUser.id) === String(profileId)
        
        let profile = null
        
        if (isViewingOwnProfile) {
          // Use authenticated endpoint for own profile
          profile = await getTeacherProfile(profileId)
        } else if (id) {
          // Use public endpoint for viewing other teachers' profiles
          profile = await getPublicTeacherProfile(id)
        }
        
        // Get the teacher's actual _id from the profile (important for fetching courses)
        const teacherDocId = profile?._id || profile?.id || profileId
        
        if (profile && isMountedRef.current) {
          // Map backend field names to frontend field names
          setProfileData({
            _id: profile._id, // Store the teacher document ID
            fullName: profile.fullName || profile.name || currentUser?.name || 'Teacher',
            title: profile.profTitle || profile.title || '',
            email: profile.email || currentUser?.email || '',
            phoneNumber: profile.phoneNumber || profile.phone || '',
            location: profile.location || '',
            aboutMe: profile.aboutMe || profile.about || '',
            education: Array.isArray(profile.education) ? profile.education.map(edu => ({
              id: edu._id || edu.id,
              instName: edu.instName || edu.institution || edu.institute || '',
              degreeName: edu.degreeName || edu.degree || '',
              fieldOfStudy: edu.fieldOfStudy || edu.field || '',
              startDate: edu.startDate,
              endDate: edu.endDate,
              isCurrentlyEnrolled: edu.isCurrentlyEnrolled || edu.currentlyStudying || false
            })) : [],
            experience: Array.isArray(profile.experience) ? profile.experience.map(exp => ({
              id: exp._id || exp.id,
              company: exp.companyName || exp.company || '',
              position: exp.position || exp.title || '',
              description: exp.description || '',
              startDate: exp.startDate,
              endDate: exp.endDate,
              currentlyWorking: exp.isCurrentlyWorking || exp.currentlyWorking || false
            })) : [],
            certificates: Array.isArray(profile.certificatesCourses) ? profile.certificatesCourses.map(cert => ({
              id: cert._id || cert.id,
              certificateName: cert.certificateName || cert.name || '',
              organization: cert.organization || cert.issuingOrganization || cert.issuer || '',
              credentialID: cert.credentialID || cert.credentialId || cert.id || '',
              issueDate: cert.issueDate,
              expiryDate: cert.expiryDate
            })) : [],
            courses: profile.courses || [],
            profileImage: profile.profileImage
          })
        } else if (isMountedRef.current) {
          // If no profile found, use basic user data (only for own profile)
          if (isViewingOwnProfile && currentUser) {
            setProfileData({
              fullName: currentUser.name || 'Teacher',
              title: '',
              email: currentUser.email || '',
              aboutMe: '',
              education: [],
              experience: [],
              courses: [],
              certificates: [],
            })
          } else {
            setProfileData(null)
          }
        }
        
        // Calculate teacher statistics
        // Only fetch authenticated data (like student counts) when viewing own profile
        if (profileId || teacherDocId) {
          try {
            // Load course data (public)
            const allCoursesData = await getAllCourses()
            const allCoursesArray = Array.isArray(allCoursesData) ? allCoursesData : []
            
            let courseIdsArray = []
            let studentsArray = []
            
            let teacherCoursesFiltered = []
            
            if (isViewingOwnProfile) {
              // Only fetch authenticated data for own profile
              const [teacherCourseIds, studentsData] = await Promise.all([
                getTeacherCourses(profileId),
                getTeacherStudents(profileId)
              ])
              courseIdsArray = Array.isArray(teacherCourseIds) ? teacherCourseIds : []
              studentsArray = Array.isArray(studentsData) ? studentsData : []
              
              // Merge courses for own profile
            const allCourses = [...coursesData, ...allCoursesArray]
              teacherCoursesFiltered = allCourses.filter(c => 
              courseIdsArray.some(cid => String(cid) === String(c.id) || String(cid) === String(c._id))
            )
            } else {
              // For viewing other profiles, use public endpoint to get courses by teacher
              // Use the teacher's actual _id from the profile, not the URL param
              const teacherIdForCourses = teacherDocId || profileId
              console.log('Fetching courses for teacher:', teacherIdForCourses, 'teacherDocId:', teacherDocId, 'profileId:', profileId)
              const publicCoursesData = await getPublicCoursesByTeacher(teacherIdForCourses)
              console.log('Public courses data received:', publicCoursesData)
              
              if (Array.isArray(publicCoursesData) && publicCoursesData.length > 0) {
                // For database courses, use the data directly
                // For static courses (numeric IDs), merge with coursesData
                teacherCoursesFiltered = publicCoursesData.map(course => {
                  // Check if this is a static course placeholder (numeric ID)
                  const courseIdStr = String(course.id || course._id || course.courseId)
                  const numericId = parseInt(courseIdStr)
                  
                  if (!isNaN(numericId) && !course.courseTitle && !course.title) {
                    // This is a static course - find it in coursesData
                    const staticCourse = coursesData.find(c => String(c.id) === courseIdStr)
                    if (staticCourse) {
                      return {
                        ...staticCourse,
                        isAssignedCourse: true
                      }
                    }
                  }
                  
                  // Return the course as-is (database course)
                  return course
                }).filter(Boolean)
                
                courseIdsArray = teacherCoursesFiltered.map(c => c.id || c._id)
              } else if (teacherCourses.length > 0) {
                // If we got empty result but already have courses loaded, keep existing data
                console.log('Keeping existing courses data, API returned empty')
                teacherCoursesFiltered = teacherCourses
                courseIdsArray = courseIds
              }
            }
            
            // Store in state for render - only update if we have data and still mounted
            if (isMountedRef.current && (courseIdsArray.length > 0 || teacherCoursesFiltered.length > 0)) {
            setCourseIds(courseIdsArray)
            setTeacherCourses(teacherCoursesFiltered)
            }
            
            // Get student count
            let studentCount = 0
            
            if (isViewingOwnProfile) {
              // For own profile, use the data we already fetched
              const uniqueStudents = new Set(studentsArray.map(s => s.studentId))
              studentCount = uniqueStudents.size
            } else {
              // For public profile view, fetch teacher stats from API
              const teacherIdForStats = teacherDocId || profileId
              try {
                const statsData = await getPublicTeacherStats(teacherIdForStats)
                studentCount = statsData.studentsEnrolled || 0
              } catch (error) {
                console.error('Error loading teacher stats:', error)
              }
            }
            
            if (isMountedRef.current) {
              setTeacherStats({
                studentsEnrolled: studentCount,
                coursesPublished: teacherCoursesFiltered.length,
                averageRating: 0 // Start at 0 as requested
              })
            }

            // Load reviews for this teacher (use teacher document ID)
            // Ensure teacherId is always a string (handle MongoDB ObjectId objects)
            const teacherIdForReviews = teacherDocId || profileId
            const teacherIdString = teacherIdForReviews 
              ? (typeof teacherIdForReviews === 'object' && teacherIdForReviews !== null 
                  ? (teacherIdForReviews._id ? String(teacherIdForReviews._id) : String(teacherIdForReviews))
                  : String(teacherIdForReviews))
              : String(profileId || '')
            try {
              const reviewsData = await getTeacherReviews(teacherIdString)
              if (isMountedRef.current) {
                setReviews(reviewsData.reviews || [])
                
                // Update teacher stats with actual average rating from reviews
                if (reviewsData.totalReviews > 0) {
                  setTeacherStats(prev => ({
                    ...prev,
                    averageRating: reviewsData.averageRating
                  }))
                }
              }
            } catch (error) {
              console.error('Error loading reviews:', error)
            }

            // Load completed courses for review (for students)
            const currentUserForReview = getCurrentUser()
            if (currentUserForReview && isStudent() && isAuthenticated()) {
              try {
                const completedData = await getCompletedCoursesForReview(teacherIdForReviews)
                if (isMountedRef.current) {
                  setCompletedCoursesForReview(completedData.courses || [])
                }
              } catch (error) {
                console.error('Error loading completed courses for review:', error)
                if (isMountedRef.current) {
                  setCompletedCoursesForReview([])
              }
              }
            } else if (isMountedRef.current) {
              setCompletedCoursesForReview([])
            }
          } catch (error) {
            console.error('Error loading teacher profile data:', error)
            // Don't clear data on error - keep existing data
          }
        }
      } catch (error) {
        console.error('Error loading teacher profile:', error)
        if (isMountedRef.current) {
        setProfileData(null)
        }
      } finally {
        if (isMountedRef.current) {
        setIsLoading(false)
          // Mark this ID as loaded
          loadedIdRef.current = id || 'default'
        }
      }
    }
    
    loadProfileData()
    
    // Cleanup function
    return () => {
      isMountedRef.current = false
    }
  }, [id])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  const formatDateRange = (startDate, endDate, isCurrent) => {
    const start = formatDate(startDate)
    const end = isCurrent ? 'Present' : formatDate(endDate)
    return `${start} - ${end}`
  }

  // Get areas of expertise from experience and courses
  const areasOfExpertise = useMemo(() => {
    const areas = []
    if (profileData?.experience) {
      profileData.experience.forEach(exp => {
        if (exp.skills && Array.isArray(exp.skills)) {
          areas.push(...exp.skills)
        }
      })
    }
    if (profileData?.courses) {
      profileData.courses.forEach(course => {
        if (course.topics) {
          const topics = course.topics.split(',').map(t => t.trim())
          areas.push(...topics)
        }
      })
    }
    // Remove duplicates
    return [...new Set(areas)].filter(Boolean)
  }, [profileData])

  if (isLoading) {
    return (
      <div style={{ paddingTop: '150px', textAlign: 'center', minHeight: '50vh' }}>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div style={{ paddingTop: '150px', textAlign: 'center', minHeight: '50vh' }}>
        <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1rem' }}>
          Profile not found.
        </p>
        <Link
          to="/training/catalog"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#c85716',
            color: '#ffffff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Back to Catalog
        </Link>
      </div>
    )
  }

  const isOwnProfile = authState.isAuthenticated && 
    authState.user?.userType === 'teacher' && 
    (String(authState.user?.id) === String(id) || (!id && authState.user))
  
  const isStudentView = authState.isAuthenticated && authState.user?.userType === 'student'

  // Use the teacher's actual document ID from profileData if available, otherwise fall back to URL param
  const teacherId = profileData?._id || id || (getCurrentUser()?.id || '1')
  // Use state instead of calling async functions synchronously
  // courseIds and teacherCourses are loaded in useEffect above

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div className="row g-4">
          {/* Left Sidebar */}
          <div className="col-lg-4">
            {/* Profile Summary Card */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #e9ecef',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {/* Profile Picture */}
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                margin: '0 auto 1.5rem',
                border: '4px solid #e9ecef'
              }}>
                <img
                  src={profileData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.fullName || 'Teacher')}&size=200&background=c85716&color=fff`}
                  alt={profileData.fullName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>

              {/* Name */}
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#110a06',
                marginBottom: '0.5rem'
              }}>
                {profileData.fullName || 'Teacher'}
              </h2>

              {/* Title */}
              <p style={{
                fontSize: '1rem',
                color: '#6c757d',
                marginBottom: '1rem'
              }}>
                {profileData.title || 'Course Instructor'}
              </p>

              {/* Motto/Description */}
              {profileData.aboutMe && (
                <p style={{
                  fontSize: '0.95rem',
                  color: '#495057',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  fontStyle: 'italic'
                }}>
                  {profileData.aboutMe.split('\n')[0] || profileData.aboutMe.substring(0, 100)}
                </p>
              )}


              {/* Statistics Card */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                    Students Enrolled
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#110a06' }}>
                    {teacherStats.studentsEnrolled.toLocaleString()}+
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                    Courses Published
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#110a06' }}>
                    {teacherStats.coursesPublished}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem', textAlign: 'center' }}>
                    Average Rating
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#110a06' }}>
                      {teacherStats.averageRating.toFixed(1)}
                    </div>
                    <i className="bi bi-star-fill" style={{ color: '#ffc107', fontSize: '1.25rem' }}></i>
                  </div>
                </div>
              </div>
              
              {/* Edit Profile Button - Only for teachers viewing their own profile */}
              {isOwnProfile && (
                <Link
                  to="/training/onboarding"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '12px 20px',
                    backgroundColor: '#c85716',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    marginTop: '1rem',
                    transition: 'background-color 0.2s',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#a0450f'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#c85716'
                  }}
                >
                  <i className="bi bi-pencil-square"></i>
                  Edit Profile
                </Link>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="col-lg-8">
            {/* Navigation Tabs */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '0',
              borderRadius: '12px 12px 0 0',
              border: '1px solid #e9ecef',
              borderBottom: 'none',
              display: 'flex',
              gap: '0'
            }}>
              <button
                onClick={() => setActiveTab('about')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'about' ? '3px solid #c85716' : '3px solid transparent',
                  color: activeTab === 'about' ? '#c85716' : '#6c757d',
                  fontWeight: activeTab === 'about' ? '600' : '500',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'courses' ? '3px solid #c85716' : '3px solid transparent',
                  color: activeTab === 'courses' ? '#c85716' : '#6c757d',
                  fontWeight: activeTab === 'courses' ? '600' : '500',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
              >
                Courses ({teacherCourses.length})
              </button>
              <button
                onClick={() => setActiveTab('experience')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'experience' ? '3px solid #c85716' : '3px solid transparent',
                  color: activeTab === 'experience' ? '#c85716' : '#6c757d',
                  fontWeight: activeTab === 'experience' ? '600' : '500',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
              >
                Experience
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'reviews' ? '3px solid #c85716' : '3px solid transparent',
                  color: activeTab === 'reviews' ? '#c85716' : '#6c757d',
                  fontWeight: activeTab === 'reviews' ? '600' : '500',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
              >
                Reviews ({reviews.length})
              </button>
            </div>

            {/* Tab Content */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '0 0 12px 12px',
              border: '1px solid #e9ecef',
              minHeight: '400px'
            }}>
              {/* About Tab */}
              {activeTab === 'about' && (
                <>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#110a06',
                    marginBottom: '1.5rem'
                  }}>
                    About {profileData.fullName?.split(' ')[0] || 'this instructor'}
                  </h3>
                  
                  {profileData.aboutMe ? (
                    <div style={{ marginBottom: '2rem' }}>
                      {profileData.aboutMe.split('\n').map((paragraph, index) => (
                        <p key={index} style={{
                          fontSize: '1rem',
                          color: '#1a1715',
                          lineHeight: '1.8',
                          marginBottom: '1rem'
                        }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p style={{
                      fontSize: '1rem',
                      color: '#6c757d',
                      fontStyle: 'italic',
                      marginBottom: '2rem'
                    }}>
                      No biography available.
                    </p>
                  )}

                  {/* Areas of Expertise */}
                  {areasOfExpertise.length > 0 && (
                    <div>
                      <h4 style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: '#110a06',
                        marginBottom: '1rem'
                      }}>
                        Areas of Expertise
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}>
                        {areasOfExpertise.map((area, index) => (
                          <span
                            key={index}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#f8f9fa',
                              color: '#110a06',
                              borderRadius: '20px',
                              fontSize: '0.9rem',
                              border: '1px solid #e9ecef',
                              fontWeight: '500'
                            }}
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                <>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#110a06',
                    marginBottom: '1.5rem'
                  }}>
                    Courses ({teacherCourses.length})
                  </h3>
                  
                  {teacherCourses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {teacherCourses.map((course) => (
                        <Link
                          key={course.id}
                          to={`/training/course/${course.id}`}
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '1.5rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <img
                            src={course.image}
                            alt={course.title}
                            style={{
                              width: '120px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '6px'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <h4 style={{
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              color: '#110a06',
                              marginBottom: '0.5rem'
                            }}>
                              {course.title}
                            </h4>
                            <p style={{
                              fontSize: '0.9rem',
                              color: '#6c757d',
                              marginBottom: '0.5rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {course.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#6c757d' }}>
                              <span><i className="bi bi-people" style={{ marginRight: '0.25rem' }}></i>{course.level}</span>
                              <span><i className="bi bi-clock" style={{ marginRight: '0.25rem' }}></i>{course.totalDuration}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                      <i className="bi bi-book" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                      <p>No courses published yet.</p>
                    </div>
                  )}
                </>
              )}

              {/* Experience Tab */}
              {activeTab === 'experience' && (
                <>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#110a06',
                    marginBottom: '1.5rem'
                  }}>
                    Professional Experience
                  </h3>
                  
                  {profileData.experience && profileData.experience.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {profileData.experience.map((exp) => (
                        <div
                          key={exp.id}
                          style={{
                            padding: '1.5rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}
                        >
                          <h4 style={{
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            color: '#110a06',
                            marginBottom: '0.5rem'
                          }}>
                            {exp.position}
                          </h4>
                          <p style={{
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: '#110a06',
                            marginBottom: '0.5rem'
                          }}>
                            {exp.company}
                          </p>
                          <p style={{
                            fontSize: '0.9rem',
                            color: '#6c757d',
                            marginBottom: exp.description ? '0.75rem' : '0'
                          }}>
                            {formatDateRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
                          </p>
                          {exp.description && (
                            <p style={{
                              fontSize: '0.95rem',
                              color: '#1a1715',
                              lineHeight: '1.6',
                              margin: 0,
                              whiteSpace: 'pre-wrap'
                            }}>
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                      <i className="bi bi-briefcase" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                      <p>No experience information available.</p>
                    </div>
                  )}
                </>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#110a06',
                    marginBottom: '1.5rem'
                  }}>
                    Reviews ({reviews.length})
                  </h3>
                  
                  {/* Review Form - Only visible to students (not teachers viewing their own profile) */}
                  {authState.isAuthenticated && isStudentView && !isOwnProfile && (
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef',
                      marginBottom: '2rem'
                    }}>
                      <h4 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#110a06',
                        marginBottom: '1rem'
                      }}>
                        Write a Review
                      </h4>
                      
                      {/* Success/Error Messages */}
                      {reviewSuccess && (
                        <div style={{
                          padding: '1rem',
                          backgroundColor: '#d4edda',
                          borderRadius: '6px',
                          marginBottom: '1rem',
                          border: '1px solid #c3e6cb'
                        }}>
                          <p style={{
                            fontSize: '0.9rem',
                            color: '#155724',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <i className="bi bi-check-circle"></i>
                            {reviewSuccess}
                          </p>
                        </div>
                      )}
                      
                      {reviewError && (
                        <div style={{
                          padding: '1rem',
                          backgroundColor: '#f8d7da',
                          borderRadius: '6px',
                          marginBottom: '1rem',
                          border: '1px solid #f5c6cb'
                        }}>
                          <p style={{
                            fontSize: '0.9rem',
                            color: '#721c24',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <i className="bi bi-exclamation-circle"></i>
                            {reviewError}
                          </p>
                        </div>
                      )}
                      
                      {completedCoursesForReview.length === 0 ? (
                        <div style={{
                          padding: '1rem',
                          backgroundColor: '#fff3cd',
                          borderRadius: '6px',
                          marginBottom: '1rem',
                          border: '1px solid #ffc107'
                        }}>
                          <p style={{
                            fontSize: '0.9rem',
                            color: '#856404',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <i className="bi bi-info-circle"></i>
                            You can only review this instructor after completing a course (100% progress) taught by them.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Course Selector */}
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              color: '#110a06',
                              marginBottom: '0.5rem'
                            }}>
                              Select Course to Review
                            </label>
                            <select
                              value={selectedCourseForReview}
                              onChange={(e) => {
                                setSelectedCourseForReview(e.target.value)
                                setReviewRating(0)
                                setReviewText('')
                                setReviewError('')
                                setReviewSuccess('')
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                fontSize: '0.95rem',
                                fontFamily: 'inherit',
                                backgroundColor: '#ffffff',
                                color: '#110a06',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">-- Select a completed course --</option>
                              {completedCoursesForReview.map((course) => {
                                // Find course title from static data if not from DB
                                const staticCourse = coursesData.find(c => String(c.id) === String(course.courseId))
                                const courseName = course.courseTitle || staticCourse?.title || `Course ${course.courseId}`
                                
                                return (
                                  <option 
                                    key={course.courseId} 
                                    value={course.courseId}
                                    disabled={course.hasReviewed}
                                  >
                                    {courseName} {course.hasReviewed ? '(Already reviewed)' : ''}
                                  </option>
                                )
                              })}
                            </select>
                            
                            {/* Show available vs reviewed count */}
                            <p style={{ 
                              fontSize: '0.8rem', 
                              color: '#6c757d', 
                              marginTop: '0.5rem',
                              marginBottom: 0
                            }}>
                              {completedCoursesForReview.filter(c => !c.hasReviewed).length} course(s) available for review, 
                              {' '}{completedCoursesForReview.filter(c => c.hasReviewed).length} already reviewed
                            </p>
                          </div>
                          
                          {selectedCourseForReview && !completedCoursesForReview.find(c => String(c.courseId) === selectedCourseForReview)?.hasReviewed && (
                            <>
                      {/* Rating Selection */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: '#110a06',
                          marginBottom: '0.5rem'
                        }}>
                          Rating
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                                      onClick={() => setReviewRating(rating)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                        cursor: 'pointer',
                                padding: '0',
                                fontSize: '1.5rem',
                                color: reviewRating >= rating ? '#ffc107' : '#dee2e6',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#ffc107'
                              }}
                              onMouseLeave={(e) => {
                                  e.currentTarget.style.color = reviewRating >= rating ? '#ffc107' : '#dee2e6'
                              }}
                            >
                              <i className="bi bi-star-fill"></i>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Review Text */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: '#110a06',
                          marginBottom: '0.5rem'
                        }}>
                          Your Review
                        </label>
                        <textarea
                          value={reviewText}
                                  onChange={(e) => setReviewText(e.target.value)}
                                  placeholder="Share your experience with this course and instructor..."
                          rows="4"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            fontSize: '0.95rem',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                                    backgroundColor: '#ffffff',
                                    color: '#110a06'
                          }}
                        />
                      </div>
                      
                      {/* Submit Button */}
                      <button
                                onClick={async () => {
                                  if (reviewRating > 0 && reviewText.trim() && selectedCourseForReview) {
                                    setIsSubmittingReview(true)
                                    setReviewError('')
                                    setReviewSuccess('')
                                    
                                    try {
                                      const result = await createReview(
                                        teacherId,
                                        selectedCourseForReview,
                                        reviewRating,
                                        reviewText.trim()
                                      )
                                      
                                      if (result.success) {
                                        // Add the new review to the list
                                        const staticCourse = coursesData.find(c => String(c.id) === selectedCourseForReview)
                                        const newReview = {
                                          ...result.review,
                                          courseName: staticCourse?.title || result.review.courseName,
                                          studentName: getCurrentUser()?.name || 'You'
                                        }
                                        setReviews(prev => [newReview, ...prev])
                                        
                                        // Update completed courses to mark as reviewed
                                        setCompletedCoursesForReview(prev => 
                                          prev.map(c => 
                                            String(c.courseId) === selectedCourseForReview 
                                              ? { ...c, hasReviewed: true, existingReview: result.review }
                                              : c
                                          )
                                        )
                                        
                                        // Update teacher stats
                                        const newTotalReviews = reviews.length + 1
                                        const newTotalRating = reviews.reduce((sum, r) => sum + r.rating, 0) + reviewRating
                                        const newAvgRating = newTotalRating / newTotalReviews
                                        setTeacherStats(prev => ({
                                          ...prev,
                                          averageRating: Math.round(newAvgRating * 10) / 10
                                        }))
                                        
                                        setReviewSuccess('Your review has been submitted successfully!')
                            setReviewRating(0)
                            setReviewText('')
                                        setSelectedCourseForReview('')
                                      } else {
                                        setReviewError(result.message || 'Failed to submit review')
                                      }
                                    } catch (error) {
                                      setReviewError('An error occurred while submitting your review')
                                    } finally {
                                      setIsSubmittingReview(false)
                                    }
                                  }
                                }}
                                disabled={isSubmittingReview || reviewRating === 0 || !reviewText.trim()}
                        style={{
                          padding: '10px 20px',
                                  backgroundColor: (isSubmittingReview || reviewRating === 0 || !reviewText.trim()) ? '#e9ecef' : '#c85716',
                                  color: (isSubmittingReview || reviewRating === 0 || !reviewText.trim()) ? '#6c757d' : '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                                  cursor: (isSubmittingReview || reviewRating === 0 || !reviewText.trim()) ? 'not-allowed' : 'pointer',
                          fontSize: '0.95rem',
                          fontWeight: '500',
                                  transition: 'background-color 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                {isSubmittingReview ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Review'
                                )}
                      </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Reviews List */}
                  {reviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {reviews.map((review) => {
                        // Find course title from static data if not from DB
                        const staticCourse = coursesData.find(c => String(c.id) === String(review.courseId))
                        const courseName = review.courseName || staticCourse?.title || `Course ${review.courseId}`
                        
                        return (
                          <div
                            key={review._id}
                            style={{
                              padding: '1.5rem',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '8px',
                              border: '1px solid #e9ecef'
                            }}
                          >
                            {/* Review Header */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start',
                              marginBottom: '0.75rem',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              <div>
                                <h5 style={{
                                  fontSize: '1rem',
                                  fontWeight: '600',
                                  color: '#110a06',
                                  marginBottom: '0.25rem'
                                }}>
                                  {review.studentName}
                                </h5>
                                {/* Course Badge */}
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  backgroundColor: '#c85716',
                                  color: '#ffffff',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500'
                                }}>
                                  {courseName}
                                </span>
                              </div>
                              
                              {/* Rating Stars */}
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <i 
                                    key={star}
                                    className="bi bi-star-fill" 
                                    style={{ 
                                      color: star <= review.rating ? '#ffc107' : '#dee2e6',
                                      fontSize: '0.9rem'
                                    }}
                                  ></i>
                                ))}
                              </div>
                            </div>
                            
                            {/* Review Text */}
                            <p style={{
                              fontSize: '0.95rem',
                              color: '#1a1715',
                              lineHeight: '1.6',
                              marginBottom: '0.5rem'
                            }}>
                              {review.reviewText}
                            </p>
                            
                            {/* Review Date */}
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#6c757d',
                              margin: 0
                            }}>
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                    <i className="bi bi-star" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                    <p>No reviews yet. {authState.isAuthenticated ? 'Be the first to review this instructor!' : 'Login to leave a review.'}</p>
                  </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {isAuthenticated() && (isTeacher() || isStudent()) && (
        <ChatWidget userType={isTeacher() ? 'teacher' : 'student'} />
      )}
    </div>
  )
}

export default TeacherProfile
