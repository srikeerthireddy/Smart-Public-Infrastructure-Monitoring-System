import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const startedAt = Date.now();
    await query('SELECT 1');
    
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected' },
      { status: 500 }
    );
  }
}
