import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { isAuthenticated, isGeneralAdmin, getCurrentUser } from '../../utils/auth'
import { getPendingCourses, approveCourse, rejectCourse, getAllCourses } from '../../utils/courseManagement'
import { saveTeacherCourse } from '../../utils/courseManagement'
import { coursesData } from './coursesData'
import { getToken } from '../../utils/api'

function CourseModeration() {
  const navigate = useNavigate()
  const location = useLocation()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [filter, setFilter] = useState('pending') // 'pending', 'approved', 'rejected', 'all'
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [courseToReject, setCourseToReject] = useState(null)
  const [createSuccess, setCreateSuccess] = useState('')
  const [createError, setCreateError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    fullDescription: '',
    category: '',
    level: 'Beginner',
    price: '',
    originalPrice: '',
    image: '',
    learnings: [''],
    requirements: [''],
    sections: [],
    badge: ''
  })
  const [sectionForm, setSectionForm] = useState({
    title: '',
    items: []
  })
  const [itemForm, setItemForm] = useState({
    title: '',
    duration: '',
    type: 'session'
  })
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [editingSourceCourse, setEditingSourceCourse] = useState(null)
  const [courseCounts, setCourseCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0
  })

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated() || !isGeneralAdmin()) {
      navigate('/training/admin-auth')
      return
    }
  }, [navigate])

  // Load courses
  useEffect(() => {
    const loadCoursesAsync = async () => {
      await loadCourses()
    }
    
    loadCoursesAsync()
    
    // Refresh every 2 seconds to get new submissions
    const interval = setInterval(loadCoursesAsync, 2000)
    return () => clearInterval(interval)
  }, [filter])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const editCourseParam = params.get('editCourse')
    if (!editCourseParam) return
    const handleEditCourse = async () => {
      const course = await findCourseForEditing(editCourseParam)
      if (course) {
        startEditingCourse(course)
        navigate('/training/course-moderation', { replace: true })
      } else {
        alert('Course not found or cannot be edited.')
        navigate('/training/course-moderation', { replace: true })
      }
    }
    handleEditCourse()
  }, [location.search, navigate])

  const loadCourses = async () => {
    try {
      const allCourses = await getAllCourses(true) // Include pending courses
      
      // Update course counts
      setCourseCounts({
        pending: allCourses.filter(c => c.status === 'pending' || !c.status).length,
        approved: allCourses.filter(c => c.status === 'approved').length,
        rejected: allCourses.filter(c => c.status === 'rejected').length,
        all: allCourses.length
      })
      
      // Sort by submitted date (newest first)
      const sortedCourses = [...allCourses].sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0)
        const dateB = new Date(b.submittedAt || b.createdAt || 0)
        return dateB - dateA
      })
      
      // Apply filter
      let filteredCourses = sortedCourses
      if (filter === 'pending') {
        filteredCourses = sortedCourses.filter(c => c.status === 'pending' || !c.status)
      } else if (filter === 'approved') {
        filteredCourses = sortedCourses.filter(c => c.status === 'approved')
      } else if (filter === 'rejected') {
        filteredCourses = sortedCourses.filter(c => c.status === 'rejected')
      }
      
      setCourses(filteredCourses)
    } catch (error) {
      console.error('Error loading courses:', error)
      setCourses([])
      setCourseCounts({ pending: 0, approved: 0, rejected: 0, all: 0 })
    }
  }

  const handleApprove = async (courseId) => {
    // Check if token exists before attempting approval
    const token = getToken()
    if (!token) {
      alert('No authentication token found. Please log out and log back in.\n\nIf you just created the admin account in the backend, make sure to:\n1. Log out completely\n2. Log back in with admin@byteflow.com / admin123\n3. The system will now authenticate via the backend and get a valid token.')
      return
    }

    const currentUser = getCurrentUser()
    const result = await approveCourse(courseId, currentUser.id, currentUser.name)
    
    if (result.success) {
      alert('Course approved successfully!')
      await loadCourses()
      if (selectedCourse && selectedCourse.id === courseId) {
        setSelectedCourse(null)
      }
    } else {
      alert('Failed to approve course: ' + (result.message || 'Unknown error'))
    }
  }

  const handleReject = (courseId) => {
    setCourseToReject(courseId)
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!courseToReject) return
    
    const currentUser = getCurrentUser()
    const result = await rejectCourse(courseToReject, currentUser.id, currentUser.name, rejectionReason)
    
    if (result.success) {
      alert('Course rejected.')
      setShowRejectModal(false)
      setCourseToReject(null)
      setRejectionReason('')
      await loadCourses()
      if (selectedCourse && selectedCourse.id === courseToReject) {
        setSelectedCourse(null)
      }
    } else {
      alert('Failed to reject course: ' + (result.message || 'Unknown error'))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  // Helper function to extract teacher ID from course (always returns string or null)
  const getTeacherIdFromCourse = (course) => {
    if (!course) return null
    
    // Helper to convert any ID format to string
    const toStringId = (id) => {
      if (!id) return null
      // If it's an object (like MongoDB ObjectId), extract the _id or toString
      if (typeof id === 'object' && id !== null) {
        return id._id ? String(id._id) : String(id)
      }
      // If it's already a string or number, convert to string
      return String(id)
    }
    
    // First check if course has teacherId field
    if (course.teacherId) {
      return toStringId(course.teacherId)
    }
    
    // Check if it's a teacher-created course
    const isTeacherCreated = course.createdByRole === 'teacher' ||
      (typeof course.createdBy === 'string' && course.createdBy.startsWith('teacher-'))
    
    if (isTeacherCreated && course.createdBy) {
      // Extract ID from "teacher-{id}" format or use the ID directly
      if (typeof course.createdBy === 'string' && course.createdBy.startsWith('teacher-')) {
        return course.createdBy.replace('teacher-', '')
      }
      return toStringId(course.createdBy)
    }
    
    return null
  }

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: '600',
          backgroundColor: '#d1e7dd',
          color: '#198754'
        }}>
          Approved
        </span>
      )
    } else if (status === 'rejected') {
      return (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: '600',
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}>
          Rejected
        </span>
      )
    } else {
      return (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: '600',
          backgroundColor: '#fff3cd',
          color: '#856404'
        }}>
          Pending
        </span>
      )
    }
  }

  const handleCourseFormChange = (field, value) => {
    setCourseForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCourseImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_IMAGE_SIZE) {
      alert('Please select an image smaller than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setCourseForm(prev => ({ ...prev, image: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCourseImage = () => {
    setCourseForm(prev => ({ ...prev, image: '' }))
  }

  const handleLearningChange = (index, value) => {
    const updated = [...courseForm.learnings]
    updated[index] = value
    setCourseForm(prev => ({ ...prev, learnings: updated }))
  }

  const addLearning = () => {
    setCourseForm(prev => ({ ...prev, learnings: [...prev.learnings, ''] }))
  }

  const removeLearning = (index) => {
    setCourseForm(prev => ({
      ...prev,
      learnings: prev.learnings.filter((_, i) => i !== index)
    }))
  }

  const handleRequirementChange = (index, value) => {
    const updated = [...courseForm.requirements]
    updated[index] = value
    setCourseForm(prev => ({ ...prev, requirements: updated }))
  }

  const addRequirement = () => {
    setCourseForm(prev => ({ ...prev, requirements: [...prev.requirements, ''] }))
  }

  const removeRequirement = (index) => {
    setCourseForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const handleSectionFormChange = (field, value) => {
    setSectionForm(prev => ({ ...prev, [field]: value }))
  }

  const addItemToSection = () => {
    if (!itemForm.title || !itemForm.duration) return
    setSectionForm(prev => ({
      ...prev,
      items: [...prev.items, { ...itemForm }]
    }))
    setItemForm({ title: '', duration: '', type: 'session' })
  }

  const removeItemFromSection = (index) => {
    setSectionForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const addSection = () => {
    if (!sectionForm.title) {
      alert('Please enter a section title')
      return
    }
    
    if (sectionForm.items.length === 0) {
      alert('Please add at least one lecture/topic to this section before adding it to the course')
      return
    }
    
    const totalMinutes = sectionForm.items.reduce((sum, item) => {
      const mins = parseInt(item.duration) || 0
      return sum + mins
    }, 0)

    const newSection = {
      title: sectionForm.title,
      lectures: sectionForm.items.length,
      duration: `${totalMinutes}min`,
      items: sectionForm.items
    }

    setCourseForm(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
    setSectionForm({ title: '', items: [] })
  }

  const removeSection = (index) => {
    setCourseForm(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }))
  }

  const calculateTotalLectures = () => {
    return courseForm.sections.reduce((sum, section) => sum + (section.lectures || 0), 0)
  }

  const calculateTotalDuration = () => {
    // Calculate from all items in all sections (more accurate)
    const totalMinutes = courseForm.sections.reduce((sum, section) => {
      if (section.items && Array.isArray(section.items) && section.items.length > 0) {
        const sectionMinutes = section.items.reduce((itemSum, item) => {
          const mins = parseInt(item.duration) || 0
          return itemSum + mins
        }, 0)
        return sum + sectionMinutes
      }
      // Fallback to section.duration if items not available
      const mins = parseInt(section.duration?.replace(/[^0-9]/g, '') || 0)
      return sum + mins
    }, 0)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0) {
      return `${hours}hr ${minutes}min`
    }
    return `${minutes}min`
  }

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      description: '',
      fullDescription: '',
      category: '',
      level: 'Beginner',
      price: '',
      originalPrice: '',
      image: '',
      learnings: [''],
      requirements: [''],
      sections: [],
      badge: ''
    })
    setSectionForm({ title: '', items: [] })
    setItemForm({ title: '', duration: '', type: 'session' })
  }

  const populateCourseForm = (course) => {
    if (!course) return
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      fullDescription: course.fullDescription || '',
      category: course.category || '',
      level: course.level || 'Beginner',
      price: course.price !== undefined && course.price !== null ? String(course.price) : '',
      originalPrice: course.originalPrice !== undefined && course.originalPrice !== null ? String(course.originalPrice) : '',
      image: course.image || '',
      learnings: course.learnings && course.learnings.length > 0 ? [...course.learnings] : [''],
      requirements: course.requirements && course.requirements.length > 0 ? [...course.requirements] : [''],
      sections: (course.sections || []).map(section => ({
        ...section,
        items: (section.items || []).map(item => ({ ...item }))
      })),
      badge: course.badge || ''
    })
    setSectionForm({ title: '', items: [] })
    setItemForm({ title: '', duration: '', type: 'session' })
  }

  const findCourseForEditing = async (courseId) => {
    // Handle both numeric IDs (default courses) and MongoDB ObjectIds (database courses)
    const courseIdStr = String(courseId)
    const numericId = parseInt(courseIdStr, 10)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/
    const isObjectId = objectIdPattern.test(courseIdStr)
    
    const storedCourses = await getAllCourses(true)
    
    // First try to find by exact ID match (works for both numeric and ObjectId)
    // Prioritize matching by _id (MongoDB ObjectId) for database courses
    let course = storedCourses.find(c => {
      const cId = String(c.id || c._id || '')
      const c_id = String(c._id || '')
      // Match by _id first (for database courses), then by id
      return c_id === courseIdStr || cId === courseIdStr || (numericId && !isNaN(c.id) && c.id === numericId)
    })
    
    if (course) {
      // Ensure _id is preserved if it exists (for database courses)
      const courseCopy = { ...course }
      if (course._id && !courseCopy._id) {
        courseCopy._id = course._id
      }
      // Ensure id matches _id if _id exists (for consistency)
      if (courseCopy._id && objectIdPattern.test(String(courseCopy._id))) {
        courseCopy.id = courseCopy._id
      }
      return courseCopy
    }
    
    // If not found and it's a numeric ID, check default courses
    if (numericId && !isNaN(numericId)) {
      const defaultCourse = coursesData.find(c => c.id === numericId)
      if (defaultCourse) return { ...defaultCourse }
    }
    
    return null
  }

  const startEditingCourse = (course) => {
    if (!course) return
    const isTeacherOwned =
      course.createdByRole === 'teacher' ||
      (typeof course.createdBy === 'string' && course.createdBy.startsWith('teacher-'))

    if (isTeacherOwned) {
      setCreateError('Teacher-created courses can only be edited by the teacher.')
      return
    }

    setShowCreateForm(true)
    setIsEditingCourse(true)
    // Prioritize _id (MongoDB ObjectId) for database courses to ensure updates work correctly
    // Check if _id exists and is a valid MongoDB ObjectId pattern
    const objectIdPattern = /^[0-9a-fA-F]{24}$/
    const hasValidObjectId = course._id && objectIdPattern.test(String(course._id))
    const courseId = hasValidObjectId ? course._id : (course._id || course.id)
    setEditingCourseId(courseId)
    setEditingSourceCourse(course)
    populateCourseForm(course)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setIsEditingCourse(false)
    setEditingCourseId(null)
    setEditingSourceCourse(null)
    setCreateError('')
    setCreateSuccess('')
    resetCourseForm()
  }

  const handleCreateCourse = async () => {
    setCreateSuccess('')
    setCreateError('')

    if (!courseForm.title || !courseForm.description || !courseForm.category) {
      setCreateError('Please fill in Title, Description, and Category.')
      return
    }

    if (!courseForm.image) {
      setCreateError('Please upload a course image.')
      return
    }

    const validLearnings = courseForm.learnings.filter(item => item.trim() !== '')
    if (validLearnings.length === 0) {
      setCreateError('Please add at least one learning outcome.')
      return
    }

    if (courseForm.sections.length === 0) {
      setCreateError('Please add at least one module/section.')
      return
    }

    // Validate that each section has at least one lecture/topic
    const sectionsWithoutLectures = courseForm.sections.filter(section => {
      const itemCount = section.items && Array.isArray(section.items) ? section.items.length : 0
      return itemCount === 0
    })
    
    if (sectionsWithoutLectures.length > 0) {
      setCreateError('Each section must have at least one lecture/topic. Please add lectures to all sections before saving.')
      return
    }

    const currentUser = getCurrentUser()
    const creatorId = currentUser?.id || 'general-admin'
    const instructorName = currentUser?.name || 'General Admin'
    const isUpdating = isEditingCourse && editingCourseId
    const baseCourse = isUpdating ? editingSourceCourse : null
    const derivedCreatorRole = isUpdating
      ? (baseCourse?.createdByRole || (baseCourse?.createdBy?.startsWith('teacher-') ? 'teacher' : 'admin'))
      : 'admin'

    if (derivedCreatorRole === 'teacher') {
      setCreateError('Teacher-created courses can only be edited by the teacher who submitted them.')
      return
    }

    const derivedCreatorId = isUpdating
      ? (baseCourse?.createdBy || creatorId)
      : creatorId

    // For moderator-created courses, don't set teacherName/teacher unless it's an update with existing instructor
    // This ensures moderator-created courses behave like default courses without assigned teachers
    const instructorLabel = isUpdating 
      ? (baseCourse?.teacherName || baseCourse?.teacher || null)
      : null // For new courses, don't set teacher name

    // Determine the course ID to use for updates
    // Prioritize _id from the source course if it's a valid MongoDB ObjectId
    const objectIdPattern = /^[0-9a-fA-F]{24}$/
    let updateCourseId = null
    if (isUpdating && editingCourseId) {
      const editingIdStr = String(editingCourseId)
      // Check if editingCourseId is a MongoDB ObjectId
      if (objectIdPattern.test(editingIdStr)) {
        updateCourseId = editingCourseId
      } else if (baseCourse?._id && objectIdPattern.test(String(baseCourse._id))) {
        // Fallback: use _id from baseCourse if editingCourseId is not a valid ObjectId
        updateCourseId = baseCourse._id
      } else {
        // If neither is a valid ObjectId, this might be a default course that needs to be created
        // For now, we'll still try to use editingCourseId, but it will create a new course
        updateCourseId = editingCourseId
      }
    }

    const courseData = {
      ...courseForm,
      // For updates, use the MongoDB ObjectId (editingCourseId should be the _id from database)
      // For creates, use Date.now() as a temporary ID
      id: isUpdating ? updateCourseId : Date.now(),
      _id: isUpdating ? updateCourseId : undefined, // Also include _id for MongoDB ObjectId detection
      createdBy: derivedCreatorId,
      createdByRole: derivedCreatorRole,
      teacherName: instructorLabel || null,
      teacher: instructorLabel || null,
      rating: baseCourse?.rating ?? 0,
      ratingCount: baseCourse?.ratingCount ?? 0,
      totalLectures: calculateTotalLectures(),
      totalDuration: calculateTotalDuration(),
      lastUpdated: new Date().toISOString().split('T')[0],
      price: parseFloat(courseForm.price) || 0,
      originalPrice: parseFloat(courseForm.originalPrice) || parseFloat(courseForm.price) || 0,
      learnings: courseForm.learnings.filter(item => item.trim() !== ''),
      requirements: courseForm.requirements.filter(item => item.trim() !== ''),
      status: 'approved'
    }

    const result = await saveTeacherCourse(courseData)
    if (result.success) {
      setCreateSuccess(isUpdating ? 'Course updated successfully.' : 'Course created and published successfully.')
      resetCourseForm()
      setIsEditingCourse(false)
      setEditingCourseId(null)
      setEditingSourceCourse(null)
      await loadCourses()
      
      // Dispatch event to notify other components (like Catalog) to refresh
      window.dispatchEvent(new CustomEvent(isUpdating ? 'courseUpdated' : 'courseCreated', {
        detail: { courseId: result.course?.id || editingCourseId }
      }))
      
      setTimeout(() => setCreateSuccess(''), 2000)
    } else {
      setCreateError(result.message || 'Failed to create course.')
    }
  }

  const categories = [...new Set(coursesData.map(c => c.category))].sort()

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#110a06', marginBottom: '0.5rem' }}>
            Course Moderation
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
            Review and approve/reject courses submitted by teachers.
          </p>
          <button
            onClick={() => setShowCreateForm(prev => !prev)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: showCreateForm ? '#6c757d' : '#c85716',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className={`bi ${showCreateForm ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
            {showCreateForm ? 'Hide Course Builder' : 'Add New Course'}
          </button>
        </div>

        {showCreateForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2.5rem' }}>
            {isEditingCourse && (
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffe69c',
                borderRadius: '8px',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="bi bi-pencil-square" style={{ color: '#c85716', fontSize: '1.5rem' }}></i>
                <div>
                  <strong style={{ display: 'block', color: '#110a06' }}>Editing Course</strong>
                  <span style={{ color: '#6c757d' }}>
                    Updating: {courseForm.title || 'Untitled Course'}
                  </span>
                </div>
              </div>
            )}
            {createSuccess && (
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #c3e6cb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{createSuccess}</span>
                <button
                  onClick={() => setCreateSuccess('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#155724',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {createError && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#842029',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #f5c2c7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{createError}</span>
                <button
                  onClick={() => setCreateError('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#842029',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1.5rem' }}>
                Basic Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => handleCourseFormChange('title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter course title"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                    Short Description *
                  </label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => handleCourseFormChange('description', e.target.value)}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Brief description (shown in catalog)"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                    Full Description
                  </label>
                  <textarea
                    value={courseForm.fullDescription}
                    onChange={(e) => handleCourseFormChange('fullDescription', e.target.value)}
                    rows="5"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Detailed course description"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                      Category *
                    </label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => handleCourseFormChange('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                      Level
                    </label>
                    <select
                      value={courseForm.level}
                      onChange={(e) => handleCourseFormChange('level', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                      Price (PKR) *
                    </label>
                    <input
                      type="number"
                      value={courseForm.price}
                      onChange={(e) => handleCourseFormChange('price', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                      placeholder="8999"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                      Original Price (PKR)
                    </label>
                    <input
                      type="number"
                      value={courseForm.originalPrice}
                      onChange={(e) => handleCourseFormChange('originalPrice', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                      placeholder="14999"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                    Course Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCourseImageUpload}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    Upload a high-quality JPG or PNG image up to 2MB.
                  </p>
                  {courseForm.image && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <img
                        src={courseForm.image}
                        alt="Course preview"
                        style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e9ecef' }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveCourseImage}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1.5rem' }}>
                What You'll Learn <span style={{ color: 'black' }}>*</span>
              </h3>
              {courseForm.learnings.map((learning, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={learning}
                    onChange={(e) => handleLearningChange(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter learning outcome"
                  />
                  {courseForm.learnings.length > 1 && (
                    <button
                      onClick={() => removeLearning(index)}
                      style={{
                        padding: '10px',
                        backgroundColor: '#dc3545',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addLearning}
                style={{
                  marginTop: '0.5rem',
                  padding: '8px 16px',
                  backgroundColor: '#f8f9fa',
                  color: '#110a06',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                + Add Learning Outcome
              </button>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1.5rem' }}>
                Requirements
              </h3>
              {courseForm.requirements.map((requirement, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter requirement"
                  />
                  {courseForm.requirements.length > 1 && (
                    <button
                      onClick={() => removeRequirement(index)}
                      style={{
                        padding: '10px',
                        backgroundColor: '#dc3545',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addRequirement}
                style={{
                  marginTop: '0.5rem',
                  padding: '8px 16px',
                  backgroundColor: '#f8f9fa',
                  color: '#110a06',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                + Add Requirement
              </button>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1.5rem' }}>
                Course Content <span style={{ color: 'black' }}>*</span>
              </h3>

              <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                  Add New Section
                </h4>
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={sectionForm.title}
                    onChange={(e) => handleSectionFormChange('title', e.target.value)}
                    placeholder="Section Title"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      marginBottom: '1rem'
                    }}
                  />

                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.75rem' }}>
                      Add topics that will be covered in this module's live sessions:
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={itemForm.title}
                        onChange={(e) => setItemForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Topic Title (e.g., Introduction to Machine Learning)"
                        style={{
                          flex: 0.7,
                          padding: '8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                      <input
                        type="text"
                        value={itemForm.duration}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setItemForm(prev => ({ ...prev, duration: value }))
                        }}
                        placeholder="Estimated time (e.g., 60min)"
                        style={{
                          width: '180px',
                          padding: '8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button
                        onClick={addItemToSection}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#c85716',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Add Topic
                      </button>
                    </div>
                  </div>

                  {sectionForm.items.length > 0 && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '6px' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Topics in this module:</strong>
                      {sectionForm.items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #e9ecef' }}>
                          <span style={{ fontSize: '0.9rem' }}>
                            {item.title} {item.duration && `(${item.duration}min)`}
                          </span>
                          <button
                            onClick={() => removeItemFromSection(index)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={addSection}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#c85716',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    Add Section
                  </button>
                </div>
              </div>

              {courseForm.sections.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                    Course Sections ({courseForm.sections.length})
                  </h4>
                  {courseForm.sections.map((section, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        marginBottom: '1rem',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>{section.title}</strong>
                        <button
                          onClick={() => removeSection(index)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#dc3545',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        {section.lectures} lectures • {section.duration}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
              {isEditingCourse && (
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#6c757d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1.05rem',
                    fontWeight: '600'
                  }}
                >
                  Cancel Edit
                </button>
              )}
              <button
                onClick={handleCreateCourse}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#c85716',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}
              >
                {isEditingCourse ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e9ecef'
        }}>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderBottom: filter === 'pending' ? '3px solid #ffc107' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: filter === 'pending' ? '#ffc107' : '#6c757d',
              fontWeight: filter === 'pending' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            Pending ({courseCounts.pending})
          </button>
          <button
            onClick={() => setFilter('approved')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderBottom: filter === 'approved' ? '3px solid #198754' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: filter === 'approved' ? '#198754' : '#6c757d',
              fontWeight: filter === 'approved' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            Approved ({courseCounts.approved})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderBottom: filter === 'rejected' ? '3px solid #dc3545' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: filter === 'rejected' ? '#dc3545' : '#6c757d',
              fontWeight: filter === 'rejected' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            Rejected ({courseCounts.rejected})
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderBottom: filter === 'all' ? '3px solid #c85716' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: filter === 'all' ? '#c85716' : '#6c757d',
              fontWeight: filter === 'all' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            All ({courseCounts.all})
          </button>
        </div>

        {/* Courses Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          overflow: 'hidden'
        }}>
          {courses.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>
                {filter === 'pending' 
                  ? 'No pending courses to review' 
                  : filter === 'approved'
                  ? 'No approved courses'
                  : filter === 'rejected'
                  ? 'No rejected courses'
                  : 'No courses found'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Course Title
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Teacher
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Category
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Submitted
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    style={{
                      borderBottom: '1px solid #e9ecef',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#110a06', fontWeight: '500' }}>
                      {course.title || 'Untitled Course'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#6c757d' }}>
                      {(() => {
                        const teacherId = getTeacherIdFromCourse(course)
                        const teacherName = course.teacherName || course.teacher || 'Unknown'
                        
                        if (teacherId && teacherName !== 'Unknown') {
                          return (
                            <Link
                              to={`/training/teacher/${teacherId}`}
                              onClick={(e) => e.stopPropagation()}
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
                              {teacherName}
                            </Link>
                          )
                        }
                        return teacherName
                      })()}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#6c757d' }}>
                      {course.category || 'Uncategorized'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(course.status || 'pending')}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#6c757d' }}>
                      {formatDate(course.submittedAt || course.createdAt)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {course.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              await handleApprove(course.id)
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#198754',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#157347'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#198754'
                            }}
                          >
                            <i className="bi bi-check-circle" style={{ marginRight: '0.25rem' }}></i>
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(course.id)
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#bb2d3b'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc3545'
                            }}
                          >
                            <i className="bi bi-x-circle" style={{ marginRight: '0.25rem' }}></i>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                          {course.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Course Detail Modal */}
        {selectedCourse && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '2rem'
            }}
            onClick={() => setSelectedCourse(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                width: '800px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedCourse(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#6c757d',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <i className="bi bi-x"></i>
              </button>

              {/* Course Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                  {selectedCourse.title || 'Untitled Course'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: '#6c757d' }}>
                  <p style={{ margin: 0 }}>
                    <strong>Teacher:</strong>{' '}
                    {(() => {
                      const teacherId = getTeacherIdFromCourse(selectedCourse)
                      const teacherName = selectedCourse.teacherName || selectedCourse.teacher || 'Unknown'
                      
                      if (teacherId && teacherName !== 'Unknown') {
                        return (
                          <Link
                            to={`/training/teacher/${teacherId}`}
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
                            {teacherName}
                          </Link>
                        )
                      }
                      return <span>{teacherName}</span>
                    })()}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Category:</strong> {selectedCourse.category || 'Uncategorized'}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Level:</strong> {selectedCourse.level || 'Not specified'}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Price:</strong> PKR {selectedCourse.price?.toLocaleString() || '0'}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Status:</strong> {getStatusBadge(selectedCourse.status || 'pending')}
                  </p>
                  {selectedCourse.description && (
                    <div style={{ marginTop: '1rem' }}>
                      <strong>Description:</strong>
                      <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>{selectedCourse.description}</p>
                    </div>
                  )}
                  {selectedCourse.fullDescription && (
                    <div style={{ marginTop: '1rem' }}>
                      <strong>Full Description:</strong>
                      <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>{selectedCourse.fullDescription}</p>
                    </div>
                  )}
                  {selectedCourse.sections && selectedCourse.sections.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <strong>Course Content ({selectedCourse.sections.length} sections):</strong>
                      <div style={{ marginTop: '0.5rem' }}>
                        {selectedCourse.sections.map((section, idx) => (
                          <div key={idx} style={{ marginBottom: '0.5rem', paddingLeft: '1rem' }}>
                            <strong>{section.title}</strong> ({section.items?.length || 0} items)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedCourse.status === 'pending' && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button
                    onClick={async () => {
                      await handleReject(selectedCourse.id)
                      setSelectedCourse(null)
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#dc3545',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#bb2d3b'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc3545'
                    }}
                  >
                    <i className="bi bi-x-circle" style={{ marginRight: '0.5rem' }}></i>
                    Reject Course
                  </button>
                  <button
                    onClick={async () => {
                      await handleApprove(selectedCourse.id)
                      setSelectedCourse(null)
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#198754',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#157347'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#198754'
                    }}
                  >
                    <i className="bi bi-check-circle" style={{ marginRight: '0.5rem' }}></i>
                    Approve Course
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2001,
              padding: '2rem'
            }}
            onClick={() => {
              setShowRejectModal(false)
              setCourseToReject(null)
              setRejectionReason('')
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                Reject Course
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#6c757d', marginBottom: '1rem' }}>
                Please provide a reason for rejecting this course (optional):
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  marginBottom: '1.5rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setCourseToReject(null)
                    setRejectionReason('')
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#6c757d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#dc3545',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseModeration

