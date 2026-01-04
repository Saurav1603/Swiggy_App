// GET /api/test/broadcast - Test Socket.IO broadcasting
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const io = global.__io || globalThis.__io
    const connectedAdmins = global.__connectedAdmins ? Array.from(global.__connectedAdmins.entries()) : []
    
    if (!io) {
      return res.status(200).json({ 
        socketInitialized: false,
        error: 'Socket.IO not initialized',
        tip: 'Make sure an admin has visited /admin/dashboard to initialize the socket',
        connectedAdmins: []
      })
    }

    // Get all admins from database
    const allAdmins = await prisma.admin.findMany({
      select: { id: true, name: true, email: true, status: true }
    })

    // Get available admins
    const availableAdmins = allAdmins.filter(a => a.status === 'available')

    // Get all connected sockets
    let socketInfo = []
    try {
      const sockets = await io.fetchSockets()
      socketInfo = sockets.map(s => ({
        id: s.id,
        adminId: s.adminId || 'not set',
        rooms: Array.from(s.rooms)
      }))
    } catch (e) {
      console.log('fetchSockets error:', e.message)
    }

    // Send a test broadcast
    const testPayload = {
      orderId: 'test-' + Date.now(),
      requestId: 'test-request',
      request: {
        id: 'test-request',
        name: 'Test Customer',
        address: '123 Test Street',
        phone: '1234567890',
        notes: 'This is a test order - you should see a popup!',
        createdAt: new Date()
      },
      expiresAt: new Date(Date.now() + 45000)
    }

    // Broadcast to all admin rooms
    let broadcastCount = 0
    availableAdmins.forEach(admin => {
      io.to(`admin_${admin.id}`).emit('NEW_ORDER', testPayload)
      broadcastCount++
    })

    // Also direct emit to all sockets with adminId
    socketInfo.forEach(socket => {
      if (socket.adminId && socket.adminId !== 'not set') {
        // Direct emit via io
        io.to(socket.id).emit('NEW_ORDER', testPayload)
      }
    })

    return res.status(200).json({
      socketInitialized: true,
      success: true,
      message: `Test broadcast sent to ${broadcastCount} admin rooms`,
      allAdmins: allAdmins.map(a => ({ id: a.id, name: a.name, status: a.status })),
      availableAdmins: availableAdmins.map(a => ({ id: a.id, name: a.name })),
      connectedAdminsMap: connectedAdmins,
      connectedSockets: socketInfo,
      testPayload,
      debugTips: [
        'Admin must be logged in and on /admin/dashboard page',
        'Admin status must be "available" in database',
        'Check browser console for "Socket connected" and "New order received" logs',
        'Check browser console for any errors'
      ]
    })
  } catch (err) {
    console.error('Test broadcast error:', err)
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}
