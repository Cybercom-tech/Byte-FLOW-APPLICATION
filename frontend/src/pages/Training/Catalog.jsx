import React, { useMemo, useState, useEffect, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { coursesData } from './coursesData'
import { getAllCourses, getCourseInstructor } from '../../utils/courseManagement'
import { getCurrentUser, isAuthenticated, isTeacher, isStudent, isGeneralAdmin } from '../../utils/auth'
import { getTeacherReviews } from '../../utils/teacherProfile'
// Lazy load ChatWidget - it's heavy and only needed when authenticated
const ChatWidget = React.lazy(() => import('../../components/ChatWidget'))

function TrainingCatalog() {
  const navigate = useNavigate()
  const [allCourses, setAllCourses] = useState(coursesData)
  const [query, setQuery] = useState('')
  const [selectedTopics, setSelectedTopics] = useState([])
  const [skillLevel, setSkillLevel] = useState('')
  const [rating, setRating] = useState('')
  const [sortBy, setSortBy] = useState('Most Relevant')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [courseInstructors, setCourseInstructors] = useState({}) // Cache for instructor names
  const [courseTeacherIds, setCourseTeacherIds] = useState({}) // Cache for teacher IDs
  const [courseRatings, setCourseRatings] = useState({}) // Cache for course ratings (avg rating)
  const [courseRatingCounts, setCourseRatingCounts] = useState({}) // Cache for course rating counts
  const coursesPerPage = 12

  // Load teacher-created courses and merge with default courses
  const loadTeacherCourses = async () => {
    try {
      const teacherCourses = await getAllCourses()
      const teacherCoursesArray = Array.isArray(teacherCourses) ? teacherCourses : []
      // Merge teacher courses with default courses, teacher courses take precedence if same ID
      const merged = [...coursesData]
      teacherCoursesArray.forEach(teacherCourse => {
        const courseId = teacherCourse.id || teacherCourse._id
        const existingIndex = merged.findIndex(c => {
          const cId = c.id || c._id
          return String(cId) === String(courseId)
        })
        if (existingIndex >= 0) {
          merged[existingIndex] = { ...merged[existingIndex], ...teacherCourse }
        } else {
          merged.push(teacherCourse)
        }
      })
      setAllCourses(merged)
    } catch (error) {
      console.error('Error loading teacher courses:', error)
      // If error, just use default courses
      setAllCourses(coursesData)
    }
  }

  useEffect(() => {
    loadTeacherCourses()
    
    // Listen for course updates to refresh the catalog
    const handleCourseUpdate = () => {
      loadTeacherCourses()
    }
    
    window.addEventListener('courseCreated', handleCourseUpdate)
    window.addEventListener('courseUpdated', handleCourseUpdate)
    window.addEventListener('courseApproved', handleCourseUpdate)
    window.addEventListener('courseDeleted', handleCourseUpdate)
    
    return () => {
      window.removeEventListener('courseCreated', handleCourseUpdate)
      window.removeEventListener('courseUpdated', handleCourseUpdate)
      window.removeEventListener('courseApproved', handleCourseUpdate)
      window.removeEventListener('courseDeleted', handleCourseUpdate)
    }
  }, [])

  const isTeacherOwnedCourse = (course) => {
    if (!course || !course.createdBy) return false
    if (course.createdByRole) {
      return course.createdByRole === 'teacher'
    }
    return typeof course.createdBy === 'string' && course.createdBy.startsWith('teacher-')
  }

  const canTeacherEditCourse = (course) => {
    if (!isTeacher() || !currentUser?.id) {
      return false
    }
    return course?.createdBy === currentUser.id
  }

  const canAdminEditCourse = (course) => {
    if (!isGeneralAdmin()) return false
    return !isTeacherOwnedCourse(course)
  }

  const handleEditCourseClick = (event, course, role) => {
    event.preventDefault()
    event.stopPropagation()
    // Use _id (MongoDB ObjectId) if available for database courses, otherwise use id
    const courseId = course._id || course.id
    if (!courseId) return
    if (role === 'teacher') {
      navigate(`/training/teacher-courses?editCourse=${courseId}`)
    } else {
      navigate(`/training/course-moderation?editCourse=${courseId}`)
    }
  }

  const handleDeleteCourseClick = async (event, course) => {
    event.preventDefault()
    event.stopPropagation()
    if (!course?.id) return

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${course.title}"? This action cannot be undone.`
    )
    if (!confirmDelete) return

    try {
      const { deleteTeacherCourse } = await import('../../utils/courseManagement')
      const result = await deleteTeacherCourse(course._id || course.id)
      
      if (result.success) {
        // Refresh the course list
        await loadTeacherCourses()
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('courseDeleted', {
          detail: { courseId: course._id || course.id }
        }))
      } else {
        alert('Failed to delete course: ' + (result.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course: ' + (error.message || 'Unknown error'))
    }
  }

  useEffect(() => {
    const handleUserChange = () => {
      setCurrentUser(getCurrentUser())
    }
    window.addEventListener('userLogin', handleUserChange)
    window.addEventListener('userLogout', handleUserChange)
    return () => {
      window.removeEventListener('userLogin', handleUserChange)
      window.removeEventListener('userLogout', handleUserChange)
    }
  }, [])

  // Get unique topics/categories from courses dynamically
  const allTopics = useMemo(() => {
    const categories = [...new Set(allCourses.map(course => course.category))]
    return categories.sort()
  }, [allCourses])

  // Determine which topics to show (first 4 if not showing all, otherwise all)
  const topicsToShow = useMemo(() => {
    const initialCount = 4
    if (showAllTopics || allTopics.length <= initialCount) {
      return allTopics
    }
    return allTopics.slice(0, initialCount)
  }, [allTopics, showAllTopics])

  // Load course instructors and teacher IDs
  useEffect(() => {
    const loadInstructors = async () => {
      const instructors = {}
      const teacherIds = {}
      const { api } = await import('../../utils/api')
      
      for (const course of allCourses) {
        try {
          // First, try to get instructor from API (includes teacher ID)
          try {
            const response = await api.get(`/course/${course.id}/instructor`, { includeAuth: false })
            if (response.instructor) {
              instructors[course.id] = response.instructor.name || response.instructor.fullName || ''
              if (response.instructor.id) {
                teacherIds[course.id] = response.instructor.id
              }
            }
          } catch (apiError) {
            // If API fails, fall back to getCourseInstructor
            const instructor = await getCourseInstructor(course.id)
            instructors[course.id] = instructor || course.teacher || course.teacherName || ''
          }
          
          // Also check course data for teacherId (for database courses)
          if (!teacherIds[course.id] && course.teacherId) {
            teacherIds[course.id] = course.teacherId
          } else if (!teacherIds[course.id] && course.createdBy && course.createdByRole === 'teacher') {
            // For teacher-created courses, use createdBy as teacherId
            teacherIds[course.id] = course.createdBy
          }
          
          // Fallback to course data for instructor name
          if (!instructors[course.id]) {
            instructors[course.id] = course.teacher || course.teacherName || course.instructor || ''
          }
        } catch (error) {
          instructors[course.id] = course.teacher || course.teacherName || course.instructor || ''
          if (course.teacherId) {
            teacherIds[course.id] = course.teacherId
          }
        }
      }
      setCourseInstructors(instructors)
      setCourseTeacherIds(teacherIds)
    }
    if (allCourses.length > 0) {
      loadInstructors()
    }
  }, [allCourses])

  // Load course ratings from teacher reviews
  useEffect(() => {
    const loadCourseRatings = async () => {
      const ratings = {}
      const ratingCounts = {}
      
      // Get unique teacher IDs to fetch reviews for
      const teacherIdsSet = new Set()
      for (const courseId in courseTeacherIds) {
        if (courseTeacherIds[courseId]) {
          teacherIdsSet.add(courseTeacherIds[courseId])
        }
      }
      
      // Fetch reviews for each teacher and calculate course-specific ratings
      const teacherReviewsMap = new Map()
      for (const teacherId of teacherIdsSet) {
        try {
          const reviewsData = await getTeacherReviews(teacherId)
          teacherReviewsMap.set(teacherId, reviewsData.reviews || [])
        } catch (error) {
          console.error(`Error loading reviews for teacher ${teacherId}:`, error)
          teacherReviewsMap.set(teacherId, [])
        }
      }
      
      // Calculate ratings for each course
      for (const course of allCourses) {
        const courseId = course.id || course._id
        const teacherId = courseTeacherIds[courseId]
        
        if (!teacherId) {
          // No teacher ID, skip rating calculation
          continue
        }
        
        const reviews = teacherReviewsMap.get(teacherId) || []
        // Filter reviews to only those for this specific course
        const courseIdStr = String(courseId)
        const courseReviews = reviews.filter(review => {
          const reviewCourseIdStr = String(review.courseId)
          // Match by both ID formats (numeric and MongoDB ObjectId)
          return reviewCourseIdStr === courseIdStr || 
                 reviewCourseIdStr === String(course._id) ||
                 reviewCourseIdStr === String(course.id)
        })
        
        if (courseReviews.length > 0) {
          // Calculate average rating
          const totalRating = courseReviews.reduce((sum, review) => sum + (review.rating || 0), 0)
          const avgRating = totalRating / courseReviews.length
          ratings[courseId] = Math.round(avgRating * 10) / 10 // Round to 1 decimal place
          ratingCounts[courseId] = courseReviews.length
        } else {
          // No reviews for this course
          ratings[courseId] = 0
          ratingCounts[courseId] = 0
        }
      }
      
      setCourseRatings(ratings)
      setCourseRatingCounts(ratingCounts)
    }
    
    // Only load ratings if we have teacher IDs loaded
    if (allCourses.length > 0 && Object.keys(courseTeacherIds).length > 0) {
      loadCourseRatings()
    }
  }, [allCourses, courseTeacherIds])

  // Filter courses
  const filtered = useMemo(() => {
    let result = allCourses.filter(c => {
      // Only show approved courses or courses with no status (default courses)
      const isApproved = !c.status || c.status === 'approved'
      if (!isApproved) return false
      
      const instructorName = courseInstructors[c.id] || c.teacher || ''
      const matchesQuery = !query || c.title.toLowerCase().includes(query.toLowerCase()) || 
                          instructorName.toLowerCase().includes(query.toLowerCase()) ||
                          c.description.toLowerCase().includes(query.toLowerCase())
      
      const matchesTopic = selectedTopics.length === 0 || selectedTopics.includes(c.category)
      
      const matchesLevel = !skillLevel || c.level === skillLevel
      
      // Use calculated rating if available, otherwise fall back to course.rating
      const courseRating = courseRatings[c.id] || c.rating || 0
      const matchesRating = !rating || courseRating >= parseFloat(rating)
      
      return matchesQuery && matchesTopic && matchesLevel && matchesRating
    })

    // Sort courses
    if (sortBy === 'Most Relevant') {
      // Sort by relevance (rating * ratingCount for popularity)
      // Handle undefined/null values by treating them as 0
      result.sort((a, b) => {
        const aRating = courseRatings[a.id] || a.rating || 0
        const aRatingCount = courseRatingCounts[a.id] || a.ratingCount || a.totalReviews || 0
        const bRating = courseRatings[b.id] || b.rating || 0
        const bRatingCount = courseRatingCounts[b.id] || b.ratingCount || b.totalReviews || 0
        const aRelevance = aRating * aRatingCount
        const bRelevance = bRating * bRatingCount
        return bRelevance - aRelevance
      })
    } else if (sortBy === 'Highest Rated') {
      result.sort((a, b) => {
        const aRating = courseRatings[a.id] || a.rating || 0
        const bRating = courseRatings[b.id] || b.rating || 0
        return bRating - aRating
      })
    } else if (sortBy === 'Newest') {
      // Sort by creation date (newest first)
      // Use createdAt, updatedAt, or submittedAt, falling back to id as last resort
      result.sort((a, b) => {
        const aDate = a.createdAt || a.updatedAt || a.submittedAt
        const bDate = b.createdAt || b.updatedAt || b.submittedAt
        
        if (aDate && bDate) {
          return new Date(bDate) - new Date(aDate)
        }
        
        // If dates are not available, try to sort by ID (for MongoDB ObjectIds, convert to comparable value)
        const aId = a.id || a._id
        const bId = b.id || b._id
        
        if (typeof aId === 'string' && typeof bId === 'string') {
          // For string IDs (including MongoDB ObjectIds), compare alphabetically
          // MongoDB ObjectIds are sortable chronologically
          return bId.localeCompare(aId)
        }
        
        // For numeric IDs, compare numerically
        const aNum = typeof aId === 'number' ? aId : parseInt(aId, 10)
        const bNum = typeof bId === 'number' ? bId : parseInt(bId, 10)
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return bNum - aNum
        }
        
        return 0
      })
    }

    return result
  }, [allCourses, query, selectedTopics, skillLevel, rating, sortBy, courseInstructors, courseRatings, courseRatingCounts])

  // Pagination
  const totalPages = Math.ceil(filtered.length / coursesPerPage)
  const startIndex = (currentPage - 1) * coursesPerPage
  const paginatedCourses = filtered.slice(startIndex, startIndex + coursesPerPage)

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setSelectedTopics([])
    setSkillLevel('')
    setRating('')
    setQuery('')
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#110a06', marginBottom: '0.5rem' }}>
            Explore All Courses
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
            Join live Zoom sessions taught by expert instructors and learn interactively with real-time Q&A.
          </p>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: '600px' }}>
            <i className="bi bi-search" style={{ 
              position: 'absolute', 
              left: '15px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#6c757d',
              fontSize: '1.1rem'
            }}></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search for courses, software, or instructors..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                paddingLeft: '45px',
                padding: '12px 15px 12px 45px',
                fontSize: '1rem',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

        <div className="row g-4">
          {/* Sidebar Filters */}
          <div className="col-lg-3">
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              position: 'sticky',
              top: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h5 style={{ margin: 0, fontWeight: '600', color: '#110a06' }}>Filters</h5>
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c85716',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  Clear All
                </button>
              </div>

              {/* Topic Filter */}
              <div style={{ marginBottom: '2rem' }}>
                <h6 style={{ marginBottom: '1rem', fontWeight: '600', color: '#110a06', fontSize: '0.95rem' }}>Topic</h6>
                {topicsToShow.map(topic => (
                  <div key={topic} style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic)}
                        onChange={() => handleTopicToggle(topic)}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <span style={{ color: '#1a1715' }}>{topic}</span>
                    </label>
                  </div>
                ))}
                {allTopics.length > 4 && (
                  <button
                    onClick={() => setShowAllTopics(!showAllTopics)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c85716',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      marginTop: '0.5rem'
                    }}
                  >
                    {showAllTopics ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Skill Level Filter */}
              <div style={{ marginBottom: '2rem' }}>
                <h6 style={{ marginBottom: '1rem', fontWeight: '600', color: '#110a06', fontSize: '0.95rem' }}>Skill Level</h6>
                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                  <div key={level} style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="skillLevel"
                        value={level}
                        checked={skillLevel === level}
                        onChange={(e) => {
                          setSkillLevel(e.target.value)
                          setCurrentPage(1)
                        }}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <span style={{ color: '#1a1715' }}>{level}</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Rating Filter */}
              <div>
                <h6 style={{ marginBottom: '1rem', fontWeight: '600', color: '#110a06', fontSize: '0.95rem' }}>Rating</h6>
                {['4.5', '4.0', '3.5'].map(ratingValue => (
                  <div key={ratingValue} style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="rating"
                        value={ratingValue}
                        checked={rating === ratingValue}
                        onChange={(e) => {
                          setRating(e.target.value)
                          setCurrentPage(1)
                        }}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <span style={{ color: '#1a1715' }}>
                        {ratingValue} & up
                        <span style={{ marginLeft: '0.5rem' }}>
                          {renderStars(parseFloat(ratingValue))}
                        </span>
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            </div>

          {/* Main Content */}
          <div className="col-lg-9">
            {/* Results Summary and Sort */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '0.95rem' }}>
                Showing {startIndex + 1}-{Math.min(startIndex + coursesPerPage, filtered.length)} of {filtered.length} results
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ margin: 0, color: '#1a1715', fontSize: '0.95rem' }}>Sort by:</label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    minWidth: '150px'
                  }}
                >
                  <option>Most Relevant</option>
                  <option>Highest Rated</option>
                  <option>Newest</option>
              </select>
            </div>
          </div>

            {/* Course Grid */}
          <div className="row g-4">
              {paginatedCourses.map((course) => {
                const currentPrice = course.price ?? course.originalPrice ?? 0
                const originalPrice = course.originalPrice ?? course.price ?? 0
                const hasDiscount = originalPrice > currentPrice
                const discountPercentage = hasDiscount
                  ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                  : 0
                const teacherCanEdit = canTeacherEditCourse(course)
                const adminCanEdit = canAdminEditCourse(course)
                const showEditButton = teacherCanEdit || adminCanEdit
                const showDeleteButton = adminCanEdit // Only admins can delete courses
                // Use _id if available (for MongoDB ObjectIds), otherwise use id
                const courseIdForRoute = course._id || course.id
                return (
                  <div className="col-lg-4 col-md-6" key={courseIdForRoute || course.id}>
                    <Link 
                      to={`/training/course/${courseIdForRoute || course.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e9ecef',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      >
                        {(showEditButton || showDeleteButton) && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 5,
                            display: 'flex',
                            gap: '0.5rem'
                          }}>
                            {showEditButton && (
                              <button
                                onClick={(event) => handleEditCourseClick(event, course, teacherCanEdit ? 'teacher' : 'admin')}
                                style={{
                                  padding: '0.35rem 0.9rem',
                                  borderRadius: '999px',
                                  border: 'none',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  color: '#ffffff',
                                  backgroundColor: teacherCanEdit ? '#0d6efd' : '#c85716',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = teacherCanEdit ? '#0b5ed7' : '#a0450f'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = teacherCanEdit ? '#0d6efd' : '#c85716'
                                }}
                              >
                                Edit
                              </button>
                            )}
                            {showDeleteButton && (
                              <button
                                onClick={(event) => handleDeleteCourseClick(event, course)}
                                style={{
                                  padding: '0.35rem 0.9rem',
                                  borderRadius: '999px',
                                  border: 'none',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  color: '#ffffff',
                                  backgroundColor: '#dc3545',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#bb2d3b'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#dc3545'
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                        {/* Course Image */}
                        <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
                          <img
                            src={course.image}
                            alt={course.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          {course.badge && (
                            <span style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: course.badge === 'Bestseller' ? '#0dcaf0' : '#fd7e14',
                              color: '#ffffff'
                            }}>
                              {course.badge}
                            </span>
                          )}
                        </div>

                        {/* Course Content */}
                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h5 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#110a06',
                            marginBottom: '0.5rem',
                            lineHeight: '1.4',
                            minHeight: '3em'
                          }}>
                            {course.title}
                          </h5>
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#6c757d',
                            marginBottom: '0.75rem'
                          }}>
                            Taught by{' '}
                            {courseTeacherIds[course.id] ? (
                              <span
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  navigate(`/training/teacher/${courseTeacherIds[course.id]}`)
                                }}
                                style={{
                                  color: '#c85716',
                                  textDecoration: 'none',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s'
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
                                {courseInstructors[course.id] || course.teacher || course.teacherName || 'Instructor'}
                              </span>
                            ) : (
                              <span>{courseInstructors[course.id] || course.teacher || course.teacherName || 'Instructor'}</span>
                            )}
                          </p>
                          {(courseRatings[course.id] || course.rating) > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <span style={{ fontWeight: '600', color: '#110a06' }}>
                                {courseRatings[course.id] || course.rating}
                              </span>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderStars(courseRatings[course.id] || course.rating)}
                              </div>
                              <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                ({(courseRatingCounts[course.id] || course.ratingCount || 0).toLocaleString()})
                              </span>
                            </div>
                          ) : (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                No ratings yet
                              </span>
                            </div>
                          )}
                          
                          {/* Price */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#110a06' }}>
                                PKR {currentPrice.toLocaleString()}
                              </span>
                              {hasDiscount && (
                                <span style={{ fontSize: '0.9rem', color: '#6c757d', textDecoration: 'line-through' }}>
                                  PKR {originalPrice.toLocaleString()}
                                </span>
                              )}
                              {hasDiscount && discountPercentage > 0 && (
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#ffffff', 
                                  backgroundColor: '#c85716',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: '600'
                                }}>
                                  {discountPercentage}% OFF
                                </span>
                              )}
                            </div>
                  </div>

                          <p style={{
                            fontSize: '0.9rem',
                            color: '#495057',
                            lineHeight: '1.5',
                            marginBottom: '1rem',
                            flex: 1
                          }}>
                            {course.description.length > 100 
                              ? `${course.description.substring(0, 100)}...` 
                              : course.description}
                          </p>
                  </div>
                </div>
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (() => {
              const getPageNumbers = () => {
                const pages = []
                const maxPages = 7
                
                if (totalPages <= maxPages) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  if (currentPage <= 4) {
                    for (let i = 1; i <= 5; i++) {
                      pages.push(i)
                    }
                    pages.push('ellipsis')
                    pages.push(totalPages)
                  } else if (currentPage >= totalPages - 3) {
                    pages.push(1)
                    pages.push('ellipsis')
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    pages.push(1)
                    pages.push('ellipsis')
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                      pages.push(i)
                    }
                    pages.push('ellipsis')
                    pages.push(totalPages)
                  }
                }
                return pages
              }
              
              const pageNumbers = getPageNumbers()
              
              return (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '3rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      backgroundColor: currentPage === 1 ? '#f8f9fa' : '#ffffff',
                      color: currentPage === 1 ? '#adb5bd' : '#1a1715',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  
                  {pageNumbers.map((pageNum, index) => {
                    if (pageNum === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${index}`} style={{ padding: '0 4px', color: '#6c757d' }}>
                          ...
                        </span>
                      )
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          backgroundColor: currentPage === pageNum ? '#c85716' : '#ffffff',
                          color: currentPage === pageNum ? '#ffffff' : '#1a1715',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: currentPage === pageNum ? '600' : '400',
                          minWidth: '40px'
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      backgroundColor: currentPage === totalPages ? '#f8f9fa' : '#ffffff',
                      color: currentPage === totalPages ? '#adb5bd' : '#1a1715',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
              </div>
              )
            })()}

            {paginatedCourses.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>No courses match your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isAuthenticated() && (isTeacher() || isStudent()) && (
        <Suspense fallback={null}>
          <ChatWidget userType={isTeacher() ? 'teacher' : 'student'} />
        </Suspense>
      )}
    </div>
  )
}

export default TrainingCatalog
