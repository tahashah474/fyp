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
    const { animalType, name, tagNumber, ageYears, ageMonths } = body

    if (!animalType) {
      return NextResponse.json({ error: 'Animal type is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS issues
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('animals')
      .insert({
        owner_id: user.id,
        animal_type: animalType,
        name: name || null,
        tag_number: tagNumber || null,
        age_years: ageYears ? parseInt(ageYears) : null,
        age_months: ageMonths ? parseInt(ageMonths) : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Animal insert error:', error)
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
