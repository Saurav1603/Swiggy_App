// Simple Socket.IO bridge for Next.js API route
import { Server } from 'socket.io'

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO')
    const io = new Server(res.socket.server)
    res.socket.server.io = io
    // attach to global for API routes
    global.__io = io

    io.on('connection', (socket) => {
      console.log('Socket connected', socket.id)
      socket.on('join_admin', (adminId) => {
        socket.join(`admin_${adminId}`)
      })
      socket.on('disconnect', () => {
        console.log('Socket disconnected', socket.id)
      })
    })
  }
  res.end()
}
