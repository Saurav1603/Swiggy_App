import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '../../../lib/jwt'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  const admin = await prisma.admin.findUnique({ where: { email } })
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken({ id: admin.id, email: admin.email })
  return res.status(200).json({ token })
}
