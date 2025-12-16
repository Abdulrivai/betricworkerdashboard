import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string): any | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check expiration
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const pathname = req.nextUrl.pathname;

  // Skip API routes dan static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Public route - login page
  if (pathname === '/login') {
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        // User sudah login, redirect sesuai role
        const redirectUrl = decoded.role === 'admin' ? '/admin' : '/worker';
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes - butuh login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const decoded = decodeJwt(token);
  if (!decoded) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based protection
  if (pathname.startsWith('/admin') && decoded.role !== 'admin') {
    return NextResponse.redirect(new URL('/worker', req.url));
  }

  if (pathname.startsWith('/worker') && decoded.role !== 'worker') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Redirect root ke dashboard sesuai role
  if (pathname === '/') {
    const redirectUrl = decoded.role === 'admin' ? '/admin' : '/worker';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/worker/:path*'],
};