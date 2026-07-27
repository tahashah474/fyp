'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import AITriageResult from './AITriageResult'

interface Animal {
  id: string
  animal_type: string
  name?: string
  tag_number?: string
  age_years?: number
  age_months?: number
}

interface Props {
  userId: string
  animals: Animal[]
  onClose: () => void
  onSuccess: (newCase: CaseResult) => void
}

interface CaseResult {
  id: string
  created_at: string
  status: string
  ai_urgency_level?: string
  symptoms_checklist?: string[]
  ai_possible_conditions?: string
  animals?: { name?: string; animal_type: string }
}

const SYMPTOM_KEYS = [
  'fever', 'loss_of_appetite', 'lameness', 'swelling', 'discharge',
  'diarrhea', 'coughing', 'skin_lesions', 'decreased_milk',
  'difficulty_breathing', 'bloating', 'weight_loss',
]

const ANIMAL_ICONS: Record<string, string> = {
  cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', poultry: '🐔', horse: '🐴',
}

interface AIResult {
  possibleConditions: string
  urgencyLevel: string
  firstAid: string
  disclaimer: string
  raw: string
}

type Step = 'form' | 'analyzing' | 'result' | 'saving' | 'error'

export default function ReportCaseModal({ userId, animals, onClose, onSuccess }: Props) {
  const { t, lang, isRTL } = useI18n()

  const [step, setStep] = useState<Step>('form')
  const [selectedAnimalId, setSelectedAnimalId] = useState(animals[0]?.id || '')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null)

  const toggleSymptom = (key: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    )
  }

  const selectedAnimal = animals.find(a => a.id === selectedAnimalId)

  const validate = () => {
    if (!selectedAnimalId) { setError('Please select an animal.'); return false }
    if (selectedSymptoms.length === 0 && !freeText.trim()) {
      setError('Please select at least one symptom or describe the problem.')
      return false
    }
    setError('')
    return true
  }

  // Upload photo helper
  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null
    const supabase = createClient()
    const ext = photoFile.name.split('.').pop()
    const filePath = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('symptom-photos').upload(filePath, photoFile)
    return error ? null : filePath
  }

  // Save case to DB (no AI)
  const saveCase = async (aiData?: AIResult, photoUrl?: string | null): Promise<CaseResult | null> => {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animal_id: selectedAnimalId,
        symptoms_checklist: selectedSymptoms,
        symptoms_freetext: freeText.trim() || null,
        symptom_photo_url: photoUrl ?? null,
        ai_possible_conditions: aiData?.possibleConditions ?? null,
        ai_urgency_level: aiData?.urgencyLevel ?? null,
        ai_first_aid: aiData?.firstAid ?? null,
        ai_disclaimer: aiData?.disclaimer ?? null,
        ai_raw_response: aiData?.raw ?? null,
        ai_language: lang,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to save case')
    return data
  }

  // ── PATH 1: Just save case, then open Find Doctor ──
  const handleSaveAndFindDoctor = async () => {
    if (!validate()) return
    setStep('saving')
    setStatusMsg('Saving your case...')
    try {
      const photoUrl = await uploadPhoto()
      const newCase = await saveCase(undefined, photoUrl)
      if (newCase) {
        setSavedCaseId(newCase.id)
        onSuccess(newCase)
      }
      onClose()
      // Open find doctor modal
      setTimeout(() => document.dispatchEvent(new CustomEvent('open-find-doctor')), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save case')
      setStep('error')
    }
  }

  // ── PATH 2: Save case + run AI triage ──
  const handleSaveWithAI = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setStep('analyzing')
    setError('')
    setStatusMsg('Uploading and analyzing...')
    try {
      const photoUrl = await uploadPhoto()

      setStatusMsg('Analyzing symptoms with AI...')
      const aiResponse = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalType: selectedAnimal?.animal_type,
          animalAge: { years: selectedAnimal?.age_years, months: selectedAnimal?.age_months },
          symptoms: selectedSymptoms.map(s => t(`farmer.${s}`)),
          freeText: freeText.trim(),
          language: lang,
          photoCaption: photoFile ? `Photo of ${selectedAnimal?.animal_type}` : null,
        }),
      })

      const aiData = await aiResponse.json()
      if (!aiResponse.ok) throw new Error(aiData.error || 'AI service error')
      if (!aiData.possibleConditions || !aiData.urgencyLevel) throw new Error('AI returned incomplete response')

      setAiResult(aiData)
      setStatusMsg('Saving case...')

      const newCase = await saveCase(aiData, photoUrl)
      if (newCase) {
        setSavedCaseId(newCase.id)
        onSuccess(newCase)
      }
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-warm-lg w-full max-w-2xl animate-slide-up my-4 ${isRTL ? 'text-right' : ''}`}>
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-pk-dark">
              {step === 'form' && '📋 Report a Case'}
              {(step === 'analyzing' || step === 'saving') && '⏳ Please wait...'}
              {step === 'result' && '🤖 AI Assessment'}
              {step === 'error' && '❌ Error'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-pk-dark/60">✕</button>
          </div>

          {/* ── FORM ── */}
          {step === 'form' && (
            <form onSubmit={handleSaveWithAI} className="space-y-5">
              {error && (
                <div className="bg-pk-terra/10 border border-pk-terra/30 text-pk-terra text-sm rounded-xl p-3">❌ {error}</div>
              )}

              {/* Animal */}
              <div>
                <label className="label-text">{t('farmer.select_animal')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {animals.map(animal => (
                    <button key={animal.id} type="button" onClick={() => setSelectedAnimalId(animal.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${selectedAnimalId === animal.id ? 'border-pk-green bg-pk-green/5' : 'border-gray-200 hover:border-pk-sage'}`}>
                      <div className="text-xl">{ANIMAL_ICONS[animal.animal_type] || '🐾'}</div>
                      <div className="text-xs font-medium text-pk-dark mt-1 truncate">{animal.name || animal.tag_number || animal.animal_type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="label-text">{t('farmer.symptoms_title')}</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SYMPTOM_KEYS.map(key => (
                    <label key={key} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${selectedSymptoms.includes(key) ? 'border-pk-green bg-pk-green/5' : 'border-gray-200 hover:border-pk-sage/60'} ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input type="checkbox" checked={selectedSymptoms.includes(key)} onChange={() => toggleSymptom(key)} className="flex-shrink-0" />
                      <span className="text-sm text-pk-dark">{t(`farmer.${key}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Free text */}
              <div>
                <label className="label-text">{t('farmer.freetext_label')}</label>
                <textarea className="input-field min-h-[90px] resize-y" value={freeText} onChange={e => setFreeText(e.target.value)} placeholder={t('farmer.freetext_placeholder')} />
              </div>

              {/* Photo */}
              <div>
                <label className="label-text">{t('farmer.photo_label')}</label>
                <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="input-field pt-2" />
                {photoFile && <p className="text-xs text-pk-sage mt-1">✓ {photoFile.name}</p>}
              </div>

              {/* THREE action buttons */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-pk-dark/50 mb-3 text-center">Choose how to proceed:</p>
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${isRTL ? 'direction-rtl' : ''}`}>

                  {/* Cancel */}
                  <button type="button" onClick={onClose}
                    className="btn-outline py-3 flex flex-col items-center gap-1">
                    <span className="text-lg">✕</span>
                    <span className="text-sm font-semibold">Cancel</span>
                  </button>

                  {/* Ask AI */}
                  <button type="submit"
                    className="bg-pk-gold hover:bg-pk-gold-light text-pk-dark py-3 rounded-2xl font-semibold transition-all flex flex-col items-center gap-1 shadow-gold">
                    <span className="text-lg">🤖</span>
                    <span className="text-sm font-semibold">Get AI Assessment</span>
                    <span className="text-xs opacity-70">then send to doctor</span>
                  </button>

                  {/* Send directly to doctor */}
                  <button type="button" onClick={handleSaveAndFindDoctor}
                    className="btn-primary py-3 flex flex-col items-center gap-1">
                    <span className="text-lg">👨‍⚕️</span>
                    <span className="text-sm font-semibold">Send to Doctor</span>
                    <span className="text-xs opacity-70">skip AI, go direct</span>
                  </button>

                </div>
              </div>
            </form>
          )}

          {/* ── LOADING ── */}
          {(step === 'analyzing' || step === 'saving') && (
            <div className="py-16 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-pk-green/20 border-t-pk-green animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  {step === 'saving' ? '💾' : '🤖'}
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-pk-dark text-lg">{statusMsg}</p>
                <p className="text-pk-dark/50 text-sm mt-1">
                  {step === 'analyzing' ? 'AI analysis takes 5–10 seconds' : 'Almost done...'}
                </p>
              </div>
              <div className="flex gap-2">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2 h-2 bg-pk-green rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── AI RESULT ── */}
          {step === 'result' && aiResult && (
            <AITriageResult
              result={aiResult}
              caseId={savedCaseId}
              onConnectDoctor={() => {
                onClose()
                setTimeout(() => document.dispatchEvent(new CustomEvent('open-find-doctor')), 100)
              }}
              onClose={onClose}
            />
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <div className="py-8 text-center space-y-4">
              <div className="text-5xl">😕</div>
              <h3 className="font-bold text-pk-dark text-lg">Something went wrong</h3>
              <div className="bg-pk-terra/10 border border-pk-terra/30 text-pk-terra text-sm rounded-xl p-4 text-left">{error}</div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setStep('form'); setError('') }} className="btn-primary">Try Again</button>
                <button onClick={onClose} className="btn-outline">Close</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
