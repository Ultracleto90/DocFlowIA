import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  return NextResponse.json(
    {
      status: dbHealth.healthy ? 'ok' : 'degraded',
      service: 'docuflow-ai',
      timestamp: new Date().toISOString(),
      database: dbHealth.connections,
    },
    { status: dbHealth.healthy ? 200 : 503 },
  );
}
