import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { caseId, content, authorRole } = await request.json()
    if (!caseId || !content) {
      return NextResponse.json({ error: 'caseId and content required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('case_notes')
      .insert({
        case_id: caseId,
        author_id: user.id,
        author_role: authorRole || 'farmer',
        content: content.trim(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fetch author name separately
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ ...data, profiles: profile || { full_name: authorRole === 'doctor' ? 'Doctor' : 'Farmer' } })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    if (!caseId) return NextResponse.json({ error: 'caseId required' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Fetch notes without FK join
    const { data: notes, error } = await admin
      .from('case_notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Enrich with author names
    const enriched = await Promise.all(
      (notes || []).map(async (note) => {
        const { data: profile } = await admin
          .from('profiles')
          .select('full_name')
          .eq('id', note.author_id)
          .single()
        return { ...note, profiles: profile || { full_name: note.author_role } }
      })
    )

    return NextResponse.json(enriched)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
