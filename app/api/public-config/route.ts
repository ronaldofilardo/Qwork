import { NextResponse } from 'next/server';

export function GET() {
  try {
    // Permite controlar sem rebuild via env var sem prefixo NEXT_PUBLIC_
    const disableAnexos =
      process.env.DISABLE_ANEXOS === 'true' ||
      process.env.NEXT_PUBLIC_DISABLE_ANEXOS === 'true';

    return NextResponse.json({ disableAnexos });
  } catch {
    return NextResponse.json({ disableAnexos: false });
  }
}
