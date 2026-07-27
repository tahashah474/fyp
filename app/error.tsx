'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-pk-cream flex items-center justify-center p-4">
      <div className="card max-w-md text-center shadow-warm-lg">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-pk-dark mb-2">Something went wrong</h2>
        <p className="text-pk-dark/60 text-sm mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <a href="/" className="btn-outline">
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
