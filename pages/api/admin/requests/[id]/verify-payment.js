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
    // Admin manually marks payment as verified
    const payment = await withRetry(async () => {
      return prisma.payment.findUnique({ where: { requestId: id } })
    })

    if (!payment) {
      return res.status(400).json({ error: 'No payment record found' })
    }

    await withRetry(async () => {
      return prisma.payment.update({ where: { id: payment.id }, data: { verified: true } })
    })
    await withRetry(async () => {
      return prisma.userRequest.update({ where: { id }, data: { status: 'PAYMENT_RECEIVED' } })
    })

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
