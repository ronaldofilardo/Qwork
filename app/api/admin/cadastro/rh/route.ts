import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { logAudit } from '@/lib/audit-logger';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/cadastro/rh
 * Endpoint EXCLUSIVO para admin criar usuários RH (gestores de clínicas)
 * Admin NÃO tem acesso operacional a funcionários após criação
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession();

    // APENAS admin pode criar RH
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado: apenas admin pode criar usuários RH' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { cpf, nome, email, senha, clinica_id } = body;

    // Validação de campos obrigatórios
    if (!cpf || !nome || !email || !senha || !clinica_id) {
      return NextResponse.json(
        { error: 'CPF, nome, email, senha e clinica_id são obrigatórios' },
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

    // Verificar se clínica existe
    const clinicaResult = await query(
      'SELECT id, nome, ativo FROM clinicas WHERE id = $1',
      [clinica_id]
    );

    if (clinicaResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Clínica ${clinica_id} não encontrada` },
        { status: 404 }
      );
    }

    const clinica = clinicaResult.rows[0];

    if (!clinica.ativo) {
      return NextResponse.json(
        { error: `Clínica ${clinica.nome} está inativa` },
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

    // Inserir novo RH em USUARIOS (não em funcionarios - gestores vão para usuarios)
    const result = await query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo, criado_em, atualizado_em)
       VALUES ($1, $2, $3, $4, 'rh', $5, true, NOW(), NOW())
       RETURNING cpf, nome, email, tipo_usuario, clinica_id, ativo`,
      [cpfLimpo, nome, email, senhaHash, clinica_id]
    );

    const novoRH = result.rows[0];

    // Log de auditoria
    await logAudit({
      acao: 'INSERT',
      recurso: 'usuarios',
      recurso_id: novoRH.cpf,
      usuario_cpf: session.cpf,
      detalhes: {
        nome: novoRH.nome,
        email: novoRH.email,
        perfil: novoRH.perfil,
        clinica_id: novoRH.clinica_id,
        ativo: novoRH.ativo,
      },
    });

    // Remover senha do retorno
    const { senha: _, ...rhSemSenha } = novoRH;

    return NextResponse.json(
      {
        message: 'Usuário RH cadastrado com sucesso',
        rh: rhSemSenha,
        clinica: {
          id: clinica.id,
          nome: clinica.nome,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar RH:', error);
    return NextResponse.json(
      {
        error: 'Erro ao cadastrar RH',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
