import Link from 'next/link'
import { FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Page Not Found' }

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="max-w-sm space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <FileSearch className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">404</h1>
          <p className="text-base font-medium">Page not found</p>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" render={<Link href="/dashboard" />}>
            Go to Dashboard
          </Button>
          <Button size="sm" variant="outline" render={<Link href="/rfps" />}>
            View RFPs
          </Button>
        </div>
      </div>
    </div>
  )
}
