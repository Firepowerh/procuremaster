import { Text } from 'react-native'
import { Tabs } from 'expo-router'

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="requirements"
        options={{
          title: 'Requirements',
          tabBarIcon: ({ focused }) => <Icon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rfps"
        options={{
          title: 'RFPs',
          tabBarIcon: ({ focused }) => <Icon emoji="📄" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          tabBarIcon: ({ focused }) => <Icon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          href: null,
          tabBarIcon: ({ focused }) => <Icon emoji="✅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          href: null,
          tabBarIcon: ({ focused }) => <Icon emoji="📃" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <Icon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
