'use client'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-pk-cream flex items-center justify-center p-4">
      <div className="card max-w-md text-center shadow-warm-lg">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-pk-dark mb-2">Dashboard Error</h2>
        <p className="text-pk-dark/60 text-sm mb-2">{error.message}</p>
        <p className="text-pk-dark/40 text-xs mb-6">If this keeps happening, try logging out and back in.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">Retry</button>
          <a href="/auth/login" className="btn-outline">Log Out</a>
        </div>
      </div>
    </div>
  )
}
