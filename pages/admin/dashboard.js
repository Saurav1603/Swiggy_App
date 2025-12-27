import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import io from 'socket.io-client'
import AdminOrderPopup from '../../components/AdminOrderPopup'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [socket, setSocket] = useState(null)
  const [incoming, setIncoming] = useState([])
  const [adminId] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('adminId') : null)

  useEffect(() => {
    fetchStats();
    // init socket
    if (!socket && typeof window !== 'undefined') {
      const s = io('/api/socket')
      setSocket(s)
      s.on('connect', () => {
        if (adminId) s.emit('join_admin', adminId)
      })
      s.on('NEW_ORDER', (payload) => {
        setIncoming(prev => [...prev, payload])
      })
      s.on('ORDER_ACCEPTED', ({ orderId, adminId }) => {
        setIncoming(prev => prev.filter(i => i.orderId !== orderId))
      })
    }
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
        {incoming.map((ord) => (
          <AdminOrderPopup key={ord.orderId} order={ord} socket={socket} onDecision={async (action, id) => {
            if (action === 'accept') {
              await fetch(`/api/orders/${id}/accept`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ adminId }) })
            } else if (action === 'decline') {
              await fetch(`/api/orders/${id}/decline`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ adminId }) })
            } else {
              await fetch(`/api/orders/${ord.orderId}/decline`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ adminId }) })
            }
          }} />
        ))}
      </div>
    </Layout>
  );
}
