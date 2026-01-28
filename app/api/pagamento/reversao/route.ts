 import { NextRequest, NextResponse } from 'next/server';

export function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Endpoint de reversão desativado. Reversões são tratadas manualmente.',
    },
    { status: 410 }
  );
}
