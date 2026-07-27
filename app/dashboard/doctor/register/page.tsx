'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'

const CURRENT_YEAR = new Date().getFullYear()

export default function DoctorRegistrationPage() {
  const { t, isRTL } = useI18n()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [university, setUniversity] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [pvmcNumber, setPvmcNumber] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [city, setCity] = useState('')
  const [degreeFile, setDegreeFile] = useState<File | null>(null)
  const [pvmcFile, setPvmcFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  // Check if already submitted
  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Pre-fill name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profile?.full_name) setFullName(profile.full_name)
    }
    check()
  }, [])

  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('doctor-certificates')
        .upload(path, file)
      if (error) return null
      return path
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebugInfo('')

    if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return }
    if (!university.trim()) { setError('University is required'); setLoading(false); return }
    if (!graduationYear) { setError('Graduation year is required'); setLoading(false); return }
    if (!pvmcNumber.trim()) { setError('PVMC number is required'); setLoading(false); return }
    if (!city.trim()) { setError('City is required'); setLoading(false); return }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated — please log in again')

      setDebugInfo(`User ID: ${user.id} | Uploading files...`)

      // Upload files (non-blocking)
      let degreeCertificateUrl: string | null = null
      let pvmcCertificateUrl: string | null = null
      if (degreeFile) degreeCertificateUrl = await uploadFile(degreeFile, user.id)
      if (pvmcFile) pvmcCertificateUrl = await uploadFile(pvmcFile, user.id)

      setDebugInfo(`Files done | Submitting profile...`)

      // Try API route first
      const res = await fetch('/api/doctor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          university: university.trim(),
          graduationYear: graduationYear.toString(),
          pvmcNumber: pvmcNumber.trim(),
          clinicName: clinicName.trim(),
          city: city.trim(),
          degreeCertificateUrl,
          pvmcCertificateUrl,
        }),
      })

      const resData = await res.json()
      setDebugInfo(`API response: ${res.status} — ${JSON.stringify(resData)}`)

      if (!res.ok) {
        throw new Error(resData.error || `Server returned ${res.status}`)
      }

      setAlreadySubmitted(true)
      setTimeout(() => {
        router.push('/dashboard/doctor')
        router.refresh()
      }, 1500)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setDebugInfo(prev => prev + ` | ERROR: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-pk-cream flex items-center justify-center p-4">
        <div className="card max-w-md text-center shadow-warm-lg">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-pk-dark mb-2">Application Submitted!</h2>
          <p className="text-pk-dark/60 text-sm mb-4">
            Your profile is under review. Redirecting to dashboard...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-pk-green border-t-transparent mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className={`card shadow-warm-lg ${isRTL ? 'text-right' : ''}`}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🩺</div>
            <h1 className="text-2xl font-bold text-pk-dark">{t('doctor_registration.title')}</h1>
            <p className="text-pk-dark/60 mt-2 text-sm">{t('doctor_registration.subtitle')}</p>
          </div>

          <div className="bg-pk-gold/10 border border-pk-gold/40 rounded-xl p-4 mb-6 flex gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <p className="text-sm text-pk-dark/70">{t('doctor_registration.note')}</p>
          </div>

          {error && (
            <div className="bg-pk-terra/10 border border-pk-terra/30 text-pk-terra text-sm rounded-xl p-3 mb-4">
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          {debugInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-xs text-gray-600 font-mono break-all">
              🔍 {debugInfo}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="label-text">{t('doctor_registration.full_name')} *</label>
                <input
                  type="text"
                  className="input-field"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder="Dr. Muhammad Ahmed"
                />
              </div>
              <div>
                <label className="label-text">{t('doctor_registration.university')} *</label>
                <input
                  type="text"
                  className="input-field"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  required
                  placeholder="UVAS Lahore"
                />
              </div>
              <div>
                <label className="label-text">{t('doctor_registration.graduation_year')} *</label>
                <input
                  type="number"
                  className="input-field"
                  value={graduationYear}
                  onChange={e => setGraduationYear(e.target.value)}
                  required
                  min="1970"
                  max={CURRENT_YEAR}
                  placeholder="2020"
                />
              </div>
              <div>
                <label className="label-text">{t('doctor_registration.pvmc_number')} *</label>
                <input
                  type="text"
                  className="input-field"
                  value={pvmcNumber}
                  onChange={e => setPvmcNumber(e.target.value)}
                  required
                  placeholder="PVMC-12345"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label-text">{t('doctor_registration.city')} *</label>
                <input
                  type="text"
                  className="input-field"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  required
                  placeholder="Lahore"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label-text">{t('doctor_registration.clinic_name')}</label>
                <input
                  type="text"
                  className="input-field"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  placeholder="City Vet Clinic (optional)"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="font-bold text-pk-dark">
                📄 Documents{' '}
                <span className="text-pk-dark/40 font-normal text-sm">(optional but recommended)</span>
              </h3>
              <div>
                <label className="label-text">{t('doctor_registration.degree_cert')}</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setDegreeFile(e.target.files?.[0] || null)}
                  className="input-field pt-2"
                />
                {degreeFile && <p className="text-xs text-pk-sage mt-1">✓ {degreeFile.name}</p>}
              </div>
              <div>
                <label className="label-text">{t('doctor_registration.pvmc_cert')}</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setPvmcFile(e.target.files?.[0] || null)}
                  className="input-field pt-2"
                />
                {pvmcFile && <p className="text-xs text-pk-sage mt-1">✓ {pvmcFile.name}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base mt-2"
            >
              {loading && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              {loading ? 'Submitting...' : t('doctor_registration.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
