// API Route para gerenciamento de planos
// GET: Listar planos
// POST: Criar plano personalizado (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { validateInput, PlanoSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Verificar autenticação e permissão admin
    await requireRole('admin');

    // Buscar todos os planos
    const result = await query(
      'SELECT * FROM planos WHERE ativo = true ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      planos: result.rows,
    });
  } catch (error) {
    console.error('[API] Erro ao listar planos:', error);

    if (error instanceof Error && error.message === 'MFA_REQUIRED') {
      return NextResponse.json(
        {
          error: 'MFA_REQUIRED',
          message: 'Autenticação de dois fatores requerida',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao listar planos',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissão admin com MFA
    const session = await requireRole('admin');

    if (!session.mfaVerified) {
      return NextResponse.json(
        {
          error: 'MFA_REQUIRED',
          message: 'MFA não verificado para esta operação',
        },
        { status: 403 }
      );
    }

    // Validar body
    const body = await request.json();
    const validation = validateInput(PlanoSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validação falhou', details: validation.errors },
        { status: 400 }
      );
    }

    const plano = validation.data as {
      tipo: string;
      nome: string;
      descricao?: string;
      valor_por_funcionario: number;
      ativo?: boolean;
    };

    // Apenas planos personalizados podem ser criados via API
    if (plano.tipo !== 'personalizado') {
      return NextResponse.json(
        { error: 'Apenas planos personalizados podem ser criados via API' },
        { status: 400 }
      );
    }

    // Inserir plano
    const result = await query(
      `INSERT INTO planos (tipo, nome, descricao, valor_por_funcionario, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        plano.tipo,
        plano.nome,
        plano.descricao,
        plano.valor_por_funcionario,
        plano.ativo,
      ]
    );

    // Registrar auditoria
    await query(
      `INSERT INTO auditoria_planos (plano_id, acao, dados_novos, usuario_cpf)
       VALUES ($1, $2, $3, $4)`,
      [
        result.rows[0].id,
        'criacao',
        JSON.stringify(result.rows[0]),
        session.cpf,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        plano: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Erro ao criar plano:', error);

    return NextResponse.json(
      {
        error: 'Erro ao criar plano',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
