import type { ReactNode } from 'react'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary-foreground/20 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-primary-foreground"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.04 12c.065 4.028 1.892 7.635 4.713 10.077A11.952 11.952 0 0012 24c3.059 0 5.842-1.154 7.961-3.049A11.959 11.959 0 0023.96 12c-.065-4.028-1.892-7.635-4.713-10.077A11.952 11.952 0 0012 2c-.898 0-1.774.107-2.613.31z"
              />
            </svg>
          </div>
          <span className="font-heading text-lg font-semibold">ProcureMaster</span>
        </div>

        <div className="space-y-4">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed text-primary-foreground/90">
              &ldquo;ProcureMaster cut our vendor evaluation time by 60%. The AI scoring means
              our team focuses on decisions, not spreadsheets.&rdquo;
            </p>
            <footer className="text-sm text-primary-foreground/70">
              — Head of Operations, Fortune 500 Company
            </footer>
          </blockquote>
        </div>

        <div className="text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} ProcureMaster. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile brand mark */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 text-primary-foreground"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.04 12c.065 4.028 1.892 7.635 4.713 10.077A11.952 11.952 0 0012 24c3.059 0 5.842-1.154 7.961-3.049A11.959 11.959 0 0023.96 12c-.065-4.028-1.892-7.635-4.713-10.077A11.952 11.952 0 0012 2c-.898 0-1.774.107-2.613.31z"
                />
              </svg>
            </div>
            <span className="font-heading text-base font-semibold">ProcureMaster</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
