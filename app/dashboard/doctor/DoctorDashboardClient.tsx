'use client'

import { useState, useCallback, useEffect } from 'react'
import Navbar from '@/components/ui/Navbar'
import { useI18n } from '@/lib/i18n/context'
import UrgencyBadge from '@/components/ui/UrgencyBadge'
import CaseDetailPanel from '@/components/doctor/CaseDetailPanel'

interface DoctorProfile {
  id: string
  full_name: string
  city: string
  pvmc_number: string
  status: string
}

interface Case {
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

interface Props {
  userId: string
  profile: { full_name?: string }
  doctorProfile: DoctorProfile
  initialCases: Case[]
}

const ANIMAL_ICONS: Record<string, string> = {
  cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', poultry: '🐔', horse: '🐴',
}

export default function DoctorDashboardClient({ userId, doctorProfile, initialCases }: Props) {
  const { t, isRTL } = useI18n()
  const [cases, setCases] = useState<Case[]>(initialCases)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [tab, setTab] = useState<'my' | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchCases = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/cases/list')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCases(data)
        if (selectedCase) {
          const updated = data.find((c: Case) => c.id === selectedCase.id)
          if (updated) setSelectedCase(updated)
        }
      }
    } catch (err) {
      console.error('Fetch cases error:', err)
    } finally {
      setRefreshing(false)
    }
  }, [selectedCase])

  const handleRefresh = fetchCases

  // Auto-fetch fresh cases when component mounts
  useEffect(() => {
    fetchCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCaseUpdate = (updatedCase: Case) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? { ...c, ...updatedCase } : c))
    setSelectedCase(prev => prev?.id === updatedCase.id ? { ...prev, ...updatedCase } : prev)
  }

  // "My Cases" = assigned to this doctor
  const myCases = cases.filter(c => c.assigned_doctor_id === userId)
  // "All Cases" = open and unassigned OR all
  const allCases = cases

  const displayCases = tab === 'my' ? myCases : allCases
  const emergencyCount = cases.filter(c => c.ai_urgency_level === 'Emergency').length

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className={`mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse text-right' : ''}`}>
          <div>
            <h1 className="text-2xl font-bold text-pk-dark">🩺 {t('doctor.dashboard_title')}</h1>
            <p className="text-pk-dark/60 text-sm mt-0.5">
              Dr. {doctorProfile.full_name} · {doctorProfile.city} · PVMC: {doctorProfile.pvmc_number}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {emergencyCount > 0 && (
              <span className="bg-pk-terra text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                🚨 {emergencyCount} Emergency
              </span>
            )}
            <span className="bg-pk-green/10 border border-pk-green/30 text-pk-green text-xs font-semibold px-3 py-1.5 rounded-xl">
              ✓ Verified
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-sm border border-gray-200 bg-white px-3 py-1.5 rounded-xl hover:border-pk-green transition-all"
            >
              {refreshing
                ? <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-pk-green border-t-transparent" />
                : '🔄'
              }
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-warm mb-6 w-fit">
          <button
            onClick={() => setTab('all')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'all' ? 'bg-pk-green text-white' : 'text-pk-dark/60 hover:text-pk-dark'}`}
          >
            📋 All Open Cases ({allCases.length})
          </button>
          <button
            onClick={() => setTab('my')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'my' ? 'bg-pk-green text-white' : 'text-pk-dark/60 hover:text-pk-dark'}`}
          >
            📌 My Cases ({myCases.length})
          </button>
        </div>

        {/* Info banner */}
        {tab === 'my' && myCases.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-700 flex gap-2">
            <span>ℹ️</span>
            <span>No cases assigned to you yet. Cases in <strong>All Open Cases</strong> are available for you to take.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Case list */}
          <div>
            {displayCases.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">{tab === 'my' ? '📭' : '🎉'}</div>
                <p className="text-pk-dark/50 text-sm">
                  {tab === 'my' ? 'No cases assigned to you.' : 'No open cases right now.'}
                </p>
                <button onClick={handleRefresh} className="mt-3 text-pk-green text-sm hover:underline">
                  Refresh to check →
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {displayCases.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`card w-full text-start hover:shadow-warm-lg transition-all ${selectedCase?.id === c.id ? 'ring-2 ring-pk-green bg-pk-green/5' : ''} ${isRTL ? 'text-right' : ''}`}
                  >
                    <div className={`flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-start gap-3 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-2xl flex-shrink-0">{ANIMAL_ICONS[c.animals?.animal_type || ''] || '🐾'}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-pk-dark text-sm">
                            {c.animals?.name || c.animals?.animal_type || 'Animal'}
                          </div>
                          <div className="text-xs text-pk-dark/50 mt-0.5">
                            🌾 {c.profiles?.full_name || 'Farmer'} · {new Date(c.created_at).toLocaleString()}
                          </div>
                          {c.symptoms_checklist && c.symptoms_checklist.length > 0 && (
                            <div className="text-xs text-pk-dark/60 mt-1 truncate">
                              {c.symptoms_checklist.slice(0, 3).join(', ')}
                              {c.symptoms_checklist.length > 3 && ` +${c.symptoms_checklist.length - 3}`}
                            </div>
                          )}
                          {!c.ai_urgency_level && c.symptoms_freetext && (
                            <div className="text-xs text-pk-dark/60 mt-1 italic truncate">
                              &quot;{c.symptoms_freetext.substring(0, 60)}...&quot;
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {c.ai_urgency_level
                          ? <UrgencyBadge level={c.ai_urgency_level} size="sm" />
                          : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">No AI triage</span>
                        }
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.assigned_doctor_id === userId ? 'bg-pk-green/20 text-pk-green' :
                          c.status === 'assigned' ? 'bg-pk-gold/20 text-pk-dark' :
                          'bg-pk-sage/20 text-pk-dark'
                        }`}>
                          {c.assigned_doctor_id === userId ? '📌 Mine' : c.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Case detail */}
          <div>
            {selectedCase ? (
              <CaseDetailPanel
                caseData={selectedCase}
                doctorId={userId}
                onUpdate={handleCaseUpdate}
              />
            ) : (
              <div className="card text-center py-20 text-pk-dark/40 sticky top-4 border-2 border-dashed border-gray-200">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-sm font-medium">Select a case to view details</p>
                <p className="text-xs mt-1 text-pk-dark/30">Emergency cases are shown first</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
