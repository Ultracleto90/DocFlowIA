import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { teamInviteSchema, teamRemoveSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import {
  inviteTeamMember,
  removeTeamMember,
} from '@/services/server/billingService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const body: unknown = await request.json();
    const parsed = teamInviteSchema.parse(body);

    const result = await inviteTeamMember({
      user,
      correo: parsed.correo,
      rol: parsed.rol,
      clientIp: extractClientIp(request),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const { searchParams } = new URL(request.url);
    let correoParam: unknown = searchParams.get('correo');
    if (!correoParam) {
      const body: unknown = await request.json().catch(() => ({}));
      if (body && typeof body === 'object' && 'correo' in body) {
        correoParam = (body as { correo?: unknown }).correo;
      }
    }

    const parsed = teamRemoveSchema.parse({ correo: correoParam });
    const result = await removeTeamMember({
      user,
      correo: parsed.correo,
      clientIp: extractClientIp(request),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
