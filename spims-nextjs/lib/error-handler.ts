import { NextResponse } from 'next/server';
import { HttpError } from './auth';

export function handleApiError(error: unknown) {
  console.error('[API ERROR]', error);

  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
