import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../constants/theme'
import { Button } from '../../components/ui/Button'
import { useAuthStore, UserRole } from '../../store/auth.store'

type IconName = React.ComponentProps<typeof Ionicons>['name']

const ROLES: {
  role: UserRole
  title: string
  subtitle: string
  examples: string
  icon: IconName
}[] = [
  {
    role: 'MEDICAL',
    title: 'Medical Personnel',
    subtitle: 'Healthcare professionals in clinical or pharmacy practice',
    examples: 'Doctor · Pharmacist · Nurse · Lab Scientist · Radiologist',
    icon: 'pulse-outline',
  },
  {
    role: 'NON_MEDICAL',
    title: 'Non-Medical Personnel',
    subtitle: 'Supporting the healthcare supply chain and administration',
    examples: 'Wholesaler · Distributor · Hospital Admin · Warehouse Manager',
    icon: 'briefcase-outline',
  },
  {
    role: 'PATIENT',
    title: 'Patient',
    subtitle: 'Track medications, request refills, find nearby pharmacies',
    examples: 'Personal use · Caregiver · Family health management',
    icon: 'person-outline',
  },
]

function RoleCard({
  item, index, selected, onSelect, colors,
}: {
  item: typeof ROLES[0]; index: number; selected: boolean; onSelect: () => void; colors: any
}) {
  const enterAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.spring(enterAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start()
  }, [])

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.015 : 1,
      tension: 120, friction: 10, useNativeDriver: true,
    }).start()
  }, [selected])

  return (
    <Animated.View style={{
      opacity: enterAnim,
      transform: [
        { translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
        { scale: scaleAnim },
      ],
    }}>
      <TouchableOpacity onPress={onSelect} activeOpacity={0.85}>
        <View style={[
          styles.card,
          {
            backgroundColor: selected ? colors.sage : colors.surface,
            borderColor:     selected ? colors.sage : colors.border,
          },
        ]}>
          <View style={[
            styles.iconWrap,
            { backgroundColor: selected ? 'rgba(255,255,255,0.18)' : colors.background },
          ]}>
            <Ionicons
              name={item.icon}
              size={24}
              color={selected ? '#FFFFFF' : colors.textSecondary}
            />
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: selected ? '#FFFFFF' : colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: selected ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
              {item.subtitle}
            </Text>
            <Text style={[styles.cardExamples, { color: selected ? 'rgba(255,255,255,0.45)' : colors.textMuted }]}>
              {item.examples}
            </Text>
          </View>

          {selected && (
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={16} color={colors.sage} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function RoleSelect() {
  const router = useRouter()
  const { colors } = useTheme()
  const { setPendingRole } = useAuthStore()
  const [selected, setSelected] = useState<UserRole | null>(null)

  const headerAnim = useRef(new Animated.Value(0)).current
  const footerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start()
  }, [])

  useEffect(() => {
    Animated.spring(footerAnim, {
      toValue: selected ? 1 : 0,
      tension: 60, friction: 12, useNativeDriver: true,
    }).start()
  }, [selected])

  const handleSelect = (role: UserRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSelected(role)
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>I am a…</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose your category — you'll fill in your exact role next
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.cards}
        showsVerticalScrollIndicator={false}
      >
        {ROLES.map((item, index) => (
          <RoleCard
            key={item.role}
            item={item}
            index={index}
            colors={colors}
            selected={selected === item.role}
            onSelect={() => handleSelect(item.role)}
          />
        ))}
      </ScrollView>

      <Animated.View style={[styles.footer, {
        opacity: footerAnim,
        transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        <Button
          label="Continue"
          onPress={() => {
            if (!selected) return
            setPendingRole(selected)
            router.push('/(auth)/register')
          }}
          disabled={!selected}
          style={{ width: '100%' }}
        />
      </Animated.View>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        style={styles.loginLink}
      >
        <Text style={[styles.loginText, { color: colors.textMuted }]}>
          Already have an account?{' '}
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 28, paddingTop: 64, paddingBottom: 20, gap: 8 },
  title:    { fontSize: 34, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 24 },

  cards: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 18, borderRadius: 20, borderWidth: 1.5, gap: 16,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  cardBody:     { flex: 1, gap: 4 },
  cardTitle:    { fontSize: 19, fontWeight: '700' },
  cardSubtitle: { fontSize: 15, lineHeight: 21 },
  cardExamples: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(187,236,202,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },

  footer:    { paddingHorizontal: 20, paddingBottom: 12 },
  loginLink: { alignItems: 'center', paddingBottom: 36, paddingTop: 12 },
  loginText: { fontSize: 16 },
})
