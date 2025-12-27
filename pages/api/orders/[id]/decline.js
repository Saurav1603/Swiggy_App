// POST /api/orders/:id/decline
// Admin declines an order. If all available admins decline, mark expired.
import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { id } = req.query
    const { adminId } = req.body
    if (!adminId) return res.status(400).json({ error: 'Missing adminId' })

    // record decline (unique constraint prevents duplicates)
    try {
      await prisma.orderDecline.create({ data: { orderId: id, adminId } })
    } catch (e) {
      // ignore duplicates
    }

    // Check if there are any available admins left who haven't declined
    const availableAdmins = await prisma.admin.findMany({ where: { status: 'available' } })
    const declines = await prisma.orderDecline.count({ where: { orderId: id } })

    if (availableAdmins.length > declines) {
      // some admins still left, just notify
      const io = globalThis.__io
      if (io) io.emit('ORDER_DECLINED', { orderId: id, adminId })
      return res.json({ ok: true })
    }

    // all declined -> expire order
    const order = await prisma.order.update({ where: { id }, data: { status: 'expired' } })
    const io = globalThis.__io
    if (io) io.emit('ORDER_EXPIRED', { orderId: id })
    return res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Server error' })
  }
}
