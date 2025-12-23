import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  WAITING_FOR_PRICE: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: '⏳' },
  PRICE_SENT: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700', icon: '💰' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-orange-100 text-orange-700', icon: '📱' },
  PAYMENT_RECEIVED: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: '✅' },
  ORDER_PLACED: { label: 'Ordered', color: 'bg-purple-100 text-purple-700', icon: '🍔' },
  DELIVERED: { label: 'Delivered', color: 'bg-gray-100 text-gray-700', icon: '🎉' }
};

const FILTERS = [
  { label: 'All', value: '', icon: '📋' },
  { label: 'New', value: 'WAITING_FOR_PRICE', icon: '⏳' },
  { label: 'Awaiting Payment', value: 'PRICE_SENT', icon: '💰' },
  { label: 'Paid', value: 'PAYMENT_RECEIVED', icon: '✅' },
  { label: 'Ordered', value: 'ORDER_PLACED', icon: '🍔' },
  { label: 'Delivered', value: 'DELIVERED', icon: '🎉' }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  // Dashboard state
  const [stats, setStats] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [saving, setSaving] = useState(false);
  // Orders state
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(true);
  const seenOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('adminToken'));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchUpi();
      fetchRequests();
    }
  }, [token, filter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed');
  localStorage.setItem('adminToken', json.token);
  setToken(json.token);
  toast.success('Welcome back!');
  router.replace('/admin');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setEmail('');
    setPassword('');
    toast.success('Logged out');
  };

  const fetchStats = async () => {
    const res = await fetch('/api/admin/earnings');
    if (res.ok) setStats(await res.json());
  };

  const fetchUpi = async () => {
    const res = await fetch('/api/admin/payment-info');
    if (res.ok) {
      const data = await res.json();
      setUpiId(data.upiId || '');
      setQrUrl(data.qrUrl || '');
    }
  };

  const handleQrChange = (e) => {
    if (e.target.files[0]) setQrFile(e.target.files[0]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    let uploadedQrUrl = qrUrl;
    if (qrFile) {
      const form = new FormData();
      form.append('file', qrFile);
      const res = await fetch('/api/admin/upload-qr', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) uploadedQrUrl = data.url;
      else toast.error(data.error || 'QR upload failed');
    }
    const res = await fetch('/api/admin/payment-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upiId, qrUrl: uploadedQrUrl })
    });
    if (res.ok) {
      toast.success('Payment info updated!');
      setQrUrl(uploadedQrUrl);
      setQrFile(null);
    } else {
      toast.error('Failed to update payment info');
    }
    setSaving(false);
  };

  const fetchRequests = async (showLoading = true) => {
    if (showLoading) setOrdersLoading(true);
    const url = filter ? `/api/admin/requests?status=${filter}` : '/api/admin/requests';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      setToken(null);
      router.replace('/admin/login');
      return;
    }
    const newRequests = await res.json();
    if (!isFirstLoadRef.current) {
      const unseenOrders = newRequests.filter(r => !seenOrderIdsRef.current.has(r.id));
      if (unseenOrders.length > 0) {
        toast.success(`🆕 ${unseenOrders.length} new order${unseenOrders.length > 1 ? 's' : ''} received!`, { duration: 4000 });
        playNotificationSound();
      }
    }
    seenOrderIdsRef.current = new Set(newRequests.map(r => r.id));
    isFirstLoadRef.current = false;
    setRequests(newRequests);
    if (showLoading) setOrdersLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchRequests(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [filter, token]);

  const playNotificationSound = () => {
    const audio = new window.Audio('/notification.mp3');
    audio.play();
  };

  // Helper for date formatting
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto animate-fadeIn">
        {!token ? (
          <div className="max-w-sm mx-auto animate-fadeIn">
            <div className="text-center mb-8">
              <span className="text-5xl mb-4 block">🔐</span>
              <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
              <p className="text-gray-500 mt-2">Sign in to manage orders</p>
            </div>
            <div className="card p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
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
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Panel</h1>
                <div className="flex items-center gap-3">
                  <p className="text-gray-500">{requests.length} orders</p>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Auto-refresh on
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/admin/dashboard" className="btn-secondary">Dashboard</Link>
                <Link href="/admin/settings" className="btn-secondary">Settings</Link>
                <button onClick={handleLogout} className="btn-secondary">Logout</button>
              </div>
            </div>
            {/* Orders List Only */}
            <div className="mb-8">
              <h2 className="font-semibold mb-4">All Orders</h2>
              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      filter === f.value 
                        ? 'bg-orange-500 text-white shadow-lg' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
                    }`}
                  >
                    <span>{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>
              {/* Request List */}
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="card p-12 text-center">
                  <span className="text-5xl mb-4 block">📄</span>
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((r, i) => {
                    const statusConfig = STATUS_CONFIG[r.status] || {};
                    return (
                      <Link 
                        key={r.id} 
                        href={`/admin/requests/${r.id}`}
                        className="card p-4 flex items-center gap-4 hover:shadow-xl transition-shadow animate-slideUp block"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Status Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${statusConfig.color}`}>
                          {statusConfig.icon}
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                          <p className="text-sm text-gray-500 truncate">{r.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="text-gray-300">→</div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
