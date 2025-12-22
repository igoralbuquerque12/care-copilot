import { type NextResponse } from 'next/server'

export function applyCookiesToResponse(
  targetResponse: NextResponse, 
  sourceResponse: NextResponse
) {
  sourceResponse.cookies.getAll().forEach((cookie) => {
    targetResponse.cookies.set(cookie.name, cookie.value, cookie)
  })
}