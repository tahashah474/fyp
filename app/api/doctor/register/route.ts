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
    const { fullName, university, graduationYear, pvmcNumber, clinicName, city, degreeCertificateUrl, pvmcCertificateUrl } = body

    if (!fullName || !university || !graduationYear || !pvmcNumber || !city) {
      return NextResponse.json({
        error: `Missing fields: ${[
          !fullName && 'fullName',
          !university && 'university',
          !graduationYear && 'graduationYear',
          !pvmcNumber && 'pvmcNumber',
          !city && 'city',
        ].filter(Boolean).join(', ')}`
      }, { status: 400 })
    }

    const admin = createAdminClient()

    // Ensure doctor_profiles table exists by trying to query it
    const { error: tableCheckError } = await admin
      .from('doctor_profiles')
      .select('id')
      .limit(1)

    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      return NextResponse.json({
        error: 'Database not set up yet. Please run FINAL_setup.sql in Supabase SQL Editor first.',
        hint: 'Go to https://supabase.com/dashboard/project/wrygolugpadusluvlxqf/sql/new and run the FINAL_setup.sql file'
      }, { status: 500 })
    }

    // Upsert doctor profile
    const { error: insertError } = await admin
      .from('doctor_profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        university,
        graduation_year: parseInt(graduationYear),
        pvmc_number: pvmcNumber,
        clinic_name: clinicName || null,
        city,
        degree_certificate_url: degreeCertificateUrl || null,
        pvmc_certificate_url: pvmcCertificateUrl || null,
        status: 'pending',
      }, { onConflict: 'id' })

    if (insertError) {
      console.error('Doctor profile upsert error:', insertError)
      return NextResponse.json({
        error: insertError.message,
        code: insertError.code,
        details: insertError.details
      }, { status: 500 })
    }

    // Update profiles table — set role to doctor and update name
    const { error: profileError } = await admin
      .from('profiles')
      .update({ full_name: fullName, role: 'doctor' })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Non-fatal — doctor profile was saved
    }

    return NextResponse.json({ success: true, userId: user.id })

  } catch (err) {
    console.error('Doctor register route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
