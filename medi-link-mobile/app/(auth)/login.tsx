import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../constants/theme'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Logo } from '../../components/ui/Logo'
import { useAuthStore } from '../../store/auth.store'
import { api } from '../../lib/api'

export default function Login() {
  const router = useRouter()
  const { colors } = useTheme()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' })

  const anims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current

  useEffect(() => {
    Animated.stagger(80, anims.map((a) =>
      Animated.timing(a, { toValue: 1, duration: 380, useNativeDriver: true }),
    )).start()
  }, [])

  const fadeIn = (i: number) => ({
    opacity: anims[i],
    transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  })

  const validate = () => {
    const e = { email: '', password: '' }
    if (!email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    setFieldErrors(e)
    return !e.email && !e.password
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken, user } = data.data
      await login(accessToken, refreshToken, user)
      // Routing is handled by index.tsx reacting to isAuthenticated
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Login failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand mark */}
        <Animated.View style={[styles.brandRow, fadeIn(0)]}>
          <Logo size={44} />
          <Text style={[styles.brandName, { color: colors.textPrimary }]}>PHARVA</Text>
        </Animated.View>

        <Animated.View style={[styles.headingBlock, fadeIn(1)]}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>Sign in to your account</Text>
        </Animated.View>

        <Animated.View style={[styles.form, fadeIn(2)]}>
          <Input
            label="Email address"
            value={email}
            onChangeText={(v) => { setEmail(v); setFieldErrors((e) => ({ ...e, email: '' })); setError('') }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldErrors.email}
            returnKeyType="next"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); setFieldErrors((e) => ({ ...e, password: '' })); setError('') }}
            placeholder="Enter your password"
            secureTextEntry
            error={fieldErrors.password}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => {}} style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: colors.textSecondary }]}>Forgot password?</Text>
          </TouchableOpacity>
        </Animated.View>

        {!!error && (
          <Animated.View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: '#F87171' }, fadeIn(3)]}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        <Animated.View style={[{ marginTop: 28, marginBottom: 24 }, fadeIn(3)]}>
          <Button label="Sign In" onPress={handleLogin} loading={loading} style={{ width: '100%' }} />
        </Animated.View>

        <Animated.View style={[styles.dividerRow, fadeIn(4)]}>
          <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
        </Animated.View>

        <Animated.View style={[{ marginBottom: 40 }, fadeIn(4)]}>
          <Button
            label="Create an account"
            variant="secondary"
            onPress={() => router.push('/(auth)/role-select')}
            style={{ width: '100%' }}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 28, paddingTop: 68 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40 },
  brandName: { fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  headingBlock: { gap: 6, marginBottom: 32 },
  heading: { fontSize: 32, fontWeight: '700', letterSpacing: -0.3 },
  subheading: { fontSize: 17 },
  form: { gap: 20, marginBottom: 12 },
  forgotRow: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 15, fontWeight: '500' },
  errorBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 4 },
  errorText: { fontSize: 14, color: '#EF4444', lineHeight: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 15 },
})
