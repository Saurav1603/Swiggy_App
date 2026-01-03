// POST /api/admin/register
// Allow an admin to register a new account (email, name, password)
import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email, name, password } = req.body || {}

    // Validation
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password required' })
    }
    if (email.length < 3 || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' })
    }

    // Check if email already exists
    const existing = await prisma.admin.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin with status = available
    const admin = await prisma.admin.create({
      data: {
        email,
        name: name.trim(),
        password: hashedPassword,
        status: 'available',
      },
      select: { id: true, email: true, name: true, status: true },
    })

    return res.status(201).json({ message: 'Admin registered successfully', admin })
  } catch (err) {
    console.error('Admin register error:', err)
    console.error('Error stack:', err.stack)
    console.error('Error message:', err.message)
    return res.status(500).json({ 
      error: 'Server error', 
      details: process.env.NODE_ENV !== 'production' ? {
        message: err.message,
        code: err.code,
        stack: err.stack
      } : undefined 
    })
  }
}
