import { Tabs } from 'expo-router'
import { TabBar } from '../../components/navigation/TabBar'
import { useAuthStore } from '../../store/auth.store'

export default function TabsLayout() {
  const { user } = useAuthStore()
  const isPharmacy = user?.role === 'MEDICAL' || user?.role === 'NON_MEDICAL'

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      {/* Inventory & marketplace only shown to pharmacy roles */}
      <Tabs.Screen name="inventory"   options={isPharmacy ? undefined : { href: null }} />
      <Tabs.Screen name="marketplace" options={isPharmacy ? undefined : { href: null }} />
      <Tabs.Screen name="dashboard"   />
      <Tabs.Screen name="network"     />
      <Tabs.Screen name="profile"     />
    </Tabs>
  )
}
