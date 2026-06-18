import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']

// Pages only MEDICAL or NON_MEDICAL can visit
const STAFF_ONLY_PATHS = ['/inventory', '/analytics']
// Pages only MEDICAL can visit
const MEDICAL_ONLY_PATHS = ['/patients']

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded.role ?? null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('ml_access_token')?.value
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p)

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (token) {
    const role = decodeJwtRole(token)

    if (role === 'PATIENT') {
      const blocked = [...STAFF_ONLY_PATHS, ...MEDICAL_ONLY_PATHS]
      if (blocked.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    if (role === 'NON_MEDICAL') {
      if (MEDICAL_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\..*).*)',],
}
