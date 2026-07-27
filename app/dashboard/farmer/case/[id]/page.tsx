import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import FarmerCaseDetailClient from './FarmerCaseDetailClient'

interface Props { params: { id: string } }

export default async function FarmerCaseDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  const { data: caseData } = await admin
    .from('cases')
    .select('*, animals(*), profiles!cases_farmer_id_fkey(full_name)')
    .eq('id', params.id)
    .eq('farmer_id', user.id)
    .single()

  if (!caseData) notFound()

  const { data: notes } = await admin
    .from('case_notes')
    .select('*')
    .eq('case_id', params.id)
    .order('created_at', { ascending: true })

  // Enrich notes with author names
  const enrichedNotes = await Promise.all(
    (notes || []).map(async (note) => {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', note.author_id)
        .single()
      return { ...note, profiles: profile || { full_name: note.author_role } }
    })
  )

  return (
    <FarmerCaseDetailClient
      caseData={caseData}
      initialNotes={enrichedNotes}
      userId={user.id}
    />
  )
}
