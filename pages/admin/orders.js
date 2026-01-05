import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  WAITING_FOR_PRICE: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: '⏳', description: 'Set price for customer' },
  PRICE_SENT: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700', icon: '💰', description: 'Waiting for customer payment' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-orange-100 text-orange-700', icon: '📱', description: 'Verifying payment' },
  PAYMENT_RECEIVED: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: '✅', description: 'Place order on Swiggy' },
  ORDER_PLACED: { label: 'Ordered', color: 'bg-purple-100 text-purple-700', icon: '🍔', description: 'Waiting for delivery' },
  DELIVERED: { label: 'Delivered', color: 'bg-gray-100 text-gray-700', icon: '🎉', description: 'Completed' }
};

const FILTERS = [
  { label: 'All', value: '', icon: '📋' },
  { label: 'New', value: 'WAITING_FOR_PRICE', icon: '⏳' },
  { label: 'Awaiting Payment', value: 'PRICE_SENT', icon: '💰' },
  { label: 'Paid', value: 'PAYMENT_RECEIVED', icon: '✅' },
  { label: 'Ordered', value: 'ORDER_PLACED', icon: '🍔' },
  { label: 'Delivered', value: 'DELIVERED', icon: '🎉' }
];

export default function AdminOrders() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [token, setToken] = useState(null);
  const seenOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Check authentication
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const adminId = localStorage.getItem('adminId');
    
    if (!storedToken || !adminId) {
      router.replace('/admin/login');
      return;
    }
    
    setToken(storedToken);
    setCheckingAuth(false);
  }, [router]);

  // Fetch orders when authenticated
  useEffect(() => {
    if (token) {
      fetchRequests();
    }
  }, [token, filter]);

  // Auto-refresh orders
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchRequests(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [filter, token]);

  const fetchRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const url = filter ? `/api/admin/requests?status=${filter}` : '/api/admin/requests';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminId');
        router.replace('/admin/login');
        return;
      }
      
      const newRequests = await res.json();
      
      // Show notification for new orders (not on first load)
      if (!isFirstLoadRef.current && Array.isArray(newRequests)) {
        const unseenOrders = newRequests.filter(r => !seenOrderIdsRef.current.has(r.id));
        if (unseenOrders.length > 0) {
          toast.success(`🆕 ${unseenOrders.length} new order${unseenOrders.length > 1 ? 's' : ''}!`);
        }
      }
      
      if (Array.isArray(newRequests)) {
        seenOrderIdsRef.current = new Set(newRequests.map(r => r.id));
        setRequests(newRequests);
      }
      
      isFirstLoadRef.current = false;
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to load orders');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Orders 📋</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500">{requests.length} order{requests.length !== 1 ? 's' : ''}</p>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Auto-refresh on
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/dashboard" className="btn-secondary text-sm">
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.value 
                  ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="card p-16 text-center">
            <span className="text-6xl mb-4 block">📭</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Orders Found</h2>
            <p className="text-gray-500 mb-4">
              {filter ? 'No orders match this filter.' : 'Accept orders from your dashboard to see them here.'}
            </p>
            <Link href="/admin/dashboard" className="btn-primary inline-block">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r, i) => {
              const statusConfig = STATUS_CONFIG[r.status] || {};
              return (
                <Link 
                  key={r.id} 
                  href={`/admin/requests/${r.id}`}
                  className="card p-5 flex items-center gap-4 hover:shadow-xl hover:scale-[1.01] transition-all animate-slideUp block"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Status Icon */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${statusConfig.color}`}>
                    {statusConfig.icon}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 truncate">{r.name}</p>
                      {r.pricing?.total && (
                        <span className="text-green-600 font-bold">₹{r.pricing.total}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-2">{r.address}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="text-gray-300 text-xl">→</div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        {requests.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const count = requests.filter(r => r.status === key).length;
              if (count === 0) return null;
              return (
                <div key={key} className={`card p-4 text-center ${config.color}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm">{config.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
