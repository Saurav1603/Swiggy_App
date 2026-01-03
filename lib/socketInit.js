import { Server } from 'socket.io'

export default function initSocket(server) {
  if (!server.io) {
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })
    server.io = io
    // attach to global for other API routes
    global.__io = io
    globalThis.__io = io

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id)
      
      socket.on('join_admin', (adminId) => {
        console.log(`Admin ${adminId} joining room admin_${adminId}`)
        socket.join(`admin_${adminId}`)
        // Also store adminId on socket for broadcasting
        socket.adminId = adminId
      })
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id)
      })
    })
    
    console.log('Socket.IO server initialized')
  }
  return server.io
}
