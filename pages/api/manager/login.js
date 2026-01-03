// POST /api/manager/login - Manager/Developer login
import { signToken } from '../../../lib/jwt'

// Manager credentials (in production, use a database or environment variables)
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager@swiggy.com'
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || 'manager123'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Check manager credentials
    if (email !== MANAGER_EMAIL || password !== MANAGER_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate token with manager role
    const token = signToken({ 
      id: 'manager',
      email: MANAGER_EMAIL,
      role: 'manager'
    })

    return res.status(200).json({ 
      token,
      user: {
        email: MANAGER_EMAIL,
        role: 'manager'
      }
    })
  } catch (err) {
    console.error('Manager login error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
