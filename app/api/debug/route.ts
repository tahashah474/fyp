import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    results.auth = { userId: user?.id ?? null, email: user?.email ?? null, error: authError?.message ?? null }

    const admin = createAdminClient()

    // Check profiles table
    const { data: profiles, error: pErr } = await admin.from('profiles').select('*')
    results.profiles = { count: profiles?.length ?? 0, data: profiles, error: pErr?.message ?? null }

    // Check doctor_profiles table
    const { data: doctorProfiles, error: dpErr } = await admin.from('doctor_profiles').select('*')
    results.doctor_profiles = { count: doctorProfiles?.length ?? 0, data: doctorProfiles, error: dpErr?.message ?? null }

    // Check animals table
    const { data: animals, error: aErr } = await admin.from('animals').select('id, animal_type, owner_id')
    results.animals = { count: animals?.length ?? 0, error: aErr?.message ?? null }

    // Check cases table
    const { data: cases, error: cErr } = await admin.from('cases').select('id, status, farmer_id')
    results.cases = { count: cases?.length ?? 0, error: cErr?.message ?? null }

    // Check Gemini key
    results.gemini = { keySet: !!process.env.GEMINI_API_KEY, prefix: process.env.GEMINI_API_KEY?.substring(0, 10) + '...' }

  } catch (e) {
    results.fatalError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results, { status: 200 })
}
