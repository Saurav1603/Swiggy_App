import prisma, { withRetry } from '../../../lib/prisma'
import { withRateLimit } from '../../../lib/rateLimit'

async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { name, address, cartImageUrl, notes, phone } = req.body || {}

      if (!name || !address || !cartImageUrl) {
        return res.status(400).json({ error: 'Name, address and cart image are required' })
      }

      const created = await withRetry(async () => {
        return prisma.userRequest.create({
          data: { name, phone: phone || '', address, cartImageUrl, notes: notes || null },
        })
      })

      let orderCreated = false
      let broadcastSuccess = false
      
      try {
        const order = await withRetry(async () => {
          return prisma.order.create({
            data: { requestId: created.id, status: 'broadcasted', expiresAt: new Date(Date.now() + 60000) },
          })
        })
        orderCreated = true

        const availableAdmins = await withRetry(async () => {
          return prisma.admin.findMany({ where: { status: 'available' }, select: { id: true, name: true } })
        })
        
        const payload = {
          orderId: order.id,
          requestId: created.id,
          request: { id: created.id, name: created.name, address: created.address, phone: created.phone, notes: created.notes, cartImageUrl: created.cartImageUrl, createdAt: created.createdAt },
          expiresAt: order.expiresAt
        }

        const io = res.socket?.server?.io || global.__io || globalThis.__io
        
        if (io) {
          availableAdmins.forEach(admin => { io.to('admin_' + admin.id).emit('NEW_ORDER', payload) })
          io.emit('NEW_ORDER', payload)
          broadcastSuccess = true
        }
      } catch (orderErr) {
        console.error('Error creating order:', orderErr)
      }

      return res.status(201).json({ id: created.id, orderCreated, broadcastSuccess })

    } catch (err) {
      console.error('Error creating request:', err)
      return res.status(500).json({ error: 'Failed to create request', message: err.message || 'Database error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRateLimit(handler)
