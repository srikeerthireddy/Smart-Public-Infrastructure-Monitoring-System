import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, requireRole, HttpError } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    requireRole(user, 'ADMIN', 'OPERATOR');

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    const limit = limitParam ? Number(limitParam) : 200;

    if (startDate && isNaN(startDate.getTime())) {
      throw new HttpError('startDate must be a valid date');
    }
    if (endDate && isNaN(endDate.getTime())) {
      throw new HttpError('endDate must be a valid date');
    }
    if (!Number.isInteger(limit) || limit <= 0 || limit > 2000) {
      throw new HttpError('limit must be an integer between 1 and 2000');
    }
    if (startDate && endDate && startDate > endDate) {
      throw new HttpError('startDate must be before endDate');
    }

    const conditions: string[] = [];
    const params: any[] = [];

    if (area) {
      params.push(area);
      conditions.push(`area = $${params.length}`);
    }
    if (startDate) {
      params.push(startDate);
      conditions.push(`timestamp >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`timestamp <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    const { rows } = await query(
      `SELECT id, area, consumption, timestamp
       FROM energy_usage
       ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${params.length}`,
      params
    );

    return NextResponse.json({
      count: rows.length,
      items: rows.map((row) => ({
        id: row.id,
        area: row.area,
        consumption: Number(row.consumption),
        timestamp: row.timestamp,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
