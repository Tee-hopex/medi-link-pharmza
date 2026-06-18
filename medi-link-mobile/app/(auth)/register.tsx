import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../constants/theme'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore, UserRole } from '../../store/auth.store'
import { ProfessionPicker } from '../../components/ui/ProfessionPicker'
import { api } from '../../lib/api'

const STEPS = ['Details', 'Premise', 'Verify']
const PREMISE_TYPES = ['Pharmacy', 'Hospital', 'Clinic', 'Warehouse', 'Distributor']

const PREMISE_TYPE_MAP: Record<string, string> = {
  Pharmacy:    'COMMUNITY_PHARMACY',
  Hospital:    'HOSPITAL_PHARMACY',
  Clinic:      'HEALTHCARE_FACILITY',
  Warehouse:   'DISTRIBUTOR',
  Distributor: 'DISTRIBUTOR',
}

function getLicenseLabel(profession: string, role: UserRole): string {
  const p = profession.trim().toLowerCase()
  if (p.includes('pharmacist'))                   return 'PCN License Number'
  if (p.includes('doctor') || p.includes('physician')) return 'MDCN Registration Number'
  if (p.includes('nurse'))                        return 'NMCN Registration Number'
  if (p.includes('lab') || p.includes('scientist')) return 'MLSCN License Number'
  if (role === 'NON_MEDICAL')                     return 'NAFDAC / Business Registration Number'
  if (role === 'PATIENT')                         return 'National ID / Passport Number'
  return 'Professional License / Registration Number'
}

export default function Register() {
  const router = useRouter()
  const { colors } = useTheme()
  const { pendingRole, login } = useAuthStore()
  const role = pendingRole ?? 'MEDICAL'

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const stepAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(33)).current

  // Step 1 — Details
  const [profession, setProfession]   = useState('')
  const [specialty, setSpecialty]     = useState('')
  const [firstName, setFirstName]     = useState('')
  const [lastName, setLastName]       = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [password, setPassword]       = useState('')

  // Step 2 — Premise
  const [premiseName, setPremiseName] = useState('')
  const [premiseType, setPremiseType] = useState('')
  const [city, setCity]               = useState('')
  const [state, setState]             = useState('')

  // Step 3 — License
  const [licenseNumber, setLicenseNumber] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: ((step + 1) / STEPS.length) * 100,
      duration: 380, useNativeDriver: false,
    }).start()
  }, [step])

  const transitionToStep = (newStep: number) => {
    Animated.timing(stepAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(newStep)
      Animated.timing(stepAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start()
    })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 0) {
      if (role !== 'PATIENT' && !profession) e.profession = 'Required'
      if (!firstName) e.firstName = 'Required'
      if (!lastName)  e.lastName  = 'Required'
      if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = 'Valid email required'
      if (!phone || phone.length < 10)  e.phone    = 'Valid phone required'
      if (!password || password.length < 6) e.password = 'Min 6 characters'
    }
    if (step === 1) {
      if (!premiseName) e.premiseName = 'Required'
      if (!premiseType) e.premiseType = 'Select a type'
      if (!city)        e.city        = 'Required'
      if (!state)       e.state       = 'Required'
    }
    if (step === 2) {
      if (!licenseNumber) e.licenseNumber = 'Required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (!validate()) return

    if (step < 2) {
      transitionToStep(step + 1)
      return
    }

    // Final step — call the API
    setLoading(true)
    setApiError('')
    try {
      const { data } = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        profession: role !== 'PATIENT' ? profession : undefined,
        specialty: role !== 'PATIENT' && specialty ? specialty : undefined,
        facilityName: premiseName || undefined,
        facilityType: premiseType ? PREMISE_TYPE_MAP[premiseType] : undefined,
        facilityCity: city || undefined,
        facilityState: state || undefined,
        licenseNumber: licenseNumber || undefined,
      })
      const { accessToken, refreshToken, user } = data.data
      await login(accessToken, refreshToken, user)
      router.push('/(auth)/verify-license')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
        ?? 'Registration failed. Please try again.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  const clearError = (k: string) => setErrors(e => ({ ...e, [k]: '' }))
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>

        {/* Progress header */}
        <View style={styles.header}>
          {step > 0 && (
            <TouchableOpacity onPress={() => { transitionToStep(step - 1); setErrors({}) }} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.sage }]} />
          </View>
          <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            pointerEvents="box-none"
            style={{
              opacity: stepAnim,
              transform: [{ translateX: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }}
          >
            {step === 0 && (
              <Step1
                colors={colors} errors={errors} clearError={clearError}
                role={role}
                profession={profession} setProfession={setProfession}
                specialty={specialty}   setSpecialty={setSpecialty}
                firstName={firstName}   setFirstName={setFirstName}
                lastName={lastName}     setLastName={setLastName}
                email={email}           setEmail={setEmail}
                phone={phone}           setPhone={setPhone}
                password={password}     setPassword={setPassword}
              />
            )}
            {step === 1 && (
              <Step2
                colors={colors} errors={errors} clearError={clearError}
                premiseName={premiseName} setPremiseName={setPremiseName}
                premiseType={premiseType} setPremiseType={setPremiseType}
                city={city} setCity={setCity}
                state={state} setState={setState}
              />
            )}
            {step === 2 && (
              <Step3
                colors={colors} errors={errors} clearError={clearError}
                licenseNumber={licenseNumber} setLicenseNumber={setLicenseNumber}
                licenseLabel={getLicenseLabel(profession, role)}
              />
            )}
          </Animated.View>

          <View style={styles.footer}>
            {!!apiError && (
              <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: '#F87171' }]}>
                <Text style={styles.errorText}>{apiError}</Text>
              </View>
            )}
            <Button
              label={step < 2 ? 'Continue' : 'Create Account'}
              onPress={goNext}
              loading={loading}
              style={{ width: '100%' }}
            />
            {step === 0 && (
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
                <Text style={[styles.loginLinkText, { color: colors.textMuted }]}>
                  Already have an account?{' '}
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Step 1: Personal Details ─────────────────────────────────────────────────

function Step1({ colors, errors, clearError, role, profession, setProfession, specialty, setSpecialty,
  firstName, setFirstName, lastName, setLastName, email, setEmail,
  phone, setPhone, password, setPassword }: any) {

  const isPatient = role === 'PATIENT'
  const professionPlaceholder = role === 'MEDICAL'
    ? 'e.g. Doctor, Pharmacist, Nurse'
    : 'e.g. Wholesaler, Hospital Admin'

  return (
    <View style={styles.stepInner}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Personal details</Text>
      <Text style={[styles.stepSub,   { color: colors.textSecondary }]}>
        {isPatient ? "Tell us a bit about yourself" : "Start with your professional role"}
      </Text>

      <View style={styles.fieldGroup}>
        {/* Professional fields — hidden for patients */}
        {!isPatient && (
          <>
            <ProfessionPicker
              label="Your profession"
              value={profession}
              onChange={v => { setProfession(v); clearError('profession') }}
              role={role}
              error={errors.profession}
            />
            <Input
              label="Area of specialty (optional)"
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="e.g. Neurosurgery, Cardiology, Oncology"
              autoCapitalize="words"
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </>
        )}

        {/* Name row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input label="First name" value={firstName}
              onChangeText={v => { setFirstName(v); clearError('firstName') }}
              placeholder="Ada" autoCapitalize="words" error={errors.firstName} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Last name" value={lastName}
              onChangeText={v => { setLastName(v); clearError('lastName') }}
              placeholder="Okonkwo" autoCapitalize="words" error={errors.lastName} />
          </View>
        </View>

        <Input label="Email address" value={email}
          onChangeText={v => { setEmail(v); clearError('email') }}
          placeholder="you@example.com" keyboardType="email-address" error={errors.email} />

        <Input label="Phone number" value={phone}
          onChangeText={v => { setPhone(v); clearError('phone') }}
          placeholder="+234 800 000 0000" keyboardType="phone-pad" error={errors.phone} />

        <Input label="Password" value={password}
          onChangeText={v => { setPassword(v); clearError('password') }}
          placeholder="Min 6 characters" secureTextEntry error={errors.password} />
      </View>
    </View>
  )
}

// ─── Step 2: Premise ──────────────────────────────────────────────────────────

function Step2({ colors, errors, clearError, premiseName, setPremiseName, premiseType,
  setPremiseType, city, setCity, state, setState }: any) {
  return (
    <View style={styles.stepInner}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Your premise</Text>
      <Text style={[styles.stepSub,   { color: colors.textSecondary }]}>Tell us about your pharmacy or facility</Text>
      <View style={styles.fieldGroup}>
        <Input
          label="Premise / Facility name" value={premiseName}
          onChangeText={v => { setPremiseName(v); clearError('premiseName') }}
          placeholder="Lagos Central Pharmacy" autoCapitalize="words" error={errors.premiseName}
        />
        <View>
          <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Premise type</Text>
          <View style={styles.chipRow}>
            {PREMISE_TYPES.map(t => {
              const isSelected = premiseType === t
              return (
                <TouchableOpacity key={t} onPress={() => { setPremiseType(t); clearError('premiseType') }}>
                  <View style={[
                    styles.chip,
                    {
                      borderColor:     isSelected ? colors.cardSelectedBg : colors.border,
                      backgroundColor: isSelected ? colors.cardSelectedBg : colors.surface,
                    },
                  ]}>
                    <Text style={[styles.chipText, { color: isSelected ? colors.cardSelectedText : colors.textPrimary }]}>
                      {t}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
          {!!errors.premiseType && (
            <Text style={[styles.chipError, { color: colors.error }]}>{errors.premiseType}</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input label="City" value={city}
              onChangeText={v => { setCity(v); clearError('city') }}
              placeholder="Lagos" autoCapitalize="words" error={errors.city} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="State" value={state}
              onChangeText={v => { setState(v); clearError('state') }}
              placeholder="Lagos" autoCapitalize="words" error={errors.state} />
          </View>
        </View>
      </View>
    </View>
  )
}

// ─── Step 3: License ──────────────────────────────────────────────────────────

function Step3({ colors, errors, clearError, licenseNumber, setLicenseNumber, licenseLabel }: any) {
  return (
    <View style={styles.stepInner}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>License & verification</Text>
      <Text style={[styles.stepSub,   { color: colors.textSecondary }]}>Verified within 24 hours after sign up</Text>
      <View style={styles.fieldGroup}>
        <Input
          label={licenseLabel}
          value={licenseNumber}
          onChangeText={v => { setLicenseNumber(v); clearError('licenseNumber') }}
          placeholder="e.g. PCN/PH/001234"
          autoCapitalize="characters"
          error={errors.licenseNumber}
        />
        <View style={[styles.verifyNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
          <Text style={[styles.verifyNoteText, { color: colors.textSecondary, flex: 1 }]}>
            Your license is cross-checked with the regulatory body. Document upload available after sign up.
          </Text>
        </View>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8, gap: 12 },
  backBtn:      { alignSelf: 'flex-start' },
  backText:     { fontSize: 17, fontWeight: '500' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  stepLabel:    { fontSize: 14, fontWeight: '500', letterSpacing: 0.3 },
  content:      { padding: 24, paddingBottom: 48 },
  stepInner:    { gap: 24 },
  stepTitle:    { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  stepSub:      { fontSize: 16, lineHeight: 22, marginTop: -16 },
  fieldGroup:   { gap: 20 },
  divider:      { height: 1, marginVertical: 4 },
  pickerLabel:  { fontSize: 15, fontWeight: '500', marginBottom: 10, letterSpacing: 0.2 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, borderWidth: 1.5 },
  chipText:     { fontSize: 15, fontWeight: '500' },
  chipError:    { fontSize: 13, marginTop: 6 },
  verifyNote:   { borderRadius: 12, padding: 16, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  verifyNoteText: { fontSize: 15, lineHeight: 22 },
  footer:       { marginTop: 36, gap: 16 },
  loginLink:    { alignItems: 'center' },
  loginLinkText: { fontSize: 16 },
  errorBox:     { borderWidth: 1, borderRadius: 12, padding: 14 },
  errorText:    { fontSize: 14, color: '#EF4444', lineHeight: 20 },
})
