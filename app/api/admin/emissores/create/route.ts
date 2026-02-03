import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { criarEmissorIndependente, query } from '@/lib/db';
import { validarCPF, validarEmail } from '@/lib/validators';
import { logAudit, extractRequestInfo } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/emissores/create
 *
 * Cria um novo emissor independente (sem vinculo a clinica_id)
 * Apenas admins podem acessar
 */

export async function POST(request: NextRequest) {
  try {
    // Verificar permissão de admin (não requer MFA para criação de emissores)
    const session = await requireRole('admin', false);

    const body = await request.json();
    const cpfRaw = body.cpf?.toString?.() ?? '';
    const nomeRaw = body.nome?.toString?.() ?? '';
    const emailRaw = body.email?.toString?.() ?? '';
    const senha = body.senha;

    // Validações básicas
    if (!cpfRaw || !nomeRaw || !emailRaw) {
      return NextResponse.json(
        { error: 'CPF, nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    const cpf = cpfRaw.replace(/\D/g, '').trim();
    const nome = nomeRaw.trim();
    const email = emailRaw.trim();

    if (cpf.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    console.debug('[VALIDAR_CPF] cpf:', cpf, 'resultado:', validarCPF(cpf));

    if (!validarCPF(cpf)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Validação de nome (mínimo 3 caracteres)
    if (nome.length < 3) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (!validarEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Verificar se CPF já existe e validar conflitos com gestores
    const funcionarioRow = await query(
      'SELECT cpf, perfil FROM funcionarios WHERE cpf = $1 LIMIT 1',
      [cpf]
    );

    if (funcionarioRow.rows.length > 0) {
      const perfilExistente = funcionarioRow.rows[0].perfil;
      if (perfilExistente === 'rh') {
        return NextResponse.json(
          {
            error:
              'CPF pertence a um gestor RH; não pode ser cadastrado como emissor',
          },
          { status: 409 }
        );
      }

      if (perfilExistente === 'emissor') {
        return NextResponse.json(
          { error: 'CPF já cadastrado' },
          { status: 409 }
        );
      }

      // Outros perfis também bloqueiam por duplicidade
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }

    // Verificar se CPF é gestor_de_entidade via contratantes_senhas (gestor_entidade)
    const gestorEntidade = await query(
      `SELECT 1 FROM contratantes_senhas cs JOIN contratantes c ON c.id = cs.contratante_id
       WHERE cs.cpf = $1 AND c.tipo = 'entidade' AND c.ativa = true`,
      [cpf]
    );

    if (gestorEntidade.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            'CPF pertence a um gestor de entidade; não pode ser cadastrado como emissor',
        },
        { status: 409 }
      );
    }

    // Validações adicionais com funções específicas
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    if (!validarEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Criar emissor independente
    const emissor = await criarEmissorIndependente(
      cpfLimpo,
      nome,
      email,
      senha,
      session
    );

    // Log de auditoria
    const requestInfo = extractRequestInfo(request);
    await logAudit(
      {
        ...requestInfo,
        resource: 'funcionarios',
        action: 'INSERT',
        resourceId: emissor.cpf,
        newData: {
          perfil: 'emissor',
          clinica_id: null,
          nome: emissor.nome,
          email: emissor.email,
        },
        details: 'Criação de emissor independente via admin',
      },
      session
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Emissor criado com sucesso',
        emissor: {
          cpf: emissor.cpf,
          nome: emissor.nome,
          email: emissor.email,
          clinica_id: null,
        },
        senha_temporaria: senha || '123456',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Erro ao criar emissor:', error);

    // Tratamento de erros específicos
    if (error instanceof Error) {
      if (error.message === 'Sem permissão') {
        return NextResponse.json(
          {
            error:
              'Acesso negado. Apenas administradores podem criar emissores.',
          },
          { status: 403 }
        );
      }

      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'CPF já cadastrado no sistema' },
          { status: 409 }
        );
      }

      if (error.message.includes('Apenas administradores')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Erro interno ao criar emissor' },
      { status: 500 }
    );
  }
}
