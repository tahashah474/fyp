'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Navbar from '@/components/ui/Navbar'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

interface Doctor {
  id: string
  full_name: string
  university: string
  graduation_year: number
  pvmc_number: string
  clinic_name?: string
  city: string
  status: string
}

export default function DoctorsPage() {
  const { isRTL } = useI18n()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')

  useEffect(() => {
    fetch('/api/doctors')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDoctors(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const cities = ['all', ...Array.from(new Set(doctors.map(d => d.city))).sort()]

  const filtered = doctors.filter(d => {
    const matchesSearch = search === '' ||
      d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase()) ||
      d.university.toLowerCase().includes(search.toLowerCase())
    const matchesCity = cityFilter === 'all' || d.city === cityFilter
    return matchesSearch && matchesCity
  })

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className={`mb-8 ${isRTL ? 'text-right' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">👨‍⚕️</span>
            <h1 className="text-2xl font-bold text-pk-dark">Verified Veterinary Doctors</h1>
          </div>
          <p className="text-pk-dark/60">All doctors on Malshifa are manually verified by our admin team.</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-pk-green/10 border border-pk-green/30 text-pk-green text-xs font-semibold px-3 py-1 rounded-full">
              ✓ {doctors.length} Verified Doctors
            </span>
            <span className="bg-pk-gold/10 border border-pk-gold/30 text-pk-dark text-xs font-medium px-3 py-1 rounded-full">
              🛡️ Manual PVMC Verification
            </span>
          </div>
        </div>

        {/* Search + filter */}
        <div className={`flex flex-col sm:flex-row gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Search by name, city, university..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="input-field sm:w-48"
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
          >
            {cities.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Cities' : c}</option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse h-48">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && filtered.length === 0 && (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-bold text-pk-dark mb-2">
              {doctors.length === 0 ? 'No verified doctors yet' : 'No doctors match your search'}
            </h3>
            <p className="text-pk-dark/60 text-sm">
              {doctors.length === 0
                ? 'Doctors are being verified by our admin team. Check back soon.'
                : 'Try a different search or city filter.'
              }
            </p>
          </div>
        )}

        {/* Doctor cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 card bg-pk-green text-white text-center py-10">
          <div className="text-4xl mb-3">🌾</div>
          <h2 className="text-xl font-bold mb-2">Need help with your livestock?</h2>
         <p className="text-white/80 text-sm mb-6">
  Report your animal&apos;s symptoms, get an AI assessment, and connect with a verified doctor.
</p>
          <Link href="/auth/signup?role=farmer" className="bg-pk-gold text-pk-dark px-6 py-3 rounded-2xl font-bold hover:bg-pk-gold-light transition-all inline-block">
            Get Started Free →
          </Link>
        </div>
      </div>
    </div>
  )
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="card hover:shadow-warm-lg transition-all group">
      {/* Avatar */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-pk-green/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-pk-green/20 transition-colors">
          🩺
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-pk-dark leading-tight">Dr. {doctor.full_name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-pk-green text-xs font-semibold">✓ Verified</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-pk-dark/70">
          <span>📍</span>
          <span>{doctor.city}</span>
          {doctor.clinic_name && <span className="text-pk-dark/40">· {doctor.clinic_name}</span>}
        </div>
        <div className="flex items-center gap-2 text-pk-dark/70">
          <span>🎓</span>
          <span className="truncate">{doctor.university}</span>
          <span className="text-pk-dark/40 flex-shrink-0">({doctor.graduation_year})</span>
        </div>
        <div className="flex items-center gap-2 text-pk-dark/70">
          <span>🪪</span>
          <span className="font-mono text-xs">{doctor.pvmc_number}</span>
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/auth/signup?role=farmer`}
        className="mt-4 w-full btn-primary text-center text-sm py-2.5 block"
      >
        Report Problem to This Doctor
      </Link>
    </div>
  )
}
