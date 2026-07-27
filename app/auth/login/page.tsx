'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import Navbar from '@/components/ui/Navbar'

export default function LoginPage() {
  const { t, isRTL } = useI18n()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')
    const supabase = createClient()

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // Provide friendly messages for common errors
      if (signInError.message.includes('Email not confirmed')) {
        setInfo('Please check your email and click the confirmation link first, then come back to log in.')
      } else if (signInError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. If you just signed up, check your email for a confirmation link.')
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Login failed. Please try again.')
      setLoading(false)
      return
    }

    // Fetch role — gracefully handle missing profiles table
    let role = 'farmer'
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()
      if (profile?.role) role = profile.role
    } catch {
      // profiles table may not exist yet — still redirect to farmer dashboard
    }

    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'doctor') {
      router.push('/dashboard/doctor')
    } else {
      router.push('/dashboard/farmer')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className={`w-full max-w-md ${isRTL ? 'text-right' : ''}`}>
          <div className="card shadow-warm-lg animate-slide-up">
            <div className={`text-center mb-8 ${isRTL ? 'text-right' : ''}`}>
              <div className="text-5xl mb-4">🐄</div>
              <h1 className="text-2xl font-bold text-pk-dark">{t('auth.login_title')}</h1>
              <p className="text-pk-dark/60 mt-1">{t('auth.login_subtitle')}</p>
            </div>

            {error && (
              <div className="bg-pk-terra/10 border border-pk-terra/30 text-pk-terra text-sm rounded-xl p-3 mb-4">
                ❌ {error}
              </div>
            )}

            {info && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl p-3 mb-4">
                📧 {info}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label-text">{t('auth.email')}</label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="label-text">{t('auth.password')}</label>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center flex items-center gap-2 text-base"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : null}
                {t('auth.login_btn')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-pk-dark/60">
              {t('auth.no_account')}{' '}
              <Link href="/auth/signup" className="text-pk-green font-semibold hover:underline">
                {t('auth.signup_link')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
