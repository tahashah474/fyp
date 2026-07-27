'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAdminLogin = async () => {
    setLoading(true)
    setError('')

    try {
      // Ensure admin account exists with correct credentials
      const setupRes = await fetch('/api/admin/login', { method: 'POST' })
      const setupData = await setupRes.json()

      if (!setupRes.ok) {
        throw new Error(setupData.error || 'Admin setup failed')
      }

      // Sign in as admin
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'taharashid804@gmail.com',
        password: 'Hashmi@919',
      })

      if (signInError) throw new Error(signInError.message)

      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleAdminLogin}
        disabled={loading}
        className="flex items-center gap-2 bg-pk-dark text-pk-cream px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-pk-dark/80 transition-all border border-pk-dark/20 shadow-warm"
      >
        {loading ? (
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-pk-cream border-t-transparent" />
        ) : (
          <span>🛡️</span>
        )}
        {loading ? 'Signing in...' : 'Admin Panel'}
      </button>
      {error && <p className="text-pk-terra text-xs">{error}</p>}
    </div>
  )
}
