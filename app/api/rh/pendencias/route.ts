import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  requireRHWithEmpresaAccess,
  requireEntity,
} from '@/lib/session';
import { query } from '@/lib/db';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar sessão
    const session = getSession();
    assertRoles(session, [ROLES.RH, ROLES.GESTOR]);

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

    return NextResponse.json({
      anomalias: [],
      metricas: {
        total: 0,
        criticas: 0,
        altas: 0,
        medias: 0,
        nunca_avaliados: 0,
        mais_de_1_ano: 0,
        indices_atrasados: 0,
        muitas_inativacoes: 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('Erro ao buscar pendências:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pendências' },
      { status: 500 }
    );
  }
}
