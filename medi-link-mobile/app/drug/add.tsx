import { useRef, useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const CATEGORIES = [
  'Antibiotic', 'Antidiabetic', 'Analgesic', 'Antacid', 'NSAID',
  'Antihypertensive', 'Antimalarial', 'Supplement', 'Antihistamine',
  'Antifungal', 'Antiretroviral', 'Cardiovascular', 'Other',
]

// ─── Scanner visual ───────────────────────────────────────────────────────────

function ScannerVisual({ onScan }: { onScan: (code: string) => void }) {
  const { colors } = useTheme()
  const [scanning, setScanning] = useState(false)
  const scanY    = useRef(new Animated.Value(0)).current
  const scanOp   = useRef(new Animated.Value(0)).current
  const frameOp  = useRef(new Animated.Value(0)).current
  const frameS   = useRef(new Animated.Value(0.92)).current
  const cornerOp = useRef(new Animated.Value(0)).current

  const startScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setScanning(true)

    Animated.parallel([
      Animated.spring(frameS,  { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.timing(frameOp, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(cornerOp,{ toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()

    const sweep = () => {
      scanY.setValue(0)
      Animated.sequence([
        Animated.timing(scanOp, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(scanY,  { toValue: 140, duration: 700, useNativeDriver: true }),
        Animated.timing(scanOp, { toValue: 0,   duration: 150, useNativeDriver: true }),
      ]).start()
    }
    sweep()
    const id = setInterval(sweep, 1400)

    // Simulate a successful scan after 3 seconds
    setTimeout(() => {
      clearInterval(id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      scanY.setValue(0)
      scanOp.setValue(0)
      setScanning(false)
      onScan('6009705535498')
    }, 3000)

    return () => clearInterval(id)
  }

  return (
    <View style={sv.container}>
      {!scanning ? (
        <TouchableOpacity style={[sv.idle, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={startScan} activeOpacity={0.85}>
          <View style={[sv.idleIconWrap, { backgroundColor: `${colors.sage}18` }]}>
            <Ionicons name="barcode-outline" size={40} color={colors.sage} />
          </View>
          <Text style={[sv.idleTitle, { color: colors.textPrimary }]}>Scan Barcode</Text>
          <Text style={[sv.idleSub, { color: colors.textMuted }]}>
            Point at the drug package to auto-fill details
          </Text>
        </TouchableOpacity>
      ) : (
        <Animated.View style={[sv.scanBox, { borderColor: colors.border, transform: [{ scale: frameS }], opacity: frameOp }]}>
          {/* Dark overlay with cutout illusion */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.background}CC` }]} />
          {/* Scan frame */}
          <View style={[sv.frame, { borderColor: colors.sage }]}>
            {/* Corner markers */}
            <Animated.View style={[sv.corner, sv.tl, { borderColor: colors.sage, opacity: cornerOp }]} />
            <Animated.View style={[sv.corner, sv.tr, { borderColor: colors.sage, opacity: cornerOp }]} />
            <Animated.View style={[sv.corner, sv.bl, { borderColor: colors.sage, opacity: cornerOp }]} />
            <Animated.View style={[sv.corner, sv.br, { borderColor: colors.sage, opacity: cornerOp }]} />
            {/* Sweep line */}
            <Animated.View style={[sv.sweep, { backgroundColor: colors.sage, opacity: scanOp, transform: [{ translateY: scanY }] }]} />
          </View>
          <Text style={[sv.scanLabel, { color: colors.textPrimary }]}>Scanning…</Text>
          <Text style={[sv.scanSub, { color: colors.textMuted }]}>Align barcode within frame</Text>
        </Animated.View>
      )}
    </View>
  )
}

const sv = StyleSheet.create({
  container: { marginBottom: 28 },
  idle: {
    borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
    padding: 28, alignItems: 'center', gap: 10,
  },
  idleIconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  idleTitle: { fontSize: 18, fontWeight: '700' },
  idleSub:   { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  scanBox: {
    height: 220, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', gap: 12,
  },
  frame: {
    width: 200, height: 140, borderWidth: 1,
    borderRadius: 4, overflow: 'hidden',
  },
  corner: {
    position: 'absolute', width: 20, height: 20,
    borderWidth: 2.5,
  },
  tl: { top: -1, left: -1,  borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  tr: { top: -1, right: -1, borderLeftWidth: 0,  borderBottomWidth: 0, borderTopRightRadius: 4 },
  bl: { bottom: -1, left: -1,  borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  br: { bottom: -1, right: -1, borderLeftWidth: 0,  borderTopWidth: 0, borderBottomRightRadius: 4 },
  sweep: { position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1 },
  scanLabel: { fontSize: 16, fontWeight: '700', zIndex: 1 },
  scanSub:   { fontSize: 14, zIndex: 1 },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AddDrugScreen() {
  const { colors } = useTheme()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  const [name, setName]         = useState('')
  const [generic, setGeneric]   = useState('')
  const [category, setCategory] = useState('')
  const [batch, setBatch]       = useState('')
  const [qty, setQty]           = useState('')
  const [price, setPrice]       = useState('')
  const [reorder, setReorder]   = useState('')
  const [expiry, setExpiry]     = useState('')
  const [nafdac, setNafdac]     = useState('')
  const [loading, setLoading]   = useState(false)

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
  }, [])

  const handleScan = (code: string) => {
    // Simulate auto-fill from barcode
    setName('Paracetamol 500mg')
    setGeneric('Acetaminophen')
    setCategory('Analgesic')
    setNafdac(code)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.back()
    }, 1200)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Header */}
        <Animated.View style={[
          styles.header,
          { paddingTop: insets.top + 16, borderBottomColor: colors.border },
          { transform: [{ translateY: headerY }], opacity: headerOp },
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Drug</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* Scanner */}
          <ScannerVisual onScan={handleScan} />

          {/* Section: Drug Identity */}
          <Text style={[styles.section, { color: colors.textMuted }]}>DRUG IDENTITY</Text>
          <View style={styles.fields}>
            <Input label="Drug name" value={name} onChangeText={setName} placeholder="e.g. Amoxicillin 500mg" autoCapitalize="words" />
            <Input label="Generic name" value={generic} onChangeText={setGeneric} placeholder="e.g. Amoxicillin Trihydrate" autoCapitalize="words" />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(c => {
                const active = category === c
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catChip, { backgroundColor: active ? colors.textPrimary : colors.surface, borderColor: active ? colors.textPrimary : colors.border }]}
                    onPress={() => { setCategory(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
                  >
                    <Text style={[styles.catChipText, { color: active ? '#fff' : colors.textSecondary }]}>{c}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Input label="NAFDAC Registration No." value={nafdac} onChangeText={setNafdac} placeholder="e.g. A4-0172L" autoCapitalize="characters" />
          </View>

          {/* Section: Stock Details */}
          <Text style={[styles.section, { color: colors.textMuted }]}>STOCK DETAILS</Text>
          <View style={styles.fields}>
            <Input label="Batch number" value={batch} onChangeText={setBatch} placeholder="e.g. B2024-01" autoCapitalize="characters" />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Input label="Quantity" value={qty} onChangeText={setQty} placeholder="0" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Unit price (₦)" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Input label="Reorder level" value={reorder} onChangeText={setReorder} placeholder="0" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Expiry date" value={expiry} onChangeText={setExpiry} placeholder="MM/YYYY" />
              </View>
            </View>
          </View>

          <Button label="Save Drug" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  section: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 14, marginTop: 8 },
  fields: { gap: 16, marginBottom: 28 },
  fieldLabel: { fontSize: 15, fontWeight: '500', marginBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5 },
  catChipText: { fontSize: 14, fontWeight: '500' },
  row2: { flexDirection: 'row', gap: 12 },
})
