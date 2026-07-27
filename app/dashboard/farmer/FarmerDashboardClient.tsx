'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/ui/Navbar'
import { useI18n } from '@/lib/i18n/context'
import AddAnimalModal from '@/components/farmer/AddAnimalModal'
import ReportCaseModal from '@/components/farmer/ReportCaseModal'
import FindDoctorModal from '@/components/farmer/FindDoctorModal'
import CaseCard from '@/components/farmer/CaseCard'
import { CowMotif } from '@/components/ui/AnimalMotif'

interface Animal {
  id: string
  animal_type: string
  name?: string
  tag_number?: string
  age_years?: number
  age_months?: number
}

interface Case {
  id: string
  created_at: string
  ai_urgency_level?: string
  status: string
  symptoms_checklist?: string[]
  ai_possible_conditions?: string
  animals?: { name?: string; animal_type: string }
}

interface Props {
  userId: string
  profile: { full_name?: string }
  initialAnimals: Animal[]
  initialCases: Case[]
}

const ANIMAL_ICONS: Record<string, string> = {
  cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', poultry: '🐔', horse: '🐴',
}

export default function FarmerDashboardClient({ userId, profile, initialAnimals, initialCases }: Props) {
  const { t, isRTL } = useI18n()
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals)
  const [cases, setCases] = useState<Case[]>(initialCases)
  const [showAddAnimal, setShowAddAnimal] = useState(false)
  const [showReportCase, setShowReportCase] = useState(false)
  const [showFindDoctor, setShowFindDoctor] = useState(false)
  const [activeTab, setActiveTab] = useState<'animals' | 'cases'>('animals')

  const handleAnimalAdded = (animal: Animal) => {
    setAnimals(prev => [animal, ...prev])
    setShowAddAnimal(false)
  }

  const handleCaseAdded = (newCase: Case) => {
    setCases(prev => [newCase, ...prev])
    setShowReportCase(false)
  }

  // Listen for "Send to Doctor" button inside ReportCaseModal
  useEffect(() => {
    const handler = () => {
      setShowReportCase(false)
      setShowFindDoctor(true)
    }
    document.addEventListener('open-find-doctor', handler)
    return () => document.removeEventListener('open-find-doctor', handler)
  }, [])

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className={`mb-8 ${isRTL ? 'text-right' : ''}`}>
          <h1 className="text-2xl font-bold text-pk-dark">
            👋 {profile?.full_name || t('nav.dashboard')}
          </h1>
          <p className="text-pk-dark/60 mt-1">{t('app_tagline')}</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setShowAddAnimal(true)}
            className="card hover:shadow-warm-lg transition-all flex items-center gap-4 text-start group"
          >
            <div className="w-12 h-12 bg-pk-green/10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🐄
            </div>
            <div>
              <div className="font-bold text-pk-dark">{t('farmer.add_animal')}</div>
              <div className="text-sm text-pk-dark/55">{animals.length} {isRTL ? 'جانور' : 'animals registered'}</div>
            </div>
          </button>

          <button
            onClick={() => animals.length > 0 ? setShowReportCase(true) : setShowAddAnimal(true)}
            className="card hover:shadow-warm-lg transition-all flex items-center gap-4 text-start group"
          >
            <div className="w-12 h-12 bg-pk-gold/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📋
            </div>
            <div>
              <div className="font-bold text-pk-dark">{t('farmer.report_case')}</div>
              <div className="text-sm text-pk-dark/55">{cases.length} {isRTL ? 'کیسز' : 'cases reported'}</div>
            </div>
          </button>

          <button
            onClick={() => setShowFindDoctor(true)}
            className="card hover:shadow-warm-lg transition-all flex items-center gap-4 text-start group border-2 border-pk-green/20"
          >
            <div className="w-12 h-12 bg-pk-green/10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              👨‍⚕️
            </div>
            <div>
              <div className="font-bold text-pk-dark">Find a Doctor</div>
              <div className="text-sm text-pk-dark/55">Report problem directly</div>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-warm mb-6 w-fit">
          <button
            onClick={() => setActiveTab('animals')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'animals'
                ? 'bg-pk-green text-white shadow-sm'
                : 'text-pk-dark/60 hover:text-pk-dark'
            }`}
          >
            🐄 {t('farmer.my_animals')} ({animals.length})
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'cases'
                ? 'bg-pk-green text-white shadow-sm'
                : 'text-pk-dark/60 hover:text-pk-dark'
            }`}
          >
            📋 {t('farmer.case_history')} ({cases.length})
          </button>
        </div>

        {/* Animals tab */}
        {activeTab === 'animals' && (
          <div className="animate-fade-in">
            {animals.length === 0 ? (
              <div className={`card text-center py-16 ${isRTL ? 'text-right' : ''}`}>
                <div className="relative flex justify-center mb-4">
                  <CowMotif className="w-40 h-28 text-pk-sage" />
                </div>
                <p className="text-pk-dark/60 mb-4">{t('farmer.no_animals')}</p>
                <button onClick={() => setShowAddAnimal(true)} className="btn-primary">
                  + {t('farmer.add_animal')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {animals.map(animal => (
                  <div key={animal.id} className="card-hover">
                    <div className="text-3xl mb-3">{ANIMAL_ICONS[animal.animal_type] || '🐾'}</div>
                    <h3 className="font-bold text-pk-dark">
                      {animal.name || animal.tag_number || `${animal.animal_type}`}
                    </h3>
                    <p className="text-sm text-pk-dark/60 mt-1 capitalize">{animal.animal_type}</p>
                    {(animal.age_years || animal.age_months) && (
                      <p className="text-xs text-pk-dark/50 mt-1">
                        {animal.age_years ? `${animal.age_years}y ` : ''}{animal.age_months ? `${animal.age_months}m` : ''}
                      </p>
                    )}
                    <button
                      onClick={() => setShowReportCase(true)}
                      className="mt-4 w-full btn-outline text-sm py-2"
                    >
                      📋 {t('farmer.report_case')}
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddAnimal(true)}
                  className="card border-2 border-dashed border-pk-sage/40 flex flex-col items-center justify-center gap-3 text-pk-dark/50 hover:border-pk-green hover:text-pk-green transition-all py-10"
                >
                  <span className="text-3xl">+</span>
                  <span className="text-sm font-medium">{t('farmer.add_animal')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cases tab */}
        {activeTab === 'cases' && (
          <div className="animate-fade-in space-y-4">
            {cases.length === 0 ? (
              <div className="card text-center py-16">
                <p className="text-pk-dark/60 mb-4">{t('farmer.no_cases')}</p>
                {animals.length > 0 && (
                  <button onClick={() => setShowReportCase(true)} className="btn-primary">
                    + {t('farmer.report_case')}
                  </button>
                )}
              </div>
            ) : (
              cases.map(c => <CaseCard key={c.id} caseData={c} />)
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddAnimal && (
        <AddAnimalModal
          userId={userId}
          onClose={() => setShowAddAnimal(false)}
          onSuccess={handleAnimalAdded}
        />
      )}
      {showReportCase && (
        <ReportCaseModal
          userId={userId}
          animals={animals}
          onClose={() => setShowReportCase(false)}
          onSuccess={handleCaseAdded}
        />
      )}
      {showFindDoctor && (
        <FindDoctorModal
          cases={cases}
          onClose={() => setShowFindDoctor(false)}
          onAssigned={() => {
            setShowFindDoctor(false)
            setActiveTab('cases')
          }}
        />
      )}
    </div>
  )
}
