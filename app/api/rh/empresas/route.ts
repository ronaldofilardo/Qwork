import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withTransaction } from '@/lib/db-transaction';
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
    // Garantir que o gestor RH tem clínica válida
    const session = await requireClinica();

    // requireClinica já garante que session.clinica_id exista e que a clínica seja válida

    // Inclui empresas "owned" pela clínica E empresas de outra clínica que
    // já tenham vínculos (funcionarios_clinicas) com esta clínica — cenário
    // de CNPJ único global (migration 006) compartilhado entre clínicas.
    const result = await query(
      `SELECT ec.id, ec.nome, ec.cnpj, ec.email, ec.ativa, ec.criado_em,
                      ec.telefone, ec.endereco, ec.cidade, ec.estado, ec.cep,
              (SELECT COUNT(*) FROM funcionarios_clinicas WHERE empresa_id = ec.id AND clinica_id = $1 AND ativo = true) as total_funcionarios,
              (SELECT COUNT(*) FROM lotes_avaliacao WHERE empresa_id = ec.id) as total_avaliacoes,
              (SELECT COUNT(*) FROM avaliacoes a JOIN lotes_avaliacao l ON a.lote_id = l.id WHERE l.empresa_id = ec.id AND a.status = 'concluida') as avaliacoes_concluidas
        FROM empresas_clientes ec
        WHERE ec.ativa = true
          AND (
            ec.clinica_id = $1
            OR EXISTS (
              SELECT 1 FROM funcionarios_clinicas fc
              WHERE fc.empresa_id = ec.id AND fc.clinica_id = $1
            )
          )
        ORDER BY ec.nome`,
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
        error.message.includes('tomador não é do tipo clínica') ||
        error.message.includes('Clínica inativa'))
    ) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Verifique se a clínica foi criada e está ativa. Contate o suporte se necessário.',
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
 * Salvar arquivo de documento de empresa
 * Usa função compartilhada que detecta DEV/PROD automaticamente
 */
async function salvarArquivoEmpresa(
  file: File,
  tipo: 'cartao_cnpj' | 'contrato_social' | 'doc_identificacao',
  cnpj: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const cnpjClean = cnpj.replace(/\D/g, '');

  // Usar função compartilhada de storage que detecta DEV/PROD
  const { uploadArquivoCadastro } =
    await import('@/lib/storage/cadastro-storage');
  const result = await uploadArquivoCadastro(buffer, tipo, cnpjClean);

  return result.path;
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

    // Suporte a multipart/form-data (com upload de documentos) e application/json
    const contentType = request.headers.get('content-type') ?? '';
    const isMultipart = contentType.includes('multipart/form-data');

    let body: Record<string, string>;
    const arquivos: Record<string, File | null> = {};

    if (isMultipart) {
      const formData = await request.formData();
      body = Object.fromEntries(
        [...formData.entries()]
          .filter(([, v]) => typeof v === 'string')
          .map(([k, v]) => [k, v as string])
      );
      const fileKeys = [
        'cartao_cnpj',
        'contrato_social',
        'doc_identificacao',
      ] as const;
      for (const key of fileKeys) {
        const f = formData.get(key);
        if (f && f instanceof File && f.size > 0) {
          arquivos[key] = f;
        }
      }

      // Validar arquivos obrigatórios
      const missingFiles = fileKeys.filter((k) => !arquivos[k]);
      if (missingFiles.length > 0) {
        return NextResponse.json(
          {
            error: `Documentos obrigatórios faltando: ${missingFiles.join(', ').replace(/_/g, ' ')}`,
          },
          { status: 400 }
        );
      }

      // Validar tipo e tamanho dos arquivos
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
      ];
      const maxSize = 5 * 1024 * 1024; // 5 MB
      for (const key of fileKeys) {
        const f = arquivos[key]!;
        if (!allowedTypes.includes(f.type)) {
          return NextResponse.json(
            {
              error: `Arquivo "${key.replace(/_/g, ' ')}" deve ser PDF, JPG ou PNG`,
            },
            { status: 400 }
          );
        }
        if (f.size > maxSize) {
          return NextResponse.json(
            {
              error: `Arquivo "${key.replace(/_/g, ' ')}" não pode exceder 5 MB`,
            },
            { status: 400 }
          );
        }
      }
    } else {
      body = await request.json();
    }

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

    // Salvar arquivos ANTES do INSERT para incluir os caminhos na transação
    let cartaoCnpjPath: string | null = null;
    let contratoSocialPath: string | null = null;
    let docIdentificacaoPath: string | null = null;

    if (isMultipart && Object.keys(arquivos).length > 0) {
      try {
        if (arquivos.cartao_cnpj)
          cartaoCnpjPath = await salvarArquivoEmpresa(
            arquivos.cartao_cnpj,
            'cartao_cnpj',
            cnpjNormalizado
          );
        if (arquivos.contrato_social)
          contratoSocialPath = await salvarArquivoEmpresa(
            arquivos.contrato_social,
            'contrato_social',
            cnpjNormalizado
          );
        if (arquivos.doc_identificacao)
          docIdentificacaoPath = await salvarArquivoEmpresa(
            arquivos.doc_identificacao,
            'doc_identificacao',
            cnpjNormalizado
          );
      } catch (err) {
        console.error(
          '[POST /api/rh/empresas] Falha ao salvar documentos:',
          err
        );
        return NextResponse.json(
          { error: 'Falha ao salvar documentos. Tente novamente.' },
          { status: 500 }
        );
      }
    }

    // INSERT incluindo caminhos dos documentos
    const result = await withTransaction(async (client) => {
      return await client.query(
        `INSERT INTO empresas_clientes
         (nome, cnpj, email, telefone, endereco, cidade, estado, cep, clinica_id,
          representante_nome, representante_fone, representante_email, ativa,
          cartao_cnpj_path, contrato_social_path, doc_identificacao_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14, $15)
         RETURNING id, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
                   representante_nome, representante_fone, representante_email, ativa, criado_em,
                   cartao_cnpj_path, contrato_social_path, doc_identificacao_path`,
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
          cartaoCnpjPath,
          contratoSocialPath,
          docIdentificacaoPath,
        ]
      );
    });

    const empresa = result.rows[0];

    return NextResponse.json(empresa, { status: 201 });
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
