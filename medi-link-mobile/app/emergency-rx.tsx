import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../constants/theme'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmergencyStage = 'idle' | 'searching' | 'blasting' | 'tracking'
type PharmacyResponseStatus = 'pending' | 'notified' | 'responded' | 'unavailable'

interface EmergencyPharmacy {
  id: string
  name: string
  distance: number
  status: PharmacyResponseStatus
  quantity?: number
  phone?: string
}

const BLAST_PHARMACIES: EmergencyPharmacy[] = [
  { id: 'ep1', name: 'Medicare Pharmacy',          distance: 0.9,  status: 'pending' },
  { id: 'ep2', name: 'Medplus Victoria Island',    distance: 1.2,  status: 'pending' },
  { id: 'ep3', name: 'CarePoint VI',               distance: 1.8,  status: 'pending' },
  { id: 'ep4', name: 'Reddington Pharmacy',        distance: 2.8,  status: 'pending' },
  { id: 'ep5', name: 'PharmaCare Yaba',            distance: 3.1,  status: 'pending' },
  { id: 'ep6', name: 'HealthPlus Ikeja',           distance: 3.4,  status: 'pending' },
  { id: 'ep7', name: 'QuickMeds Surulere',         distance: 4.2,  status: 'pending' },
  { id: 'ep8', name: 'Alpha Pharmacy Surulere',    distance: 4.7,  status: 'pending' },
  { id: 'ep9', name: 'Lifemeds Lekki',             distance: 5.1,  status: 'pending' },
  { id: 'ep10', name: 'Drugfield Lagos Island',    distance: 6.3,  status: 'pending' },
]

const RESPONSE_SCHEDULE: { id: string; delay: number; status: PharmacyResponseStatus; quantity?: number }[] = [
  { id: 'ep1',  delay: 1200, status: 'notified' },
  { id: 'ep2',  delay: 1600, status: 'notified' },
  { id: 'ep3',  delay: 2100, status: 'notified' },
  { id: 'ep1',  delay: 2800, status: 'responded', quantity: 24 },
  { id: 'ep4',  delay: 3000, status: 'notified' },
  { id: 'ep5',  delay: 3400, status: 'notified' },
  { id: 'ep2',  delay: 3800, status: 'responded', quantity: 48 },
  { id: 'ep6',  delay: 4200, status: 'notified' },
  { id: 'ep3',  delay: 4600, status: 'unavailable' },
  { id: 'ep7',  delay: 5000, status: 'notified' },
  { id: 'ep4',  delay: 5500, status: 'responded', quantity: 12 },
  { id: 'ep5',  delay: 5800, status: 'unavailable' },
  { id: 'ep8',  delay: 6200, status: 'notified' },
  { id: 'ep6',  delay: 6600, status: 'responded', quantity: 60 },
  { id: 'ep9',  delay: 7000, status: 'notified' },
  { id: 'ep7',  delay: 7400, status: 'unavailable' },
  { id: 'ep10', delay: 7800, status: 'notified' },
  { id: 'ep8',  delay: 8200, status: 'responded', quantity: 30 },
  { id: 'ep9',  delay: 8800, status: 'unavailable' },
  { id: 'ep10', delay: 9400, status: 'unavailable' },
]

// ─── Pulse rings (idle state) ─────────────────────────────────────────────────

function PulseRing({ delay, size, colors }: { delay: number; size: number; colors: any }) {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const run = () => {
      scale.setValue(1); opacity.setValue(0.4)
      Animated.parallel([
        Animated.timing(scale,   { toValue: 2.4,  duration: 1600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,    duration: 1600, useNativeDriver: true }),
      ]).start()
    }
    const t = setTimeout(() => {
      run()
      const id = setInterval(run, 2000)
      return () => clearInterval(id)
    }, delay)
    return () => clearTimeout(t)
  }, [])

  return (
    <Animated.View style={[
      styles.pulseRing,
      { width: size, height: size, borderRadius: size / 2, borderColor: colors.error },
      { transform: [{ scale }], opacity },
    ]} />
  )
}

// ─── Response row ─────────────────────────────────────────────────────────────

function ResponseRow({ pharmacy, index, drugName, colors }: {
  pharmacy: EmergencyPharmacy
  index: number
  drugName: string
  colors: any
}) {
  const ty = useRef(new Animated.Value(20)).current
  const op = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 60),
      Animated.parallel([
        Animated.spring(ty, { toValue: 0, tension: 160, friction: 18, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  const statusColor = pharmacy.status === 'responded' ? colors.sage
    : pharmacy.status === 'unavailable' ? colors.textMuted
    : pharmacy.status === 'notified' ? colors.warning
    : colors.teal

  const statusLabel = pharmacy.status === 'responded' ? `In Stock — ${pharmacy.quantity} units`
    : pharmacy.status === 'unavailable' ? 'Unavailable'
    : pharmacy.status === 'notified' ? 'Notified'
    : 'Searching...'

  const isLast = index === 9

  return (
    <Animated.View style={[
      styles.responseRow,
      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      { transform: [{ translateY: ty }], opacity: op },
    ]}>
      <View style={[styles.responseIcon, { backgroundColor: `${statusColor}18` }]}>
        <Ionicons
          name={
            pharmacy.status === 'responded'  ? 'checkmark-circle' :
            pharmacy.status === 'unavailable'? 'close-circle-outline' :
            pharmacy.status === 'notified'   ? 'notifications-outline' :
            'radio-outline'
          }
          size={18}
          color={statusColor}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.responsePharmacy, { color: colors.textPrimary }]}>{pharmacy.name}</Text>
        <Text style={[styles.responseStatus, { color: statusColor }]}>{statusLabel}</Text>
      </View>
      <Text style={[styles.responseDist, { color: colors.textMuted }]}>{pharmacy.distance}km</Text>
      {pharmacy.status === 'responded' && (
        <TouchableOpacity
          style={[styles.contactBtn, { backgroundColor: colors.textPrimary }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Text style={[styles.contactText, { color: colors.sage }]}>Contact</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}

// ─── Blasting dot (extracted to honour Rules of Hooks) ───────────────────────

function BlastingDot({ delay }: { delay: number }) {
  const { colors } = useTheme()
  const dotOp = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(dotOp, { toValue: 1,   duration: 400, useNativeDriver: true }),
      Animated.timing(dotOp, { toValue: 0.3, duration: 400, useNativeDriver: true }),
    ])).start()
  }, [])
  return <Animated.View style={[bld.dot, { backgroundColor: colors.error, opacity: dotOp }]} />
}

const bld = StyleSheet.create({
  dot: { width: 12, height: 12, borderRadius: 6 },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EmergencyRxScreen() {
  const { colors } = useTheme()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  const [stage, setStage]         = useState<EmergencyStage>('idle')
  const [drugQuery, setDrugQuery] = useState('')
  const [selectedDrug, setSelectedDrug] = useState('')
  const [pharmacies, setPharmacies]     = useState<EmergencyPharmacy[]>(BLAST_PHARMACIES)
  const [respondedCount, setRespondedCount] = useState(0)
  const [requestId, setRequestId] = useState<string | null>(null)

  const buttonScale  = useRef(new Animated.Value(1)).current
  const panelY       = useRef(new Animated.Value(400)).current
  const panelOpacity = useRef(new Animated.Value(0)).current
  const blastScale   = useRef(new Animated.Value(0)).current
  const blastOpacity = useRef(new Animated.Value(0)).current
  const timersRef    = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  useEffect(() => () => { clearTimers(); getSocket()?.off('emergency:response') }, [])

  const handleButtonPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.88, tension: 400, friction: 8, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1,    tension: 200, friction: 10, useNativeDriver: true }),
    ]).start()
    setStage('searching')
    Animated.parallel([
      Animated.spring(panelY,      { toValue: 0, tension: 55, friction: 14, useNativeDriver: true }),
      Animated.timing(panelOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
  }

  const QUICK_DRUGS = ['Amoxicillin 500mg', 'Paracetamol 1g', 'Metformin 850mg', 'Insulin', 'Morphine 10mg']

  const handleDrugSelect = async (drug: string) => {
    setSelectedDrug(drug)
    setStage('blasting')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

    Animated.parallel([
      Animated.spring(blastScale,   { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(blastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()

    // Fire broadcast API and subscribe to real responses via socket
    api.post('/emergency-rx/broadcast', { drugName: drug, urgency: 'CRITICAL' })
      .then(({ data }) => {
        const id = data.data?.id ?? null
        setRequestId(id)

        const socket = getSocket()
        if (socket) {
          socket.on('emergency:response', (response: any) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setPharmacies(prev => {
              const exists = prev.find(p => p.id === response.id)
              const mapped: EmergencyPharmacy = {
                id: response.id,
                name: response.pharmacyName,
                distance: 0,
                status: 'responded',
                quantity: response.quantity,
              }
              return exists
                ? prev.map(p => p.id === response.id ? mapped : p)
                : [...prev, mapped]
            })
            setRespondedCount(c => c + 1)
          })
        }
      })
      .catch(() => {})

    const t = setTimeout(() => {
      setStage('tracking')
      setPharmacies([]) // populated by real socket responses
    }, 2200)
    timersRef.current.push(t)
  }

  const handleCancel = () => {
    clearTimers()
    getSocket()?.off('emergency:response')
    router.back()
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>EmergencyRx</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* ── IDLE stage ── */}
        {(stage === 'idle') && (
          <View style={styles.idleCenter}>
            <Text style={[styles.idleTitle, { color: colors.textPrimary }]}>
              Need a drug urgently?
            </Text>
            <Text style={[styles.idleSub, { color: colors.textSecondary }]}>
              Tap to blast a request to the 10 nearest pharmacies instantly.
            </Text>

            <View style={styles.buttonWrap}>
              <PulseRing delay={0}    size={180} colors={colors} />
              <PulseRing delay={600}  size={180} colors={colors} />
              <PulseRing delay={1200} size={180} colors={colors} />
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.bigButton, { backgroundColor: colors.error, shadowColor: colors.error }]}
                  onPress={handleButtonPress}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flash" size={40} color="#fff" />
                  <Text style={styles.bigButtonText}>EMERGENCY</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <Text style={[styles.idleNote, { color: colors.textMuted }]}>
              Your location will be shared with responding pharmacies
            </Text>
          </View>
        )}

        {/* ── SEARCHING stage ── */}
        {stage === 'searching' && (
          <Animated.View
            style={[styles.searchPanel, { transform: [{ translateY: panelY }], opacity: panelOpacity }]}
          >
            <Text style={[styles.searchTitle, { color: colors.textPrimary }]}>What drug do you need?</Text>
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Type drug name…"
                placeholderTextColor={colors.textMuted}
                value={drugQuery}
                onChangeText={setDrugQuery}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => drugQuery.trim() && handleDrugSelect(drugQuery.trim())}
              />
            </View>

            <Text style={[styles.quickLabel, { color: colors.textMuted }]}>Quick select</Text>
            <View style={styles.quickGrid}>
              {QUICK_DRUGS.map(drug => (
                <TouchableOpacity
                  key={drug}
                  style={[styles.quickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleDrugSelect(drug)}
                >
                  <Text style={[styles.quickChipText, { color: colors.textPrimary }]}>{drug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── BLASTING stage ── */}
        {stage === 'blasting' && (
          <Animated.View style={[styles.blastCenter, { transform: [{ scale: blastScale }], opacity: blastOpacity }]}>
            <View style={[styles.drugChip, { backgroundColor: `${colors.error}18`, borderColor: `${colors.error}40` }]}>
              <Ionicons name="medkit-outline" size={16} color={colors.error} />
              <Text style={[styles.drugChipText, { color: colors.error }]}>{selectedDrug}</Text>
            </View>
            <Text style={[styles.blastTitle, { color: colors.textPrimary }]}>Sending to 10 pharmacies</Text>

            <View style={styles.sendingDots}>
              <BlastingDot delay={0} />
              <BlastingDot delay={250} />
              <BlastingDot delay={500} />
            </View>
            <Text style={[styles.blastSub, { color: colors.textSecondary }]}>
              Nearest pharmacies are being notified with your location
            </Text>
          </Animated.View>
        )}

        {/* ── TRACKING stage ── */}
        {stage === 'tracking' && (
          <View style={{ flex: 1 }}>
            <View style={[styles.trackingHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.drugChip, { backgroundColor: `${colors.error}18`, borderColor: `${colors.error}40` }]}>
                <Ionicons name="medkit-outline" size={15} color={colors.error} />
                <Text style={[styles.drugChipText, { color: colors.error }]}>{selectedDrug}</Text>
              </View>
              <View style={styles.progressRow}>
                <Text style={[styles.progressText, { color: colors.textPrimary }]}>
                  <Text style={{ color: colors.sage, fontWeight: '800' }}>{respondedCount}</Text>
                  {respondedCount === 1 ? ' pharmacy responded' : ' pharmacies responded'}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.sage, width: respondedCount > 0 ? `${Math.min(respondedCount * 10, 100)}%` : '0%' }]} />
                </View>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
              {pharmacies.length === 0 ? (
                <View style={styles.waitingWrap}>
                  <Ionicons name="radio-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.waitingText, { color: colors.textMuted }]}>Waiting for pharmacy responses…</Text>
                </View>
              ) : (
                <View style={[styles.responseList, { borderColor: colors.border }]}>
                  {pharmacies.map((p, i) => (
                    <ResponseRow key={p.id} pharmacy={p} index={i} drugName={selectedDrug} colors={colors} />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  // Idle
  idleCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },
  idleTitle: { fontSize: 26, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 },
  idleSub:   { fontSize: 17, textAlign: 'center', lineHeight: 26 },
  idleNote:  { fontSize: 14, textAlign: 'center' },

  buttonWrap: { alignItems: 'center', justifyContent: 'center', width: 200, height: 200 },
  pulseRing:  { position: 'absolute', borderWidth: 2 },
  bigButton: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 16,
  },
  bigButtonText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },

  // Searching
  searchPanel: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 20 },
  searchTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 17 },
  quickLabel: { fontSize: 14, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5,
  },
  quickChipText: { fontSize: 15, fontWeight: '500' },

  // Blasting
  blastCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },
  blastTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  blastSub:   { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  sendingDots: { flexDirection: 'row', gap: 10 },

  drugChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  drugChipText: { fontSize: 15, fontWeight: '700' },

  // Tracking
  trackingHeader: { padding: 20, paddingTop: 16, gap: 14, borderBottomWidth: 1 },
  progressRow:   { gap: 8 },
  progressText:  { fontSize: 16 },
  progressBar:   { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },

  waitingWrap: { alignItems: 'center', paddingTop: 48, gap: 12 },
  waitingText: { fontSize: 16, fontWeight: '500' },

  responseList: { marginHorizontal: 20, marginTop: 12, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  responseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  responseIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  responsePharmacy: { fontSize: 15, fontWeight: '600' },
  responseStatus:   { fontSize: 13, fontWeight: '500', marginTop: 2 },
  responseDist:     { fontSize: 13 },
  contactBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10,
  },
  contactText: { fontSize: 13, fontWeight: '700' },
})
