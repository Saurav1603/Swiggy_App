import prisma from '../../../lib/prisma'
import { withRateLimit } from '../../../lib/rateLimit'

async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, address, cartImageUrl, notes, phone } = req.body || {}

    if (!name || !address || !cartImageUrl) {
      return res.status(400).json({ error: 'Name, address and cart image are required' })
    }

    // Create the user request
    const created = await prisma.userRequest.create({
      data: { 
        name, 
        phone: phone || '',
        address, 
        cartImageUrl, 
        notes: notes || null 
      },
    })

    // Create an order and broadcast to all available admins
    let orderCreated = false
    let broadcastSuccess = false
    
    try {
      const order = await prisma.order.create({
        data: { 
          requestId: created.id, 
          status: 'broadcasted',
          expiresAt: new Date(Date.now() + 60 * 1000) // 60 second timeout
        },
      })
      orderCreated = true

      // Get all available admins
      const availableAdmins = await prisma.admin.findMany({ 
        where: { status: 'available' },
        select: { id: true, name: true }
      })
      
      console.log('📋 New order created:', order.id)
      console.log('👥 Available admins:', availableAdmins.length, availableAdmins.map(a => a.name))
      
      const payload = {
        orderId: order.id,
        requestId: created.id,
        request: {
          id: created.id,
          name: created.name,
          address: created.address,
          phone: created.phone,
          notes: created.notes,
          cartImageUrl: created.cartImageUrl,
          createdAt: created.createdAt
        },
        expiresAt: order.expiresAt
      }

      // Get Socket.IO instance - check multiple sources
      const io = res.socket?.server?.io || global.__io || globalThis.__io
      
      console.log('🔌 Socket.IO check:')
      console.log('   - res.socket.server.io:', !!res.socket?.server?.io)
      console.log('   - global.__io:', !!global.__io)
      console.log('   - globalThis.__io:', !!globalThis.__io)
      
      if (io) {
        // Emit to each available admin's room
        let emitCount = 0
        availableAdmins.forEach(admin => {
          console.log(`📤 Emitting NEW_ORDER to room admin_${admin.id}`)
          io.to(`admin_${admin.id}`).emit('NEW_ORDER', payload)
          emitCount++
        })

        // Also broadcast to ALL connected sockets (fallback)
        io.emit('NEW_ORDER', payload)
        console.log('📤 Also broadcast to all connected sockets')

        // Try direct emit to connected sockets
        try {
          const sockets = await io.fetchSockets()
          console.log(`🔗 Connected sockets: ${sockets.length}`)
          sockets.forEach(socket => {
            console.log(`   Socket ${socket.id}: adminId=${socket.adminId || 'none'}, rooms=${Array.from(socket.rooms).join(',')}`)
          })
        } catch (e) {
          console.log('fetchSockets error:', e.message)
        }

        broadcastSuccess = true
        console.log(`✅ Order ${order.id} broadcast to ${emitCount} admin rooms`)
      } else {
        console.log('⚠️ Socket.IO not initialized')
        console.log('   Admins need to be on /admin/dashboard to receive notifications')
      }
    } catch (err) {
      console.error('❌ Error creating order/broadcast:', err)
    }

    return res.status(201).json({ 
      id: created.id,
      orderCreated,
      broadcastSuccess
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRateLimit(handler)
