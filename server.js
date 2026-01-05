const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Track connected admins
global.__connectedAdmins = new Map()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Initialize Socket.IO on the HTTP server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // Attach to global for API routes to access
  global.__io = io
  globalThis.__io = io

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id)
    
    socket.on('join_admin', (adminId) => {
      if (!adminId) {
        console.log('join_admin called without adminId')
        return
      }
      console.log(`👤 Admin ${adminId} joining room admin_${adminId}`)
      socket.join(`admin_${adminId}`)
      socket.adminId = adminId
      global.__connectedAdmins.set(adminId, socket.id)
      console.log('📋 Connected admins:', Array.from(global.__connectedAdmins.keys()))
    })
    
    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id)
      if (socket.adminId) {
        global.__connectedAdmins.delete(socket.adminId)
        console.log('📋 Connected admins:', Array.from(global.__connectedAdmins.keys()))
      }
    })
  })

  server.listen(port, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
    console.log(`📡 Socket.IO initialized and ready for connections`)
  })
})
