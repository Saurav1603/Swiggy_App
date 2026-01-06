const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 30 // Increased from 5

const ipHits = new Map()

export function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  const now = Date.now()

  if (!ipHits.has(ip)) {
    ipHits.set(ip, [])
  }

  const hits = ipHits.get(ip).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  hits.push(now)
  ipHits.set(ip, hits)

  if (hits.length > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' })
  }
  return next()
}

export function withRateLimit(handler) {
  return (req, res) => {
    return rateLimit(req, res, () => handler(req, res))
  }
}
