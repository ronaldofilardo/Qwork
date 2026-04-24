import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { buscarDadosManutencaoEntidade } from '@/lib/manutencao-taxa';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const dados = await buscarDadosManutencaoEntidade(entidadeId);
    if (!dados) {
      return NextResponse.json({ alerta: false });
    }

    return NextResponse.json({
      alerta: !dados.laudo_emitido && !dados.ja_cobrada,
      ...dados,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === 'Unauthorized' || error.message.includes('sessão'))
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('[manutencao-status entidade]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
