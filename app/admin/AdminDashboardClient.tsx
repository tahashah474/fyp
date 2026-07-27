'use client'

import { useState } from 'react'
import Navbar from '@/components/ui/Navbar'
import { useI18n } from '@/lib/i18n/context'

interface DoctorProfile {
  id: string
  full_name: string
  university: string
  graduation_year: number
  pvmc_number: string
  clinic_name?: string
  city: string
  degree_certificate_url?: string
  pvmc_certificate_url?: string
  status: 'pending' | 'verified' | 'rejected'
  rejection_reason?: string
  created_at: string
  profiles?: { email?: string; full_name?: string }
}

interface Props {
  pendingDoctors: DoctorProfile[]
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  verified: 'bg-green-100 text-green-800 border border-green-300',
  rejected: 'bg-red-100 text-red-800 border border-red-300',
}

const STATUS_ICON: Record<string, string> = {
  pending: '⏳',
  verified: '✅',
  rejected: '❌',
}

export default function AdminDashboardClient({ pendingDoctors }: Props) {
  const { t, isRTL } = useI18n()
  const [doctors, setDoctors] = useState<DoctorProfile[]>(pendingDoctors)
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending')
  const [actionMsg, setActionMsg] = useState('')

  const filteredDoctors = filter === 'all' ? doctors : doctors.filter(d => d.status === filter)

  const counts = {
    all: doctors.length,
    pending: doctors.filter(d => d.status === 'pending').length,
    verified: doctors.filter(d => d.status === 'verified').length,
    rejected: doctors.filter(d => d.status === 'rejected').length,
  }

  const handleAction = async (doctorId: string, action: 'verified' | 'rejected', reason?: string) => {
    setLoading(doctorId)
    setActionMsg('')
    try {
      const res = await fetch('/api/admin/verify-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, action, rejectionReason: reason }),
      })

      if (res.ok) {
        setDoctors(prev => prev.map(d =>
          d.id === doctorId ? { ...d, status: action, rejection_reason: reason } : d
        ))
        setRejectModal(null)
        setRejectionReason('')
        setActionMsg(action === 'verified' ? '✅ Doctor approved successfully!' : '❌ Doctor rejected.')
        setTimeout(() => setActionMsg(''), 3000)
      } else {
        const data = await res.json()
        setActionMsg(`Error: ${data.error}`)
      }
    } catch (err) {
      setActionMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-pk-cream">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className={`mb-6 ${isRTL ? 'text-right' : ''}`}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🛡️</span>
            <h1 className="text-2xl font-bold text-pk-dark">{t('admin.title')}</h1>
          </div>
          <p className="text-pk-dark/60 text-sm">Manage doctor verifications and platform oversight</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', count: counts.all, color: 'bg-white', icon: '👨‍⚕️' },
            { label: 'Pending', count: counts.pending, color: 'bg-yellow-50 border border-yellow-200', icon: '⏳' },
            { label: 'Verified', count: counts.verified, color: 'bg-green-50 border border-green-200', icon: '✅' },
            { label: 'Rejected', count: counts.rejected, color: 'bg-red-50 border border-red-200', icon: '❌' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 shadow-warm ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-pk-dark">{s.count}</div>
              <div className="text-xs text-pk-dark/60 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Manual verification notice */}
        <div className="bg-pk-gold/10 border border-pk-gold/40 rounded-xl p-4 mb-6 flex gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <p className="text-sm text-pk-dark/70">{t('admin.manual_note')}</p>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className={`rounded-xl p-3 mb-4 text-sm font-medium ${
            actionMsg.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {actionMsg}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['pending', 'verified', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                filter === f
                  ? 'bg-pk-green text-white border-pk-green'
                  : 'bg-white border-gray-200 text-pk-dark/60 hover:border-pk-green'
              }`}
            >
              {f === 'pending' ? '⏳' : f === 'verified' ? '✅' : f === 'rejected' ? '❌' : '📋'}{' '}
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Doctor list */}
        {filteredDoctors.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-pk-dark/60">
              {filter === 'pending' ? 'No pending verifications. All caught up!' : `No ${filter} doctors.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoctors.map(doctor => (
              <div key={doctor.id} className="card shadow-warm hover:shadow-warm-lg transition-shadow">
                <div className={`flex flex-col md:flex-row md:items-start justify-between gap-4 ${isRTL ? 'md:flex-row-reverse text-right' : ''}`}>

                  {/* Doctor info */}
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-3 mb-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="text-3xl">🩺</div>
                      <div className="min-w-0">
                        <div className="font-bold text-pk-dark text-lg leading-tight">{doctor.full_name}</div>
                        <div className="text-sm text-pk-dark/60">{doctor.profiles?.email}</div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[doctor.status]}`}>
                        {STATUS_ICON[doctor.status]} {doctor.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <div className="text-xs text-pk-dark/50 font-semibold uppercase tracking-wide">PVMC #</div>
                        <div className="text-pk-dark font-mono font-medium">{doctor.pvmc_number}</div>
                      </div>
                      <div>
                        <div className="text-xs text-pk-dark/50 font-semibold uppercase tracking-wide">University</div>
                        <div className="text-pk-dark">{doctor.university}</div>
                      </div>
                      <div>
                        <div className="text-xs text-pk-dark/50 font-semibold uppercase tracking-wide">Graduated</div>
                        <div className="text-pk-dark">{doctor.graduation_year}</div>
                      </div>
                      <div>
                        <div className="text-xs text-pk-dark/50 font-semibold uppercase tracking-wide">City</div>
                        <div className="text-pk-dark">{doctor.city}</div>
                      </div>
                      {doctor.clinic_name && (
                        <div>
                          <div className="text-xs text-pk-dark/50 font-semibold uppercase tracking-wide">Clinic</div>
                          <div className="text-pk-dark">{doctor.clinic_name}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-pk-dark/50 font-semibold uppercase tracking-wide">Applied</div>
                        <div className="text-pk-dark">{new Date(doctor.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Rejection reason */}
                    {doctor.rejection_reason && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                        <strong>Rejection reason:</strong> {doctor.rejection_reason}
                      </div>
                    )}

                    {/* Document links */}
                    {(doctor.degree_certificate_url || doctor.pvmc_certificate_url) && (
                      <div className={`flex gap-4 mt-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {doctor.degree_certificate_url && (
                          <a
                            href={`/api/admin/document?path=${encodeURIComponent(doctor.degree_certificate_url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-pk-green font-semibold hover:underline flex items-center gap-1"
                          >
                            📄 Degree Certificate ↗
                          </a>
                        )}
                        {doctor.pvmc_certificate_url && (
                          <a
                            href={`/api/admin/document?path=${encodeURIComponent(doctor.pvmc_certificate_url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-pk-green font-semibold hover:underline flex items-center gap-1"
                          >
                            📄 PVMC Certificate ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons — only for pending */}
                  {doctor.status === 'pending' && (
                    <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(doctor.id, 'verified')}
                        disabled={loading === doctor.id}
                        className="flex items-center gap-2 bg-pk-green text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-pk-green-light transition-all disabled:opacity-60"
                      >
                        {loading === doctor.id
                          ? <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                          : '✓'
                        }
                        Approve
                      </button>
                      <button
                        onClick={() => { setRejectModal(doctor.id); setRejectionReason('') }}
                        disabled={loading === doctor.id}
                        className="flex items-center gap-2 bg-pk-terra text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-60"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {/* Re-review approved doctors */}
                  {doctor.status === 'verified' && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => { setRejectModal(doctor.id); setRejectionReason('') }}
                        disabled={loading === doctor.id}
                        className="flex items-center gap-2 border border-pk-terra text-pk-terra px-4 py-2 rounded-xl text-sm font-medium hover:bg-pk-terra hover:text-white transition-all"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-pk-dark mb-1">
              {doctors.find(d => d.id === rejectModal)?.status === 'verified' ? '⚠️ Revoke Verification' : '✕ Reject Application'}
            </h2>
            <p className="text-sm text-pk-dark/60 mb-4">
              Doctor: <strong>{doctors.find(d => d.id === rejectModal)?.full_name}</strong>
            </p>
            <label className="label-text">Reason *</label>
            <textarea
              className="input-field resize-none mt-1"
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. PVMC number not found in registry, documents unclear..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(null)} className="btn-outline flex-1">
                Cancel
              </button>
              <button
                onClick={() => handleAction(rejectModal, 'rejected', rejectionReason)}
                disabled={!rejectionReason.trim() || !!loading}
                className="btn-danger flex-1 disabled:opacity-60"
              >
                {loading ? '...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
