// GET /api/admin/orders/active
// Returns currently broadcasted orders and their state
import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const orders = await prisma.order.findMany({ where: { status: 'broadcasted' }, include: { request: true } })
    res.json(orders)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}
