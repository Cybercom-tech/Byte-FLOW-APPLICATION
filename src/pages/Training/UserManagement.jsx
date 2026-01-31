import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated, isGeneralAdmin, getCurrentUser } from '../../utils/auth'
import api from '../../utils/api'

function UserManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [allUsers, setAllUsers] = useState([]) // Store unfiltered users for counts
  const [filter, setFilter] = useState('all') // 'all', 'student', 'teacher', 'banned'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated() || !isGeneralAdmin()) {
      navigate('/training/admin-auth')
      return
    }
  }, [navigate])

  // Load users
  useEffect(() => {
    loadUsers()
  }, [filter, searchQuery])

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      
      // Handle different possible response structures
      let fetchedUsers = []
      if (Array.isArray(response.users)) {
        fetchedUsers = response.users
      } else if (Array.isArray(response.data?.users)) {
        fetchedUsers = response.data.users
      } else if (Array.isArray(response)) {
        fetchedUsers = response
      } else {
        console.warn('No users array found in response:', response)
        setUsers([])
        setAllUsers([])
        return
      }
      
      // Exclude admin users from the list
      fetchedUsers = fetchedUsers.filter(u => u.userType !== 'admin')
      
      // Store all users for counts (before filtering)
      setAllUsers([...fetchedUsers])
      
      // Apply filter
      let filteredUsers = [...fetchedUsers]
      if (filter === 'student') {
        filteredUsers = filteredUsers.filter(u => u.userType === 'student')
      } else if (filter === 'teacher') {
        filteredUsers = filteredUsers.filter(u => u.userType === 'teacher')
      } else if (filter === 'banned') {
        // Check if user is blocked - might be in Teacher model for teachers
        filteredUsers = filteredUsers.filter(u => u.isAccountBlocked === true || u.banned === true)
      }
      
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredUsers = filteredUsers.filter(u => 
          (u.name && u.name.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query))
        )
      }
      
      // Sort by name (or by createdAt if name is not available)
      filteredUsers.sort((a, b) => {
        const nameA = a.name || ''
        const nameB = b.name || ''
        return nameA.localeCompare(nameB)
      })
      
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    }
  }

  const toggleBanUser = async (userId) => {
    try {
      const user = users.find(u => u._id === userId || u.id === userId)
      
      if (!user) {
        alert('User not found')
        return
      }
      
      const isCurrentlyBlocked = user.isAccountBlocked || user.banned
      const newBlockStatus = !isCurrentlyBlocked
      
      // Call backend API to toggle block status
      const response = await api.put(`/admin/users/${userId}/block`, { isBlocked: newBlockStatus })
      
      if (response) {
        alert(newBlockStatus ? 'User blocked successfully' : 'User unblocked successfully')
        // Reload users to get updated status
        await loadUsers()
        
        if (selectedUser && (selectedUser._id === userId || selectedUser.id === userId)) {
          setSelectedUser({ ...selectedUser, isAccountBlocked: newBlockStatus, banned: newBlockStatus })
        }
      } else {
        alert('Failed to update user status')
      }
    } catch (error) {
      console.error('Error toggling ban:', error)
      alert('Failed to update user status: ' + (error.data?.message || error.message || 'Unknown error'))
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

  const getUserTypeBadge = (userType) => {
    if (userType === 'teacher') {
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '600',
          backgroundColor: '#cfe2ff',
          color: '#084298'
        }}>
          Teacher
        </span>
      )
    } else {
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '600',
          backgroundColor: '#d1e7dd',
          color: '#0f5132'
        }}>
          Student
        </span>
      )
    }
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '150px', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#110a06', marginBottom: '0.5rem' }}>
            User Management
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '1.5rem' }}>
            Manage students and teachers, including banning/unbanning users.
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
              placeholder="Search by name or email..."
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
              All ({allUsers.length})
            </button>
            <button
              onClick={() => setFilter('student')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: filter === 'student' ? '#198754' : '#ffffff',
                color: filter === 'student' ? '#ffffff' : '#110a06',
                fontWeight: filter === 'student' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.9rem',
                border: filter === 'student' ? 'none' : '1px solid #e9ecef'
              }}
            >
              Students ({allUsers.filter(u => u.userType === 'student').length})
            </button>
            <button
              onClick={() => setFilter('teacher')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: filter === 'teacher' ? '#0d6efd' : '#ffffff',
                color: filter === 'teacher' ? '#ffffff' : '#110a06',
                fontWeight: filter === 'teacher' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.9rem',
                border: filter === 'teacher' ? 'none' : '1px solid #e9ecef'
              }}
            >
              Teachers ({allUsers.filter(u => u.userType === 'teacher').length})
            </button>
            <button
              onClick={() => setFilter('banned')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: filter === 'banned' ? '#dc3545' : '#ffffff',
                color: filter === 'banned' ? '#ffffff' : '#110a06',
                fontWeight: filter === 'banned' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.9rem',
                border: filter === 'banned' ? 'none' : '1px solid #e9ecef'
              }}
            >
              Banned ({allUsers.filter(u => u.isAccountBlocked === true || u.banned === true).length})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          overflow: 'hidden'
        }}>
          {users.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: '#dee2e6' }}></i>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>
                No users found
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Name
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Email
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Type
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Registered
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: '600', color: '#110a06' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const userId = user._id || user.id
                  const isBlocked = user.isAccountBlocked || user.banned
                  return (
                    <tr
                      key={userId}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'background-color 0.2s',
                        backgroundColor: isBlocked ? '#fff5f5' : '#ffffff'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isBlocked ? '#ffe0e0' : '#f8f9fa'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isBlocked ? '#fff5f5' : '#ffffff'
                      }}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#110a06', fontWeight: '500' }}>
                        {user.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#6c757d' }}>
                        {user.email || 'N/A'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {getUserTypeBadge(user.userType)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {isBlocked ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: '#f8d7da',
                            color: '#721c24'
                          }}>
                            Banned
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: '#d1e7dd',
                            color: '#0f5132'
                          }}>
                            Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#6c757d' }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleBanUser(userId)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: isBlocked ? '#198754' : '#dc3545',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isBlocked ? '#157347' : '#bb2d3b'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isBlocked ? '#198754' : '#dc3545'
                          }}
                        >
                          <i className={`bi ${isBlocked ? 'bi-check-circle' : 'bi-x-circle'}`} style={{ marginRight: '0.25rem' }}></i>
                          {isBlocked ? 'Unban' : 'Ban'}
                        </button>
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

export default UserManagement

