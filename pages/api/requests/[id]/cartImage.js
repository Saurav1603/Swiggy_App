import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cartImageUrl } = req.body || {}
  if (!cartImageUrl) {
    return res.status(400).json({ error: 'cartImageUrl required' })
  }

  // Fetch order and payment status
  const request = await prisma.userRequest.findUnique({
    where: { id },
    include: { payment: true },
  })
  if (!request) return res.status(404).json({ error: 'Request not found' })

  // Only allow edit if payment not submitted
  if (request.payment) {
    return res.status(403).json({ error: 'Cannot edit screenshot after payment is submitted' })
  }

  const updated = await prisma.userRequest.update({
    where: { id },
    data: { cartImageUrl },
  })
  return res.status(200).json({ cartImageUrl: updated.cartImageUrl })
}
