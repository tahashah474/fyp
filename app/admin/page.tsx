import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  // Fetch doctor_profiles without the join first
  const { data: doctorProfiles, error: dpError } = await admin
    .from('doctor_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (dpError) {
    console.error('doctor_profiles fetch error:', dpError.message)
  }

  // Then enrich with profile emails separately to avoid FK join issues
  const doctors = await Promise.all(
    (doctorProfiles || []).map(async (doc) => {
      const { data: profileData } = await admin
        .from('profiles')
        .select('email, full_name')
        .eq('id', doc.id)
        .single()
      return { ...doc, profiles: profileData || {} }
    })
  )

  return <AdminDashboardClient pendingDoctors={doctors} />
}
