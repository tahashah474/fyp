import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Get all verified doctors with their profile info
    const { data: doctors, error } = await admin
      .from('doctor_profiles')
      .select('id, full_name, university, graduation_year, pvmc_number, clinic_name, city, status, created_at')
      .eq('status', 'verified')
      .order('full_name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(doctors || [])
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
