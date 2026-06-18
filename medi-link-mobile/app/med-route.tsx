import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, TextInput, ScrollView, Linking, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, Callout } from 'react-native-maps'
import { useTheme } from '../constants/theme'
import {
  MOCK_PHARMACIES, NearbyPharmacy,
  stockColor, stockLabel,
} from '../constants/pharmacies'

// ─── Map marker ───────────────────────────────────────────────────────────────

function PharmacyMarker({ pharmacy, selected, onPress }: {
  pharmacy: NearbyPharmacy
  selected: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  const color = stockColor(pharmacy.stockLevel, colors)
  return (
    <Marker
      coordinate={{ latitude: pharmacy.latitude, longitude: pharmacy.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={[pin.wrap, selected && pin.wrapSelected]}>
        <View style={[pin.circle, { backgroundColor: color }]}>
          <Ionicons name="storefront" size={14} color="#fff" />
        </View>
        <View style={[pin.tail, { borderTopColor: color }]} />
      </View>
    </Marker>
  )
}

const pin = StyleSheet.create({
  wrap: { alignItems: 'center' },
  wrapSelected: { transform: [{ scale: 1.2 }] },
  circle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
    borderWidth: 2, borderColor: '#fff',
  },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -1,
  },
})

// ─── Pharmacy result row ──────────────────────────────────────────────────────

function PharmacyRow({ pharmacy, rank, selected, onPress, colors }: {
  pharmacy: NearbyPharmacy
  rank: number
  selected: boolean
  onPress: () => void
  colors: any
}) {
  const color = stockColor(pharmacy.stockLevel, colors)

  const openDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const url = Platform.select({
      ios:     `maps:0,0?q=${pharmacy.name}&ll=${pharmacy.latitude},${pharmacy.longitude}`,
      android: `geo:${pharmacy.latitude},${pharmacy.longitude}?q=${encodeURIComponent(pharmacy.name)}`,
    }) ?? `https://maps.google.com/?q=${pharmacy.latitude},${pharmacy.longitude}`
    Linking.openURL(url)
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress() }}
    >
      <View style={[
        row.wrap,
        { backgroundColor: selected ? `${colors.sage}0E` : colors.surface, borderColor: selected ? colors.sage : colors.border },
      ]}>
        <View style={[row.rank, { backgroundColor: selected ? colors.textPrimary : colors.border }]}>
          <Text style={[row.rankText, { color: selected ? colors.sage : colors.textMuted }]}>{rank}</Text>
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View style={row.nameRow}>
            <Text style={[row.name, { color: colors.textPrimary }]} numberOfLines={1}>{pharmacy.name}</Text>
            {pharmacy.verified && (
              <Ionicons name="shield-checkmark" size={14} color={colors.sage} />
            )}
          </View>
          <Text style={[row.address, { color: colors.textMuted }]} numberOfLines={1}>{pharmacy.address}</Text>

          <View style={row.metaRow}>
            <View style={[row.stockChip, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
              <View style={[row.dot, { backgroundColor: color }]} />
              <Text style={[row.stockText, { color }]}>{stockLabel(pharmacy.stockLevel)}</Text>
            </View>
            <View style={row.distRow}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={[row.dist, { color: colors.textMuted }]}>{pharmacy.distance}km</Text>
            </View>
            {!pharmacy.openNow && (
              <Text style={[row.closed, { color: colors.error }]}>Closed</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[row.dirBtn, { backgroundColor: colors.textPrimary }]}
          onPress={openDirections}
        >
          <Ionicons name="navigate" size={16} color={colors.sage} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 10,
  },
  rank: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText:  { fontSize: 14, fontWeight: '800' },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name:      { fontSize: 15, fontWeight: '700', flex: 1 },
  address:   { fontSize: 13 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stockChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  dot:       { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 12, fontWeight: '600' },
  distRow:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dist:      { fontSize: 13 },
  closed:    { fontSize: 13, fontWeight: '600' },
  dirBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

const LAGOS_REGION = {
  latitude:       6.455,
  longitude:      3.398,
  latitudeDelta:  0.28,
  longitudeDelta: 0.28,
}

export default function MedRouteScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [query, setQuery]             = useState('')
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [panelOpen, setPanelOpen]     = useState(true)
  const mapRef                        = useRef<MapView>(null)

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current
  const panelY   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
  }, [])

  const togglePanel = () => {
    const next = !panelOpen
    setPanelOpen(next)
    Animated.spring(panelY, { toValue: next ? 0 : 280, tension: 60, friction: 14, useNativeDriver: true }).start()
  }

  const filteredPharmacies = query.trim()
    ? MOCK_PHARMACIES.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.address.toLowerCase().includes(query.toLowerCase())
      )
    : MOCK_PHARMACIES

  const visiblePharmacies = filteredPharmacies.filter(p => p.stockLevel !== 'out').slice(0, 5)

  const focusPharmacy = (pharmacy: NearbyPharmacy) => {
    setSelectedId(pharmacy.id)
    mapRef.current?.animateToRegion({
      latitude:  pharmacy.latitude,
      longitude: pharmacy.longitude,
      latitudeDelta:  0.025,
      longitudeDelta: 0.025,
    }, 500)
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Search header (floats over map) */}
      <Animated.View style={[
        styles.searchHeader,
        { paddingTop: insets.top + 12 },
        { transform: [{ translateY: headerY }], opacity: headerOp },
      ]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.background + 'EE', borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: colors.background + 'EE', borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={19} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search drug or pharmacy…"
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
      </Animated.View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={LAGOS_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {MOCK_PHARMACIES.map(p => (
          <PharmacyMarker
            key={p.id}
            pharmacy={p}
            selected={selectedId === p.id}
            onPress={() => focusPharmacy(p)}
          />
        ))}
      </MapView>

      {/* Bottom result panel */}
      <Animated.View style={[styles.panel, { backgroundColor: colors.background, borderTopColor: colors.border }, { transform: [{ translateY: panelY }] }]}>
        {/* Panel handle + toggle */}
        <TouchableOpacity style={styles.panelHandle} onPress={togglePanel} hitSlop={{ top: 10, bottom: 10 }}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.panelTitle}>
            <View>
              <Text style={[styles.panelHeading, { color: colors.textPrimary }]}>
                MedRoute
              </Text>
              <Text style={[styles.panelSub, { color: colors.textMuted }]}>
                {visiblePharmacies.length} pharmacies with stock
              </Text>
            </View>
            <Ionicons name={panelOpen ? 'chevron-down' : 'chevron-up'} size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Legend */}
        <View style={[styles.legend, { borderBottomColor: colors.border }]}>
          {[
            { label: 'In Stock',  color: colors.sage    },
            { label: 'Limited',   color: colors.warning  },
            { label: 'Low Stock', color: colors.error    },
            { label: 'Out',       color: colors.textMuted },
          ].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>{l.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.resultList, { paddingBottom: insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          {visiblePharmacies.map((p, i) => (
            <PharmacyRow
              key={p.id}
              pharmacy={p}
              rank={i + 1}
              selected={selectedId === p.id}
              onPress={() => focusPharmacy(p)}
              colors={colors}
            />
          ))}
          {visiblePharmacies.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No pharmacies found</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  searchHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 44, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 15 },

  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '55%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 12,
  },
  panelHandle: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  handle:      { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  panelTitle:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  panelHeading:{ fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  panelSub:    { fontSize: 14, marginTop: 2 },

  legend:     { flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontSize: 12, fontWeight: '500' },

  resultList: { paddingHorizontal: 16, paddingTop: 12 },
  empty:      { alignItems: 'center', paddingTop: 30, gap: 8 },
  emptyText:  { fontSize: 16, fontWeight: '500' },
})
