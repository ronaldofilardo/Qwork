import { NextRequest, NextResponse } from 'next/server';
import { obterContrato } from '@/lib/contratos/contratos';
import { requireRole } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação e autorização obrigatórias — impede acesso anônimo
    const session = await requireRole(
      ['suporte', 'admin', 'gestor', 'rh'],
      false
    );

    const contratoId = params.id;

    if (!contratoId) {
      return NextResponse.json(
        { error: 'ID do contrato é obrigatório' },
        { status: 400 }
      );
    }

    const contrato = await obterContrato(parseInt(contratoId));

    if (!contrato) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    // Ownership check para tenants: gestor/rh só podem ver o próprio contrato
    if (
      session.perfil === 'gestor' &&
      contrato.tomador_id !== session.entidade_id
    ) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }
    if (session.perfil === 'rh' && contrato.tomador_id !== session.clinica_id) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contrato,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Não autenticado' || error.message === 'Sem permissão')
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao consultar contrato:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar contrato' },
      { status: 500 }
    );
  }
}
