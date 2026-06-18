import { useState, useEffect, useRef } from 'react'
import { Text, StyleSheet, Animated } from 'react-native'
import { Redirect } from 'expo-router'
import { useTheme } from '../constants/theme'
import { useAuthStore } from '../store/auth.store'
import { Logo } from '../components/ui/Logo'

function AnimatedIntro({ onFinish }: { onFinish: () => void }) {
  const { colors } = useTheme()

  const containerOpacity = useRef(new Animated.Value(1)).current
  const capsuleScale = useRef(new Animated.Value(0.6)).current
  const capsuleOpacity = useRef(new Animated.Value(0)).current
  const wordmarkOpacity = useRef(new Animated.Value(0)).current
  const wordmarkY = useRef(new Animated.Value(10)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const pulseScale = useRef(new Animated.Value(0.9)).current
  const pulseOpacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, { toValue: 2.2, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start()

    Animated.sequence([
      Animated.parallel([
        Animated.spring(capsuleScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(capsuleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(wordmarkY, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(containerOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start(() => onFinish())
  }, [])

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: containerOpacity }]}>
      <Animated.View style={[styles.pulse, {
        borderColor: colors.sage,
        transform: [{ scale: pulseScale }],
        opacity: pulseOpacity,
      }]} />

      <Animated.View style={{
        transform: [{ scale: capsuleScale }],
        opacity: capsuleOpacity,
      }}>
        <Logo size={120} />
      </Animated.View>

      <Animated.View style={{ opacity: wordmarkOpacity, transform: [{ translateY: wordmarkY }] }}>
        <Text style={[styles.wordmark, { color: colors.textPrimary }]}>MEDI_LINK</Text>
      </Animated.View>

      <Animated.View style={{ opacity: taglineOpacity }}>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>Healthcare Intelligence Platform</Text>
      </Animated.View>
    </Animated.View>
  )
}

export default function Index() {
  const [showIntro, setShowIntro] = useState(true)
  const { isAuthenticated } = useAuthStore()

  if (showIntro) return <AnimatedIntro onFinish={() => setShowIntro(false)} />
  if (!isAuthenticated) return <Redirect href="/(auth)/onboarding" />
  return <Redirect href="/(tabs)/dashboard" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pulse: {
    position: 'absolute',
    width: 96,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 6,
    marginTop: 2,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
