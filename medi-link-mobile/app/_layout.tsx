import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useAuthStore } from '../store/auth.store'
import { getAccessToken, setAuthFailureHandler } from '../lib/api'
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket'

SplashScreen.preventAutoHideAsync()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Order placed', CONFIRMED: 'Confirmed', IN_TRANSIT: 'Out for delivery',
  DELIVERED: 'Delivered', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}

export default function RootLayout() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)

  // Wire the API interceptor → auth store logout so 401s clear the session
  useEffect(() => {
    setAuthFailureHandler(logout)
  }, [logout])

  // Request notification permissions once on app start
  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {})
  }, [])

  useEffect(() => {
    if (!hasHydrated) return

    if (isAuthenticated) {
      getAccessToken().then((token) => {
        if (!token) {
          logout()
          return
        }

        const socket = connectSocket(token)
        SplashScreen.hideAsync()

        // Global order:update → local notification (fires regardless of which screen is open)
        const orderHandler = ({ status }: { orderId: string; status: string }) => {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Order Update',
              body: ORDER_STATUS_LABEL[status] ?? status,
            },
            trigger: null,
          }).catch(() => {})
        }
        socket.on('order:update', orderHandler)
      })
    } else {
      const socket = getSocket()
      socket?.off('order:update')
      disconnectSocket()
      SplashScreen.hideAsync()
    }
  }, [hasHydrated, isAuthenticated, logout])

  if (!hasHydrated) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="drug/add"      options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="drug/[id]"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="listing/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="emergency-rx" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="orders"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="med-route"    options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="channel/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="patients"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="medi-career"  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="wallet"       options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  )
}
