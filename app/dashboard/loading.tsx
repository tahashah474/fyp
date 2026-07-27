export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-pk-cream">
      {/* Navbar skeleton */}
      <div className="bg-pk-green h-16 w-full" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-pk-dark/10 rounded-xl w-64" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-white rounded-2xl shadow-warm" />
          <div className="h-24 bg-white rounded-2xl shadow-warm" />
        </div>
        <div className="h-12 bg-white rounded-2xl shadow-warm w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-2xl shadow-warm" />
          ))}
        </div>
      </div>
    </div>
  )
}
