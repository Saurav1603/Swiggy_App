// POST /api/orders/:id/accept
// Admin accepts an order. Transactional: ensure only one admin can accept.
import prisma, { withRetry } from '../../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { id } = req.query
    const { adminId } = req.body
    
    console.log('Accept order request:', { orderId: id, adminId })
    
    if (!adminId) {
      console.log('Missing adminId in request body')
      return res.status(400).json({ error: 'Missing adminId' })
    }

    // Transaction: check status and assign
    const result = await withRetry(async () => {
      return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ 
          where: { id },
          include: { request: true }
        })
        if (!order) {
          console.log('Order not found:', id)
          throw new Error('Order not found')
        }
        if (order.status !== 'broadcasted') {
          console.log('Order not available, current status:', order.status)
          throw new Error('Order not available')
        }

        const admin = await tx.admin.findUnique({ where: { id: adminId } })
        if (!admin) {
          console.log('Admin not found:', adminId)
          throw new Error('Admin not found')
        }
        if (admin.status !== 'available') {
          console.log('Admin not available, current status:', admin.status)
          throw new Error('Admin not available')
        }

        // Assign admin and update order status
        const updatedOrder = await tx.order.update({
          where: { id },
          data: { status: 'accepted', assignedAdminId: adminId },
        })

        // Update the UserRequest status to WAITING_FOR_PRICE so admin can work on it
        if (order.requestId) {
          await tx.userRequest.update({
            where: { id: order.requestId },
            data: { status: 'WAITING_FOR_PRICE' }
          })
        }

        // Set admin status to busy
        await tx.admin.update({ where: { id: adminId }, data: { status: 'busy' } })

        console.log('Order accepted successfully:', id, 'by admin:', adminId)
        return updatedOrder
      })
    })

    // Notify ALL sockets that order was accepted (removes popup from other admins)
    const io = globalThis.__io
    if (io) {
      console.log(`📢 Broadcasting ORDER_ACCEPTED for order ${id} by admin ${adminId}`)
      io.emit('ORDER_ACCEPTED', { orderId: id, adminId })
    }

    res.json(result)
  } catch (err) {
    console.error(err)
    if (err.message === 'Order not available') return res.status(409).json({ error: err.message })
    res.status(500).json({ error: err.message || 'Server error' })
  }
}
