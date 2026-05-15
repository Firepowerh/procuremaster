import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'

export default function ApprovalsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Approvals" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-400 text-base">Coming in Phase 4</Text>
      </View>
    </SafeAreaView>
  )
}
