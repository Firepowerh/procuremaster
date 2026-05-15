import { Tabs } from 'expo-router'
import { useAuthStore } from '@/src/stores/auth-store'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  Settings,
  CheckSquare,
  FileCheck,
} from 'lucide-react-native'

const ROLE_TABS: Record<string, string[]> = {
  procurement_manager: ['dashboard', 'requirements', 'rfps', 'vendors', 'settings'],
  department_head: ['dashboard', 'requirements', 'rfps', 'settings'],
  finance_approver: ['dashboard', 'approvals', 'contracts', 'settings'],
  vendor: ['dashboard', 'settings'],
}

export default function AppLayout() {
  const { profile } = useAuthStore()
  const allowed = ROLE_TABS[profile?.role ?? ''] ?? ['dashboard', 'settings']

  const show = (name: string) => (allowed.includes(name) ? undefined : null)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopColor: '#f1f5f9',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          href: show('dashboard'),
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requirements"
        options={{
          title: 'Requirements',
          href: show('requirements'),
          tabBarIcon: ({ color }) => <FileText size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rfps"
        options={{
          title: 'RFPs',
          href: show('rfps'),
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          href: show('vendors'),
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          href: show('approvals'),
          tabBarIcon: ({ color }) => <CheckSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          href: show('contracts'),
          tabBarIcon: ({ color }) => <FileCheck size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: show('settings'),
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  )
}
