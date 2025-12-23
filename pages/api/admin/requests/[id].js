import prisma from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/adminAuth'

const ALLOWED_STATUSES = [
  'WAITING_FOR_PRICE',
  'PRICE_SENT',
  'PAYMENT_PENDING',
  'PAYMENT_RECEIVED',
  'ORDER_PLACED',
  'DELIVERED',
]

async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const request = await prisma.userRequest.findUnique({
      where: { id },
      include: { pricing: true, payment: true, tracking: true },
    })
    if (!request) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(request)
  }

  if (req.method === 'PATCH') {
    const { status } = req.body || {}

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const updated = await prisma.userRequest.update({
      where: { id },
      data: { status },
    })

    return res.status(200).json(updated)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
