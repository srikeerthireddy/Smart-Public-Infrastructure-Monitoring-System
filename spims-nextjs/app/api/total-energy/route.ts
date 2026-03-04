import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Public endpoint - no authentication required

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');

    const sql = area
      ? `SELECT COALESCE(SUM(consumption), 0)::numeric(12,2) AS total_consumption,
                COUNT(*)::int AS readings,
                MAX(timestamp) AS last_updated
         FROM energy_usage
         WHERE area = $1`
      : `SELECT COALESCE(SUM(consumption), 0)::numeric(12,2) AS total_consumption,
                COUNT(*)::int AS readings,
                MAX(timestamp) AS last_updated
         FROM energy_usage`;

    const params = area ? [area] : [];
    const { rows } = await query(sql, params);

    return NextResponse.json({
      area: area || 'ALL',
      totalConsumption: Number(rows[0].total_consumption || 0),
      readings: rows[0].readings || 0,
      lastUpdated: rows[0].last_updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
