import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const ADMIN_STATUS_COLORS = {
  available: 'bg-green-100 text-green-700 border-green-200',
  busy: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  offline: 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function ManageAdmins() {
  const router = useRouter()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStatus, setEditStatus] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('managerToken')
      if (!token) {
        router.replace('/manager')
        return
      }
    }
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/manager/admins')
      if (res.ok) {
        setAdmins(await res.json())
      }
    } catch (err) {
      console.error('Fetch admins error:', err)
      toast.error('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAdmin = async (admin) => {
    setSelectedAdmin(admin)
    setEditName(admin.name)
    setEditStatus(admin.status)
    setEditMode(false)
  }

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return
    try {
      const res = await fetch(`/api/manager/admins/${selectedAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, status: editStatus })
      })
      if (res.ok) {
        toast.success('Admin updated!')
        fetchAdmins()
        setEditMode(false)
        // Update selected admin
        setSelectedAdmin({ ...selectedAdmin, name: editName, status: editStatus })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Update failed')
      }
    } catch (err) {
      toast.error('Network error')
    }
  }

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/manager/admins/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Admin deleted')
        fetchAdmins()
        if (selectedAdmin?.id === id) setSelectedAdmin(null)
      } else {
        toast.error('Delete failed')
      }
    } catch (err) {
      toast.error('Network error')
    }
  }

  const handleSetStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/manager/admins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(`Status set to ${status}`)
        fetchAdmins()
        if (selectedAdmin?.id === id) {
          setSelectedAdmin({ ...selectedAdmin, status })
          setEditStatus(status)
        }
      }
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">👥 Manage Admins</h1>
            <p className="text-gray-500">View and control all admin accounts</p>
          </div>
          <div className="flex gap-2">
            <Link href="/manager" className="btn-secondary">← Dashboard</Link>
            <Link href="/admin/register" className="btn-primary" target="_blank">+ Add Admin</Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Admin List */}
          <div className="md:col-span-2">
            <div className="card p-5">
              <h2 className="font-semibold text-lg mb-4">All Admins ({admins.length})</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : admins.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No admins registered yet</p>
              ) : (
                <div className="space-y-3">
                  {admins.map(admin => (
                    <div
                      key={admin.id}
                      onClick={() => handleSelectAdmin(admin)}
                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all
                        ${selectedAdmin?.id === admin.id ? 'bg-orange-50 border-2 border-orange-300' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
                          {admin.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-sm rounded-full border ${ADMIN_STATUS_COLORS[admin.status]}`}>
                          {admin.status}
                        </span>
                        <div className="text-xs text-gray-500 mt-2">
                          {admin.stats.completedOrders} completed • {admin.stats.activeOrders} active
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin Details Panel */}
          <div className="md:col-span-1">
            <div className="card p-5 sticky top-4">
              {selectedAdmin ? (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="font-semibold text-lg">Admin Details</h2>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="text-sm text-orange-600 hover:underline"
                    >
                      {editMode ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="input-field"
                        >
                          <option value="available">Available</option>
                          <option value="busy">Busy</option>
                          <option value="offline">Offline</option>
                        </select>
                      </div>
                      <button onClick={handleUpdateAdmin} className="w-full btn-primary">
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-2xl mx-auto mb-2">
                          {selectedAdmin.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="font-medium text-lg">{selectedAdmin.name}</div>
                        <div className="text-gray-500 text-sm">{selectedAdmin.email}</div>
                        <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full border ${ADMIN_STATUS_COLORS[selectedAdmin.status]}`}>
                          {selectedAdmin.status}
                        </span>
                      </div>

                      {/* Quick Status Buttons */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Status</label>
                        <div className="flex gap-2">
                          {['available', 'busy', 'offline'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleSetStatus(selectedAdmin.id, status)}
                              className={`flex-1 px-2 py-1 text-xs rounded-full border transition-all
                                ${selectedAdmin.status === status 
                                  ? ADMIN_STATUS_COLORS[status] + ' ring-2 ring-offset-1' 
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-green-600">{selectedAdmin.stats.completedOrders}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-orange-600">{selectedAdmin.stats.activeOrders}</div>
                          <div className="text-xs text-gray-500">Active</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-blue-600">{selectedAdmin.stats.totalOrders}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-red-600">{selectedAdmin.stats.declineCount}</div>
                          <div className="text-xs text-gray-500">Declined</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        Joined: {new Date(selectedAdmin.createdAt).toLocaleDateString()}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteAdmin(selectedAdmin.id)}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        🗑️ Delete Admin
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">👆</span>
                  Select an admin to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
