import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can access doctor certificates
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate a signed URL for private bucket access (valid 60 min)
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase.storage
      .from('doctor-certificates')
      .createSignedUrl(path, 3600)

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 })
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    console.error('Document API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
