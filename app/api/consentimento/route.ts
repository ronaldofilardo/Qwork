/**
}
export const dynamic = 'force-dynamic';
/**
 * API de Consentimento LGPD
 *
 * Registra consentimento explícito do funcionário para avaliações psicossociais
 * Conforme Art. 7º da LGPD
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { extrairIP, mascararCPFParaLog } from '@/lib/cpf-utils';

export interface ConsentimentoRequest {
  avaliacao_id: number;
  base_legal:
    | 'contrato'
    | 'obrigacao_legal'
    | 'consentimento'
    | 'interesse_legitimo';
  consentimento_explicito?: boolean; // true se funcionário aceitou ativamente
  documento_consentimento?: string; // hash ou referência ao documento
}

/**
 * POST /api/consentimento
 *
 * Registra consentimento para uma avaliação
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body: ConsentimentoRequest = await request.json();

    const {
      avaliacao_id,
      base_legal,
      consentimento_explicito,
      documento_consentimento,
    } = body;

    // Validações
    if (!avaliacao_id || !base_legal) {
      return NextResponse.json(
        { error: 'avaliacao_id e base_legal são obrigatórios' },
        { status: 400 }
      );
    }

    const basesLegaisValidas = [
      'contrato',
      'obrigacao_legal',
      'consentimento',
      'interesse_legitimo',
    ];
    if (!basesLegaisValidas.includes(base_legal)) {
      return NextResponse.json(
        {
          error:
            'base_legal inválida. Use: contrato, obrigacao_legal, consentimento ou interesse_legitimo',
        },
        { status: 400 }
      );
    }

    // Se base legal for "consentimento", exigir confirmação explícita
    if (base_legal === 'consentimento' && !consentimento_explicito) {
      return NextResponse.json(
        {
          error:
            'Para base_legal "consentimento", é necessário consentimento_explicito=true',
        },
        { status: 400 }
      );
    }

    // Extrair IP do request
    const ipOrigem = extrairIP(request);

    // Verificar se avaliação existe e pertence ao funcionário
    const avaliacaoCheck = await query(
      `
      SELECT a.id, a.funcionario_cpf, f.nome
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.id = $1
    `,
      [avaliacao_id]
    );

    if (avaliacaoCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    const avaliacao = avaliacaoCheck.rows[0];

    // Verificar se é o próprio funcionário ou RH/Admin
    const isProprioFuncionario = avaliacao.funcionario_cpf === session.cpf;
    const isRHouAdmin = ['rh', 'admin'].includes(session.perfil);

    if (!isProprioFuncionario && !isRHouAdmin) {
      return NextResponse.json(
        {
          error:
            'Sem permissão para registrar consentimento para esta avaliação',
        },
        { status: 403 }
      );
    }

    // Atualizar avaliação com dados de consentimento
    const resultado = await query(
      `
      UPDATE avaliacoes
      SET 
        base_legal = $1,
        data_consentimento = NOW(),
        ip_consentimento = $2,
        consentimento_documento = $3
      WHERE id = $4
      RETURNING id, base_legal, data_consentimento, ip_consentimento
    `,
      [base_legal, ipOrigem, documento_consentimento || null, avaliacao_id]
    );

    // Log de auditoria
    console.log(`✅ Consentimento registrado:`, {
      avaliacao_id,
      funcionario: mascararCPFParaLog(avaliacao.funcionario_cpf),
      base_legal,
      ip: ipOrigem,
      registrado_por: mascararCPFParaLog(session.cpf),
      data: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Consentimento registrado com sucesso',
        consentimento: {
          avaliacao_id: resultado.rows[0].id,
          base_legal: resultado.rows[0].base_legal,
          data_consentimento: resultado.rows[0].data_consentimento,
          registrado_por: session.perfil,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao registrar consentimento:', error);

    if (error instanceof Error && error.message.includes('Sem permissão')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consentimento?avaliacao_id=123
 *
 * Consulta dados de consentimento de uma avaliação
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const avaliacaoId = searchParams.get('avaliacao_id');

    if (!avaliacaoId) {
      return NextResponse.json(
        { error: 'avaliacao_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados de consentimento
    const resultado = await query(
      `
      SELECT 
        a.id,
        a.base_legal,
        a.data_consentimento,
        a.ip_consentimento,
        a.consentimento_documento,
        f.nome as funcionario_nome
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.id = $1
    `,
      [avaliacaoId]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    const avaliacao = resultado.rows[0];

    // Verificar permissão
    const funcionarioCheck = await query(
      `
      SELECT funcionario_cpf FROM avaliacoes WHERE id = $1
    `,
      [avaliacaoId]
    );

    const isProprioFuncionario =
      funcionarioCheck.rows[0]?.funcionario_cpf === session.cpf;
    const isRHouAdmin = ['rh', 'admin', 'emissor'].includes(session.perfil);

    if (!isProprioFuncionario && !isRHouAdmin) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar este consentimento' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      consentimento: {
        avaliacao_id: avaliacao.id,
        funcionario: isRHouAdmin ? avaliacao.funcionario_nome : 'Você',
        base_legal: avaliacao.base_legal,
        data_consentimento: avaliacao.data_consentimento,
        ip_consentimento: avaliacao.ip_consentimento,
        tem_documento: !!avaliacao.consentimento_documento,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao consultar consentimento:', error);

    if (error instanceof Error && error.message.includes('Sem permissão')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
