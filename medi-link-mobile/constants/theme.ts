import { createContext, useContext, createElement, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { useSettingsStore } from '../store/settings.store'

const ForceLightCtx = createContext(false)
export function ForceLightProvider({ children }: { children: ReactNode }) {
  return createElement(ForceLightCtx.Provider, { value: true }, children)
}

// ─── Light — Pharmacy Green (Option 1) ───────────────────────────────────────
// Spec: Background #FFFFFF · Text #111111 · Secondary #6B7280
//       Accent #16A34A · Surface #E6F4EE · Success tint #DCFCE7 · Alert #FEE2E2

const light = {
  // Brand
  sage:     '#16A34A',   // Accent / Brand  — Pharmacy Green
  sagePale: '#DCFCE7',   // Success / Info tint (spec)
  teal:     '#059669',   // Deep emerald — secondary accent

  // Layout
  background: '#FFFFFF',
  surface:    '#F0FDF4',   // Lightest green-tinted surface
  surfaceAlt: '#E6F4EE',   // Spec "Light" — chips, icon fills, badges
  border:     '#BBF7D0',   // Crisp green border
  divider:    '#BBF7D0',

  // Text  (spec-exact)
  textPrimary:   '#111111',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',

  // Buttons
  buttonPrimaryBg:   '#16A34A',
  buttonPrimaryText: '#FFFFFF',

  // Card selection states
  cardSelectedBg:      '#16A34A',
  cardSelectedText:    '#FFFFFF',
  cardSelectedSubtext: 'rgba(255,255,255,0.65)',

  // Semantic
  error:   '#EF4444',   // clean red
  warning: '#F59E0B',   // amber
  success: '#16A34A',   // same as sage

  // Misc
  illustrationBg: '#E6F4EE',
  cardShadow:     'rgba(22,163,74,0.10)',
  overlay:        'rgba(0,0,0,0.50)',
}

// ─── Dark — Pharmacy Green Dark ───────────────────────────────────────────────
// Principles:
//  1. Text uses NEUTRAL grays (#F9FAFB / #9CA3AF / #6B7280) — not green-tinted.
//     Green-tinted grays made the old dark mode look muddy and inconsistent.
//  2. textMuted (#6B7280) is readable on #0A0F0B (~4.6:1 contrast). Old #3D5E4A was ~1.5:1 — invisible.
//  3. sage bumped to #22C55E (vs #16A34A in light) to keep same contrast on dark bg.
//  4. Surfaces use three distinct steps so cards, modals, and sheets are visually separated.
//  5. Border #1E3020 is clearly visible while staying subtle (contrast ~2.2:1 on bg).

const dark = {
  // Brand
  sage:     '#22C55E',   // Brighter than light — needed to match #16A34A contrast on dark bg
  sagePale: '#052E16',   // Dark tint for icon fills, badge backgrounds
  teal:     '#10B981',   // Emerald

  // Layout — three elevation steps
  background: '#0A0F0B',   // Step 0: deepest
  surface:    '#111A12',   // Step 1: cards, list items
  surfaceAlt: '#172219',   // Step 2: sheets, modals, dropdowns
  border:     '#1E3020',   // Visible but not distracting
  divider:    '#1E3020',

  // Text — NEUTRAL, no green tint (key fix)
  textPrimary:   '#F9FAFB',   // Near-white (neutral)
  textSecondary: '#9CA3AF',   // Medium gray — same hex as light mode secondary
  textMuted:     '#6B7280',   // Readable muted gray — contrast ~4.6:1 on bg

  // Buttons
  buttonPrimaryBg:   '#22C55E',
  buttonPrimaryText: '#0A0F0B',

  // Card selection
  cardSelectedBg:      '#22C55E',
  cardSelectedText:    '#0A0F0B',
  cardSelectedSubtext: 'rgba(10,15,11,0.55)',

  // Semantic
  error:   '#F87171',   // Lighter red — maintains contrast on dark
  warning: '#FBBF24',   // Lighter amber
  success: '#22C55E',

  // Misc
  illustrationBg: '#0F1F11',
  cardShadow:     'rgba(0,0,0,0.55)',
  overlay:        'rgba(0,0,0,0.70)',
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export type ThemeColors = typeof light

export function useTheme() {
  const forceLight   = useContext(ForceLightCtx)
  const systemScheme = useColorScheme()
  const themeMode    = useSettingsStore((s) => s.themeMode)

  if (forceLight) return { isDark: false, colors: light }

  const resolved = themeMode === 'system' ? (systemScheme ?? 'light') : themeMode
  const isDark   = resolved === 'dark'
  return { isDark, colors: isDark ? dark : light }
}
