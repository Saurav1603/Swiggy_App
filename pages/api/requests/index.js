import prisma from '../../../lib/prisma'
import { withRateLimit } from '../../../lib/rateLimit'
import { broadcastToAdmins } from '../../../lib/socketInit'

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

      // Get all available admins
      const availableAdmins = await prisma.admin.findMany({ 
        where: { status: 'available' },
        select: { id: true, name: true }
      })
      
      console.log('Available admins for broadcast:', availableAdmins.map(a => ({ id: a.id, name: a.name })))
      
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

      // Broadcast via Socket.IO
      const io = global.__io || globalThis.__io
      console.log('Socket.IO available:', !!io)
      console.log('Connected admins:', global.__connectedAdmins ? Array.from(global.__connectedAdmins.keys()) : 'none')
      
      if (io) {
        // Method 1: Emit to each available admin's room
        availableAdmins.forEach(admin => {
          console.log(`Emitting NEW_ORDER to room admin_${admin.id}`)
          io.to(`admin_${admin.id}`).emit('NEW_ORDER', payload)
        })

        // Method 2: Also try direct emit to all connected sockets
        try {
          const sockets = await io.fetchSockets()
          console.log('Connected sockets:', sockets.length)
          sockets.forEach(socket => {
            const isAvailable = availableAdmins.find(a => a.id === socket.adminId)
            if (socket.adminId && isAvailable) {
              console.log(`Direct emit to socket ${socket.id} (admin ${socket.adminId})`)
              socket.emit('NEW_ORDER', payload)
            }
          })
        } catch (e) {
          console.log('fetchSockets error:', e.message)
        }

        console.log(`Order ${order.id} broadcast attempted to ${availableAdmins.length} admins`)
      } else {
        console.log('Socket.IO not initialized - order created but not broadcasted')
        console.log('Admins need to visit /admin/dashboard to initialize socket')
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
