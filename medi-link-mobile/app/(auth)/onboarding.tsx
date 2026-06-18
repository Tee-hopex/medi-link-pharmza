import { useRef, useState, useEffect } from 'react'
import {
  View, Text, ScrollView, Dimensions,
  StyleSheet, TouchableOpacity, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../constants/theme'
import { Logo } from '../../components/ui/Logo'

const { width, height } = Dimensions.get('window')
const ILLUS_H  = height * 0.50

// ─── Floating capsule deco ────────────────────────────────────────────────────

function FloatCapsule({ w, h, delay, style }: { w: number; h: number; delay: number; style?: object }) {
  const { colors } = useTheme()
  const y = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -12, duration: 2000 + delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0,   duration: 2000 + delay, useNativeDriver: true }),
    ])).start()
  }, [])
  return (
    <Animated.View style={[{ position: 'absolute', transform: [{ translateY: y }] }, style]}>
      <View style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: `${colors.sage}14`, borderWidth: 1.2, borderColor: `${colors.sage}40` }} />
    </Animated.View>
  )
}

// ─── SLIDE 1: Inventory Scanner ───────────────────────────────────────────────

const DRUG_ROWS = [
  { name: 'Amoxicillin 500mg', batch: 'B2024-01', days: '90d', status: 'sage'    as const, critical: false },
  { name: 'Metformin 850mg',   batch: 'B2023-11', days: ' 6d', status: 'error'   as const, critical: true  },
  { name: 'Paracetamol 1g',    batch: 'B2024-03', days: '45d', status: 'warning' as const, critical: false },
  { name: 'Omeprazole 20mg',   batch: 'B2024-02', days: '62d', status: 'sage'    as const, critical: false },
]
const CARD_H = DRUG_ROWS.length * 52 + 40

function InventoryScene({ isActive }: { isActive: boolean }) {
  const { colors } = useTheme()

  const cardScale   = useRef(new Animated.Value(0.9)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const r0tx = useRef(new Animated.Value(80)).current
  const r0op = useRef(new Animated.Value(0)).current
  const r1tx = useRef(new Animated.Value(80)).current
  const r1op = useRef(new Animated.Value(0)).current
  const r2tx = useRef(new Animated.Value(80)).current
  const r2op = useRef(new Animated.Value(0)).current
  const r3tx = useRef(new Animated.Value(80)).current
  const r3op = useRef(new Animated.Value(0)).current
  const scanY       = useRef(new Animated.Value(0)).current
  const scanOpacity = useRef(new Animated.Value(0)).current
  const criticalPulse = useRef(new Animated.Value(1)).current

  const rows = [
    { tx: r0tx, op: r0op },
    { tx: r1tx, op: r1op },
    { tx: r2tx, op: r2op },
    { tx: r3tx, op: r3op },
  ]

  useEffect(() => {
    if (!isActive) {
      cardScale.setValue(0.9); cardOpacity.setValue(0)
      rows.forEach(r => { r.tx.setValue(80); r.op.setValue(0) })
      return
    }
    Animated.parallel([
      Animated.spring(cardScale,   { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
    rows.forEach((r, i) => {
      Animated.sequence([
        Animated.delay(180 + i * 130),
        Animated.parallel([
          Animated.spring(r.tx, { toValue: 0, tension: 140, friction: 14, useNativeDriver: true }),
          Animated.timing(r.op, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]),
      ]).start()
    })
    Animated.loop(Animated.sequence([
      Animated.timing(criticalPulse, { toValue: 0.25, duration: 550, useNativeDriver: true }),
      Animated.timing(criticalPulse, { toValue: 1,    duration: 550, useNativeDriver: true }),
    ])).start()
    const runScan = () => {
      scanY.setValue(0)
      Animated.sequence([
        Animated.timing(scanOpacity, { toValue: 0.9, duration: 120, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: CARD_H, duration: 900, useNativeDriver: true }),
        Animated.timing(scanOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start()
    }
    const t = setTimeout(() => { runScan(); const id = setInterval(runScan, 3200); return () => clearInterval(id) }, 900)
    return () => clearTimeout(t)
  }, [isActive])

  return (
    <View style={s1.container}>
      <FloatCapsule w={88} h={34} delay={0}   style={{ top: 18, left: 22, transform: [{ rotate: '-14deg' }] }} />
      <FloatCapsule w={52} h={22} delay={320} style={{ top: 70, right: 28, transform: [{ rotate: '9deg' }] }} />
      <FloatCapsule w={66} h={26} delay={160} style={{ bottom: 24, right: 54, transform: [{ rotate: '-6deg' }] }} />
      <Animated.View style={[s1.card, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.sage }, { transform: [{ scale: cardScale }], opacity: cardOpacity }]}>
        <Animated.View style={[s1.scanLine, { backgroundColor: colors.sage, opacity: scanOpacity, transform: [{ translateY: scanY }] }]} />
        <View style={[s1.cardHeader, { borderBottomColor: colors.border }]}>
          <Text style={[s1.cardLabel, { color: colors.textMuted }]}>STOCK INTELLIGENCE</Text>
          <View style={s1.liveRow}>
            <View style={[s1.liveDot, { backgroundColor: colors.sage }]} />
            <Text style={[s1.liveText, { color: colors.textMuted }]}>LIVE</Text>
          </View>
        </View>
        {DRUG_ROWS.map((drug, i) => (
          <Animated.View key={drug.name} style={[s1.row, { borderBottomColor: colors.border }, { transform: [{ translateX: rows[i].tx }], opacity: rows[i].op }]}>
            {/* For critical row, nest a second Animated.View for the pulse — avoids Animated.multiply */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: drug.critical ? criticalPulse : 1 }]} />
            <View style={[s1.leftBar, { backgroundColor: colors[drug.status] }]} />
            <View style={s1.rowMid}>
              <Text style={[s1.drugName, { color: colors.textPrimary }]}>{drug.name}</Text>
              <Text style={[s1.batchText, { color: colors.textMuted }]}>{drug.batch}</Text>
            </View>
            <Text style={[s1.days, { color: colors[drug.status] }]}>{drug.days}</Text>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  )
}

const s1 = StyleSheet.create({
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card:       { width: width * 0.78, borderRadius: 18, borderWidth: 1, overflow: 'hidden', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  scanLine:   { position: 'absolute', left: 0, right: 0, height: 2, zIndex: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  cardLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  liveRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:    { width: 6, height: 6, borderRadius: 3 },
  liveText:   { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingRight: 14 },
  leftBar:    { width: 3, height: 52, borderRadius: 2 },
  rowMid:     { flex: 1, gap: 3 },
  drugName:   { fontSize: 13, fontWeight: '600' },
  batchText:  { fontSize: 11 },
  days:       { fontSize: 13, fontWeight: '700' },
})

// ─── SLIDE 2: Dead Stock Exchange ─────────────────────────────────────────────

function useCountdown(start: number, active: boolean) {
  const [secs, setSecs] = useState(start)
  useEffect(() => {
    if (!active) { setSecs(start); return }
    const id = setInterval(() => setSecs(s => (s > 0 ? s - 1 : start)), 1000)
    return () => clearInterval(id)
  }, [active])
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${d}d ${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

function useSoldCycle(active: boolean) {
  const [sold, setSold] = useState(false)
  useEffect(() => {
    if (!active) { setSold(false); return }
    const cycle = () => { setSold(true); setTimeout(() => setSold(false), 2200) }
    const t = setTimeout(cycle, 1800)
    const id = setInterval(cycle, 5500)
    return () => { clearTimeout(t); clearInterval(id) }
  }, [active])
  return sold
}

function MarketplaceScene({ isActive }: { isActive: boolean }) {
  const { colors } = useTheme()
  const countdown = useCountdown(129793, isActive)
  const isSold    = useSoldCycle(isActive)

  const leftScale    = useRef(new Animated.Value(0.85)).current
  const leftOpacity  = useRef(new Animated.Value(0)).current
  const rightScale   = useRef(new Animated.Value(0.85)).current
  const rightOpacity = useRef(new Animated.Value(0)).current
  const soldScale    = useRef(new Animated.Value(0)).current
  const p1y          = useRef(new Animated.Value(0)).current
  const p1o          = useRef(new Animated.Value(0)).current
  const p2y          = useRef(new Animated.Value(0)).current
  const p2o          = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isActive) {
      leftScale.setValue(0.85); leftOpacity.setValue(0)
      rightScale.setValue(0.85); rightOpacity.setValue(0)
      return
    }
    Animated.sequence([Animated.delay(100), Animated.parallel([
      Animated.spring(leftScale,   { toValue: 1, tension: 55, friction: 12, useNativeDriver: true }),
      Animated.timing(leftOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ])]).start()
    Animated.sequence([Animated.delay(280), Animated.parallel([
      Animated.spring(rightScale,   { toValue: 1, tension: 55, friction: 12, useNativeDriver: true }),
      Animated.timing(rightOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ])]).start()
  }, [isActive])

  useEffect(() => {
    if (isSold) {
      Animated.spring(soldScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start()
      p1y.setValue(0); p1o.setValue(1)
      p2y.setValue(0); p2o.setValue(1)
      Animated.sequence([Animated.delay(100), Animated.parallel([
        Animated.timing(p1y, { toValue: -55, duration: 700, useNativeDriver: true }),
        Animated.timing(p1o, { toValue: 0,   duration: 700, useNativeDriver: true }),
      ])]).start()
      Animated.sequence([Animated.delay(220), Animated.parallel([
        Animated.timing(p2y, { toValue: -70, duration: 700, useNativeDriver: true }),
        Animated.timing(p2o, { toValue: 0,   duration: 700, useNativeDriver: true }),
      ])]).start()
    } else {
      soldScale.setValue(0)
    }
  }, [isSold])

  const cardRightTop = ILLUS_H * 0.30

  return (
    <View style={s2.container}>
      <FloatCapsule w={72} h={28} delay={0}   style={{ top: 16, left: 18, transform: [{ rotate: '-10deg' }] }} />
      <FloatCapsule w={50} h={20} delay={280} style={{ bottom: 20, left: 30, transform: [{ rotate: '12deg' }] }} />

      {/* Left: countdown card */}
      <Animated.View style={[s2.card, { left: width * 0.06, top: ILLUS_H * 0.18, backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.sage }, { transform: [{ scale: leftScale }], opacity: leftOpacity }]}>
        <LinearGradient colors={[`${colors.sage}14`, `${colors.teal}10`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Text style={[s2.cardTag, { color: colors.sage, backgroundColor: `${colors.sage}18` }]}>NEAR EXPIRY</Text>
        <Text style={[s2.drugTitle, { color: colors.textPrimary }]}>Ibuprofen 400mg</Text>
        <Text style={[s2.drugSub, { color: colors.textMuted }]}>48 units</Text>
        <Text style={[s2.price, { color: colors.textPrimary }]}>₦2,880</Text>
        <View style={[s2.timerRow, { backgroundColor: `${colors.sage}18` }]}>
          <Ionicons name="time-outline" size={11} color={colors.sage} />
          <Text style={[s2.timerText, { color: colors.sage }]}>{countdown}</Text>
        </View>
      </Animated.View>

      {/* Right: sold card */}
      <Animated.View style={[s2.card, { right: width * 0.06, top: cardRightTop, borderColor: isSold ? `${colors.sage}80` : colors.border, backgroundColor: isSold ? `${colors.sage}12` : colors.background, shadowColor: colors.sage }, { transform: [{ scale: rightScale }], opacity: rightOpacity }]}>
        <Animated.View style={[s2.particle, { right: 22, transform: [{ translateY: p1y }], opacity: p1o }]}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.sage }}>N</Text>
        </Animated.View>
        <Animated.View style={[s2.particle, { right: 38, transform: [{ translateY: p2y }], opacity: p2o }]}>
          <Ionicons name="checkmark-circle" size={13} color={colors.sage} />
        </Animated.View>

        {isSold ? (
          <>
            <Animated.View style={[s2.soldBadge, { backgroundColor: colors.sage, transform: [{ scale: soldScale }] }]}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </Animated.View>
            <Text style={[s2.soldLabel, { color: colors.sage }]}>SOLD</Text>
            <Text style={[s2.drugTitle, { color: colors.textPrimary }]}>Omeprazole 20mg</Text>
            <Text style={[s2.soldEarned, { color: colors.sage }]}>+₦4,500 earned</Text>
          </>
        ) : (
          <>
            <Text style={[s2.cardTag, { color: colors.textMuted, backgroundColor: colors.surface }]}>LISTING</Text>
            <Text style={[s2.drugTitle, { color: colors.textPrimary }]}>Omeprazole 20mg</Text>
            <Text style={[s2.drugSub, { color: colors.textMuted }]}>60 units</Text>
            <Text style={[s2.price, { color: colors.textPrimary }]}>₦4,500</Text>
          </>
        )}
      </Animated.View>
    </View>
  )
}

const s2 = StyleSheet.create({
  container:  { flex: 1 },
  card:       { position: 'absolute', width: width * 0.38, borderRadius: 18, borderWidth: 1.5, padding: 14, overflow: 'hidden', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  cardTag:    { alignSelf: 'flex-start', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 10 },
  drugTitle:  { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  drugSub:    { fontSize: 10, marginBottom: 8 },
  price:      { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  timerRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  timerText:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  soldBadge:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8, alignSelf: 'center' },
  soldLabel:  { fontSize: 14, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  soldEarned: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  particle:   { position: 'absolute', bottom: 20, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
})

// ─── SLIDE 3: Network Graph ───────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const NET_NODES: { label: string; icon: IoniconName; x: number; y: number }[] = [
  { label: 'Hospital',   icon: 'business-outline', x: 140, y: 30  },
  { label: 'Pharmacy',   icon: 'flask-outline',     x: 255, y: 130 },
  { label: 'Patient',    icon: 'person-outline',    x: 200, y: 250 },
  { label: 'Wholesaler', icon: 'layers-outline',    x: 80,  y: 250 },
  { label: 'Clinic',     icon: 'heart-outline',     x: 25,  y: 130 },
]
const CX = 140, CY = 145

function calcLine(nx: number, ny: number) {
  const dx = nx - CX, dy = ny - CY
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle  = (Math.atan2(dy, dx) * 180) / Math.PI
  return { length, angle, midX: CX + dx / 2, midY: CY + dy / 2 }
}

function NetworkScene({ isActive }: { isActive: boolean }) {
  const { colors } = useTheme()

  const hubScale    = useRef(new Animated.Value(0)).current
  const hubOpacity  = useRef(new Animated.Value(0)).current
  const lineOpacity = useRef(new Animated.Value(0)).current
  const pulse       = useRef(new Animated.Value(1)).current
  const pulseOp     = useRef(new Animated.Value(0.6)).current

  const n0s = useRef(new Animated.Value(0)).current
  const n0o = useRef(new Animated.Value(0)).current
  const n1s = useRef(new Animated.Value(0)).current
  const n1o = useRef(new Animated.Value(0)).current
  const n2s = useRef(new Animated.Value(0)).current
  const n2o = useRef(new Animated.Value(0)).current
  const n3s = useRef(new Animated.Value(0)).current
  const n3o = useRef(new Animated.Value(0)).current
  const n4s = useRef(new Animated.Value(0)).current
  const n4o = useRef(new Animated.Value(0)).current
  const nodeAnims = [
    { s: n0s, o: n0o }, { s: n1s, o: n1o }, { s: n2s, o: n2o },
    { s: n3s, o: n3o }, { s: n4s, o: n4o },
  ]

  useEffect(() => {
    if (!isActive) {
      hubScale.setValue(0); hubOpacity.setValue(0); lineOpacity.setValue(0)
      nodeAnims.forEach(n => { n.s.setValue(0); n.o.setValue(0) })
      return
    }
    Animated.parallel([
      Animated.spring(hubScale,   { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(hubOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
    nodeAnims.forEach((n, i) => {
      Animated.sequence([
        Animated.delay(200 + i * 140),
        Animated.parallel([
          Animated.spring(n.s, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
          Animated.timing(n.o, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start()
    })
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(lineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(pulse,   { toValue: 1.25, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseOp, { toValue: 0,    duration: 1000, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(pulse,   { toValue: 1,   duration: 0, useNativeDriver: true }),
        Animated.timing(pulseOp, { toValue: 0.5, duration: 0, useNativeDriver: true }),
      ]),
      Animated.delay(600),
    ])).start()
  }, [isActive])

  return (
    <View style={s3.container}>
      <FloatCapsule w={60} h={24} delay={0}   style={{ top: 14, right: 20, transform: [{ rotate: '8deg' }] }} />
      <FloatCapsule w={45} h={18} delay={200} style={{ bottom: 18, left: 22, transform: [{ rotate: '-12deg' }] }} />
      <View style={s3.canvas}>
        {NET_NODES.map((node, i) => {
          const { length, angle, midX, midY } = calcLine(node.x, node.y)
          return (
            <Animated.View key={`line-${i}`} style={{ position: 'absolute', left: midX - length / 2, top: midY - 1, width: length, height: 2, borderRadius: 1, backgroundColor: `${colors.sage}50`, opacity: lineOpacity, transform: [{ rotate: `${angle}deg` }] }} />
          )
        })}
        <Animated.View style={[s3.pulseRing, { borderColor: colors.sage, left: CX - 30, top: CY - 30, transform: [{ scale: pulse }], opacity: pulseOp }]} />
        <Animated.View style={[s3.hub, { left: CX - 28, top: CY - 28, transform: [{ scale: hubScale }], opacity: hubOpacity }]}>
          <LinearGradient colors={[colors.sage, colors.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={s3.hubText}>P</Text>
        </Animated.View>
        {NET_NODES.map((node, i) => (
          <Animated.View key={node.label} style={[s3.node, { left: node.x - 26, top: node.y - 26, transform: [{ scale: nodeAnims[i].s }], opacity: nodeAnims[i].o }]}>
            <View style={[s3.nodeInner, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name={node.icon} size={20} color={colors.textSecondary} />
            </View>
            <Text style={[s3.nodeLabel, { color: colors.textMuted }]}>{node.label}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  )
}

const s3 = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  canvas:    { width: 280, height: 290 },
  pulseRing: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2 },
  hub:       { position: 'absolute', width: 56, height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  hubText:   { fontSize: 22, fontWeight: '900', color: '#fff', zIndex: 1 },
  node:      { position: 'absolute', alignItems: 'center', gap: 4 },
  nodeInner: { width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  nodeLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
})

// ─── Slide text ───────────────────────────────────────────────────────────────

const SLIDES = [
  { id: 0, number: '01', title: 'Know Every\nDrug You Own',    subtitle: 'Track every medication, batch, and expiry date in one intelligent dashboard.' },
  { id: 1, number: '02', title: 'Turn Expiry\nInto Revenue',   subtitle: 'List near-expiry stock on the Dead Stock Exchange before it costs you money.' },
  { id: 2, number: '03', title: 'Connect the\nEcosystem',      subtitle: 'Link pharmacies, hospitals, wholesalers, and patients on one trusted platform.' },
]

function SlideText({ slide, isActive, colors }: { slide: typeof SLIDES[0]; isActive: boolean; colors: any }) {
  const opacity    = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(18)).current
  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 360, delay: 80, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 360, delay: 80, useNativeDriver: true }),
      ]).start()
    } else {
      opacity.setValue(0); translateY.setValue(18)
    }
  }, [isActive])
  return (
    <Animated.View style={[styles.textBlock, { opacity, transform: [{ translateY }] }]}>
      <Text style={[styles.slideNum,      { color: colors.sage }]}>{slide.number}</Text>
      <Text style={[styles.slideTitle,    { color: colors.textPrimary }]}>{slide.title}</Text>
      <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>{slide.subtitle}</Text>
    </Animated.View>
  )
}

// ─── Pagination dot ───────────────────────────────────────────────────────────

function PaginationDot({ isActive, colors }: { isActive: boolean; colors: any }) {
  const w  = useRef(new Animated.Value(isActive ? 28 : 8)).current
  const bg = useRef(new Animated.Value(isActive ? 1 : 0)).current
  useEffect(() => {
    Animated.parallel([
      Animated.spring(w,  { toValue: isActive ? 28 : 8, tension: 60, friction: 10, useNativeDriver: false }),
      Animated.timing(bg, { toValue: isActive ? 1  : 0, duration: 200, useNativeDriver: false }),
    ]).start()
  }, [isActive])
  return (
    <Animated.View style={[styles.dot, {
      width: w,
      backgroundColor: bg.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.textPrimary] }),
    }]} />
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter()
  const { colors } = useTheme()
  const scrollRef = useRef<ScrollView>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const isLast = activeIndex === SLIDES.length - 1

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (!isLast) {
      const next = activeIndex + 1
      scrollRef.current?.scrollTo({ x: next * width, animated: true })
      setActiveIndex(next)
    } else {
      router.push('/(auth)/role-select')
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.logoRow}>
        <Logo size={36} />
        <Text style={[styles.logoText, { color: colors.textPrimary }]}>MEDI_LINK</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
        scrollEventThrottle={16}
      >
        {/* Slides hardcoded — never use SCENE_COMPONENTS[index] inside map */}
        <View style={styles.slide}>
          <View style={[styles.illus, { backgroundColor: colors.illustrationBg }]}>
            <InventoryScene isActive={activeIndex === 0} />
          </View>
          <SlideText slide={SLIDES[0]} isActive={activeIndex === 0} colors={colors} />
        </View>

        <View style={styles.slide}>
          <View style={[styles.illus, { backgroundColor: colors.illustrationBg }]}>
            <MarketplaceScene isActive={activeIndex === 1} />
          </View>
          <SlideText slide={SLIDES[1]} isActive={activeIndex === 1} colors={colors} />
        </View>

        <View style={styles.slide}>
          <View style={[styles.illus, { backgroundColor: colors.illustrationBg }]}>
            <NetworkScene isActive={activeIndex === 2} />
          </View>
          <SlideText slide={SLIDES[2]} isActive={activeIndex === 2} colors={colors} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <View style={styles.dots}>
          <PaginationDot isActive={activeIndex === 0} colors={colors} />
          <PaginationDot isActive={activeIndex === 1} colors={colors} />
          <PaginationDot isActive={activeIndex === 2} colors={colors} />
        </View>
        <TouchableOpacity onPress={goNext} activeOpacity={0.88} style={styles.nextBtn}>
          <LinearGradient
            colors={isLast ? [colors.sage, colors.teal] : [colors.buttonPrimaryBg, colors.buttonPrimaryBg]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.nextBtnGradient}
          >
            <Text style={[styles.nextBtnText, { color: isLast ? '#fff' : colors.buttonPrimaryText }]}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.push('/(auth)/role-select')}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:  { flex: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 4 },
  logoText:{ fontSize: 15, fontWeight: '700', letterSpacing: 3 },
  slide:   { width },
  illus:   { height: ILLUS_H, overflow: 'hidden' },
  textBlock:     { paddingHorizontal: 32, paddingTop: 28, gap: 12 },
  slideNum:      { fontSize: 13, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  slideTitle:    { fontSize: 36, fontWeight: '700', lineHeight: 44, letterSpacing: -0.5 },
  slideSubtitle: { fontSize: 17, lineHeight: 26 },
  footer:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 48, paddingTop: 20, gap: 20 },
  dots:    { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot:     { height: 8, borderRadius: 4 },
  nextBtn:         { flex: 1, borderRadius: 16, overflow: 'hidden' },
  nextBtnGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  nextBtnText:     { fontSize: 18, fontWeight: '600', letterSpacing: 0.3 },
  skipBtn:  { position: 'absolute', top: 52, right: 24, padding: 8 },
  skipText: { fontSize: 16, fontWeight: '500' },
})
