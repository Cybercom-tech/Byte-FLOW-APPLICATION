import React, { useMemo, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { coursesData } from './coursesData'
import { getAllCourses, getCourseInstructor, getInstructorAssignments, getCoursesByTeacher } from '../../utils/courseManagement'
import { isAuthenticated, isTeacher, isStudent, getCurrentUser } from '../../utils/auth'
import { getTeacherReviews } from '../../utils/teacherProfile'
import { getEnrolledCourses } from '../../utils/courseEnrollment'
import ChatWidget from '../../components/ChatWidget'

function CourseDetail() {
  const { id } = useParams()
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [allExpanded, setAllExpanded] = useState(false)
  const [allCourses, setAllCourses] = useState(coursesData)
  const [teacherCoursesFull, setTeacherCoursesFull] = useState([])
  const [courseInstructor, setCourseInstructor] = useState(null)
  const [courseTeacherId, setCourseTeacherId] = useState(null) // Store teacher ID from API
  const [teacherCreatedCourses, setTeacherCreatedCourses] = useState([]) // Store teacher's created courses
  const [teacherCoursesForId, setTeacherCoursesForId] = useState([]) // State for teacher courses (needed for getTeacherId)
  const [isLoadingCourses, setIsLoadingCourses] = useState(true) // Track if courses are still loading
  const [courseReviews, setCourseReviews] = useState([]) // Course-specific reviews
  const [isLoadingReviews, setIsLoadingReviews] = useState(false) // Track if reviews are loading
  const [enrollment, setEnrollment] = useState(null) // Student enrollment status for this course

  // Load teacher-created courses and merge with default courses
  useEffect(() => {
    const loadCourses = async () => {
      setIsLoadingCourses(true)
      try {
        const teacherCourses = await getAllCourses()
        const teacherCoursesArray = Array.isArray(teacherCourses) ? teacherCourses : []
        const merged = [...coursesData]
        teacherCoursesArray.forEach(teacherCourse => {
          const existingIndex = merged.findIndex(c => c.id === teacherCourse.id)
          if (existingIndex >= 0) {
            merged[existingIndex] = { ...merged[existingIndex], ...teacherCourse }
          } else {
            merged.push(teacherCourse)
          }
        })
        setAllCourses(merged)
        
        const allTeacherCourses = await getAllCourses(true)
        setTeacherCoursesFull(Array.isArray(allTeacherCourses) ? allTeacherCourses : [])
        
        // Load teacher's created courses if user is a teacher
        if (isTeacher() && isAuthenticated()) {
          const currentUser = getCurrentUser()
          if (currentUser) {
            const createdCourses = await getCoursesByTeacher(currentUser.id)
            setTeacherCreatedCourses(Array.isArray(createdCourses) ? createdCourses : [])
          }
        }
      } catch (error) {
        console.error('Error loading courses:', error)
        setAllCourses(coursesData)
        setTeacherCoursesFull([])
        setTeacherCreatedCourses([])
      } finally {
        setIsLoadingCourses(false)
      }
    }
    loadCourses()
  }, [])

  // Define course first (before useEffects that depend on it)
  const course = useMemo(() => {
    const courseId = parseInt(id)
    const currentUser = getCurrentUser()
    
    // Helper function to match course IDs (handles both string and number IDs, including MongoDB ObjectIds)
    // Works for default courses, teacher-created courses, and admin-created courses
    // IMPORTANT: Must match EXACTLY to prevent wrong course selection
    const matchCourseId = (course) => {
      if (!course) return false
      
      const idStr = String(id)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/
      const isObjectId = objectIdPattern.test(idStr)
      
      // For MongoDB ObjectIds (24 hex characters) - must match exactly
      if (isObjectId) {
        // First check course._id (primary MongoDB field)
        if (course._id && String(course._id) === idStr) {
          return true
        }
        // Then check course.id if it's the ObjectId (transformed from _id)
        if (course.id && String(course.id) === idStr) {
          return true
        }
        // Don't match numeric IDs when we're looking for an ObjectId
        return false
      }
      
      // For numeric IDs (default courses) - must match exactly
      if (!isNaN(courseId)) {
        const cId = typeof course.id === 'string' ? parseInt(course.id) : course.id
        // Only match if it's a numeric ID, not an ObjectId
        const cIdStr = String(course.id)
        const cIsObjectId = objectIdPattern.test(cIdStr)
        
        // If course.id is an ObjectId, don't match with numeric ID
        if (cIsObjectId) {
          return false
        }
        
        // Match numeric IDs
        if (cId === courseId || String(course.id) === idStr) {
          return true
        }
      }
      
      // Fallback: exact string match (for any other string IDs)
      if (String(course.id) === idStr || (course._id && String(course._id) === idStr)) {
        return true
      }
      
      return false
    }

    let selectedCourse = null

    // Priority 1: Check teacher's created courses first (if user is a teacher)
    // This ensures teachers can always see their own courses regardless of approval status
    if (isTeacher() && isAuthenticated() && currentUser && teacherCreatedCourses.length > 0) {
      const createdCourse = teacherCreatedCourses.find(matchCourseId)
      if (createdCourse) {
        selectedCourse = createdCourse
      }
    }

    // Priority 2: Check teacherCoursesFull (all courses including unapproved)
    if (!selectedCourse) {
      const fallbackCourse = teacherCoursesFull.find(matchCourseId)
      if (fallbackCourse) {
        // If course is approved or has no status, use it
        if (fallbackCourse.status === 'approved' || !fallbackCourse.status) {
          selectedCourse = fallbackCourse
        } else {
          // For unapproved courses, check if current user is the creator
          if (currentUser && isTeacher()) {
            const userIsCreator = fallbackCourse.createdBy === currentUser.id || 
                                 fallbackCourse.teacherId === currentUser.id ||
                                 (fallbackCourse.createdByRole === 'teacher' && 
                                  String(fallbackCourse.createdBy) === String(currentUser.id))
            
            if (userIsCreator) {
              selectedCourse = fallbackCourse
            }
          }
        }
      }
    }

    // Priority 3: Check allCourses (approved courses only)
    if (!selectedCourse) {
      const baseCourse = allCourses.find(matchCourseId)
      if (baseCourse && (!baseCourse.status || baseCourse.status === 'approved')) {
        selectedCourse = baseCourse
      }
    }

    // Ensure course has a sections array (default to empty array if undefined)
    if (selectedCourse && !selectedCourse.sections) {
      selectedCourse = { ...selectedCourse, sections: [] }
    }

    return selectedCourse
  }, [id, allCourses, teacherCoursesFull, teacherCreatedCourses])

  // Load course instructor and teacher ID (after course is defined)
  useEffect(() => {
    const loadInstructor = async () => {
      if (course?.id) {
        try {
          // Try to get instructor from API (includes teacher ID)
          const { api } = await import('../../utils/api')
          try {
            const response = await api.get(`/course/${course.id}/instructor`, { includeAuth: false })
            if (response.instructor) {
              setCourseInstructor(response.instructor.name || response.instructor.fullName || null)
              if (response.instructor.id) {
                setCourseTeacherId(response.instructor.id)
                return // Successfully got from API, exit early
              }
            }
          } catch (apiError) {
            // If API fails, fall back to getCourseInstructor
            const instructor = await getCourseInstructor(course.id)
            setCourseInstructor(instructor)
          }
          
          // Also check course data for teacherId (for database courses)
          if (course.teacherId) {
            setCourseTeacherId(course.teacherId)
          }
        } catch (error) {
          console.error('Error loading instructor:', error)
          setCourseInstructor(null)
          // Fallback to course data
          if (course.teacherId) {
            setCourseTeacherId(course.teacherId)
          }
        }
      }
    }
    loadInstructor()
  }, [course?.id, course?.teacherId])

  // Load teacher courses for getTeacherId
  useEffect(() => {
    const loadTeacherCourses = async () => {
      try {
        const courses = await getAllCourses(true)
        setTeacherCoursesForId(Array.isArray(courses) ? courses : [])
      } catch (error) {
        console.error('Error loading teacher courses:', error)
        setTeacherCoursesForId([])
      }
    }
    loadTeacherCourses()
  }, [course?.id])

  // Load course-specific reviews for the teacher
  useEffect(() => {
    const loadCourseReviews = async () => {
      if (!courseTeacherId || !course?.id) {
        setCourseReviews([])
        return
      }

      setIsLoadingReviews(true)
      try {
        const reviewsData = await getTeacherReviews(courseTeacherId)
        // Filter reviews to only show those for this specific course
        const courseIdStr = String(course.id || course._id)
        const filteredReviews = (reviewsData.reviews || []).filter(review => {
          const reviewCourseIdStr = String(review.courseId)
          // Match by both ID formats (numeric and MongoDB ObjectId)
          return reviewCourseIdStr === courseIdStr || 
                 reviewCourseIdStr === String(course._id) ||
                 reviewCourseIdStr === String(course.id)
        })
        setCourseReviews(filteredReviews)
      } catch (error) {
        console.error('Error loading course reviews:', error)
        setCourseReviews([])
      } finally {
        setIsLoadingReviews(false)
      }
    }
    loadCourseReviews()
  }, [courseTeacherId, course?.id, course?._id])

  // Load enrollment status for students
  useEffect(() => {
    const loadEnrollment = async () => {
      if (!course?.id || !isAuthenticated() || !isStudent()) {
        setEnrollment(null)
        return
      }

      try {
        const enrollments = await getEnrolledCourses()
        const courseIdStr = String(course.id)
        const courseMongoId = course._id ? String(course._id) : null
        
        // Match enrollment by courseId (handles both numeric IDs and MongoDB ObjectIds)
        const courseEnrollment = enrollments.find(e => {
          const enrollmentCourseId = String(e.courseId)
          // Match by numeric ID (for default courses)
          if (enrollmentCourseId === courseIdStr) return true
          // Match by MongoDB ObjectId (for teacher-created courses)
          if (courseMongoId && enrollmentCourseId === courseMongoId) return true
          // Also try matching numeric strings (e.g., "1" === 1)
          if (enrollmentCourseId === String(parseInt(courseIdStr))) return true
          return false
        })
        setEnrollment(courseEnrollment || null)
      } catch (error) {
        console.error('Error loading enrollment:', error)
        setEnrollment(null)
      }
    }

    loadEnrollment()

    // Listen for progress updates
    const handleProgressUpdate = async () => {
      await loadEnrollment()
    }

    window.addEventListener('enrollmentProgressUpdated', handleProgressUpdate)
    window.addEventListener('enrollmentVerified', handleProgressUpdate)
    window.addEventListener('courseEnrolled', handleProgressUpdate)

    return () => {
      window.removeEventListener('enrollmentProgressUpdated', handleProgressUpdate)
      window.removeEventListener('enrollmentVerified', handleProgressUpdate)
      window.removeEventListener('courseEnrolled', handleProgressUpdate)
    }
  }, [course?.id, course?._id])

  // Format date from YYYY-MM-DD to MM/DD/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '11/9/2025' // Default fallback
    const date = new Date(dateString)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const toggleSection = (index) => {
    if (!course || !course.sections) return
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
    // Update allExpanded state based on whether all sections are expanded
    if (newExpanded.size === course.sections.length) {
      setAllExpanded(true)
    } else {
      setAllExpanded(false)
    }
  }

  const toggleAllSections = () => {
    if (!course || !course.sections) return
    if (allExpanded) {
      setExpandedSections(new Set())
      setAllExpanded(false)
    } else {
      setExpandedSections(new Set(course.sections.map((_, index) => index)))
      setAllExpanded(true)
    }
  }

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const stars = []
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={i} className="bi bi-star-fill text-warning"></i>)
    }
    if (hasHalfStar) {
      stars.push(<i key="half" className="bi bi-star-half text-warning"></i>)
    }
    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="bi bi-star text-warning"></i>)
    }
    
    return stars
  }

  const getIconForType = (type) => {
    switch(type) {
      case 'video':
        return 'bi-play-circle'
      case 'quiz':
        return 'bi-question-circle'
      case 'assignment':
        return 'bi-file-earmark-text'
      case 'resource':
        return 'bi-file-earmark'
      default:
        return 'bi-play-circle'
    }
  }
  
  // Initialize first section as expanded by default
  useEffect(() => {
    if (course && course.sections && Array.isArray(course.sections) && course.sections.length > 0) {
      setExpandedSections(new Set([0]))
    }
  }, [course])

  const currentUser = getCurrentUser()
  
  // Check if current user is the course owner/creator
  // Check multiple ways: createdBy field, teacherId field, or if course is in teacher's created courses list
  const isCourseOwner = useMemo(() => {
    if (!currentUser || !course) return false
    
    // Check if course has createdBy field matching current user
    if (course.createdBy === currentUser.id) return true
    
    // Check if course is in teacher's created courses list (for teacher-created courses)
    if (isTeacher()) {
      const courseId = parseInt(id)
      const isInCreatedCourses = teacherCreatedCourses.some(c => {
        const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id
        return cId === courseId
      })
      if (isInCreatedCourses) return true
      
      // Also check if course has isCreatedCourse flag and teacherId matches
      if (course.isCreatedCourse && course.teacherId) {
        // We can't directly check teacherId without loading teacher profile
        // But if it's in teacherCoursesFull and has isCreatedCourse, it's likely the teacher's course
        const teacherCourse = teacherCoursesFull.find(c => {
          const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id
          return cId === courseId && c.isCreatedCourse === true
        })
        if (teacherCourse) return true
      }
    }
    
    return false
  }, [currentUser, course, id, teacherCreatedCourses, teacherCoursesFull])

  // If course is not found, check if it's an unapproved teacher-created course
  // But only show "course not found" after courses have finished loading
  if (!course && !isLoadingCourses) {
    // Check if it's in teacher's created courses (unapproved)
    if (isTeacher() && isAuthenticated() && currentUser) {
      const courseId = parseInt(id)
      // Helper function to match course IDs (handles both string and number IDs, including MongoDB ObjectIds)
      const matchCourseId = (c) => {
        if (!c) return false
        const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id
        const cMongoId = c._id ? String(c._id) : null
        return cId === courseId || String(c.id) === String(courseId) || String(c.id) === id ||
               (cMongoId && (cMongoId === String(courseId) || cMongoId === id))
      }
      
      // Check in teacherCreatedCourses first
      let unapprovedCourse = teacherCreatedCourses.find(c => matchCourseId(c))
      
      // If not found, check in teacherCoursesFull
      if (!unapprovedCourse) {
        unapprovedCourse = teacherCoursesFull.find(c => {
          if (!matchCourseId(c)) return false
          // Check if user is the creator
          return c.createdBy === currentUser.id || 
                 c.teacherId === currentUser.id ||
                 (c.createdByRole === 'teacher' && String(c.createdBy) === String(currentUser.id))
        })
      }
      
      if (unapprovedCourse) {
        // If course is approved, it should have been found in useMemo, but if we're here, 
        // the course exists so we should let it render normally by not returning early
        if (unapprovedCourse.status === 'approved' || !unapprovedCourse.status) {
          // Course is approved, should have been found in useMemo - don't return early
          // Let the component continue to render the course
        } else {
          // Show approval pending message for unapproved courses
          return (
            <div style={{ paddingTop: '150px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
              <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffe69c',
                  borderRadius: '12px',
                  padding: '2rem',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }}>
                  <i className="bi bi-clock-history" style={{ fontSize: '3rem', color: '#c85716', marginBottom: '1rem' }}></i>
                  <h1 style={{ fontSize: '2rem', color: '#110a06', marginBottom: '0.75rem' }}>
                    Your course is currently pending approval
                  </h1>
                  <p style={{ fontSize: '1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
                    Once a general admin reviews and approves <strong>{unapprovedCourse.title || 'your course'}</strong>, it will appear in the catalog like any other course. You can continue editing it from the Manage Courses section if needed.
                  </p>
                  <Link
                    to="/training/teacher-courses?tab=created"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#c85716',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}
                  >
                    Go to Manage Courses
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          )
        }
      }
    }
    
    return (
      <div style={{ paddingTop: '150px', minHeight: '100vh', textAlign: 'center' }}>
        <h1>Course not found</h1>
        <Link to="/training/catalog">Back to Catalog</Link>
      </div>
    )
  }

  // Show loading state while courses are loading
  if (isLoadingCourses) {
    return (
      <div style={{ paddingTop: '150px', minHeight: '100vh', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (isCourseOwner && course.status && course.status !== 'approved') {
    return (
      <div style={{ paddingTop: '150px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffe69c',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
          }}>
            <i className="bi bi-clock-history" style={{ fontSize: '3rem', color: '#c85716', marginBottom: '1rem' }}></i>
            <h1 style={{ fontSize: '2rem', color: '#110a06', marginBottom: '0.75rem' }}>
              Your course is currently pending
            </h1>
            <p style={{ fontSize: '1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
              Once a general admin reviews and approves <strong>{course.title}</strong>, it will appear in the catalog like any other course. You can continue editing it from the Manage Courses section if needed.
            </p>
            <Link
              to="/training/teacher-courses?tab=created"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#c85716',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '600'
              }}
            >
              Go to Manage Courses
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentPrice = course.price ?? course.originalPrice ?? 0
  const originalPrice = course.originalPrice ?? course.price ?? 0
  const hasDiscount = originalPrice > currentPrice
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0

  // Get instructor name and ID (use state)
  const assignedInstructorName = courseInstructor
  const instructorName = assignedInstructorName || course?.teacher || 'Expert Instructor'

  // Get teacher ID for the course
  // Note: Courses created by moderators/admins should NOT be treated as having a teacher assigned
  const getTeacherId = () => {
    // First, use teacher ID from API response (most reliable)
    if (courseTeacherId) {
      return courseTeacherId
    }
    
    // Then check instructor assignments (this is the primary way to assign instructors)
    const assignments = getInstructorAssignments()
    const assignment = assignments[course.id]
    if (assignment && assignment.teacherId) {
      return assignment.teacherId
    }
    
    // Check course data for teacherId (for database courses)
    if (course.teacherId) {
      return course.teacherId
    }
    
    // Then check if it's a teacher-created course (not moderator-created)
    // Use state instead of calling async function
    const teacherCourse = teacherCoursesForId.find(c => c.id === course.id)
    if (teacherCourse && teacherCourse.createdBy) {
      // Only return createdBy if the course was created by a teacher, not an admin/moderator
      const createdByRole = teacherCourse.createdByRole
      // If createdByRole is explicitly 'teacher', or if createdBy starts with 'teacher-', it's a teacher-created course
      const isTeacherCreated = createdByRole === 'teacher' || 
                               (typeof teacherCourse.createdBy === 'string' && teacherCourse.createdBy.startsWith('teacher-'))
      
      if (isTeacherCreated) {
        return teacherCourse.createdBy
      }
      // If it's admin-created (createdByRole === 'admin' or no createdByRole), return null
      // This ensures moderator-created courses behave like default courses without assigned teachers
    }
    
    return null
  }
  
  const teacherId = getTeacherId()
  const hasInstructorAssigned = Boolean(assignedInstructorName || teacherId)
  const lastUpdated = course.lastUpdated ? formatDate(course.lastUpdated) : '11/9/2025'
  const language = course.language || 'English'
  const accessDuration = course.accessDuration || '2 Years'

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '1rem' }}>
          <Link to="/training/catalog" style={{ color: '#6c757d', textDecoration: 'none' }}>
            Training
          </Link>
          <span style={{ margin: '0 8px', color: '#6c757d' }}> &gt; </span>
          <Link to="/training/catalog" style={{ color: '#6c757d', textDecoration: 'none' }}>
            Courses
          </Link>
          <span style={{ margin: '0 8px', color: '#6c757d' }}> &gt; </span>
          <span style={{ color: '#110a06' }}>{course.title}</span>
        </nav>

        <div className="row g-4">
          {/* Left Column - Main Content */}
          <div className="col-lg-8">
            {/* Course Title and Metadata */}
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#110a06', marginBottom: '1rem' }}>
                {course.title}
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#495057', marginBottom: '1rem', lineHeight: '1.6' }}>
                {course.description}
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>Taught by </span>
                  {teacherId && hasInstructorAssigned ? (
                    <Link
                      to={`/training/teacher/${teacherId}`}
                      style={{
                        color: '#c85716',
                        fontWeight: '500',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#a0450f'
                        e.currentTarget.style.textDecoration = 'underline'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#c85716'
                        e.currentTarget.style.textDecoration = 'none'
                      }}
                    >
                      {instructorName}
                    </Link>
                  ) : hasInstructorAssigned ? (
                    <span style={{ color: '#c85716', fontWeight: '500' }}>{instructorName}</span>
                  ) : (
                    <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Not assigned yet</span>
                  )}
                </div>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>Last updated </span>
                  <span style={{ color: '#110a06' }}>{lastUpdated}</span>
                </div>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>Language: </span>
                  <span style={{ color: '#110a06' }}>{language}</span>
                </div>
              </div>
              {course.rating > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: '600', color: '#110a06' }}>{course.rating}</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {renderStars(course.rating)}
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    ({course.ratingCount.toLocaleString()} ratings)
                  </span>
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    No ratings yet
                  </span>
                </div>
              )}
            </div>

            {/* What you'll learn */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                What you'll learn
              </h3>
              <div className="row g-3">
                {course.learnings.map((learning, index) => (
                  <div key={index} className="col-md-6" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '1.1rem', marginTop: '2px', flexShrink: 0 }}></i>
                    <span style={{ color: '#1a1715', fontSize: '0.95rem' }}>{learning}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course content */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', margin: 0 }}>
                  Course content
                </h3>
                <button
                  onClick={toggleAllSections}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c85716',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  {allExpanded ? 'Collapse all sections' : 'Expand all sections'}
                </button>
              </div>
              <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {course.sections?.length || 0} modules • {course.totalLectures || 0} live sessions • {course.totalDuration || 'N/A'} total duration
              </p>
              <div style={{ 
                backgroundColor: '#e7f3ff', 
                padding: '1rem', 
                borderRadius: '6px', 
                marginBottom: '1.5rem',
                border: '1px solid #b3d9ff'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#004085' }}>
                  <i className="bi bi-camera-video" style={{ marginRight: '0.5rem' }}></i>
                  This course is taught live via Zoom. You'll receive meeting links and schedule details after enrollment.
                </p>
              </div>
              <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
                {course.sections && Array.isArray(course.sections) && course.sections.length > 0 ? (
                  course.sections.map((section, index) => {
                  const isExpanded = expandedSections.has(index)
                  const hasItems = section.items && section.items.length > 0
                  
                  return (
                    <div key={index} style={{ marginBottom: '1rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem' }}>
                      <div 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '0.5rem 0',
                          userSelect: 'none'
                        }}
                        onClick={() => toggleSection(index)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <i 
                            className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} 
                            style={{ 
                              color: '#6c757d', 
                              fontSize: '0.85rem',
                              transition: 'transform 0.2s',
                              width: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          ></i>
                          <span style={{ fontWeight: '500', color: '#110a06', fontSize: '0.95rem' }}>
                            {section.title}
                          </span>
                        </div>
                        <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          {section.lectures} {section.lectures === 1 ? 'session' : 'sessions'} • {section.duration}
                        </span>
                      </div>
                      
                      {/* Expanded content with topics covered */}
                      {isExpanded && hasItems && (
                        <div style={{ 
                          marginTop: '0.75rem',
                          marginLeft: '0',
                          paddingLeft: '2rem',
                          backgroundColor: '#f8f9fa',
                          padding: '1rem',
                          borderRadius: '6px'
                        }}>
                          <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.75rem', fontWeight: '500' }}>
                            Topics covered in this module:
                          </p>
                          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1a1715' }}>
                            {section.items.map((item, itemIndex) => (
                              <li key={itemIndex} style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                {item.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })
                ) : (
                  <p style={{ color: '#6c757d', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                    Course content sections are not available.
                  </p>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                Requirements
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1a1715' }}>
                {course.requirements.map((req, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>{req}</li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                Description
              </h3>
              <p style={{ color: '#1a1715', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
                {course.fullDescription}
              </p>
            </div>

            {/* Reviews Section */}
            {courseTeacherId && (
              <div style={{ 
                backgroundColor: '#ffffff', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                marginBottom: '2rem'
              }}>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '600', 
                  color: '#110a06', 
                  marginBottom: '1.5rem' 
                }}>
                  Student Reviews ({courseReviews.length})
                </h3>
                
                {/* Information message about rating */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  borderRadius: '6px',
                  marginBottom: '1.5rem',
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
                    To rate this course, complete it (100% progress) and then rate the instructor on their profile page.
                  </p>
                </div>

                {/* Reviews List */}
                {isLoadingReviews ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                    <i className="bi bi-hourglass-split" style={{ 
                      fontSize: '2rem', 
                      marginBottom: '0.5rem', 
                      display: 'block'
                    }}></i>
                    <p>Loading reviews...</p>
                  </div>
                ) : courseReviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {courseReviews.map((review) => (
                      <div
                        key={review._id}
                        style={{
                          padding: '1.5rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e9ecef'
                        }}
                      >
                        {/* Student Name and Rating */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}>
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#110a06',
                            margin: 0
                          }}>
                            {review.studentName || 'Student'}
                          </h4>
                          
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
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                    <i className="bi bi-chat-left-text" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                    <p>No reviews yet for this course.</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Be the first to review after completing the course!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Course Card */}
          <div className="col-lg-4">
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              position: 'sticky',
              top: '120px'
            }}>
            {/* Course Image */}
            <div style={{ position: 'relative', width: '100%', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={course.image}
                alt={course.title}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(200, 87, 22, 0.9)',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <i className="bi bi-camera-video" style={{ color: '#ffffff', fontSize: '1.2rem' }}></i>
                <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '500' }}>Live Zoom Sessions</span>
              </div>
            </div>

              {/* Pricing */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '700', color: '#110a06' }}>
                    PKR {currentPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span style={{ fontSize: '1.1rem', color: '#6c757d', textDecoration: 'line-through' }}>
                        PKR {originalPrice.toLocaleString()}
                      </span>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        color: '#ffffff', 
                        backgroundColor: '#c85716',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        {discountPercentage}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Buy Button */}
              {enrollment && (enrollment.progress >= 100 || enrollment.isCompleted) ? (
                <button
                  type="button"
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    backgroundColor: '#198754',
                    borderColor: '#198754',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'not-allowed',
                    gap: '0.5rem',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-check-circle-fill"></i>
                  You have completed this course
                </button>
              ) : enrollment && enrollment.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem',
                      backgroundColor: '#ffc107',
                      borderColor: '#ffc107',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      borderRadius: '6px',
                      color: '#856404',
                      cursor: 'not-allowed',
                      gap: '0.5rem',
                      border: 'none'
                    }}
                  >
                    <i className="bi bi-clock-history"></i>
                    Payment Verification Pending
                  </button>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    color: '#856404',
                    textAlign: 'center'
                  }}>
                    <i className="bi bi-info-circle-fill" style={{ marginRight: '0.5rem' }}></i>
                    Your enrollment is pending verification. Once your payment is verified, you'll be automatically enrolled.
                  </div>
                </>
              ) : enrollment && enrollment.status === 'active' ? (
                <Link
                  to={`/training/student`}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    backgroundColor: '#198754',
                    borderColor: '#198754',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    borderRadius: '6px',
                    color: '#ffffff',
                    transition: 'background-color 0.2s',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#157347'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#198754'}
                >
                  <i className="bi bi-play-circle-fill"></i>
                  Continue Learning
                </Link>
              ) : hasInstructorAssigned ? (
                <Link
                  to={`/training/checkout/${course._id || course.id}`}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    backgroundColor: '#c85716',
                    borderColor: '#c85716',
                    textDecoration: 'none',
                    display: 'block',
                    textAlign: 'center',
                    borderRadius: '6px',
                    color: '#ffffff',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b04a12'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c85716'}
                >
                  Buy This Course
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    backgroundColor: '#adb5bd',
                    borderColor: '#adb5bd',
                    textDecoration: 'none',
                    display: 'block',
                    textAlign: 'center',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'not-allowed'
                  }}
                >
                  No Teacher Available
                </button>
              )}

              {/* This course includes */}
              <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '1.5rem' }}>
                <h5 style={{ fontSize: '1rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                  This course includes:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '1rem' }}></i>
                    <span style={{ color: '#1a1715', fontSize: '0.9rem' }}>{course.totalLectures} live Zoom sessions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '1rem' }}></i>
                    <span style={{ color: '#1a1715', fontSize: '0.9rem' }}>{course.totalDuration} total duration</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '1rem' }}></i>
                    <span style={{ color: '#1a1715', fontSize: '0.9rem' }}>
                      Interactive live teaching with Q&A
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '1rem' }}></i>
                    <span style={{ color: '#1a1715', fontSize: '0.9rem' }}>
                      Live cohort participation (no recordings)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#198754', fontSize: '1rem' }}></i>
                    <span style={{ color: '#1a1715', fontSize: '0.9rem' }}>Certificate of completion</span>
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <button
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '1.5rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: '#1a1715',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <i className="bi bi-share"></i>
                Share
              </button>
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

export default CourseDetail
