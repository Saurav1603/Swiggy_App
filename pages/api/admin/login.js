import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '../../../lib/jwt'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!admin.password) {
      // Password missing in record (maybe account created without password)
      console.warn(`Admin ${admin.id} has no password set`)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken({ id: admin.id, email: admin.email })
    return res.status(200).json({ token })
  } catch (err) {
    console.error('Admin login error:', err)
    // If Prisma can't reach DB this will surface here. Return 503 for upstream issues.
    return res.status(503).json({ error: 'Service unavailable', details: process.env.NODE_ENV !== 'production' ? String(err) : undefined })
  }
}
