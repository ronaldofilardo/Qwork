import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// CSV download endpoint removed permanently. Returning 410 Gone to indicate the resource is no longer available.
export function GET() {
  return NextResponse.json({ error: 'CSV download disabled' }, { status: 410 });
}
