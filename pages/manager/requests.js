import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  WAITING_FOR_PRICE: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: '⏳' },
  PRICE_SENT: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700', icon: '💰' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-orange-100 text-orange-700', icon: '📱' },
  PAYMENT_RECEIVED: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: '✅' },
  ORDER_PLACED: { label: 'Ordered', color: 'bg-purple-100 text-purple-700', icon: '🍔' },
  DELIVERED: { label: 'Delivered', color: 'bg-gray-100 text-gray-700', icon: '🎉' }
}

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'WAITING_FOR_PRICE' },
  { label: 'Awaiting Payment', value: 'PRICE_SENT' },
  { label: 'Paid', value: 'PAYMENT_RECEIVED' },
  { label: 'Ordered', value: 'ORDER_PLACED' },
  { label: 'Delivered', value: 'DELIVERED' }
]

export default function ManageRequests() {
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [selectedRequest, setSelectedRequest] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('managerToken')
      if (!token) {
        router.replace('/manager')
        return
      }
    }
    fetchRequests()
  }, [filter])

  const fetchRequests = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (filter !== 'all') params.append('status', filter)
      if (search) params.append('search', search)

      const res = await fetch(`/api/manager/requests?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Fetch requests error:', err)
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchRequests(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchRequests(newPage)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString()
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📋 All Requests</h1>
            <p className="text-gray-500">{pagination.total} total requests</p>
          </div>
          <div className="flex gap-2">
            <Link href="/manager" className="btn-secondary">← Dashboard</Link>
            <Link href="/manager/admins" className="btn-secondary">Manage Admins</Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
              {FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all
                    ${filter === f.value 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
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
                className="input-field min-w-[200px]"
              />
              <button type="submit" className="btn-primary">Search</button>
            </form>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-2">
            <div className="card">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl block mb-2">📭</span>
                  No requests found
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {requests.map(req => (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`p-4 cursor-pointer transition-all hover:bg-gray-50
                          ${selectedRequest?.id === req.id ? 'bg-orange-50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{req.name}</div>
                            <div className="text-sm text-gray-500">{req.phone}</div>
                          </div>
                          <span className={`px-3 py-1 text-xs rounded-full ${STATUS_CONFIG[req.status]?.color || 'bg-gray-100'}`}>
                            {STATUS_CONFIG[req.status]?.icon} {STATUS_CONFIG[req.status]?.label || req.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">{formatDate(req.createdAt)}</span>
                          {req.pricing?.total && (
                            <span className="font-medium text-green-600">₹{req.pricing.total}</span>
                          )}
                        </div>
                        {req.orders?.[0]?.assignedAdmin && (
                          <div className="mt-2 text-xs text-gray-500">
                            Assigned to: <span className="font-medium">{req.orders[0].assignedAdmin.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 p-4 border-t">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                      >
                        ← Prev
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
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
            <div className="card p-5 sticky top-4">
              {selectedRequest ? (
                <>
                  <h2 className="font-semibold text-lg mb-4">Request Details</h2>

                  {/* Status Badge */}
                  <div className="text-center mb-4">
                    <span className={`inline-block px-4 py-2 text-sm rounded-full ${STATUS_CONFIG[selectedRequest.status]?.color || 'bg-gray-100'}`}>
                      {STATUS_CONFIG[selectedRequest.status]?.icon} {STATUS_CONFIG[selectedRequest.status]?.label || selectedRequest.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium mb-2">👤 Customer</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-500">Name:</span> {selectedRequest.name}</div>
                      <div><span className="text-gray-500">Phone:</span> {selectedRequest.phone}</div>
                      <div><span className="text-gray-500">Address:</span> {selectedRequest.address}</div>
                    </div>
                  </div>

                  {/* Pricing */}
                  {selectedRequest.pricing && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="font-medium mb-2">💰 Pricing</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Food Price</span>
                          <span>₹{selectedRequest.pricing.foodPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Delivery Fee</span>
                          <span>₹{selectedRequest.pricing.deliveryFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Platform Fee</span>
                          <span>₹{selectedRequest.pricing.platformFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Service Charge</span>
                          <span>₹{selectedRequest.pricing.serviceCharge}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2">
                          <span>Total</span>
                          <span className="text-green-600">₹{selectedRequest.pricing.total}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  {selectedRequest.payment && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="font-medium mb-2">💳 Payment</h3>
                      <div className="space-y-1 text-sm">
                        <div><span className="text-gray-500">UTR:</span> {selectedRequest.payment.utrNumber}</div>
                        <div><span className="text-gray-500">Paid At:</span> {formatDate(selectedRequest.payment.paidAt)}</div>
                        <div>
                          <span className="text-gray-500">Verified:</span>{' '}
                          {selectedRequest.payment.verified ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tracking */}
                  {selectedRequest.tracking && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="font-medium mb-2">🚚 Tracking</h3>
                      <div className="space-y-1 text-sm">
                        {selectedRequest.tracking.partnerName && (
                          <div><span className="text-gray-500">Partner:</span> {selectedRequest.tracking.partnerName}</div>
                        )}
                        {selectedRequest.tracking.eta && (
                          <div><span className="text-gray-500">ETA:</span> {selectedRequest.tracking.eta}</div>
                        )}
                        {selectedRequest.tracking.trackingUrl && (
                          <a href={selectedRequest.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Tracking →
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Admin */}
                  {selectedRequest.orders?.[0]?.assignedAdmin && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="font-medium mb-2">👨‍💼 Assigned Admin</h3>
                      <div className="text-sm">
                        <div>{selectedRequest.orders[0].assignedAdmin.name}</div>
                        <div className="text-gray-500">{selectedRequest.orders[0].assignedAdmin.email}</div>
                      </div>
                    </div>
                  )}

                  {/* Notes & Remarks */}
                  {(selectedRequest.notes || selectedRequest.remarks) && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="font-medium mb-2">📝 Notes</h3>
                      <div className="text-sm text-gray-600">
                        {selectedRequest.notes && <p>{selectedRequest.notes}</p>}
                        {selectedRequest.remarks && <p className="mt-2 italic">{selectedRequest.remarks}</p>}
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="text-xs text-gray-500 text-center">
                    ID: {selectedRequest.id}<br />
                    Created: {formatDate(selectedRequest.createdAt)}
                  </div>

                  {/* Admin Link */}
                  <Link
                    href={`/admin/requests/${selectedRequest.id}`}
                    className="block w-full text-center mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm"
                  >
                    View in Admin Panel →
                  </Link>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">👆</span>
                  Select a request to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
