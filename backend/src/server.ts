import 'dotenv/config'
import http from 'http'
import { Server as SocketServer } from 'socket.io'
import app from './app'
import { connectDB } from './db/config'

const PORT = process.env.PORT || 5000

const httpServer = http.createServer(app)

export const io = new SocketServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN, credentials: true },
})

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

const start = async () => {
  await connectDB()

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
