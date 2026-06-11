import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allowed public endpoints (including static assets)
  const publicPaths = ['/', '/invite', '/auth/callback'];
  
  const isPublic = publicPaths.some(p => pathname.startsWith(p)) 
    || pathname.startsWith('/api/')
    || pathname.match(/\.(.*)$/); // Allow static files (images, css, etc.)
  
  // Check for the presence of the Supabase auth token
  const hasSession = request.cookies.getAll().some(c => c.name.includes('-auth-token'));
  
  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL('/invite', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};