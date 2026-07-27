import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createAdminClient()
  const tables = ['profiles', 'doctor_profiles', 'animals', 'cases', 'case_notes']
  const status: Record<string, unknown> = {}

  for (const table of tables) {
    try {
      const { error, count } = await admin
        .from(table)
        .select('*', { count: 'exact', head: true })
      status[table] = error
        ? { exists: false, error: error.message }
        : { exists: true, count }
    } catch (e) {
      status[table] = { exists: false, error: String(e) }
    }
  }

  const allExist = Object.values(status).every(
    (s) => (s as { exists: boolean }).exists
  )

  return NextResponse.json({
    ready: allExist,
    tables: status,
    message: allExist
      ? 'All tables exist. App is ready!'
      : 'Run FINAL_setup.sql in Supabase SQL Editor.',
  })
}
