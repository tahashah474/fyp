import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import FarmerDashboardClient from './FarmerDashboardClient'

export default async function FarmerDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role && profile.role !== 'farmer') redirect('/dashboard')

  // Use admin client to bypass RLS for data fetching
  const admin = createAdminClient()

  const { data: animals } = await admin
    .from('animals')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: cases } = await admin
    .from('cases')
    .select('*, animals(name, animal_type)')
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <FarmerDashboardClient
      userId={user.id}
      profile={profile || { full_name: user.email || 'Farmer' }}
      initialAnimals={animals || []}
      initialCases={cases || []}
    />
  )
}
