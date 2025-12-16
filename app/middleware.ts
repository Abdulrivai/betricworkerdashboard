import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string): any | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (middle part)
    let payload = parts[1];

    // Replace URL-safe characters with standard base64 characters
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed (base64 strings should be divisible by 4)
    while (payload.length % 4 !== 0) {
      payload += '=';
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());

    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    if (decoded.exp && Date.now() > decoded.exp * 1000) {
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