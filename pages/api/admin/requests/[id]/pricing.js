import prisma from '../../../../../lib/prisma'
import { requireAdmin } from '../../../../../lib/adminAuth'

async function handler(req, res) {
  const { id } = req.query // requestId

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

      const pricing = await prisma.pricing.upsert({
        where: { requestId: id },
        update: { foodPrice: fp, deliveryFee: df, platformFee: pf, serviceCharge: sc, total },
        create: { requestId: id, foodPrice: fp, deliveryFee: df, platformFee: pf, serviceCharge: sc, total },
      })

      // Update request status
      await prisma.userRequest.update({ where: { id }, data: { status: 'PRICE_SENT' } })

      return res.status(200).json(pricing)
    } catch (err) {
      console.error('Pricing error:', err)
      return res.status(500).json({ error: 'Failed to save pricing' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
