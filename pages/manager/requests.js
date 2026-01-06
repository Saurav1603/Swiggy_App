import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ManagerLayout from '../../components/ManagerLayout';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  WAITING_FOR_PRICE: { label: 'New', color: 'bg-blue-500/20', text: 'text-blue-400', icon: '⏳' },
  PRICE_SENT: { label: 'Awaiting Payment', color: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '💰' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-orange-500/20', text: 'text-orange-400', icon: '📱' },
  PAYMENT_RECEIVED: { label: 'Paid', color: 'bg-green-500/20', text: 'text-green-400', icon: '✅' },
  ORDER_PLACED: { label: 'Ordered', color: 'bg-purple-500/20', text: 'text-purple-400', icon: '🍔' },
  DELIVERED: { label: 'Delivered', color: 'bg-gray-500/20', text: 'text-gray-400', icon: '🎉' }
};

const FILTERS = [
  { label: 'All', value: 'all', icon: '📋' },
  { label: 'New', value: 'WAITING_FOR_PRICE', icon: '⏳' },
  { label: 'Awaiting', value: 'PRICE_SENT', icon: '💰' },
  { label: 'Paid', value: 'PAYMENT_RECEIVED', icon: '✅' },
  { label: 'Ordered', value: 'ORDER_PLACED', icon: '🍔' },
  { label: 'Delivered', value: 'DELIVERED', icon: '🎉' }
];

export default function ManageRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('managerToken');
      if (!token) {
        router.replace('/manager');
        return;
      }
    }
    fetchRequests();
  }, [filter]);

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter !== 'all') params.append('status', filter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/manager/requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRequests(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchRequests(newPage);
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

  return (
    <ManagerLayout title="All Requests" subtitle={`${pagination.total} total requests`}>
      {/* Filters & Search */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                  filter === f.value
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, phone, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              🔍
            </button>
          </form>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-white/60">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-5xl mb-4 block">📭</span>
                <p className="text-white/60">No requests found</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/10">
                  {requests.map((req) => {
                    const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.WAITING_FOR_PRICE;
                    const assignedAdmin = req.orders?.[0]?.assignedAdmin;
                    return (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`p-5 cursor-pointer transition-all hover:bg-white/5 ${
                          selectedRequest?.id === req.id ? 'bg-orange-500/10 border-l-4 border-orange-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${statusConfig.color}`}>
                              {statusConfig.icon}
                            </div>
                            <div>
                              <div className="font-bold text-white">{req.name}</div>
                              <div className="text-sm text-white/50 truncate max-w-xs">{req.address}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-xs text-white/40">{formatDate(req.createdAt)}</div>
                                {assignedAdmin && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                    👤 {assignedAdmin.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 text-xs rounded-full ${statusConfig.color} ${statusConfig.text}`}>
                              {statusConfig.label}
                            </span>
                            {req.pricing?.total && (
                              <div className="text-lg font-bold text-green-400 mt-2">₹{req.pricing.total}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="p-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-4 py-2 rounded-lg ${
                        pagination.page === 1 ? 'bg-white/5 text-white/30' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      ← Previous
                    </button>
                    <span className="text-white/60">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-4 py-2 rounded-lg ${
                        pagination.page === pagination.totalPages ? 'bg-white/5 text-white/30' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Request Details Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 sticky top-24">
            {selectedRequest ? (
              <>
                {/* Status Header */}
                <div className={`p-6 border-b border-white/10 ${STATUS_CONFIG[selectedRequest.status]?.color || 'bg-white/10'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{STATUS_CONFIG[selectedRequest.status]?.icon}</span>
                    <div>
                      <div className={`font-bold ${STATUS_CONFIG[selectedRequest.status]?.text}`}>
                        {STATUS_CONFIG[selectedRequest.status]?.label || selectedRequest.status}
                      </div>
                      <div className="text-white/60 text-sm">Current Status</div>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-6 border-b border-white/10">
                  <h3 className="font-bold text-white mb-4">👤 Customer Details</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-white/50 text-xs">Name</div>
                      <div className="text-white font-medium">{selectedRequest.name}</div>
                    </div>
                    {selectedRequest.phone && (
                      <div>
                        <div className="text-white/50 text-xs">Phone</div>
                        <div className="text-white font-medium">{selectedRequest.phone}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-white/50 text-xs">Address</div>
                      <div className="text-white text-sm">{selectedRequest.address}</div>
                    </div>
                    {selectedRequest.notes && (
                      <div>
                        <div className="text-white/50 text-xs">Notes</div>
                        <div className="text-white text-sm">{selectedRequest.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Info */}
                <div className="p-6 border-b border-white/10">
                  <h3 className="font-bold text-white mb-4">🍔 Order Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/50">Order ID</span>
                      <span className="text-white font-mono text-xs">{selectedRequest.id.slice(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Created</span>
                      <span className="text-white">{formatDate(selectedRequest.createdAt)}</span>
                    </div>
                    {selectedRequest.pricing?.total && (
                      <div className="flex justify-between">
                        <span className="text-white/50">Total</span>
                        <span className="text-green-400 font-bold text-lg">₹{selectedRequest.pricing.total}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Admin */}
                {selectedRequest.orders?.[0]?.assignedAdmin && (
                  <div className="p-6 border-b border-white/10">
                    <h3 className="font-bold text-white mb-4">👨‍💼 Assigned Admin</h3>
                    <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedRequest.orders[0].assignedAdmin.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{selectedRequest.orders[0].assignedAdmin.name}</div>
                        <div className="text-white/50 text-sm">{selectedRequest.orders[0].assignedAdmin.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cart Image */}
                {selectedRequest.cartImageUrl && (
                  <div className="p-6 border-b border-white/10">
                    <h3 className="font-bold text-white mb-4">🛒 Cart Screenshot</h3>
                    <img
                      src={selectedRequest.cartImageUrl}
                      alt="Cart"
                      className="w-full rounded-xl border border-white/10"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="p-6">
                  <Link
                    href={`/admin/requests/${selectedRequest.id}`}
                    target="_blank"
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all text-center block"
                  >
                    Open Full Details →
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <span className="text-5xl mb-4 block">👈</span>
                <p className="text-white/60">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
