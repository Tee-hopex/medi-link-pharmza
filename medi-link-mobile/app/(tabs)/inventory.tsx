import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Animated, Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { useTheme } from '../../constants/theme'
import { Drug, expiryStatus, expiryColor, expiryLabel } from '../../constants/drugs'
import { api } from '../../lib/api'

function daysDiff(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

function mapItem(item: any): Drug {
  return {
    id: item.id,
    name: item.name,
    genericName: item.genericName || '',
    category: item.category || '',
    batch: item.batchNumber || '',
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.sellingPrice,
    reorderLevel: item.reorderLevel || 0,
    expiryDays: daysDiff(item.expiryDate),
    manufacturer: item.manufacturer || '',
    nafdacNo: item.nafdacNo || '',
    location: item.location || '',
  }
}

const { width: SW } = Dimensions.get('window')

type Filter = 'all' | 'expiring' | 'low' | 'dead'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All'          },
  { key: 'expiring', label: 'Expiring'     },
  { key: 'low',      label: 'Low Stock'    },
  { key: 'dead',     label: 'Dead Stock'   },
]

function filterDrugs(drugs: Drug[], filter: Filter, query: string): Drug[] {
  let result = drugs
  if (query.trim()) {
    const q = query.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.batch.toLowerCase().includes(q),
    )
  }
  switch (filter) {
    case 'expiring': return result.filter(d => d.expiryDays >= 0 && d.expiryDays <= 30)
    case 'low':      return result.filter(d => d.quantity > 0 && d.quantity <= d.reorderLevel)
    case 'dead':     return result.filter(d => d.expiryDays < 0)
    default:         return result
  }
}

// ─── Drug Card ────────────────────────────────────────────────────────────────

function DrugCard({ drug, index, visible }: { drug: Drug; index: number; visible: boolean }) {
  const { colors } = useTheme()
  const router = useRouter()
  const tx      = useRef(new Animated.Value(40)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale   = useRef(new Animated.Value(1)).current

  const status = expiryStatus(drug.expiryDays)
  const color  = expiryColor(status, colors)
  const isLow  = drug.quantity > 0 && drug.quantity <= drug.reorderLevel

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.delay(index * 55),
        Animated.parallel([
          Animated.spring(tx,      { toValue: 0, tension: 160, friction: 18, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start()
    } else {
      tx.setValue(40); opacity.setValue(0)
    }
  }, [visible])

  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start()
  const pressOut = () => Animated.spring(scale, { toValue: 1,    tension: 300, friction: 10, useNativeDriver: true }).start()

  return (
    <Animated.View style={[{ transform: [{ translateX: tx }, { scale }], opacity }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          router.push(`/drug/${drug.id}`)
        }}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Expiry colour bar */}
          <View style={[styles.colorBar, { backgroundColor: color }]} />

          <View style={styles.cardBody}>
            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.drugName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {drug.name}
                </Text>
                <Text style={[styles.drugMeta, { color: colors.textMuted }]}>
                  {drug.category} · {drug.batch}
                </Text>
              </View>
              <View style={[styles.expiryBadge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
                <Text style={[styles.expiryText, { color }]}>{expiryLabel(drug.expiryDays)}</Text>
              </View>
            </View>

            {/* Bottom row */}
            <View style={styles.cardBottom}>
              <View style={styles.qtyBlock}>
                <Text style={[styles.qtyNum, { color: isLow ? colors.warning : colors.textPrimary }]}>
                  {drug.quantity}
                </Text>
                <Text style={[styles.qtyUnit, { color: colors.textMuted }]}>{drug.unit}</Text>
              </View>

              {isLow && (
                <View style={[styles.alertPill, { backgroundColor: `${colors.warning}18`, borderColor: `${colors.warning}40` }]}>
                  <Ionicons name="alert-circle-outline" size={13} color={colors.warning} />
                  <Text style={[styles.alertText, { color: colors.warning }]}>Low stock</Text>
                </View>
              )}
              {status === 'expired' && (
                <View style={[styles.alertPill, { backgroundColor: `${colors.error}18`, borderColor: `${colors.error}40` }]}>
                  <Ionicons name="close-circle-outline" size={13} color={colors.error} />
                  <Text style={[styles.alertText, { color: colors.error }]}>Expired</Text>
                </View>
              )}

              <View style={[styles.locationPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.locationText, { color: colors.textMuted }]}>{drug.location}</Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.border} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ drugs }: { drugs: Drug[] }) {
  const { colors } = useTheme()
  const expiring = drugs.filter(d => d.expiryDays >= 0 && d.expiryDays <= 30).length
  const lowStock = drugs.filter(d => d.quantity > 0 && d.quantity <= d.reorderLevel).length
  const expired  = drugs.filter(d => d.expiryDays < 0).length

  const items = [
    { label: 'Total SKUs',    value: drugs.length, color: colors.sage },
    { label: 'Expiring Soon', value: expiring,     color: colors.warning },
    { label: 'Low Stock',     value: lowStock,     color: colors.warning },
    { label: 'Expired',       value: expired,      color: colors.error },
  ]

  return (
    <View style={[strip.row, { borderColor: colors.border }]}>
      {items.map((item, i) => (
        <View key={item.label} style={[strip.cell, i < items.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
          <Text style={[strip.num, { color: item.color }]}>{item.value}</Text>
          <Text style={[strip.label, { color: colors.textMuted }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

const strip = StyleSheet.create({
  row:   { flexDirection: 'row', borderWidth: 1, borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  cell:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 2 },
  num:   { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InventoryScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [query, setQuery]         = useState('')
  const [filter, setFilter]       = useState<Filter>('all')
  const [visible, setVisible]     = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [inventory, setInventory] = useState<Drug[]>([])

  const headerY    = useRef(new Animated.Value(-20)).current
  const headerOpacity = useRef(new Animated.Value(0)).current
  const fabScale   = useRef(new Animated.Value(0)).current

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/inventory')
      setInventory((data.data as any[]).map(mapItem))
    } catch {}
  }

  useFocusEffect(useCallback(() => {
    fetchInventory()
    setVisible(false)
    Animated.parallel([
      Animated.spring(headerY,      { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOpacity,{ toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
    const t = setTimeout(() => {
      setVisible(true)
      Animated.spring(fabScale, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start()
    }, 180)
    return () => clearTimeout(t)
  }, []))

  const onRefresh = async () => {
    setRefreshing(true)
    setVisible(false)
    await fetchInventory()
    setRefreshing(false)
    setVisible(true)
  }

  const drugs = filterDrugs(inventory, filter, query)

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { paddingTop: insets.top + 16, backgroundColor: colors.background },
        { transform: [{ translateY: headerY }], opacity: headerOpacity },
      ]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Inventory</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {inventory.length} drugs tracked
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push('/drug/add')
            }}
          >
            <Ionicons name="add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={19} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search drugs, category, batch…"
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
        <View style={styles.filterRow}>
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
                  setVisible(false)
                  setTimeout(() => setVisible(true), 50)
                }}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </Animated.View>

      {/* List */}
      <FlatList
        data={drugs}
        keyExtractor={d => d.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sage} colors={[colors.sage]} />
        }
        ListHeaderComponent={<SummaryStrip drugs={inventory} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No drugs found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Try a different search or filter</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <DrugCard drug={item} index={index} visible={visible} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      {/* FAB */}
      <Animated.View style={[styles.fab, { bottom: insets.bottom + 100 }, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={[styles.fabBtn, { backgroundColor: colors.textPrimary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            router.push('/drug/add')
          }}
        >
          <Ionicons name="add" size={28} color={colors.sage} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingHorizontal: 20, paddingBottom: 14,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16,
  },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
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

  filterRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: '600' },

  list: { paddingHorizontal: 20, paddingTop: 16 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  colorBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },

  drugName: { fontSize: 16, fontWeight: '700' },
  drugMeta: { fontSize: 13 },

  expiryBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  expiryText: { fontSize: 13, fontWeight: '700' },

  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qtyBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  qtyNum:  { fontSize: 18, fontWeight: '800' },
  qtyUnit: { fontSize: 13 },

  alertPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  alertText: { fontSize: 12, fontWeight: '600' },

  locationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
    marginLeft: 'auto',
  },
  locationText: { fontSize: 12 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub:   { fontSize: 15 },

  fab: { position: 'absolute', right: 24 },
  fabBtn: {
    width: 58, height: 58, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 10,
  },
})
