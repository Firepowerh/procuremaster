import '../../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '@/src/hooks/use-auth'

function RootLayoutInner() {
  useAuth()

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="invite/[token]" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootLayoutInner />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  )
}
