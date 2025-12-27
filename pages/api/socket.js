// Simple Socket.IO bridge for Next.js API route
import initSocket from '../../lib/socketInit'

export default function handler(req, res) {
  try {
    if (!res.socket.server.io) {
      console.log('Initializing Socket.IO')
      initSocket(res.socket.server)
    }
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Socket init error', err)
    res.status(500).json({ ok: false, error: String(err) })
  }
}
