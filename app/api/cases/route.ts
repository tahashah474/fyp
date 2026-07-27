import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('cases')
      .insert({
        farmer_id: user.id,
        animal_id: body.animal_id,
        symptoms_checklist: body.symptoms_checklist || [],
        symptoms_freetext: body.symptoms_freetext || null,
        symptom_photo_url: body.symptom_photo_url || null,
        ai_possible_conditions: body.ai_possible_conditions,
        ai_urgency_level: body.ai_urgency_level,
        ai_first_aid: body.ai_first_aid,
        ai_disclaimer: body.ai_disclaimer,
        ai_raw_response: body.ai_raw_response,
        ai_language: body.ai_language || 'en',
        status: 'open',
      })
      .select('*, animals(name, animal_type)')
      .single()

    if (error) {
      console.error('Case insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
