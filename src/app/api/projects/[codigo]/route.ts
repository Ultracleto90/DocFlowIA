import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { webhookConfigSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';
import {
  deleteProjectForUser,
  getProjectDetailForUser,
  updateProjectWebhook,
} from '@/services/server/projectService';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ codigo: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { codigo } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const detail = await getProjectDetailForUser(
      user,
      codigo,
      extractClientIp(request),
    );
    return NextResponse.json(detail, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { codigo } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const deleted = await deleteProjectForUser(
      user,
      codigo,
      extractClientIp(request),
    );
    return NextResponse.json(deleted, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { codigo } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const body: unknown = await request.json();
    const parsed = webhookConfigSchema.parse(body);

    const project = await updateProjectWebhook(
      user,
      codigo,
      parsed.webhook_url,
      extractClientIp(request),
    );

    return NextResponse.json({ project }, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
