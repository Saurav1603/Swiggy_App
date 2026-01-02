// Temporary, protected endpoint to list admin accounts for setup/debug.
// Protect by setting ADMIN_SETUP_TOKEN in environment and passing
// Authorization: Bearer <ADMIN_SETUP_TOKEN>
import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  const token = req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null
  const secret = process.env.ADMIN_SETUP_TOKEN
  if (!secret) return res.status(500).json({ error: 'ADMIN_SETUP_TOKEN not configured on server' })
  if (!token || token !== secret) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const admins = await prisma.admin.findMany({ select: { id: true, email: true, name: true, status: true, createdAt: true } })
    return res.status(200).json({ admins })
  } catch (err) {
    console.error('Admin debug list error:', err)
    return res.status(500).json({ error: 'Server error', details: process.env.NODE_ENV !== 'production' ? String(err) : undefined })
  }
}
