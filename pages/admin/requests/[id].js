import { useRouter } from 'next/router';import { useRouter } from 'next/router';

import { useEffect, useState, useRef } from 'react';import { useEffect, useState, useRef } from 'react';

import AdminLayout from '../../../components/AdminLayout';import Link from 'next/link';

import toast, { Toaster } from 'react-hot-toast';import AdminLayout from '../../../components/AdminLayout';

import toast, { Toaster } from 'react-hot-toast';

const STATUS_OPTIONS = [

  { value: 'WAITING_FOR_PRICE', label: 'Waiting for Price', icon: '⏳', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },const STATUS_OPTIONS = [

  { value: 'PRICE_SENT', label: 'Price Sent', icon: '💰', color: 'bg-blue-100 text-blue-700 border-blue-200' },  { value: 'WAITING_FOR_PRICE', label: 'Waiting for Price', icon: '⏳', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },

  { value: 'PAYMENT_PENDING', label: 'Payment Pending', icon: '📱', color: 'bg-purple-100 text-purple-700 border-purple-200' },  { value: 'PRICE_SENT', label: 'Price Sent', icon: '💰', color: 'bg-blue-100 text-blue-700 border-blue-200' },

  { value: 'PAYMENT_RECEIVED', label: 'Payment Received', icon: '✅', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },  { value: 'PAYMENT_PENDING', label: 'Payment Pending', icon: '📱', color: 'bg-purple-100 text-purple-700 border-purple-200' },

  { value: 'ORDER_PLACED', label: 'Order Placed', icon: '🍔', color: 'bg-orange-100 text-orange-700 border-orange-200' },  { value: 'PAYMENT_RECEIVED', label: 'Payment Received', icon: '✅', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },

  { value: 'DELIVERED', label: 'Delivered', icon: '🎉', color: 'bg-green-100 text-green-700 border-green-200' },  { value: 'ORDER_PLACED', label: 'Order Placed', icon: '🍔', color: 'bg-orange-100 text-orange-700 border-orange-200' },

];  { value: 'DELIVERED', label: 'Delivered', icon: '🎉', color: 'bg-green-100 text-green-700 border-green-200' },

];

export default function AdminRequestDetail() {

  const router = useRouter();export default function AdminRequestDetail() {

  const { id } = router.query;  const router = useRouter();

  const [data, setData] = useState(null);  const { id } = router.query;

  const [loading, setLoading] = useState(true);  const [data, setData] = useState(null);

  const [saving, setSaving] = useState(false);  const [loading, setLoading] = useState(true);

  const prevData = useRef(null);  const [saving, setSaving] = useState(false);

  const isFirstLoad = useRef(true);  const [seenPaymentId, setSeenPaymentId] = useState(null);

  const [remarks, setRemarks] = useState('');  const prevData = useRef(null);

  const [remarksLoading, setRemarksLoading] = useState(false);  const isFirstLoad = useRef(true);

  const [showCancelModal, setShowCancelModal] = useState(false);  const [remarks, setRemarks] = useState('');

  const [cancelReason, setCancelReason] = useState('');  const [remarksLoading, setRemarksLoading] = useState(false);

  const [cancelling, setCancelling] = useState(false);

  const [pricing, setPricing] = useState({ foodPrice: '' });

  const [pricing, setPricing] = useState({ foodPrice: '' });  const [tracking, setTracking] = useState({ trackingUrl: '' });

  const [tracking, setTracking] = useState({ trackingUrl: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {

  useEffect(() => {    if (!token) {

    if (!token) {      router.replace('/admin/login');

      router.replace('/admin/login');      return;

      return;    }

    }    if (id) fetchData();

    if (id) fetchData();  }, [id]);

  }, [id]);

  // Auto-refresh every 10 seconds

  useEffect(() => {  useEffect(() => {

    if (!token || !id) return;    if (!token || !id) return;

    const interval = setInterval(() => fetchDataSilent(), 10000);    const interval = setInterval(() => {

    return () => clearInterval(interval);      fetchDataSilent();

  }, [id, token]);    }, 10000);

    return () => clearInterval(interval);

  const fetchDataSilent = async () => {  }, [id, token]);

    try {

      const res = await fetch(`/api/admin/requests/${id}`, {  const fetchDataSilent = async () => {

        headers: { Authorization: `Bearer ${token}` },    try {

      });      const res = await fetch(`/api/admin/requests/${id}`, {

      if (res.status === 401) {        headers: { Authorization: `Bearer ${token}` },

        router.replace('/admin/login');      });

        return;      if (res.status === 401) {

      }        router.replace('/admin/login');

      const json = await res.json();        return;

            }

      if (!isFirstLoad.current && prevData.current) {      const json = await res.json();

        if (json.payment && json.payment.id !== prevData.current.payment?.id) {      

          toast.success('💳 New payment submitted!', { duration: 4000 });      // Only show notifications after first load

        }      if (!isFirstLoad.current && prevData.current) {

        if (json.payment && prevData.current.payment &&         if (json.payment && json.payment.id !== prevData.current.payment?.id) {

            json.payment.id === prevData.current.payment.id &&          toast.success('💳 New payment submitted!', { duration: 4000 });

            json.payment.utrNumber !== prevData.current.payment.utrNumber) {        }

          toast.success('🔄 UTR updated by user!', { duration: 4000 });        if (

        }          json.payment &&

        if (prevData.current.status !== json.status) {          prevData.current.payment &&

          toast.success(`📋 Status updated to: ${json.status.replace(/_/g, ' ')}`, { duration: 4000 });          json.payment.id === prevData.current.payment.id &&

        }          json.payment.utrNumber !== prevData.current.payment.utrNumber

      }        ) {

                toast.success('🔄 UTR updated by user!', { duration: 4000 });

      prevData.current = json;        }

      setData(json);        if (prevData.current.status !== json.status) {

      if (json.pricing) setPricing({ foodPrice: json.pricing.foodPrice });          toast.success(`📋 Status updated to: ${json.status.replace(/_/g, ' ')}`, { duration: 4000 });

      if (json.tracking) setTracking({ trackingUrl: json.tracking.trackingUrl || '' });        }

      isFirstLoad.current = false;        if (prevData.current.remarks !== json.remarks && json.remarks) {

    } catch (error) {          toast.success('💬 New/updated remarks from user!', { duration: 4000 });

      console.error('Error fetching data:', error);        }

    }        if (prevData.current.tracking?.trackingUrl !== json.tracking?.trackingUrl && json.tracking?.trackingUrl) {

  };          toast.success('🛵 Tracking info updated!', { duration: 4000 });

        }

  const fetchData = async () => {      }

    setLoading(true);      

    try {      prevData.current = json;

      const res = await fetch(`/api/admin/requests/${id}`, {      if (json.payment) setSeenPaymentId(json.payment.id);

        headers: { Authorization: `Bearer ${token}` },      setData(json);

      });      if (json.pricing) setPricing({ foodPrice: json.pricing.foodPrice });

      if (res.status === 401) {      if (json.tracking) setTracking({ trackingUrl: json.tracking.trackingUrl || '' });

        router.replace('/admin/login');      isFirstLoad.current = false;

        return;    } catch (error) {

      }      console.error('Error fetching data:', error);

      const json = await res.json();    }

      setData(json);  };

      if (json.pricing) setPricing({ foodPrice: json.pricing.foodPrice });

      if (json.tracking) setTracking({ trackingUrl: json.tracking.trackingUrl || '' });  const fetchData = async () => {

    } catch (error) {    setLoading(true);

      console.error('Error fetching data:', error);    try {

      toast.error('Failed to load order details');      const res = await fetch(`/api/admin/requests/${id}`, {

    } finally {        headers: { Authorization: `Bearer ${token}` },

      setLoading(false);      });

    }      if (res.status === 401) {

  };        router.replace('/admin/login');

        return;

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };      }

      const json = await res.json();

  const savePricing = async () => {      setData(json);

    if (!pricing.foodPrice) {      if (json.payment) setSeenPaymentId(json.payment.id);

      toast.error('Please enter the food price');      if (json.pricing) setPricing({ foodPrice: json.pricing.foodPrice });

      return;      if (json.tracking) setTracking({ trackingUrl: json.tracking.trackingUrl || '' });

    }    } catch (error) {

    setSaving(true);      console.error('Error fetching data:', error);

    try {      toast.error('Failed to load order details');

      const res = await fetch(`/api/admin/requests/${id}/pricing`, {    } finally {

        method: 'POST',      setLoading(false);

        headers: authHeaders,    }

        body: JSON.stringify({  };

          foodPrice: parseFloat(pricing.foodPrice) || 0,

          deliveryFee: 0, platformFee: 0, serviceCharge: 0,  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

        }),

      });  const savePricing = async () => {

      if (res.ok) {    if (!pricing.foodPrice) {

        toast.success('Pricing saved!');      toast.error('Please enter the food price');

        fetchData();      return;

      } else {    }

        const json = await res.json();    setSaving(true);

        toast.error(json.error || 'Failed');    try {

      }      const res = await fetch(`/api/admin/requests/${id}/pricing`, {

    } catch (error) {        method: 'POST',

      toast.error('Error saving pricing');        headers: authHeaders,

    } finally {        body: JSON.stringify({

      setSaving(false);          foodPrice: parseFloat(pricing.foodPrice) || 0,

    }          deliveryFee: 0,

  };          platformFee: 0,

          serviceCharge: 0,

  const verifyPayment = async () => {        }),

    setSaving(true);      });

    try {      const json = await res.json();

      const res = await fetch(`/api/admin/requests/${id}/verify-payment`, {      if (res.ok) {

        method: 'POST',        toast.success('Pricing saved!');

        headers: authHeaders,        fetchData();

      });      } else {

      if (res.ok) {        toast.error(json.error || 'Failed');

        toast.success('Payment verified!');      }

        fetchData();    } catch (error) {

      } else {      toast.error('Error saving pricing');

        const json = await res.json();    } finally {

        toast.error(json.error || 'Failed');      setSaving(false);

      }    }

    } catch (error) {  };

      toast.error('Error verifying payment');

    } finally {  const verifyPayment = async () => {

      setSaving(false);    setSaving(true);

    }    try {

  };      const res = await fetch(`/api/admin/requests/${id}/verify-payment`, {

        method: 'POST',

  const saveTracking = async () => {        headers: authHeaders,

    setSaving(true);      });

    try {      if (res.ok) {

      const res = await fetch(`/api/admin/requests/${id}/tracking`, {        toast.success('Payment verified!');

        method: 'POST',        fetchData();

        headers: authHeaders,      } else {

        body: JSON.stringify(tracking),        const json = await res.json();

      });        toast.error(json.error || 'Failed');

      if (res.ok) {      }

        toast.success('Tracking saved!');    } catch (error) {

        fetchData();      toast.error('Error verifying payment');

      } else {    } finally {

        toast.error('Failed to save tracking');      setSaving(false);

      }    }

    } catch (error) {  };

      toast.error('Error saving tracking');

    } finally {  const saveTracking = async () => {

      setSaving(false);    setSaving(true);

    }    try {

  };      const res = await fetch(`/api/admin/requests/${id}/tracking`, {

        method: 'POST',

  const updateStatus = async (status) => {        headers: authHeaders,

    try {        body: JSON.stringify(tracking),

      const res = await fetch(`/api/admin/requests/${id}`, {      });

        method: 'PATCH',      if (res.ok) {

        headers: authHeaders,        toast.success('Tracking saved!');

        body: JSON.stringify({ status }),        fetchData();

      });      } else {

      if (res.ok) {        toast.error('Failed to save tracking');

        toast.success('Status updated!');      }

        fetchData();    } catch (error) {

      } else {      toast.error('Error saving tracking');

        toast.error('Failed to update status');    } finally {

      }      setSaving(false);

    } catch (error) {    }

      toast.error('Error updating status');  };

    }

  };  const updateStatus = async (status) => {

    try {

  const cancelOrder = async () => {      const res = await fetch(`/api/admin/requests/${id}`, {

    if (!cancelReason.trim()) {        method: 'PATCH',

      toast.error('Please provide a reason for cancellation');        headers: authHeaders,

      return;        body: JSON.stringify({ status }),

    }      });

    setCancelling(true);      if (res.ok) {

    try {        toast.success('Status updated!');

      const res = await fetch(`/api/admin/requests/${id}/cancel`, {        fetchData();

        method: 'POST',      } else {

        headers: authHeaders,        toast.error('Failed to update status');

        body: JSON.stringify({ reason: cancelReason }),      }

      });    } catch (error) {

      if (res.ok) {      toast.error('Error updating status');

        toast.success('Order cancelled successfully');    }

        setShowCancelModal(false);  };

        setCancelReason('');

        fetchData();  // Fetch remarks when loading order

      } else {  useEffect(() => {

        const json = await res.json();    if (id && token) fetchRemarks();

        toast.error(json.error || 'Failed to cancel order');  }, [id, token]);

      }

    } catch (error) {  const fetchRemarks = async () => {

      toast.error('Error cancelling order');    setRemarksLoading(true);

    } finally {    try {

      setCancelling(false);      const res = await fetch(`/api/admin/requests/${id}/remarks`, {

    }        headers: { Authorization: `Bearer ${token}` },

  };      });

      if (res.ok) {

  useEffect(() => {        const json = await res.json();

    if (id && token) fetchRemarks();        setRemarks(json.remarks || '');

  }, [id, token]);      }

    } catch (error) {

  const fetchRemarks = async () => {      console.error('Error fetching remarks:', error);

    setRemarksLoading(true);    } finally {

    try {      setRemarksLoading(false);

      const res = await fetch(`/api/admin/requests/${id}/remarks`, {    }

        headers: { Authorization: `Bearer ${token}` },  };

      });

      if (res.ok) {  const saveRemarks = async () => {

        const json = await res.json();    setRemarksLoading(true);

        setRemarks(json.remarks || '');    try {

      }      const res = await fetch(`/api/admin/requests/${id}/remarks`, {

    } catch (error) {        method: 'POST',

      console.error('Error fetching remarks:', error);        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },

    } finally {        body: JSON.stringify({ remarks }),

      setRemarksLoading(false);      });

    }      if (res.ok) {

  };        toast.success('Remarks updated!');

      } else {

  const saveRemarks = async () => {        toast.error('Failed to update remarks');

    setRemarksLoading(true);      }

    try {    } catch (error) {

      const res = await fetch(`/api/admin/requests/${id}/remarks`, {      toast.error('Error updating remarks');

        method: 'POST',    } finally {

        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },      setRemarksLoading(false);

        body: JSON.stringify({ remarks }),    }

      });  };

      if (res.ok) toast.success('Remarks updated!');

      else toast.error('Failed to update remarks');  const calculateTotal = () => {

    } catch (error) {    return (parseFloat(pricing.foodPrice) || 0).toFixed(2);

      toast.error('Error updating remarks');  };

    } finally {

      setRemarksLoading(false);  const currentStatus = STATUS_OPTIONS.find(s => s.value === data?.status) || {};

    }

  };  if (loading || !data) {

    return (

  const calculateTotal = () => (parseFloat(pricing.foodPrice) || 0).toFixed(2);      <AdminLayout>

        <div className="flex items-center justify-center min-h-[60vh]">

  const currentStatus = STATUS_OPTIONS.find(s => s.value === data?.status) || {};          <div className="text-center">

            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

  if (loading || !data) {            <p className="text-gray-600">Loading order details...</p>

    return (          </div>

      <AdminLayout>        </div>

        <div className="flex items-center justify-center min-h-[60vh]">      </AdminLayout>

          <div className="text-center">    );

            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>  }

            <p className="text-gray-600">Loading order details...</p>

          </div>  return (

        </div>    <AdminLayout>

      </AdminLayout>      <Toaster position="top-center" />

    );      

  }      <div className="space-y-6">

        {/* Header */}

  return (        <div className="flex flex-col md:flex-row md:items-center gap-4">

    <AdminLayout>          <Link 

      <Toaster position="top-center" />            href="/admin/orders" 

                  className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"

      {/* Cancel Modal */}          >

      {showCancelModal && (            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />

          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">            </svg>

            <div className="flex items-center gap-3 mb-4">            Back to Orders

              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">          </Link>

                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">          

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">

                </svg>            <div>

              </div>              <h1 className="text-2xl font-bold text-gray-900">Order #{id}</h1>

              <div>              <p className="text-gray-600">{data.name}</p>

                <h3 className="text-lg font-bold text-gray-900">Cancel Order</h3>            </div>

                <p className="text-sm text-gray-500">Order #{id}</p>            <div className="md:ml-auto">

              </div>              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium border ${currentStatus.color}`}>

            </div>                <span>{currentStatus.icon}</span>

                            {currentStatus.label}

            <p className="text-gray-600 mb-4">Please provide a reason for cancelling this order. The customer will be notified.</p>              </span>

                        </div>

            <textarea          </div>

              value={cancelReason}        </div>

              onChange={(e) => setCancelReason(e.target.value)}

              placeholder="e.g., Restaurant closed, Item not available, Customer request..."        {/* Main Grid */}

              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none h-32"        <div className="grid lg:grid-cols-2 gap-6">

            />          {/* Left Column */}

                      <div className="space-y-6">

            <div className="flex gap-3 mt-4">            {/* Customer Details */}

              <button            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">

                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"                <h3 className="font-semibold text-gray-900 flex items-center gap-2">

              >                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">👤</span>

                Keep Order                  Customer Details

              </button>                </h3>

              <button              </div>

                onClick={cancelOrder}              <div className="p-6 space-y-4">

                disabled={cancelling || !cancelReason.trim()}                <div>

                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"                  <label className="text-sm text-gray-500">Name</label>

              >                  <p className="font-medium text-gray-900">{data.name}</p>

                {cancelling ? (                </div>

                  <>                <div>

                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>                  <label className="text-sm text-gray-500">Delivery Address</label>

                    Cancelling...                  <p className="font-medium text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-lg mt-1">{data.address}</p>

                  </>                </div>

                ) : (                {data.notes && (

                  <>                  <div>

                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">                    <label className="text-sm text-gray-500">Special Notes</label>

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />                    <p className="font-medium text-gray-900 bg-yellow-50 p-3 rounded-lg mt-1 border border-yellow-200">{data.notes}</p>

                    </svg>                  </div>

                    Cancel Order                )}

                  </>              </div>

                )}            </div>

              </button>

            </div>            {/* Cart Screenshot */}

          </div>            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

        </div>              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">

      )}                <h3 className="font-semibold text-gray-900 flex items-center gap-2">

                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">📸</span>

      <div className="space-y-4 md:space-y-6">                  Cart Screenshot

        {/* Back Button - Mobile Sticky */}                </h3>

        <div className="sticky top-0 z-10 bg-gradient-to-b from-orange-50 via-orange-50 to-transparent pb-4 -mx-4 px-4 md:relative md:bg-transparent md:pb-0 md:mx-0 md:px-0">              </div>

          <button              <div className="p-6">

            onClick={() => router.push('/admin/orders')}                <div className="flex justify-center">

            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-orange-300 transition-all shadow-sm font-medium"                  <div className="relative group">

          >                    <img

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">                      src={data.cartImageUrl}

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />                      alt="Cart"

            </svg>                      className="max-w-xs max-h-80 object-contain rounded-xl border-2 border-gray-200 shadow-md cursor-pointer hover:shadow-xl transition-all"

            <span>Back to Orders</span>                      onClick={() => window.open(data.cartImageUrl, '_blank')}

          </button>                    />

        </div>                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">

                      <span className="text-white font-medium flex items-center gap-2">

        {/* Order Header Card */}                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 md:px-6 md:py-5">                        </svg>

            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">                        View Full Size

              <div className="flex-1">                      </span>

                <div className="flex items-center gap-2 flex-wrap">                    </div>

                  <h1 className="text-xl md:text-2xl font-bold text-white">Order #{id}</h1>                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${                </div>

                    data.status === 'CANCELLED'               </div>

                      ? 'bg-red-100 text-red-700 border-red-200'             </div>

                      : currentStatus.color || 'bg-white/20 text-white border-white/30'

                  }`}>            {/* Remarks */}

                    {data.status === 'CANCELLED' ? '❌ Cancelled' : `${currentStatus.icon} ${currentStatus.label}`}            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

                  </span>              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">

                </div>                <h3 className="font-semibold text-gray-900 flex items-center gap-2">

                <p className="text-orange-100 mt-1 text-sm md:text-base">{data.name}</p>                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">💬</span>

              </div>                  Remarks / Comments

                              </h3>

              {data.status !== 'CANCELLED' && data.status !== 'DELIVERED' && (              </div>

                <button              <div className="p-6">

                  onClick={() => setShowCancelModal(true)}                <textarea

                  className="self-start md:self-auto px-4 py-2 bg-white/10 hover:bg-red-500 text-white rounded-xl transition-all border border-white/20 hover:border-red-500 text-sm font-medium flex items-center gap-2"                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all min-h-[100px] resize-none"

                >                  placeholder="Add remarks to clarify order details..."

                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">                  value={remarks}

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />                  onChange={e => setRemarks(e.target.value)}

                  </svg>                  disabled={remarksLoading}

                  Cancel Order                />

                </button>                <button

              )}                  onClick={saveRemarks}

            </div>                  disabled={remarksLoading}

          </div>                  className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"

                          >

          {/* Cancellation Info */}                  {remarksLoading ? (

          {data.status === 'CANCELLED' && data.cancelReason && (                    <>

            <div className="px-4 py-3 md:px-6 md:py-4 bg-red-50 border-b border-red-100">                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

              <div className="flex items-start gap-3">                      Saving...

                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">                    </>

                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">                  ) : (

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />                    <>

                  </svg>                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                </div>                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                <div>                      </svg>

                  <p className="font-medium text-red-800">Cancellation Reason</p>                      Save Remarks

                  <p className="text-red-700 text-sm mt-1">{data.cancelReason}</p>                    </>

                </div>                  )}

              </div>                </button>

            </div>              </div>

          )}            </div>

        </div>          </div>



        {/* Main Content - Mobile Stacked, Desktop Grid */}          {/* Right Column */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">          <div className="space-y-6">

          {/* Left Column */}            {/* Pricing */}

          <div className="space-y-4 md:space-y-6">            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

            {/* Customer Details */}              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">                <h3 className="font-semibold text-gray-900 flex items-center gap-2">

              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50">                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">💰</span>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2">                  Set Pricing

                  <span className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center text-base md:text-lg">👤</span>                </h3>

                  Customer Details              </div>

                </h3>              <div className="p-6 space-y-4">

              </div>                <div>

              <div className="p-4 md:p-6 space-y-4">                  <label className="text-sm font-medium text-gray-700 mb-2 block">Total Food Price (₹)</label>

                <div>                  <div className="relative">

                  <label className="text-xs md:text-sm text-gray-500">Name</label>                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>

                  <p className="font-medium text-gray-900">{data.name}</p>                    <input

                </div>                      type="number"

                <div>                      placeholder="0.00"

                  <label className="text-xs md:text-sm text-gray-500">Delivery Address</label>                      value={pricing.foodPrice}

                  <p className="font-medium text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-lg mt-1 text-sm md:text-base">{data.address}</p>                      onChange={(e) => setPricing({ ...pricing, foodPrice: e.target.value })}

                </div>                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-lg"

                {data.notes && (                    />

                  <div>                  </div>

                    <label className="text-xs md:text-sm text-gray-500">Special Notes</label>                </div>

                    <p className="font-medium text-gray-900 bg-yellow-50 p-3 rounded-lg mt-1 border border-yellow-200 text-sm md:text-base">{data.notes}</p>                

                  </div>                <div className="flex items-center justify-between py-3 px-4 bg-orange-50 rounded-lg border border-orange-100">

                )}                  <span className="font-semibold text-gray-900">Total Amount</span>

              </div>                  <span className="text-2xl font-bold text-orange-600">₹{calculateTotal()}</span>

            </div>                </div>



            {/* Cart Screenshot */}                <button 

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">                  onClick={savePricing} 

              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50">                  disabled={saving}

                <h3 className="font-semibold text-gray-900 flex items-center gap-2">                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"

                  <span className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center text-base md:text-lg">📸</span>                >

                  Cart Screenshot                  {saving ? (

                </h3>                    <>

              </div>                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

              <div className="p-4 md:p-6">                      Saving...

                <div className="flex justify-center">                    </>

                  <div className="relative group">                  ) : (

                    <img                    <>

                      src={data.cartImageUrl}                      <span>💰</span>

                      alt="Cart"                      Send Price to Customer

                      className="max-w-full md:max-w-xs max-h-64 md:max-h-80 object-contain rounded-xl border-2 border-gray-200 shadow-md cursor-pointer hover:shadow-xl transition-all"                    </>

                      onClick={() => window.open(data.cartImageUrl, '_blank')}                  )}

                    />                </button>

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">              </div>

                      <span className="text-white font-medium flex items-center gap-2 text-sm">            </div>

                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />            {/* Payment Verification */}

                        </svg>            {data.payment && (

                        View Full Size              <div className={`bg-white rounded-xl shadow-md border-2 overflow-hidden ${data.payment.verified ? 'border-green-200' : 'border-yellow-200'}`}>

                      </span>                <div className={`px-6 py-4 border-b ${data.payment.verified ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>

                    </div>                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">

                  </div>                    <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm">📱</span>

                </div>                    Payment Info

              </div>                    {data.payment.verified && (

            </div>                      <span className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">

                        ✓ Verified

            {/* Remarks */}                      </span>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">                    )}

              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50">                  </h3>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2">                </div>

                  <span className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center text-base md:text-lg">💬</span>                <div className="p-6">

                  Remarks                  <div className="flex items-center justify-between">

                </h3>                    <div>

              </div>                      <label className="text-sm text-gray-500">UTR Number</label>

              <div className="p-4 md:p-6">                      <p className="font-mono font-medium text-gray-900 text-lg">{data.payment.utrNumber}</p>

                <textarea                    </div>

                  className="w-full px-3 py-2.5 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all min-h-[80px] md:min-h-[100px] resize-none text-sm md:text-base"                    {!data.payment.verified && (

                  placeholder="Add remarks to clarify order details..."                      <button 

                  value={remarks}                        onClick={verifyPayment}

                  onChange={e => setRemarks(e.target.value)}                        disabled={saving}

                  disabled={remarksLoading}                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md disabled:opacity-50 flex items-center gap-2"

                />                      >

                <button                        {saving ? (

                  onClick={saveRemarks}                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

                  disabled={remarksLoading}                        ) : (

                  className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm md:text-base"                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                >                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                  {remarksLoading ? (                          </svg>

                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>                        )}

                  ) : (                        Verify Payment

                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Remarks</>                      </button>

                  )}                    )}

                </button>                  </div>

              </div>                </div>

            </div>              </div>

          </div>            )}



          {/* Right Column */}            {/* Tracking */}

          <div className="space-y-4 md:space-y-6">            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

            {/* Pricing */}              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">                <h3 className="font-semibold text-gray-900 flex items-center gap-2">

              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50">                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">🛵</span>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2">                  Tracking Info

                  <span className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center text-base md:text-lg">💰</span>                </h3>

                  Set Pricing              </div>

                </h3>              <div className="p-6">

              </div>                <div>

              <div className="p-4 md:p-6 space-y-4">                  <label className="text-sm font-medium text-gray-700 mb-2 block">Swiggy Tracking URL</label>

                <div>                  <input

                  <label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">Total Food Price (₹)</label>                    type="url"

                  <div className="relative">                    placeholder="https://www.swiggy.com/track/..."

                    <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>                    value={tracking.trackingUrl}

                    <input                    onChange={(e) => setTracking({ ...tracking, trackingUrl: e.target.value })}

                      type="number"                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"

                      placeholder="0.00"                  />

                      value={pricing.foodPrice}                </div>

                      onChange={(e) => setPricing({ ...pricing, foodPrice: e.target.value })}                <button 

                      className="w-full pl-8 md:pl-10 pr-4 py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base md:text-lg"                  onClick={saveTracking}

                    />                  disabled={saving}

                  </div>                  className="mt-4 w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"

                </div>                >

                                  {saving ? (

                <div className="flex items-center justify-between py-3 px-3 md:px-4 bg-orange-50 rounded-lg border border-orange-100">                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

                  <span className="font-semibold text-gray-900 text-sm md:text-base">Total</span>                  ) : (

                  <span className="text-xl md:text-2xl font-bold text-orange-600">₹{calculateTotal()}</span>                    <span>🛵</span>

                </div>                  )}

                  Save Tracking Info

                <button                 </button>

                  onClick={savePricing}               </div>

                  disabled={saving || data.status === 'CANCELLED'}            </div>

                  className="w-full py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"

                >            {/* Status Update */}

                  {saving ? (            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">

                  ) : (                <h3 className="font-semibold text-gray-900 flex items-center gap-2">

                    <><span>💰</span>Send Price to Customer</>                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">📋</span>

                  )}                  Update Status

                </button>                </h3>

              </div>              </div>

            </div>              <div className="p-6">

                <div className="grid grid-cols-2 gap-3">

            {/* Payment Verification */}                  {STATUS_OPTIONS.map((s) => (

            {data.payment && (                    <button

              <div className={`bg-white rounded-xl shadow-md border-2 overflow-hidden ${data.payment.verified ? 'border-green-200' : 'border-yellow-200'}`}>                      key={s.value}

                <div className={`px-4 py-3 md:px-6 md:py-4 border-b ${data.payment.verified ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>                      onClick={() => updateStatus(s.value)}

                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">                      className={`p-4 rounded-xl text-sm font-medium transition-all border-2 ${

                    <span className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center text-base md:text-lg shadow-sm">📱</span>                        data.status === s.value

                    Payment Info                          ? 'bg-orange-500 text-white border-orange-500 shadow-lg'

                    {data.payment.verified && (                          : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'

                      <span className="ml-auto bg-green-500 text-white px-2 md:px-3 py-1 rounded-full text-xs font-medium">✓ Verified</span>                      }`}

                    )}                    >

                  </h3>                      <span className="text-lg mr-2">{s.icon}</span>

                </div>                      {s.label}

                <div className="p-4 md:p-6">                    </button>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">                  ))}

                    <div>                </div>

                      <label className="text-xs md:text-sm text-gray-500">UTR Number</label>              </div>

                      <p className="font-mono font-medium text-gray-900 text-base md:text-lg">{data.payment.utrNumber}</p>            </div>

                    </div>          </div>

                    {!data.payment.verified && (        </div>

                      <button       </div>

                        onClick={verifyPayment}    </AdminLayout>

                        disabled={saving}  );

                        className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"}

                      >
                        {saving ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center text-base md:text-lg">🛵</span>
                  Tracking Info
                </h3>
              </div>
              <div className="p-4 md:p-6">
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">Swiggy Tracking URL</label>
                  <input
                    type="url"
                    placeholder="https://www.swiggy.com/track/..."
                    value={tracking.trackingUrl}
                    onChange={(e) => setTracking({ ...tracking, trackingUrl: e.target.value })}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm md:text-base"
                  />
                </div>
                <button 
                  onClick={saveTracking}
                  disabled={saving || data.status === 'CANCELLED'}
                  className="mt-4 w-full py-2.5 md:py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>🛵</span>}
                  Save Tracking Info
                </button>
              </div>
            </div>

            {/* Status Update */}
            {data.status !== 'CANCELLED' && (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center text-base md:text-lg">📋</span>
                    Update Status
                  </h3>
                </div>
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => updateStatus(s.value)}
                        className={`p-3 md:p-4 rounded-xl text-xs md:text-sm font-medium transition-all border-2 ${
                          data.status === s.value
                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <span className="text-base md:text-lg mr-1 md:mr-2">{s.icon}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
