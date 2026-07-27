import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DoctorDashboardClient from './DoctorDashboardClient'

export default async function DoctorDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role && profile.role !== 'doctor') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: doctorProfile } = await admin
    .from('doctor_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!doctorProfile) redirect('/dashboard/doctor/register')
  if (doctorProfile.status === 'pending') return <PendingPage pvmc={doctorProfile.pvmc_number} />
  if (doctorProfile.status === 'rejected') return <RejectedPage reason={doctorProfile.rejection_reason} />

  // Fetch cases without problematic FK join
  const { data: rawCases } = await admin
    .from('cases')
    .select('*, animals(name, animal_type, age_years, age_months)')
    .in('status', ['open', 'assigned'])
    .order('created_at', { ascending: false })

  // Enrich with farmer profiles
  const cases = await Promise.all(
    (rawCases || []).map(async (c) => {
      const { data: farmerProfile } = await admin
        .from('profiles')
        .select('full_name, email')
        .eq('id', c.farmer_id)
        .single()
      return { ...c, profiles: farmerProfile || { full_name: 'Farmer' } }
    })
  )

  // Sort by urgency
  const urgencyOrder: Record<string, number> = { 'Emergency': 0, 'See a vet soon': 1, 'Monitor at home': 2 }
  const sorted = cases.sort((a, b) =>
    (urgencyOrder[a.ai_urgency_level] ?? 3) - (urgencyOrder[b.ai_urgency_level] ?? 3)
  )

  return (
    <DoctorDashboardClient
      userId={user.id}
      profile={profile || { full_name: user.email }}
      doctorProfile={doctorProfile}
      initialCases={sorted}
    />
  )
}

function PendingPage({ pvmc }: { pvmc: string }) {
  return (
    <div className="min-h-screen bg-pk-cream flex items-center justify-center p-4">
      <div className="card max-w-lg text-center shadow-warm-lg">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-pk-dark mb-3">Verification Pending</h1>
        <p className="text-pk-dark/60 mb-4 leading-relaxed">
          Your profile is under manual review. PVMC: <strong>{pvmc}</strong>
        </p>
        <div className="bg-pk-gold/10 border border-pk-gold/30 rounded-xl p-4 text-sm text-pk-dark/70">
          ⚠️ Manual process — no live government API. Admin reviews all documents.
        </div>
        <a href="/" className="btn-outline inline-block mt-4">← Back to Home</a>
      </div>
    </div>
  )
}

function RejectedPage({ reason }: { reason?: string }) {
  return (
    <div className="min-h-screen bg-pk-cream flex items-center justify-center p-4">
      <div className="card max-w-lg text-center shadow-warm-lg">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-pk-dark mb-3">Verification Rejected</h1>
        {reason && (
          <div className="bg-pk-terra/10 border border-pk-terra/30 rounded-xl p-4 text-sm text-pk-terra mb-4">
            <strong>Reason:</strong> {reason}
          </div>
        )}
        <a href="/dashboard/doctor/register" className="btn-primary inline-block">Resubmit</a>
      </div>
    </div>
  )
}
