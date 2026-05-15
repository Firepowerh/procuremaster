import { View, Text } from 'react-native'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-slate-100', text: 'text-slate-600' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-amber-100', text: 'text-amber-700' },
  danger: { container: 'bg-red-100', text: 'text-red-700' },
  info: { container: 'bg-blue-100', text: 'text-blue-700' },
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const styles = variantStyles[variant]
  return (
    <View className={`rounded-full px-2.5 py-0.5 self-start ${styles.container}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{label}</Text>
    </View>
  )
}
