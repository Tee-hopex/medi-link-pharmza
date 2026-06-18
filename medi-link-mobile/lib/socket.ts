import { io, Socket } from 'socket.io-client'

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1').replace('/api/v1', '')

let _socket: Socket | null = null

export function connectSocket(token: string): Socket {
  if (_socket?.connected) return _socket
  _socket?.disconnect()
  _socket = io(BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })
  return _socket
}

export function getSocket(): Socket | null {
  return _socket
}

export function disconnectSocket() {
  _socket?.disconnect()
  _socket = null
}
