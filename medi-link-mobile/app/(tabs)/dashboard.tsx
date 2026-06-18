import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated, Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'
import { useAuthStore } from '../../store/auth.store'
import { Skeleton } from '../../components/ui/Skeleton'
import { Toast, AlertModal, InlineBanner } from '../../components/notifications/NotificationSystem'
import { api } from '../../lib/api'

const { width: SW } = Dimensions.get('window')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function formatStatValue(value: number, prefix: string): string {
  if (prefix === '₦') {
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000)     return `₦${(value / 1_000).toFixed(0)}k`
    return `₦${value}`
  }
  return `${prefix}${value.toLocaleString()}`
}

function useCountUp(target: number, duration = 1100, enabled = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) { setValue(0); return }
    let startTime: number | null = null
    let frameId: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const t = Math.min((ts - startTime) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - t, 3)) * target))
      if (t < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [target, enabled])
  return value
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, target, prefix = '', accentColor, delay, enabled }: {
  label: string; target: number; prefix?: string
  accentColor?: string; delay: number; enabled: boolean
}) {
  const { colors } = useTheme()
  const count = useCountUp(target, 1100, enabled)
  const ty = useRef(new Animated.Value(28)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (enabled) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(ty, { toValue: 0, tension: 160, friction: 18, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        ]),
      ]).start()
    } else {
      ty.setValue(28)
      opacity.setValue(0)
    }
  }, [enabled])

  return (
    <Animated.View style={[
      styles.statCard,
      { backgroundColor: colors.surface, borderColor: colors.border },
      { transform: [{ translateY: ty }], opacity },
    ]}>
      <Text style={[styles.statValue, { color: accentColor ?? colors.textPrimary }]}>
        {formatStatValue(count, prefix)}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </Animated.View>
  )
}

// ─── Expiry Banner ────────────────────────────────────────────────────────────

function ExpiryBanner({ count, nearest, onViewPress }: { count: number; nearest: number; onViewPress?: () => void }) {
  const { colors } = useTheme()
  const pulse = useRef(new Animated.Value(1)).current
  const enterY = useRef(new Animated.Value(16)).current
  const enterOpacity = useRef(new Animated.Value(0)).current
  const urgent = nearest <= 7

  const bgColor = nearest <= 7 ? colors.error : nearest <= 14 ? colors.warning : colors.teal

  useEffect(() => {
    Animated.parallel([
      Animated.spring(enterY, { toValue: 0, tension: 100, friction: 12, useNativeDriver: true }),
      Animated.timing(enterOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()

    if (urgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.55, duration: 750, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        ])
      ).start()
    }
  }, [])

  return (
    <Animated.View style={[
      styles.banner,
      { backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55` },
      { transform: [{ translateY: enterY }], opacity: enterOpacity },
    ]}>
      <Animated.View style={[styles.bannerDot, { backgroundColor: bgColor, opacity: pulse }]} />
      <Text style={[styles.bannerText, { color: bgColor }]}>
        {count} drug{count !== 1 ? 's' : ''} expire within {nearest} days
      </Text>
      <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onViewPress?.() }}>
        <Text style={[styles.bannerCta, { color: bgColor }]}>View →</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Quick Action ─────────────────────────────────────────────────────────────

function QuickAction({ icon, label, onPress, filled }: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string; onPress: () => void; filled?: boolean
}) {
  const { colors } = useTheme()
  const scale = useRef(new Animated.Value(1)).current

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.92, tension: 320, friction: 14, useNativeDriver: true }).start()
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }}
      onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 320, friction: 14, useNativeDriver: true }).start()}
      onPress={onPress}
      style={styles.quickWrap}
    >
      <Animated.View style={[
        styles.quickBtn,
        {
          backgroundColor: filled ? colors.textPrimary : colors.surface,
          borderColor: filled ? 'transparent' : colors.border,
        },
        { transform: [{ scale }] },
      ]}>
        <Ionicons name={icon} size={22} color={filled ? colors.sage : colors.textSecondary} />
      </Animated.View>
      <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

const FEED = [
  { id: '1', icon: 'add-circle'       as const, dot: 'sage',    title: 'Amoxicillin 500mg added',      sub: '24 units · 2 min ago'              },
  { id: '2', icon: 'warning'          as const, dot: 'warning', title: 'Metformin expiring soon',       sub: '6 days · 48 units in stock'        },
  { id: '3', icon: 'trending-down'    as const, dot: 'error',   title: 'Paracetamol stock low',         sub: 'Below reorder level · 8 units left' },
  { id: '4', icon: 'cash'             as const, dot: 'sage',    title: '12 units Ibuprofen sold',       sub: '₦3,600 received · 1h ago'           },
  { id: '5', icon: 'swap-horizontal'  as const, dot: 'teal',    title: 'Omeprazole listed on Market',  sub: '30 units · near-expiry listing'     },
]

function ActivityRow({ item, index, show }: { item: typeof FEED[0]; index: number; show: boolean }) {
  const { colors } = useTheme()
  const tx = useRef(new Animated.Value(32)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (show) {
      Animated.sequence([
        Animated.delay(index * 75),
        Animated.parallel([
          Animated.spring(tx, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]),
      ]).start()
    } else {
      tx.setValue(32)
      opacity.setValue(0)
    }
  }, [show])

  const isLast  = index === FEED.length - 1
  const dotColor = (colors as Record<string, string>)[item.dot] ?? item.dot

  return (
    <Animated.View style={[
      styles.feedRow,
      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      { transform: [{ translateX: tx }], opacity },
    ]}>
      <View style={[styles.feedIcon, { backgroundColor: `${dotColor}22` }]}>
        <Ionicons name={item.icon} size={17} color={dotColor} />
      </View>
      <View style={styles.feedText}>
        <Text style={[styles.feedTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.feedSub,   { color: colors.textMuted }]}>{item.sub}</Text>
      </View>
    </Animated.View>
  )
}

// ─── Notification Centre (full-screen push instead of sidebar) ───────────────
// Notifications are now: Toast (auto-dismiss), AlertModal (confirm), InlineBanner (contextual).
// The bell button navigates to a dedicated notif list screen (built in F6).
// For now, bell triggers a demo Toast to show the system works.

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuthStore()

  const [statsReady, setStatsReady] = useState(false)
  const [feedReady,  setFeedReady]  = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast]           = useState(false)
  const [expiryModal, setExpiryModal] = useState(false)

  // Analytics data
  const [totalSKUs,      setTotalSKUs]      = useState(0)
  const [stockValue,     setStockValue]      = useState(0)
  const [expiringSoon,   setExpiringSoon]   = useState(0)
  const [deadStock,      setDeadStock]      = useState(0)
  const [walletBalance,  setWalletBalance]  = useState(user?.wallet?.balance ?? 0)
  const [walletEscrow,   setWalletEscrow]   = useState(user?.wallet?.escrow ?? 0)

  const isPatient = user?.role === 'PATIENT'

  const fetchDashboard = useCallback(async () => {
    if (isPatient) return
    try {
      const { data } = await api.get('/analytics/dashboard')
      const d = data.data
      setTotalSKUs(d.inventory.total)
      setStockValue(d.inventory.totalValue)
      setExpiringSoon(d.inventory.expiringSoon)
      setDeadStock(d.inventory.deadStock)
      setWalletBalance(d.wallet.balance)
      setWalletEscrow(d.wallet.escrow)
    } catch {}
  }, [isPatient])

  useFocusEffect(
    useCallback(() => {
      setStatsReady(false)
      setFeedReady(false)
      fetchDashboard().then(() => {
        const t1 = setTimeout(() => setStatsReady(true), 120)
        const t2 = setTimeout(() => setFeedReady(true),  900)
        return () => { clearTimeout(t1); clearTimeout(t2) }
      })
    }, [fetchDashboard]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    setFeedReady(false)
    await fetchDashboard()
    setRefreshing(false)
    setFeedReady(true)
  }, [fetchDashboard])

  const name = user?.firstName ?? 'there'

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: 110 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.sage}
            colors={[colors.sage]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting,    { color: colors.textPrimary }]}>{getGreeting()}, {name}</Text>
            <Text style={[styles.greetingSub, { color: colors.textMuted   }]}>Here's your pharmacy overview</Text>
          </View>
          <TouchableOpacity
            style={[styles.bellWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setToast(true) }}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            <View style={[styles.bellBadge, { backgroundColor: colors.error }]} />
          </TouchableOpacity>
        </View>

        {/* Wallet balance widget */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/wallet') }}
          style={[styles.walletWidget, { backgroundColor: '#14532D' }]}
        >
          <View style={styles.walletLeft}>
            <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.45)" />
            <View>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletAmount}>₦{walletBalance.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.walletRight}>
            {walletEscrow > 0 && (
              <View style={[styles.escrowPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name="shield-checkmark" size={11} color="rgba(255,255,255,0.55)" />
                <Text style={styles.escrowPillText}>₦{walletEscrow.toLocaleString()} escrow</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
          </View>
        </TouchableOpacity>

        {/* Expiry Banner */}
        {!isPatient && expiringSoon > 0 && (
          <ExpiryBanner count={expiringSoon} nearest={30} onViewPress={() => setExpiryModal(true)} />
        )}

        {/* Stat Cards */}
        {!isPatient && (
          <View style={styles.statsGrid}>
            <StatCard label="Total SKUs"    target={totalSKUs}   delay={0}   enabled={statsReady} />
            <StatCard label="Stock Value"   target={stockValue}  prefix="₦"  delay={80}  enabled={statsReady} />
            <StatCard label="Expiring Soon" target={expiringSoon} delay={160} enabled={statsReady} accentColor={colors.warning} />
            <StatCard label="Dead Stock"    target={deadStock}   delay={240} enabled={statsReady} accentColor={colors.error}   />
          </View>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <QuickAction icon="add-circle-outline"      label="Add Drug"     onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/drug/add') }} />
          <QuickAction icon="barcode-outline"         label="Scan"         onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/drug/add') }} />
          <QuickAction icon="flash-outline"           label="Emergency"    onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.push('/emergency-rx') }} filled />
          <QuickAction icon="swap-horizontal-outline" label="Redistribute" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/marketplace') }} />
        </View>

        {/* Activity Feed */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Recent Activity</Text>
        <View style={[styles.feedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {!feedReady
            ? [0, 1, 2].map(i => (
                <View key={i} style={[styles.skeletonRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <Skeleton width={40} height={40} borderRadius={12} />
                  <View style={{ flex: 1, gap: 9 }}>
                    <Skeleton width="68%" height={13} borderRadius={6} />
                    <Skeleton width="44%" height={11} borderRadius={5} />
                  </View>
                </View>
              ))
            : FEED.map((item, i) => (
                <ActivityRow key={item.id} item={item} index={i} show={feedReady} />
              ))
          }
        </View>
      </ScrollView>

      {/* Inline banner — shown inline inside scroll, demonstrated via expiry warning */}
      {/* (InlineBanner is used inside ExpiryBanner component above) */}

      {/* Toast — brief auto-dismiss, used for bell tap demo */}
      <Toast
        visible={toast}
        variant="warning"
        title="2 unread notifications"
        message="Metformin expiring in 6 days · Paracetamol low stock"
        onDismiss={() => setToast(false)}
      />

      {/* AlertModal — critical action confirmation */}
      <AlertModal
        visible={expiryModal}
        variant="alert"
        title="Drugs Expiring Soon"
        message="3 drugs are expiring within 7 days. List them on the Dead Stock Exchange to recover value."
        primaryLabel="List Now"
        secondaryLabel="Dismiss"
        onPrimary={() => {}}
        onSecondary={() => {}}
        onDismiss={() => setExpiryModal(false)}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },

  walletWidget: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 18, paddingHorizontal: 18, paddingVertical: 14,
    marginBottom: 16,
  },
  walletLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500', letterSpacing: 0.3, marginBottom: 2 },
  walletAmount: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  walletRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  escrowPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  escrowPillText:{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  greeting:    { fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  greetingSub: { fontSize: 15, marginTop: 3 },
  bellWrap: {
    width: 42, height: 42, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 9, right: 9,
    width: 7, height: 7, borderRadius: 3.5,
  },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 20,
  },
  bannerDot:  { width: 8, height: 8, borderRadius: 4 },
  bannerText: { flex: 1, fontSize: 15, fontWeight: '600' },
  bannerCta:  { fontSize: 15, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    width: (SW - 40 - 12) / 2,
    borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 14, fontWeight: '500' },

  sectionLabel: { fontSize: 17, fontWeight: '700', marginBottom: 14, letterSpacing: -0.2 },
  quickRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickWrap: { alignItems: 'center', gap: 8 },
  quickBtn: {
    width: 62, height: 62, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 13, fontWeight: '500' },

  feedCard:   { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  feedRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  feedIcon:   { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  feedText:   { flex: 1, gap: 4 },
  feedTitle:  { fontSize: 16, fontWeight: '600' },
  feedSub:    { fontSize: 14 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },

})
