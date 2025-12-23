import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to require authentication (any logged-in user)
 * @param request Next.js request object
 * @returns User payload if authenticated, or error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  const user = verifyToken(token);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or expired token' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Middleware to require admin authentication
 * @param request Next.js request object
 * @returns Admin user payload if authenticated, or error response
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(request);

  // If authResult is NextResponse (error), return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if user is admin
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  return authResult;
}

/**
 * Middleware to require worker authentication
 * @param request Next.js request object
 * @returns Worker user payload if authenticated, or error response
 */
export async function requireWorker(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(request);

  // If authResult is NextResponse (error), return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if user is worker
  if (authResult.user.role !== 'worker') {
    return NextResponse.json(
      { error: 'Forbidden - Worker access required' },
      { status: 403 }
    );
  }

  return authResult;
}

/**
 * Helper to extract user from authenticated request
 * Use this after requireAuth/requireAdmin/requireWorker
 * @param request Authenticated request
 * @returns User payload or null
 */
export function getAuthUser(request: AuthenticatedRequest): JWTPayload | null {
  return request.user || null;
}
