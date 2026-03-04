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

    if (!username || !password) {
      throw new HttpError('username and password are required', 400);
    }

    const { rows } = await query(
      `SELECT id, username, password_hash, role
       FROM users
       WHERE username = $1
       LIMIT 1`,
      [username]
    );

    if (rows.length === 0) {
      throw new HttpError('Invalid credentials', 401);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new HttpError('Invalid credentials', 401);
    }

    const jwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = issueAccessToken(jwtPayload);
    const refreshToken = issueRefreshToken(jwtPayload);
    const refreshExpiresAt = parseJwtExpiryToDate(refreshToken);

    await query('DELETE FROM refresh_sessions WHERE user_id = $1', [user.id]);
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
    });
  } catch (error) {
    return handleApiError(error);
  }
}
