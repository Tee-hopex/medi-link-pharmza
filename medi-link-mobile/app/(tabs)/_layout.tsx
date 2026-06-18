import { Tabs } from 'expo-router'
import { TabBar } from '../../components/navigation/TabBar'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      {/* Explicit order: Stock | Market | HOME (centre) | Network | Profile */}
      <Tabs.Screen name="inventory"   />
      <Tabs.Screen name="marketplace" />
      <Tabs.Screen name="dashboard"   />
      <Tabs.Screen name="network"     />
      <Tabs.Screen name="profile"     />
    </Tabs>
  )
}
