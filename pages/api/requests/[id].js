import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const request = await prisma.userRequest.findUnique({
      where: { id },
      include: { pricing: true, payment: true, tracking: true },
    })

    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    return res.status(200).json(request)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
