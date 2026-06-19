import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../constants/theme'

const { width: SW } = Dimensions.get('window')
const H_MARGIN = 20
const BAR_W    = SW - H_MARGIN * 2

type IconName = React.ComponentProps<typeof Ionicons>['name']

const TAB_CONFIG: Record<string, { icon: IconName; activeIcon: IconName; label: string }> = {
  inventory:   { icon: 'cube-outline',       activeIcon: 'cube',       label: 'Stock'   },
  marketplace: { icon: 'storefront-outline', activeIcon: 'storefront', label: 'Market'  },
  dashboard:   { icon: 'home-outline',       activeIcon: 'home',       label: 'Home'    },
  network:     { icon: 'people-outline',     activeIcon: 'people',     label: 'Network' },
  profile:     { icon: 'person-outline',     activeIcon: 'person',     label: 'Profile' },
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const slotW  = BAR_W / state.routes.length
  const centerIdx = state.routes.findIndex((r) => r.name === 'dashboard')
  const indicatorX = useRef(new Animated.Value(state.index * slotW)).current

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: state.index * slotW,
      tension: 240,
      friction: 22,
      useNativeDriver: true,
    }).start()
  }, [state.index, slotW])

  const barBg = isDark ? 'rgba(13,13,13,0.92)' : 'rgba(255,255,255,0.92)'

  return (
    <View style={[styles.outer, { paddingBottom: insets.bottom + 10 }]}>
      <View style={[
        styles.bar,
        {
          backgroundColor: barBg,
          borderColor: colors.border,
          shadowColor: colors.sage,
        },
      ]}>
        <BlurView
          intensity={70}
          tint={isDark ? 'dark' : 'extraLight'}
          style={StyleSheet.absoluteFill}
        />

        {/* Sliding sage pill indicator */}
        <Animated.View style={[styles.indicatorOuter, { width: slotW, transform: [{ translateX: indicatorX }] }]}>
          <View style={[styles.indicator, { backgroundColor: colors.sage }]} />
        </Animated.View>

        {/* Tabs */}
        {state.routes.map((route, index) => {
          const tab    = TAB_CONFIG[route.name] ?? TAB_CONFIG.profile
          const active = state.index === index
          const isHome = index === centerIdx

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tab, isHome && styles.tabCenter]}
              onPress={() => {
                if (!active) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  navigation.navigate(route.name)
                }
              }}
              activeOpacity={0.75}
            >
              {isHome ? (
                /* Center Home button — elevated pill */
                <Animated.View style={[
                  styles.homeBtn,
                  {
                    backgroundColor: active ? (isDark ? colors.surfaceAlt : colors.textPrimary) : colors.surface,
                    borderColor: active ? (isDark ? colors.border : colors.textPrimary) : colors.border,
                    shadowColor: colors.sage,
                  },
                ]}>
                  <Ionicons
                    name={active ? tab.activeIcon : tab.icon}
                    size={24}
                    color={active ? colors.sage : colors.textMuted}
                  />
                </Animated.View>
              ) : (
                <>
                  <Ionicons
                    name={active ? tab.activeIcon : tab.icon}
                    size={22}
                    color={active ? colors.textPrimary : colors.textMuted}
                  />
                  <Text style={[
                    styles.label,
                    { color: active ? colors.textPrimary : colors.textMuted },
                    active && styles.labelBold,
                  ]}>
                    {tab.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: H_MARGIN,
    right: H_MARGIN,
  },
  bar: {
    flexDirection: 'row',
    height: 74,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 18,
    alignItems: 'center',
  },
  indicatorOuter: {
    position: 'absolute',
    height: 74,
    paddingHorizontal: 7,
    paddingVertical: 12,
  },
  indicator: {
    flex: 1,
    borderRadius: 16,
    opacity: 0.22,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    zIndex: 1,
  },
  tabCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  label:     { fontSize: 11, fontWeight: '500' },
  labelBold: { fontWeight: '700' },
})
