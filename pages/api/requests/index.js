import prisma from '../../../lib/prisma'
import { withRateLimit } from '../../../lib/rateLimit'

async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, address, cartImageUrl, notes } = req.body || {}

    if (!name || !address || !cartImageUrl) {
      return res.status(400).json({ error: 'Name, address and cart image are required' })
    }

    const created = await prisma.userRequest.create({
      data: { 
        name, 
        phone: '', // Optional, keeping for backward compatibility
        address, 
        cartImageUrl, 
        notes: notes || null 
      },
    })

    return res.status(201).json({ id: created.id })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRateLimit(handler)
