import prisma from '../../../../../lib/prisma'
import { requireAdmin } from '../../../../../lib/adminAuth'

async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'POST') {
    const { trackingUrl, eta, partnerName } = req.body || {}

    const tracking = await prisma.tracking.upsert({
      where: { requestId: id },
      update: { trackingUrl, eta, partnerName },
      create: { requestId: id, trackingUrl, eta, partnerName },
    })

    // If tracking is added, mark as ORDER_PLACED
    await prisma.userRequest.update({ where: { id }, data: { status: 'ORDER_PLACED' } })

    return res.status(200).json(tracking)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
