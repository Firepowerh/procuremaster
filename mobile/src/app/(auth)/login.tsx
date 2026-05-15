import { View, Text, Pressable, Alert } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/src/lib/schemas/auth'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'
import { KeyboardAvoidingWrapper } from '@/src/components/layout/KeyboardAvoidingWrapper'

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit({ email, password }: LoginFormData) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      Alert.alert('Sign in failed', error.message)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingWrapper>
        <View className="flex-1 px-6 pt-16 pb-8 justify-between">
          <View className="gap-8">
            <View className="gap-2">
              <Text className="text-3xl font-bold text-slate-900">Welcome back</Text>
              <Text className="text-base text-slate-500">Sign in to ProcureMaster</Text>
            </View>

            <View className="gap-4">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="••••••••"
                    secureTextEntry
                    autoComplete="current-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />

              <Link href="/(auth)/reset-password" asChild>
                <Pressable>
                  <Text className="text-sm text-primary-600 font-medium text-right">Forgot password?</Text>
                </Pressable>
              </Link>
            </View>

            <Button
              label="Sign in"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
            />
          </View>

          <View className="flex-row justify-center gap-1">
            <Text className="text-slate-500 text-sm">Don't have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="text-primary-600 font-medium text-sm">Create one</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  )
}
