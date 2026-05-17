import React from 'react'
import { Text } from 'react-native'
import { Tabs } from 'expo-router'

const tabIcon = (emoji: string) =>
  ({ focused }: { focused: boolean }) =>
    React.createElement(Text, { style: { fontSize: 20, opacity: focused ? 1 : 0.5 } }, emoji)

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          backgroundColor: '#ffffff',
          height: 60,
          paddingBottom: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="dashboard/index"    options={{ title: 'Home',         tabBarIcon: tabIcon('🏠') }} />
      <Tabs.Screen name="requirements/index" options={{ title: 'Requirements', tabBarIcon: tabIcon('📋') }} />
      <Tabs.Screen name="rfps/index"         options={{ title: 'RFPs',         tabBarIcon: tabIcon('📄') }} />
      <Tabs.Screen name="vendors/index"      options={{ title: 'Vendors',      tabBarIcon: tabIcon('👥') }} />
      <Tabs.Screen name="approvals/index"    options={{ title: 'Approvals',    tabBarIcon: tabIcon('✅'), href: null }} />
      <Tabs.Screen name="contracts/index"    options={{ title: 'Contracts',    tabBarIcon: tabIcon('📃'), href: null }} />
      <Tabs.Screen name="settings/index"     options={{ title: 'Settings',     tabBarIcon: tabIcon('⚙️') }} />
    </Tabs>
  )
}
