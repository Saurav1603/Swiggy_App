import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-purple-100 text-purple-800 border-purple-200',
      picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      accepted: '✅',
      preparing: '👨‍🍳',
      picked_up: '🛵',
      delivered: '📦',
      completed: '🎉',
      cancelled: '❌'
    };
    return icons[status] || '📋';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id?.toString().includes(searchTerm) ||
                         order.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    picked_up: orders.filter(o => o.status === 'picked_up').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  const filterButtons = [
    { key: 'all', label: 'All Orders', icon: '📋' },
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'accepted', label: 'Accepted', icon: '✅' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'picked_up', label: 'Picked Up', icon: '🛵' },
    { key: 'delivered', label: 'Delivered', icon: '📦' },
    { key: 'completed', label: 'Completed', icon: '🎉' },
    { key: 'cancelled', label: 'Cancelled', icon: '❌' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">Manage and track your assigned orders</p>
          </div>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by customer name, order ID, or restaurant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filterButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === btn.key
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{btn.icon}</span>
                <span>{btn.label}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  filter === btn.key ? 'bg-orange-600' : 'bg-gray-200'
                }`}>
                  {statusCounts[btn.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'You haven\'t received any orders yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => router.push(`/admin/requests/${order.id}`)}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Order Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {order.screenshotUrl ? (
                      <img 
                        src={order.screenshotUrl} 
                        alt="Order" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🍽️
                      </div>
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Restaurant</span>
                        <p className="font-medium text-gray-900 truncate">{order.restaurantName || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount</span>
                        <p className="font-medium text-orange-600">₹{order.totalAmount || order.estimatedTotal || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Items</span>
                        <p className="font-medium text-gray-900">{order.items?.length || 0} items</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date</span>
                        <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {orders.length > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white/80 text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white/80 text-sm">Completed</p>
                <p className="text-2xl font-bold">{statusCounts.completed + statusCounts.delivered}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white/80 text-sm">In Progress</p>
                <p className="text-2xl font-bold">{statusCounts.accepted + statusCounts.preparing + statusCounts.picked_up}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white/80 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">₹{orders.reduce((sum, o) => sum + (o.totalAmount || o.estimatedTotal || 0), 0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
