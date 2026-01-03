import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Simple pass-through middleware for Cloudflare compatibility
    // Auth is handled in individual pages/API routes instead
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
