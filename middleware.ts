import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Redirect Italian browsers from / to /it (i18n-lite, no next-intl required) */
function maybeRedirectToItalian(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  // Only intercept the root path
  if (pathname !== '/') return null

  // Don't redirect if user explicitly chose English (cookie set by /it "Switch to English" link)
  if (request.cookies.get('lang-pref')?.value === 'en') return null

  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const isItalian = /\bit[-_]/.test(acceptLanguage) || acceptLanguage.startsWith('it')

  if (isItalian) {
    const url = request.nextUrl.clone()
    url.pathname = '/it'
    const response = NextResponse.redirect(url, { status: 302 })
    // Remember the redirect for this session (12h) — avoids redirect loops
    response.cookies.set('lang-pref', 'it', { maxAge: 60 * 60 * 12, path: '/' })
    return response
  }
  return null
}

export async function middleware(request: NextRequest) {
  // i18n-lite: auto-redirect Italian browsers to /it
  const itRedirect = maybeRedirectToItalian(request)
  if (itRedirect) return itRedirect

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for Server Components to read auth state
  const { data: { user } } = await supabase.auth.getUser()

  // Protect premium routes
  const premiumRoutes = ['/dashboard', '/submit-poll']
  const isPremiumRoute = premiumRoutes.some(r => request.nextUrl.pathname.startsWith(r))

  if (isPremiumRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
