import prisma from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/adminAuth'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { status } = req.query

  const where = status ? { status } : {}

  const requests = await prisma.userRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { pricing: true, payment: true, tracking: true },
  })

  return res.status(200).json(requests)
}

export default requireAdmin(handler)
