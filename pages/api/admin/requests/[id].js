import prisma, { withRetry } from '../../../../lib/prisma'
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
  const adminId = req.admin?.id

  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Verify this order is assigned to the current admin
  const order = await withRetry(async () => {
    return prisma.order.findFirst({
      where: {
        requestId: id,
        assignedAdminId: adminId
      }
    })
  })

  if (!order) {
    return res.status(403).json({ error: 'You do not have access to this order' })
  }

  if (req.method === 'GET') {
    const request = await withRetry(async () => {
      return prisma.userRequest.findUnique({
        where: { id },
        include: { pricing: true, payment: true, tracking: true },
      })
    })
    if (!request) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(request)
  }

  if (req.method === 'PATCH') {
    const { status } = req.body || {}

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const updated = await withRetry(async () => {
      return prisma.userRequest.update({
        where: { id },
        data: { status },
      })
    })

    return res.status(200).json(updated)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
