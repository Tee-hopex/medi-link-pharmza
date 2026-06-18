import { useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'
import {
  MOCK_DRUGS, expiryStatus, expiryColor, expiryLabel,
} from '../../constants/drugs'

// ─── Expiry Ring (two-halves technique) ───────────────────────────────────────

function ExpiryRing({ daysLeft, totalDays = 365 }: { daysLeft: number; totalDays?: number }) {
  const { colors } = useTheme()
  const SIZE   = 160
  const BORDER = 14
  const progress = Math.max(0, Math.min(1, daysLeft / totalDays))
  const deg = progress * 360

  const color = daysLeft < 0 ? colors.textMuted
    : daysLeft <= 7  ? colors.error
    : daysLeft <= 30 ? colors.warning
    : colors.sage

  const fillAnim  = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const opAnim    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
      Animated.timing(opAnim,    { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(fillAnim,  { toValue: deg, duration: 900, useNativeDriver: false }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[ring.wrapper, { transform: [{ scale: scaleAnim }], opacity: opAnim }]}>
      {/* Background track */}
      <View style={[ring.track, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: BORDER, borderColor: `${color}20` }]} />

      {/* Left half arc */}
      <View style={[ring.half, ring.left, { width: SIZE / 2, height: SIZE }]}>
        <Animated.View style={[{
          width: SIZE, height: SIZE, borderRadius: SIZE / 2,
          borderWidth: BORDER, borderColor: color,
          position: 'absolute', left: 0,
        }, {
          transform: [{
            rotate: fillAnim.interpolate({
              inputRange: [0, 180, 360],
              outputRange: ['0deg', '180deg', '180deg'],
            }),
          }],
        }]} />
      </View>

      {/* Right half arc — only active when progress > 50% */}
      {deg > 180 && (
        <View style={[ring.half, ring.right, { width: SIZE / 2, height: SIZE }]}>
          <Animated.View style={[{
            width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            borderWidth: BORDER, borderColor: color,
            position: 'absolute', right: 0,
          }, {
            transform: [{
              rotate: fillAnim.interpolate({
                inputRange: [180, 360],
                outputRange: ['0deg', '180deg'],
              }),
            }],
          }]} />
        </View>
      )}

      {/* Center content */}
      <View style={ring.center}>
        <Text style={[ring.days, { color }]}>
          {daysLeft < 0 ? Math.abs(daysLeft) : daysLeft}
        </Text>
        <Text style={[ring.label, { color: colors.textMuted }]}>
          {daysLeft < 0 ? 'days ago' : daysLeft === 0 ? 'today' : 'days left'}
        </Text>
      </View>
    </Animated.View>
  )
}

const ring = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', width: 160, height: 160 },
  track:   { position: 'absolute' },
  half:    { position: 'absolute', overflow: 'hidden' },
  left:    { left: 0 },
  right:   { right: 0 },
  center:  { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 2 },
  days:    { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  label:   { fontSize: 13, fontWeight: '500' },
})

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({ icon, label, onPress, accent }: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string; onPress: () => void; accent?: boolean
}) {
  const { colors } = useTheme()
  const scale = useRef(new Animated.Value(1)).current
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.93, tension: 280, friction: 10, useNativeDriver: true }).start()
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }}
      onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start()}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View style={[
        act.btn,
        { backgroundColor: accent ? colors.textPrimary : colors.surface, borderColor: accent ? 'transparent' : colors.border },
        { transform: [{ scale }] },
      ]}>
        <Ionicons name={icon} size={22} color={accent ? colors.sage : colors.textSecondary} />
        <Text style={[act.label, { color: accent ? colors.sage : colors.textSecondary }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const act = StyleSheet.create({
  btn:   { borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
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

export default function DrugDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  const drug = MOCK_DRUGS.find(d => d.id === id) ?? MOCK_DRUGS[0]
  const status = expiryStatus(drug.expiryDays)
  const color  = expiryColor(status, colors)

  const contentY  = useRef(new Animated.Value(30)).current
  const contentOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(contentY,  { toValue: 0, tension: 55, friction: 14, useNativeDriver: true }),
      Animated.timing(contentOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
  }, [])

  const totalValue = drug.quantity * drug.unitPrice

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Hero header with gradient */}
      <LinearGradient
        colors={[`${color}18`, colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: colors.background + 'CC', borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.background + 'CC', borderColor: colors.border }]}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroContent}>
          <View style={{ flex: 1 }}>
            <View style={[styles.categoryTag, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
              <Text style={[styles.categoryText, { color }]}>{drug.category}</Text>
            </View>
            <Text style={[styles.drugName,    { color: colors.textPrimary }]}>{drug.name}</Text>
            <Text style={[styles.genericName, { color: colors.textSecondary }]}>{drug.genericName}</Text>
          </View>
          <ExpiryRing daysLeft={drug.expiryDays} />
        </View>
      </LinearGradient>

      {/* Stats row */}
      <Animated.View style={[
        styles.statsRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
        { transform: [{ translateY: contentY }], opacity: contentOp },
      ]}>
        {[
          { label: 'In Stock', value: `${drug.quantity}`, sub: drug.unit },
          { label: 'Unit Price', value: `₦${drug.unitPrice}`, sub: 'per unit' },
          { label: 'Total Value', value: `₦${totalValue >= 1000 ? (totalValue/1000).toFixed(1)+'k' : totalValue}`, sub: 'stock value' },
        ].map((s, i) => (
          <View key={s.label} style={[styles.statCell, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <Animated.View style={{ transform: [{ translateY: contentY }], opacity: contentOp }}>

          {/* Action buttons */}
          <View style={styles.actions}>
            <ActionBtn icon="add-circle-outline"    label="Restock"   onPress={() => {}} accent />
            <ActionBtn icon="swap-horizontal-outline" label="Redistribute" onPress={() => {}} />
            <ActionBtn icon="storefront-outline"   label="List"      onPress={() => {}} />
          </View>

          {/* Drug details */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textMuted }]}>DRUG DETAILS</Text>
            {[
              { label: 'Batch Number',   value: drug.batch },
              { label: 'Manufacturer',   value: drug.manufacturer },
              { label: 'NAFDAC No.',     value: drug.nafdacNo },
              { label: 'Storage',        value: drug.location },
              { label: 'Reorder Level',  value: `${drug.reorderLevel} ${drug.unit}` },
              { label: 'Expiry Status',  value: expiryLabel(drug.expiryDays) },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <InfoRow label={item.label} value={item.value} colors={colors} />
                {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>

          {/* Stock level indicator */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textMuted }]}>STOCK LEVEL</Text>
            <View style={{ gap: 10, marginTop: 4 }}>
              <View style={styles.stockRow}>
                <Text style={[styles.stockNum, { color: drug.quantity <= drug.reorderLevel ? colors.warning : colors.textPrimary }]}>
                  {drug.quantity} {drug.unit}
                </Text>
                <Text style={[styles.stockSub, { color: colors.textMuted }]}>
                  Reorder at {drug.reorderLevel}
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, (drug.quantity / (drug.reorderLevel * 3)) * 100)}%`,
                    backgroundColor: drug.quantity <= drug.reorderLevel ? colors.warning : colors.sage,
                  },
                ]} />
              </View>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  hero: { paddingHorizontal: 20, paddingBottom: 20 },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  navBtn: {
    width: 42, height: 42, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  categoryTag: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, marginBottom: 8,
  },
  categoryText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  drugName:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  genericName:  { fontSize: 14, lineHeight: 20 },

  statsRow: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 18,
    marginHorizontal: 20, marginTop: 4, marginBottom: 16, overflow: 'hidden',
  },
  statCell:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  scroll: { paddingHorizontal: 20 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  card: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  divider:   { height: 1 },

  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  stockNum: { fontSize: 22, fontWeight: '800' },
  stockSub: { fontSize: 14 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 4 },
})
