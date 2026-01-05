import Layout from '../../components/Layout';
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

    // Initialize Socket.IO connection
    const s = io({
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on('connect', () => {
      console.log('✅ Socket connected:', s.id);
      setIsConnected(true);
      s.emit('join_admin', adminId);
      toast.success('Connected to notifications', { duration: 2000 });
    });

    s.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    s.on('connect_error', (error) => {
      console.log('⚠️ Socket connection error:', error.message);
    });

    s.on('NEW_ORDER', (payload) => {
      console.log('🔔 NEW ORDER RECEIVED:', payload);
      setIncoming(prev => {
        if (prev.find(o => o.orderId === payload.orderId)) return prev;
        return [...prev, payload];
      });
      try {
        new Audio('/notification.mp3').play().catch(() => {});
      } catch (e) {}
    });

    s.on('ORDER_ACCEPTED', ({ orderId, adminId: acceptedBy }) => {
      console.log('Order accepted:', orderId, 'by:', acceptedBy);
      setIncoming(prev => prev.filter(o => o.orderId !== orderId));
      if (acceptedBy === adminId) {
        toast.success('🎉 Order accepted! Go to My Orders to manage it.');
        fetchStats();
      }
    });

    s.on('ORDER_EXPIRED', ({ orderId }) => {
      console.log('Order expired:', orderId);
      setIncoming(prev => prev.filter(o => o.orderId !== orderId));
    });

    // Refresh stats periodically
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
        if (action === 'timeout') {
          toast('⏰ Order timed out', { icon: '⏰' });
        }
      } else if (action === 'taken') {
        setIncoming(prev => prev.filter(o => o.orderId !== orderId));
      }
    } catch (err) {
      console.error('Order decision error:', err);
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
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome, {adminName}! 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's your overview</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Incoming Orders Alert */}
        {incoming.length > 0 && (
          <div className="mb-6 card p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">🔔</span>
              <div>
                <p className="font-bold text-orange-700 text-lg">
                  {incoming.length} New Order{incoming.length > 1 ? 's' : ''} Waiting!
                </p>
                <p className="text-orange-600 text-sm">Accept quickly before they expire</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center bg-gradient-to-br from-green-50 to-white">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold text-green-600">₹{stats?.totalEarnings || 0}</div>
            <div className="text-gray-500 mt-1">Total Earnings</div>
          </div>
          <div className="card p-6 text-center bg-gradient-to-br from-blue-50 to-white">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-blue-600">{stats?.deliveredCount || 0}</div>
            <div className="text-gray-500 mt-1">Completed</div>
          </div>
          <div className="card p-6 text-center bg-gradient-to-br from-orange-50 to-white">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-3xl font-bold text-orange-600">{stats?.pendingCount || 0}</div>
            <div className="text-gray-500 mt-1">In Progress</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/orders" className="card p-4 text-center hover:shadow-lg transition-shadow group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</div>
            <p className="font-medium text-gray-700">My Orders</p>
            <p className="text-xs text-gray-500">View & manage</p>
          </Link>
          <Link href="/admin/settings" className="card p-4 text-center hover:shadow-lg transition-shadow group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
            <p className="font-medium text-gray-700">Settings</p>
            <p className="text-xs text-gray-500">Payment info</p>
          </Link>
          <div className="card p-4 text-center bg-gray-50 cursor-not-allowed opacity-60">
            <div className="text-3xl mb-2">📊</div>
            <p className="font-medium text-gray-700">Analytics</p>
            <p className="text-xs text-gray-500">Coming soon</p>
          </div>
          <div className="card p-4 text-center bg-gray-50 cursor-not-allowed opacity-60">
            <div className="text-3xl mb-2">💬</div>
            <p className="font-medium text-gray-700">Support</p>
            <p className="text-xs text-gray-500">Coming soon</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-5xl mb-4 block">📭</span>
              <p className="text-gray-500">No orders yet. Accept an order to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, i) => (
                <div key={order.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    order.status === 'DELIVERED' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {order.status === 'DELIVERED' ? '✅' : '⏳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{order.name}</p>
                    <p className="text-sm text-gray-500">{order.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{order.total || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Popups - Fixed position */}
        <div className="fixed bottom-4 right-4 z-50 space-y-4">
          {incoming.map((ord, index) => (
            <AdminOrderPopup
              key={ord.orderId}
              order={ord}
              socket={socket}
              onDecision={handleOrderDecision}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
