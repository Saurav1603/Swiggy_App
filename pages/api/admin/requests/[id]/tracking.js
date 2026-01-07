import prisma, { withRetry } from '../../../../../lib/prisma'
import { requireAdmin } from '../../../../../lib/adminAuth'

async function handler(req, res) {
  const { id } = req.query
  const adminId = req.admin?.id

  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Verify this order is assigned to the current admin
  const order = await withRetry(async () => {
    return prisma.order.findFirst({
      where: { requestId: id, assignedAdminId: adminId }
    })
  })

  if (!order) {
    return res.status(403).json({ error: 'You do not have access to this order' })
  }

  if (req.method === 'POST') {
    const { trackingUrl, eta, partnerName } = req.body || {}

    const tracking = await withRetry(async () => {
      return prisma.tracking.upsert({
        where: { requestId: id },
        update: { trackingUrl, eta, partnerName },
        create: { requestId: id, trackingUrl, eta, partnerName },
      })
    })

    // If tracking is added, mark as ORDER_PLACED
    await withRetry(async () => {
      return prisma.userRequest.update({ where: { id }, data: { status: 'ORDER_PLACED' } })
    })

    return res.status(200).json(tracking)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
