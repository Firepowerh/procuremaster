import { View, Text, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase/client'
import { useAuthStore } from '@/src/stores/auth-store'
import { Button } from '@/src/components/ui/Button'

export default function OnboardingScreen() {
  const router = useRouter()
  const { profile, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const roleLabel: Record<string, string> = {
    procurement_manager: 'Procurement Manager',
    department_head: 'Department Head',
    finance_approver: 'Finance Approver',
    vendor: 'Vendor',
  }

  async function handleGetStarted() {
    if (!profile) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', profile.id)
      if (error) {
        Alert.alert('Error', 'Could not complete setup. Please try again.')
        return
      }
      setProfile({ ...profile, onboarding_complete: true })
      router.replace('/(app)/dashboard')
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-16 pb-10 justify-between">
        <View className="gap-6">
          <View className="w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center">
            <Text className="text-white text-2xl font-bold">P</Text>
          </View>
          <View className="gap-3">
            <Text className="text-3xl font-bold text-slate-900">
              Welcome, {profile?.full_name?.split(' ')[0]}!
            </Text>
            <Text className="text-base text-slate-500 leading-relaxed">
              Your workspace is ready. You're set up as{' '}
              <Text className="font-semibold text-slate-700">
                {roleLabel[profile?.role ?? ''] ?? profile?.role}
              </Text>.
            </Text>
          </View>
          <View className="bg-slate-50 rounded-2xl p-5 gap-3">
            <Text className="font-semibold text-slate-900">What you can do:</Text>
            {profile?.role === 'procurement_manager' && (
              <View className="gap-2">
                <Text className="text-slate-600">• Create and manage RFPs</Text>
                <Text className="text-slate-600">• Invite and evaluate vendors</Text>
                <Text className="text-slate-600">• Track the full procurement lifecycle</Text>
              </View>
            )}
            {profile?.role === 'department_head' && (
              <View className="gap-2">
                <Text className="text-slate-600">• Submit procurement requirements</Text>
                <Text className="text-slate-600">• Track RFP progress</Text>
              </View>
            )}
            {profile?.role === 'finance_approver' && (
              <View className="gap-2">
                <Text className="text-slate-600">• Review and approve vendor selections</Text>
                <Text className="text-slate-600">• Manage contracts</Text>
              </View>
            )}
            {profile?.role === 'vendor' && (
              <View className="gap-2">
                <Text className="text-slate-600">• View RFP invitations</Text>
                <Text className="text-slate-600">• Submit your proposals</Text>
              </View>
            )}
          </View>
        </View>
        <Button label="Get started" onPress={handleGetStarted} loading={loading} />
      </View>
    </SafeAreaView>
  )
}
