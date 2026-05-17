import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFonts } from 'expo-font'
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

  // Explicitly load Ionicons font
  const [fontsLoaded] = useFonts(Ionicons.font)

  const hidden = (name: string): object =>
    allowed.includes(name)
      ? {}
      : { tabBarItemStyle: { display: 'none', width: 0, height: 0 } }

  const icon = (name: string, focused: boolean, color: string) => (
    fontsLoaded
      ? <Ionicons name={name as any} size={22} color={color} />
      : null
  )

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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          ...hidden('dashboard'),
          tabBarIcon: ({ color, focused }) => icon(focused ? 'home' : 'home-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="requirements"
        options={{
          title: 'Requirements',
          ...hidden('requirements'),
          tabBarIcon: ({ color, focused }) => icon(focused ? 'document-text' : 'document-text-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="rfps"
        options={{
          title: 'RFPs',
          ...hidden('rfps'),
          tabBarIcon: ({ color, focused }) => icon(focused ? 'clipboard' : 'clipboard-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          ...hidden('vendors'),
          tabBarIcon: ({ color, focused }) => icon(focused ? 'people' : 'people-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          ...hidden('approvals'),
          tabBarIcon: ({ color, focused }) => icon(focused ? 'checkmark-circle' : 'checkmark-circle-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          ...hidden('contracts'),
          tabBarIcon: ({ color, focused }) => icon(focused ? 'document' : 'document-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          ...hidden('settings'),
          tabBarIcon: ({ color, focused }) => icon(focused ? 'settings' : 'settings-outline', focused, color),
        }}
      />
    </Tabs>
  )
}
