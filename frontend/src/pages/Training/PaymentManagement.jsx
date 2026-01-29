import React, { useState, useEffect } from 'react'
import { getAllPaymentScreenshots, updatePaymentScreenshotStatus, rejectPaymentScreenshot } from '../../utils/paymentScreenshot'
import { isAuthenticated, isPaymentAdmin, getCurrentUser } from '../../utils/auth'
import { useNavigate } from 'react-router-dom'

function PaymentManagement() {
  const navigate = useNavigate()
  const [screenshots, setScreenshots] = useState([])
  const [allScreenshots, setAllScreenshots] = useState([]) // Store unfiltered screenshots for counts
  const [selectedScreenshot, setSelectedScreenshot] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'confirmed', 'rejected'
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectingScreenshot, setRejectingScreenshot] = useState(null)

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated() || !isPaymentAdmin()) {
      navigate('/training/admin-auth')
      return
    }
  }, [navigate])

  // Load payment screenshots
  useEffect(() => {
    const loadScreenshotsAsync = async () => {
      await loadScreenshots()
    }
    
    loadScreenshotsAsync()
    
    // Refresh every 2 seconds to get new submissions
    const interval = setInterval(loadScreenshotsAsync, 2000)
    return () => clearInterval(interval)
  }, [filter])

  const loadScreenshots = async () => {
    try {
      let fetchedScreenshots = await getAllPaymentScreenshots()
      
      // Debug: Log screenshot data
      console.log('Loaded screenshots:', fetchedScreenshots.map(s => ({
        id: s.id,
        studentName: s.studentName,
        courseTitle: s.courseTitle,
        hasScreenshot: !!s.screenshotUrl,
        screenshotUrlLength: s.screenshotUrl?.length || 0
      })))
      
      // Sort by submitted date (newest first)
      fetchedScreenshots.sort((a, b) => {
        const dateA = new Date(a.submittedAt || 0)
        const dateB = new Date(b.submittedAt || 0)
        return dateB - dateA
      })
      
      // Store unfiltered screenshots for counts
      setAllScreenshots(fetchedScreenshots)
      
      // Apply filter
      let filteredScreenshots = fetchedScreenshots
      if (filter === 'pending') {
        filteredScreenshots = fetchedScreenshots.filter(s => s.status === 'pending')
      } else if (filter === 'confirmed') {
        filteredScreenshots = fetchedScreenshots.filter(s => s.status === 'confirmed')
      } else if (filter === 'rejected') {
        filteredScreenshots = fetchedScreenshots.filter(s => s.status === 'cancelled')
      }
      
      setScreenshots(filteredScreenshots)
    } catch (error) {
      console.error('Error loading payment screenshots:', error)
      setScreenshots([])
      setAllScreenshots([])
    }
  }

  const handleStatusChange = async (screenshotId, newStatus) => {
    try {
      // Ensure screenshotId is a string for comparison
      const screenshotIdStr = String(screenshotId)
      const result = await updatePaymentScreenshotStatus(screenshotIdStr, newStatus)
      
      if (result.success) {
        // If confirmed, the enrollment is already activated by the backend
        if (newStatus === 'confirmed') {
          const screenshot = screenshots.find(s => String(s.id) === screenshotIdStr)
          if (screenshot) {
            console.log('Payment confirmed for screenshot:', screenshot)
            const courseId = String(screenshot.courseId || '')
            const studentId = String(screenshot.studentId || '')
            
            // Dispatch a custom event to notify all tabs/windows about the enrollment verification
            // This will trigger updates in student dashboards in the same tab
            // For cross-tab updates, the browser's native storage event will fire automatically
            window.dispatchEvent(new CustomEvent('enrollmentVerified', {
              detail: { 
                courseId: courseId, 
                studentId: studentId, 
                verified: true 
              }
            }))
            
            alert('Payment confirmed and enrollment activated!')
          }
        }
        
        // Reload screenshots
        await loadScreenshots()
        
        // Close modal if open
        if (selectedScreenshot && String(selectedScreenshot.id) === screenshotIdStr) {
          setSelectedScreenshot(null)
        }
      } else {
        alert('Failed to update status: ' + (result.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('An error occurred while updating the status')
    }
  }

  const handleReject = (screenshot) => {
    setRejectingScreenshot(screenshot)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingScreenshot) return
    
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      const screenshotIdStr = String(rejectingScreenshot.id)
      const result = await rejectPaymentScreenshot(screenshotIdStr, rejectionReason)
      
      if (result.success) {
        alert('Payment rejected successfully. Student has been notified.')
        
        // Reload screenshots
        await loadScreenshots()
        
        // Close modals
        setShowRejectModal(false)
        setRejectingScreenshot(null)
        setRejectionReason('')
        if (selectedScreenshot && String(selectedScreenshot.id) === screenshotIdStr) {
          setSelectedScreenshot(null)
        }
      } else {
        alert('Failed to reject payment: ' + (result.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
      alert('An error occurred while rejecting the payment')
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'confirmed') {
      return (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: '600',
          backgroundColor: '#d1e7dd',
          color: '#198754'
        }}>
          Confirmed
        </span>
      )
    } else if (status === 'cancelled') {
      return (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: '600',
          backgroundColor: '#f8d7da',
          color: '#dc3545'
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

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#110a06', marginBottom: '0.5rem' }}>
            Payment Management
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
            Review and verify bank transfer payment screenshots submitted by students.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e9ecef'
        }}>
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
            All ({allScreenshots.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderBottom: filter === 'pending' ? '3px solid #c85716' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: filter === 'pending' ? '#c85716' : '#6c757d',
              fontWeight: filter === 'pending' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            Pending ({allScreenshots.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderBottom: filter === 'confirmed' ? '3px solid #c85716' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: filter === 'confirmed' ? '#c85716' : '#6c757d',
              fontWeight: filter === 'confirmed' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            Confirmed ({allScreenshots.filter(s => s.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderBottom: filter === 'rejected' ? '3px solid #c85716' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: filter === 'rejected' ? '#c85716' : '#6c757d',
              fontWeight: filter === 'rejected' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            Rejected ({allScreenshots.filter(s => s.status === 'cancelled').length})
          </button>
        </div>

        {/* Payment Screenshots Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          overflow: 'hidden'
        }}>
          {screenshots.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>
                {filter === 'all' 
                  ? 'No payment screenshots submitted yet' 
                  : filter === 'pending'
                  ? 'No pending payments'
                  : filter === 'confirmed'
                  ? 'No confirmed payments'
                  : 'No rejected payments'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Student Name
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Course
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Amount
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Screenshot
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
                {screenshots.map((screenshot) => (
                  <tr
                    key={screenshot.id}
                    style={{
                      borderBottom: '1px solid #e9ecef',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#110a06', fontWeight: '500' }}>
                      {screenshot.studentName || 'Unknown'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#6c757d' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontWeight: '500', color: '#110a06' }}>
                          {screenshot.courseTitle || 'Unknown Course'}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          by {screenshot.instructorName || 'Course Instructor'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#110a06', fontWeight: '500' }}>
                      PKR {screenshot.amountPaid?.toLocaleString() || '0'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => setSelectedScreenshot(screenshot)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#c85716',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#a0450f'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#c85716'
                        }}
                      >
                        <i className="bi bi-image" style={{ marginRight: '0.5rem' }}></i>
                        View Screenshot
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(screenshot.status)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#6c757d' }}>
                      {formatDate(screenshot.submittedAt)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {screenshot.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleStatusChange(screenshot.id, 'confirmed')}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#198754',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
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
                            Confirm
                          </button>
                          <button
                            onClick={() => handleReject(screenshot)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#dc3545',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
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
                            Reject
                          </button>
                        </div>
                      ) : screenshot.status === 'confirmed' ? (
                        <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                          Verified
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: '#dc3545' }}>
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Screenshot Modal */}
        {selectedScreenshot && (
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
            onClick={() => setSelectedScreenshot(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedScreenshot(null)}
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

              {/* Screenshot Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#110a06', marginBottom: '0.5rem' }}>
                  Payment Screenshot
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: '#6c757d' }}>
                  <p style={{ margin: 0 }}>
                    <strong>Student:</strong> {selectedScreenshot.studentName}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Course:</strong> {selectedScreenshot.courseTitle || 'Unknown Course'}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Instructor:</strong> {selectedScreenshot.instructorName || 'Course Instructor'}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Amount:</strong> PKR {selectedScreenshot.amountPaid?.toLocaleString() || '0'}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Status:</strong> {getStatusBadge(selectedScreenshot.status)}
                  </p>
                  {selectedScreenshot.transactionId && (
                    <p style={{ margin: 0 }}>
                      <strong>Transaction ID:</strong> {selectedScreenshot.transactionId}
                    </p>
                  )}
                </div>
              </div>

              {/* Screenshot Image */}
              {selectedScreenshot.screenshotUrl ? (
                <div style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '1.5rem'
                }}>
                  <img
                    src={selectedScreenshot.screenshotUrl}
                    alt="Payment screenshot"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      maxHeight: '600px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      console.error('Error loading screenshot image:', selectedScreenshot.screenshotUrl)
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div style={{
                    display: 'none',
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px'
                  }}>
                    <i className="bi bi-image" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dee2e6' }}></i>
                    <p style={{ margin: 0, fontSize: '1rem' }}>Unable to load screenshot image</p>
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '3rem',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d',
                  marginBottom: '1.5rem'
                }}>
                  <i className="bi bi-image" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
                  <p style={{ margin: 0, fontSize: '1rem' }}>No screenshot available</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedScreenshot.status === 'pending' && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      handleReject(selectedScreenshot)
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
                    Reject Payment
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedScreenshot.id, 'confirmed')
                      setSelectedScreenshot(null)
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
                    Confirm Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {showRejectModal && rejectingScreenshot && (
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
            onClick={() => setShowRejectModal(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                Reject Payment
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#6c757d', marginBottom: '1.5rem' }}>
                Please provide a reason for rejecting this payment. The student will be notified.
              </p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#110a06', marginBottom: '0.5rem' }}>
                  Student: {rejectingScreenshot.studentName}
                </label>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#110a06', marginBottom: '0.5rem' }}>
                  Course: {rejectingScreenshot.courseTitle}
                </label>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#110a06', marginBottom: '1rem' }}>
                  Amount: PKR {rejectingScreenshot.amountPaid?.toLocaleString() || '0'}
                </label>
                
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#110a06', marginBottom: '0.5rem' }}>
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Payment amount does not match, Invalid transaction ID, Screenshot not clear..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectingScreenshot(null)
                    setRejectionReason('')
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#6c757d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5c636a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#6c757d'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#dc3545',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
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
                  Reject Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentManagement

