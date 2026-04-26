/**
 * ROTA DEPRECADA — Use POST /api/pagamento/confirmar
 *
 * Esta rota foi desativada por motivos de segurança (sem ownership verification).
 * O fluxo correto passa por /api/pagamento/iniciar → /api/pagamento/confirmar.
 */
import { NextResponse } from 'next/server';

export function POST(): NextResponse {
  return NextResponse.json(
    { error: 'Rota deprecada. Use POST /api/pagamento/confirmar' },
    { status: 410 }
  );
}
