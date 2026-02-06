import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  requireRHWithEmpresaAccess,
  requireEntity,
} from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar sessão
    const session = getSession();
    if (!session || (session.perfil !== 'rh' && session.perfil !== 'gestor')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Obter empresa_id da query
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresa_id');

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresa_id é obrigatório' },
        { status: 400 }
      );
    }

    // Autorizar acesso: apenas RH ou gestor com acesso
    if (session.perfil === 'rh') {
      try {
        await requireRHWithEmpresaAccess(Number(empresaId));
      } catch {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    } else {
      // gestor
      try {
        const entity = await requireEntity();
        const empresaCheck = await query(
          'SELECT entidade_id FROM empresas_clientes WHERE id = $1',
          [parseInt(empresaId)]
        );
        if (empresaCheck.rows.length === 0) {
          return NextResponse.json(
            { error: 'Empresa não encontrada' },
            { status: 404 }
          );
        }
        if (empresaCheck.rows[0].entidade_id !== entity.entidade_id) {
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    // Buscar anomalias usando função PostgreSQL (sem ORDER BY para evitar erros quando função não estiver atualizada)
    const result = await query('SELECT * FROM detectar_anomalias_indice($1)', [
      parseInt(empresaId),
    ]);

    // Obter linhas e ordenar em JS por prioridade (CRÍTICA > ALTA > MÉDIA > NORMAL)
    let anomalias = result.rows || [];
    const prioridadeOrder: Record<string, number> = {
      CRÍTICA: 3,
      ALTA: 2,
      MÉDIA: 1,
      NORMAL: 0,
    };

    anomalias = anomalias.sort((a: any, b: any) => {
      const pa = prioridadeOrder[a.prioridade] ?? 0;
      const pb = prioridadeOrder[b.prioridade] ?? 0;
      if (pb !== pa) return pb - pa; // maior prioridade primeiro
      const da = a.dias_desde_ultima_avaliacao ?? -1;
      const db = b.dias_desde_ultima_avaliacao ?? -1;
      if (db !== da) return db - da;
      return (a.nome || '').localeCompare(b.nome || '');
    });

    // Calcular métricas agregadas (tolerante à ausência de campos)
    const metricas = {
      total: anomalias.length,
      criticas: anomalias.filter((a: any) => a.prioridade === 'CRÍTICA').length,
      altas: anomalias.filter((a: any) => a.prioridade === 'ALTA').length,
      medias: anomalias.filter((a: any) => a.prioridade === 'MÉDIA').length,
      nunca_avaliados: anomalias.filter(
        (a: any) => a.categoria_anomalia === 'NUNCA_AVALIADO'
      ).length,
      mais_de_1_ano: anomalias.filter(
        (a: any) => a.categoria_anomalia === 'MAIS_DE_1_ANO_SEM_AVALIACAO'
      ).length,
      indices_atrasados: anomalias.filter(
        (a: any) => a.categoria_anomalia === 'INDICE_MUITO_ATRASADO'
      ).length,
      muitas_inativacoes: anomalias.filter(
        (a: any) => a.categoria_anomalia === 'MUITAS_INATIVACOES'
      ).length,
    };

    return NextResponse.json({
      anomalias,
      metricas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar pendências:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pendências' },
      { status: 500 }
    );
  }
}
