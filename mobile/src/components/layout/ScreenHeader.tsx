import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenHeaderProps {
  title: string
  showBack?: boolean
}

export function ScreenHeader({ title, showBack = false }: ScreenHeaderProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-white border-b border-slate-100 px-4 pb-3"
    >
      <View className="flex-row items-center gap-3 mt-2">
        {showBack && (
          <Pressable onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={22} color="#475569" />
          </Pressable>
        )}
        <Text className="text-xl font-bold text-slate-900">{title}</Text>
      </View>
    </View>
  )
}
