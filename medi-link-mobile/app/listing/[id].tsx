import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Modal, Linking, ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'
import { type Listing, getRemainingSeconds, formatCountdown, listingUrgencyColor } from '../../constants/listings'
import { api } from '../../lib/api'

function mapListing(item: any): Listing {
  const expiryMs = new Date(item.expiryDate).getTime()
  return {
    id: item.id,
    drugName: item.drugName,
    genericName: item.genericName || '',
    category: item.category || '',
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.askingPrice,
    expiryDays: Math.ceil((expiryMs - Date.now()) / 86_400_000),
    listingEndMs: expiryMs,
    pharmacyName: item.seller?.facility?.name || `${item.seller?.firstName ?? ''} ${item.seller?.lastName ?? ''}`.trim(),
    pharmacyId: item.seller?.id || '',
    verified: item.seller?.facility?.verified ?? false,
    verificationLevel: 1 as 1,
    distance: 0,
    nafdacNo: '',
    batch: '',
    latitude: 0,
    longitude: 0,
    address: item.seller?.facility?.address || item.seller?.facility?.city || '',
  }
}

// ─── Escrow Modal ─────────────────────────────────────────────────────────────

function EscrowModal({ visible, totalPrice, drugName, sellerName, onConfirm, onDismiss, loading = false }: {
  visible: boolean
  totalPrice: number
  drugName: string
  sellerName: string
  onConfirm: () => void
  onDismiss: () => void
  loading?: boolean
}) {
  const { colors } = useTheme()
  const scaleAnim = useRef(new Animated.Value(0.88)).current
  const opAnim    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(opAnim,    { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      scaleAnim.setValue(0.88)
      opAnim.setValue(0)
    }
  }, [visible])

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <View style={[modal.overlay, { backgroundColor: colors.overlay }]}>
        <Animated.View style={[modal.sheet, { backgroundColor: colors.background }, { transform: [{ scale: scaleAnim }], opacity: opAnim }]}>
          {/* SabePay escrow badge */}
          <View style={[modal.escrowBadge, { backgroundColor: `${colors.sage}14`, borderColor: `${colors.sage}40` }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.sage} />
            <Text style={[modal.escrowLabel, { color: colors.sage }]}>SabePay Escrow</Text>
          </View>

          <Text style={[modal.title, { color: colors.textPrimary }]}>Confirm Purchase</Text>
          <Text style={[modal.subtitle, { color: colors.textSecondary }]}>
            {drugName} from {sellerName}
          </Text>

          {/* How escrow works */}
          <View style={[modal.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { icon: 'lock-closed-outline' as const, text: `₦${totalPrice.toLocaleString()} held in escrow` },
              { icon: 'car-outline'          as const, text: 'Funds released on delivery confirmation' },
              { icon: 'shield-outline'       as const, text: 'Dispute protection for 72 hours' },
            ].map(item => (
              <View key={item.text} style={modal.infoRow}>
                <Ionicons name={item.icon} size={16} color={colors.sage} />
                <Text style={[modal.infoText, { color: colors.textSecondary }]}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={[modal.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[modal.totalLabel, { color: colors.textMuted }]}>Total</Text>
            <Text style={[modal.totalValue, { color: colors.textPrimary }]}>₦{totalPrice.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={[modal.confirmBtn, { backgroundColor: colors.textPrimary, opacity: loading ? 0.7 : 1 }]}
            onPress={() => { if (!loading) onConfirm() }}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.sage} />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.sage} />
                  <Text style={[modal.confirmText, { color: colors.sage }]}>Confirm & Pay ₦{totalPrice.toLocaleString()}</Text>
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity style={modal.cancelBtn} onPress={onDismiss}>
            <Text style={[modal.cancelText, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const modal = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: {
    width: '100%', borderRadius: 24,
    padding: 24, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25, shadowRadius: 32, elevation: 20,
  },
  escrowBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  escrowLabel: { fontSize: 13, fontWeight: '700' },
  title:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 15, marginTop: -6 },
  infoBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, flex: 1, lineHeight: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 14 },
  totalLabel: { fontSize: 15, fontWeight: '500' },
  totalValue: { fontSize: 22, fontWeight: '800' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 56, borderRadius: 16,
  },
  confirmText: { fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 4 },
  cancelText: { fontSize: 16 },
})

// ─── Verification tier badge ──────────────────────────────────────────────────

function VerificationTier({ level, colors }: { level: 1 | 2 | 3; colors: any }) {
  return (
    <View style={[tier.wrap, { backgroundColor: `${colors.sage}14`, borderColor: `${colors.sage}40` }]}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[tier.ring, { borderColor: i <= level ? colors.sage : colors.border, backgroundColor: i <= level ? `${colors.sage}30` : 'transparent' }]}
        />
      ))}
      <Text style={[tier.label, { color: colors.sage }]}>Level {level} Verified</Text>
    </View>
  )
}

const tier = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  ring:  { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  label: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
})

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={inf.row}>
      <Text style={[inf.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[inf.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  )
}
const inf = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  label: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: '600' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  const [listing, setListing]         = useState<Listing | null>(null)
  const [loadingPage, setLoadingPage] = useState(true)
  const [remaining, setRemaining]     = useState(0)
  const [escrowVisible, setEscrowVisible] = useState(false)
  const [purchased, setPurchased]         = useState(false)
  const [ordering, setOrdering]           = useState(false)

  const contentY  = useRef(new Animated.Value(28)).current
  const contentOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    api.get(`/marketplace/${id}`)
      .then((r) => {
        const mapped = mapListing(r.data.data)
        setListing(mapped)
        setRemaining(getRemainingSeconds(mapped.listingEndMs))
        Animated.parallel([
          Animated.spring(contentY,  { toValue: 0, tension: 55, friction: 14, useNativeDriver: true }),
          Animated.timing(contentOp, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start()
      })
      .catch(() => router.back())
      .finally(() => setLoadingPage(false))
  }, [id])

  useEffect(() => {
    if (!listing) return
    const timer = setInterval(() => setRemaining(getRemainingSeconds(listing.listingEndMs)), 1000)
    return () => clearInterval(timer)
  }, [listing])

  const handleConfirm = async () => {
    if (!listing) return
    setOrdering(true)
    try {
      await api.post('/orders', { listingId: listing.id, quantity: listing.quantity })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setEscrowVisible(false)
      setPurchased(true)
    } catch (err: any) {
      setEscrowVisible(false)
      Alert.alert('Order failed', err?.response?.data?.message || 'Could not place order. Try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (loadingPage || !listing) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    )
  }

  const urgColor   = listingUrgencyColor(remaining, colors)
  const isUrgent   = remaining < 172_800
  const totalPrice = listing.quantity * listing.unitPrice

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Hero gradient header */}
      <LinearGradient
        colors={[`${urgColor}1A`, colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: colors.background + 'CC', borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          {listing.verified && (
            <VerificationTier level={listing.verificationLevel} colors={colors} />
          )}
        </View>

        <View style={{ gap: 6, marginTop: 8 }}>
          <View style={[styles.categoryTag, { backgroundColor: `${urgColor}18`, borderColor: `${urgColor}40` }]}>
            <Text style={[styles.categoryText, { color: urgColor }]}>{listing.category}</Text>
          </View>
          <Text style={[styles.drugName, { color: colors.textPrimary }]}>{listing.drugName}</Text>
          <Text style={[styles.genericName, { color: colors.textSecondary }]}>{listing.genericName}</Text>

          {/* Live countdown */}
          <View style={[styles.countdownRow, { backgroundColor: `${urgColor}14`, borderColor: `${urgColor}40` }]}>
            <Ionicons name="time-outline" size={16} color={urgColor} />
            <Text style={[styles.countdownText, { color: urgColor }]}>
              {isUrgent ? 'URGENT — ' : ''}Listing ends in {formatCountdown(remaining)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        style={{ transform: [{ translateY: contentY }], opacity: contentOp }}
      >
        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { label: 'Quantity',   value: `${listing.quantity} ${listing.unit}` },
            { label: 'Unit Price', value: `₦${listing.unitPrice}` },
            { label: 'Total',      value: `₦${totalPrice.toLocaleString()}` },
          ].map((s, i) => (
            <View key={s.label} style={[styles.statCell, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Seller info card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sellerHeader}>
            <View style={[styles.sellerIcon, { backgroundColor: `${colors.sage}18` }]}>
              <Ionicons name="storefront-outline" size={22} color={colors.sage} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sellerName, { color: colors.textPrimary }]}>{listing.pharmacyName}</Text>
              <View style={styles.sellerMeta}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.sellerAddr, { color: colors.textMuted }]} numberOfLines={1}>
                  {listing.address}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => Linking.openURL(`tel:${listing.pharmacyId}`)}
            >
              <Ionicons name="call-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          {listing.address ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.distanceRow}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                  {listing.address}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Drug details */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>DRUG DETAILS</Text>
          {[
            { label: 'Batch Number',   value: listing.batch },
            { label: 'NAFDAC No.',     value: listing.nafdacNo },
            { label: 'Expiry',         value: `${listing.expiryDays} days remaining` },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <InfoRow label={item.label} value={item.value} colors={colors} />
              {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* Escrow banner */}
        <View style={[styles.escrowBanner, { backgroundColor: `${colors.sage}0F`, borderColor: `${colors.sage}35` }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.sage} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.escrowTitle, { color: colors.sage }]}>SabePay Escrow Protection</Text>
            <Text style={[styles.escrowSub,   { color: colors.textSecondary }]}>
              Your payment is held securely until delivery is confirmed.
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Buy Now button */}
      <View style={[styles.buyBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        {purchased ? (
          <View style={[styles.successBtn, { backgroundColor: `${colors.sage}18`, borderColor: `${colors.sage}40` }]}>
            <Ionicons name="checkmark-circle" size={22} color={colors.sage} />
            <Text style={[styles.successText, { color: colors.sage }]}>Order Placed — Awaiting Confirmation</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.buyNowBtn, { backgroundColor: colors.textPrimary }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEscrowVisible(true) }}
          >
            <Text style={[styles.buyNowText, { color: colors.sage }]}>
              Buy Now · ₦{totalPrice.toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <EscrowModal
        visible={escrowVisible}
        totalPrice={totalPrice}
        drugName={listing.drugName}
        sellerName={listing.pharmacyName}
        onConfirm={handleConfirm}
        onDismiss={() => { if (!ordering) setEscrowVisible(false) }}
        loading={ordering}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  hero: { paddingHorizontal: 20, paddingBottom: 24 },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navBtn: {
    width: 42, height: 42, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryTag: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  categoryText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  drugName:    { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  genericName: { fontSize: 15, lineHeight: 22 },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, marginTop: 4,
  },
  countdownText: { fontSize: 14, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  statsRow: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 18,
    marginBottom: 16, overflow: 'hidden',
  },
  statCell:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  card: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  divider:   { height: 1, marginVertical: 2 },

  sellerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  sellerName: { fontSize: 16, fontWeight: '700' },
  sellerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sellerAddr: { fontSize: 13, flex: 1 },
  callBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  distanceText: { fontSize: 14 },

  mapCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 16, height: 180 },
  map: { flex: 1 },
  mapPin: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },

  escrowBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  escrowTitle: { fontSize: 14, fontWeight: '700' },
  escrowSub:   { fontSize: 13, marginTop: 2, lineHeight: 18 },

  buyBar: {
    paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1,
  },
  buyNowBtn: {
    height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  buyNowText: { fontSize: 18, fontWeight: '700' },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 56, borderRadius: 18, borderWidth: 1,
  },
  successText: { fontSize: 15, fontWeight: '600' },
})
