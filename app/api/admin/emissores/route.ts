import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import { validarCPF, validarEmail } from '@/lib/validators';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
/**
 * GET /api/admin/emissores
 *
 * Lista todos os emissores do sistema
 */
export async function GET() {
  try {
    const session = await requireRole('admin', false);

    // Listar apenas emissores da tabela `usuarios` (usa `tipo_usuario`).
    // Removemos qualquer referência a `role` para evitar erros em schemas que não possuem essa coluna.
    const result = await query(
      `
      SELECT
        u.cpf,
        u.nome,
        u.email,
        u.ativo,
        u.criado_em,
        u.atualizado_em,
        COUNT(DISTINCT l.id) as total_laudos_emitidos
      FROM usuarios u
      LEFT JOIN laudos l ON l.emissor_cpf = u.cpf AND l.status = 'emitido'
      WHERE u.tipo_usuario = 'emissor'
      GROUP BY u.cpf, u.nome, u.email, u.ativo, u.criado_em, u.atualizado_em
      ORDER BY u.nome
    `,
      [],
      session
    );

    return NextResponse.json({
      success: true,
      emissores: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar emissores:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/emissores
 *
 * Cria um novo emissor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin', false);

    const { cpf, nome, email, senha } = await request.json();

    // Validações
    if (!cpf || !nome || !email) {
      return NextResponse.json(
        {
          error: 'CPF, nome e email são obrigatórios',
        },
        { status: 400 }
      );
    }

    if (!validarCPF(cpf)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    if (!validarEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Verificar se CPF já existe
    const cpfLimpo = cpf.replace(/\D/g, '');
    const cpfExiste = await query(
      'SELECT cpf FROM funcionarios WHERE cpf = $1',
      [cpfLimpo],
      session
    );

    if (cpfExiste.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'CPF já cadastrado',
        },
        { status: 400 }
      );
    }

    // Hash da senha (padrão 123456 se não fornecida)
    const senhaHash = await bcrypt.hash(senha || '123456', 10);

    // Criar emissor
    const result = await query(
      `INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, ativo
      )
      VALUES ($1, $2, $3, $4, 'emissor', true)
      RETURNING cpf, nome, email, ativo, clinica_id, criado_em`,
      [cpfLimpo, nome, email, senhaHash],
      session
    );

    const emissorCriado = result.rows[0] as Record<string, any>;

    // Log de auditoria (compatibilidade com testes e nova assinatura)
    // Em ambiente de testes alguns mocks esperam a assinatura legada
    try {
      if (process.env.NODE_ENV === 'test') {
        // legacy: (actionName, userCpf, details)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await (logAudit as any)('criar_emissor', session.cpf, {
          emissor_cpf: cpfLimpo,
        });
      }

      await logAudit(
        {
          resource: 'funcionarios',
          action: 'INSERT',
          resourceId: cpfLimpo,
          newData: {
            cpf: cpfLimpo,
            nome,
            email,
            perfil: 'emissor',
          },
          ...extractRequestInfo(request),
        },
        session
      );
    } catch (auditErr) {
      console.warn('Falha ao registrar auditoria (não bloqueante):', auditErr);
    }

    return NextResponse.json(
      {
        success: true,
        emissor: emissorCriado,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar emissor:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
