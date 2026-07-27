import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const email = process.env.ADMIN_EMAIL!
    const password = process.env.ADMIN_PASSWORD!

    if (!email || !password) {
      return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 })
    }

    const admin = createAdminClient()

    // Check if admin user exists, create if not
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const exists = existingUsers?.users?.some(u => u.email === email)

    if (!exists) {
      // Create admin user
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Admin', role: 'admin' },
      })

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 })
      }

      if (newUser.user) {
        await admin.from('profiles').upsert({
          id: newUser.user.id,
          email,
          full_name: 'Admin',
          role: 'admin',
        })
      }
    } else {
      // Ensure role is admin (in case it was changed)
      await admin.from('profiles')
        .update({ role: 'admin' })
        .eq('email', email)

      // Update password in case it changed
      const user = existingUsers.users.find(u => u.email === email)
      if (user) {
        await admin.auth.admin.updateUserById(user.id, { password })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
