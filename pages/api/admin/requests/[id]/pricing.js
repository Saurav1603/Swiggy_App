import prisma, { withRetry } from '../../../../../lib/prisma'
import { requireAdmin } from '../../../../../lib/adminAuth'

async function handler(req, res) {
  const { id } = req.query // requestId
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
    try {
      const { foodPrice, deliveryFee, platformFee, serviceCharge } = req.body || {}

      if ([foodPrice, deliveryFee, platformFee, serviceCharge].some((v) => v === undefined || v === '')) {
        return res.status(400).json({ error: 'All pricing fields required' })
      }

      const fp = parseFloat(foodPrice)
      const df = parseFloat(deliveryFee)
      const pf = parseFloat(platformFee)
      const sc = parseFloat(serviceCharge)
      const total = fp + df + pf + sc

      const pricing = await withRetry(async () => {
        return prisma.pricing.upsert({
          where: { requestId: id },
          update: { foodPrice: fp, deliveryFee: df, platformFee: pf, serviceCharge: sc, total },
          create: { requestId: id, foodPrice: fp, deliveryFee: df, platformFee: pf, serviceCharge: sc, total },
        })
      })

      // Update request status
      await withRetry(async () => {
        return prisma.userRequest.update({ where: { id }, data: { status: 'PRICE_SENT' } })
      })

      return res.status(200).json(pricing)
    } catch (err) {
      console.error('Pricing error:', err)
      return res.status(500).json({ error: 'Failed to save pricing' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
