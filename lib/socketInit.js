import { Server } from 'socket.io'

export default function initSocket(server) {
  if (!server.io) {
    const io = new Server(server)
    server.io = io
    // attach to global for other API routes
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
  return server.io
}
