import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/src/stores/auth-store'
import { useDashboardStats } from '@/src/hooks/use-dashboard-stats'
import { Card } from '@/src/components/ui/Card'
import { CardSkeleton } from '@/src/components/ui/Skeleton'

export default function DashboardScreen() {
  const { profile } = useAuthStore()
  const { stats, loading, refetch } = useDashboardStats()
  const router = useRouter()

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerClassName="px-4 pt-6 pb-10 gap-6"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-1">
          <Text className="text-2xl font-bold text-slate-900">
            {greeting()}, {profile?.full_name?.split(' ')[0]}
          </Text>
          <Text className="text-slate-500 text-sm capitalize">
            {profile?.role?.replace(/_/g, ' ')}
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Overview
          </Text>

          {loading && (
            <View className="gap-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </View>
          )}

          {!loading && stats?.role === 'procurement_manager' && (
            <View className="gap-3">
              <Card
                title="Active RFPs"
                value={stats.data.activeRfps}
                subtitle="In progress"
                onPress={() => router.push('/(app)/rfps')}
              />
              <Card
                title="Pending Evaluations"
                value={stats.data.pendingEvaluations}
                subtitle="Awaiting scoring"
              />
              <Card
                title="Open Requirements"
                value={stats.data.openRequirements}
                subtitle="Submitted or approved"
                onPress={() => router.push('/(app)/requirements')}
              />
            </View>
          )}

          {!loading && stats?.role === 'department_head' && (
            <View className="gap-3">
              <Card
                title="My Requirements"
                value={stats.data.myRequirements}
                subtitle="Total submitted"
                onPress={() => router.push('/(app)/requirements')}
              />
              <Card
                title="Active RFPs"
                value={stats.data.activeRfps}
                subtitle="In progress"
                onPress={() => router.push('/(app)/rfps')}
              />
            </View>
          )}

          {!loading && stats?.role === 'finance_approver' && (
            <View className="gap-3">
              <Card
                title="Pending Approvals"
                value={stats.data.pendingApprovals}
                subtitle="Awaiting your review"
                onPress={() => router.push('/(app)/approvals')}
              />
              <Card
                title="Active Contracts"
                value={stats.data.activeContracts}
                subtitle="Currently live"
                onPress={() => router.push('/(app)/contracts')}
              />
            </View>
          )}

          {!loading && stats?.role === 'vendor' && (
            <Card
              title="My Submissions"
              value={stats.data.mySubmissions}
              subtitle="Total proposals"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
