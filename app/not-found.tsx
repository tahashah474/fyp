import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pk-cream flex items-center justify-center p-4">
      <div className="card max-w-md text-center shadow-warm-lg">
        <div className="text-6xl mb-4">🐾</div>
        <h1 className="text-2xl font-bold text-pk-dark mb-2">Page Not Found</h1>
        <p className="text-pk-dark/60 text-sm mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-block">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
