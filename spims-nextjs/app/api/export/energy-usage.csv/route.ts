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

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    if (startDate && isNaN(startDate.getTime())) {
      throw new HttpError('startDate must be a valid date');
    }
    if (endDate && isNaN(endDate.getTime())) {
      throw new HttpError('endDate must be a valid date');
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

    const { rows } = await query(
      `SELECT id, area, consumption, timestamp
       FROM energy_usage
       ${whereClause}
       ORDER BY timestamp DESC`,
      params
    );

    const header = 'id,area,consumption,timestamp';
    const csvLines = rows.map((row: any) => {
      const safeArea = String(row.area).replaceAll('"', '""');
      return `${row.id},"${safeArea}",${Number(row.consumption)},${new Date(row.timestamp).toISOString()}`;
    });

    const csv = [header, ...csvLines].join('\n');
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="energy-usage-${stamp}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
