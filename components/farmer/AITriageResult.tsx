'use client'

import { useI18n } from '@/lib/i18n/context'
import UrgencyBadge from '@/components/ui/UrgencyBadge'

interface AIResult {
  possibleConditions: string
  urgencyLevel: string
  firstAid: string
  disclaimer: string
  raw: string
}

interface Props {
  result: AIResult
  caseId: string | null
  onConnectDoctor: () => void
  onClose: () => void
}

export default function AITriageResult({ result, onConnectDoctor, onClose }: Props) {
  const { t, isRTL } = useI18n()

  const isEmergency = result.urgencyLevel === 'Emergency' || result.urgencyLevel?.includes('ہنگامی')
  const isUrgent = isEmergency || result.urgencyLevel === 'See a vet soon' || result.urgencyLevel?.includes('جلد')

  return (
    <div className={`space-y-5 animate-fade-in ${isRTL ? 'text-right' : ''}`}>
      {/* AI label banner */}
      <div className="bg-pk-sage/10 border border-pk-sage/30 rounded-xl p-3 flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <div className="font-semibold text-pk-dark text-sm">{t('ai.ai_label')}</div>
          <div className="text-xs text-pk-dark/60">{t('ai.ai_note')}</div>
        </div>
      </div>

      {/* Emergency banner */}
      {isEmergency && (
        <div className="bg-pk-terra/10 border-2 border-pk-terra rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">🚨</span>
          <div>
            <div className="font-bold text-pk-terra">{t('doctor.emergency')}</div>
            <div className="text-sm text-pk-terra/80">Please contact a vet immediately!</div>
          </div>
        </div>
      )}

      {/* Urgency */}
      <div className="card bg-pk-cream/50 border border-gray-100">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''} mb-2`}>
          <h3 className="font-bold text-pk-dark text-sm">{t('ai.urgency_level')}</h3>
        </div>
        <UrgencyBadge level={result.urgencyLevel} size="lg" />
      </div>

      {/* Possible conditions */}
      <div className="card bg-pk-cream/50 border border-gray-100">
        <h3 className="font-bold text-pk-dark text-sm mb-3">🔍 {t('ai.possible_conditions')}</h3>
        <div className="text-pk-dark/80 text-sm leading-relaxed whitespace-pre-wrap">
          {result.possibleConditions}
        </div>
      </div>

      {/* First aid */}
      <div className="card bg-pk-green/5 border border-pk-green/20">
        <h3 className="font-bold text-pk-dark text-sm mb-3">💊 {t('ai.first_aid')}</h3>
        <div className="text-pk-dark/80 text-sm leading-relaxed whitespace-pre-wrap">
          {result.firstAid}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-pk-dark text-xs mb-2 uppercase tracking-wide">⚠️ {t('ai.disclaimer')}</h3>
        <div className="text-pk-dark/60 text-xs leading-relaxed whitespace-pre-wrap">
          {result.disclaimer}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex flex-col sm:flex-row gap-3 pt-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        {isUrgent && (
          <button
            onClick={onConnectDoctor}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-white transition-all ${
              isEmergency ? 'bg-pk-terra hover:bg-red-700' : 'bg-pk-green hover:bg-pk-green-light'
            }`}
          >
            <span>👨‍⚕️</span>
            {t('ai.connect_vet')}
          </button>
        )}
        {!isUrgent && (
          <button
            onClick={onConnectDoctor}
            className="flex-1 btn-outline flex items-center justify-center gap-2"
          >
            👨‍⚕️ {t('ai.connect_vet')}
          </button>
        )}
        <button onClick={onClose} className="btn-outline sm:w-auto px-6">
          ✓ Done
        </button>
      </div>
    </div>
  )
}
