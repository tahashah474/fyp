'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import Navbar from '@/components/ui/Navbar'

function SignupForm() {
  const { t, isRTL } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get('role') as 'farmer' | 'doctor') || 'farmer'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'farmer' | 'doctor'>(defaultRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) { setError(t('errors.password_mismatch')); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)

    try {
      // Use our server-side signup API — auto-confirms email, bypasses RLS
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        // If user already exists, just try to sign in normally
        if (data.error?.includes('already registered') || data.error?.includes('already been registered')) {
          setError('An account with this email already exists. Please log in.')
        } else {
          setError(data.error || 'Signup failed')
        }
        setLoading(false)
        return
      }

      // Now sign in the newly created user
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError('Account created! Please log in.')
        router.push('/auth/login')
        return
      }

      // Redirect based on role
      router.push(role === 'doctor' ? '/dashboard/doctor/register' : '/dashboard/farmer')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className={`w-full max-w-md ${isRTL ? 'text-right' : ''}`}>
          <div className="card shadow-warm-lg animate-slide-up">
            <div className={`text-center mb-8 ${isRTL ? 'text-right' : ''}`}>
              <div className="text-5xl mb-4">🌾</div>
              <h1 className="text-2xl font-bold text-pk-dark">{t('auth.signup_title')}</h1>
              <p className="text-pk-dark/60 mt-1">{t('auth.signup_subtitle')}</p>
            </div>

            {error && (
              <div className="bg-pk-terra/10 border border-pk-terra/30 text-pk-terra text-sm rounded-xl p-3 mb-4">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="label-text">{t('auth.full_name')}</label>
                <input type="text" className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="label-text">{t('auth.email')}</label>
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <div>
                <label className="label-text">{t('auth.password')}</label>
                <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} dir="ltr" />
              </div>
              <div>
                <label className="label-text">{t('auth.confirm_password')}</label>
                <input type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required dir="ltr" />
              </div>

              <div>
                <label className="label-text">{t('auth.role_label')}</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {(['farmer', 'doctor'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-center ${
                        role === r ? 'border-pk-green bg-pk-green/5 text-pk-green' : 'border-gray-200 text-pk-dark/60 hover:border-pk-sage'
                      }`}
                    >
                      {r === 'farmer' ? '🌾' : '🩺'} {t(`auth.role_${r}`)}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-base">
                {loading && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                {loading ? 'Creating account...' : t('auth.signup_btn')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-pk-dark/60">
              {t('auth.have_account')}{' '}
              <Link href="/auth/login" className="text-pk-green font-semibold hover:underline">{t('auth.login_link')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-pk-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pk-green border-t-transparent" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
