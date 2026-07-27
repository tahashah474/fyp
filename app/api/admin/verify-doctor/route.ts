import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { doctorId, action, rejectionReason } = await request.json()

    if (!doctorId || !['verified', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Use admin client for privileged update
    const adminSupabase = createAdminClient()

    const updateData: Record<string, unknown> = {
      status: action,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }

    if (action === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    const { error } = await adminSupabase
      .from('doctor_profiles')
      .update(updateData)
      .eq('id', doctorId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
