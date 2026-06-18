import { Stack } from 'expo-router'
import { ForceLightProvider } from '../../constants/theme'

export default function AuthLayout() {
  return (
    <ForceLightProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="register" />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-license" />
      </Stack>
    </ForceLightProvider>
  )
}
