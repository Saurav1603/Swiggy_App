// POST /api/orders
// Creates an Order and broadcasts to available admins via socket
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { requestId } = req.body
    // create order in pending -> broadcasted
    const order = await prisma.order.create({
      data: { requestId, status: 'broadcasted' },
    })

    // Emit via Socket to available admins only
    const io = globalThis.__io
    if (io) {
      const admins = await prisma.admin.findMany({ where: { status: 'available' } })
      const request = requestId ? await prisma.userRequest.findUnique({ where: { id: requestId } }) : null
      admins.forEach(a => {
        io.to(`admin_${a.id}`).emit('NEW_ORDER', { orderId: order.id, requestId, request })
      })
    }

    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}
