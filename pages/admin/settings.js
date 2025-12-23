import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
    const res = await fetch('/api/admin/payment-info');
    if (res.ok) {
      const data = await res.json();
      setUpiId(data.upiId || '');
      setQrUrl(data.qrUrl || '');
    }
  };

  const handleQrChange = (e) => {
    if (e.target.files[0]) setQrFile(e.target.files[0]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    let uploadedQrUrl = qrUrl;
    if (qrFile) {
      const form = new FormData();
      form.append('file', qrFile);
      const res = await fetch('/api/admin/upload-qr', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) uploadedQrUrl = data.url;
      else toast.error(data.error || 'QR upload failed');
    }
    const res = await fetch('/api/admin/payment-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upiId, qrUrl: uploadedQrUrl })
    });
    if (res.ok) {
      toast.success('Payment info updated!');
      setQrUrl(uploadedQrUrl);
      setQrFile(null);
    } else {
      toast.error('Failed to update payment info');
    }
    setSaving(false);
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto animate-fadeIn">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">UPI ID</label>
            <input value={upiId} onChange={e => setUpiId(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">QR Code</label>
            {qrUrl && <img src={qrUrl} alt="QR" className="w-32 h-32 object-contain mb-2 border rounded" />}
            <input type="file" accept="image/*" onChange={handleQrChange} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
        {/* Additional settings can be added here */}
      </div>
    </Layout>
  );
}
