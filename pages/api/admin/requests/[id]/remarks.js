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

  if (req.method === 'GET') {
    const request = await withRetry(async () => {
      return prisma.userRequest.findUnique({
        where: { id },
        select: { remarks: true },
      })
    })
    if (!request) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ remarks: request.remarks || '' })
  }

  if (req.method === 'POST') {
    const { remarks } = req.body || {}
    const updated = await withRetry(async () => {
      return prisma.userRequest.update({
        where: { id },
        data: { remarks },
      })
    })
    return res.status(200).json({ remarks: updated.remarks })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
