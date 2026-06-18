'use client'
import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { formatRelative, cn } from '@/lib/utils'
import type { Notification } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  EXPIRY_ALERT: 'bg-amber-100 text-amber-700',
  ORDER_UPDATE: 'bg-blue-100 text-blue-700',
  EMERGENCY_RX: 'bg-red-100 text-red-700',
  MESSAGE: 'bg-primary-100 text-primary-700',
  SYSTEM: 'bg-gray-100 text-gray-600',
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data as { notifications: Notification[]; unreadCount: number }),
    refetchInterval: 30_000,
  })

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const notifications = data?.notifications ?? []
  const unread = data?.unreadCount ?? 0

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">Notifications</span>
          {unread > 0 && (
            <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">All caught up</p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => { if (!n.isRead) markOneMutation.mutate(n.id) }}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors',
                !n.isRead && 'bg-primary-50/50',
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0', TYPE_COLORS[n.type] ?? TYPE_COLORS.SYSTEM)}>
                  {n.type.replace('_', ' ')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

interface Props {
  title: string
  onMenuClick: () => void
}

export function Header({ title, onMenuClick }: Props) {
  const { user } = useAuthStore()
  const [showNotifications, setShowNotifications] = useState(false)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data as { notifications: Notification[]; unreadCount: number }),
    refetchInterval: 30_000,
    enabled: !!user,
  })

  const unreadCount = data?.unreadCount ?? 0

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-[#E3E6E1] px-4 lg:px-7 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenuClick} aria-label="Open sidebar" className="lg:hidden text-gray-400 hover:text-gray-700 transition-colors">
          <Menu size={22} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 leading-none">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications((v) => !v)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#F7F8F5] hover:text-gray-600 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[9px] font-bold text-white leading-none px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>
          {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
        </div>

        <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold cursor-pointer select-none">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  )
}
