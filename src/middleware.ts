import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '~/server/auth/supabase.edge'
import { applyCookiesToResponse } from '~/server/auth/cookies.utils'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/auth')
  const isPublicRoute = isAuthRoute

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    
    const redirectResponse = NextResponse.redirect(url)
    applyCookiesToResponse(redirectResponse, response)
    
    return redirectResponse
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    
    const redirectResponse = NextResponse.redirect(url)
    applyCookiesToResponse(redirectResponse, response)
    
    return redirectResponse
  }

  return response
}


export const config = {
  matcher: [
    '/((?!api/auth|api/trpc|_next/static|_next/image|favicon.ico).*)',
  ],
}