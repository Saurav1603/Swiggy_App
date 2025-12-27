// POST /api/orders/:id/accept
// Admin accepts an order. Transactional: ensure only one admin can accept.
import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { id } = req.query
    const { adminId } = req.body
    if (!adminId) return res.status(400).json({ error: 'Missing adminId' })

    // Transaction: check status and assign
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } })
      if (!order) throw new Error('Order not found')
      if (order.status !== 'broadcasted') throw new Error('Order not available')

      const admin = await tx.admin.findUnique({ where: { id: adminId } })
      if (!admin) throw new Error('Admin not found')
      if (admin.status !== 'available') throw new Error('Admin not available')

      // assign admin and update statuses
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: 'accepted', assignedAdminId: adminId },
      })

      await tx.admin.update({ where: { id: adminId }, data: { status: 'busy' } })

      return updatedOrder
    })

    // Notify sockets
    const io = globalThis.__io
    if (io) {
      io.emit('ORDER_ACCEPTED', { orderId: id, adminId })
    }

    res.json(result)
  } catch (err) {
    console.error(err)
    if (err.message === 'Order not available') return res.status(409).json({ error: err.message })
    res.status(500).json({ error: err.message || 'Server error' })
  }
}
