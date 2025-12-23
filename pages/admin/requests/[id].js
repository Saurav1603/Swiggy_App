import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'WAITING_FOR_PRICE', label: 'Waiting for Price', icon: '⏳' },
  { value: 'PRICE_SENT', label: 'Price Sent', icon: '💰' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending', icon: '📱' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received', icon: '✅' },
  { value: 'ORDER_PLACED', label: 'Order Placed', icon: '🍔' },
  { value: 'DELIVERED', label: 'Delivered', icon: '🎉' },
]

const PRICING_FIELDS = [
  { key: 'foodPrice', label: 'Total Food Price', icon: '🍕' },
]

export default function AdminRequestDetail() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seenPaymentId, setSeenPaymentId] = useState(null)
  const prevData = useRef(null)
  const isFirstLoad = useRef(true)
  const [remarks, setRemarks] = useState('')
  const [remarksLoading, setRemarksLoading] = useState(false)

  const [pricing, setPricing] = useState({ foodPrice: '' })
  const [tracking, setTracking] = useState({ trackingUrl: '' })

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null

  useEffect(() => {
    if (!token) {
      router.replace('/admin/login')
      return
    }
    if (id) fetchData()
  }, [id])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!token || !id) return
    const interval = setInterval(() => {
      fetchDataSilent()
    }, 10000)
    return () => clearInterval(interval)
  }, [id, token])

  const fetchDataSilent = async () => {
    const res = await fetch(`/api/admin/requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      router.replace('/admin/login')
      return
    }
    const json = await res.json()
    // Only show notifications after first load
    if (!isFirstLoad.current && prevData.current) {
      // New payment (new payment record)
      if (json.payment && json.payment.id !== prevData.current.payment?.id) {
        toast.success('💳 New payment submitted!', { duration: 4000 })
      }
      // UTR updated (same payment record, different UTR)
      if (
        json.payment &&
        prevData.current.payment &&
        json.payment.id === prevData.current.payment.id &&
        json.payment.utrNumber !== prevData.current.payment.utrNumber
      ) {
        toast.success('🔄 UTR updated by user!', { duration: 4000 })
      }
      // Status change
      if (prevData.current.status !== json.status) {
        toast.success(`📋 Status updated to: ${json.status.replace(/_/g, ' ')}`, { duration: 4000 })
      }
      // New/updated remarks
      if (prevData.current.remarks !== json.remarks && json.remarks) {
        toast.success('💬 New/updated remarks from user!', { duration: 4000 })
      }
      // New/updated tracking
      if (prevData.current.tracking?.trackingUrl !== json.tracking?.trackingUrl && json.tracking?.trackingUrl) {
        toast.success('🛵 Tracking info updated!', { duration: 4000 })
      }
    }
    prevData.current = json
    if (json.payment) {
      setSeenPaymentId(json.payment.id)
    }
    setData(json)
    if (json.pricing) {
      setPricing({ foodPrice: json.pricing.foodPrice })
    }
    if (json.tracking) {
      setTracking({ trackingUrl: json.tracking.trackingUrl || '' })
    }
    isFirstLoad.current = false
  }

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      router.replace('/admin/login')
      return
    }
    const json = await res.json()
    setData(json)
    // Set initial payment ID so we don't show notification for existing payment
    if (json.payment) {
      setSeenPaymentId(json.payment.id)
    }
    if (json.pricing) {
      setPricing({
        foodPrice: json.pricing.foodPrice,
      })
    }
    if (json.tracking) {
      setTracking({
        trackingUrl: json.tracking.trackingUrl || '',
      })
    }
    setLoading(false)
  }

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const savePricing = async () => {
    if (!pricing.foodPrice) {
      toast.error('Please enter the food price')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/admin/requests/${id}/pricing`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        foodPrice: parseFloat(pricing.foodPrice) || 0,
        deliveryFee: 0,
        platformFee: 0,
        serviceCharge: 0,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (res.ok) {
      toast.success('Pricing saved!')
      fetchData()
    } else {
      toast.error(json.error || 'Failed')
    }
  }

  const verifyPayment = async () => {
    setSaving(true)
    const res = await fetch(`/api/admin/requests/${id}/verify-payment`, {
      method: 'POST',
      headers: authHeaders,
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Payment verified!')
      fetchData()
    } else {
      const json = await res.json()
      toast.error(json.error || 'Failed')
    }
  }

  const saveTracking = async () => {
    setSaving(true)
    const res = await fetch(`/api/admin/requests/${id}/tracking`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(tracking),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Tracking saved!')
      fetchData()
    } else {
      toast.error('Failed')
    }
  }

  const updateStatus = async (status) => {
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success('Status updated!')
      fetchData()
    } else {
      toast.error('Failed')
    }
  }

  const calculateTotal = () => {
    return (parseFloat(pricing.foodPrice) || 0).toFixed(2)
  }

  // Fetch remarks when loading order
  useEffect(() => {
    if (id && token) fetchRemarks()
  }, [id, token])

  const fetchRemarks = async () => {
    setRemarksLoading(true)
    const res = await fetch(`/api/admin/requests/${id}/remarks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setRemarks(json.remarks || '')
    }
    setRemarksLoading(false)
  }

  const saveRemarks = async () => {
    setRemarksLoading(true)
    const res = await fetch(`/api/admin/requests/${id}/remarks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    })
    if (res.ok) {
      toast.success('Remarks updated!')
    } else {
      toast.error('Failed to update remarks')
    }
    setRemarksLoading(false)
  }

  if (loading || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      </Layout>
    )
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === data.status) || {}

  return (
    <Layout>
      <div className="animate-fadeIn">
        {/* Header - Improved for Mobile, Color, Font, Back Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-8 bg-orange-50/60 px-4 sm:px-6 py-4 rounded-2xl shadow-sm border border-orange-100 relative">
          <Link href="/admin" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-base px-3 py-2 rounded-lg bg-orange-100/80 shadow transition-all focus:outline-none focus:ring-2 focus:ring-orange-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-orange-700 tracking-tight truncate font-sans">{data.name}</h1>
            <span className="px-2 py-1 rounded bg-orange-100 text-xs font-mono text-orange-500 mt-1 sm:mt-0">{data.id}</span>
          </div>
          <span className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-md text-base whitespace-nowrap mt-3 sm:mt-0
            ${data.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
              data.status === 'PAYMENT_RECEIVED' ? 'bg-emerald-100 text-emerald-700' :
              'bg-orange-200 text-orange-700 animate-pulse'}`}>
            {currentStatus.icon} {currentStatus.label}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Customer Info */}
          <div className="space-y-4">
            {/* Customer Details */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>👤</span> Customer Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Name</span>
                  <p className="font-medium">{data.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Delivery Address</span>
                  <p className="font-medium whitespace-pre-line">{data.address}</p>
                </div>
                {data.notes && (
                  <div>
                    <span className="text-gray-500">Notes</span>
                    <p className="font-medium bg-yellow-50 p-2 rounded mt-1">{data.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Screenshot - Improved UI */}
            <div className="card p-6 bg-white border-2 border-orange-100 shadow-lg rounded-2xl flex flex-col items-center mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                <span role="img" aria-label="camera">📸</span> Cart Screenshot
              </h3>
              <div className="w-full flex justify-center items-center">
                <img
                  src={data.cartImageUrl}
                  alt="Cart"
                  className="max-w-xs max-h-80 object-contain rounded-xl border-2 border-gray-200 shadow-md cursor-zoom-in hover:scale-105 hover:shadow-xl transition-transform duration-200 bg-gray-50"
                  onClick={() => window.open(data.cartImageUrl, '_blank')}
                  title="Click to view full size"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center italic">Click the image to view in full size</p>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-4">
            {/* Pricing */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>💰</span> Set Pricing
              </h3>
              <div className="space-y-3">
                {PRICING_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <span className="text-lg w-8">{field.icon}</span>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">{field.label}</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={pricing[field.key]}
                        onChange={(e) => setPricing({ ...pricing, [field.key]: e.target.value })}
                        className="input-field py-2"
                      />
                    </div>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-orange-600">₹{calculateTotal()}</span>
                </div>
              </div>
              <button 
                onClick={savePricing} 
                disabled={saving}
                className="w-full btn-primary mt-4"
              >
                {saving ? 'Saving...' : '💰 Send Price to Customer'}
              </button>
            </div>

            {/* Payment Verification */}
            {data.payment && (
              <div className={`card p-5 ${data.payment.verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border-2`}>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📱</span> Payment Info
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">UTR Number</p>
                    <p className="font-mono font-medium">{data.payment.utrNumber}</p>
                  </div>
                  {data.payment.verified ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">✓ Verified</span>
                  ) : (
                    <button 
                      onClick={verifyPayment}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Verify Payment
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tracking */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🛵</span> Tracking Info
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Swiggy Tracking URL</label>
                  <input
                    placeholder="https://www.swiggy.com/track/..."
                    value={tracking.trackingUrl}
                    onChange={(e) => setTracking({ ...tracking, trackingUrl: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <button 
                onClick={saveTracking}
                disabled={saving}
                className="w-full btn-secondary mt-4"
              >
                🛵 Save Tracking Info
              </button>
            </div>

            {/* Status Update */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📋</span> Update Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateStatus(s.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      data.status === s.value
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks / Comments */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>💬</span> Remarks / Comments
              </h3>
              <textarea
                className="input-field w-full min-h-[80px]"
                placeholder="Add remarks here to resolve confusion or clarify order details..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                disabled={remarksLoading}
              />
              <button
                onClick={saveRemarks}
                disabled={remarksLoading}
                className="btn-primary mt-2"
              >
                {remarksLoading ? 'Saving...' : 'Save Remarks'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
