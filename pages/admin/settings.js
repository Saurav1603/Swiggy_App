import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const router = useRouter();
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminId = localStorage.getItem('adminId');
    const name = localStorage.getItem('adminName');
    
    if (!token || !adminId) {
      router.replace('/admin/login');
      return;
    }
    
    setAdminName(name || 'Admin');
    setCheckingAuth(false);
    fetchPaymentInfo();
  }, [router]);

  const fetchPaymentInfo = async () => {
    try {
      const res = await fetch('/api/admin/payment-info');
      if (res.ok) {
        const data = await res.json();
        setUpiId(data.upiId || '');
        setQrUrl(data.qrUrl || '');
      }
    } catch (e) {
      console.error('Failed to fetch payment info:', e);
    }
  };

  const handleQrChange = (e) => {
    if (e.target.files[0]) {
      setQrFile(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let uploadedQrUrl = qrUrl;
      
      // Upload QR code if new file selected
      if (qrFile) {
        const form = new FormData();
        form.append('file', qrFile);
        const res = await fetch('/api/admin/upload-qr', { method: 'POST', body: form });
        const data = await res.json();
        if (res.ok) {
          uploadedQrUrl = data.url;
        } else {
          toast.error(data.error || 'QR upload failed');
          setSaving(false);
          return;
        }
      }
      
      // Save payment info
      const res = await fetch('/api/admin/payment-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId, qrUrl: uploadedQrUrl })
      });
      
      if (res.ok) {
        toast.success('Settings saved successfully!');
        setQrUrl(uploadedQrUrl);
        setQrFile(null);
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-2xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings ⚙️</h1>
            <p className="text-gray-500 mt-1">Manage your payment information</p>
          </div>
          <Link href="/admin/dashboard" className="btn-secondary text-sm">
            ← Dashboard
          </Link>
        </div>

        {/* Profile Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👤</span> Profile
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{adminName}</p>
              <p className="text-gray-500 text-sm">Delivery Partner</p>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>💳</span> Payment Information
          </h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            {/* UPI ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input 
                type="text"
                value={upiId} 
                onChange={e => setUpiId(e.target.value)} 
                placeholder="yourname@upi"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Customers will send payments to this UPI ID
              </p>
            </div>

            {/* QR Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment QR Code
              </label>
              
              {qrUrl && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl inline-block">
                  <img 
                    src={qrUrl} 
                    alt="Payment QR Code" 
                    className="w-40 h-40 object-contain"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <label className="btn-secondary cursor-pointer inline-block">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleQrChange}
                    className="hidden"
                  />
                  {qrUrl ? '📷 Change QR' : '📷 Upload QR'}
                </label>
                {qrFile && (
                  <span className="text-sm text-green-600">
                    ✓ New file selected: {qrFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload your UPI QR code for easy customer payments
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t">
              <button 
                type="submit" 
                className={`btn-primary w-full py-3 ${saving ? 'opacity-70' : ''}`}
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Saving...
                  </span>
                ) : (
                  '💾 Save Settings'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 mt-6 border-red-200">
          <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
            <span>⚠️</span> Account
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Need to log out or switch accounts?
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminId');
              localStorage.removeItem('adminName');
              router.replace('/admin/login');
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}
