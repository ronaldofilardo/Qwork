import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { logAudit } from '@/lib/audit-logger';

/**
 * POST /api/admin/cadastro/clinica
 * Endpoint EXCLUSIVO para admin criar novas clínicas
 * Admin NÃO tem acesso operacional a clínicas após criação
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession();

    // APENAS admin pode criar clínicas
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado: apenas admin pode criar clínicas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, cnpj, endereco, telefone, email } = body;

    // Validação de campos obrigatórios
    if (!nome || !cnpj) {
      return NextResponse.json(
        { error: 'Nome e CNPJ são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato CNPJ (14 dígitos)
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      return NextResponse.json(
        { error: 'CNPJ deve ter 14 dígitos' },
        { status: 400 }
      );
    }

    // Verificar se CNPJ já existe
    const existingClinica = await query(
      'SELECT id, nome FROM clinicas WHERE cnpj = $1',
      [cnpjLimpo]
    );

    if (existingClinica.rows.length > 0) {
      return NextResponse.json(
        {
          error: `CNPJ já cadastrado para clínica: ${existingClinica.rows[0].nome}`,
        },
        { status: 409 }
      );
    }

    // Inserir nova clínica
    const result = await query(
      `INSERT INTO clinicas (nome, cnpj, endereco, telefone, email, ativo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, nome, cnpj, ativo`,
      [nome, cnpjLimpo, endereco || null, telefone || null, email || null]
    );

    const novaClinica = result.rows[0];

    // Log de auditoria
    await logAudit({
      acao: 'INSERT',
      recurso: 'clinicas',
      recurso_id: novaClinica.id.toString(),
      usuario_cpf: session.cpf,
      detalhes: {
        nome: novaClinica.nome,
        cnpj: novaClinica.cnpj,
        ativo: novaClinica.ativo,
      },
    });

    return NextResponse.json(
      {
        message: 'Clínica cadastrada com sucesso',
        clinica: novaClinica,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar clínica:', error);
    return NextResponse.json(
      {
        error: 'Erro ao cadastrar clínica',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
