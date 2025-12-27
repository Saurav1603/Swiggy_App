import initSocket from '../../../lib/socketInit'

export default function handler(req, res) {
  try {
    // initialize socket if not already initialized
    const io = initSocket(res.socket.server)
    const sockets = io ? io.sockets ? Object.keys(io.sockets.sockets).length : 0 : 0
    res.status(200).json({ socketInitialized: !!io, connectedClients: sockets })
  } catch (err) {
    console.error('Health socket error', err)
    res.status(500).json({ socketInitialized: false, error: String(err) })
  }
}
