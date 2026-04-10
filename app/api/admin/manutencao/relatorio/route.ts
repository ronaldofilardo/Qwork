import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import {
  buscarEntidadesPendentesManutencao,
  buscarEmpresasPendentesManutencao,
} from '@/lib/manutencao-taxa';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/manutencao/relatorio
 * Retorna entidades e empresas de clínicas com cobrança de taxa de manutenção pendente.
 * Apenas administradores e suporte têm acesso.
 *
 * Critérios para aparecer no relatório:
 *   - limite_primeira_cobranca_manutencao <= hoje
 *   - manutencao_ja_cobrada = false
 *   - Nenhum laudo emitido/enviado
 */
export async function GET() {
  const session = getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.perfil !== 'admin' && session.perfil !== 'suporte') {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });
  }

  try {
    const [entidades, empresas] = await Promise.all([
      buscarEntidadesPendentesManutencao(),
      buscarEmpresasPendentesManutencao(),
    ]);

    return NextResponse.json({
      entidades,
      empresas,
      total: entidades.length + empresas.length,
    });
  } catch (error) {
    console.error('[GET /api/admin/manutencao/relatorio] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatório de manutenção' },
      { status: 500 }
    );
  }
}
