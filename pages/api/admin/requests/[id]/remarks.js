import prisma from '../../../../../lib/prisma'
import { requireAdmin } from '../../../../../lib/adminAuth'

export default requireAdmin(async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const request = await prisma.userRequest.findUnique({
      where: { id },
      select: { remarks: true },
    })
    if (!request) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ remarks: request.remarks || '' })
  }

  if (req.method === 'POST') {
    const { remarks } = req.body || {}
    const updated = await prisma.userRequest.update({
      where: { id },
      data: { remarks },
    })
    return res.status(200).json({ remarks: updated.remarks })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
