import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ServiceError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Datos de entrada inválidos.',
        details: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
      { status: error.status },
    );
  }

  console.error('[API Error]', error);
  return NextResponse.json(
    { error: 'Error interno del servidor.' },
    { status: 500 },
  );
}
