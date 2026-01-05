import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key: 'WAITING_FOR_PRICE', label: 'Reviewing Cart', desc: 'We are calculating your order total', icon: '⏳' },
  { key: 'PRICE_SENT', label: 'Price Ready', desc: 'Please complete the payment', icon: '💰' },
  { key: 'PAYMENT_PENDING', label: 'Payment Pending', desc: 'Waiting for payment confirmation', icon: '📱' },
  { key: 'PAYMENT_RECEIVED', label: 'Payment Verified', desc: 'Placing your order now', icon: '✅' },
  { key: 'ORDER_PLACED', label: 'Order Placed', desc: 'Your food is being prepared', icon: '🍔' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your meal!', icon: '🎉' },
];

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi';
const UPI_QR = process.env.NEXT_PUBLIC_UPI_QR_URL || '/upi-qr.png';

export default function StatusPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevData = useRef(null);
  const isFirstLoad = useRef(true);

  const getStatusMessage = (status) => {
    const messages = {
      PRICE_SENT: '💰 Price has been calculated! Check below to make payment.',
      PAYMENT_PENDING: '📱 Payment is being processed...',
      PAYMENT_RECEIVED: '✅ Payment verified! We are placing your order.',
      ORDER_PLACED: '🍔 Your order has been placed on Swiggy!',
      DELIVERED: '🎉 Order delivered! Enjoy your meal!',
    };
    return messages[status];
  };

  const fetchData = async () => {
    if (!id) return;
    const res = await fetch(`/api/requests/${id}`);
    if (res.ok) {
      const newData = await res.json();
      if (!isFirstLoad.current && prevData.current) {
        if (prevData.current.status !== newData.status) {
          const message = getStatusMessage(newData.status);
          if (message) toast.success(message, { duration: 5000, icon: '🔔' });
        }
        if (!prevData.current.pricing && newData.pricing) {
          toast.success('💰 Price is ready! Check the payment section.', { duration: 5000 });
        }
        if (!prevData.current.tracking?.trackingUrl && newData.tracking?.trackingUrl) {
          toast.success('🛵 Tracking link added! You can now track your order.', { duration: 5000 });
        }
        if (prevData.current.payment && !prevData.current.payment.verified && newData.payment?.verified) {
          toast.success('✅ Your payment has been verified!', { duration: 5000 });
        }
        if (prevData.current.remarks !== newData.remarks && newData.remarks) {
          toast.success('💬 New note from admin!', { duration: 5000 });
        }
      }
      prevData.current = newData;
      setData(newData);
      isFirstLoad.current = false;
    } else {
      toast.error('Request not found');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!utr.trim()) {
      toast.error('Please enter UTR/Transaction ID');
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/requests/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utrNumber: utr }),
    });
    if (res.ok) {
      toast.success('Payment info submitted!');
      fetchData();
    } else {
      const json = await res.json();
      toast.error(json.error || 'Failed');
    }
    setSubmitting(false);
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIndex = (status) => STATUS_STEPS.findIndex((s) => s.key === status);

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin text-4xl">⏳</div>
            </div>
            <p className="text-gray-500 font-medium">Loading your order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentIndex = getStatusIndex(data.status);
  const paymentLocked = ['PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'ORDER_PLACED', 'DELIVERED'].includes(data.status);
  const isDelivered = data.status === 'DELIVERED';

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${
            isDelivered 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            <span>{isDelivered ? '🎉' : '📋'}</span>
            {isDelivered ? 'Order Completed' : 'Order in Progress'}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Order Status</h1>
          <p className="text-gray-400 font-mono text-sm bg-gray-100 inline-block px-3 py-1 rounded-lg">ID: {data.id}</p>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/30">
              {data.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{data.name}</h3>
              <p className="text-gray-500 text-sm">{data.address?.slice(0, 50)}...</p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-gray-200/50 border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">📊</span>
            Order Progress
          </h3>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div 
              className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-orange-400 to-orange-600 transition-all duration-500"
              style={{ height: `${Math.min((currentIndex / (STATUS_STEPS.length - 1)) * 100, 100)}%` }}
            />
            
            <div className="space-y-6">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i < currentIndex || (isDelivered && i === currentIndex);
                const isCurrent = i === currentIndex && !isDelivered;
                const isPending = i > currentIndex;
                
                return (
                  <div key={step.key} className="flex items-start gap-4 relative">
                    {/* Icon */}
                    <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/30' 
                        : isCurrent 
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30 animate-pulse' 
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    
                    {/* Content */}
                    <div className={`flex-1 pt-2 ${isPending ? 'opacity-50' : ''}`}>
                      <p className={`font-semibold ${isCurrent ? 'text-orange-600' : 'text-gray-800'}`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                          In progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart Screenshot */}
        <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">📸</span>
            Your Cart Screenshot
          </h3>
          
          <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4">
            <img
              src={data.cartImageUrl}
              alt="Cart"
              className="max-w-full max-h-96 object-contain rounded-xl shadow-lg mx-auto cursor-zoom-in hover:scale-[1.02] transition-transform"
              onClick={() => window.open(data.cartImageUrl, '_blank')}
              title="Click to view full size"
            />
          </div>
          
          <p className="text-xs text-gray-400 mt-3 text-center">Click image to view full size</p>
          
          {/* Edit Screenshot */}
          {!data.payment && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <EditScreenshot id={id} setData={setData} />
            </div>
          )}
        </div>

        {/* Pricing Card */}
        {data.pricing && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl shadow-green-500/30 mb-6 text-white animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Total Amount</p>
                <p className="text-4xl font-extrabold">₹{data.pricing.total}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <span className="text-4xl">💰</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Section */}
        {data.pricing && !paymentLocked && (
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border-2 border-orange-200 mb-6 animate-slideUp">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">📱</span>
              Pay via UPI
            </h3>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* QR Code */}
              <div className="flex-shrink-0 text-center">
                <div className="bg-white p-3 rounded-2xl shadow-lg inline-block">
                  <img src={UPI_QR} alt="UPI QR" className="w-44 h-44 rounded-xl" />
                </div>
                <p className="text-xs text-gray-400 mt-2">Scan to pay</p>
              </div>
              
              {/* Payment Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">UPI ID</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-4 py-3 rounded-xl text-gray-800 font-mono">{UPI_ID}</code>
                    <button
                      onClick={copyUPI}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        copied 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-600 mb-1">Amount to Pay</p>
                  <p className="text-3xl font-bold text-orange-600">₹{data.pricing.total}</p>
                </div>
              </div>
            </div>
            
            {/* UTR Input */}
            <form onSubmit={submitPayment} className="mt-6 pt-6 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                After payment, enter your UTR / Transaction ID
              </label>
              <div className="flex gap-3">
                <input
                  placeholder="Enter 12-digit UTR number"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="flex-1 px-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all whitespace-nowrap"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment Submitted */}
        {paymentLocked && data.payment && (
          <div className={`rounded-2xl p-6 mb-6 ${
            data.payment.verified 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
              : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                data.payment.verified 
                  ? 'bg-green-100' 
                  : 'bg-yellow-100'
              }`}>
                {data.payment.verified ? '✅' : '⏳'}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-lg ${data.payment.verified ? 'text-green-800' : 'text-yellow-800'}`}>
                  {data.payment.verified ? 'Payment Verified' : 'Payment Submitted'}
                </p>
                {data.payment.verified ? (
                  <>
                    <p className="text-green-600 text-sm mt-1">UTR: {data.payment.utrNumber}</p>
                    <p className="text-green-700 font-medium mt-2">✓ Verified by admin</p>
                  </>
                ) : (
                  <>
                    <p className="text-yellow-700 text-sm mt-1">Waiting for verification...</p>
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        value={utr || data.payment.utrNumber}
                        onChange={e => setUtr(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-yellow-300 text-sm"
                        placeholder="Enter correct UTR"
                        maxLength={20}
                      />
                      <button
                        onClick={submitPayment}
                        disabled={submitting}
                        className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg text-sm"
                      >
                        {submitting ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">You can update UTR until payment is verified</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tracking Info */}
        {data.tracking && data.tracking.trackingUrl && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl shadow-blue-500/30 mb-6 text-white animate-slideUp">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <span className="text-3xl">🛵</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Track Your Order</h3>
                <p className="text-blue-100 text-sm">Follow your food in real-time</p>
              </div>
              <a
                href={data.tracking.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                Open Tracking →
              </a>
            </div>
          </div>
        )}

        {/* Admin Remarks */}
        {data.remarks && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-yellow-200 mb-6 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <h3 className="font-bold text-yellow-800 mb-2">Note from Admin</h3>
                <p className="text-yellow-900 whitespace-pre-line">{data.remarks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Auto-refresh Notice */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Auto-refreshes every 10 seconds
          </div>
        </div>
      </div>
    </Layout>
  );
}

// EditScreenshot component
function EditScreenshot({ id, setData }) {
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: file.name }),
      });
      if (!uploadRes.ok) {
        toast.error('Image upload failed');
        setUploading(false);
        return;
      }
      const { url } = await uploadRes.json();
      const updateRes = await fetch(`/api/requests/${id}/cartImage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartImageUrl: url }),
      });
      if (updateRes.ok) {
        toast.success('Screenshot updated!');
        setData((d) => ({ ...d, cartImageUrl: url }));
        setFile(null);
      } else {
        const err = await updateRes.json();
        toast.error(err.error || 'Failed to update screenshot');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <input 
        ref={fileRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
      >
        {file ? file.name : '📎 Choose new screenshot'}
      </button>
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors text-sm"
        >
          {uploading ? 'Uploading...' : 'Replace'}
        </button>
      )}
    </div>
  );
}
