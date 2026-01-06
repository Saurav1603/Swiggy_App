import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'WAITING_FOR_PRICE', label: 'Waiting for Price', icon: '', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'PRICE_SENT', label: 'Price Sent', icon: '', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending', icon: '', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received', icon: '', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'ORDER_PLACED', label: 'Order Placed', icon: '', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'DELIVERED', label: 'Delivered', icon: '', color: 'bg-green-100 text-green-700 border-green-200' },
];

export default function AdminRequestDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const prevData = useRef(null);
  const isFirstLoad = useRef(true);
  const [remarks, setRemarks] = useState('');
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [pricing, setPricing] = useState({ foodPrice: '' });
  const [tracking, setTracking] = useState({ trackingUrl: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!token) { router.replace('/admin/login'); return; }
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (!token || !id) return;
    const interval = setInterval(() => fetchDataSilent(), 10000);
    return () => clearInterval(interval);
  }, [id, token]);

  const fetchDataSilent = async () => {
    try {
      const res = await fetch('/api/admin/requests/'+id, { headers: { Authorization: 'Bearer '+token } });
      if (res.status === 401) { router.replace('/admin/login'); return; }
      const json = await res.json();
      if (!isFirstLoad.current && prevData.current && prevData.current.status !== json.status) {
        toast.success('Status updated!', { duration: 4000 });
      }
      prevData.current = json;
      setData(json);
      if (json.pricing) setPricing({ foodPrice: json.pricing.foodPrice });
      if (json.tracking) setTracking({ trackingUrl: json.tracking.trackingUrl || '' });
      isFirstLoad.current = false;
    } catch (error) { console.error('Error:', error); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/requests/'+id, { headers: { Authorization: 'Bearer '+token } });
      if (res.status === 401) { router.replace('/admin/login'); return; }
      const json = await res.json();
      setData(json);
      if (json.pricing) setPricing({ foodPrice: json.pricing.foodPrice });
      if (json.tracking) setTracking({ trackingUrl: json.tracking.trackingUrl || '' });
    } catch (error) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const authHeaders = { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' };

  const savePricing = async () => {
    if (!pricing.foodPrice) { toast.error('Enter price'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/requests/'+id+'/pricing', { method: 'POST', headers: authHeaders, body: JSON.stringify({ foodPrice: parseFloat(pricing.foodPrice) || 0, deliveryFee: 0, platformFee: 0, serviceCharge: 0 }) });
      if (res.ok) { toast.success('Saved!'); fetchData(); } else { toast.error('Failed'); }
    } catch (e) { toast.error('Error'); } finally { setSaving(false); }
  };

  const verifyPayment = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/requests/'+id+'/verify-payment', { method: 'POST', headers: authHeaders });
      if (res.ok) { toast.success('Verified!'); fetchData(); } else { toast.error('Failed'); }
    } catch (e) { toast.error('Error'); } finally { setSaving(false); }
  };

  const saveTracking = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/requests/'+id+'/tracking', { method: 'POST', headers: authHeaders, body: JSON.stringify(tracking) });
      if (res.ok) { toast.success('Saved!'); fetchData(); } else { toast.error('Failed'); }
    } catch (e) { toast.error('Error'); } finally { setSaving(false); }
  };

  const updateStatus = async (status) => {
    try {
      const res = await fetch('/api/admin/requests/'+id, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status }) });
      if (res.ok) { toast.success('Updated!'); fetchData(); } else { toast.error('Failed'); }
    } catch (e) { toast.error('Error'); }
  };

  const cancelOrder = async () => {
    if (!cancelReason.trim()) { toast.error('Provide reason'); return; }
    setCancelling(true);
    try {
      const res = await fetch('/api/admin/requests/'+id+'/cancel', { method: 'POST', headers: authHeaders, body: JSON.stringify({ reason: cancelReason }) });
      if (res.ok) { toast.success('Cancelled'); setShowCancelModal(false); setCancelReason(''); fetchData(); } else { toast.error('Failed'); }
    } catch (e) { toast.error('Error'); } finally { setCancelling(false); }
  };

  useEffect(() => { if (id && token) fetchRemarks(); }, [id, token]);

  const fetchRemarks = async () => {
    setRemarksLoading(true);
    try {
      const res = await fetch('/api/admin/requests/'+id+'/remarks', { headers: { Authorization: 'Bearer '+token } });
      if (res.ok) { const json = await res.json(); setRemarks(json.remarks || ''); }
    } catch (e) {} finally { setRemarksLoading(false); }
  };

  const saveRemarks = async () => {
    setRemarksLoading(true);
    try {
      const res = await fetch('/api/admin/requests/'+id+'/remarks', { method: 'POST', headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' }, body: JSON.stringify({ remarks }) });
      if (res.ok) toast.success('Saved!'); else toast.error('Failed');
    } catch (e) { toast.error('Error'); } finally { setRemarksLoading(false); }
  };

  const calculateTotal = () => (parseFloat(pricing.foodPrice) || 0).toFixed(2);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === (data ? data.status : null)) || {};

  if (loading || !data) return (<AdminLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600">Loading...</p></div></div></AdminLayout>);

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      {showCancelModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xl">!</div><div><h3 className="text-lg font-bold text-gray-900">Cancel Order</h3><p className="text-sm text-gray-500">Order #{id}</p></div></div><p className="text-gray-600 mb-4">Please provide a reason for cancelling.</p><textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g., Restaurant closed..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 resize-none h-32" /><div className="flex gap-3 mt-4"><button onClick={() => { setShowCancelModal(false); setCancelReason(''); }} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Keep Order</button><button onClick={cancelOrder} disabled={cancelling || !cancelReason.trim()} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium disabled:opacity-50">{cancelling ? 'Cancelling...' : 'Cancel Order'}</button></div></div></div>)}
      <div className="space-y-4 md:space-y-6">
        <div className="sticky top-0 z-10 bg-gradient-to-b from-orange-50 via-orange-50 to-transparent pb-4 -mx-4 px-4 md:relative md:bg-transparent md:pb-0 md:mx-0 md:px-0"><button onClick={() => router.push('/admin/orders')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm font-medium">&larr; Back to Orders</button></div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"><div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 md:px-6 md:py-5"><div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4"><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h1 className="text-xl md:text-2xl font-bold text-white">Order #{id}</h1><span className={'px-3 py-1 rounded-full text-xs font-semibold border '+(data.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' : (currentStatus.color || 'bg-white/20 text-white border-white/30'))}>{data.status === 'CANCELLED' ? 'Cancelled' : (currentStatus.icon+' '+currentStatus.label)}</span></div><p className="text-orange-100 mt-1 text-sm md:text-base">{data.name}</p></div>{data.status !== 'CANCELLED' && data.status !== 'DELIVERED' && (<button onClick={() => setShowCancelModal(true)} className="self-start md:self-auto px-4 py-2 bg-white/10 hover:bg-red-500 text-white rounded-xl border border-white/20 text-sm font-medium flex items-center gap-2">Cancel</button>)}</div></div>{data.status === 'CANCELLED' && data.cancelReason && (<div className="px-4 py-3 md:px-6 md:py-4 bg-red-50 border-b border-red-100"><p className="font-medium text-red-800">Reason: {data.cancelReason}</p></div>)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"><div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-semibold text-gray-900">Customer</h3></div><div className="p-4 md:p-6 space-y-4"><div><label className="text-sm text-gray-500">Name</label><p className="font-medium text-gray-900">{data.name}</p></div><div><label className="text-sm text-gray-500">Address</label><p className="font-medium text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-lg mt-1">{data.address}</p></div>{data.notes && (<div><label className="text-sm text-gray-500">Notes</label><p className="font-medium text-gray-900 bg-yellow-50 p-3 rounded-lg mt-1 border border-yellow-200">{data.notes}</p></div>)}</div></div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"><div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-semibold text-gray-900">Cart</h3></div><div className="p-4 md:p-6"><div className="flex justify-center"><img src={data.cartImageUrl} alt="Cart" className="max-w-full md:max-w-xs max-h-64 md:max-h-80 object-contain rounded-xl border-2 border-gray-200 shadow-md cursor-pointer" onClick={() => window.open(data.cartImageUrl, '_blank')} /></div></div></div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"><div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-semibold text-gray-900">Remarks</h3></div><div className="p-4 md:p-6"><textarea className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 min-h-[80px] resize-none" placeholder="Add remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} disabled={remarksLoading} /><button onClick={saveRemarks} disabled={remarksLoading} className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">{remarksLoading ? 'Saving...' : 'Save'}</button></div></div>
          </div>
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"><div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-semibold text-gray-900">Pricing</h3></div><div className="p-4 md:p-6 space-y-4"><div><label className="text-sm font-medium text-gray-700 mb-2 block">Total Price</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rs</span><input type="number" placeholder="0" value={pricing.foodPrice} onChange={(e) => setPricing({ ...pricing, foodPrice: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg" /></div></div><div className="flex items-center justify-between py-3 px-4 bg-orange-50 rounded-lg border border-orange-100"><span className="font-semibold text-gray-900">Total</span><span className="text-2xl font-bold text-orange-600">Rs {calculateTotal()}</span></div><button onClick={savePricing} disabled={saving || data.status === 'CANCELLED'} className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg shadow-md disabled:opacity-50">{saving ? 'Saving...' : 'Send Price'}</button></div></div>
            {data.payment && (<div className={'bg-white rounded-xl shadow-md border-2 overflow-hidden '+(data.payment.verified ? 'border-green-200' : 'border-yellow-200')}><div className={'px-4 py-3 md:px-6 md:py-4 border-b '+(data.payment.verified ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100')}><h3 className="font-semibold text-gray-900 flex items-center justify-between">Payment{data.payment.verified && <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs">Verified</span>}</h3></div><div className="p-4 md:p-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-3"><div><label className="text-sm text-gray-500">UTR</label><p className="font-mono font-medium text-gray-900 text-lg">{data.payment.utrNumber}</p></div>{!data.payment.verified && (<button onClick={verifyPayment} disabled={saving} className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">Verify</button>)}</div></div></div>)}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"><div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-semibold text-gray-900">Tracking</h3></div><div className="p-4 md:p-6"><input type="url" placeholder="https://swiggy.com/track/..." value={tracking.trackingUrl} onChange={(e) => setTracking({ ...tracking, trackingUrl: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" /><button onClick={saveTracking} disabled={saving || data.status === 'CANCELLED'} className="mt-4 w-full py-3 bg-gray-900 text-white font-medium rounded-lg disabled:opacity-50">Save Tracking</button></div></div>
            {data.status !== 'CANCELLED' && (<div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"><div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-semibold text-gray-900">Status</h3></div><div className="p-4 md:p-6"><div className="grid grid-cols-2 gap-2 md:gap-3">{STATUS_OPTIONS.map((s) => (<button key={s.value} onClick={() => updateStatus(s.value)} className={'p-3 md:p-4 rounded-xl text-xs md:text-sm font-medium border-2 '+(data.status === s.value ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50')}>{s.icon} {s.label}</button>))}</div></div></div>)}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
