'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  userId: string
  onClose: () => void
  onSuccess: (animal: Animal) => void
}

interface Animal {
  id: string
  animal_type: string
  name?: string
  tag_number?: string
  age_years?: number
  age_months?: number
}

const ANIMAL_TYPES = ['cow', 'buffalo', 'goat', 'sheep', 'poultry', 'horse']
const ANIMAL_ICONS: Record<string, string> = {
  cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', poultry: '🐔', horse: '🐴',
}

export default function AddAnimalModal({ onClose, onSuccess }: Props) {
  const { t, isRTL } = useI18n()

  const [animalType, setAnimalType] = useState('cow')
  const [name, setName] = useState('')
  const [tagNumber, setTagNumber] = useState('')
  const [ageYears, setAgeYears] = useState('')
  const [ageMonths, setAgeMonths] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalType, name, tagNumber, ageYears, ageMonths }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to add animal')

      onSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-warm-lg w-full max-w-md animate-slide-up ${isRTL ? 'text-right' : ''}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-pk-dark">🐄 {t('farmer.add_animal')}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-pk-dark/60"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-pk-terra/10 border border-pk-terra/30 text-pk-terra text-sm rounded-xl p-3 mb-4">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Animal type */}
            <div>
              <label className="label-text">{t('farmer.animal_type')}</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {ANIMAL_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAnimalType(type)}
                    className={`p-2 rounded-xl border-2 text-center transition-all ${
                      animalType === type
                        ? 'border-pk-green bg-pk-green/5'
                        : 'border-gray-200 hover:border-pk-sage'
                    }`}
                  >
                    <div className="text-xl">{ANIMAL_ICONS[type]}</div>
                    <div className="text-xs font-medium text-pk-dark mt-1 capitalize">
                      {t(`farmer.${type}`)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Kali, Safed..."
                />
              </div>
              <div>
                <label className="label-text">Tag #</label>
                <input
                  type="text"
                  className="input-field"
                  value={tagNumber}
                  onChange={e => setTagNumber(e.target.value)}
                  placeholder="TAG-001"
                />
              </div>
            </div>

            <div>
              <label className="label-text">{t('farmer.animal_age')}</label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <input
                  type="number"
                  className="input-field"
                  value={ageYears}
                  onChange={e => setAgeYears(e.target.value)}
                  placeholder={t('farmer.age_years')}
                  min="0" max="30"
                />
                <input
                  type="number"
                  className="input-field"
                  value={ageMonths}
                  onChange={e => setAgeMonths(e.target.value)}
                  placeholder={t('farmer.age_months')}
                  min="0" max="11"
                />
              </div>
            </div>

            <div className={`flex gap-3 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button type="button" onClick={onClose} className="btn-outline flex-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                )}
                {loading ? 'Adding...' : t('farmer.add_animal')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
