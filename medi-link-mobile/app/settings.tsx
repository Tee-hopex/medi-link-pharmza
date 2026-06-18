import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../constants/theme'
import { useAuthStore } from '../store/auth.store'
import { useSettingsStore, ThemeMode } from '../store/settings.store'

// ─── Custom Toggle ────────────────────────────────────────────────────────────

function Toggle({ value, onValueChange, colors }: { value: boolean; onValueChange: (v: boolean) => void; colors: any }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, tension: 200, friction: 18, useNativeDriver: false }).start()
  }, [value])

  const bg     = anim.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.sage] })
  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] })

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onValueChange(!value) }}
    >
      <Animated.View style={[tog.track, { backgroundColor: bg }]}>
        <Animated.View style={[tog.thumb, { transform: [{ translateX: thumbX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  )
}

const tog = StyleSheet.create({
  track: { width: 46, height: 26, borderRadius: 13, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
})

// ─── Setting row variants ─────────────────────────────────────────────────────

function ToggleRow({ icon, label, sublabel, value, onValueChange, colors, isLast }: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  sublabel?: string
  value: boolean
  onValueChange: (v: boolean) => void
  colors: any
  isLast?: boolean
}) {
  return (
    <View style={[row.wrap, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[row.iconWrap, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[row.label, { color: colors.textPrimary }]}>{label}</Text>
        {sublabel && <Text style={[row.sub, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
      <Toggle value={value} onValueChange={onValueChange} colors={colors} />
    </View>
  )
}

function ArrowRow({ icon, label, sublabel, onPress, danger, colors, isLast }: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  sublabel?: string
  onPress: () => void
  danger?: boolean
  colors: any
  isLast?: boolean
}) {
  const scale = useRef(new Animated.Value(1)).current
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress() }}
    >
      <Animated.View style={[
        row.wrap,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        { transform: [{ scale }] },
      ]}>
        <View style={[row.iconWrap, { backgroundColor: danger ? `${colors.error}14` : colors.background }]}>
          <Ionicons name={icon} size={20} color={danger ? colors.error : colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[row.label, { color: danger ? colors.error : colors.textPrimary }]}>{label}</Text>
          {sublabel && <Text style={[row.sub, { color: colors.textMuted }]}>{sublabel}</Text>}
        </View>
        {!danger && <Ionicons name="chevron-forward" size={17} color={colors.border} />}
      </Animated.View>
    </TouchableOpacity>
  )
}

const row = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  iconWrap:{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 16, fontWeight: '500' },
  sub:     { fontSize: 13, marginTop: 2 },
})

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={sec.block}>
      <Text style={[sec.title, { color: colors.textMuted }]}>{title}</Text>
      <View style={[sec.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  )
}

const sec = StyleSheet.create({
  block: { marginBottom: 8 },
  title: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  card:  { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { logout } = useAuthStore()

  const [expiryAlerts,  setExpiryAlerts]  = useState(true)
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [orderUpdates,  setOrderUpdates]  = useState(true)
  const [emergencyBlasts, setEmergencyBlasts] = useState(true)
  const [marketListings, setMarketListings] = useState(false)
  const [biometricLogin, setBiometricLogin] = useState(false)

  const { themeMode, setThemeMode } = useSettingsStore()

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
  }, [])

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    logout()
  }

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
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Appearance */}
        <Section title="APPEARANCE" colors={colors}>
          <View style={[app_.row, { paddingHorizontal: 16, paddingVertical: 16 }]}>
            <View style={[app_.iconWrap, { backgroundColor: colors.background }]}>
              <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[app_.label, { color: colors.textPrimary }]}>Theme</Text>
              <Text style={[app_.sub, { color: colors.textMuted }]}>Controls app appearance</Text>
            </View>
          </View>
          <View style={[app_.chipRow, { paddingHorizontal: 16, paddingBottom: 16 }]}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map(mode => {
              const active = themeMode === mode
              const label  = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'
              const icon: React.ComponentProps<typeof Ionicons>['name'] =
                mode === 'system' ? 'phone-portrait-outline' :
                mode === 'light'  ? 'sunny-outline' :
                'moon-outline'
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    app_.chip,
                    {
                      backgroundColor: active ? colors.textPrimary : colors.background,
                      borderColor:     active ? colors.textPrimary : colors.border,
                      flex: 1,
                    },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setThemeMode(mode) }}
                >
                  <Ionicons name={icon} size={16} color={active ? colors.sage : colors.textMuted} />
                  <Text style={[app_.chipText, { color: active ? colors.sage : colors.textMuted }]}>{label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Section>

        {/* Notifications */}
        <Section title="NOTIFICATIONS" colors={colors}>
          <ToggleRow
            icon="alarm-outline"
            label="Expiry Alerts"
            sublabel="30, 14, 7 and 1-day warnings"
            value={expiryAlerts}
            onValueChange={setExpiryAlerts}
            colors={colors}
          />
          <ToggleRow
            icon="cube-outline"
            label="Low Stock Alerts"
            sublabel="When stock drops below reorder level"
            value={lowStockAlerts}
            onValueChange={setLowStockAlerts}
            colors={colors}
          />
          <ToggleRow
            icon="receipt-outline"
            label="Order Updates"
            sublabel="Confirmations, dispatch, delivery"
            value={orderUpdates}
            onValueChange={setOrderUpdates}
            colors={colors}
          />
          <ToggleRow
            icon="flash-outline"
            label="Emergency Blasts"
            sublabel="Receive EmergencyRx requests from nearby hospitals"
            value={emergencyBlasts}
            onValueChange={setEmergencyBlasts}
            colors={colors}
          />
          <ToggleRow
            icon="storefront-outline"
            label="Marketplace Listings"
            sublabel="New listings near you"
            value={marketListings}
            onValueChange={setMarketListings}
            colors={colors}
            isLast
          />
        </Section>

        {/* Security */}
        <Section title="SECURITY" colors={colors}>
          <ArrowRow
            icon="lock-closed-outline"
            label="Change Password"
            sublabel="Last changed more than 90 days ago"
            onPress={() => {}}
            colors={colors}
          />
          <ToggleRow
            icon="finger-print-outline"
            label="Biometric Login"
            sublabel="Use Face ID or fingerprint to sign in"
            value={biometricLogin}
            onValueChange={setBiometricLogin}
            colors={colors}
            isLast
          />
        </Section>

        {/* Account */}
        <Section title="ACCOUNT" colors={colors}>
          <ArrowRow
            icon="person-outline"
            label="Edit Profile"
            sublabel="Name, phone, profession"
            onPress={() => {}}
            colors={colors}
          />
          <ArrowRow
            icon="business-outline"
            label="Pharmacy Details"
            sublabel="Premises name, address, license"
            onPress={() => {}}
            colors={colors}
          />
          <ArrowRow
            icon="document-text-outline"
            label="Verification Documents"
            sublabel="Upload or update license documents"
            onPress={() => {}}
            colors={colors}
          />
          <ArrowRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
            colors={colors}
          />
          <ArrowRow
            icon="star-outline"
            label="Rate Medi_LinK"
            sublabel="Tell us what you think"
            onPress={() => {}}
            colors={colors}
            isLast
          />
        </Section>

        {/* App info */}
        <Section title="APP" colors={colors}>
          <View style={[row.wrap, { paddingVertical: 12 }]}>
            <View style={[row.iconWrap, { backgroundColor: colors.background }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[row.label, { color: colors.textPrimary }]}>Medi_LinK</Text>
              <Text style={[row.sub, { color: colors.textMuted }]}>Version 0.1.0 — Beta</Text>
            </View>
          </View>
        </Section>

        {/* Danger zone */}
        <Section title="DANGER ZONE" colors={colors}>
          <ArrowRow
            icon="log-out-outline"
            label="Log Out"
            onPress={handleLogout}
            danger
            colors={colors}
          />
          <ArrowRow
            icon="trash-outline"
            label="Delete Account"
            sublabel="Permanently remove all your data"
            onPress={() => {}}
            danger
            colors={colors}
            isLast
          />
        </Section>
      </ScrollView>
    </View>
  )
}

// ─── Appearance section styles ────────────────────────────────────────────────

const app_ = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: 16, fontWeight: '500' },
  sub:      { fontSize: 13, marginTop: 2 },
  chipRow:  { flexDirection: 'row', gap: 8 },
  chip:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontWeight: '600' },
})

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },

  scroll: { padding: 20, paddingTop: 24 },
})
