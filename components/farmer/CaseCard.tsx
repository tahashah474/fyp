'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import UrgencyBadge from '@/components/ui/UrgencyBadge'

interface CaseData {
  id: string
  created_at: string
  ai_urgency_level?: string
  status: string
  symptoms_checklist?: string[]
  ai_possible_conditions?: string
  animals?: { name?: string; animal_type: string }
}

const ANIMAL_ICONS: Record<string, string> = {
  cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', poultry: '🐔', horse: '🐴',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-pk-sage/20 text-pk-dark',
  assigned: 'bg-pk-gold/20 text-pk-dark',
  resolved: 'bg-pk-green/20 text-pk-green',
  closed: 'bg-gray-100 text-gray-500',
}

export default function CaseCard({ caseData }: { caseData: CaseData }) {
  const { t, isRTL } = useI18n()
  const date = new Date(caseData.created_at).toLocaleDateString()
  const animalIcon = ANIMAL_ICONS[caseData.animals?.animal_type || ''] || '🐾'

  return (
    <div className={`card hover:shadow-warm-lg transition-all ${isRTL ? 'text-right' : ''}`}>
      <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="text-3xl flex-shrink-0">{animalIcon}</div>
          <div>
            <div className="font-bold text-pk-dark">
              {caseData.animals?.name || caseData.animals?.animal_type || 'Animal'}
            </div>
            <div className="text-xs text-pk-dark/50 mt-0.5">{date}</div>
            {caseData.symptoms_checklist && caseData.symptoms_checklist.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {caseData.symptoms_checklist.slice(0, 3).map(s => (
                  <span key={s} className="text-xs bg-pk-cream px-2 py-0.5 rounded-full text-pk-dark/60">
                    {t(`farmer.${s}`)}
                  </span>
                ))}
                {caseData.symptoms_checklist.length > 3 && (
                  <span className="text-xs text-pk-dark/40">+{caseData.symptoms_checklist.length - 3}</span>
                )}
              </div>
            )}
            {caseData.ai_possible_conditions && (
              <p className="text-xs text-pk-dark/60 mt-2 line-clamp-2">
                {caseData.ai_possible_conditions.substring(0, 100)}...
              </p>
            )}
          </div>
        </div>

        <div className={`flex flex-col items-end gap-2 ${isRTL ? 'items-start' : ''} flex-shrink-0`}>
          {caseData.ai_urgency_level && (
            <UrgencyBadge level={caseData.ai_urgency_level} size="sm" />
          )}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[caseData.status] || 'bg-gray-100'}`}>
            {t(`doctor.${caseData.status}`)}
          </span>
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t border-gray-100 flex ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
        <Link
          href={`/dashboard/farmer/case/${caseData.id}`}
          className="text-sm text-pk-green font-semibold hover:underline"
        >
          {t('farmer.view_case')} →
        </Link>
      </div>
    </div>
  )
}
