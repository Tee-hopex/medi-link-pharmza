'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, createContext, useContext } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

// ── Socket context ────────────────────────────────────────────────────────────

const SocketContext = createContext<Socket | null>(null)

export function useSocket() {
  return useContext(SocketContext)
}

function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ml_access_token') : null
      if (token) {
        const s = connectSocket(token)
        setSocket(s)
      }
    } else {
      disconnectSocket()
      setSocket(null)
    }

    return () => {
      // Don't disconnect on unmount — only on explicit logout (isAuthenticated → false)
    }
  }, [isAuthenticated])

  // Keep context in sync if socket was already created (e.g. hot reload)
  useEffect(() => {
    const existing = getSocket()
    if (existing && !socket) setSocket(existing)
  }, [socket])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

// ── Root providers ────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } } }),
  )

  useEffect(() => {
    useAuthStore.persist.rehydrate()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>{children}</SocketProvider>
    </QueryClientProvider>
  )
}
