import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ManagerLayout from '../../components/ManagerLayout';
import toast from 'react-hot-toast';

const ADMIN_STATUS_CONFIG = {
  available: { color: 'bg-green-500', bgLight: 'bg-green-500/20', text: 'text-green-400', label: 'Available' },
  busy: { color: 'bg-yellow-500', bgLight: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Busy' },
  offline: { color: 'bg-gray-500', bgLight: 'bg-gray-500/20', text: 'text-gray-400', label: 'Offline' }
};

export default function ManageAdmins() {
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('managerToken');
      if (!token) {
        router.replace('/manager');
        return;
      }
    }
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/manager/admins');
      if (res.ok) {
        setAdmins(await res.json());
      }
    } catch (err) {
      console.error('Fetch admins error:', err);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    if (filter === 'all') return true;
    return admin.status === filter;
  });

  const handleSelectAdmin = (admin) => {
    setSelectedAdmin(admin);
    setEditName(admin.name);
    setEditStatus(admin.status);
    setEditMode(false);
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;
    try {
      const res = await fetch(`/api/manager/admins/${selectedAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, status: editStatus })
      });
      if (res.ok) {
        toast.success('Admin updated!');
        fetchAdmins();
        setEditMode(false);
        setSelectedAdmin({ ...selectedAdmin, name: editName, status: editStatus });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/manager/admins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Admin deleted');
        fetchAdmins();
        if (selectedAdmin?.id === id) setSelectedAdmin(null);
      } else {
        toast.error('Delete failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleSetStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/manager/admins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Status set to ${status}`);
        fetchAdmins();
        if (selectedAdmin?.id === id) {
          setSelectedAdmin({ ...selectedAdmin, status });
          setEditStatus(status);
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const statusCounts = {
    all: admins.length,
    available: admins.filter(a => a.status === 'available').length,
    busy: admins.filter(a => a.status === 'busy').length,
    offline: admins.filter(a => a.status === 'offline').length,
  };

  return (
    <ManagerLayout title="Manage Admins" subtitle={`${admins.length} registered admins`}>
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { key: 'all', label: 'All', icon: '👥', color: 'bg-white/10' },
          { key: 'available', label: 'Available', icon: '🟢', color: 'bg-green-500/20' },
          { key: 'busy', label: 'Busy', icon: '🟡', color: 'bg-yellow-500/20' },
          { key: 'offline', label: 'Offline', icon: '⚫', color: 'bg-gray-500/20' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`p-4 rounded-xl border transition-all ${
              filter === item.key 
                ? 'border-orange-500 bg-orange-500/20' 
                : 'border-white/10 hover:border-white/20 ' + item.color
            }`}
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-2xl font-bold text-white">{statusCounts[item.key]}</div>
            <div className="text-xs text-white/60">{item.label}</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Admin List */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Admin List</h2>
              <Link 
                href="/admin/register" 
                target="_blank"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all"
              >
                + Add Admin
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-white/60">Loading admins...</p>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-5xl mb-4 block">👤</span>
                <p className="text-white/60">No admins found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredAdmins.map((admin) => {
                  const statusConfig = ADMIN_STATUS_CONFIG[admin.status] || ADMIN_STATUS_CONFIG.offline;
                  return (
                    <div
                      key={admin.id}
                      onClick={() => handleSelectAdmin(admin)}
                      className={`p-5 cursor-pointer transition-all hover:bg-white/5 ${
                        selectedAdmin?.id === admin.id ? 'bg-orange-500/10 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              {admin.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${statusConfig.color}`}></span>
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{admin.name}</div>
                            <div className="text-sm text-white/50">{admin.email}</div>
                            <div className="text-xs text-white/40 mt-1">
                              Joined {new Date(admin.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-sm rounded-full ${statusConfig.bgLight} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Admin Details Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 sticky top-24">
            {selectedAdmin ? (
              <>
                {/* Header */}
                <div className="p-6 border-b border-white/10 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto">
                      {selectedAdmin.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-slate-900 ${ADMIN_STATUS_CONFIG[selectedAdmin.status]?.color}`}></span>
                  </div>
                  
                  {editMode ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center font-bold"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-white">{selectedAdmin.name}</h3>
                  )}
                  <p className="text-white/60 text-sm mt-1">{selectedAdmin.email}</p>
                </div>

                {/* Status Control */}
                <div className="p-6 border-b border-white/10">
                  <label className="text-sm font-medium text-white/60 mb-3 block">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['available', 'busy', 'offline'].map((status) => {
                      const config = ADMIN_STATUS_CONFIG[status];
                      const isActive = editMode ? editStatus === status : selectedAdmin.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => editMode ? setEditStatus(status) : handleSetStatus(selectedAdmin.id, status)}
                          className={`p-3 rounded-lg text-center transition-all ${
                            isActive 
                              ? `${config.bgLight} border-2 border-current ${config.text}` 
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${config.color} mx-auto mb-1`}></div>
                          <div className="text-xs font-medium">{config.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 border-b border-white/10 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">ID</span>
                    <span className="text-white font-mono text-xs">{selectedAdmin.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Joined</span>
                    <span className="text-white">{new Date(selectedAdmin.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleUpdateAdmin}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                      >
                        ✓ Save Changes
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode(true)}
                        className="w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                      >
                        ✏️ Edit Admin
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(selectedAdmin.id)}
                        className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                      >
                        🗑️ Delete Admin
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <span className="text-5xl mb-4 block">👈</span>
                <p className="text-white/60">Select an admin to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
