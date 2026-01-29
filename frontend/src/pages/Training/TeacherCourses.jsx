import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import PageHeader from '../../components/sections/PageHeader'
import { getCurrentUser, isAuthenticated, isTeacher } from '../../utils/auth'
import { getTeacherProfile } from '../../utils/teacherProfile'
import { coursesData } from './coursesData'
import { 
  saveTeacherCourse, 
  assignInstructorToCourse, 
  getCoursesByTeacher, 
  getCoursesAssignedToTeacher,
  removeInstructorFromCourse,
  deleteTeacherCourse,
  getAllCourses,
  getCourseInstructor
} from '../../utils/courseManagement'
import ChatWidget from '../../components/ChatWidget'

const getInitialCourseForm = () => ({
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

function TeacherCourses() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('select') // 'select', 'create', or 'created'
  const [selectedCourses, setSelectedCourses] = useState([])
  const [myCreatedCourses, setMyCreatedCourses] = useState([])
  const [myAssignedCourses, setMyAssignedCourses] = useState([])
  const [teacherInfo, setTeacherInfo] = useState(null)
  const [allCourses, setAllCourses] = useState([]) // Store all courses from API
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState(null)

  // Course creation form state
  const [courseForm, setCourseForm] = useState(() => getInitialCourseForm())

  // Section form state
  const [sectionForm, setSectionForm] = useState({
    title: '',
    items: []
  })

  // Item form state (for topics covered in sessions)
  const [itemForm, setItemForm] = useState({
    title: '',
    duration: '',
    type: 'session' // Changed from 'video' to 'session'
  })

  const resetCourseBuilder = () => {
    setCourseForm(getInitialCourseForm())
    setSectionForm({ title: '', items: [] })
    setItemForm({ title: '', duration: '', type: 'session' })
  }

  const stopEditingCourse = () => {
    setIsEditingCourse(false)
    setEditingCourseId(null)
  }

  const startEditingCourse = (course) => {
    if (!course) return

    setActiveTab('create')
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
    setIsEditingCourse(true)
    setEditingCourseId(course.id)
    setSectionForm({ title: '', items: [] })
    setItemForm({ title: '', duration: '', type: 'session' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    resetCourseBuilder()
    stopEditingCourse()
  }

  useEffect(() => {
    if (!isAuthenticated() || !isTeacher()) {
      navigate('/training/auth')
      return
    }

    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/training/auth')
      return
    }

    // Load teacher data and courses asynchronously - load in parallel for faster performance
    const loadTeacherData = async () => {
      const userId = currentUser.id || '1'
      
      // Load all data in parallel for faster loading
      const [profile, created, assignedIds, allCoursesData] = await Promise.all([
        getTeacherProfile(userId),
        getCoursesByTeacher(userId),
        getCoursesAssignedToTeacher(userId),
        getAllCourses() // Load all courses in parallel
      ])
      
      const teacherName = profile?.fullName || currentUser.name || 'Teacher'
      
      // Update state immediately as data arrives
      setTeacherInfo({
        id: userId,
        name: teacherName
      })
      
      setMyCreatedCourses(Array.isArray(created) ? created : [])
      setMyAssignedCourses(Array.isArray(assignedIds) ? assignedIds : [])
      setAllCourses(Array.isArray(allCoursesData) ? allCoursesData : [])
    }

    loadTeacherData()
}, [navigate])

useEffect(() => {
  if (!teacherInfo?.id) return
  const params = new URLSearchParams(location.search)
  const editCourseParam = params.get('editCourse')
  if (!editCourseParam) return
  const courseId = parseInt(editCourseParam, 10)
  if (!courseId) {
    navigate('/training/teacher-courses', { replace: true })
    return
  }
  const targetCourse = myCreatedCourses.find(course => course.id === courseId)
  if (targetCourse && editingCourseId !== targetCourse.id) {
    startEditingCourse(targetCourse)
    navigate('/training/teacher-courses', { replace: true })
  } else if (myCreatedCourses.length > 0 && !targetCourse) {
    alert('Course not found or you do not have permission to edit it.')
    navigate('/training/teacher-courses', { replace: true })
  }
}, [location.search, myCreatedCourses, teacherInfo, navigate, editingCourseId])

useEffect(() => {
  const params = new URLSearchParams(location.search)
  const tab = params.get('tab')
  const allowedTabs = ['select', 'create', 'created']
  if (tab && allowedTabs.includes(tab) && tab !== activeTab) {
    setActiveTab(tab)
  }
}, [location.search, activeTab])

  const handleSelectCourse = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(prev => prev.filter(id => id !== courseId))
    } else {
      setSelectedCourses(prev => [...prev, courseId])
    }
  }

  const handleAssignSelectedCourses = async () => {
    if (selectedCourses.length === 0) {
      alert('Please select at least one course')
      return
    }

    // Assign teacher to all selected courses
    const assignmentResults = await Promise.all(
      selectedCourses.map(courseId => 
        assignInstructorToCourse(courseId, teacherInfo.id, teacherInfo.name)
      )
    )
    
    // Check if any assignments failed
    const failedAssignments = assignmentResults.filter(result => !result.success)
    if (failedAssignments.length > 0) {
      const errorMessages = failedAssignments.map(f => f.message || 'Unknown error').join('\n')
      alert(`Failed to assign ${failedAssignments.length} course(s):\n\n${errorMessages}`)
      return
    }

    setSuccessMessage(`Successfully assigned as instructor to ${selectedCourses.length} course(s)`)
    setShowSuccess(true)
    setSelectedCourses([])
    
    // Reload assigned courses and allCourses in parallel for faster update
    const [assignedIds, courses] = await Promise.all([
      getCoursesAssignedToTeacher(teacherInfo.id),
      getAllCourses()
    ])
    setMyAssignedCourses(Array.isArray(assignedIds) ? assignedIds : [])
    setAllCourses(Array.isArray(courses) ? courses : [])

    setTimeout(() => setShowSuccess(false), 2000)
  }

  const handleRemoveAssignment = async (courseId) => {
    if (window.confirm('Are you sure you want to remove yourself as instructor from this course?')) {
      removeInstructorFromCourse(courseId)
      // Reload assigned courses and allCourses in parallel for faster update
      const [assignedIds, courses] = await Promise.all([
        getCoursesAssignedToTeacher(teacherInfo.id),
        getAllCourses()
      ])
      setMyAssignedCourses(Array.isArray(assignedIds) ? assignedIds : [])
      setAllCourses(Array.isArray(courses) ? courses : [])
      setSuccessMessage('Removed as instructor successfully')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteTeacherCourse(courseId)
      if (isEditingCourse && editingCourseId === courseId) {
        handleCancelEdit()
      }
      // Reload created courses and allCourses in parallel for faster update
      const [created, courses] = await Promise.all([
        getCoursesByTeacher(teacherInfo.id),
        getAllCourses()
      ])
      setMyCreatedCourses(Array.isArray(created) ? created : [])
      setAllCourses(Array.isArray(courses) ? courses : [])
      setSuccessMessage('Course deleted successfully')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  // Course creation handlers
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
    const newLearnings = [...courseForm.learnings]
    newLearnings[index] = value
    setCourseForm(prev => ({ ...prev, learnings: newLearnings }))
  }

  const addLearning = () => {
    setCourseForm(prev => ({ ...prev, learnings: [...prev.learnings, ''] }))
  }

  const removeLearning = (index) => {
    const newLearnings = courseForm.learnings.filter((_, i) => i !== index)
    setCourseForm(prev => ({ ...prev, learnings: newLearnings }))
  }

  const handleRequirementChange = (index, value) => {
    const newRequirements = [...courseForm.requirements]
    newRequirements[index] = value
    setCourseForm(prev => ({ ...prev, requirements: newRequirements }))
  }

  const addRequirement = () => {
    setCourseForm(prev => ({ ...prev, requirements: [...prev.requirements, ''] }))
  }

  const removeRequirement = (index) => {
    const newRequirements = courseForm.requirements.filter((_, i) => i !== index)
    setCourseForm(prev => ({ ...prev, requirements: newRequirements }))
  }

  // Section handlers
  const handleSectionFormChange = (field, value) => {
    setSectionForm(prev => ({ ...prev, [field]: value }))
  }

  const addItemToSection = () => {
    if (itemForm.title && itemForm.duration) {
      setSectionForm(prev => ({
        ...prev,
        items: [...prev.items, { ...itemForm }]
      }))
      setItemForm({ title: '', duration: '', type: 'session' })
    }
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
    
    const lectures = sectionForm.items.length
    const totalMinutes = sectionForm.items.reduce((sum, item) => {
      const mins = parseInt(item.duration) || 0
      return sum + mins
    }, 0)
    const duration = `${totalMinutes}min`

    const newSection = {
      title: sectionForm.title,
      lectures,
      duration,
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

  const handleSaveCourse = async () => {
  if (!teacherInfo) {
    alert('Unable to save course. Please wait for your profile to load and try again.')
    return
  }
    // Validation
    if (!courseForm.title || !courseForm.description || !courseForm.category) {
      alert('Please fill in all required fields (Title, Description, Category)')
      return
    }

    if (!courseForm.image) {
      alert('Please upload a course image')
      return
    }

    const validLearnings = courseForm.learnings.filter(l => l.trim() !== '')
    if (validLearnings.length === 0) {
      alert('Please add at least one learning outcome (What you\'ll learn)')
      return
    }

    if (courseForm.sections.length === 0) {
      alert('Please add at least one module/section to the course')
      return
    }

    // Validate that each section has at least one lecture
    const sectionsWithoutLectures = courseForm.sections.filter(section => {
      const itemCount = section.items && Array.isArray(section.items) ? section.items.length : 0
      return itemCount === 0
    })
    
    if (sectionsWithoutLectures.length > 0) {
      alert('Each section must have at least one lecture/topic. Please add lectures to all sections before saving.')
      return
    }

  const isUpdating = isEditingCourse && editingCourseId
  // When updating, use the editingCourseId (should be MongoDB ObjectId for database courses)
  // When creating, don't set an ID (let backend generate it)
  const courseId = isUpdating ? editingCourseId : null
  const existingCourse = isUpdating ? myCreatedCourses.find(c => {
    // Compare as strings to handle both numeric and ObjectId formats
    return String(c.id) === String(courseId) || String(c._id) === String(courseId)
  }) : null

    const courseData = {
      ...courseForm,
    // Only include id if updating (and it's a MongoDB ObjectId)
    ...(isUpdating && courseId ? { id: courseId } : {}),
      createdBy: teacherInfo.id,
    createdByRole: 'teacher',
      teacherName: teacherInfo.name,
      teacher: teacherInfo.name,
    rating: existingCourse?.rating ?? 0,
    ratingCount: existingCourse?.ratingCount ?? 0,
      totalLectures: calculateTotalLectures(),
      totalDuration: calculateTotalDuration(),
      lastUpdated: new Date().toISOString().split('T')[0],
      price: parseFloat(courseForm.price) || 0,
      originalPrice: parseFloat(courseForm.originalPrice) || parseFloat(courseForm.price) || 0,
      learnings: courseForm.learnings.filter(l => l.trim() !== ''),
      requirements: courseForm.requirements.filter(r => r.trim() !== ''),
    badge: courseForm.badge || null,
    status: existingCourse?.status || 'pending'
    }

    const result = await saveTeacherCourse(courseData)
    if (result.success) {
    setSuccessMessage(
      isUpdating
        ? 'Course updated successfully.'
        : 'Course submitted successfully! It is now pending admin approval.'
    )
      setShowSuccess(true)
    resetCourseBuilder()
    if (isUpdating) {
      stopEditingCourse()
      // Switch back to "My Created Courses" tab after updating
      setActiveTab('created')
    } else {
      // Navigate to "My Created Courses" tab after creating a new course
      setActiveTab('created')
    }

      // Reload created courses and allCourses in parallel for faster update
      const [created, courses] = await Promise.all([
        getCoursesByTeacher(teacherInfo.id),
        getAllCourses()
      ])
      setMyCreatedCourses(Array.isArray(created) ? created : [])
      setAllCourses(Array.isArray(courses) ? courses : [])

      setTimeout(() => setShowSuccess(false), 2000)
    } else {
      alert('Failed to save course: ' + (result.message || 'Unknown error'))
    }
  }

  // Note: allCourses is now loaded in parallel with other data in loadTeacherData
  // This useEffect is kept for cases where we need to refresh allCourses independently
  useEffect(() => {
    // Only load if not already loaded (to avoid duplicate requests)
    if (allCourses.length === 0 && teacherInfo?.id) {
      const loadAllCourses = async () => {
        try {
          const courses = await getAllCourses()
          setAllCourses(Array.isArray(courses) ? courses : [])
        } catch (error) {
          console.error('Error loading courses:', error)
          setAllCourses([])
        }
      }
      loadAllCourses()
    }
  }, [teacherInfo?.id])

  // Get all available courses (default courses + teacher-created + moderator-created)
  // Filter courses for selection - include courses that teachers can become instructors for
  const availableCourses = useMemo(() => {
    // Merge default courses with teacher/moderator-created courses
    const allCoursesMap = new Map()
    
    // Add default courses first
    coursesData.forEach(course => {
      allCoursesMap.set(course.id, course)
    })
    
    // Add teacher/moderator-created courses (override default if same ID, add new if different)
    // Include all approved courses so teachers can choose to become instructors for any course
    if (Array.isArray(allCourses)) {
      allCourses.forEach(course => {
        allCoursesMap.set(course.id, course)
      })
    }
    
    // Convert map to array
    const mergedCourses = Array.from(allCoursesMap.values())
    
    // Filter out courses that the teacher already created (those are in "Created" tab)
    const createdCourseIds = myCreatedCourses.map(c => c.id)
    const filtered = mergedCourses.filter(course => {
      // Exclude courses the teacher created (they manage these in the "Created" tab)
      if (createdCourseIds.includes(course.id)) {
        return false
      }
      
      // Filter by search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return course.title.toLowerCase().includes(query) || 
               (course.category && course.category.toLowerCase().includes(query)) ||
               (course.description && course.description.toLowerCase().includes(query))
      }
      
      return true
    })
    
    return filtered
  }, [allCourses, myCreatedCourses, searchQuery])

  const categories = [...new Set(coursesData.map(c => c.category))].sort()

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        <PageHeader
          title="Manage My Courses"
          description="Select existing courses to teach or create your own courses"
        />

        {showSuccess && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #c3e6cb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{successMessage}</span>
            <button
              onClick={() => setShowSuccess(false)}
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

        {/* Tabs */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e9ecef' }}>
            <button
              onClick={() => setActiveTab('select')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'select' ? '3px solid #c85716' : '3px solid transparent',
                color: activeTab === 'select' ? '#c85716' : '#6c757d',
                fontWeight: activeTab === 'select' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Select Existing Courses
            </button>
            <button
              onClick={() => setActiveTab('create')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'create' ? '3px solid #c85716' : '3px solid transparent',
                color: activeTab === 'create' ? '#c85716' : '#6c757d',
                fontWeight: activeTab === 'create' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Create New Course
            </button>
            <button
              onClick={() => setActiveTab('created')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'created' ? '3px solid #c85716' : '3px solid transparent',
                color: activeTab === 'created' ? '#c85716' : '#6c757d',
                fontWeight: activeTab === 'created' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              My Created Courses
            </button>
          </div>
        </div>

        {/* My Courses Summary */}
        {(myCreatedCourses.length > 0 || myAssignedCourses.length > 0) && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
              My Courses
            </h3>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Created: </span>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#c85716' }}>
                  {myCreatedCourses.length}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Assigned: </span>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#c85716' }}>
                  {myAssignedCourses.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Select Existing Courses Tab */}
        {activeTab === 'select' && (
          <div>
            {/* Instructions */}
            <div style={{
              backgroundColor: '#e7f3ff',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #b3d9ff'
            }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#004085' }}>
                <i className="bi bi-info-circle" style={{ marginRight: '0.5rem' }}></i>
                Select courses you want to teach by checking the "Select to teach" box, then click "Assign Me as Instructor" at the bottom. Your name will appear as the instructor for these courses in the catalog.
              </p>
            </div>
            {/* Search */}
            <div style={{ marginBottom: '2rem' }}>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  padding: '12px 15px',
                  fontSize: '1rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            {/* Course List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {availableCourses.map(course => {
                const isSelected = selectedCourses.includes(course.id)
                // Check if course is assigned (compare as strings to handle both numeric and ObjectId IDs)
                const isAssigned = Array.isArray(myAssignedCourses) && myAssignedCourses.some(id => String(id) === String(course.id))
                
                return (
                  <div
                    key={course.id}
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#110a06', marginBottom: '0.5rem' }}>
                        {course.title}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                        {course.category} • {course.level}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#495057', margin: 0 }}>
                        {course.description.substring(0, 150)}...
                      </p>
                      {isAssigned && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '0.5rem',
                          padding: '4px 8px',
                          backgroundColor: '#d4edda',
                          color: '#155724',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          You are the instructor
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {isAssigned ? (
                        <>
                          <span style={{
                            padding: '8px 16px',
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            border: '1px solid #c3e6cb',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>
                            Assigned
                          </span>
                          <button
                            onClick={() => handleRemoveAssignment(course.id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#dc3545',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '500'
                            }}
                          >
                            Remove
                          </button>
                          <Link
                            to={`/training/course/${course.id}`}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#f8f9fa',
                              color: '#110a06',
                              textDecoration: 'none',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              fontWeight: '500'
                            }}
                          >
                            View
                          </Link>
                        </>
                      ) : (
                        <>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#110a06' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectCourse(course.id)}
                              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span>Select to teach</span>
                          </label>
                          <Link
                            to={`/training/course/${course.id}`}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#f8f9fa',
                              color: '#110a06',
                              textDecoration: 'none',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              fontWeight: '500'
                            }}
                          >
                            View
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {selectedCourses.length > 0 && (
              <div style={{
                position: 'sticky',
                bottom: '20px',
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '1rem', color: '#110a06' }}>
                  {selectedCourses.length} course(s) selected
                </span>
                <button
                  onClick={handleAssignSelectedCourses}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#c85716',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Assign Me as Instructor
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create New Course Tab */}
        {activeTab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
            {/* Basic Information */}
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

            {/* What You'll Learn */}
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

            {/* Requirements */}
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

            {/* Course Content Sections */}
            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1.5rem' }}>
                Course Content <span style={{ color: 'black' }}>*</span>
              </h3>

              {/* Add Section Form */}
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
                  
                  {/* Add Topics */}
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

                  {/* Section Topics List */}
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

              {/* Existing Sections */}
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

            {/* Save Button */}
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
                onClick={handleSaveCourse}
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

        {/* My Created Courses Tab */}
        {activeTab === 'created' && (
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1.5rem' }}>
              My Created Courses
            </h3>
            {myCreatedCourses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myCreatedCourses.map(course => (
                  <div
                    key={course.id}
                    style={{
                      padding: '1.5rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1.5rem'
                    }}
                  >
                    {/* Course Thumbnail */}
                    {course.image && (
                      <img
                        src={course.image}
                        alt={course.title || 'Course'}
                        style={{
                          width: '120px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#110a06', margin: 0 }}>
                          {course.title || course.courseTitle || 'Untitled Course'}
                        </h4>
                        {course.status === 'pending' && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: '#fff3cd',
                            color: '#856404'
                          }}>
                            <i className="bi bi-clock-history" style={{ marginRight: '0.25rem' }}></i>
                            Pending Approval
                          </span>
                        )}
                        {course.status === 'approved' && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: '#d1e7dd',
                            color: '#0f5132'
                          }}>
                            <i className="bi bi-check-circle" style={{ marginRight: '0.25rem' }}></i>
                            Approved
                          </span>
                        )}
                        {course.status === 'rejected' && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: '#f8d7da',
                            color: '#721c24'
                          }}>
                            <i className="bi bi-x-circle" style={{ marginRight: '0.25rem' }}></i>
                            Rejected
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
                        {course.category || (Array.isArray(course.courseCategories) && course.courseCategories.length > 0 ? course.courseCategories[0] : '')} • {course.level || (Array.isArray(course.courseLevel) && course.courseLevel.length > 0 ? course.courseLevel[0] : 'Beginner')}
                      </p>
                      {course.status === 'rejected' && course.rejectionReason && (
                        <p style={{ fontSize: '0.85rem', color: '#dc3545', marginTop: '0.5rem', marginBottom: 0 }}>
                          <strong>Reason:</strong> {course.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link
                        to={`/training/course/${course.id}`}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#c85716',
                          color: '#ffffff',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => startEditingCourse(course)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#0d6efd',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6c757d', fontSize: '0.95rem', margin: 0 }}>
                You haven't created any courses yet. Head over to the "Create New Course" tab to build your first one.
              </p>
            )}
          </div>
        )}
      </div>
      <ChatWidget userType="teacher" />
    </div>
  )
}

export default TeacherCourses

