import { useRef } from 'react'
import { Pressable, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../constants/theme'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  disabled?: boolean
  style?: object
}

export function Button({
  label, onPress, variant = 'primary',
  loading = false, disabled = false, style,
}: ButtonProps) {
  const { colors } = useTheme()
  const scale = useRef(new Animated.Value(1)).current

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, tension: 300, friction: 10, useNativeDriver: true }).start()
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start()

  const bgColor =
    variant === 'primary' ? colors.buttonPrimaryBg :
    variant === 'secondary' ? colors.surface : 'transparent'

  const textColor =
    variant === 'primary' ? colors.buttonPrimaryText :
    variant === 'secondary' ? colors.textPrimary :
    colors.textSecondary

  const borderStyle = variant === 'secondary'
    ? { borderWidth: 1.5, borderColor: colors.border }
    : {}

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() => {
        if (disabled || loading) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      disabled={disabled || loading}
    >
      <Animated.View style={[
        styles.base,
        { backgroundColor: bgColor },
        borderStyle,
        (disabled || loading) && styles.disabled,
        { transform: [{ scale }] },
        style,
      ]}>
        {loading
          ? <ActivityIndicator color={textColor} size="small" />
          : <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        }
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  disabled: { opacity: 0.4 },
  label: { fontSize: 18, fontWeight: '600', letterSpacing: 0.3 },
})
