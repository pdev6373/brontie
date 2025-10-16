import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing admin pages (not API routes)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    // Just check if user id cookie exists (don't verify it)
    const userId = request.cookies.get('admin-user-id')?.value;
    
    if (!userId) {
      // No user id at all - redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // User id exists - let through (API routes will verify if user is still active)
    return NextResponse.next();
  }

  // For all other routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
};
