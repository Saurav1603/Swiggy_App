import Layout from '../../components/Layout';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import io from 'socket.io-client'
import AdminOrderPopup from '../../components/AdminOrderPopup'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [socket, setSocket] = useState(null)
  const [incoming, setIncoming] = useState([])
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('adminId')
      const name = localStorage.getItem('adminName')
      setAdminId(id)
      setAdminName(name || 'Admin')
      
      if (!id) {
        // Redirect to login if no adminId
        window.location.href = '/admin'
        return
      }
    }
  }, [])

  useEffect(() => {
    if (!adminId) return

    fetchStats();
    
    // Initialize Socket.IO connection
    const initSocket = async () => {
      try {
        // Ping to ensure server-side Socket.IO is initialized
        await fetch('/api/socket')
      } catch (e) {
        console.warn('Socket init ping failed', e)
      }

      const s = io({
        transports: ['websocket', 'polling'],
        timeout: 10000,
      })
      
      setSocket(s)

      s.on('connect', () => {
        console.log('Socket connected:', s.id)
        setIsConnected(true)
        // Join admin room
        s.emit('join_admin', adminId)
        toast.success('Connected to order notifications', { duration: 2000 })
      })

      s.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      s.on('NEW_ORDER', (payload) => {
        console.log('New order received:', payload)
        // Add to incoming orders if not already present
        setIncoming(prev => {
          if (prev.find(o => o.orderId === payload.orderId)) return prev
          return [...prev, payload]
        })
        // Play sound
        try {
          new Audio('/notification.mp3').play().catch(() => {})
        } catch (e) {}
      })

      s.on('ORDER_ACCEPTED', ({ orderId, adminId: acceptedBy }) => {
        console.log('Order accepted:', orderId, 'by:', acceptedBy)
        // Remove from incoming
        setIncoming(prev => prev.filter(o => o.orderId !== orderId))
        if (acceptedBy === adminId) {
          toast.success('🎉 Order accepted! Check your orders.')
        }
      })

      s.on('ORDER_EXPIRED', ({ orderId }) => {
        console.log('Order expired:', orderId)
        setIncoming(prev => prev.filter(o => o.orderId !== orderId))
      })

      s.on('ORDER_DECLINED', ({ orderId, adminId: declinedBy }) => {
        console.log('Order declined by:', declinedBy)
      })
    }

    initSocket()

    // Refresh stats periodically
    const statsInterval = setInterval(fetchStats, 30000)

    return () => {
      clearInterval(statsInterval)
      if (socket) {
        socket.disconnect()
      }
    }
  }, [adminId]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/earnings');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    }
  };

  const handleOrderDecision = useCallback(async (action, orderId) => {
    if (!adminId || !orderId) return

    try {
      if (action === 'accept') {
        const res = await fetch(`/api/orders/${orderId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId })
        })
        
        if (res.ok) {
          toast.success('✅ Order accepted!')
          setIncoming(prev => prev.filter(o => o.orderId !== orderId))
          fetchStats()
        } else {
          const data = await res.json()
          if (data.error === 'Order not available') {
            toast.error('Order was already taken by another admin')
          } else {
            toast.error(data.error || 'Failed to accept order')
          }
          setIncoming(prev => prev.filter(o => o.orderId !== orderId))
        }
      } else if (action === 'decline' || action === 'timeout') {
        await fetch(`/api/orders/${orderId}/decline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId })
        })
        setIncoming(prev => prev.filter(o => o.orderId !== orderId))
        if (action === 'timeout') {
          toast('⏰ Order timed out', { icon: '⏰' })
        }
      } else if (action === 'taken') {
        // Order was taken by another admin
        setIncoming(prev => prev.filter(o => o.orderId !== orderId))
      }
    } catch (err) {
      console.error('Order decision error:', err)
      toast.error('Network error')
    }
  }, [adminId])

  const handleLogout = async () => {
    // Set admin status to offline
    if (adminId) {
      try {
        await fetch(`/api/manager/admins/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'offline' })
        })
      } catch (e) {}
    }
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminId')
    localStorage.removeItem('adminName')
    if (socket) socket.disconnect()
    window.location.href = '/admin'
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fadeIn">
        {/* Connection Status */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {adminName}!</h1>
            <p className="text-gray-500 text-sm">Admin Dashboard</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
        </div>

        {/* Stats Cards */}
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

        {/* Navigation */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <Link href="/admin" className="btn-primary inline-block">Go to Orders</Link>
          <Link href="/admin/settings" className="btn-secondary inline-block">Settings</Link>
          <button onClick={handleLogout} className="btn-secondary inline-block">Logout</button>
        </div>

        {/* Incoming Orders Info */}
        {incoming.length > 0 && (
          <div className="card p-4 bg-orange-50 border-orange-200 mb-4">
            <div className="flex items-center gap-2">
              <span className="animate-bounce text-2xl">🔔</span>
              <span className="font-medium text-orange-700">
                {incoming.length} new order{incoming.length > 1 ? 's' : ''} waiting for response!
              </span>
            </div>
          </div>
        )}

        {/* Order Popups */}
        {incoming.map((ord, index) => (
          <div key={ord.orderId} style={{ transform: `translateY(-${index * 10}px)` }}>
            <AdminOrderPopup 
              order={ord} 
              socket={socket} 
              onDecision={handleOrderDecision}
            />
          </div>
        ))}
      </div>
    </Layout>
  );
}
