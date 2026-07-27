'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import AdminLoginButton from '@/components/ui/AdminLoginButton'
import { useI18n } from '@/lib/i18n/context'
import { CowMotif, GoatMotif, HenMotif } from '@/components/ui/AnimalMotif'

export default function LandingPage() {
  const { t, isRTL } = useI18n()

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar transparent />

      {/* Hero */}
      <section className="relative bg-pk-green text-white overflow-hidden pt-16">
        {/* Background motifs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <CowMotif className="absolute top-8 right-8 w-64 h-44 text-white" />
          <GoatMotif className="absolute bottom-4 left-4 w-40 h-32 text-white" />
          <HenMotif className="absolute bottom-8 right-1/3 w-28 h-28 text-white" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className={`max-w-2xl ${isRTL ? 'ms-auto text-right' : ''} animate-slide-up`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">🐄</span>
              <h1 className="text-4xl sm:text-5xl font-bold">
                <span className="font-urdu text-pk-gold">{t('landing.hero_title')}</span>
              </h1>
            </div>
            <p className="text-xl text-white/85 mb-10 leading-relaxed">
              {t('landing.hero_subtitle')}
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <Link
                href="/auth/signup?role=farmer"
                className="btn-gold text-center text-lg"
              >
                🌾 {t('landing.cta_farmer')}
              </Link>
              <Link
                href="/auth/signup?role=doctor"
                className="btn-outline border-white text-white hover:bg-white hover:text-pk-green text-center text-lg"
              >
                🩺 {t('landing.cta_doctor')}
              </Link>
            </div>

            {/* Admin quick access */}
            <div className={`mt-6 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="h-px flex-1 bg-white/20" />
              <span className="text-white/50 text-xs">Admin access</span>
              <div className="h-px flex-1 bg-white/20" />
            </div>
            <div className={`mt-3 flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <AdminLoginButton />
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 64" preserveAspectRatio="none">
            <path d="M0,64 C360,0 1080,64 1440,0 L1440,64 Z" fill="#F4EDE4" />
          </svg>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className={`text-center mb-14 ${isRTL ? 'text-right' : ''}`}>
          <h2 className="section-title text-3xl font-bold text-pk-green">{t('landing.how_it_works')}</h2>
          <div className="w-16 h-1 bg-pk-gold rounded-full mt-3 mx-auto" />
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${isRTL ? 'md:grid-flow-col-dense direction-rtl' : ''}`}>
          {[
            {
              icon: '📋',
              step: '01',
              title: t('landing.step1_title'),
              desc: t('landing.step1_desc'),
            },
            {
              icon: '🤖',
              step: '02',
              title: t('landing.step2_title'),
              desc: t('landing.step2_desc'),
            },
            {
              icon: '👨‍⚕️',
              step: '03',
              title: t('landing.step3_title'),
              desc: t('landing.step3_desc'),
            },
          ].map((item) => (
            <div key={item.step} className={`card text-center hover:shadow-warm-lg transition-all duration-300 group ${isRTL ? 'text-right' : ''}`}>
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
              <div className="text-pk-gold font-bold text-sm mb-2 tracking-wider">
                {item.step}
              </div>
              <h3 className="text-lg font-bold text-pk-dark mb-3">{item.title}</h3>
              <p className="text-pk-dark/65 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust section */}
      <section className="bg-pk-green/5 border-t border-pk-green/10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col md:flex-row items-center gap-8 ${isRTL ? 'md:flex-row-reverse text-right' : ''}`}>
            <div className="text-7xl flex-shrink-0">🛡️</div>
            <div>
              <div className="inline-flex items-center gap-2 bg-pk-green text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                <span>✓</span>
                {t('landing.trust_badge')}
              </div>
              <h2 className="text-2xl font-bold text-pk-dark mb-3">{t('landing.trust_title')}</h2>
              <p className="text-pk-dark/70 leading-relaxed">{t('landing.trust_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Animal types */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className={`text-center mb-10 ${isRTL ? 'text-right' : ''}`}>
          <p className="text-pk-dark/50 text-sm font-semibold tracking-widest uppercase mb-4">Supported Animals</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {['🐄 Cow', '🐃 Buffalo', '🐐 Goat', '🐑 Sheep', '🐔 Poultry', '🐴 Horse'].map((animal) => (
            <div
              key={animal}
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-warm text-pk-dark font-medium text-sm hover:shadow-warm-lg transition-shadow"
            >
              {animal}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-pk-green py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t('app_name')}</h2>
          <p className="text-white/80 mb-8 text-lg">{t('app_tagline')}</p>
          <Link href="/auth/signup?role=farmer" className="btn-gold text-lg inline-block">
            {t('landing.cta_farmer')} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-pk-dark text-pk-cream/60 text-center py-8 text-sm">
        <p>{t('landing.footer_rights')}</p>
      </footer>
    </div>
  )
}
