import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/earnings');
    if (res.ok) setStats(await res.json());
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fadeIn">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-5 text-center">
            <div className="text-3xl font-bold text-green-600">₹{stats?.totalEarnings || 0}</div>
            <div className="text-gray-500 mt-2">Total Earnings</div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-2xl font-bold">{stats?.deliveredCount || 0}</div>
            <div className="text-gray-500 mt-2">Delivered</div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-2xl font-bold">{stats?.pendingCount || 0}</div>
            <div className="text-gray-500 mt-2">Pending</div>
          </div>
        </div>
        <div className="mb-4 flex gap-2">
          <Link href="/admin" className="btn-primary inline-block">Go to Orders</Link>
          <Link href="/admin/settings" className="btn-secondary inline-block">Go to Settings</Link>
        </div>
      </div>
    </Layout>
  );
}
