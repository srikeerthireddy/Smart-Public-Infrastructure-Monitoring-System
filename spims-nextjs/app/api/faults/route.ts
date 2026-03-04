import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, requireRole, HttpError } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    requireRole(user, 'ADMIN', 'OPERATOR');

    const { searchParams } = new URL(request.url);
    const resolvedParam = searchParams.get('resolved');
    const limitParam = searchParams.get('limit');
    
    let resolved: boolean | undefined;
    if (resolvedParam === 'true') resolved = true;
    else if (resolvedParam === 'false') resolved = false;
    else if (resolvedParam !== null) {
      throw new HttpError('resolved must be true or false');
    }

    const limit = limitParam ? Number(limitParam) : 50;
    if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
      throw new HttpError('limit must be an integer between 1 and 500');
    }

    let sql = `SELECT id, issue, location, resolved, timestamp, resolved_at
               FROM faults`;
    const params: any[] = [];

    if (resolved !== undefined) {
      sql += ' WHERE resolved = $1';
      params.push(resolved);
    }

    sql += ` ORDER BY timestamp DESC
             LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows } = await query(sql, params);
    
    return NextResponse.json({
      count: rows.length,
      items: rows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
