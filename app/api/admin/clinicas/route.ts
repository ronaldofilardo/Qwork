import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import { validarCNPJ, validarEmail } from '@/lib/validators';

export const dynamic = 'force-dynamic';

interface PostgresError extends Error {
  code?: string;
  constraint?: string;
}

export async function GET() {
  try {
    const session = await requireRole('admin');

    const result = await query(
      `SELECT 
         id, nome, cnpj, email, telefone, endereco,
         cidade, estado, ativa,
         responsavel_nome, responsavel_cpf, responsavel_email,
         TO_CHAR(criado_em, 'YYYY-MM-DD HH24:MI:SS') as criado_em
       FROM clinicas
       ORDER BY criado_em DESC`,
      [],
      session
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar clínicas:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin');

    const data = await request.json();
    const {
      nome,
      _razao_social,
      cnpj,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      _inscricao_estadual,
      responsavel_nome,
      responsavel_cpf,
      responsavel_email,
      // ⚠️ Parâmetro 'rh' ignorado: Criação de RH é EXCLUSIVA DO SISTEMA após confirmação de pagamento
    } = data;

    // Validações básicas
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da clínica é obrigatório' },
        { status: 400 }
      );
    }

    if (!cnpj) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    // Validar CNPJ
    if (!validarCNPJ(cnpj)) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
    }

    // Validar email se fornecido
    if (email && !validarEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // ❌ BLOQUEADO: Não aceitamos mais criação manual de RH no cadastro de clínica
    // Explicitamente ignorar se fornecido (não falhar, apenas ignorar silenciosamente)
    // Criação de RH ocorre automaticamente após confirmação de pagamento

    // Limpar CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    // Verificar se CNPJ já existe em clinicas ou entidades
    const cnpjExisteClinicas = await query(
      'SELECT 1 FROM clinicas WHERE cnpj = $1',
      [cnpjLimpo],
      session
    );

    const cnpjExisteEntidades = await query(
      'SELECT 1 FROM entidades WHERE cnpj = $1',
      [cnpjLimpo],
      session
    );

    if (
      cnpjExisteClinicas.rows.length > 0 ||
      cnpjExisteEntidades.rows.length > 0
    ) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      );
    }

    // Iniciar transação
    await query('BEGIN', [], session);

    try {
      // Inserir clínica na tabela clinicas (arquitetura segregada)
      const resultClinica = await query(
        `INSERT INTO clinicas (
          nome, cnpj, email, telefone, endereco,
          cidade, estado, ativa,
          responsavel_nome, responsavel_cpf,
          responsavel_email
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10)
        RETURNING id, nome, cnpj, email, telefone, endereco,
                  cidade, estado, ativa,
                  responsavel_nome, responsavel_cpf, responsavel_email,
                  TO_CHAR(criado_em, 'YYYY-MM-DD HH24:MI:SS') as criado_em`,
        [
          nome,
          cnpjLimpo,
          email || null,
          telefone || null,
          endereco || null,
          cidade || null,
          estado || null,
          responsavel_nome || 'Responsável',
          responsavel_cpf?.replace(/\D/g, '') || '00000000000',
          responsavel_email || email || null,
        ],
        session
      );

      const clinicaCriada = resultClinica.rows[0] as Record<string, any>;

      // ❌ BLOQUEADO: Criação de RH é EXCLUSIVA DO SISTEMA
      // RH será criado automaticamente quando a clínica confirmar o pagamento
      // Nunca criar RH manualmente aqui!

      // Log de auditoria para criação da clínica
      await logAudit(
        {
          resource: 'clinicas',
          action: 'INSERT',
          resourceId: clinicaCriada.id,
          newData: {
            id: clinicaCriada.id,
            tipo: 'clinica',
            nome,
            cnpj: cnpjLimpo,
            email,
            telefone,
            endereco,
            cidade,
            estado,
            status: 'aprovado',
          },
          ...extractRequestInfo(request),
        },
        session
      );

      await query('COMMIT', [], session);

      // ✅ Resposta clara: RH será criado DEPOIS, pelo sistema
      return NextResponse.json(
        {
          success: true,
          message: 'Clínica cadastrada com sucesso',
          clinica: clinicaCriada,
          proximo_passo: {
            titulo: 'Aguardando Confirmação de Pagamento',
            descricao:
              'Após a clínica confirmar o pagamento, o sistema criará automaticamente a conta RH',
            detalhes: [
              'RH fará login com: CPF do responsável',
              'RH fará login com: Senha = últimos 6 dígitos do CNPJ',
              'Acesso será liberado em: /rh (área exclusiva de RH)',
            ],
          },
        },
        { status: 201 }
      );
    } catch (transactionError) {
      await query('ROLLBACK', [], session);
      throw transactionError;
    }
  } catch (error) {
    console.error('Erro ao criar clínica:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se é erro de CNPJ duplicado
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'constraint' in error &&
      (error as PostgresError).code === '23505' &&
      ((error as PostgresError).constraint === 'clinicas_cnpj_key' ||
        (error as PostgresError).constraint === 'tomadors_cnpj_key')
    ) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
