'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Users, Loader2, Send, Hash } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { formatRelative, cn } from '@/lib/utils'
import type { Channel, Message } from '@/types'
import { useAuthStore } from '@/store/auth.store'
import { useSocket } from '@/app/providers'

export default function NetworkPage() {
  const { user } = useAuthStore()
  const socket = useSocket()
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [liveMessages, setLiveMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: () => api.get('/network/channels').then((r) => r.data.data as Channel[]),
  })

  const { data: fetchedMessages = [] } = useQuery<Message[]>({
    queryKey: ['messages', selectedChannel?.id],
    queryFn: () => selectedChannel
      ? api.get(`/network/channels/${selectedChannel.id}/messages`).then((r) => r.data.data as Message[])
      : Promise.resolve([]),
    enabled: !!selectedChannel,
  })

  // Merge REST + socket messages, deduplicated
  const messages = liveMessages

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Join/leave socket channel rooms and listen for new messages
  useEffect(() => {
    if (!socket) return

    if (selectedChannel) {
      socket.emit('channel:join', selectedChannel.id)
    }

    const handleNewMessage = (msg: Message) => {
      if (msg.channelId === selectedChannel?.id) {
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        setTimeout(scrollToBottom, 50)
      }
    }

    socket.on('message:new', handleNewMessage)

    return () => {
      socket.off('message:new', handleNewMessage)
      if (selectedChannel) socket.emit('channel:leave', selectedChannel.id)
    }
  }, [socket, selectedChannel, scrollToBottom])

  // Seed live messages when REST fetch completes
  useEffect(() => {
    if (fetchedMessages.length) {
      setLiveMessages(fetchedMessages)
      setTimeout(scrollToBottom, 50)
    }
  }, [fetchedMessages, scrollToBottom])

  const joinMutation = useMutation({
    mutationFn: (channelId: string) => api.post(`/network/channels/${channelId}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  })

  const sendMutation = useMutation({
    mutationFn: ({ channelId, content }: { channelId: string; content: string }) =>
      api.post(`/network/channels/${channelId}/messages`, { content }).then((r) => r.data.data as Message),
    onSuccess: (newMsg: Message) => {
      setLiveMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      setMessage('')
      setTimeout(scrollToBottom, 50)
    },
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && selectedChannel) {
      sendMutation.mutate({ channelId: selectedChannel.id, content: message })
    }
  }

  const isMember = (channel: Channel) => channel.members.length > 0

  const handleSelectChannel = (channel: Channel) => {
    setLiveMessages([])
    setSelectedChannel(channel)
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)]">
      {/* Channels list */}
      <div className="w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Channels</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-primary-600" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {channels.map((channel) => {
              const active = selectedChannel?.id === channel.id
              const member = isMember(channel)
              return (
                <button
                  key={channel.id}
                  type="button"
                  aria-label={`Select ${channel.name} channel`}
                  onClick={() => handleSelectChannel(channel)}
                  className={cn('w-full text-left p-4 hover:bg-gray-50 transition-colors', active ? 'bg-primary-50' : '')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hash size={14} className={active ? 'text-primary-600' : 'text-gray-400'} />
                    <span className={cn('text-sm font-medium', active ? 'text-primary-700' : 'text-gray-900')}>{channel.name}</span>
                    {!member && <span className="text-xs text-gray-400 ml-auto">Join</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{channel.description || channel.type}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={10} /> {channel._count.members}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><MessageSquare size={10} /> {channel._count.messages}</span>
                  </div>
                </button>
              )
            })}
            {channels.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No channels yet</p>}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        {!selectedChannel ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Select a channel</p>
              <p className="text-sm mt-1">Join and start messaging your professional network</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><Hash size={16} />{selectedChannel.name}</h2>
                <p className="text-xs text-gray-400">{selectedChannel._count.members} members</p>
              </div>
              {!isMember(selectedChannel) && (
                <button
                  type="button"
                  onClick={() => joinMutation.mutate(selectedChannel.id)}
                  disabled={joinMutation.isPending}
                  className="text-sm font-semibold bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors"
                >
                  {joinMutation.isPending ? 'Joining...' : 'Join Channel'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.senderId === user?.id
                return (
                  <div key={msg.id} className={cn('flex gap-3', isOwn ? 'flex-row-reverse' : '')}>
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                    </div>
                    <div className={cn('max-w-xs flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                      {!isOwn && <p className="text-xs text-gray-400 mb-1">{msg.sender.firstName} {msg.sender.lastName}</p>}
                      <div className={cn('px-3 py-2 rounded-2xl text-sm', isOwn ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm')}>
                        {msg.content}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatRelative(msg.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {isMember(selectedChannel) && (
              <div className="p-4 border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Message #${selectedChannel.name}...`}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!message.trim() || sendMutation.isPending}
                    className="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
