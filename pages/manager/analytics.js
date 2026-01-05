import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ManagerLayout from '../../components/ManagerLayout';
import toast from 'react-hot-toast';

export default function ManagerAnalytics() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('managerToken');
      if (!token) {
        router.replace('/manager');
        return;
      }
    }
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/manager/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManagerLayout title="Analytics" subtitle="Platform performance insights">
      {/* Time Range Selector */}
      <div className="flex gap-2 mb-8">
        {[
          { label: 'Today', value: 'today' },
          { label: '7 Days', value: '7days' },
          { label: '30 Days', value: '30days' },
          { label: 'All Time', value: 'all' },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setTimeRange(item.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              timeRange === item.value
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <p className="text-white/60">Loading analytics...</p>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
              <div className="text-blue-400 text-sm font-medium mb-2">Total Orders</div>
              <div className="text-4xl font-bold text-white">{stats.requests?.total || 0}</div>
              <div className="text-blue-400/60 text-sm mt-2">+{stats.requests?.today || 0} today</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
              <div className="text-green-400 text-sm font-medium mb-2">Revenue</div>
              <div className="text-4xl font-bold text-white">₹{(stats.revenue?.total || 0).toLocaleString()}</div>
              <div className="text-green-400/60 text-sm mt-2">+₹{(stats.revenue?.today || 0).toLocaleString()} today</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
              <div className="text-purple-400 text-sm font-medium mb-2">Active Admins</div>
              <div className="text-4xl font-bold text-white">{stats.admins?.available || 0}</div>
              <div className="text-purple-400/60 text-sm mt-2">{stats.admins?.total || 0} total registered</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20">
              <div className="text-orange-400 text-sm font-medium mb-2">Pending Orders</div>
              <div className="text-4xl font-bold text-white">{stats.requests?.pending || 0}</div>
              <div className="text-orange-400/60 text-sm mt-2">Needs attention</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Order Status Distribution */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-white text-lg mb-6">📊 Order Status Distribution</h3>
              <div className="space-y-4">
                {[
                  { label: 'Delivered', count: stats.requests?.delivered || 0, color: 'bg-green-500', max: stats.requests?.total || 1 },
                  { label: 'In Progress', count: stats.requests?.pending || 0, color: 'bg-yellow-500', max: stats.requests?.total || 1 },
                  { label: 'New', count: stats.requests?.new || 0, color: 'bg-blue-500', max: stats.requests?.total || 1 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/70">{item.label}</span>
                      <span className="text-white font-medium">{item.count}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min((item.count / item.max) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Status */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-white text-lg mb-6">👥 Admin Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/20 rounded-xl">
                  <div className="text-3xl font-bold text-green-400">{stats.admins?.available || 0}</div>
                  <div className="text-green-400/70 text-sm mt-1">Available</div>
                </div>
                <div className="text-center p-4 bg-yellow-500/20 rounded-xl">
                  <div className="text-3xl font-bold text-yellow-400">{stats.admins?.busy || 0}</div>
                  <div className="text-yellow-400/70 text-sm mt-1">Busy</div>
                </div>
                <div className="text-center p-4 bg-gray-500/20 rounded-xl">
                  <div className="text-3xl font-bold text-gray-400">{stats.admins?.offline || 0}</div>
                  <div className="text-gray-400/70 text-sm mt-1">Offline</div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Total Capacity</span>
                  <span className="text-white font-bold">{stats.admins?.total || 0} admins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-white text-lg mb-6">🏆 Top Performing Admins</h3>
            {stats.adminPerformance?.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.adminPerformance.slice(0, 6).map((admin, index) => (
                  <div key={admin.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {admin.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      {index < 3 && (
                        <span className="absolute -top-1 -right-1 text-lg">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{admin.name}</div>
                      <div className="text-sm text-white/50">{admin.completedOrders || 0} orders completed</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">📊</span>
                <p className="text-white/50">No performance data yet</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">❌</span>
          <p className="text-white/60">Failed to load analytics</p>
          <button onClick={fetchStats} className="mt-4 text-orange-400 hover:underline">
            Try again
          </button>
        </div>
      )}
    </ManagerLayout>
  );
}
