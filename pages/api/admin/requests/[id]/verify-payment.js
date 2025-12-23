import prisma from '../../../../../lib/prisma'
import { requireAdmin } from '../../../../../lib/adminAuth'

async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'POST') {
    // Admin manually marks payment as verified
    const payment = await prisma.payment.findUnique({ where: { requestId: id } })

    if (!payment) {
      return res.status(400).json({ error: 'No payment record found' })
    }

    await prisma.payment.update({ where: { id: payment.id }, data: { verified: true } })
    await prisma.userRequest.update({ where: { id }, data: { status: 'PAYMENT_RECEIVED' } })

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAdmin(handler)
