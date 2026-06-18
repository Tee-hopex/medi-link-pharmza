import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../constants/theme'
import { Logo } from '../../components/ui/Logo'

function PulsingCheckmark({ colors }: { colors: any }) {
  const p1s = useRef(new Animated.Value(1)).current
  const p1o = useRef(new Animated.Value(0.5)).current
  const p2s = useRef(new Animated.Value(1)).current
  const p2o = useRef(new Animated.Value(0.4)).current
  const circleScale = useRef(new Animated.Value(0.5)).current
  const circleOpacity = useRef(new Animated.Value(0)).current
  const iconOpacity = useRef(new Animated.Value(0)).current
  const iconScale = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.timing(p1s, { toValue: 1.5, duration: 1800, useNativeDriver: true }),
      Animated.timing(p1o, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ])).start()
    Animated.loop(Animated.parallel([
      Animated.timing(p2s, { toValue: 1.3, duration: 1800, delay: 300, useNativeDriver: true }),
      Animated.timing(p2o, { toValue: 0, duration: 1800, delay: 300, useNativeDriver: true }),
    ])).start()

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(circleScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(circleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.delay(120),
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  return (
    <View style={styles.checkmarkContainer}>
      <Animated.View style={[styles.ringOuter, { borderColor: colors.sage, transform: [{ scale: p1s }], opacity: p1o }]} />
      <Animated.View style={[styles.ringMiddle, { borderColor: colors.teal, transform: [{ scale: p2s }], opacity: p2o }]} />
      <Animated.View style={{ transform: [{ scale: circleScale }], opacity: circleOpacity }}>
        <LinearGradient colors={[colors.sage, colors.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.checkCircle}>
          <Animated.View style={{ transform: [{ scale: iconScale }], opacity: iconOpacity }}>
            <Ionicons name="checkmark" size={34} color="#FFFFFF" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  )
}

export default function VerifyLicense() {
  const router = useRouter()
  const { colors } = useTheme()

  const textAnim = useRef(new Animated.Value(0)).current
  const nextBlockAnim = useRef(new Animated.Value(0)).current
  const footerAnim = useRef(new Animated.Value(0)).current
  const statusAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(textAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(nextBlockAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.stagger(150, statusAnims.map(a =>
        Animated.timing(a, { toValue: 1, duration: 360, useNativeDriver: true })
      )),
      Animated.timing(footerAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start()
  }, [])

  const statusItems = [
    { icon: 'shield-checkmark-outline' as const, text: 'License cross-checked with the regulatory body' },
    { icon: 'notifications-outline' as const, text: 'Push notification sent when verification is complete' },
    { icon: 'lock-open-outline' as const, text: 'Full platform access unlocks at Level 2' },
  ]

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Logo size={44} />
        <Text style={[styles.logoText, { color: colors.textPrimary }]}>MEDI_LINK</Text>
      </View>

      <View style={styles.content}>
        <PulsingCheckmark colors={colors} />

        <Animated.View style={[styles.textBlock, {
          opacity: textAnim,
          transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Account Created!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your account is live. License verification confirmed within{' '}
            <Text style={{ fontWeight: '600', color: colors.textPrimary }}>24 hours</Text>.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.nextBlock, {
          backgroundColor: colors.surface, borderColor: colors.border,
          opacity: nextBlockAnim,
          transform: [{ translateY: nextBlockAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }]}>
          <Text style={[styles.nextTitle, { color: colors.textMuted }]}>What happens next</Text>
          {statusItems.map((item, i) => (
            <Animated.View key={i} style={[styles.statusRow, {
              opacity: statusAnims[i],
              transform: [{ translateX: statusAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
            }]}>
              <Ionicons name={item.icon} size={17} color={colors.sage} style={{ marginTop: 1 }} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>{item.text}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, {
        opacity: footerAnim,
        transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.88}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace('/(tabs)/dashboard') }}>
          <LinearGradient
            colors={[colors.buttonPrimaryBg, colors.buttonPrimaryBg]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaText, { color: colors.buttonPrimaryText }]}>Go to Dashboard</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          You can use Medi_LinK while verification is in progress
        </Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingTop: 60, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 15, fontWeight: '700', letterSpacing: 3 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 32 },
  checkmarkContainer: { alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  ringOuter: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1.5 },
  ringMiddle: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 1.5 },
  checkCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  textBlock: { alignItems: 'center', gap: 12 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 17, textAlign: 'center', lineHeight: 26 },
  nextBlock: { width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, gap: 14 },
  nextTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  statusRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  statusText: { flex: 1, fontSize: 16, lineHeight: 23 },
  footer: { paddingHorizontal: 24, paddingBottom: 48, gap: 16, alignItems: 'center' },
  ctaBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  ctaGradient: { height: 58, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 18, fontWeight: '600', letterSpacing: 0.3 },
  footerNote: { fontSize: 15, textAlign: 'center' },
})
