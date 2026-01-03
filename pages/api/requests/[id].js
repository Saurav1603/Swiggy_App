import prisma, { withRetry } from '../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const request = await withRetry(async () => {
        return prisma.userRequest.findUnique({
          where: { id },
          include: { pricing: true, payment: true, tracking: true },
        })
      })

      if (!request) {
        return res.status(404).json({ error: 'Request not found' })
      }

      return res.status(200).json(request)
    } catch (err) {
      console.error('Get request error:', err)
      return res.status(503).json({ 
        error: 'Database unavailable', 
        message: 'Please try again in a moment'
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
