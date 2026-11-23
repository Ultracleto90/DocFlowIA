import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createProjectMetaSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { handleRouteError, ServiceError } from '@/services/server/errors';
import {
  createProjectFromZip,
  listProjectsForUser,
} from '@/services/server/projectService';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const data = await listProjectsForUser(user);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);
    const clientIp = extractClientIp(request);

    const formData = await request.formData();
    const parsed = createProjectMetaSchema.parse({
      nombre_proyecto: formData.get('nombre_proyecto'),
      framework: formData.get('framework'),
    });

    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new ServiceError(400, 'Debes adjuntar un archivo .zip válido.');
    }

    const created = await createProjectFromZip({
      user,
      nombre_proyecto: parsed.nombre_proyecto,
      framework: parsed.framework,
      file,
      clientIp,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
