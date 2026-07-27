export default function Loading() {
  return (
    <div className="min-h-screen bg-pk-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl animate-bounce">🐄</div>
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-pk-green/20 border-t-pk-green" />
        <p className="text-pk-dark/50 text-sm">Loading Malshifa...</p>
      </div>
    </div>
  )
}
