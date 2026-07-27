import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { caseId, doctorId } = await request.json()
    if (!caseId || !doctorId) {
      return NextResponse.json({ error: 'caseId and doctorId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify doctor is verified
    const { data: doctor } = await admin
      .from('doctor_profiles')
      .select('id, full_name, status')
      .eq('id', doctorId)
      .eq('status', 'verified')
      .single()

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found or not verified' }, { status: 404 })
    }

    // Assign case to doctor
    const { data, error } = await admin
      .from('cases')
      .update({ assigned_doctor_id: doctorId, status: 'assigned' })
      .eq('id', caseId)
      .eq('farmer_id', user.id) // ensure farmer owns this case
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, case: data, doctor })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
