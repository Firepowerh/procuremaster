import { View, Text, Alert } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/src/lib/schemas/auth'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'
import { KeyboardAvoidingWrapper } from '@/src/components/layout/KeyboardAvoidingWrapper'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit({ email }: ResetPasswordFormData) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'procuremaster://update-password',
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    Alert.alert(
      'Check your email',
      'We sent a password reset link to ' + email,
      [{ text: 'OK', onPress: () => router.back() }]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Reset password" showBack />
      <KeyboardAvoidingWrapper>
        <View className="flex-1 px-6 pt-8 gap-6">
          <Text className="text-slate-500 text-base">
            Enter your work email and we'll send you a link to reset your password.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Button
            label="Send reset link"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  )
}
