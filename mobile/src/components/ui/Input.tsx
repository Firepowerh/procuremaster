import { View, Text, TextInput, TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-slate-700">{label}</Text>
      )}
      <TextInput
        {...props}
        className={`border rounded-xl px-4 py-3 text-base text-slate-900 bg-white
          ${error ? 'border-red-400' : 'border-slate-200'}
          ${props.editable === false ? 'bg-slate-50 text-slate-400' : ''}`}
        placeholderTextColor="#94a3b8"
      />
      {error && (
        <Text className="text-xs text-red-500">{error}</Text>
      )}
    </View>
  )
}
