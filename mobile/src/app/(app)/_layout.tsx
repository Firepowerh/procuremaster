import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/src/stores/auth-store'

const ROLE_TABS: Record<string, string[]> = {
  procurement_manager: ['dashboard', 'requirements', 'rfps', 'vendors', 'settings'],
  department_head: ['dashboard', 'requirements', 'rfps', 'settings'],
  finance_approver: ['dashboard', 'approvals', 'contracts', 'settings'],
  vendor: ['dashboard', 'settings'],
}

export default function AppLayout() {
  const { profile } = useAuthStore()
  const allowed = ROLE_TABS[profile?.role ?? ''] ?? ['dashboard', 'settings']

  const tab = (name: string) => ({
    href: allowed.includes(name) ? undefined : null,
    tabBarButton: allowed.includes(name) ? undefined : () => null,
  })

  return (
    <Tabs
      initialRouteName="dashboard"
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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          ...tab('dashboard'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requirements"
        options={{
          title: 'Requirements',
          ...tab('requirements'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rfps"
        options={{
          title: 'RFPs',
          ...tab('rfps'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          ...tab('vendors'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          ...tab('approvals'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          ...tab('contracts'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'document' : 'document-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          ...tab('settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
