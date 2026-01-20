import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback - code:', code ? 'present' : 'missing', 'origin:', origin)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('Exchange result:', {
      hasSession: !!data.session,
      hasUser: !!data.user,
      error: error?.message
    })

    if (!error && data.session) {
      const redirectUrl = `${origin}${next}`
      console.log('Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }

    console.error('Auth error:', error)
  }

  // Return the user to an error page with instructions
  console.log('Auth failed, redirecting to login')
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
