import { View, Text, Pressable, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'
import { useAuthStore } from '@/src/stores/auth-store'
import { Badge } from '@/src/components/ui/Badge'

const ROLE_LABELS: Record<string, string> = {
  procurement_manager: 'Procurement Manager',
  department_head: 'Department Head',
  finance_approver: 'Finance Approver',
  vendor: 'Vendor',
}

export default function SettingsScreen() {
  const router = useRouter()
  const { profile, signOut } = useAuthStore()

  function handleSignOut() {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Settings" />
      <View className="px-4 pt-4 gap-4">
        <View className="bg-white rounded-2xl p-5 gap-4 border border-slate-100">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name="person" size={22} color="#4f46e5" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-semibold text-slate-900 text-base">{profile?.full_name}</Text>
              <Badge label={ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? ''} variant="info" />
            </View>
          </View>
        </View>

        <View className="bg-white rounded-2xl px-5 py-4 border border-slate-100">
          <View className="flex-row items-center gap-3">
            <Ionicons name="business-outline" size={20} color="#94a3b8" />
            <View className="gap-0.5">
              <Text className="text-xs text-slate-400 font-medium">Organisation ID</Text>
              <Text className="text-slate-700 text-sm font-mono">{profile?.org_id}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSignOut}
          className="bg-white rounded-2xl px-5 py-4 border border-slate-100 flex-row items-center gap-3 active:bg-slate-50"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold text-base">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
