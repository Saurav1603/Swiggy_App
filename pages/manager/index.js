import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  WAITING_FOR_PRICE: 'bg-blue-100 text-blue-700',
  PRICE_SENT: 'bg-yellow-100 text-yellow-700',
  PAYMENT_PENDING: 'bg-orange-100 text-orange-700',
  PAYMENT_RECEIVED: 'bg-green-100 text-green-700',
  ORDER_PLACED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-gray-100 text-gray-700'
}

const ADMIN_STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-yellow-100 text-yellow-700',
  offline: 'bg-gray-100 text-gray-700'
}

export default function ManagerDashboard() {
  const router = useRouter()
  const [token, setToken] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('managerToken')
      setToken(savedToken)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchStats()
      const interval = setInterval(fetchStats, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [token])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/manager/stats')
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (err) {
      console.error('Fetch stats error:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/manager/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('managerToken', data.token)
        setToken(data.token)
        toast.success('Welcome, Manager!')
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('managerToken')
    setToken(null)
    toast.success('Logged out')
  }

  if (!token) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto mt-12 animate-fadeIn">
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block">👨‍💼</span>
            <h1 className="text-2xl font-bold text-gray-900">Manager Panel</h1>
            <p className="text-gray-500 mt-2">Sign in to access the control panel</p>
          </div>
          <div className="card p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="manager@swiggy.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>
              <button 
                type="submit"
                disabled={loading} 
                className={`w-full btn-primary ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">👨‍💼 Manager Dashboard</h1>
            <p className="text-gray-500">Control panel for admins and requests</p>
          </div>
          <div className="flex gap-2">
            <Link href="/manager/admins" className="btn-primary">Manage Admins</Link>
            <Link href="/manager/requests" className="btn-secondary">All Requests</Link>
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </div>
        </div>

        {statsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading dashboard...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.admins.total}</div>
                <div className="text-gray-500 mt-1">Total Admins</div>
                <div className="flex justify-center gap-2 mt-2 text-xs">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">{stats.admins.available} online</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">{stats.admins.busy} busy</span>
                </div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.requests.total}</div>
                <div className="text-gray-500 mt-1">Total Requests</div>
                <div className="text-xs mt-2 text-gray-400">{stats.requests.today} today</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.requests.pending}</div>
                <div className="text-gray-500 mt-1">Pending</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-green-600">₹{stats.revenue.total?.toLocaleString() || 0}</div>
                <div className="text-gray-500 mt-1">Total Revenue</div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Admin Performance */}
              <div className="card p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">👥 Admin Performance</h2>
                  <Link href="/manager/admins" className="text-orange-600 text-sm hover:underline">View All →</Link>
                </div>
                {stats.adminPerformance?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.adminPerformance.slice(0, 5).map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                            {admin.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium">{admin.name}</div>
                            <div className="text-xs text-gray-500">{admin.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${ADMIN_STATUS_COLORS[admin.status]}`}>
                            {admin.status}
                          </span>
                          <div className="text-sm mt-1 text-gray-600">{admin.completedOrders} orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No admins registered yet</p>
                )}
              </div>

              {/* Recent Requests */}
              <div className="card p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">📋 Recent Requests</h2>
                  <Link href="/manager/requests" className="text-orange-600 text-sm hover:underline">View All →</Link>
                </div>
                {stats.recentRequests?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{req.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(req.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[req.status] || 'bg-gray-100'}`}>
                            {req.status.replace(/_/g, ' ')}
                          </span>
                          {req.pricing?.total && (
                            <div className="text-sm mt-1 text-gray-600">₹{req.pricing.total}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No requests yet</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-12">Failed to load stats</p>
        )}
      </div>
    </Layout>
  )
}
