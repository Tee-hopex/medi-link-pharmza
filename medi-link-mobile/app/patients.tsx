import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../constants/theme'
import { Patient } from '../constants/network'
import { api } from '../lib/api'

function mapPatient(p: any): Patient {
  const meds: any[] = p.medications || []
  const hasC = meds.some(m => m.adherence === 'CRITICAL')
  const hasM = meds.some(m => m.adherence === 'MISSED')
  const adherenceStatus: Patient['adherenceStatus'] = hasC ? 'critical' : hasM ? 'missed' : 'on-track'
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    age: p.age || 0,
    condition: p.condition || '',
    adherenceStatus,
    adherencePercent: hasC ? 35 : hasM ? 65 : 95,
    lastSeen: 'Recently',
    phone: p.phone || '',
    nextRefillDays: 7,
    medications: meds.map(m => ({
      name: m.name,
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      nextDoseIn: m.adherence === 'MISSED' ? 'Missed' : m.adherence === 'CRITICAL' ? 'Overdue' : 'Scheduled',
    })),
  }
}

// ─── Adherence ring ───────────────────────────────────────────────────────────

function AdherenceRing({ percent, status, colors }: { percent: number; status: Patient['adherenceStatus']; colors: any }) {
  const SIZE   = 52
  const BORDER = 5
  const color  = status === 'on-track' ? colors.sage : status === 'missed' ? colors.warning : colors.error
  const deg    = (percent / 100) * 360

  const fillAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.7)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(fillAnim,  { toValue: deg, duration: 1000, useNativeDriver: false }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[rg.wrapper, { width: SIZE, height: SIZE }, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[rg.track, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: BORDER, borderColor: `${color}20` }]} />
      <View style={[rg.half, rg.left, { width: SIZE / 2, height: SIZE }]}>
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
      {deg > 180 && (
        <View style={[rg.half, rg.right, { width: SIZE / 2, height: SIZE }]}>
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
      <View style={rg.center}>
        <Text style={[rg.pct, { color }]}>{percent}%</Text>
      </View>
    </Animated.View>
  )
}

const rg = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  track:   { position: 'absolute' },
  half:    { position: 'absolute', overflow: 'hidden' },
  left:    { left: 0 },
  right:   { right: 0 },
  center:  { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pct:     { fontSize: 13, fontWeight: '800' },
})

// ─── Patient card ─────────────────────────────────────────────────────────────

function PatientCard({ patient, expanded, onToggle, colors }: {
  patient: Patient; expanded: boolean; onToggle: () => void; colors: any
}) {
  const statusColor = patient.adherenceStatus === 'on-track' ? colors.sage
    : patient.adherenceStatus === 'missed' ? colors.warning
    : colors.error

  const chevronAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current
  useEffect(() => {
    Animated.timing(chevronAnim, { toValue: expanded ? 1 : 0, duration: 200, useNativeDriver: true }).start()
  }, [expanded])
  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })

  return (
    <View style={[pc.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle() }}
      >
        <View style={pc.header}>
          <AdherenceRing percent={patient.adherencePercent} status={patient.adherenceStatus} colors={colors} />

          <View style={{ flex: 1 }}>
            <Text style={[pc.name, { color: colors.textPrimary }]}>{patient.name}</Text>
            <Text style={[pc.condition, { color: colors.textSecondary }]}>{patient.condition} · Age {patient.age}</Text>
            <View style={pc.metaRow}>
              <View style={[pc.statusPill, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
                <View style={[pc.dot, { backgroundColor: statusColor }]} />
                <Text style={[pc.statusText, { color: statusColor }]}>
                  {patient.adherenceStatus === 'on-track' ? 'On Track'
                    : patient.adherenceStatus === 'missed' ? 'Missed Doses'
                    : 'Critical'}
                </Text>
              </View>
              {patient.nextRefillDays === 0
                ? <Text style={[pc.refill, { color: colors.error }]}>Refill overdue</Text>
                : <Text style={[pc.refill, { color: colors.textMuted }]}>Refill in {patient.nextRefillDays}d</Text>
              }
            </View>
          </View>

          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Expanded: medications + actions */}
      {expanded && (
        <View style={[pc.detail, { borderTopColor: colors.border }]}>
          <Text style={[pc.detailTitle, { color: colors.textMuted }]}>MEDICATIONS</Text>
          {patient.medications.map((med, i) => (
            <View
              key={med.name}
              style={[pc.medRow, i < patient.medications.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={[pc.medDot, { backgroundColor: `${colors.sage}18` }]}>
                <Ionicons name="medkit-outline" size={14} color={colors.sage} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[pc.medName, { color: colors.textPrimary }]}>{med.name}</Text>
                <Text style={[pc.medFreq, { color: colors.textMuted }]}>{med.dosage} · {med.frequency}</Text>
              </View>
              <Text style={[pc.medNext, {
                color: med.nextDoseIn === 'Missed' || med.nextDoseIn === 'Overdue' ? colors.error : colors.textSecondary
              }]}>
                {med.nextDoseIn}
              </Text>
            </View>
          ))}

          <View style={pc.actionsRow}>
            <TouchableOpacity
              style={[pc.actionBtn, { backgroundColor: colors.textPrimary }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.sage} />
              <Text style={[pc.actionText, { color: colors.sage }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pc.actionBtnOutline, { borderColor: colors.border }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="reload-outline" size={16} color={colors.textSecondary} />
              <Text style={[pc.actionTextMuted, { color: colors.textSecondary }]}>Request Refill</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const pc = StyleSheet.create({
  wrap:   { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  name:   { fontSize: 17, fontWeight: '700' },
  condition: { fontSize: 14, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  refill:     { fontSize: 13, fontWeight: '500' },

  detail:     { borderTopWidth: 1, padding: 16, gap: 12 },
  detailTitle:{ fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  medRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  medDot:     { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  medName:    { fontSize: 15, fontWeight: '600' },
  medFreq:    { fontSize: 13, marginTop: 2 },
  medNext:    { fontSize: 13, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: 12,
  },
  actionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: 12, borderWidth: 1.5,
  },
  actionText:     { fontSize: 14, fontWeight: '700' },
  actionTextMuted:{ fontSize: 14, fontWeight: '600' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PatientsScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [patients, setPatients]     = useState<Patient[]>([])
  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
    api.get('/patients').then(({ data }) => setPatients((data.data as any[]).map(mapPatient))).catch(() => {})
  }, [])

  const onTrack  = patients.filter(p => p.adherenceStatus === 'on-track').length
  const missed   = patients.filter(p => p.adherenceStatus === 'missed').length
  const critical = patients.filter(p => p.adherenceStatus === 'critical').length

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
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Patients</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.textPrimary }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Ionicons name="add" size={20} color={colors.sage} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Summary strip */}
        <View style={[styles.strip, { borderColor: colors.border }]}>
          {[
            { label: 'On Track', value: onTrack,  color: colors.sage    },
            { label: 'Missed',   value: missed,   color: colors.warning  },
            { label: 'Critical', value: critical, color: colors.error    },
          ].map((item, i) => (
            <View key={item.label} style={[styles.stripCell, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[styles.stripNum, { color: item.color }]}>{item.value}</Text>
              <Text style={[styles.stripLabel, { color: colors.textMuted }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Patient cards — critical first */}
        {[...patients].sort((a, b) => {
          const order = { critical: 0, missed: 1, 'on-track': 2 }
          return order[a.adherenceStatus] - order[b.adherenceStatus]
        }).map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            expanded={expandedId === patient.id}
            onToggle={() => setExpandedId(expandedId === patient.id ? null : patient.id)}
            colors={colors}
          />
        ))}
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
  title:  { fontSize: 18, fontWeight: '700' },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  strip:  { flexDirection: 'row', borderWidth: 1, borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  stripCell:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  stripNum:   { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  stripLabel: { fontSize: 12, fontWeight: '500' },
})
