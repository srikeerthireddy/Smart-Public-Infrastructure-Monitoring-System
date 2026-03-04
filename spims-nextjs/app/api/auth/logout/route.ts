import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { HttpError } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = String(body.refreshToken || '').trim();
    
    if (!refreshToken) {
      throw new HttpError('refreshToken is required', 400);
    }

    await query('DELETE FROM refresh_sessions WHERE refresh_token = $1', [refreshToken]);
    
    return NextResponse.json({ message: 'Logged out' });
  } catch (error) {
    return handleApiError(error);
  }
}
