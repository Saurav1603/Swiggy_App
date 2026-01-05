import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import io from 'socket.io-client';
import AdminOrderPopup from '../../components/AdminOrderPopup';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [socket, setSocket] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      const id = localStorage.getItem('adminId');
      const name = localStorage.getItem('adminName');

      if (!token || !id) {
        router.replace('/admin/login');
        return;
      }

      setAdminId(id);
      setAdminName(name || 'Admin');
      setCheckingAuth(false);
    }
  }, [router]);

  // Initialize Socket.IO and fetch data
  useEffect(() => {
    if (!adminId) return;

    fetchStats();

    const s = io({
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join_admin', adminId);
      toast.success('Connected to notifications', { duration: 2000 });
    });

    s.on('disconnect', () => setIsConnected(false));

    s.on('NEW_ORDER', (payload) => {
      setIncoming(prev => {
        if (prev.find(o => o.orderId === payload.orderId)) return prev;
        return [...prev, payload];
      });
      try { new Audio('/notification.mp3').play().catch(() => {}); } catch (e) {}
    });

    s.on('ORDER_ACCEPTED', ({ orderId, adminId: acceptedBy }) => {
      setIncoming(prev => prev.filter(o => o.orderId !== orderId));
      if (acceptedBy === adminId) {
        toast.success('🎉 Order accepted!');
        fetchStats();
      }
    });

    s.on('ORDER_EXPIRED', ({ orderId }) => {
      setIncoming(prev => prev.filter(o => o.orderId !== orderId));
    });

    const statsInterval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(statsInterval);
      if (s) s.disconnect();
    };
  }, [adminId]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/earnings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setRecentOrders(data.recentOrders || []);
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const handleOrderDecision = useCallback(async (action, orderId) => {
    if (!adminId || !orderId) return;

    try {
      if (action === 'accept') {
        const res = await fetch(`/api/orders/${orderId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId })
        });

        if (res.ok) {
          toast.success('✅ Order accepted!');
          setIncoming(prev => prev.filter(o => o.orderId !== orderId));
          fetchStats();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Failed to accept order');
          setIncoming(prev => prev.filter(o => o.orderId !== orderId));
        }
      } else if (action === 'decline' || action === 'timeout') {
        await fetch(`/api/orders/${orderId}/decline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId })
        });
        setIncoming(prev => prev.filter(o => o.orderId !== orderId));
        if (action === 'timeout') toast('⏰ Order timed out', { icon: '⏰' });
      } else if (action === 'taken') {
        setIncoming(prev => prev.filter(o => o.orderId !== orderId));
      }
    } catch (err) {
      toast.error('Network error');
    }
  }, [adminId]);

  const handleLogout = async () => {
    if (adminId) {
      try {
        await fetch(`/api/manager/admins/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'offline' })
        });
      } catch (e) {}
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminName');
    if (socket) socket.disconnect();
    router.replace('/admin/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin text-3xl">⏳</div>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      isConnected={isConnected} 
      onLogout={handleLogout}
      adminName={adminName}
    >
      <div className="animate-fadeIn">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Welcome back, {adminName}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your overview for today</p>
        </div>

        {/* Incoming Orders Alert */}
        {incoming.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-xl shadow-orange-500/30 text-white animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-3xl animate-bounce">🔔</span>
              </div>
              <div>
                <p className="font-bold text-xl">
                  {incoming.length} New Order{incoming.length > 1 ? 's' : ''} Waiting!
                </p>
                <p className="text-orange-100">Accept quickly before they expire</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
                <p className="text-3xl font-extrabold text-gray-900">₹{stats?.totalEarnings || 0}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                ✓ All time
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Completed</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats?.deliveredCount || 0}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                Delivered orders
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">In Progress</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats?.pendingCount || 0}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full">
                Active orders
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/admin/orders" 
              className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:border-orange-200 hover:scale-[1.02] transition-all group"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                <span className="text-2xl">📋</span>
              </div>
              <p className="font-semibold text-gray-800">My Orders</p>
              <p className="text-xs text-gray-500 mt-1">View & manage</p>
            </Link>

            <Link 
              href="/admin/settings" 
              className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:border-orange-200 hover:scale-[1.02] transition-all group"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                <span className="text-2xl">⚙️</span>
              </div>
              <p className="font-semibold text-gray-800">Settings</p>
              <p className="text-xs text-gray-500 mt-1">Payment info</p>
            </Link>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 opacity-60 cursor-not-allowed">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <p className="font-semibold text-gray-600">Analytics</p>
              <p className="text-xs text-gray-400 mt-1">Coming soon</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 opacity-60 cursor-not-allowed">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <span className="text-2xl">💬</span>
              </div>
              <p className="font-semibold text-gray-600">Support</p>
              <p className="text-xs text-gray-400 mt-1">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
              View All <span>→</span>
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📭</span>
              </div>
              <p className="text-gray-800 font-semibold mb-1">No orders yet</p>
              <p className="text-gray-500 text-sm">Accept an order to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/requests/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-orange-50/50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    order.status === 'DELIVERED' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {order.status === 'DELIVERED' ? '✅' : '⏳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{order.name}</p>
                    <p className="text-sm text-gray-500">{order.status.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{order.total || 0}</p>
                  </div>
                  <span className="text-gray-300">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Order Popups */}
        <div className="fixed bottom-4 right-4 z-50 space-y-4">
          {incoming.map((ord) => (
            <AdminOrderPopup
              key={ord.orderId}
              order={ord}
              socket={socket}
              onDecision={handleOrderDecision}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
