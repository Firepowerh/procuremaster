import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-xl font-bold text-slate-900 text-center">Vendor Invite</Text>
      <Text className="text-slate-500 text-center mt-2">Token: {token}</Text>
      <Text className="text-slate-400 text-center mt-4">Full implementation in Phase 2</Text>
    </SafeAreaView>
  )
}
