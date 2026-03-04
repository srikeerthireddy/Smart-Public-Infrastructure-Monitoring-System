import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyRefreshToken, issueAccessToken, HttpError } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = String(body.refreshToken || '').trim();
    
    if (!refreshToken) {
      throw new HttpError('refreshToken is required', 400);
    }

    try {
      verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new HttpError('Invalid or expired refresh token', 401);
    }

    const { rows } = await query(
      `SELECT rs.id, rs.user_id, rs.expires_at, u.username, u.role
       FROM refresh_sessions rs
       JOIN users u ON u.id = rs.user_id
       WHERE rs.refresh_token = $1
       LIMIT 1`,
      [refreshToken]
    );

    if (rows.length === 0) {
      throw new HttpError('Refresh session not found', 401);
    }

    const session = rows[0];
    if (new Date(session.expires_at).getTime() < Date.now()) {
      await query('DELETE FROM refresh_sessions WHERE id = $1', [session.id]);
      throw new HttpError('Refresh token expired', 401);
    }

    const accessToken = issueAccessToken({
      sub: session.user_id,
      username: session.username,
      role: session.role,
    });

    return NextResponse.json({ accessToken });
  } catch (error) {
    return handleApiError(error);
  }
}
