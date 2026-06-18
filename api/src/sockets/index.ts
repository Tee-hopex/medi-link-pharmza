import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function initSockets(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : true,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string }
      socket.data.userId = payload.sub
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    socket.join(`user:${userId}`)
    socket.join('emergency-rx')

    socket.on('channel:join', (channelId: string) => {
      socket.join(`channel:${channelId}`)
    })

    socket.on('channel:leave', (channelId: string) => {
      socket.leave(`channel:${channelId}`)
    })

    socket.on('message:send', async (data: { channelId: string; content: string }) => {
      io.to(`channel:${data.channelId}`).emit('message:new', {
        channelId: data.channelId,
        content: data.content,
        senderId: userId,
        createdAt: new Date().toISOString(),
      })
    })

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`)
    })
  })

  return io
}
