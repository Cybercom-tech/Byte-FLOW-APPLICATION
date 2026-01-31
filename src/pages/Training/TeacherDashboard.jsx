import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageHeader from '../../components/sections/PageHeader'
import { getCurrentUser, isAuthenticated, isTeacher } from '../../utils/auth'
import { getTeacherProfile } from '../../utils/teacherProfile'
import { coursesData } from './coursesData'
import { getAllCourses, getCoursesByTeacher } from '../../utils/courseManagement'
import {
  getTeacherCourses,
  getCourseStudents,
  getZoomLink,
  setZoomLink,
  sendZoomLinkToStudents,
  sendMessageToStudents,
  getStudentMessages,
  getTeacherMessages,
  markTeacherMessageAsRead,
  getCourseTeacher,
  getStudentProgressForTeacher,
  toggleSectionForTeacher
} from '../../utils/studentTeacherManagement'
import ChatWidget from '../../components/ChatWidget'

function TeacherDashboard() {
  const navigate = useNavigate()
  const [teacherInfo, setTeacherInfo] = useState(null)
  const [myCourses, setMyCourses] = useState([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseStudents, setCourseStudents] = useState([])
  const [studentTab, setStudentTab] = useState('active')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [zoomLink, setZoomLinkValue] = useState('')
  const [meetingId, setMeetingId] = useState('')
  const [password, setPassword] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [activeTab, setActiveTab] = useState('students') // 'students' or 'messages'
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null) // { studentId, name }
  const [completedSections, setCompletedSections] = useState([])

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isAuthenticated() || !isTeacher()) {
        navigate('/training/auth')
        return
      }

      const currentUser = getCurrentUser()
      if (!currentUser) {
        navigate('/training/auth')
        return
      }

      const userId = currentUser.id || '1'
      
      // CRITICAL FIX: Set teacherInfo IMMEDIATELY so UI renders right away
      // Don't wait for API calls - show the dashboard first
      setTeacherInfo({
        id: userId,
        name: currentUser.name || 'Teacher'
      })

      try {
        // Add timeout wrapper to prevent hanging forever (increased to 15s)
        const withTimeout = (promise, timeoutMs = 15000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
            )
          ])
        }
        
        // Run all API calls in parallel with timeout protection using allSettled
        const results = await Promise.allSettled([
          withTimeout(getTeacherProfile(userId)),
          withTimeout(getTeacherCourses(userId)),
          withTimeout(getAllCourses())
        ])
        
        const [profileResult, courseIdsResult, allCoursesResult] = results
        
        // Update teacher name if we got profile data
        if (profileResult.status === 'fulfilled' && profileResult.value?.fullName) {
          setTeacherInfo({
            id: userId,
            name: profileResult.value.fullName
          })
        }
        
        // Get values with fallbacks (preserve existing data on error)
        const courseIds = courseIdsResult.status === 'fulfilled' ? courseIdsResult.value : null
        const allCoursesData = allCoursesResult.status === 'fulfilled' ? allCoursesResult.value : null

        // Only update courses if we got valid data
        if (courseIds !== null && allCoursesData !== null) {
          // Load teacher's courses (includes both created AND assigned courses)
          const allCourses = [...coursesData, ...(Array.isArray(allCoursesData) ? allCoursesData : [])]
          const courseIdsArray = Array.isArray(courseIds) ? courseIds.map(id => String(id)) : []
          // Filter courses where ID matches (handle both numeric and string IDs)
          const teacherCourses = allCourses.filter(c => {
            const courseIdStr = String(c.id)
            return courseIdsArray.includes(courseIdStr)
          })
          setMyCourses(teacherCourses)

          // Select first course by default
          if (teacherCourses.length > 0) {
            handleCourseSelect(String(teacherCourses[0].id))
          }
        } else {
          // Log warnings but don't clear existing data
          if (courseIdsResult.status === 'rejected') {
            console.warn('Error loading teacher courses, preserving existing data:', courseIdsResult.reason?.message || courseIdsResult.reason)
          }
          if (allCoursesResult.status === 'rejected') {
            console.warn('Error loading all courses, preserving existing data:', allCoursesResult.reason?.message || allCoursesResult.reason)
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Don't reset to empty arrays - preserve existing data
      } finally {
        setIsLoadingCourses(false)
      }
    }

    loadDashboardData()
  }, [navigate])

  // Load completed sections when student is selected for progress management
  useEffect(() => {
    const loadCompletedSections = async () => {
      if (selectedStudentForProgress && selectedCourse) {
        try {
          // Use teacher-specific function to get student progress
          const progress = await getStudentProgressForTeacher(selectedCourse, selectedStudentForProgress.studentId)
          if (progress && Array.isArray(progress.completedSections)) {
            setCompletedSections(progress.completedSections)
          }
          // If progress is null/undefined, preserve existing data
        } catch (error) {
          console.warn('Error loading completed sections, preserving existing data:', error.message || error)
          // Don't reset on error - preserve existing data
        }
      } else {
        setCompletedSections([])
      }
    }
    loadCompletedSections()
  }, [selectedStudentForProgress, selectedCourse])

  const handleCourseSelect = async (courseId) => {
    // Ensure courseId is a string for consistency (handles both MongoDB ObjectIds and numeric IDs)
    const courseIdStr = String(courseId)
    setSelectedCourse(courseIdStr)
    try {
      // PERFORMANCE FIX: Run both API calls in parallel using allSettled
      const [studentsResult, zoomResult] = await Promise.allSettled([
        getCourseStudents(courseIdStr),
        getZoomLink(courseIdStr)
      ])
      
      // Handle students result - preserve existing on error
      if (studentsResult.status === 'fulfilled') {
        const allStudents = studentsResult.value
        const studentsArray = Array.isArray(allStudents) ? allStudents : []
        // Separate active and completed students
        const activeStudentsArr = studentsArray.filter(s => !s.isCompleted)
        const completedStudentsArr = studentsArray.filter(s => s.isCompleted)
        // Show active students first, then completed
        setCourseStudents([...activeStudentsArr, ...completedStudentsArr])
        setStudentTab('active')
        setSelectedStudents([])
      } else {
        console.warn('Error loading students, preserving existing data:', studentsResult.reason?.message || studentsResult.reason)
      }
      
      // Handle zoom data result - preserve existing on error
      if (zoomResult.status === 'fulfilled') {
        const zoomData = zoomResult.value
        if (zoomData) {
          setZoomLinkValue(zoomData.zoomLink || '')
          setMeetingId(zoomData.meetingId || '')
          setPassword(zoomData.password || '')
          setMeetingDate(zoomData.date || '')
          setMeetingTime(zoomData.time || '')
        } else {
          setZoomLinkValue('')
          setMeetingId('')
          setPassword('')
          setMeetingDate('')
          setMeetingTime('')
        }
      } else {
        console.warn('Error loading zoom data, preserving existing data:', zoomResult.reason?.message || zoomResult.reason)
      }
    } catch (error) {
      console.error('Error loading course data:', error)
      // Don't reset data on error - preserve existing
    }
  }

  const handleStudentToggle = (studentId) => {
    const student = courseStudents.find(s => s.studentId === studentId)
    if (!student || student.isCompleted || (student.progress || 0) >= 100) {
      return
    }

    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    } else {
      setSelectedStudents(prev => [...prev, studentId])
    }
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === activeStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(activeStudents.map(s => s.studentId))
    }
  }

  const activeStudents = useMemo(() =>
    courseStudents.filter(student => !(student.isCompleted || (student.progress || 0) >= 100)),
    [courseStudents]
  )

  const completedStudents = useMemo(() =>
    courseStudents.filter(student => student.isCompleted || (student.progress || 0) >= 100),
    [courseStudents]
  )

  const currentStudents = studentTab === 'active' ? activeStudents : completedStudents

  const handleStudentTabChange = (tab) => {
    setStudentTab(tab)
    setSelectedStudents([])
  }

  const validateZoomLink = (link) => {
    if (!link.trim()) return 'Zoom link is required'
    // Check if it's a valid URL or Zoom link pattern
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
    const zoomPattern = /zoom\.us/i
    if (!urlPattern.test(link) && !zoomPattern.test(link)) {
      return 'Please enter a valid Zoom link or URL'
    }
    return null
  }

  const validateDate = (date) => {
    if (!date) return 'Meeting date is required'
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      return 'Meeting date cannot be in the past'
    }
    return null
  }

  const validateTime = (time) => {
    if (!time) return 'Meeting time is required'
    return null
  }

  const handleSendZoomLink = async () => {
    if (!selectedCourse) {
      alert('Please select a course first')
      return
    }

    const linkError = validateZoomLink(zoomLink)
    if (linkError) {
      alert(linkError)
      return
    }

    // Validate date (required)
    const dateError = validateDate(meetingDate)
    if (dateError) {
      alert(dateError)
      return
    }

    // Validate time (required)
    const timeError = validateTime(meetingTime)
    if (timeError) {
      alert(timeError)
      return
    }

    if (selectedStudents.length === 0) {
      alert('Please select at least one student')
      return
    }

    try {
      const result = await sendZoomLinkToStudents(
        teacherInfo.id,
        selectedCourse,
        selectedStudents,
        zoomLink,
        meetingId,
        password,
        meetingDate,
        meetingTime,
        teacherInfo.name
      )

      if (result.success) {
        setSuccessMessage(`Zoom link sent to ${selectedStudents.length} student(s)!`)
        setShowSuccess(true)
        setSelectedStudents([])
        setTimeout(() => setShowSuccess(false), 2000)
      } else {
        alert(result.message || 'Failed to send Zoom link')
      }
    } catch (error) {
      console.error('Error sending Zoom link:', error)
      alert('Failed to send Zoom link: ' + (error.message || 'Unknown error'))
    }
  }
  const handleSendMessage = async () => {
    if (!selectedCourse) {
      alert('Please select a course first')
      return
    }

    if (!message.trim()) {
      alert('Please enter a message')
      return
    }

    if (message.trim().length < 5) {
      alert('Message must be at least 5 characters long')
      return
    }

    const studentIds = selectedStudents.length > 0 
      ? selectedStudents 
      : activeStudents.map(s => s.studentId)

    if (studentIds.length === 0) {
      alert('No students to send message to')
      return
    }

    try {
      const result = await sendMessageToStudents(
        teacherInfo.id,
        selectedCourse,
        studentIds,
        message,
        messageType,
        '', // date
        '', // time
        teacherInfo.name
      )

      if (result.success) {
        setSuccessMessage(`Message sent to ${studentIds.length} student(s)!`)
        setShowSuccess(true)
        setMessage('')
        setSelectedStudents([])
        setTimeout(() => setShowSuccess(false), 2000)
      } else {
        alert(result.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message: ' + (error.message || 'Unknown error'))
    }
  }

  if (!teacherInfo) {
    return (
      <div style={{ paddingTop: '150px', textAlign: 'center', minHeight: '50vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  const selectedCourseData = myCourses.find(c => String(c.id) === String(selectedCourse))

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        <PageHeader
          title="Teacher Dashboard"
          description="Manage your students, send Zoom links, and communicate with your class"
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

        {/* Course Selection */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          marginBottom: '2rem'
        }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#110a06' }}>
            Select Course
          </label>
          {isLoadingCourses ? (
            <div style={{ padding: '10px', color: '#6c757d' }}>
              <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '8px' }}></i>
              Loading courses...
            </div>
          ) : (
            <select
              value={selectedCourse || ''}
              onChange={(e) => {
                const courseId = e.target.value
                // Handle both string (MongoDB ObjectId) and numeric IDs
                handleCourseSelect(courseId)
              }}
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '10px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="">-- Select a course --</option>
              {myCourses.map(course => (
                <option key={course.id} value={String(course.id)}>
                  {course.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedCourse && (
          <>
            {/* Tabs */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e9ecef' }}>
                <button
                  onClick={() => setActiveTab('students')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'students' ? '3px solid #c85716' : '3px solid transparent',
                    color: activeTab === 'students' ? '#c85716' : '#6c757d',
                    fontWeight: activeTab === 'students' ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Manage Students
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'messages' ? '3px solid #c85716' : '3px solid transparent',
                    color: activeTab === 'messages' ? '#c85716' : '#6c757d',
                    fontWeight: activeTab === 'messages' ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Broadcast Message
                </button>
              </div>
            </div>

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="row g-4">
                {/* Students List */}
                <div className="col-lg-8">
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    marginBottom: '2rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', margin: 0 }}>
                          Enrolled Students ({courseStudents.length})
                        </h3>
                        {completedStudents.length > 0 && (
                          <p style={{ 
                            fontSize: '0.85rem', 
                            color: '#6c757d',
                            margin: '0.25rem 0 0 0'
                          }}>
                            {activeStudents.length} active, {completedStudents.length} completed
                          </p>
                        )}
                      </div>
                      {studentTab === 'active' && activeStudents.length > 0 && (
                        <button
                          onClick={handleSelectAll}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f8f9fa',
                            color: '#110a06',
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          {selectedStudents.length === activeStudents.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Student tabs */}
                    {courseStudents.length > 0 && (
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                          onClick={() => handleStudentTabChange('active')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: studentTab === 'active' ? '#c85716' : '#f8f9fa',
                            color: studentTab === 'active' ? '#ffffff' : '#6c757d',
                            border: '1px solid',
                            borderColor: studentTab === 'active' ? '#c85716' : '#dee2e6',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: studentTab === 'active' ? '600' : '400'
                          }}
                        >
                          Active Students ({activeStudents.length})
                        </button>
                        <button
                          onClick={() => handleStudentTabChange('completed')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: studentTab === 'completed' ? '#198754' : '#f8f9fa',
                            color: studentTab === 'completed' ? '#ffffff' : '#6c757d',
                            border: '1px solid',
                            borderColor: studentTab === 'completed' ? '#198754' : '#dee2e6',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: studentTab === 'completed' ? '600' : '400'
                          }}
                        >
                          Completed ({completedStudents.length})
                        </button>
                      </div>
                    )}

                    {currentStudents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                        <i className="bi bi-people" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                        <p>{studentTab === 'active' ? 'No active students in this course yet.' : 'No completed students yet.'}</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {currentStudents.map(student => {
                          const isCompleted = student.isCompleted || (student.progress || 0) >= 100
                          const isSelected = selectedStudents.includes(student.studentId)
                          return (
                            <div
                              key={student.studentId}
                              style={{
                                padding: '1rem',
                                backgroundColor: isSelected 
                                  ? '#fff3cd' 
                                  : isCompleted 
                                    ? '#f8fff9' 
                                    : '#f8f9fa',
                                borderRadius: '6px',
                                border: `1px solid ${
                                  isSelected 
                                    ? '#c85716' 
                                    : isCompleted 
                                      ? '#198754' 
                                      : '#e9ecef'
                                }`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: isCompleted ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative'
                              }}
                              onClick={() => handleStudentToggle(student.studentId)}
                            >
                              {isCompleted && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  padding: '4px 8px',
                                  backgroundColor: '#198754',
                                  color: '#ffffff',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <i className="bi bi-check-circle-fill"></i>
                                  Completed
                                </div>
                              )}
                              {studentTab === 'active' && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleStudentToggle(student.studentId)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#110a06', marginBottom: '0.25rem' }}>
                                  {student.name}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                  {student.email}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                  Enrolled: {new Date(student.enrolledDate).toLocaleDateString()}
                                </div>
                                <div style={{ 
                                  fontSize: '0.85rem', 
                                  color: isCompleted ? '#198754' : '#c85716', 
                                  marginTop: '0.25rem', 
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  {isCompleted && <i className="bi bi-check-circle-fill"></i>}
                                  Progress: {student.progress || 0}%
                                </div>
                              </div>
                              {!isCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedStudentForProgress({ studentId: student.studentId, name: student.name })
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#c85716',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  Manage Progress
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Student Progress Management */}
                  {selectedStudentForProgress && selectedCourse && (() => {
                    const course = myCourses.find(c => String(c.id) === String(selectedCourse))
                    const totalSections = course?.sections?.length || 0
                    
                    return (
                      <div style={{
                        backgroundColor: '#ffffff',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        marginTop: '2rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', margin: 0 }}>
                            Progress Management: {selectedStudentForProgress.name}
                          </h3>
                          <button
                            onClick={() => setSelectedStudentForProgress(null)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#e9ecef',
                              color: '#110a06',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Close
                          </button>
                        </div>

                        {course && course.sections ? (
                          <>
                            <div style={{ 
                              padding: '1rem', 
                              backgroundColor: '#f8f9fa', 
                              borderRadius: '6px', 
                              marginBottom: '1.5rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                                  Completed: {completedSections.length} of {totalSections} sections
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#c85716' }}>
                                  Progress: {Math.round((completedSections.length / totalSections) * 100)}%
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {course.sections.map((section, index) => {
                                const isCompleted = completedSections.includes(index)
                                return (
                                  <div
                                    key={index}
                                    style={{
                                      padding: '1rem',
                                      backgroundColor: isCompleted ? '#d4edda' : '#ffffff',
                                      border: `1px solid ${isCompleted ? '#198754' : '#e9ecef'}`,
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '1rem'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={async (e) => {
                                        const isChecked = e.target.checked
                                        
                                        // OPTIMISTIC UPDATE: Update UI immediately for instant feedback
                                        const optimisticSections = isChecked
                                          ? [...completedSections, index].sort((a, b) => a - b)
                                          : completedSections.filter(idx => idx !== index)
                                        setCompletedSections(optimisticSections)
                                        
                                        try {
                                          // Single API call to update everything
                                          const result = await toggleSectionForTeacher(
                                            selectedCourse,
                                            selectedStudentForProgress.studentId,
                                            index,
                                            isChecked,
                                            completedSections,
                                            totalSections
                                          )
                                          
                                          if (result.success) {
                                            // Update with server-confirmed data
                                            setCompletedSections(result.completedSections)
                                            // Refresh students list in background (non-blocking)
                                            handleCourseSelect(selectedCourse)
                                          } else {
                                            // Revert on failure
                                            setCompletedSections(completedSections)
                                            console.error('Failed to update section:', result.message)
                                          }
                                        } catch (error) {
                                          // Revert on error
                                          setCompletedSections(completedSections)
                                          console.error('Error updating section completion:', error)
                                        }
                                      }}
                                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: '600', color: '#110a06', marginBottom: '0.25rem' }}>
                                        Section {index + 1}: {section.title}
                                      </div>
                                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                        {section.lectures} {section.lectures === 1 ? 'session' : 'sessions'} • {section.duration}
                                      </div>
                                    </div>
                                    {isCompleted && (
                                      <span style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#198754',
                                        color: '#ffffff',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                      }}>
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                            <p>Course sections not available.</p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Zoom Link Management */}
                <div className="col-lg-4">
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    position: 'sticky',
                    top: '120px'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                      Zoom Link Management
                    </h3>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06', fontSize: '0.9rem' }}>
                        Zoom Meeting Link *
                      </label>
                      <input
                        type="text"
                        value={zoomLink}
                        onChange={(e) => setZoomLinkValue(e.target.value)}
                        placeholder="https://zoom.us/j/..."
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06', fontSize: '0.9rem' }}>
                        Meeting ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                        placeholder="123 456 7890"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06', fontSize: '0.9rem' }}>
                        Password (Optional)
                      </label>
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Meeting password"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06', fontSize: '0.9rem' }}>
                        Meeting Date *
                      </label>
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06', fontSize: '0.9rem' }}>
                        Meeting Time *
                      </label>
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <button
                      onClick={handleSendZoomLink}
                      disabled={selectedStudents.length === 0}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: selectedStudents.length === 0 ? '#adb5bd' : '#c85716',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600'
                      }}
                    >
                      Send to Selected ({selectedStudents.length})
                    </button>

                    {selectedStudents.length === 0 && (
                      <p style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.5rem', margin: 0, textAlign: 'center' }}>
                        Select students to send link
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1.5rem' }}>
                  Broadcast Message
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                    Message Type
                  </label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="info">General Information</option>
                    <option value="announcement">Announcement</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#110a06' }}>
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="6"
                    placeholder="Type your message here..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
                    <strong>Recipients:</strong> {selectedStudents.length > 0 
                      ? `${selectedStudents.length} selected student(s)` 
                      : `All ${activeStudents.length} active student(s)`}
                  </p>
                  {selectedStudents.length > 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '0.5rem', margin: 0 }}>
                      (Select students from "Manage Students" tab to send to specific students)
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#c85716',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Send Message
                </button>
              </div>
            )}
          </>
        )}

        {!selectedCourse && myCourses.length === 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '3rem',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <i className="bi bi-book" style={{ fontSize: '3rem', color: '#dee2e6', marginBottom: '1rem', display: 'block' }}></i>
            <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1rem' }}>
              You don't have any courses assigned yet.
            </p>
            <Link
              to="/training/teacher-courses"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#c85716',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              Manage Courses
            </Link>
          </div>
        )}

        {/* Inbox Tab - Chat Interface */}
        {activeTab === 'inbox' && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#110a06', marginBottom: '1.5rem' }}>
              Messages
              {inboxMessages.filter(m => !m.read).length > 0 && (
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '4px 10px',
                  backgroundColor: '#dc3545',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  {inboxMessages.filter(m => !m.read).length} unread
                </span>
              )}
            </h3>

            {getAvailableConversations().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                <p style={{ fontSize: '1.1rem' }}>No messages from students yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', height: '600px' }}>
                {/* Conversations List */}
                <div style={{
                  width: '300px',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #e9ecef',
                    fontWeight: '600',
                    color: '#110a06'
                  }}>
                    Conversations
                  </div>
                  <div style={{
                    flex: 1,
                    overflowY: 'auto'
                  }}>
                    {getAvailableConversations().map(conv => (
                      <div
                        key={conv.key}
                        onClick={() => setSelectedChat({
                          courseId: conv.courseId,
                          studentId: conv.studentId,
                          studentName: conv.studentName
                        })}
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          backgroundColor: selectedChat && selectedChat.studentId === conv.studentId && selectedChat.courseId === conv.courseId 
                            ? '#fff3cd' 
                            : '#ffffff',
                          borderBottom: '1px solid #e9ecef',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!(selectedChat && selectedChat.studentId === conv.studentId && selectedChat.courseId === conv.courseId)) {
                            e.currentTarget.style.backgroundColor = '#f8f9fa'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!(selectedChat && selectedChat.studentId === conv.studentId && selectedChat.courseId === conv.courseId)) {
                            e.currentTarget.style.backgroundColor = '#ffffff'
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: '600', color: '#110a06', fontSize: '0.9rem' }}>
                            {conv.studentName}
                          </div>
                          {conv.unreadCount > 0 && (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: '#dc3545',
                              color: '#ffffff',
                              borderRadius: '10px',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                          {conv.courseName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6c757d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.lastMessage}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Area */}
                {selectedChat && (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    {/* Chat Header */}
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#f8f9fa',
                      borderBottom: '1px solid #e9ecef',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#110a06' }}>
                          {selectedChat.studentName}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          {getCourseName(selectedChat.courseId)}
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '1rem',
                      backgroundColor: '#f8f9fa',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {chatMessages[`${selectedChat.courseId}_${selectedChat.studentId}`] && 
                       chatMessages[`${selectedChat.courseId}_${selectedChat.studentId}`].length > 0 ? (
                        <>
                        {chatMessages[`${selectedChat.courseId}_${selectedChat.studentId}`].map(msg => {
                          const isFromStudent = msg.direction === 'student_to_teacher'
                          const isZoomLink = msg.messageType === 'zoom_link'
                          
                          return (
                            <div
                              key={msg.id}
                              style={{
                                display: 'flex',
                                justifyContent: isFromStudent ? 'flex-start' : 'flex-end',
                                marginBottom: '0.5rem'
                              }}
                            >
                              <div style={{
                                maxWidth: '70%',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                backgroundColor: isFromStudent 
                                  ? '#ffffff'
                                  : (isZoomLink ? '#fff3cd' : '#c85716'),
                                color: isFromStudent ? '#110a06' : '#ffffff',
                                border: isFromStudent ? '1px solid #e9ecef' : 'none',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: isFromStudent ? '#6c757d' : 'rgba(255,255,255,0.8)',
                                  marginBottom: '0.25rem',
                                  fontWeight: '500'
                                }}>
                                  {isFromStudent ? (msg.studentName || 'Student') : (teacherInfo?.name || 'You')}
                                  {isZoomLink && (
                                    <span style={{ marginLeft: '0.5rem' }}>
                                      <i className="bi bi-camera-video" style={{ color: '#c85716' }}></i> Zoom Link
                                    </span>
                                  )}
                                </div>
                                <div style={{ 
                                  fontSize: '0.95rem', 
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}>
                                  {msg.message}
                                </div>
                                <div style={{ 
                                  fontSize: '0.7rem', 
                                  color: isFromStudent ? '#6c757d' : 'rgba(255,255,255,0.7)',
                                  marginTop: '0.25rem'
                                }}>
                                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {isFromStudent && !msg.read && (
                                    <span 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMarkStudentMessageAsRead(msg.id)
                                      }}
                                      style={{ 
                                        marginLeft: '0.5rem',
                                        cursor: 'pointer',
                                        padding: '2px 6px',
                                        backgroundColor: '#dc3545',
                                        color: '#ffffff',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem'
                                      }}
                                    >
                                      New
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '2rem', 
                          color: '#6c757d' 
                        }}>
                          <i className="bi bi-chat" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: '#dee2e6' }}></i>
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div style={{
                      padding: '1rem',
                      borderTop: '1px solid #e9ecef',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <textarea
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendChatMessage()
                          }
                        }}
                        rows="2"
                        placeholder="Type your message... (minimum 5 characters)"
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          resize: 'none'
                        }}
                      />
                      <button
                        onClick={handleSendChatMessage}
                        disabled={!newChatMessage.trim() || newChatMessage.trim().length < 5}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: (!newChatMessage.trim() || newChatMessage.trim().length < 5) ? '#e9ecef' : '#c85716',
                          color: (!newChatMessage.trim() || newChatMessage.trim().length < 5) ? '#6c757d' : '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: (!newChatMessage.trim() || newChatMessage.trim().length < 5) ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          height: 'fit-content'
                        }}
                      >
                        <i className="bi bi-send"></i>
                        Send
                      </button>
                    </div>
                    <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.75rem', color: '#6c757d' }}>
                      Minimum 5 characters required
                    </div>
                  </div>
                )}

                {!selectedChat && (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6c757d'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <i className="bi bi-chat-left" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <ChatWidget userType="teacher" />
    </div>
  )
}

export default TeacherDashboard

