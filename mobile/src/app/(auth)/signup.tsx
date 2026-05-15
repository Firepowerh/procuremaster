import { View, Text, Pressable, Alert, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase/client'
import { signupSchema, type SignupFormData } from '@/src/lib/schemas/auth'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD'] as const

export default function SignupScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      orgName: '',
      currency: 'USD',
    },
  })

  async function onSubmit({ fullName, email, password, orgName, currency }: SignupFormData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      Alert.alert('Sign up failed', authError?.message ?? 'Unknown error')
      return
    }

    const userId = authData.user.id
    const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({ name: orgName, slug, currency })
      .select('id')
      .single()

    if (orgError || !org) {
      Alert.alert('Setup failed', 'Could not create organisation. Please try again.')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        org_id: org.id,
        full_name: fullName,
        role: 'procurement_manager',
        onboarding_complete: false,
      })

    if (profileError) {
      Alert.alert('Setup failed', 'Could not create profile. Please try again.')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerClassName="px-6 pt-12 pb-10 gap-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-slate-900">Create account</Text>
          <Text className="text-base text-slate-500">Set up your procurement workspace</Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full name"
                placeholder="Alex Manager"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Work email"
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
                placeholder="Min. 6 characters"
                secureTextEntry
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="orgName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Organisation name"
                placeholder="Acme Corp"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.orgName?.message}
              />
            )}
          />

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-slate-700">Currency</Text>
            <Controller
              control={control}
              name="currency"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-2 flex-wrap">
                  {CURRENCIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => onChange(c)}
                      className={`px-4 py-2 rounded-lg border ${
                        value === c
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`font-medium text-sm ${value === c ? 'text-white' : 'text-slate-700'}`}>
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>
        </View>

        <Button
          label="Create account"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />

        <View className="flex-row justify-center gap-1">
          <Text className="text-slate-500 text-sm">Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-primary-600 font-medium text-sm">Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
