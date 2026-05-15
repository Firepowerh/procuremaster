import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

interface SkeletonProps {
  className?: string
  height?: number
}

export function Skeleton({ className = '', height = 20 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={{ opacity, height }}
      className={`bg-slate-200 rounded-lg ${className}`}
    />
  )
}

export function CardSkeleton() {
  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100">
      <Skeleton className="w-24" height={14} />
      <View className="mt-2">
        <Skeleton className="w-16" height={32} />
      </View>
    </View>
  )
}
