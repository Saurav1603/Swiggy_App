// GET /api/test/broadcast - Test Socket.IO broadcasting
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const io = globalThis.__io || global.__io
    
    if (!io) {
      return res.status(500).json({ 
        error: 'Socket.IO not initialized',
        tip: 'Make sure an admin has visited /admin/dashboard to initialize the socket'
      })
    }

    // Get all available admins
    const availableAdmins = await prisma.admin.findMany({
      where: { status: 'available' },
      select: { id: true, name: true, email: true }
    })

    // Get all connected sockets
    const sockets = await io.fetchSockets()
    const socketInfo = sockets.map(s => ({
      id: s.id,
      adminId: s.adminId,
      rooms: Array.from(s.rooms)
    }))

    // Send a test broadcast
    const testPayload = {
      orderId: 'test-' + Date.now(),
      requestId: 'test-request',
      request: {
        id: 'test-request',
        name: 'Test Customer',
        address: '123 Test Street',
        phone: '1234567890',
        notes: 'This is a test order',
        createdAt: new Date()
      },
      expiresAt: new Date(Date.now() + 45000)
    }

    // Broadcast to all admin rooms
    availableAdmins.forEach(admin => {
      io.to(`admin_${admin.id}`).emit('NEW_ORDER', testPayload)
    })

    // Also direct emit to all sockets with adminId
    sockets.forEach(socket => {
      if (socket.adminId) {
        socket.emit('NEW_ORDER', testPayload)
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Test broadcast sent',
      availableAdmins,
      connectedSockets: socketInfo,
      testPayload
    })
  } catch (err) {
    console.error('Test broadcast error:', err)
    return res.status(500).json({ error: err.message })
  }
}
