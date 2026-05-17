import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/src/stores/auth-store'

const ROLE_TABS: Record<string, string[]> = {
  procurement_manager: ['dashboard', 'requirements', 'rfps', 'vendors', 'settings'],
  department_head: ['dashboard', 'requirements', 'rfps', 'settings'],
  finance_approver: ['dashboard', 'approvals', 'contracts', 'settings'],
  vendor: ['dashboard', 'settings'],
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const TAB_CONFIG: {
  name: string
  title: string
  icon: IoniconsName
  iconActive: IoniconsName
}[] = [
  { name: 'dashboard',    title: 'Home',         icon: 'home-outline',         iconActive: 'home' },
  { name: 'requirements', title: 'Requirements',  icon: 'document-text-outline', iconActive: 'document-text' },
  { name: 'rfps',         title: 'RFPs',          icon: 'clipboard-outline',     iconActive: 'clipboard' },
  { name: 'vendors',      title: 'Vendors',       icon: 'people-outline',        iconActive: 'people' },
  { name: 'approvals',    title: 'Approvals',     icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle' },
  { name: 'contracts',    title: 'Contracts',     icon: 'document-outline',      iconActive: 'document' },
  { name: 'settings',     title: 'Settings',      icon: 'settings-outline',      iconActive: 'settings' },
]

export default function AppLayout() {
  const { profile } = useAuthStore()
  const allowed = ROLE_TABS[profile?.role ?? ''] ?? ['dashboard', 'settings']

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
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginBottom: 2 },
      }}
    >
      {TAB_CONFIG.map(({ name, title, icon, iconActive }) => {
        const isAllowed = allowed.includes(name)
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              href: isAllowed ? undefined : null,
              tabBarButton: isAllowed ? undefined : () => null,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? iconActive : icon}
                  size={22}
                  color={color}
                />
              ),
            }}
          />
        )
      })}
    </Tabs>
  )
}
