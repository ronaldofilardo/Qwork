import { NextResponse } from 'next/server';
import { requireClinica } from '@/lib/session';
import { buscarDadosManutencaoClinica } from '@/lib/manutencao-taxa';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireClinica();
    const clinicaId = session.clinica_id;

    const empresas = await buscarDadosManutencaoClinica(clinicaId);

    const alertas = empresas.filter((e) => !e.laudo_emitido && !e.ja_cobrada);

    return NextResponse.json({ empresas, alertas });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === 'Unauthorized' || error.message.includes('sessão'))
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('[manutencao-status clinica]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
