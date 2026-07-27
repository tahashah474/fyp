'use client'

import { useI18n } from '@/lib/i18n/context'

interface LanguageToggleProps {
  variant?: 'light' | 'dark'
}

export default function LanguageToggle({ variant = 'dark' }: LanguageToggleProps) {
  const { t, toggleLang, lang } = useI18n()

  return (
    <button
      onClick={toggleLang}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
        transition-all duration-200 border-2
        ${variant === 'light'
          ? 'border-white/30 text-white hover:bg-white/10'
          : 'border-pk-green text-pk-green hover:bg-pk-green hover:text-white'
        }
        focus:outline-none focus:ring-2 focus:ring-pk-gold focus:ring-offset-2
      `}
      aria-label={`Switch to ${lang === 'en' ? 'Urdu' : 'English'}`}
    >
      <span className="text-base">{lang === 'en' ? '🇵🇰' : '🇬🇧'}</span>
      <span className={lang === 'ur' ? 'font-urdu' : ''}>{t('lang_toggle')}</span>
    </button>
  )
}
