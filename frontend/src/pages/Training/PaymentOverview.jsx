import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllPaymentScreenshots } from '../../utils/paymentScreenshot'
import { isAuthenticated, isGeneralAdmin } from '../../utils/auth'

function PaymentOverview() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('30') // days: '7', '30', '90', 'all'
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isAuthenticated() || !isGeneralAdmin()) {
      navigate('/training/admin-auth')
      return
    }
  }, [navigate])

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const screenshots = await getAllPaymentScreenshots()
        
        // Ensure screenshots is an array before sorting
        if (!screenshots || !Array.isArray(screenshots)) {
          console.warn('getAllPaymentScreenshots returned non-array:', screenshots, typeof screenshots)
          setRecords([])
          return
        }
        
        // Ensure screenshots is not empty and has valid items
        if (screenshots.length === 0) {
          setRecords([])
          return
        }
        
        // Create a copy before sorting to avoid mutating the original
        const sortedScreenshots = [...screenshots].sort((a, b) => {
          const dateA = new Date(a.submittedAt || 0)
          const dateB = new Date(b.submittedAt || 0)
          return dateB - dateA
        })
        
        setRecords(sortedScreenshots)
      } catch (error) {
        console.error('Error loading payment overview data:', error)
        setRecords([])
      }
    }

    loadRecords()
    const interval = setInterval(loadRecords, 3000)
    return () => clearInterval(interval)
  }, [])

  const stats = useMemo(() => {
    const totalTransactions = records.length
    const pending = records.filter(r => r.status === 'pending')
    const confirmed = records.filter(r => r.status === 'confirmed')
    const rejected = records.filter(r => r.status === 'cancelled')
    const totalPendingAmount = pending.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
    const totalConfirmedAmount = confirmed.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
    const totalRejectedAmount = rejected.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
    const approvalRate = totalTransactions > 0 ? Math.round((confirmed.length / totalTransactions) * 100) : 0

    return {
      totalTransactions,
      totalPending: pending.length,
      totalConfirmed: confirmed.length,
      totalRejected: rejected.length,
      pendingAmount: totalPendingAmount,
      confirmedAmount: totalConfirmedAmount,
      rejectedAmount: totalRejectedAmount,
      approvalRate
    }
  }, [records])

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const now = Date.now()
    let timeThreshold = 0
    if (timeFilter !== 'all') {
      const days = parseInt(timeFilter, 10)
      timeThreshold = now - (days * 24 * 60 * 60 * 1000)
    }

    return records.filter(record => {
      if (statusFilter !== 'all') {
        // Handle rejected filter (rejected payments have status 'cancelled')
        if (statusFilter === 'rejected') {
          if (record.status !== 'cancelled') {
            return false
          }
        } else if (record.status !== statusFilter) {
          return false
        }
      }

      if (timeFilter !== 'all') {
        const submittedAt = new Date(record.submittedAt || 0).getTime()
        if (Number.isFinite(submittedAt) && submittedAt < timeThreshold) {
          return false
        }
      }

      if (query) {
        const studentMatch = record.studentName?.toLowerCase().includes(query)
        const courseMatch = record.courseTitle?.toLowerCase().includes(query)
        const transactionMatch = record.transactionId?.toLowerCase().includes(query)
        if (!studentMatch && !courseMatch && !transactionMatch) {
          return false
        }
      }

      return true
    })
  }, [records, statusFilter, timeFilter, searchQuery])

  const recentApprovals = useMemo(() => {
    return records
      .filter(record => record.status === 'confirmed')
      .slice(0, 5)
  }, [records])

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
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#110a06', marginBottom: '0.5rem' }}>
            Payment Oversight
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '0.5rem' }}>
            Track all payment submissions, approvals, and outstanding verifications in one place.
          </p>
          <p style={{ fontSize: '0.95rem', color: '#adb5bd', margin: 0 }}>
            Automatically refreshed every 10 seconds • Read-only access for general administrators
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>Total Transactions</p>
            <h2 style={{ fontSize: '2rem', margin: 0, color: '#110a06' }}>{stats.totalTransactions}</h2>
            <span style={{ fontSize: '0.85rem', color: '#adb5bd' }}>All payments logged</span>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>Verified Amount</p>
            <h2 style={{ fontSize: '2rem', margin: 0, color: '#198754' }}>PKR {stats.confirmedAmount.toLocaleString()}</h2>
            <span style={{ fontSize: '0.85rem', color: '#adb5bd' }}>{stats.totalConfirmed} approvals</span>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>Pending Amount</p>
            <h2 style={{ fontSize: '2rem', margin: 0, color: '#fd7e14' }}>PKR {stats.pendingAmount.toLocaleString()}</h2>
            <span style={{ fontSize: '0.85rem', color: '#adb5bd' }}>{stats.totalPending} awaiting review</span>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>Approval Rate</p>
            <h2 style={{ fontSize: '2rem', margin: 0, color: '#0d6efd' }}>{stats.approvalRate}%</h2>
            <span style={{ fontSize: '0.85rem', color: '#adb5bd' }}>Confirmed vs submitted</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e9ecef', padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: '1 1 240px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.35rem' }}>
                  Search by student, course, or transaction
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., John Doe, AI Fundamentals, TXN-123"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.35rem' }}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    minWidth: '160px',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.35rem' }}>
                  Time range
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    minWidth: '140px',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {filteredRecords.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                  <p style={{ margin: 0 }}>No records match your filters.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6c757d' }}>Student</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6c757d' }}>Course</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6c757d' }}>Amount</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6c757d' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6c757d' }}>Transaction</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6c757d' }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => (
                      <tr key={record.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                        <td style={{ padding: '0.85rem', fontSize: '0.95rem', color: '#110a06' }}>
                          {record.studentName || 'Unknown'}
                        </td>
                        <td style={{ padding: '0.85rem', fontSize: '0.95rem', color: '#6c757d' }}>
                          {record.courseTitle || 'N/A'}
                        </td>
                        <td style={{ padding: '0.85rem', fontSize: '0.95rem', color: '#110a06', fontWeight: '600' }}>
                          PKR {record.amountPaid?.toLocaleString() || '0'}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: record.status === 'confirmed' ? '#d1e7dd' : record.status === 'cancelled' ? '#f8d7da' : '#fff3cd',
                            color: record.status === 'confirmed' ? '#0f5132' : record.status === 'cancelled' ? '#842029' : '#856404'
                          }}>
                            {record.status === 'confirmed' ? 'Confirmed' : record.status === 'cancelled' ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem', fontSize: '0.9rem', color: '#6c757d' }}>
                          {record.transactionId || '—'}
                        </td>
                        <td style={{ padding: '0.85rem', fontSize: '0.9rem', color: '#6c757d' }}>
                          {formatDate(record.submittedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e9ecef', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                Recent Approvals
              </h3>
              {recentApprovals.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>No approvals yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentApprovals.map(record => (
                    <div key={record.id} style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong style={{ color: '#110a06', fontSize: '0.95rem' }}>
                          {record.studentName || 'Unknown'}
                        </strong>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          PKR {record.amountPaid?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#6c757d' }}>
                        {record.courseTitle || 'Course'} • {formatDate(record.confirmedAt || record.updatedAt || record.submittedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e9ecef', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#110a06', marginBottom: '1rem' }}>
                Status Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#6c757d' }}>Pending Reviews</span>
                  <strong style={{ color: '#fd7e14' }}>{stats.totalPending}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#6c757d' }}>Confirmed Payments</span>
                  <strong style={{ color: '#198754' }}>{stats.totalConfirmed}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#6c757d' }}>Rejected Payments</span>
                  <strong style={{ color: '#dc3545' }}>{stats.totalRejected}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#6c757d' }}>Outstanding Amount</span>
                  <strong style={{ color: '#fd7e14' }}>PKR {stats.pendingAmount.toLocaleString()}</strong>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f3f5', borderRadius: '999px', overflow: 'hidden', marginTop: '0.5rem' }}>
                  <div
                    style={{
                      width: `${stats.approvalRate}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #c85716, #f5b041)'
                    }}
                  ></div>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#adb5bd', textAlign: 'right' }}>
                  {stats.approvalRate}% verified of total submissions
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentOverview


