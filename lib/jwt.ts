import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export interface JWTPayload {
  id: string;
  email: string;
  role: 'admin' | 'worker';
  full_name: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token with user payload
 * @param payload User data to include in token (id, email, role, full_name)
 * @returns Signed JWT token string
 */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify and decode a JWT token
 * @param token JWT token string
 * @returns Decoded payload if valid, null if invalid or expired
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token invalid, expired, or malformed
    return null;
  }
}

/**
 * Decode token WITHOUT verification (unsafe - use only for migration/debugging)
 * @param token JWT token string
 * @returns Decoded payload without signature verification
 * @deprecated Use verifyToken instead for security
 */
export function decodeTokenUnsafe(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    let payload = parts[1];

    // Replace URL-safe characters
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding
    while (payload.length % 4 !== 0) {
      payload += '=';
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());

    // Check expiration
    if (decoded.exp && Date.now() > decoded.exp * 1000) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
