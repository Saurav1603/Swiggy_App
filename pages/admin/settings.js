import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [formData, setFormData] = useState({
    upiId: '',
    qrCodeUrl: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data);
        setFormData({
          upiId: data.upiId || '',
          qrCodeUrl: data.qrCodeUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, qrCodeUrl: data.url }));
        toast.success('QR code uploaded successfully');
      } else {
        toast.error('Failed to upload QR code');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!formData.upiId) {
      toast.error('Please enter your UPI ID');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Settings saved successfully');
        fetchAdminData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (res.ok) {
        toast.success('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error changing password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your payment settings and account preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg">
                👤
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">{admin?.name || 'Admin'}</h2>
                <p className="text-orange-100">{admin?.email}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-orange-50 border-t border-orange-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-600">Account active since {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Payment Settings</h3>
              <p className="text-sm text-gray-600">Configure your UPI payment details</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* UPI ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                placeholder="yourname@upi"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
              <p className="mt-1 text-xs text-gray-500">This is where customers will send payments</p>
            </div>

            {/* QR Code Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment QR Code
              </label>
              
              <div className="flex flex-col md:flex-row gap-4">
                {/* QR Preview */}
                <div className="w-40 h-40 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {formData.qrCodeUrl ? (
                    <img 
                      src={formData.qrCodeUrl} 
                      alt="Payment QR" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-3xl">📱</span>
                      <p className="text-xs text-gray-500 mt-2">No QR code</p>
                    </div>
                  )}
                </div>

                {/* Upload Section */}
                <div className="flex-1">
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-orange-200 rounded-lg p-6 text-center hover:border-orange-400 hover:bg-orange-50 transition-all">
                      {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-gray-600">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-orange-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm font-medium text-gray-700">Click to upload QR code</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Payment Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Security</h3>
                <p className="text-sm text-gray-600">Manage your account security</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordForm && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>💡</span> Tips for Payment Settings
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>Make sure your UPI ID is correct to receive payments</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>Upload a clear QR code image for easy scanning by customers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>Keep your password secure and change it regularly</span>
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
