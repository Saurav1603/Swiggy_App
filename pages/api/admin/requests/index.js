import prisma, { withRetry } from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/adminAuth'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { status } = req.query
    const where = status ? { status } : {}

    const requests = await withRetry(async () => {
      return prisma.userRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { pricing: true, payment: true, tracking: true },
      })
    })

    return res.status(200).json(requests)
  } catch (err) {
    console.error('Get admin requests error:', err)
    return res.status(503).json({ 
      error: 'Database unavailable', 
      message: 'Please try again in a moment'
    })
  }
}

export default requireAdmin(handler)
