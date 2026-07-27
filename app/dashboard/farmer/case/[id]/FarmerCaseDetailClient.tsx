'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import Navbar from '@/components/ui/Navbar'
import UrgencyBadge from '@/components/ui/UrgencyBadge'

interface CaseData {
  id: string
  created_at: string
  status: string
  ai_urgency_level?: string
  ai_possible_conditions?: string
  ai_first_aid?: string
  ai_disclaimer?: string
  symptoms_checklist?: string[]
  symptoms_freetext?: string
  animals?: { name?: string; animal_type: string }
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
  initialNotes: Note[]
  userId: string
}

const ANIMAL_ICONS: Record<string, string> = {
  cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', poultry: '🐔', horse: '🐴',
}

export default function FarmerCaseDetailClient({ caseData, initialNotes }: Props) {
  const { t, isRTL } = useI18n()
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [newNote, setNewNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSendNote = async () => {
    if (!newNote.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/case-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: caseData.id, content: newNote.trim(), authorRole: 'farmer' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotes(prev => [...prev, data])
      setNewNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/dashboard/farmer" className="text-pk-green text-sm font-semibold flex items-center gap-1 mb-6 hover:underline">
          ← {t('nav.dashboard')}
        </Link>

        <div className={`space-y-5 ${isRTL ? 'text-right' : ''}`}>
          {/* Case header */}
          <div className="card">
            <div className={`flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-3xl">{ANIMAL_ICONS[caseData.animals?.animal_type || ''] || '🐾'}</span>
                <div>
                  <h1 className="text-xl font-bold text-pk-dark">
                    {caseData.animals?.name || caseData.animals?.animal_type || 'Animal'}
                  </h1>
                  <p className="text-sm text-pk-dark/60">
                    {new Date(caseData.created_at).toLocaleDateString()} · <span className="capitalize">{caseData.status}</span>
                  </p>
                </div>
              </div>
              {caseData.ai_urgency_level && <UrgencyBadge level={caseData.ai_urgency_level} />}
            </div>
          </div>

          {/* Symptoms */}
          {(caseData.symptoms_checklist?.length || caseData.symptoms_freetext) && (
            <div className="card">
              <h2 className="font-bold text-pk-dark text-sm mb-3">{t('doctor.symptoms')}</h2>
              {caseData.symptoms_checklist && caseData.symptoms_checklist.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {caseData.symptoms_checklist.map(s => (
                    <span key={s} className="text-xs bg-pk-cream px-3 py-1 rounded-full border border-gray-200">
                      {t(`farmer.${s}`)}
                    </span>
                  ))}
                </div>
              )}
              {caseData.symptoms_freetext && (
                <p className="text-sm text-pk-dark/70 bg-pk-cream/50 rounded-xl p-3">{caseData.symptoms_freetext}</p>
              )}
            </div>
          )}

          {/* AI triage */}
          {(caseData.ai_possible_conditions || caseData.ai_first_aid) && (
            <div className="card border-l-4 border-pk-sage bg-pk-sage/5">
              <div className="flex items-center gap-2 mb-1">
                <span>🤖</span>
                <h2 className="font-bold text-pk-dark text-sm">{t('ai.ai_label')}</h2>
              </div>
              <p className="text-xs text-pk-dark/50 italic mb-4">{t('ai.ai_note')}</p>
              {caseData.ai_possible_conditions && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-pk-dark/60 mb-1">{t('ai.possible_conditions')}</div>
                  <div className="text-sm text-pk-dark/80 whitespace-pre-wrap">{caseData.ai_possible_conditions}</div>
                </div>
              )}
              {caseData.ai_first_aid && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-pk-dark/60 mb-1">{t('ai.first_aid')}</div>
                  <div className="text-sm text-pk-dark/80 whitespace-pre-wrap">{caseData.ai_first_aid}</div>
                </div>
              )}
              {caseData.ai_disclaimer && (
                <div className="text-xs text-pk-dark/50 border-t border-pk-sage/20 pt-3">{caseData.ai_disclaimer}</div>
              )}
            </div>
          )}

          {/* Notes / chat */}
          <div className="card">
            <h2 className="font-bold text-pk-dark text-sm mb-4">💬 Conversation with Doctor</h2>
            {notes.length === 0 ? (
              <p className="text-sm text-pk-dark/40 text-center py-6">
                No messages yet. A doctor will respond after reviewing your case.
              </p>
            ) : (
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {notes.map(note => (
                  <div key={note.id} className={`rounded-xl p-3 text-sm ${
                    note.author_role === 'doctor'
                      ? `bg-pk-green/10 border border-pk-green/20 ${isRTL ? 'mr-8' : 'ml-8'}`
                      : `bg-pk-cream border border-gray-100 ${isRTL ? 'ml-8' : 'mr-8'}`
                  }`}>
                    <div className="text-pk-dark/80">{note.content}</div>
                    <div className="text-xs text-pk-dark/40 mt-1.5">
                      {note.author_role === 'doctor' ? '🩺' : '🌾'} {note.profiles?.full_name || note.author_role}
                      {' · '}{new Date(note.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && <p className="text-pk-terra text-xs mb-2">❌ {error}</p>}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="input-field flex-1"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Write a message..."
                onKeyDown={e => e.key === 'Enter' && !sending && handleSendNote()}
              />
              <button onClick={handleSendNote} disabled={!newNote.trim() || sending} className="btn-primary px-5">
                {sending ? '⏳' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
