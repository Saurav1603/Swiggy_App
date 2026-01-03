import { Server } from 'socket.io'

// Store connected admins globally
global.__connectedAdmins = global.__connectedAdmins || new Map()

export default function initSocket(server) {
  if (!server.io) {
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000,
      pingInterval: 25000
    })
    server.io = io
    // attach to global for other API routes
    global.__io = io
    globalThis.__io = io

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id)
      
      socket.on('join_admin', (adminId) => {
        if (!adminId) {
          console.log('join_admin called without adminId')
          return
        }
        console.log(`Admin ${adminId} joining room admin_${adminId}`)
        socket.join(`admin_${adminId}`)
        // Store adminId on socket for broadcasting
        socket.adminId = adminId
        // Track connected admin
        global.__connectedAdmins.set(adminId, socket.id)
        console.log('Connected admins:', Array.from(global.__connectedAdmins.keys()))
      })
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id)
        // Remove from connected admins
        if (socket.adminId) {
          global.__connectedAdmins.delete(socket.adminId)
        }
      })
    })
    
    console.log('Socket.IO server initialized')
  }
  return server.io
}

// Helper function to broadcast to all connected admins
export function broadcastToAdmins(event, payload, adminIds = null) {
  const io = global.__io || globalThis.__io
  if (!io) {
    console.log('Socket.IO not available for broadcast')
    return false
  }

  // If specific adminIds provided, broadcast to those rooms
  if (adminIds && adminIds.length > 0) {
    adminIds.forEach(adminId => {
      console.log(`Broadcasting ${event} to admin_${adminId}`)
      io.to(`admin_${adminId}`).emit(event, payload)
    })
  } else {
    // Broadcast to all connected sockets
    io.emit(event, payload)
  }
  
  return true
}
