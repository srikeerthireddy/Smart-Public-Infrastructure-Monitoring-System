import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, requireRole, HttpError } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

function parseMonth(month: string | null) {
  if (!month) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
  }

  const monthRegex = /^(\d{4})-(\d{2})$/;
  const match = month.match(monthRegex);
  if (!match) {
    throw new HttpError('month must be in YYYY-MM format');
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) {
    throw new HttpError('month must be between 01 and 12');
  }

  return { year, month: monthNumber };
}

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    requireRole(user, 'ADMIN', 'OPERATOR');

    const { searchParams } = new URL(request.url);
    const { year, month } = parseMonth(searchParams.get('month'));

    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    const [energyResult, faultsResult] = await Promise.all([
      query(
        `SELECT DATE(timestamp) AS day, SUM(consumption)::numeric(12,2) AS total_consumption
         FROM energy_usage
         WHERE timestamp >= $1 AND timestamp < $2
         GROUP BY DATE(timestamp)
         ORDER BY day ASC`,
        [periodStart, periodEnd]
      ),
      query(
        `SELECT
           COUNT(*)::int AS total_faults,
           COUNT(*) FILTER (WHERE resolved = TRUE)::int AS resolved_faults,
           COUNT(*) FILTER (WHERE resolved = FALSE)::int AS unresolved_faults
         FROM faults
         WHERE timestamp >= $1 AND timestamp < $2`,
        [periodStart, periodEnd]
      ),
    ]);

    return NextResponse.json({
      month: `${year}-${String(month).padStart(2, '0')}`,
      energyByDay: energyResult.rows.map((row) => ({
        day: row.day,
        totalConsumption: Number(row.total_consumption),
      })),
      faultsSummary: faultsResult.rows[0],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
