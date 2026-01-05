import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ManagerLayout from '../../components/ManagerLayout';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  WAITING_FOR_PRICE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PRICE_SENT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PAYMENT_PENDING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  PAYMENT_RECEIVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  ORDER_PLACED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const ADMIN_STATUS_COLORS = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  offline: 'bg-gray-500'
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('managerToken');
      setToken(savedToken);
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/manager/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/manager/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('managerToken', data.token);
        setToken(data.token);
        toast.success('Welcome, Manager!');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Login Form
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/25">
              <span className="text-4xl">👔</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Manager Portal</h1>
            <p className="text-white/60 mt-2">Sign in to access the control panel</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="manager@swiggy.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 transition-all ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Signing in...
                  </span>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <ManagerLayout title="Dashboard" subtitle="Overview of your platform">
      {statsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <p className="text-white/60">Loading dashboard...</p>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Admins */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" title="Available"></span>
                  <span className="w-2 h-2 rounded-full bg-yellow-500" title="Busy"></span>
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{stats.admins?.total || 0}</div>
              <div className="text-white/60 text-sm mt-1">Total Admins</div>
              <div className="flex gap-2 mt-3 text-xs">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">{stats.admins?.available || 0} online</span>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">{stats.admins?.busy || 0} busy</span>
              </div>
            </div>

            {/* Total Requests */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{stats.requests?.total || 0}</div>
              <div className="text-white/60 text-sm mt-1">Total Requests</div>
              <div className="text-xs text-green-400 mt-3">+{stats.requests?.today || 0} today</div>
            </div>

            {/* Pending */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-400">{stats.requests?.pending || 0}</div>
              <div className="text-white/60 text-sm mt-1">Pending</div>
              <Link href="/manager/requests?status=pending" className="text-xs text-orange-400 mt-3 inline-block hover:underline">
                View all →
              </Link>
            </div>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-400">₹{stats.revenue?.total?.toLocaleString() || 0}</div>
              <div className="text-white/60 text-sm mt-1">Total Revenue</div>
              <div className="text-xs text-green-400 mt-3">+₹{stats.revenue?.today?.toLocaleString() || 0} today</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Admin Performance */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-white">👥 Admin Performance</h2>
                <Link href="/manager/admins" className="text-orange-400 text-sm hover:underline">
                  View All →
                </Link>
              </div>
              {stats.adminPerformance?.length > 0 ? (
                <div className="space-y-3">
                  {stats.adminPerformance.slice(0, 5).map((admin, i) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {admin.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${ADMIN_STATUS_COLORS[admin.status]}`}></span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{admin.name}</div>
                          <div className="text-xs text-white/50">{admin.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{admin.completedOrders || 0}</div>
                        <div className="text-xs text-white/50">orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">👤</span>
                  <p className="text-white/50">No admins registered yet</p>
                  <Link href="/admin/register" className="text-orange-400 text-sm hover:underline mt-2 inline-block">
                    Add first admin →
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Requests */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-white">📋 Recent Requests</h2>
                <Link href="/manager/requests" className="text-orange-400 text-sm hover:underline">
                  View All →
                </Link>
              </div>
              {stats.recentRequests?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <div className="font-medium text-white">{req.name}</div>
                        <div className="text-xs text-white/50">
                          {new Date(req.createdAt).toLocaleString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-xs rounded-full border ${STATUS_COLORS[req.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {req.status?.replace(/_/g, ' ')}
                        </span>
                        {req.pricing?.total && (
                          <div className="text-sm font-bold text-green-400 mt-2">₹{req.pricing.total}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📭</span>
                  <p className="text-white/50">No requests yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="font-bold text-lg text-white mb-4">⚡ Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/manager/admins" className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/10 hover:border-orange-500/50 hover:bg-white/15 transition-all group text-center">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</div>
                <div className="font-medium text-white">Manage Admins</div>
                <div className="text-xs text-white/50">View & edit</div>
              </Link>
              <Link href="/manager/requests" className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/10 hover:border-orange-500/50 hover:bg-white/15 transition-all group text-center">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</div>
                <div className="font-medium text-white">All Requests</div>
                <div className="text-xs text-white/50">Browse & filter</div>
              </Link>
              <Link href="/admin/register" target="_blank" className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/10 hover:border-green-500/50 hover:bg-white/15 transition-all group text-center">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">➕</div>
                <div className="font-medium text-white">Add Admin</div>
                <div className="text-xs text-white/50">Register new</div>
              </Link>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-5 border border-white/5 text-center opacity-50 cursor-not-allowed">
                <div className="text-3xl mb-2">📈</div>
                <div className="font-medium text-white">Analytics</div>
                <div className="text-xs text-white/50">Coming soon</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">❌</span>
          <p className="text-white/60">Failed to load dashboard data</p>
          <button onClick={fetchStats} className="mt-4 text-orange-400 hover:underline">
            Try again
          </button>
        </div>
      )}
    </ManagerLayout>
  );
}
