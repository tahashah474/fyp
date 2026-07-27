'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'

interface Doctor {
  id: string
  full_name: string
  university: string
  city: string
  clinic_name?: string
  pvmc_number: string
  graduation_year: number
}

interface Case {
  id: string
  created_at: string
  status: string
  ai_urgency_level?: string
  animals?: { name?: string; animal_type: string }
}

interface Props {
  cases: Case[]
  onClose: () => void
  onAssigned: () => void
}

const ANIMAL_ICONS: Record<string, string> = {
  cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', poultry: '🐔', horse: '🐴',
}

export default function FindDoctorModal({ cases, onClose, onAssigned }: Props) {
  const { isRTL } = useI18n()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  // Allow all cases (open or assigned), default to most recent
  const [selectedCase, setSelectedCase] = useState<Case | null>(
    cases.find(c => c.status === 'open') || cases[0] || null
  )
  const [assigning, setAssigning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/doctors')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDoctors(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter(d =>
    search === '' ||
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    d.city.toLowerCase().includes(search.toLowerCase())
  )

  const handleAssign = async () => {
    if (!selectedDoctor || !selectedCase) return
    setAssigning(true)
    setError('')
    try {
      const res = await fetch('/api/cases/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: selectedCase.id, doctorId: selectedDoctor.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign')
      setSuccess(true)
      setTimeout(() => { onAssigned(); onClose() }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-warm-lg w-full max-w-2xl my-4 animate-slide-up ${isRTL ? 'text-right' : ''}`}>
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-pk-dark">👨‍⚕️ Send Case to a Doctor</h2>
              <p className="text-pk-dark/60 text-sm mt-0.5">Pick a verified doctor — they will review your case and respond</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-pk-dark/60">✕</button>
          </div>

          {success ? (
            <div className="py-12 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-bold text-pk-dark text-lg mb-1">Case Sent!</h3>
              <p className="text-pk-dark/60 text-sm">
                Sent to Dr. {selectedDoctor?.full_name}. They will review and respond shortly.
              </p>
            </div>
          ) : (
            <>
              {/* No cases at all */}
              {cases.length === 0 && (
                <div className="bg-pk-gold/10 border border-pk-gold/30 rounded-xl p-4 mb-5 text-sm text-pk-dark/70">
                  ⚠️ You don&apos;t have any cases yet. First use <strong>Report a Case</strong> to describe your animal&apos;s symptoms, then come back here to send it to a doctor.
                </div>
              )}

              {/* Case selector — show all cases */}
              {cases.length > 0 && (
                <div className="mb-5">
                  <label className="label-text mb-2 block">
                    Select case to send {cases.length > 1 ? `(${cases.length} cases)` : ''}:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {cases.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        className={`p-3 rounded-xl border-2 text-start transition-all ${
                          selectedCase?.id === c.id
                            ? 'border-pk-green bg-pk-green/5'
                            : 'border-gray-200 hover:border-pk-sage'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{ANIMAL_ICONS[c.animals?.animal_type || ''] || '🐾'}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-pk-dark truncate">
                              {c.animals?.name || c.animals?.animal_type || 'Animal'}
                            </div>
                            <div className="text-xs text-pk-dark/50 flex items-center gap-1">
                              {new Date(c.created_at).toLocaleDateString()}
                              {c.ai_urgency_level === 'Emergency' && (
                                <span className="text-pk-terra font-bold">🚨</span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                c.status === 'open' ? 'bg-pk-sage/20 text-pk-dark' : 'bg-pk-gold/20 text-pk-dark'
                              }`}>{c.status}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search doctors */}
              <div className="mb-3">
                <label className="label-text mb-2 block">Search doctors:</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search by name or city..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus={cases.length > 0}
                />
              </div>

              {/* Doctor list */}
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4 border border-gray-100 rounded-xl p-2">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8 text-pk-dark/50">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-sm">
                      {doctors.length === 0
                        ? 'No verified doctors yet. Doctors are approved by admin after review.'
                        : 'No doctors match your search.'
                      }
                    </p>
                  </div>
                ) : (
                  filtered.map(doctor => (
                    <button
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`w-full p-3 rounded-xl border-2 text-start transition-all ${
                        selectedDoctor?.id === doctor.id
                          ? 'border-pk-green bg-pk-green/5'
                          : 'border-gray-200 hover:border-pk-sage hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-xl flex-shrink-0">🩺</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-pk-dark text-sm">Dr. {doctor.full_name}</div>
                            <div className="text-xs text-pk-dark/60">
                              📍 {doctor.city}{doctor.clinic_name && ` · ${doctor.clinic_name}`}
                            </div>
                            <div className="text-xs text-pk-dark/40">
                              🎓 {doctor.university} ({doctor.graduation_year})
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-pk-green text-xs font-semibold">✓ Verified</div>
                          <div className="font-mono text-xs text-pk-dark/40">{doctor.pvmc_number}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {error && (
                <div className="bg-pk-terra/10 border border-pk-terra/30 text-pk-terra text-sm rounded-xl p-3 mb-4">
                  ❌ {error}
                </div>
              )}

              {/* Summary */}
              {selectedDoctor && selectedCase && (
                <div className="bg-pk-green/5 border border-pk-green/20 rounded-xl p-3 mb-4 text-sm">
                  <span className="text-pk-dark/70">
                    Sending <strong>{selectedCase.animals?.name || selectedCase.animals?.animal_type || 'case'}</strong>
                    {' '}→ <strong>Dr. {selectedDoctor.full_name}</strong>, {selectedDoctor.city}
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedDoctor || !selectedCase || assigning || cases.length === 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                  {assigning ? 'Sending...' : '📤 Send to Doctor'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
