import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  FlatList, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'
import { ChatMessage } from '../../constants/network'
import { api } from '../../lib/api'
import { getSocket } from '../../lib/socket'
import { useAuthStore } from '../../store/auth.store'

// ─── Message mapping ──────────────────────────────────────────────────────────

function mapMessage(m: any, myId: string): ChatMessage {
  return {
    id: m.id,
    channelId: m.channelId,
    senderId: m.senderId,
    senderName: m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : m.senderName ?? '',
    senderProfession: '',
    senderVerified: false,
    text: m.content,
    timestamp: new Date(m.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
    isOwn: m.senderId === myId,
  }
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, showSender, colors }: { msg: ChatMessage; showSender: boolean; colors: any }) {
  const ty = useRef(new Animated.Value(12)).current
  const op = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(ty, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[bub.row, msg.isOwn && bub.rowOwn, { transform: [{ translateY: ty }], opacity: op }]}>
      {!msg.isOwn && (
        <View style={[bub.avatar, { backgroundColor: colors.border }]}>
          <Text style={[bub.avatarText, { color: colors.textMuted }]}>
            {msg.senderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={[bub.bubble, msg.isOwn
        ? { backgroundColor: colors.sage }
        : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
      ]}>
        {!msg.isOwn && showSender && (
          <View style={bub.senderRow}>
            <Text style={[bub.senderName, { color: colors.sage }]}>{msg.senderName}</Text>
            {msg.senderVerified && (
              <Ionicons name="shield-checkmark" size={12} color={colors.sage} />
            )}
            {msg.senderProfession ? (
              <Text style={[bub.senderProf, { color: colors.textMuted }]}>· {msg.senderProfession}</Text>
            ) : null}
          </View>
        )}
        <Text style={[bub.text, { color: msg.isOwn ? '#FFFFFF' : colors.textPrimary }]}>
          {msg.text}
        </Text>
        <Text style={[bub.time, { color: msg.isOwn ? 'rgba(255,255,255,0.65)' : colors.textMuted }]}>
          {msg.timestamp}
        </Text>
      </View>
    </Animated.View>
  )
}

const bub = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8, paddingHorizontal: 16 },
  rowOwn: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarText: { fontSize: 11, fontWeight: '700' },
  bubble: { maxWidth: '72%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  senderName: { fontSize: 13, fontWeight: '700' },
  senderProf: { fontSize: 12 },
  text: { fontSize: 15, lineHeight: 22 },
  time: { fontSize: 12, alignSelf: 'flex-end' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChannelScreen() {
  const { id, name, type, memberCount, verified } = useLocalSearchParams<{
    id: string; name: string; type: string; memberCount: string; verified: string
  }>()
  const { colors } = useTheme()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const listRef = useRef<FlatList>(null)
  const user    = useAuthStore((s) => s.user)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft]       = useState('')

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  // ── Fetch history + join socket room ───────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()

    // Load historical messages
    api.get(`/network/channels/${id}/messages`)
      .then(({ data }) => {
        const msgs: ChatMessage[] = (data.data as any[])
          .reverse() // API returns newest-first; display oldest-first
          .map(m => mapMessage(m, user?.id ?? ''))
        setMessages(msgs)
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100)
      })
      .catch(() => {})

    // Join socket room for real-time messages
    const socket = getSocket()
    if (socket) {
      socket.emit('channel:join', id)

      const handleNew = (data: any) => {
        if (data.senderId === user?.id) return // already added optimistically
        setMessages(prev => [...prev, {
          id: data.id,
          channelId: data.channelId,
          senderId: data.senderId,
          senderName: data.senderName ?? '',
          senderProfession: '',
          senderVerified: false,
          text: data.content,
          timestamp: new Date(data.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
        }])
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80)
      }

      socket.on('message:new', handleNew)
      return () => {
        socket.emit('channel:leave', id)
        socket.off('message:new', handleNew)
      }
    }
  }, [id])

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!draft.trim()) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const content = draft.trim()
    const tempId  = `temp-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId, channelId: id, senderId: user?.id ?? '',
      senderName: user ? `${user.firstName} ${user.lastName}` : 'You',
      senderProfession: '', senderVerified: false,
      text: content, timestamp: 'Sending…', isOwn: true,
    }
    setMessages(prev => [...prev, optimistic])
    setDraft('')
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80)

    try {
      const { data } = await api.post(`/network/channels/${id}/messages`, { content })
      setMessages(prev => prev.map(m => m.id === tempId ? mapMessage(data.data, user?.id ?? '') : m))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  const channelVerified = verified === '1'
  const typeIcon: React.ComponentProps<typeof Ionicons>['name'] =
    type === 'emergency' ? 'flash' :
    type === 'clinical'  ? 'medkit-outline' :
    type === 'career'    ? 'briefcase-outline' :
    'people-outline'

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>

        {/* Header */}
        <Animated.View style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
          { transform: [{ translateY: headerY }], opacity: headerOp },
        ]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={[styles.channelIcon, { backgroundColor: `${colors.sage}18` }]}>
            <Ionicons name={typeIcon} size={18} color={colors.sage} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.channelName, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
              {channelVerified && <Ionicons name="shield-checkmark" size={14} color={colors.sage} />}
            </View>
            <Text style={[styles.memberCount, { color: colors.textMuted }]}>
              {Number(memberCount ?? 0).toLocaleString()} members
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => (
            <Bubble
              msg={item}
              showSender={index === 0 || messages[index - 1]?.senderId !== item.senderId}
              colors={colors}
            />
          )}
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Message the channel…"
              placeholderTextColor={colors.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.sage : colors.border }]}
            onPress={sendMessage}
            disabled={!draft.trim()}
          >
            <Ionicons name="arrow-up" size={20} color={draft.trim() ? '#FFFFFF' : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  channelIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  channelName: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  memberCount: { fontSize: 13, marginTop: 1 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  inputWrap: {
    flex: 1, borderRadius: 22, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120,
  },
  input: { fontSize: 16, lineHeight: 22 },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
})
