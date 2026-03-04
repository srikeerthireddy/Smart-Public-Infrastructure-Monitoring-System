import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Public endpoint - no authentication required

    const { rows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
         COUNT(*) FILTER (WHERE status = 'OFF')::int AS off,
         COUNT(*) FILTER (WHERE status = 'FAULT')::int AS fault,
         COUNT(*)::int AS total
       FROM (
         SELECT DISTINCT ON (location)
           location,
           status,
           timestamp
         FROM streetlights
         ORDER BY location, timestamp DESC
       ) latest`
    );

    return NextResponse.json({
      active: rows[0].active,
      off: rows[0].off,
      fault: rows[0].fault,
      total: rows[0].total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
