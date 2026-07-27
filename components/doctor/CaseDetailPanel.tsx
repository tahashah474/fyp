'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import UrgencyBadge from '@/components/ui/UrgencyBadge'

interface CaseData {
  id: string
  created_at: string
  status: string
  ai_urgency_level?: string
  ai_possible_conditions?: string
  ai_first_aid?: string
  ai_disclaimer?: string
  ai_raw_response?: string
  symptoms_checklist?: string[]
  symptoms_freetext?: string
  symptom_photo_url?: string
  assigned_doctor_id?: string
  animals?: { name?: string; animal_type: string; age_years?: number; age_months?: number }
  profiles?: { full_name?: string }
}

interface Note {
  id: string
  content: string
  author_role: string
  created_at: string
  profiles?: { full_name?: string }
}

interface Props {
  caseData: CaseData
  doctorId: string
  onUpdate: (updatedCase: CaseData) => void
}

export default function CaseDetailPanel({ caseData, doctorId, onUpdate }: Props) {
  const { t, isRTL } = useI18n()
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [sendingNote, setSendingNote] = useState(false)
  const [takingCase, setTakingCase] = useState(false)
  const [noteError, setNoteError] = useState('')

  useEffect(() => {
    fetch(`/api/case-notes?caseId=${caseData.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotes(data) })
      .catch(console.error)
  }, [caseData.id])

  const handleTakeCase = async () => {
    setTakingCase(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'assigned', assigned_doctor_id: doctorId }),
      })
      const updated = await res.json()
      if (res.ok) onUpdate({ ...caseData, ...updated })
    } catch (err) {
      console.error('Take case error:', err)
    } finally {
      setTakingCase(false)
    }
  }

  const handleSendNote = async () => {
    if (!newNote.trim()) return
    setSendingNote(true)
    setNoteError('')
    try {
      const res = await fetch('/api/case-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: caseData.id, content: newNote.trim(), authorRole: 'doctor' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotes(prev => [...prev, data])
      setNewNote('')
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSendingNote(false)
    }
  }

  const isAssignedToMe = caseData.assigned_doctor_id === doctorId

  return (
    <div className={`space-y-4 sticky top-4 max-h-[calc(100vh-100px)] overflow-y-auto ${isRTL ? 'text-right' : ''}`}>
      {/* Header card */}
      <div className="card">
        <div className={`flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h2 className="font-bold text-pk-dark text-lg">{t('doctor.animal_info')}</h2>
            <div className="text-pk-dark/60 text-sm mt-1">
              {caseData.animals?.name || caseData.animals?.animal_type}
              {caseData.animals?.age_years ? ` · ${caseData.animals.age_years}y` : ''}
              {caseData.animals?.age_months ? ` ${caseData.animals.age_months}m` : ''}
            </div>
            <div className="text-pk-dark/50 text-sm">Farmer: {caseData.profiles?.full_name || 'Unknown'}</div>
            <div className="text-pk-dark/40 text-xs mt-0.5">{new Date(caseData.created_at).toLocaleString()}</div>
          </div>
          {caseData.ai_urgency_level && <UrgencyBadge level={caseData.ai_urgency_level} />}
        </div>

        {!isAssignedToMe && caseData.status === 'open' && (
          <button
            onClick={handleTakeCase}
            disabled={takingCase}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {takingCase && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
            👨‍⚕️ {t('doctor.take_case')}
          </button>
        )}
        {isAssignedToMe && (
          <div className="mt-3 text-pk-green text-sm font-semibold flex items-center gap-2">
            <span>✓</span> You are handling this case
          </div>
        )}
        {caseData.status === 'assigned' && !isAssignedToMe && (
          <div className="mt-3 text-pk-dark/50 text-sm">Assigned to another doctor</div>
        )}
      </div>

      {/* Symptoms */}
      <div className="card">
        <h3 className="font-bold text-pk-dark text-sm mb-3">{t('doctor.symptoms')}</h3>
        {caseData.symptoms_checklist && caseData.symptoms_checklist.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {caseData.symptoms_checklist.map(s => (
              <span key={s} className="bg-pk-cream text-pk-dark text-xs px-3 py-1 rounded-full border border-gray-200">
                {t(`farmer.${s}`)}
              </span>
            ))}
          </div>
        )}
        {caseData.symptoms_freetext && (
          <p className="text-sm text-pk-dark/70 bg-pk-cream/50 rounded-xl p-3">{caseData.symptoms_freetext}</p>
        )}
        {!caseData.symptoms_checklist?.length && !caseData.symptoms_freetext && (
          <p className="text-sm text-pk-dark/40">No symptoms recorded.</p>
        )}
      </div>

      {/* AI Triage */}
      <div className="card border-l-4 border-pk-sage bg-pk-sage/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🤖</span>
          <h3 className="font-bold text-pk-dark text-sm">{t('doctor.ai_triage')}</h3>
        </div>
        <p className="text-xs text-pk-dark/50 italic mb-3">{t('doctor.ai_label')}</p>
        {caseData.ai_possible_conditions && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-pk-dark/60 mb-1">Possible Conditions:</div>
            <div className="text-sm text-pk-dark/80 whitespace-pre-wrap">{caseData.ai_possible_conditions}</div>
          </div>
        )}
        {caseData.ai_first_aid && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-pk-dark/60 mb-1">First Aid Advised to Farmer:</div>
            <div className="text-sm text-pk-dark/80 whitespace-pre-wrap">{caseData.ai_first_aid}</div>
          </div>
        )}
        {!caseData.ai_possible_conditions && (
          <p className="text-sm text-pk-dark/40">No AI triage available for this case.</p>
        )}
      </div>

      {/* Notes thread */}
      <div className="card">
        <h3 className="font-bold text-pk-dark text-sm mb-4">{t('doctor.your_assessment')}</h3>
        {notes.length > 0 ? (
          <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
            {notes.map(note => (
              <div key={note.id} className={`rounded-xl p-3 text-sm ${
                note.author_role === 'doctor'
                  ? `bg-pk-green/10 border border-pk-green/20 ${isRTL ? 'mr-6' : 'ml-6'}`
                  : `bg-pk-cream border border-gray-100 ${isRTL ? 'ml-6' : 'mr-6'}`
              }`}>
                <div className="text-pk-dark/80">{note.content}</div>
                <div className="text-xs text-pk-dark/40 mt-1">
                  {note.author_role === 'doctor' ? '🩺 Dr.' : '🌾'} {note.profiles?.full_name || note.author_role}
                  {' · '}{new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-pk-dark/40 mb-4 text-center py-3">No messages yet. Take the case to start advising.</p>
        )}

        {noteError && <p className="text-pk-terra text-xs mb-2">❌ {noteError}</p>}

        <textarea
          className="input-field text-sm resize-none"
          rows={3}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder={isAssignedToMe ? t('doctor.write_note') : 'Take this case first to send notes'}
          disabled={!isAssignedToMe}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSendNote() }}
        />
        <button
          onClick={handleSendNote}
          disabled={!newNote.trim() || sendingNote || !isAssignedToMe}
          className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
        >
          {sendingNote && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {t('doctor.send_note')}
        </button>
        {!isAssignedToMe && (
          <p className="text-xs text-pk-dark/40 text-center mt-2">Take this case first to send notes</p>
        )}
      </div>
    </div>
  )
}
