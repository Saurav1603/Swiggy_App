// Simple Socket.IO bridge for Next.js API route
import initSocket from '../../lib/socketInit'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req, res) {
  try {
    // Initialize Socket.IO if not already done
    if (!res.socket.server.io) {
      console.log('🚀 Initializing Socket.IO server...')
      const io = initSocket(res.socket.server)
      res.socket.server.io = io
      console.log('✅ Socket.IO server initialized successfully')
    } else {
      console.log('📡 Socket.IO already initialized')
    }
    
    // Return info about current state
    const io = res.socket.server.io
    const connectedAdmins = global.__connectedAdmins ? Array.from(global.__connectedAdmins.keys()) : []
    
    res.status(200).json({ 
      ok: true, 
      socketInitialized: !!io,
      connectedAdmins 
    })
  } catch (err) {
    console.error('❌ Socket init error:', err)
    res.status(500).json({ ok: false, error: String(err) })
  }
}
