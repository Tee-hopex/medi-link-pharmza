import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../constants/theme'
import { Order, OrderStatus, STATUS_LABEL, statusColor } from '../constants/orders'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order placed', CONFIRMED: 'Confirmed', IN_TRANSIT: 'Out for delivery',
  DELIVERED: 'Delivered', COMPLETED: 'Completed', CANCELLED: 'Cancelled', DISPUTED: 'Disputed',
}

function mapOrder(o: any): Order {
  const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED']
  const currentIdx = statuses.indexOf(o.status as OrderStatus)
  const apiEvents: any[] = o.timeline || []

  const timeline = statuses.map((s, i) => {
    const event = apiEvents.find((e: any) => e.status === s)
    return {
      status: s,
      label: STATUS_LABELS[s] || s,
      time: event ? new Date(event.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : '',
      done: i <= currentIdx,
    }
  })

  return {
    id: o.id,
    listingId: o.listingId || '',
    drugName: o.drugName,
    quantity: o.quantity,
    unit: o.unit,
    unitPrice: o.unitPrice,
    totalPrice: o.totalPrice,
    sellerName: o.seller?.facility?.name || `${o.seller?.firstName ?? ''} ${o.seller?.lastName ?? ''}`.trim(),
    sellerVerified: o.seller?.facility?.verified ?? false,
    status: o.status as OrderStatus,
    createdAt: o.createdAt,
    escrowAmount: o.escrowAmount,
    timeline,
    deliveryAddress: o.deliveryAddress || '',
    distance: 0,
  }
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'active' | 'completed' | 'disputed'

const TABS: { key: Tab; label: string }[] = [
  { key: 'active',    label: 'Active'    },
  { key: 'completed', label: 'Completed' },
  { key: 'disputed',  label: 'Disputed'  },
]

const ACTIVE_STATUSES:    OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED']
const COMPLETED_STATUSES: OrderStatus[] = ['COMPLETED']
const DISPUTED_STATUSES:  OrderStatus[] = ['DISPUTED']

function filterOrders(orders: Order[], tab: Tab): Order[] {
  switch (tab) {
    case 'active':    return orders.filter(o => ACTIVE_STATUSES.includes(o.status))
    case 'completed': return orders.filter(o => COMPLETED_STATUSES.includes(o.status))
    case 'disputed':  return orders.filter(o => DISPUTED_STATUSES.includes(o.status))
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Timeline node ────────────────────────────────────────────────────────────

function TimelineNode({ label, time, done, isLast, index, accentColor }: {
  label: string; time: string; done: boolean; isLast: boolean; index: number; accentColor: string
}) {
  const { colors } = useTheme()
  const scale  = useRef(new Animated.Value(done ? 1 : 0.6)).current
  const nodeOp = useRef(new Animated.Value(done ? 1 : 0.35)).current

  useEffect(() => {
    if (done) {
      Animated.sequence([
        Animated.delay(index * 120),
        Animated.parallel([
          Animated.spring(scale,  { toValue: 1, tension: 120, friction: 12, useNativeDriver: true }),
          Animated.timing(nodeOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start()
    }
  }, [done])

  return (
    <View style={tl.step}>
      <View style={tl.leftCol}>
        <Animated.View style={[
          tl.node,
          {
            backgroundColor: done ? accentColor : colors.border,
            borderColor: done ? accentColor : colors.border,
          },
          { transform: [{ scale }], opacity: nodeOp },
        ]}>
          {done && <Ionicons name="checkmark" size={12} color="#fff" />}
        </Animated.View>
        {!isLast && <View style={[tl.line, { backgroundColor: done ? `${accentColor}60` : colors.border }]} />}
      </View>
      <View style={tl.rightCol}>
        <Text style={[tl.stepLabel, { color: done ? colors.textPrimary : colors.textMuted }]}>{label}</Text>
        <Text style={[tl.stepTime,  { color: colors.textMuted }]}>{time}</Text>
      </View>
    </View>
  )
}

const tl = StyleSheet.create({
  step:     { flexDirection: 'row', gap: 14 },
  leftCol:  { alignItems: 'center', width: 24 },
  node:     { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line:     { flex: 1, width: 2, borderRadius: 1, marginTop: 4, marginBottom: 4 },
  rightCol: { flex: 1, paddingBottom: 20, gap: 3 },
  stepLabel:{ fontSize: 15, fontWeight: '600' },
  stepTime: { fontSize: 13 },
})

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order, expanded, onToggle, onStatusUpdate }: { order: Order; expanded: boolean; onToggle: () => void; onStatusUpdate: (id: string, status: string) => void }) {
  const { colors } = useTheme()
  const orderStatusColor = statusColor(order.status, colors)
  const chevronAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(chevronAnim, { toValue: expanded ? 1 : 0, duration: 200, useNativeDriver: true }).start()
  }, [expanded])

  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })

  return (
    <View style={[card.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle() }}
      >
        <View style={card.header}>
          <View style={[card.statusDot, { backgroundColor: `${orderStatusColor}22`, borderColor: `${orderStatusColor}50` }]}>
            <View style={[card.dot, { backgroundColor: orderStatusColor }]} />
            <Text style={[card.statusText, { color: orderStatusColor }]}>{STATUS_LABEL[order.status]}</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </Animated.View>
        </View>

        <View style={[card.body, { borderTopColor: colors.border }]}>
          <Text style={[card.drugName, { color: colors.textPrimary }]}>{order.drugName}</Text>
          <Text style={[card.seller, { color: colors.textSecondary }]}>
            {order.sellerName}
            {order.sellerVerified && (
              <Text>{'  '}</Text>
            )}
          </Text>
          {order.sellerVerified && (
            <Ionicons name="shield-checkmark" size={13} color={colors.sage} />
          )}

          <View style={card.metaRow}>
            <Text style={[card.meta, { color: colors.textMuted }]}>
              {order.quantity} {order.unit} · ₦{order.unitPrice}/unit
            </Text>
            <Text style={[card.total, { color: colors.textPrimary }]}>
              ₦{order.totalPrice.toLocaleString()}
            </Text>
          </View>

          <View style={card.footerRow}>
            <View style={[card.escrowChip, { backgroundColor: `${colors.sage}14`, borderColor: `${colors.sage}40` }]}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.sage} />
              <Text style={[card.escrowText, { color: colors.sage }]}>
                ₦{order.escrowAmount.toLocaleString()} in escrow
              </Text>
            </View>
            <Text style={[card.date, { color: colors.textMuted }]}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded: timeline */}
      {expanded && (
        <View style={[card.timeline, { borderTopColor: colors.border }]}>
          <Text style={[card.timelineTitle, { color: colors.textMuted }]}>ORDER TIMELINE</Text>
          {order.timeline.map((event, i) => (
            <TimelineNode
              key={event.status + i}
              label={event.label}
              time={event.time}
              done={event.done}
              isLast={i === order.timeline.length - 1}
              index={i}
              accentColor={orderStatusColor}
            />
          ))}

          {order.status === 'IN_TRANSIT' && (
            <View style={[card.deliveryBanner, { backgroundColor: `${colors.teal}14`, borderColor: `${colors.teal}40` }]}>
              <Ionicons name="car-outline" size={18} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <Text style={[card.deliveryTitle, { color: colors.teal }]}>En Route to You</Text>
                <Text style={[card.deliverySub, { color: colors.textSecondary }]}>
                  {order.sellerName} · {order.distance}km away
                </Text>
              </View>
            </View>
          )}

          {order.status === 'DISPUTED' && (
            <TouchableOpacity
              style={[card.disputeBtn, { borderColor: colors.error }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={[card.disputeText, { color: colors.error }]}>View Dispute Details</Text>
            </TouchableOpacity>
          )}

          {order.status === 'DELIVERED' && (
            <TouchableOpacity
              style={[card.confirmBtn, { backgroundColor: colors.textPrimary }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                onStatusUpdate(order.id, 'COMPLETED')
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.sage} />
              <Text style={[card.confirmText, { color: colors.sage }]}>Confirm Delivery & Release Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const card = StyleSheet.create({
  wrap: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  statusDot: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 13, fontWeight: '700' },

  body: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12, borderTopWidth: 1, gap: 6 },
  drugName: { fontSize: 18, fontWeight: '700' },
  seller: { fontSize: 14 },

  metaRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  meta:     { fontSize: 14 },
  total:    { fontSize: 18, fontWeight: '800' },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  escrowChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  escrowText: { fontSize: 13, fontWeight: '600' },
  date:       { fontSize: 13 },

  timeline: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8, borderTopWidth: 1, gap: 0 },
  timelineTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },

  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 8,
  },
  deliveryTitle: { fontSize: 14, fontWeight: '700' },
  deliverySub:   { fontSize: 13, marginTop: 2 },

  disputeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 10,
    marginTop: 8, alignSelf: 'flex-start',
  },
  disputeText: { fontSize: 14, fontWeight: '600' },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, height: 50, marginTop: 8,
  },
  confirmText: { fontSize: 15, fontWeight: '700' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [activeTab, setActiveTab]   = useState<Tab>('active')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [allOrders, setAllOrders]   = useState<Order[]>([])

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
    api.get('/orders').then(({ data }) => setAllOrders((data.data as any[]).map(mapOrder))).catch(() => {})

    // Re-fetch when any order in our account updates (notification is handled in _layout.tsx)
    const socket = getSocket()
    const handleOrderUpdate = () => {
      api.get('/orders').then(({ data }) => setAllOrders((data.data as any[]).map(mapOrder))).catch(() => {})
    }
    socket?.on('order:update', handleOrderUpdate)
    return () => { socket?.off('order:update', handleOrderUpdate) }
  }, [])

  const orders = filterOrders(allOrders, activeTab)

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status })
      const { data } = await api.get('/orders')
      setAllOrders((data.data as any[]).map(mapOrder))
    } catch {}
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { paddingTop: insets.top + 16, borderBottomColor: colors.border },
        { transform: [{ translateY: headerY }], opacity: headerOp },
      ]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Orders</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      {/* Tab pills */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {TABS.map(t => {
          const isActive = activeTab === t.key
          const count = filterOrders(allOrders, t.key).length
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, isActive && { borderBottomColor: colors.textPrimary, borderBottomWidth: 2 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(t.key); setExpandedId(null) }}
            >
              <Text style={[styles.tabText, { color: isActive ? colors.textPrimary : colors.textMuted }]}>
                {t.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: isActive ? colors.textPrimary : colors.border }]}>
                  <Text style={[styles.tabBadgeText, { color: isActive ? '#fff' : colors.textMuted }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Orders list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
      >
        {orders.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={52} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No {activeTab} orders</Text>
          </View>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onStatusUpdate={handleStatusUpdate}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
  },
  tabText:  { fontSize: 15, fontWeight: '600' },
  tabBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { fontSize: 12, fontWeight: '700' },

  list: { paddingHorizontal: 20, paddingTop: 20 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
})
