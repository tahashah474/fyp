'use client'

import { useI18n } from '@/lib/i18n/context'

interface UrgencyBadgeProps {
  level: 'Emergency' | 'See a vet soon' | 'Monitor at home' | string
  size?: 'sm' | 'md' | 'lg'
}

export default function UrgencyBadge({ level, size = 'md' }: UrgencyBadgeProps) {
  const { t } = useI18n()

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }[size]

  const baseClass = `inline-flex items-center gap-1.5 rounded-full font-bold ${sizeClass}`

  if (level === 'Emergency') {
    return (
      <span className={`${baseClass} bg-pk-terra text-white`}>
        <span>🚨</span>
        <span>{t('doctor.emergency')}</span>
      </span>
    )
  }

  if (level === 'See a vet soon') {
    return (
      <span className={`${baseClass} bg-pk-gold text-pk-dark`}>
        <span>⚠️</span>
        <span>{t('doctor.see_vet_soon')}</span>
      </span>
    )
  }

  return (
    <span className={`${baseClass} bg-pk-sage text-white`}>
      <span>👁️</span>
      <span>{t('doctor.monitor')}</span>
    </span>
  )
}
