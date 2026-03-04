import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    requireRole(user, 'ADMIN', 'OPERATOR');

    const { rows } = await query(
      `SELECT DISTINCT area
       FROM energy_usage
       ORDER BY area ASC`
    );

    return NextResponse.json({
      items: rows.map((row) => row.area),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
