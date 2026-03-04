import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { 
  issueAccessToken, 
  issueRefreshToken, 
  parseJwtExpiryToDate,
  HttpError 
} from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const role = String(body.role || 'OPERATOR').toUpperCase();

    // Validation
    if (!username || !password) {
      throw new HttpError('Username and password are required', 400);
    }

    if (username.length < 3) {
      throw new HttpError('Username must be at least 3 characters', 400);
    }

    if (password.length < 6) {
      throw new HttpError('Password must be at least 6 characters', 400);
    }

    // Only allow ADMIN or OPERATOR roles
    if (role !== 'ADMIN' && role !== 'OPERATOR') {
      throw new HttpError('Invalid role. Must be ADMIN or OPERATOR', 400);
    }

    // Check if username already exists
    const { rows: existingUsers } = await query(
      `SELECT id FROM users WHERE username = $1 LIMIT 1`,
      [username]
    );

    if (existingUsers.length > 0) {
      throw new HttpError('Username already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { rows } = await query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [username, passwordHash, role]
    );

    const user = rows[0];

    // Issue JWT tokens
    const jwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = issueAccessToken(jwtPayload);
    const refreshToken = issueRefreshToken(jwtPayload);
    const refreshExpiresAt = parseJwtExpiryToDate(refreshToken);

    // Store refresh token
    await query(
      `INSERT INTO refresh_sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, refreshExpiresAt]
    );

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      accessToken,
      refreshToken,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
