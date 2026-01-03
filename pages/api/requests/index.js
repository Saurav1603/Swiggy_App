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
    try {
      const order = await prisma.order.create({
        data: { 
          requestId: created.id, 
          status: 'broadcasted',
          expiresAt: new Date(Date.now() + 60 * 1000) // 60 second timeout
        },
      })

      // Broadcast via Socket.IO to all available admins
      const io = globalThis.__io || global.__io
      console.log('Socket.IO available:', !!io)
      
      if (io) {
        const availableAdmins = await prisma.admin.findMany({ 
          where: { status: 'available' },
          select: { id: true, name: true }
        })
        
        console.log('Available admins:', availableAdmins.map(a => a.id))
        
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

        // Method 1: Emit to each available admin's room
        availableAdmins.forEach(admin => {
          console.log(`Emitting to room admin_${admin.id}`)
          io.to(`admin_${admin.id}`).emit('NEW_ORDER', payload)
        })

        // Method 2: Also broadcast to all connected sockets that have adminId
        const sockets = await io.fetchSockets()
        console.log('Connected sockets:', sockets.length)
        sockets.forEach(socket => {
          if (socket.adminId && availableAdmins.find(a => a.id === socket.adminId)) {
            console.log(`Direct emit to socket ${socket.id} (admin ${socket.adminId})`)
            socket.emit('NEW_ORDER', payload)
          }
        })

        console.log(`Order ${order.id} broadcasted to ${availableAdmins.length} available admins`)
      } else {
        console.log('Socket.IO not initialized - order created but not broadcasted')
      }
    } catch (err) {
      console.error('Error creating order broadcast:', err)
      // Don't fail the request creation if broadcasting fails
    }

    return res.status(201).json({ id: created.id })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRateLimit(handler)
