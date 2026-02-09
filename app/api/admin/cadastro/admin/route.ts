import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { logAudit } from '@/lib/audit-logger';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/cadastro/admin
 * Endpoint EXCLUSIVO para admin criar outros administradores
 * Apenas admin existente pode criar novos admins
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession();

    // APENAS admin pode criar outros admins
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado: apenas admin pode criar administradores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { cpf, nome, email, senha } = body;

    // Validação de campos obrigatórios
    if (!cpf || !nome || !email || !senha) {
      return NextResponse.json(
        { error: 'CPF, nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato CPF (11 dígitos)
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      );
    }

    // Validar senha (mínimo 8 caracteres)
    if (senha.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se CPF já existe
    const existingFunc = await query(
      'SELECT cpf, nome, perfil FROM funcionarios WHERE cpf = $1',
      [cpfLimpo]
    );

    if (existingFunc.rows.length > 0) {
      const func = existingFunc.rows[0];
      return NextResponse.json(
        {
          error: `CPF já cadastrado para: ${func.nome} (perfil: ${func.perfil})`,
        },
        { status: 409 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir novo admin (sem clinica_id, sem empresa_id)
    const result = await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo)
       VALUES ($1, $2, $3, $4, 'admin', true)
       RETURNING cpf, nome, email, perfil, ativo`,
      [cpfLimpo, nome, email, senhaHash]
    );

    const novoAdmin = result.rows[0];

    // Log de auditoria
    await logAudit({
      acao: 'INSERT',
      recurso: 'funcionarios',
      recurso_id: novoAdmin.cpf,
      usuario_cpf: session.cpf,
      detalhes: {
        nome: novoAdmin.nome,
        email: novoAdmin.email,
        perfil: novoAdmin.perfil,
        ativo: novoAdmin.ativo,
      },
    });

    // Remover senha do retorno
    const { senha: _, ...adminSemSenha } = novoAdmin;

    return NextResponse.json(
      {
        message: 'Administrador cadastrado com sucesso',
        admin: adminSemSenha,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar admin:', error);
    return NextResponse.json(
      {
        error: 'Erro ao cadastrar admin',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
