import { View, Text, Pressable } from 'react-native'

interface CardProps {
  title: string
  value: string | number
  subtitle?: string
  onPress?: () => void
}

export function Card({ title, value, subtitle, onPress }: CardProps) {
  const Wrapper = onPress ? Pressable : View

  return (
    <Wrapper
      onPress={onPress}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:bg-slate-50"
    >
      <Text className="text-sm font-medium text-slate-500 mb-1">{title}</Text>
      <Text className="text-3xl font-bold text-slate-900">{value}</Text>
      {subtitle && (
        <Text className="text-xs text-slate-400 mt-1">{subtitle}</Text>
      )}
    </Wrapper>
  )
}
