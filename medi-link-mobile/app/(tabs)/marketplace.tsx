import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { useTheme } from '../../constants/theme'
import { Listing, getRemainingSeconds, formatCountdown, listingUrgencyColor } from '../../constants/listings'
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
    address: item.seller?.facility?.city || '',
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'urgent' | '7d' | '14d' | '30d'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',    label: 'All'     },
  { key: 'urgent', label: 'Urgent'  },
  { key: '7d',     label: '7 days'  },
  { key: '14d',    label: '14 days' },
  { key: '30d',    label: '30 days' },
]

function applyFilter(listings: Listing[], filter: Filter, query: string): Listing[] {
  let result = listings
  if (query.trim()) {
    const q = query.toLowerCase()
    result = result.filter(l =>
      l.drugName.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.pharmacyName.toLowerCase().includes(q),
    )
  }
  const now = Date.now()
  switch (filter) {
    case 'urgent': return result.filter(l => (l.listingEndMs - now) < 172_800_000)
    case '7d':     return result.filter(l => l.expiryDays <= 7)
    case '14d':    return result.filter(l => l.expiryDays <= 14)
    case '30d':    return result.filter(l => l.expiryDays <= 30)
    default:       return result
  }
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing, tick }: { listing: Listing; tick: number }) {
  const { colors } = useTheme()
  const router = useRouter()
  const remaining  = getRemainingSeconds(listing.listingEndMs)
  const urgColor   = listingUrgencyColor(remaining, colors)
  const isUrgent   = remaining < 172_800
  const totalPrice = listing.quantity * listing.unitPrice

  const pulse   = useRef(new Animated.Value(1)).current
  const scale   = useRef(new Animated.Value(1)).current
  const animRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (isUrgent) {
      animRef.current = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]))
      animRef.current.start()
    }
    return () => animRef.current?.stop()
  }, [isUrgent])

  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start()
  const pressOut = () => Animated.spring(scale, { toValue: 1,    tension: 300, friction: 10, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          router.push(`/listing/${listing.id}`)
        }}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Urgency left bar — pulses if urgent */}
          <Animated.View style={[styles.urgBar, { backgroundColor: urgColor, opacity: isUrgent ? pulse : 1 }]} />

          <View style={styles.cardBody}>
            {/* Row 1: drug name + countdown chip */}
            <View style={styles.row1}>
              <Text style={[styles.drugName, { color: colors.textPrimary }]} numberOfLines={1}>
                {listing.drugName}
              </Text>
              <View style={[styles.timerChip, { backgroundColor: `${urgColor}18`, borderColor: `${urgColor}40` }]}>
                <Ionicons name="time-outline" size={13} color={urgColor} />
                <Text style={[styles.timerText, { color: urgColor }]}>{formatCountdown(remaining)}</Text>
              </View>
            </View>

            {/* Row 2: pharmacy + distance */}
            <View style={styles.row2}>
              <Text style={[styles.pharmacyName, { color: colors.textSecondary }]} numberOfLines={1}>
                {listing.pharmacyName}
              </Text>
              {listing.verified && (
                <Ionicons name="shield-checkmark" size={14} color={colors.sage} style={{ marginLeft: 4 }} />
              )}
              <Text style={[styles.dot, { color: colors.textMuted }]}> · </Text>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.distance, { color: colors.textMuted }]}>{listing.distance}km</Text>
            </View>

            {/* Row 3: qty/batch + price + buy */}
            <View style={styles.row3}>
              <Text style={[styles.qty, { color: colors.textMuted }]}>
                {listing.quantity} {listing.unit} · {listing.batch}
              </Text>
              <View style={styles.priceGroup}>
                <Text style={[styles.price, { color: colors.textPrimary }]}>
                  ₦{totalPrice.toLocaleString()}
                </Text>
                <View style={[styles.buyBtn, { backgroundColor: colors.textPrimary }]}>
                  <Text style={[styles.buyText, { color: colors.sage }]}>Buy</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.sage} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ listings }: { listings: Listing[] }) {
  const { colors } = useTheme()
  const urgent = listings.filter(l => (l.listingEndMs - Date.now()) < 172_800_000).length
  return (
    <View style={[strip.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[strip.cell, { borderRightWidth: 1, borderRightColor: colors.border }]}>
        <Text style={[strip.num, { color: colors.textPrimary }]}>{listings.length}</Text>
        <Text style={[strip.label, { color: colors.textMuted }]}>Active Listings</Text>
      </View>
      <View style={[strip.cell, { borderRightWidth: 1, borderRightColor: colors.border }]}>
        <Text style={[strip.num, { color: colors.error }]}>{urgent}</Text>
        <Text style={[strip.label, { color: colors.textMuted }]}>Urgent ({`<`}48h)</Text>
      </View>
      <View style={strip.cell}>
        <Text style={[strip.num, { color: colors.sage }]}>
          ₦{listings.reduce((s, l) => s + l.quantity * l.unitPrice, 0).toLocaleString()}
        </Text>
        <Text style={[strip.label, { color: colors.textMuted }]}>Total Value</Text>
      </View>
    </View>
  )
}

const strip = StyleSheet.create({
  row:   { flexDirection: 'row', borderWidth: 1, borderRadius: 18, marginBottom: 20, overflow: 'hidden' },
  cell:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  num:   { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MarketplaceScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [filter, setFilter]     = useState<Filter>('all')
  const [query, setQuery]       = useState('')
  const [tick, setTick]         = useState(0)
  const [visible, setVisible]   = useState(false)
  const [allListings, setAllListings] = useState<Listing[]>([])

  const headerY  = useRef(new Animated.Value(-20)).current
  const headerOp = useRef(new Animated.Value(0)).current
  const fabScale = useRef(new Animated.Value(0)).current

  // Live countdown tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const fetchListings = async () => {
    try {
      const { data } = await api.get('/marketplace')
      setAllListings((data.data as any[]).map(mapListing))
    } catch {}
  }

  useFocusEffect(useCallback(() => {
    fetchListings()
    setVisible(false)
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
    const t = setTimeout(() => {
      setVisible(true)
      Animated.spring(fabScale, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start()
    }, 160)
    return () => clearTimeout(t)
  }, []))

  const listings = applyFilter(allListings, filter, query)
  const urgentCount = allListings.filter(l => (l.listingEndMs - Date.now()) < 172_800_000).length

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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Marketplace</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {allListings.length} listings · {urgentCount} urgent today
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/med-route') }}
            >
              <Ionicons name="map-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/orders') }}
            >
              <Ionicons name="receipt-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/listing/create') }}
            >
              <Ionicons name="add" size={22} color={colors.sage} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={19} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search drugs, pharmacy, category…"
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

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.textPrimary : colors.surface,
                    borderColor:     active ? colors.textPrimary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setFilter(f.key)
                }}
              >
                {f.key === 'urgent' && urgentCount > 0 && (
                  <View style={[styles.urgDot, { backgroundColor: active ? colors.sage : colors.error }]} />
                )}
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </Animated.View>

      {/* List */}
      <FlashList
        data={listings}
        keyExtractor={l => l.id}
        extraData={tick}
        estimatedItemSize={140}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}
        ListHeaderComponent={<SummaryStrip listings={allListings} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={52} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No listings found</Text>
            <Text style={[styles.emptySub,   { color: colors.textMuted }]}>Try a different filter or search</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <ListingCard listing={item} tick={tick} />
          </View>
        )}
      />

      {/* EmergencyRx FAB */}
      <Animated.View style={[styles.fab, { bottom: insets.bottom + 100 }, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={[styles.fabBtn, { backgroundColor: colors.error, shadowColor: colors.error }]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            router.push('/emergency-rx')
          }}
          activeOpacity={0.88}
        >
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.fabText}>Emergency</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
  },
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

  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  urgDot:   { width: 7, height: 7, borderRadius: 3.5 },

  card: {
    flexDirection: 'row',
    borderRadius: 18, borderWidth: 1,
    overflow: 'hidden',
  },
  urgBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 14, gap: 8 },

  row1: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  drugName: { flex: 1, fontSize: 17, fontWeight: '700' },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
  },
  timerText: { fontSize: 13, fontWeight: '700' },

  row2: { flexDirection: 'row', alignItems: 'center' },
  pharmacyName: { fontSize: 14, fontWeight: '500', flexShrink: 1 },
  dot:      { fontSize: 14 },
  distance: { fontSize: 13, marginLeft: 2 },

  row3: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qty:  { fontSize: 13, flex: 1 },
  priceGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontSize: 17, fontWeight: '800' },
  buyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10,
  },
  buyText: { fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub:   { fontSize: 15 },

  fab: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0, right: 0,
    alignItems: 'center',
  },
  fabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  fabText: { fontSize: 16, fontWeight: '700', color: '#fff' },
})
