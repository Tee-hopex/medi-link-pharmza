import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, TextInput, ScrollView,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { useTheme } from '../../constants/theme'
import { Channel } from '../../constants/network'
import { api } from '../../lib/api'

const CHANNEL_TYPE_MAP: Record<string, Channel['type']> = {
  GENERAL: 'general', PHARMA: 'pharma', CLINICAL: 'clinical',
  EMERGENCY: 'emergency', ANNOUNCEMENT: 'clinical', CAREER: 'career',
}

function relativeTime(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000)
  if (mins < 60) return `${mins} min ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function mapChannel(c: any): Channel {
  const last = c.messages?.[0]
  return {
    id: c.id,
    name: c.name,
    description: c.description || '',
    type: CHANNEL_TYPE_MAP[c.type] ?? 'general',
    memberCount: c._count?.members ?? 0,
    lastMessage: last?.content || 'No messages yet',
    lastSenderName: last?.sender?.firstName || '',
    lastMessageTime: last ? relativeTime(last.createdAt) : '',
    unreadCount: 0,
    verified: c.isAnnouncementOnly ?? false,
    pinned: false,
  }
}

// ─── Channel type icon + color ────────────────────────────────────────────────

function typeColor(type: Channel['type'], colors: any): string {
  switch (type) {
    case 'emergency': return colors.error
    case 'clinical':  return colors.teal
    case 'career':    return colors.warning
    default:          return colors.sage
  }
}

function typeIcon(type: Channel['type']): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'emergency': return 'flash'
    case 'clinical':  return 'medkit-outline'
    case 'career':    return 'briefcase-outline'
    case 'pharma':    return 'flask-outline'
    default:          return 'people-outline'
  }
}

// ─── Channel card ─────────────────────────────────────────────────────────────

function ChannelCard({ channel, index, visible }: { channel: Channel; index: number; visible: boolean }) {
  const { colors } = useTheme()
  const router  = useRouter()
  const tx      = useRef(new Animated.Value(32)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale   = useRef(new Animated.Value(1)).current

  const color = typeColor(channel.type, colors)

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.delay(index * 60),
        Animated.parallel([
          Animated.spring(tx,      { toValue: 0, tension: 160, friction: 18, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start()
    } else {
      tx.setValue(32); opacity.setValue(0)
    }
  }, [visible])

  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start()
  const pressOut = () => Animated.spring(scale, { toValue: 1,    tension: 300, friction: 10, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ translateX: tx }, { scale }], opacity }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          router.push({
            pathname: '/channel/[id]',
            params: {
              id: channel.id,
              name: channel.name,
              type: channel.type,
              memberCount: String(channel.memberCount),
              verified: channel.verified ? '1' : '0',
            },
          })
        }}
      >
        <View style={[ch.card, { backgroundColor: colors.surface, borderColor: channel.pinned ? `${color}40` : colors.border }]}>
          {/* Left icon */}
          <View style={[ch.icon, { backgroundColor: `${color}18` }]}>
            <Ionicons name={typeIcon(channel.type)} size={22} color={color} />
          </View>

          {/* Content */}
          <View style={ch.body}>
            <View style={ch.topRow}>
              <Text style={[ch.name, { color: colors.textPrimary }]} numberOfLines={1}>
                {channel.name}
              </Text>
              {channel.verified && (
                <Ionicons name="shield-checkmark" size={14} color={colors.sage} />
              )}
              {channel.pinned && (
                <Ionicons name="pin" size={12} color={colors.textMuted} style={{ marginLeft: 2 }} />
              )}
              <View style={{ flex: 1 }} />
              <Text style={[ch.time, { color: colors.textMuted }]}>{channel.lastMessageTime}</Text>
            </View>

            <Text style={[ch.preview, { color: colors.textSecondary }]} numberOfLines={1}>
              <Text style={{ fontWeight: '600' }}>{channel.lastSenderName}: </Text>
              {channel.lastMessage}
            </Text>

            <View style={ch.bottomRow}>
              <View style={[ch.memberPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="people-outline" size={11} color={colors.textMuted} />
                <Text style={[ch.memberText, { color: colors.textMuted }]}>{channel.memberCount.toLocaleString()}</Text>
              </View>
              {channel.unreadCount > 0 && (
                <View style={[ch.badge, { backgroundColor: color }]}>
                  <Text style={ch.badgeText}>{channel.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const ch = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: 14, padding: 14,
    borderRadius: 18, borderWidth: 1,
  },
  icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name:   { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  time:   { fontSize: 12 },
  preview: { fontSize: 14, lineHeight: 20 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  memberText: { fontSize: 11, fontWeight: '500' },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginLeft: 'auto',
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },
})

// ─── Quick-access pills ───────────────────────────────────────────────────────

function QuickPill({ label, icon, onPress, colors }: {
  label: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  colors: any
}) {
  return (
    <TouchableOpacity
      style={[pill.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress() }}
    >
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={[pill.text, { color: colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const pill = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 14, fontWeight: '600' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NetworkScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [query, setQuery]         = useState('')
  const [visible, setVisible]     = useState(false)
  const [allChannels, setAllChannels] = useState<Channel[]>([])

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  useFocusEffect(useCallback(() => {
    api.get('/network/channels').then(({ data }) => {
      setAllChannels((data.data as any[]).map(mapChannel))
    }).catch(() => {})
    setVisible(false)
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
    const t = setTimeout(() => setVisible(true), 150)
    return () => { clearTimeout(t); setVisible(false); headerY.setValue(-16); headerOp.setValue(0) }
  }, []))

  const totalUnread = allChannels.reduce((s, c) => s + c.unreadCount, 0)

  const channels = query.trim()
    ? allChannels.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : allChannels

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { paddingTop: insets.top + 16, backgroundColor: colors.background },
        { transform: [{ translateY: headerY }], opacity: headerOp },
      ]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Network</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {allChannels.length} channels
              {totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/patients') }}
            >
              <Ionicons name="person-add-outline" size={21} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/medi-career') }}
            >
              <Ionicons name="briefcase-outline" size={21} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={19} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search channels…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick access */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          <QuickPill label="Patients"   icon="person-outline"    onPress={() => router.push('/patients')}    colors={colors} />
          <QuickPill label="MediCareer" icon="briefcase-outline" onPress={() => router.push('/medi-career')} colors={colors} />
          <QuickPill label="Alerts"     icon="flash-outline"     onPress={() => {}}                          colors={colors} />
        </ScrollView>
      </Animated.View>

      {/* Channel list */}
      <FlashList
        data={channels}
        keyExtractor={c => c.id}
        estimatedItemSize={110}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={52} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No channels found</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={{ marginBottom: 10 }}>
            <ChannelCard channel={item} index={index} visible={visible} />
          </View>
        )}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: 20, paddingBottom: 14, zIndex: 10 },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16,
  },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 46, height: 46, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 52, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 16 },

  quickRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
})
