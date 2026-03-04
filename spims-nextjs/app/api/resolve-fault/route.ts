import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, requireRole, HttpError } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    requireRole(user, 'ADMIN');

    const body = await request.json();
    const faultId = Number(body.faultId);

    if (!Number.isInteger(faultId) || faultId <= 0) {
      throw new HttpError('faultId must be a positive integer');
    }

    const { rowCount } = await query(
      `UPDATE faults
       SET resolved = TRUE, resolved_at = NOW()
       WHERE id = $1 AND resolved = FALSE`,
      [faultId]
    );

    if (rowCount === 0) {
      throw new HttpError('Fault not found or already resolved', 404);
    }

    return NextResponse.json({ 
      message: 'Fault resolved successfully',
      faultId 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
