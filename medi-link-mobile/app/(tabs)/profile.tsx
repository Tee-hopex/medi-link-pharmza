import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'
import { useAuthStore } from '../../store/auth.store'
import { api } from '../../lib/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVerificationLevel(level: string): 0 | 1 | 2 | 3 {
  switch (level) {
    case 'LEVEL_1': return 1
    case 'LEVEL_2': return 2
    case 'LEVEL_3': return 3
    default:        return 0
  }
}

function getVerificationLabel(level: string): string {
  switch (level) {
    case 'UNVERIFIED': return 'Unverified'
    case 'PENDING':    return 'Pending Review'
    case 'LEVEL_1':    return 'Level 1 Verified'
    case 'LEVEL_2':    return 'Level 2 Verified'
    case 'LEVEL_3':    return 'Level 3 Verified'
    default:           return 'Unverified'
  }
}

function useCountUp(target: number, duration = 1200, enabled = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) { setValue(0); return }
    let startTime: number | null = null
    let frameId: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const t = Math.min((ts - startTime) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - t, 3)) * target))
      if (t < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [target, enabled])
  return value
}

// ─── Animated tier rings around avatar ───────────────────────────────────────

const AV = 88

function TierRings({ level, colors }: { level: 0 | 1 | 2 | 3; colors: any }) {
  const rings = [
    { offset: 14, thickness: 3,   delay: 300 },
    { offset: 24, thickness: 2.5, delay: 500 },
    { offset: 34, thickness: 2,   delay: 700 },
  ]

  const s0 = useRef(new Animated.Value(0.6)).current
  const s1 = useRef(new Animated.Value(0.6)).current
  const s2 = useRef(new Animated.Value(0.6)).current
  const o0 = useRef(new Animated.Value(0)).current
  const o1 = useRef(new Animated.Value(0)).current
  const o2 = useRef(new Animated.Value(0)).current
  const anims = [
    { scale: s0, opacity: o0 },
    { scale: s1, opacity: o1 },
    { scale: s2, opacity: o2 },
  ]

  useEffect(() => {
    rings.forEach((r, i) => {
      const earned = i < level
      Animated.sequence([
        Animated.delay(r.delay),
        Animated.parallel([
          Animated.spring(anims[i].scale,   { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
          Animated.timing(anims[i].opacity, { toValue: earned ? 1 : 0.25, duration: 300, useNativeDriver: true }),
        ]),
      ]).start()
    })
  }, [level])

  const size = AV + rings[rings.length - 1].offset * 2

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {rings.map((r, i) => {
        const ringSize = AV + r.offset * 2
        const earned   = i < level
        return (
          <Animated.View
            key={i}
            style={[
              ring.circle,
              {
                width:  ringSize, height: ringSize,
                borderRadius: ringSize / 2,
                borderWidth: r.thickness,
                borderColor: earned ? colors.sage : colors.border,
                position: 'absolute',
              },
              { transform: [{ scale: anims[i].scale }], opacity: anims[i].opacity },
            ]}
          />
        )
      })}
    </View>
  )
}

const ring = StyleSheet.create({
  circle: {},
})

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, level, colors }: { initials: string; level: 0 | 1 | 2 | 3; colors: any }) {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (level === 3) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])).start()
    }
  }, [level])

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <TierRings level={level} colors={colors} />
      <Animated.View
        style={[
          av.circle,
          { backgroundColor: colors.textPrimary, shadowColor: colors.sage, transform: [{ scale: pulse }] },
        ]}
      >
        <Text style={[av.initials, { color: colors.sage }]}>{initials}</Text>
      </Animated.View>
    </View>
  )
}

const av = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: AV, height: AV, borderRadius: AV / 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  initials: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
})

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, accent, dim, enabled, colors }: {
  value: number; label: string; accent?: boolean; dim?: boolean; enabled: boolean; colors: any
}) {
  const count = useCountUp(value, 1200, enabled)
  const ty = useRef(new Animated.Value(20)).current
  const op = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (enabled) {
      Animated.parallel([
        Animated.spring(ty, { toValue: 0, tension: 140, friction: 16, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start()
    } else {
      ty.setValue(20); op.setValue(0)
    }
  }, [enabled])

  return (
    <Animated.View
      style={[stat.wrap, { backgroundColor: colors.surface, borderColor: colors.border }, { transform: [{ translateY: ty }], opacity: op }]}
    >
      <Text style={[stat.value, { color: dim ? colors.textMuted : accent ? colors.sage : colors.textPrimary }]}>
        {count}
      </Text>
      <Text style={[stat.label, { color: colors.textMuted }]}>{label}</Text>
      {dim && (
        <View style={[stat.phasePill, { backgroundColor: colors.border }]}>
          <Text style={[stat.phaseText, { color: colors.textMuted }]}>Phase 3</Text>
        </View>
      )}
    </Animated.View>
  )
}

const stat = StyleSheet.create({
  wrap:      { flex: 1, borderRadius: 18, borderWidth: 1, padding: 16, alignItems: 'center', gap: 4 },
  value:     { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  label:     { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  phasePill: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  phaseText: { fontSize: 11, fontWeight: '600' },
})

// ─── Setting link row ─────────────────────────────────────────────────────────

function LinkRow({ icon, label, sublabel, onPress, danger, colors }: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  sublabel?: string
  onPress: () => void
  danger?: boolean
  colors: any
}) {
  const scale = useRef(new Animated.Value(1)).current
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress() }}
    >
      <Animated.View style={[lnk.row, { transform: [{ scale }] }]}>
        <View style={[lnk.iconWrap, { backgroundColor: danger ? `${colors.error}18` : colors.surface }]}>
          <Ionicons name={icon} size={20} color={danger ? colors.error : colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[lnk.label, { color: danger ? colors.error : colors.textPrimary }]}>{label}</Text>
          {sublabel && <Text style={[lnk.sub, { color: colors.textMuted }]}>{sublabel}</Text>}
        </View>
        {!danger && <Ionicons name="chevron-forward" size={18} color={colors.border} />}
      </Animated.View>
    </TouchableOpacity>
  )
}

const lnk = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 4 },
  iconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 16, fontWeight: '600' },
  sub:     { fontSize: 13, marginTop: 2 },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const [statsReady, setStatsReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  useFocusEffect(
    useCallback(() => {
      setStatsReady(false)
      Animated.parallel([
        Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
        Animated.timing(headerOp, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start()
      const t = setTimeout(() => setStatsReady(true), 400)
      return () => { clearTimeout(t); setStatsReady(false); headerY.setValue(-16); headerOp.setValue(0) }
    }, []),
  )

  const firstName  = user?.firstName ?? 'Demo'
  const lastName   = user?.lastName  ?? 'User'
  const initials   = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const profession = user?.profession ?? 'Pharmacist'
  const premiseName = user?.facility?.name ?? 'My Pharmacy'
  const verLevel   = user?.verificationLevel ?? 'UNVERIFIED'
  const tierNum    = getVerificationLevel(verLevel)
  const verLabel   = getVerificationLabel(verLevel)

  const patientsServed = 0

  const handleSubmitVerification = async () => {
    if (verLevel === 'PENDING') {
      Alert.alert('Under Review', 'Your verification is already submitted and under review. We\'ll notify you once it\'s processed.')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSubmitting(true)
    try {
      await api.post('/users/me/verification/submit', {})
      const { refreshUser } = useAuthStore.getState()
      await refreshUser()
      Alert.alert('Submitted!', 'Your verification request has been submitted. Our team will review it shortly.')
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to submit verification. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    logout()
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { paddingTop: insets.top + 16, backgroundColor: colors.background },
        { transform: [{ translateY: headerY }], opacity: headerOp },
      ]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings') }}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Hero: avatar + name + badge */}
        <LinearGradient
          colors={[`${colors.sage}12`, colors.background]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.hero}
        >
          <Avatar initials={initials} level={tierNum} colors={colors} />

          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {firstName} {lastName}
          </Text>
          <Text style={[styles.profession, { color: colors.textSecondary }]}>{profession}</Text>

          {/* Verification badge */}
          <View style={[
            styles.verBadge,
            {
              backgroundColor: tierNum > 0 ? `${colors.sage}14` : `${colors.warning}14`,
              borderColor:      tierNum > 0 ? `${colors.sage}40` : `${colors.warning}40`,
            },
          ]}>
            <Ionicons
              name={tierNum > 0 ? 'shield-checkmark' : 'shield-outline'}
              size={14}
              color={tierNum > 0 ? colors.sage : colors.warning}
            />
            <Text style={[styles.verLabel, { color: tierNum > 0 ? colors.sage : colors.warning }]}>
              {verLabel}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard value={0}              label="Drugs Tracked"    accent   enabled={statsReady} colors={colors} />
          <StatCard value={0}              label="Trades Done"               enabled={statsReady} colors={colors} />
          <StatCard value={patientsServed}  label="Patients Served" dim      enabled={statsReady} colors={colors} />
        </View>

        {/* Pharmacy card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.sage}18` }]}>
              <Ionicons name="storefront-outline" size={20} color={colors.sage} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Pharmacy Details</Text>
            <TouchableOpacity
              style={[styles.editChip, { backgroundColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings') }}
            >
              <Ionicons name="pencil-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.editText, { color: colors.textMuted }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          {[
            { label: 'Premises Name', value: premiseName },
            { label: 'Profession',    value: profession },
            { label: 'Email',         value: user?.email ?? 'demo@medilink.com' },
            { label: 'Phone',         value: user?.phone || '+234 — not set' },
          ].map((item, i) => (
            <View key={item.label}>
              <View style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{item.label}</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Verification progress */}
        {tierNum < 3 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: `${colors.sage}18` }]}>
                <Ionicons name="ribbon-outline" size={20} color={colors.sage} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Verification</Text>
            </View>
            <View style={styles.tierRow}>
              {[1, 2, 3].map(t => {
                const done = t <= tierNum
                return (
                  <View key={t} style={styles.tierStep}>
                    <View style={[styles.tierNode, { backgroundColor: done ? colors.sage : colors.border }]}>
                      {done
                        ? <Ionicons name="checkmark" size={14} color="#fff" />
                        : <Text style={[styles.tierNum, { color: colors.textMuted }]}>{t}</Text>
                      }
                    </View>
                    <Text style={[styles.tierLabel, { color: done ? colors.sage : colors.textMuted }]}>
                      Level {t}
                    </Text>
                    {t < 3 && <View style={[styles.tierLine, { backgroundColor: done ? `${colors.sage}50` : colors.border }]} />}
                  </View>
                )
              })}
            </View>
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.textPrimary, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleSubmitVerification}
              disabled={submitting || verLevel === 'PENDING'}
            >
              {submitting
                ? <ActivityIndicator size="small" color={colors.sage} />
                : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={17} color={colors.sage} />
                    <Text style={[styles.upgradeText, { color: colors.sage }]}>
                      {verLevel === 'PENDING' ? 'Pending Review' : `Submit for Verification`}
                    </Text>
                  </>
                )
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Account links */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT</Text>
          <LinkRow icon="settings-outline"     label="Settings"       sublabel="Notifications, security, account" onPress={() => router.push('/settings')} colors={colors} />
          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
          <LinkRow icon="help-circle-outline"  label="Help & Support"  onPress={() => {}} colors={colors} />
          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
          <LinkRow icon="star-outline"         label="Rate Medi_LinK"  onPress={() => {}} colors={colors} />
        </View>

        {/* Logout */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinkRow icon="log-out-outline" label="Log Out" onPress={handleLogout} danger colors={colors} />
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  settingsBtn: {
    width: 46, height: 46, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 20 },

  hero: {
    alignItems: 'center', paddingTop: 8, paddingBottom: 28,
    borderRadius: 24, marginBottom: 20, gap: 10,
  },
  name:       { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginTop: 8 },
  profession: { fontSize: 16 },
  verBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  verLabel: { fontSize: 14, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },

  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  editChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  editText: { fontSize: 13, fontWeight: '500' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  tierRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  tierStep: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  tierNode: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  tierNum:   { fontSize: 14, fontWeight: '700' },
  tierLabel: { position: 'absolute', bottom: -20, left: 0, fontSize: 11, fontWeight: '600' },
  tierLine:  { flex: 1, height: 2, borderRadius: 1 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 14, marginTop: 16,
  },
  upgradeText: { fontSize: 16, fontWeight: '700' },

  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  rowDivider:   { height: 1, marginHorizontal: -4 },
})
