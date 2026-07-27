'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from './en.json'
import ur from './ur.json'

type Language = 'en' | 'ur'

interface I18nContextType {
  lang: Language
  t: (key: string) => string
  toggleLang: () => void
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

function getNestedValue(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return key // fallback to key if not found
    }
  }
  return typeof current === 'string' ? current : key
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('malshifa-lang') as Language | null
    if (stored === 'ur' || stored === 'en') {
      setLang(stored)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    html.dir = lang === 'ur' ? 'rtl' : 'ltr'
    html.lang = lang
    document.body.classList.toggle('font-urdu', lang === 'ur')
    document.body.classList.toggle('font-latin', lang === 'en')
  }, [lang, mounted])

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'ur' : 'en'
      localStorage.setItem('malshifa-lang', next)
      return next
    })
  }, [])

  const t = useCallback((key: string): string => {
    const translations = lang === 'ur' ? ur : en
    return getNestedValue(translations as Record<string, unknown>, key)
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang, isRTL: lang === 'ur' }}>
      <div
        className={`transition-all duration-300 ${lang === 'ur' ? 'font-urdu' : 'font-sans'}`}
        style={{ opacity: mounted ? 1 : 0 }}
      >
        {children}
      </div>
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
