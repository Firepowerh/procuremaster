'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto space-y-4">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="font-heading text-base font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. You can try again or return to the dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono mt-2">Error: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={reset}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Try again
        </Button>
        <Button size="sm" variant="outline" onClick={() => (window.location.href = '/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
