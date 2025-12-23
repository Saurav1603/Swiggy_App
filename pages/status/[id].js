import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key: 'WAITING_FOR_PRICE', label: 'Waiting for price', icon: '⏳' },
  { key: 'PRICE_SENT', label: 'Price calculated', icon: '💰' },
  { key: 'PAYMENT_PENDING', label: 'Payment pending', icon: '📱' },
  { key: 'PAYMENT_RECEIVED', label: 'Payment verified', icon: '✅' },
  { key: 'ORDER_PLACED', label: 'Order placed', icon: '🍔' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' },
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
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-500">Loading your order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentIndex = getStatusIndex(data.status);
  const paymentLocked = ['PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'ORDER_PLACED', 'DELIVERED'].includes(data.status);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Order Status</h1>
          <p className="text-sm text-gray-400 font-mono">ID: {data.id}</p>
        </div>

        {/* Status Timeline */}
        <div className="card p-6 mb-6">
          <div className="space-y-4">
            {STATUS_STEPS.map((step, i) => {
              const isDelivered = data.status === 'DELIVERED';
              const isCompleted = i < currentIndex || (isDelivered && i === currentIndex);
              const isCurrent = i === currentIndex && !isDelivered;
              const isPending = i > currentIndex;
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${isCompleted ? 'bg-green-100 text-green-600' : ''} ${isCurrent ? 'bg-orange-100 text-orange-600 ring-4 ring-orange-50 animate-pulse-slow' : ''} ${isPending ? 'bg-gray-100 text-gray-400' : ''}`}
                  >
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isPending ? 'text-gray-400' : 'text-gray-800'}`}>{step.label}</p>
                    {isCurrent && <p className="text-sm text-orange-600">In progress...</p>}
                    {isDelivered && step.key === 'DELIVERED' && <p className="text-sm text-green-600 font-medium">✓ Completed</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Screenshot with Edit Option */}
        <div className="card p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>📸</span> Your Cart
          </h3>
          <img src={data.cartImageUrl} alt="Cart" className="w-full max-h-80 object-contain rounded-xl bg-gray-50 mb-2" />
          {/* Allow edit if payment not submitted */}
          {!data.payment && <EditScreenshot id={id} setData={setData} />}
        </div>

        {/* Pricing Card */}
        {data.pricing && (
          <div className="card p-6 mb-6 animate-slideUp">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>💰</span> Price
            </h3>
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-gray-800">Total Amount</span>
              <span className="font-bold text-orange-600 text-2xl">₹{data.pricing.total}</span>
            </div>
          </div>
        )}

        {/* Payment Section */}
        {data.pricing && !paymentLocked && (
          <div className="card p-6 mb-6 border-2 border-orange-200 animate-slideUp">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📱</span> Pay via UPI
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
              {/* QR Code */}
              <div className="flex-shrink-0">
                <img src={UPI_QR} alt="UPI QR" className="w-40 h-40 rounded-xl border mx-auto md:mx-0" />
              </div>
              {/* Payment Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">UPI ID</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-3 py-2 rounded-lg text-sm flex-1">{UPI_ID}</code>
                    <button
                      onClick={copyUPI}
                      className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Amount to Pay</p>
                  <p className="text-2xl font-bold text-orange-600">₹{data.pricing.total}</p>
                </div>
              </div>
            </div>
            {/* UTR Input */}
            <form onSubmit={submitPayment} className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                After payment, enter UTR / Transaction ID
              </label>
              <div className="flex gap-2">
                <input
                  placeholder="Enter 12-digit UTR number"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="input-field flex-1"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-6 whitespace-nowrap"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment Submitted & Edit UTR if not verified */}
        {paymentLocked && data.payment && (
          <div className={`card p-6 mb-6 ${data.payment.verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border-2`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div className="flex-1">
                <p className="font-semibold text-green-800">Payment Submitted</p>
                {data.payment.verified ? (
                  <>
                    <p className="text-sm text-green-600">UTR: {data.payment.utrNumber}</p>
                    <p className="text-sm font-medium text-green-700 mt-1">✓ Verified by admin</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={utr || data.payment.utrNumber}
                        onChange={e => setUtr(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Enter 12-digit UTR number"
                        maxLength={20}
                      />
                      <button
                        onClick={submitPayment}
                        disabled={submitting}
                        className="btn-primary px-4"
                        style={{ minWidth: 90 }}
                      >
                        {submitting ? 'Saving...' : 'Edit UTR'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">If you entered the wrong UTR, you can correct it here until payment is verified.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tracking Info */}
        {data.tracking && data.tracking.trackingUrl && (
          <div className="card p-6 mb-6 bg-blue-50 border-2 border-blue-200 animate-slideUp">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <span>🛵</span> Track Your Order
            </h3>
            <a
              href={data.tracking.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Open Swiggy Tracking →
            </a>
          </div>
        )}

        {/* Remarks / Comments (Admin Notes) */}
        {data.remarks && (
          <div className="card p-6 mb-6 bg-yellow-50 border-2 border-yellow-200 animate-fadeIn">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <span>💬</span> Note from Admin
            </h3>
            <div className="whitespace-pre-line text-yellow-900 text-base">{data.remarks}</div>
          </div>
        )}

        {/* Help Note */}
        <div className="text-center text-sm text-gray-400 mt-8">
          <p>This page auto-refreshes every 10 seconds</p>
        </div>
      </div>
    </Layout>
  );
}

// EditScreenshot component for replacing cart image
function EditScreenshot({ id, setData }) {
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      // Upload to /api/upload
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
      // Update cartImageUrl via API
      const updateRes = await fetch(`/api/requests/${id}/cartImage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartImageUrl: url }),
      });
      if (updateRes.ok) {
        toast.success('Screenshot updated!');
        setData((d) => ({ ...d, cartImageUrl: url }));
      } else {
        const err = await updateRes.json();
        toast.error(err.error || 'Failed to update screenshot');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-2">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        className="btn-primary ml-2 px-4 py-1"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Replace Screenshot'}
      </button>
    </div>
  );
}