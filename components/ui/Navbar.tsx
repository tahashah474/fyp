'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import LanguageToggle from './LanguageToggle'
import AdminLoginButton from './AdminLoginButton'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  transparent?: boolean
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const { t, isRTL } = useI18n()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className={`
      w-full z-50 transition-all duration-300
      ${transparent ? 'absolute top-0 bg-transparent' : 'bg-pk-green shadow-warm'}
    `}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-bold text-xl hover:opacity-90 transition-opacity"
          >
            <span className="text-2xl">🐄</span>
            <span className="hidden sm:block font-urdu">{t('app_name')}</span>
            <span className="sm:hidden">ملشفا</span>
          </Link>

          {/* Desktop Nav */}
          <div className={`hidden md:flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <LanguageToggle variant="light" />
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-white/90 hover:text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-white/80 hover:text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-white/90 hover:text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-pk-gold text-pk-dark px-4 py-2 rounded-xl text-sm font-semibold hover:bg-pk-gold-light transition-colors"
                    >
                      {t('nav.register')}
                    </Link>
                    <AdminLoginButton />
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-fade-in">
            <LanguageToggle variant="light" />
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard" className="block text-white/90 px-3 py-2 text-sm" onClick={() => setMobileOpen(false)}>
                      {t('nav.dashboard')}
                    </Link>
                    <button onClick={handleLogout} className="block text-white/80 px-3 py-2 text-sm w-full text-start">
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="block text-white/90 px-3 py-2 text-sm" onClick={() => setMobileOpen(false)}>
                      {t('nav.login')}
                    </Link>
                    <Link href="/auth/signup" className="block text-pk-gold px-3 py-2 text-sm font-semibold" onClick={() => setMobileOpen(false)}>
                      {t('nav.register')}
                    </Link>
                    <div className="px-3 pt-1" onClick={() => setMobileOpen(false)}>
                      <AdminLoginButton />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
