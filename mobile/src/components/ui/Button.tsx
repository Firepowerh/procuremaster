import { Pressable, Text, ActivityIndicator } from 'react-native'

interface ButtonProps {
  onPress: () => void
  label: string
  variant?: 'primary' | 'outline' | 'ghost'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  const base = 'rounded-xl py-3.5 px-6 items-center justify-center flex-row gap-2'
  const variants = {
    primary: 'bg-primary-600 active:bg-primary-700',
    outline: 'border border-primary-600 active:bg-primary-50',
    ghost: 'active:bg-slate-100',
  }
  const textVariants = {
    primary: 'text-white font-semibold text-base',
    outline: 'text-primary-600 font-semibold text-base',
    ghost: 'text-slate-700 font-medium text-base',
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#4f46e5'} />}
      <Text className={textVariants[variant]}>{label}</Text>
    </Pressable>
  )
}
