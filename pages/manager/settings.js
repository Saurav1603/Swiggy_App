import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ManagerLayout from '../../components/ManagerLayout';
import toast from 'react-hot-toast';

export default function ManagerSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'Swiggy Concierge',
    notificationsEnabled: true,
    autoAssignOrders: false,
    maxOrdersPerAdmin: 5,
    commissionRate: 10,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('managerToken');
      if (!token) {
        router.replace('/manager');
        return;
      }
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManagerLayout title="Settings" subtitle="Configure platform settings">
      <div className="max-w-3xl">
        {/* General Settings */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
          <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
            ⚙️ General Settings
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Commission Rate (%)</label>
              <input
                type="number"
                value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Max Orders Per Admin</label>
              <input
                type="number"
                value={settings.maxOrdersPerAdmin}
                onChange={(e) => setSettings({ ...settings, maxOrdersPerAdmin: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
          <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
            🔔 Notification & Automation
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <div className="font-medium text-white">Push Notifications</div>
                <div className="text-sm text-white/50">Send notifications to admins for new orders</div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <div className="font-medium text-white">Auto-Assign Orders</div>
                <div className="text-sm text-white/50">Automatically assign orders to available admins</div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoAssignOrders: !settings.autoAssignOrders })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.autoAssignOrders ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.autoAssignOrders ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 mb-6">
          <h3 className="font-bold text-red-400 text-lg mb-6 flex items-center gap-2">
            ⚠️ Danger Zone
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl">
              <div>
                <div className="font-medium text-white">Reset All Data</div>
                <div className="text-sm text-red-400/70">This action cannot be undone</div>
              </div>
              <button
                onClick={() => toast.error('This feature is disabled for safety')}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl">
              <div>
                <div className="font-medium text-white">Clear All Orders</div>
                <div className="text-sm text-red-400/70">Remove all completed orders from history</div>
              </div>
              <button
                onClick={() => toast.error('This feature is disabled for safety')}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </ManagerLayout>
  );
}
