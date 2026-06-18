/**
 * Medi_LinK Notification System
 *
 * Three distinct patterns:
 *  1. Toast   — brief, non-blocking, auto-dismisses (bottom of screen)
 *  2. Modal   — important alerts requiring acknowledgement (centre overlay)
 *  3. Inline  — contextual banners embedded inside a screen's content
 */

import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant  = 'success' | 'warning' | 'error' | 'info'
export type ModalVariant  = 'alert' | 'confirm' | 'critical'
export type InlineVariant = 'info' | 'warning' | 'error' | 'success'

// ─── 1. TOAST ─────────────────────────────────────────────────────────────────
// Slides up from bottom, auto-dismisses after 3s, never blocks interaction.

interface ToastProps {
  visible: boolean
  variant: ToastVariant
  title: string
  message?: string
  onDismiss: () => void
  duration?: number
}

const TOAST_ICONS: Record<ToastVariant, React.ComponentProps<typeof Ionicons>['name']> = {
  success: 'checkmark-circle',
  warning: 'warning',
  error:   'close-circle',
  info:    'information-circle',
}

function toastColor(variant: ToastVariant, colors: any): string {
  switch (variant) {
    case 'success': return colors.sage
    case 'warning': return colors.warning
    case 'error':   return colors.error
    case 'info':    return colors.teal
  }
}

export function Toast({ visible, variant, title, message, onDismiss, duration = 3500 }: ToastProps) {
  const { colors } = useTheme()
  const insets  = useSafeAreaInsets()
  // Starts above resting position (off-screen top), drops down below the header
  const ty      = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current
  const accent  = toastColor(variant, colors)

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        variant === 'error'   ? Haptics.NotificationFeedbackType.Error
        : variant === 'warning' ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
      )
      Animated.parallel([
        Animated.spring(ty,      { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
      const t = setTimeout(() => dismiss(), duration)
      return () => clearTimeout(t)
    }
  }, [visible])

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(ty,      { toValue: -100, duration: 240, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 200, useNativeDriver: true }),
    ]).start(() => { ty.setValue(-100); opacity.setValue(0); onDismiss() })
  }

  // Sits just below the header / notification bell
  const topOffset = insets.top + 64

  if (!visible) return null

  return (
    <Animated.View style={[
      toast.container,
      { top: topOffset, backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.textPrimary },
      { transform: [{ translateY: ty }], opacity },
    ]}>
      <View style={[toast.accentBar, { backgroundColor: accent }]} />
      <View style={[toast.iconWrap, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={TOAST_ICONS[variant]} size={22} color={accent} />
      </View>
      <View style={toast.textBlock}>
        <Text style={[toast.title, { color: colors.textPrimary }]}>{title}</Text>
        {!!message && <Text style={[toast.message, { color: colors.textSecondary }]} numberOfLines={2}>{message}</Text>}
      </View>
      <TouchableOpacity onPress={dismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  )
}

const toast = StyleSheet.create({
  container: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    paddingRight: 16, paddingVertical: 14,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
    zIndex: 9999,
  },
  accentBar: { width: 4, alignSelf: 'stretch' },
  iconWrap:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textBlock: { flex: 1, gap: 2 },
  title:     { fontSize: 16, fontWeight: '700' },
  message:   { fontSize: 14, lineHeight: 19 },
})

// ─── 2. MODAL ALERT ───────────────────────────────────────────────────────────
// Centre-screen overlay for important actions that need user confirmation.

interface AlertModalProps {
  visible: boolean
  variant: ModalVariant
  title: string
  message: string
  primaryLabel?: string
  secondaryLabel?: string
  onPrimary: () => void
  onSecondary?: () => void
  onDismiss: () => void
}

const MODAL_ICONS: Record<ModalVariant, React.ComponentProps<typeof Ionicons>['name']> = {
  alert:    'warning-outline',
  confirm:  'help-circle-outline',
  critical: 'alert-circle-outline',
}

export function AlertModal({
  visible, variant, title, message,
  primaryLabel = 'Confirm', secondaryLabel = 'Cancel',
  onPrimary, onSecondary, onDismiss,
}: AlertModalProps) {
  const { colors } = useTheme()
  const scale   = useRef(new Animated.Value(0.88)).current
  const opacity = useRef(new Animated.Value(0)).current

  const accent = variant === 'critical' ? colors.error
    : variant === 'alert' ? colors.warning
    : colors.sage

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, tension: 65, friction: 12, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 0.88, tension: 65, friction: 12, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[mdl.backdrop, { opacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onDismiss} activeOpacity={1} />
        <Animated.View
          style={[mdl.card, { backgroundColor: colors.background, borderColor: colors.border, transform: [{ scale }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[mdl.iconCircle, { backgroundColor: `${accent}18` }]}>
            <Ionicons name={MODAL_ICONS[variant]} size={32} color={accent} />
          </View>
          <Text style={[mdl.title,   { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[mdl.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={mdl.btnRow}>
            {onSecondary && (
              <TouchableOpacity
                style={[mdl.btn, mdl.btnSecondary, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => { onDismiss(); onSecondary?.() }}
              >
                <Text style={[mdl.btnText, { color: colors.textSecondary }]}>{secondaryLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[mdl.btn, mdl.btnPrimary, { backgroundColor: variant === 'critical' ? colors.error : colors.textPrimary }]}
              onPress={() => { onDismiss(); onPrimary() }}
            >
              <Text style={[mdl.btnText, { color: variant === 'critical' ? '#fff' : colors.sage }]}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const mdl = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    width: '100%', borderRadius: 24, borderWidth: 1,
    padding: 28, alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
  },
  iconCircle: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title:   { fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  btnRow:  { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  btn:     { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnPrimary:   {},
  btnSecondary: { borderWidth: 1.5 },
  btnText: { fontSize: 16, fontWeight: '700' },
})

// ─── 3. INLINE BANNER ────────────────────────────────────────────────────────
// Embedded contextually in screen content. No overlay, dismissible.

interface InlineBannerProps {
  variant: InlineVariant
  title: string
  message?: string
  action?: { label: string; onPress: () => void }
  onDismiss?: () => void
  style?: object
}

const INLINE_ICONS: Record<InlineVariant, React.ComponentProps<typeof Ionicons>['name']> = {
  info:    'information-circle-outline',
  warning: 'warning-outline',
  error:   'alert-circle-outline',
  success: 'checkmark-circle-outline',
}

export function InlineBanner({ variant, title, message, action, onDismiss, style }: InlineBannerProps) {
  const { colors } = useTheme()
  const [visible, setVisible] = useState(true)
  const maxH = useRef(new Animated.Value(200)).current
  const opacity = useRef(new Animated.Value(1)).current

  const accent = variant === 'error' ? colors.error
    : variant === 'warning' ? colors.warning
    : variant === 'success' ? colors.sage
    : colors.teal

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(maxH,    { toValue: 0, duration: 260, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(() => setVisible(false))
  }

  if (!visible) return null

  return (
    <Animated.View style={[{ maxHeight: maxH, opacity, overflow: 'hidden' }, style]}>
      <View style={[inl.container, { backgroundColor: `${accent}10`, borderColor: `${accent}40` }]}>
        <Ionicons name={INLINE_ICONS[variant]} size={18} color={accent} style={{ marginTop: 1 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[inl.title, { color: accent }]}>{title}</Text>
          {!!message && <Text style={[inl.message, { color: colors.textSecondary }]}>{message}</Text>}
          {action && (
            <TouchableOpacity onPress={action.onPress}>
              <Text style={[inl.action, { color: accent }]}>{action.label} →</Text>
            </TouchableOpacity>
          )}
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={() => { dismiss(); onDismiss() }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={accent} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  )
}

const inl = StyleSheet.create({
  container: {
    flexDirection: 'row', gap: 10, borderRadius: 14, borderWidth: 1,
    padding: 14, alignItems: 'flex-start',
  },
  title:   { fontSize: 15, fontWeight: '700' },
  message: { fontSize: 14, lineHeight: 20 },
  action:  { fontSize: 14, fontWeight: '700', marginTop: 4 },
})
