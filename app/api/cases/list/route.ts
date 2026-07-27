import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Fetch cases without the problematic FK join
    const { data: cases, error } = await admin
      .from('cases')
      .select('*, animals(name, animal_type, age_years, age_months)')
      .in('status', ['open', 'assigned'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Cases list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with farmer name separately
    const enriched = await Promise.all(
      (cases || []).map(async (c) => {
        const { data: profile } = await admin
          .from('profiles')
          .select('full_name, email')
          .eq('id', c.farmer_id)
          .single()
        return { ...c, profiles: profile || { full_name: 'Farmer' } }
      })
    )

    // Sort by urgency
    const urgencyOrder: Record<string, number> = {
      'Emergency': 0, 'See a vet soon': 1, 'Monitor at home': 2
    }
    const sorted = enriched.sort((a, b) =>
      (urgencyOrder[a.ai_urgency_level] ?? 3) - (urgencyOrder[b.ai_urgency_level] ?? 3)
    )

    return NextResponse.json(sorted)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
