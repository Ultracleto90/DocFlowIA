import { NextResponse } from 'next/server';
import { getPlansCatalog } from '@/services/server/billingService';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getPlansCatalog(), { status: 200 });
}
