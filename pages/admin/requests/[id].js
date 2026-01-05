import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'WAITING_FOR_PRICE', label: 'Waiting for Price', icon: '⏳', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'PRICE_SENT', label: 'Price Sent', icon: '💰', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending', icon: '📱', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received', icon: '✅', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'ORDER_PLACED', label: 'Order Placed', icon: '🍔', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'DELIVERED', label: 'Delivered', icon: '🎉', color: 'bg-green-100 text-green-700 border-green-200' },
];

export default function AdminRequestDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seenPaymentId, setSeenPaymentId] = useState(null);
  const prevData = useRef(null);
  const isFirstLoad = useRef(true);
  const [remarks, setRemarks] = useState('');
  const [remarksLoading, setRemarksLoading] = useState(false);

  const [pricing, setPricing] = useState({ foodPrice: '' });
  const [tracking, setTracking] = useState({ trackingUrl: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    if (id) fetchData();
  }, [id]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!token || !id) return;
    const interval = setInterval(() => {
      fetchDataSilent();
    }, 10000);
    return () => clearInterval(interval);
  }, [id, token]);

  const fetchDataSilent = async () => {
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const json = await res.json();
      
      // Only show notifications after first load
      if (!isFirstLoad.current && prevData.current) {
        if (json.payment && json.payment.id !== prevData.current.payment?.id) {
          toast.success('💳 New payment submitted!', { duration: 4000 });
        }
        if (
          json.payment &&
          prevData.current.payment &&
          json.payment.id === prevData.current.payment.id &&
          json.payment.utrNumber !== prevData.current.payment.utrNumber
        ) {
          toast.success('🔄 UTR updated by user!', { duration: 4000 });
        }
        if (prevData.current.status !== json.status) {
          toast.success(`📋 Status updated to: ${json.status.replace(/_/g, ' ')}`, { duration: 4000 });
        }
        if (prevData.current.remarks !== json.remarks && json.remarks) {
          toast.success('💬 New/updated remarks from user!', { duration: 4000 });
        }
        if (prevData.current.tracking?.trackingUrl !== json.tracking?.trackingUrl && json.tracking?.trackingUrl) {
          toast.success('🛵 Tracking info updated!', { duration: 4000 });
        }
      }
      
      prevData.current = json;
      if (json.payment) setSeenPaymentId(json.payment.id);
      setData(json);
      if (json.pricing) setPricing({ foodPrice: json.pricing.foodPrice });
      if (json.tracking) setTracking({ trackingUrl: json.tracking.trackingUrl || '' });
      isFirstLoad.current = false;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const json = await res.json();
      setData(json);
      if (json.payment) setSeenPaymentId(json.payment.id);
      if (json.pricing) setPricing({ foodPrice: json.pricing.foodPrice });
      if (json.tracking) setTracking({ trackingUrl: json.tracking.trackingUrl || '' });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const savePricing = async () => {
    if (!pricing.foodPrice) {
      toast.error('Please enter the food price');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}/pricing`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          foodPrice: parseFloat(pricing.foodPrice) || 0,
          deliveryFee: 0,
          platformFee: 0,
          serviceCharge: 0,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Pricing saved!');
        fetchData();
      } else {
        toast.error(json.error || 'Failed');
      }
    } catch (error) {
      toast.error('Error saving pricing');
    } finally {
      setSaving(false);
    }
  };

  const verifyPayment = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}/verify-payment`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) {
        toast.success('Payment verified!');
        fetchData();
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed');
      }
    } catch (error) {
      toast.error('Error verifying payment');
    } finally {
      setSaving(false);
    }
  };

  const saveTracking = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}/tracking`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(tracking),
      });
      if (res.ok) {
        toast.success('Tracking saved!');
        fetchData();
      } else {
        toast.error('Failed to save tracking');
      }
    } catch (error) {
      toast.error('Error saving tracking');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success('Status updated!');
        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  // Fetch remarks when loading order
  useEffect(() => {
    if (id && token) fetchRemarks();
  }, [id, token]);

  const fetchRemarks = async () => {
    setRemarksLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}/remarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRemarks(json.remarks || '');
      }
    } catch (error) {
      console.error('Error fetching remarks:', error);
    } finally {
      setRemarksLoading(false);
    }
  };

  const saveRemarks = async () => {
    setRemarksLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}/remarks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });
      if (res.ok) {
        toast.success('Remarks updated!');
      } else {
        toast.error('Failed to update remarks');
      }
    } catch (error) {
      toast.error('Error updating remarks');
    } finally {
      setRemarksLoading(false);
    }
  };

  const calculateTotal = () => {
    return (parseFloat(pricing.foodPrice) || 0).toFixed(2);
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === data?.status) || {};

  if (loading || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Link 
            href="/admin/orders" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          
          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{id}</h1>
              <p className="text-gray-600">{data.name}</p>
            </div>
            <div className="md:ml-auto">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium border ${currentStatus.color}`}>
                <span>{currentStatus.icon}</span>
                {currentStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">👤</span>
                  Customer Details
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium text-gray-900">{data.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Delivery Address</label>
                  <p className="font-medium text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-lg mt-1">{data.address}</p>
                </div>
                {data.notes && (
                  <div>
                    <label className="text-sm text-gray-500">Special Notes</label>
                    <p className="font-medium text-gray-900 bg-yellow-50 p-3 rounded-lg mt-1 border border-yellow-200">{data.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Screenshot */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">📸</span>
                  Cart Screenshot
                </h3>
              </div>
              <div className="p-6">
                <div className="flex justify-center">
                  <div className="relative group">
                    <img
                      src={data.cartImageUrl}
                      alt="Cart"
                      className="max-w-xs max-h-80 object-contain rounded-xl border-2 border-gray-200 shadow-md cursor-pointer hover:shadow-xl transition-all"
                      onClick={() => window.open(data.cartImageUrl, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <span className="text-white font-medium flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        View Full Size
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">💬</span>
                  Remarks / Comments
                </h3>
              </div>
              <div className="p-6">
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all min-h-[100px] resize-none"
                  placeholder="Add remarks to clarify order details..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  disabled={remarksLoading}
                />
                <button
                  onClick={saveRemarks}
                  disabled={remarksLoading}
                  className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {remarksLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Remarks
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">💰</span>
                  Set Pricing
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Total Food Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={pricing.foodPrice}
                      onChange={(e) => setPricing({ ...pricing, foodPrice: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-lg"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 px-4 bg-orange-50 rounded-lg border border-orange-100">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-orange-600">₹{calculateTotal()}</span>
                </div>

                <button 
                  onClick={savePricing} 
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>💰</span>
                      Send Price to Customer
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Payment Verification */}
            {data.payment && (
              <div className={`bg-white rounded-xl shadow-md border-2 overflow-hidden ${data.payment.verified ? 'border-green-200' : 'border-yellow-200'}`}>
                <div className={`px-6 py-4 border-b ${data.payment.verified ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm">📱</span>
                    Payment Info
                    {data.payment.verified && (
                      <span className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        ✓ Verified
                      </span>
                    )}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-gray-500">UTR Number</label>
                      <p className="font-mono font-medium text-gray-900 text-lg">{data.payment.utrNumber}</p>
                    </div>
                    {!data.payment.verified && (
                      <button 
                        onClick={verifyPayment}
                        disabled={saving}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Verify Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tracking */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">🛵</span>
                  Tracking Info
                </h3>
              </div>
              <div className="p-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Swiggy Tracking URL</label>
                  <input
                    type="url"
                    placeholder="https://www.swiggy.com/track/..."
                    value={tracking.trackingUrl}
                    onChange={(e) => setTracking({ ...tracking, trackingUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
                <button 
                  onClick={saveTracking}
                  disabled={saving}
                  className="mt-4 w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>🛵</span>
                  )}
                  Save Tracking Info
                </button>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">📋</span>
                  Update Status
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateStatus(s.value)}
                      className={`p-4 rounded-xl text-sm font-medium transition-all border-2 ${
                        data.status === s.value
                          ? 'bg-orange-500 text-white border-orange-500 shadow-lg'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <span className="text-lg mr-2">{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
