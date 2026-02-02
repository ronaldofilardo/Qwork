import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireClinica } from '@/lib/session';
import { normalizeCNPJ, validarCNPJ } from '@/lib/validators';

export const dynamic = 'force-dynamic';

/**
 * Helper function to map database errors to HTTP responses
 */
function handleDatabaseError(error: any): NextResponse {
  console.error('Database error:', error);

  // PostgreSQL unique violation (constraint error)
  if (error.code === '23505') {
    if (error.constraint?.includes('cnpj')) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado no sistema' },
        { status: 409 }
      );
    }
  }

  // PostgreSQL foreign key violation
  if (error.code === '23503') {
    return NextResponse.json(
      { error: 'Referência inválida (clínica não encontrada)' },
      { status: 400 }
    );
  }

  // Generic error
  return NextResponse.json(
    { error: 'Erro ao processar operação' },
    { status: 500 }
  );
}

/**
 * GET /api/rh/empresas
 * Lista empresas da clínica do RH logado
 * RLS filtra automaticamente por clinica_id
 */
export async function GET() {
  try {
    // Garantir que o gestor RH tem clínica válida (aplica fallback por contratante_id)
    const session = await requireClinica();

    // requireClinica já garante que session.clinica_id exista e que a clínica seja válida

    // Buscar empresas da clínica diretamente
    const result = await query(
      `SELECT id, nome, cnpj, email, ativa, criado_em,
                      telefone, endereco, cidade, estado, cep,
              (SELECT COUNT(*) FROM funcionarios WHERE empresa_id = empresas_clientes.id AND ativo = true) as total_funcionarios,
              (SELECT COUNT(*) FROM lotes_avaliacao WHERE empresa_id = empresas_clientes.id) as total_avaliacoes,
              (SELECT COUNT(*) FROM avaliacoes a JOIN lotes_avaliacao l ON a.lote_id = l.id WHERE l.empresa_id = empresas_clientes.id AND a.status = 'concluida') as avaliacoes_concluidas
        FROM empresas_clientes
        WHERE ativa = true AND clinica_id = $1
        ORDER BY nome`,
      [session.clinica_id],
      session
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar empresas:', error);

    // Se for erro de clínica, retornar 403 com mensagem mais detalhada
    if (
      error instanceof Error &&
      (error.message.includes('Clínica não identificada') ||
        error.message.includes('Contratante não é do tipo clínica') ||
        error.message.includes('Clínica inativa'))
    ) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Verifique se a clínica vinculada ao contratante foi criada e está ativa. Contate o suporte se necessário.',
        },
        { status: 403 }
      );
    }

    // Se for erro de contexto de sessão, retornar 401 com mensagem clara
    if (
      error instanceof Error &&
      error.message.includes('Contexto de sessão inválido')
    ) {
      return NextResponse.json(
        {
          error:
            'Sessão inválida: usuário não encontrado ou inativo. Efetue logout e entre novamente ou contate o suporte.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao listar empresas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rh/empresas
 * Cria nova empresa vinculada à clínica do RH logado
 * RLS garante que INSERT só ocorre na clínica do RH
 */
export async function POST(request: Request) {
  try {
    // Validar que a clínica existe e está ativa antes de tentar inserir
    const session = await requireClinica();

    // requireClinica já garante que session.clinica_id existe e que a clínica é válida

    const body = await request.json();
    const { nome, cnpj, email, telefone, endereco, cidade, estado, cep } = body;
    const { representante_nome, representante_fone, representante_email } =
      body;

    // Validações de negócio - Dados da Empresa
    if (!nome || nome.trim().length < 3) {
      return NextResponse.json(
        { error: 'Nome deve ter no mínimo 3 caracteres' },
        { status: 400 }
      );
    }

    if (!cnpj) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    // Normalizar e validar CNPJ
    const cnpjNormalizado = normalizeCNPJ(cnpj);
    if (!validarCNPJ(cnpjNormalizado)) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
    }

    // Validar email da empresa se fornecido
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Email da empresa inválido' },
        { status: 400 }
      );
    }

    // Validações do representante (obrigatórios)
    if (!representante_nome || representante_nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do representante é obrigatório' },
        { status: 400 }
      );
    }

    // Exigir nome e sobrenome
    if (representante_nome.trim().split(/\s+/).length < 2) {
      return NextResponse.json(
        { error: 'Nome do representante deve incluir nome e sobrenome' },
        { status: 400 }
      );
    }

    // Telefone do representante deve ter ao menos 10 dígitos
    if (
      !representante_fone ||
      !/\d{10,11}/.test(representante_fone.replace(/\D/g, ''))
    ) {
      return NextResponse.json(
        { error: 'Telefone do representante inválido' },
        { status: 400 }
      );
    }

    // Email do representante, se fornecido, deve ser válido
    if (
      representante_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(representante_email)
    ) {
      return NextResponse.json(
        { error: 'Email do representante inválido' },
        { status: 400 }
      );
    }

    // RLS garante que INSERT só pode ocorrer na clínica do RH
    // Passar session para que app.current_user_cpf seja definido para auditoria
    const result = await query(
      `INSERT INTO empresas_clientes 
       (nome, cnpj, email, telefone, endereco, cidade, estado, cep, clinica_id, representante_nome, representante_fone, representante_email, ativa)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
       RETURNING id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, representante_nome, representante_fone, representante_email, ativa, criado_em`,
      [
        nome.trim(),
        cnpjNormalizado,
        email?.trim() || null,
        telefone?.trim() || null,
        endereco?.trim() || null,
        cidade?.trim() || null,
        estado?.trim() || null,
        cep?.trim() || null,
        session.clinica_id,
        representante_nome.trim(),
        representante_fone.replace(/\D/g, ''),
        representante_email?.trim() || null,
      ],
      session
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    // Se requireClinica lançou erro (clínica não encontrada/inativa/identificada), mapear para 403
    if (
      error instanceof Error &&
      (error.message.includes('Clínica não encontrada') ||
        error.message.includes('Clínica inativa') ||
        error.message.includes('Clínica não identificada'))
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    // Tratar erro de CNPJ duplicado especificamente (agora é global)
    if (error.code === '23505' && error.constraint?.includes('cnpj')) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado no sistema' },
        { status: 409 }
      );
    }

    console.error('[POST /api/rh/empresas] Erro:', error);
    return handleDatabaseError(error);
  }
}
