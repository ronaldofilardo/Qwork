import { NextResponse } from 'next/server';

export function GET() {
  // Upload de documentos habilitado. Pode ser bloqueado via DISABLE_ANEXOS=true.
  const disableAnexos =
    process.env.DISABLE_ANEXOS === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS === 'true';

  return NextResponse.json({ disableAnexos });
}
