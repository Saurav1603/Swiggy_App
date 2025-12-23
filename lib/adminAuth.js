import { verifyToken } from './jwt'

export function getAdminFromRequest(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    req.admin = admin
    return handler(req, res)
  }
}
