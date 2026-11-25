import { NextResponse } from 'next/server';
import { scheduleDemoSchema } from '@/core/schemas';
import { scheduleDemoAppointment } from '@/services/server/advisorService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = scheduleDemoSchema.parse(body);
    const clientIp = extractClientIp(request);

    const result = await scheduleDemoAppointment(parsed, clientIp);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
