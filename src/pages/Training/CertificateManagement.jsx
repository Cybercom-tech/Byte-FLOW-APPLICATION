import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated, isGeneralAdmin } from '../../utils/auth'
import api from '../../utils/api'

function CertificateManagement() {
  const navigate = useNavigate()
  const [certificates, setCertificates] = useState([])
  const [allCertificates, setAllCertificates] = useState([]) // Store all for counts
  const [filter, setFilter] = useState('pending') // 'pending', 'sent', 'all'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated() || !isGeneralAdmin()) {
      navigate('/training/admin-auth')
      return
    }
  }, [navigate])

  // Load certificates
  useEffect(() => {
    loadCertificates()
  }, [filter])

  const loadCertificates = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/certificates')
      
      console.log('Certificate API response:', response)
      
      let fetchedCertificates = []
      if (Array.isArray(response.certificateRequests)) {
        fetchedCertificates = response.certificateRequests
      } else if (Array.isArray(response.data?.certificateRequests)) {
        fetchedCertificates = response.data.certificateRequests
      } else if (Array.isArray(response)) {
        fetchedCertificates = response
      } else {
        console.warn('No certificates array found in response:', response)
        setCertificates([])
        setAllCertificates([])
        setLoading(false)
        return
      }
      
      console.log(`Loaded ${fetchedCertificates.length} certificate requests`)
      
      // Apply filter
      let filteredCertificates = [...fetchedCertificates]
      if (filter === 'pending') {
        filteredCertificates = filteredCertificates.filter(c => !c.certificateSent)
      } else if (filter === 'sent') {
        filteredCertificates = filteredCertificates.filter(c => c.certificateSent)
      }
      // 'all' shows everything
      
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredCertificates = filteredCertificates.filter(c => 
          (c.studentName && c.studentName.toLowerCase().includes(query)) ||
          (c.studentEmail && c.studentEmail.toLowerCase().includes(query)) ||
          (c.courseTitle && c.courseTitle.toLowerCase().includes(query))
        )
      }
      
      // Sort by completion date (most recent first)
      filteredCertificates.sort((a, b) => {
        const dateA = new Date(a.completedAt || 0)
        const dateB = new Date(b.completedAt || 0)
        return dateB - dateA
      })
      
      // Store all certificates for counts (before filtering)
      setAllCertificates(fetchedCertificates)
      setCertificates(filteredCertificates)
    } catch (error) {
      console.error('Error loading certificates:', error)
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  const markAsSent = async (enrollmentId) => {
    try {
      const response = await api.put(`/admin/certificates/${enrollmentId}/mark-sent`)
      
      if (response) {
        // Update the certificate in both arrays
        setCertificates(prev => prev.map(c => 
          c.enrollmentId === enrollmentId 
            ? { ...c, certificateSent: true, certificateSentAt: new Date() }
            : c
        ))
        setAllCertificates(prev => prev.map(c => 
          c.enrollmentId === enrollmentId 
            ? { ...c, certificateSent: true, certificateSentAt: new Date() }
            : c
        ))
        alert('Certificate marked as sent successfully')
      } else {
        alert('Failed to update certificate status')
      }
    } catch (error) {
      console.error('Error marking certificate as sent:', error)
      alert('Failed to update certificate status: ' + (error.data?.message || error.message || 'Unknown error'))
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

  // Calculate counts from all certificates (before filtering)
  const pendingCount = allCertificates.filter(c => !c.certificateSent).length
  const sentCount = allCertificates.filter(c => c.certificateSent).length

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#110a06', marginBottom: '0.5rem' }}>
            Certificate Management
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
            Manage certificate requests for completed courses. Mark certificates as sent after emailing them to students.
          </p>
        </div>

        {/* Search and Filter */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <input
              type="text"
              placeholder="Search by student name, email, or course title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '0.95rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: filter === 'pending' ? '#dc3545' : '#ffffff',
                color: filter === 'pending' ? '#ffffff' : '#110a06',
                fontWeight: filter === 'pending' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.9rem',
                border: filter === 'pending' ? 'none' : '1px solid #e9ecef'
              }}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('sent')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: filter === 'sent' ? '#198754' : '#ffffff',
                color: filter === 'sent' ? '#ffffff' : '#110a06',
                fontWeight: filter === 'sent' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.9rem',
                border: filter === 'sent' ? 'none' : '1px solid #e9ecef'
              }}
            >
              Sent ({sentCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: filter === 'all' ? '#c85716' : '#ffffff',
                color: filter === 'all' ? '#ffffff' : '#110a06',
                fontWeight: filter === 'all' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.9rem',
                border: filter === 'all' ? 'none' : '1px solid #e9ecef'
              }}
            >
              All ({certificates.length})
            </button>
          </div>
        </div>

        {/* Certificates Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : certificates.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>
                {filter === 'pending' ? 'No pending certificate requests' : 
                 filter === 'sent' ? 'No sent certificates' : 
                 'No certificates found'}
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
                    Email
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Course
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Completed
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => {
                  const isSent = cert.certificateSent
                  return (
                    <tr
                      key={cert.enrollmentId}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'background-color 0.2s',
                        backgroundColor: isSent ? '#f0f9f4' : '#fff5f5'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isSent ? '#e0f2e8' : '#ffe0e0'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSent ? '#f0f9f4' : '#fff5f5'
                      }}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#110a06', fontWeight: '500' }}>
                        {cert.studentName || 'Unknown'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#6c757d' }}>
                        {cert.studentEmail || 'N/A'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#110a06' }}>
                        {cert.courseTitle || 'Unknown Course'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#6c757d' }}>
                        {formatDate(cert.completedAt)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {isSent ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: '#d1e7dd',
                            color: '#0f5132'
                          }}>
                            <i className="bi bi-check-circle-fill" style={{ marginRight: '0.25rem' }}></i>
                            Sent
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: '#f8d7da',
                            color: '#721c24'
                          }}>
                            <i className="bi bi-clock-fill" style={{ marginRight: '0.25rem' }}></i>
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {isSent ? (
                          <span style={{
                            padding: '6px 12px',
                            backgroundColor: '#d1e7dd',
                            color: '#0f5132',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>
                            <i className="bi bi-check-circle" style={{ marginRight: '0.25rem' }}></i>
                            Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => markAsSent(cert.enrollmentId)}
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
                            <i className="bi bi-envelope-check" style={{ marginRight: '0.25rem' }}></i>
                            Mark as Sent
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default CertificateManagement

