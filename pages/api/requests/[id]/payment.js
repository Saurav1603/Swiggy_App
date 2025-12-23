import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'POST') {
    const { utrNumber } = req.body || {}

    if (!utrNumber || utrNumber.length < 6) {
      return res.status(400).json({ error: 'Valid UTR required' })
    }

    // Check request exists
    const request = await prisma.userRequest.findUnique({ where: { id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })

    // Create or update payment
    const payment = await prisma.payment.upsert({
      where: { requestId: id },
      update: { utrNumber },
      create: { requestId: id, utrNumber },
    })

    await prisma.userRequest.update({ where: { id }, data: { status: 'PAYMENT_PENDING' } })

    return res.status(200).json(payment)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
