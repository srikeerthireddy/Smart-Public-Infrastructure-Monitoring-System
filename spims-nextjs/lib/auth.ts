import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export type UserRole = 'ADMIN' | 'OPERATOR';

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
}

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
  }
}

export function getJwtConfig() {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new HttpError('JWT secrets are not configured', 500);
  }

  return {
    accessSecret,
    refreshSecret,
    accessTtl: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshTtl: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
}

export function issueAccessToken(payload: JwtPayload): string {
  const config = getJwtConfig();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, config.accessSecret, { expiresIn: config.accessTtl } as any);
}

export function issueRefreshToken(payload: JwtPayload): string {
  const config = getJwtConfig();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, config.refreshSecret, { expiresIn: config.refreshTtl } as any);
}

export function parseJwtExpiryToDate(token: string): Date {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
    throw new HttpError('Failed to decode refresh token expiry', 500);
  }
  return new Date(decoded.exp * 1000);
}

export function verifyAccessToken(token: string): JwtPayload {
  const config = getJwtConfig();
  const payload = jwt.verify(token, config.accessSecret);
  return payload as unknown as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const config = getJwtConfig();
  const payload = jwt.verify(token, config.refreshSecret);
  return payload as unknown as JwtPayload;
}

export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

export function authenticateRequest(request: NextRequest): AuthUser {
  const token = extractBearerToken(request);
  
  if (!token) {
    throw new HttpError('Missing access token', 401);
  }

  try {
    const payload = verifyAccessToken(token);
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  } catch (error) {
    throw new HttpError('Invalid or expired access token', 401);
  }
}

export function requireRole(user: AuthUser, ...roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    throw new HttpError('Forbidden', 403);
  }
}
