/**
 * POST /api/public/representantes/cadastro
 *
 * Rota PÚBLICA — recebe cadastro de representante vindo da landing page.
 * Aceita multipart/form-data com dados pessoais + upload de documentos.
 *
 * PF: arquivo de CPF obrigatório
 * PJ: cartão CNPJ + CPF do responsável obrigatórios
 *
 * Rate limit: 5 cadastros/hora por IP
 * Honeypot: campo "website" deve estar vazio (anti-bot)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// ---------------------------------------------------------------------------
// CORS — permite requisições da landing page (qwork.app.br) e do próprio app
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://www.qwork.app.br',
  'https://qwork.app.br',
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_BASE_URL,
].filter(Boolean) as string[];

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/** Preflight OPTIONS para CORS */
export function OPTIONS(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
import {
  validarCPF,
  validarCNPJ,
  validarEmail,
  sanitizarString,
  limparNumeros,
  processarDocumentosUpload,
} from './helpers';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Rate limit em memória (por IP, janela de 1h)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Rate limit por IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Muitas tentativas. Aguarde 1 hora antes de tentar novamente.',
          code: 'RATE_LIMIT',
        },
        { status: 429 }
      );
    }

    // 2. Parsear FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Envie os dados como multipart/form-data',
          code: 'INVALID_FORMAT',
        },
        { status: 400 }
      );
    }

    // 3. Honeypot check
    const honeypot = (formData.get('website') as string) ?? '';
    if (honeypot.length > 0) {
      // Bot detectado — retorna sucesso falso
      return NextResponse.json({
        success: true,
        id: 'ok',
        status: 'pendente_verificacao',
      });
    }

    // 4. Extrair e validar campos comuns
    const tipoPessoa = (formData.get('tipo_pessoa') as string)?.toLowerCase();
    if (tipoPessoa !== 'pf' && tipoPessoa !== 'pj') {
      return NextResponse.json(
        {
          success: false,
          error: 'tipo_pessoa deve ser PF ou PJ',
          field: 'tipo_pessoa',
          code: 'VALIDATION',
        },
        { status: 400 }
      );
    }

    const nome = sanitizarString((formData.get('nome') as string) ?? '');
    if (!nome || nome.length < 3 || nome.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome deve ter entre 3 e 200 caracteres',
          field: 'nome',
          code: 'VALIDATION',
        },
        { status: 400 }
      );
    }

    const email = ((formData.get('email') as string) ?? '')
      .trim()
      .toLowerCase();
    if (!validarEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'E-mail inválido',
          field: 'email',
          code: 'VALIDATION',
        },
        { status: 400 }
      );
    }

    const telefone = limparNumeros((formData.get('telefone') as string) ?? '');
    if (telefone.length < 10 || telefone.length > 11) {
      return NextResponse.json(
        {
          success: false,
          error: 'Telefone inválido (DDD + número)',
          field: 'telefone',
          code: 'VALIDATION',
        },
        { status: 400 }
      );
    }

    // 5. Validar campos específicos por tipo de pessoa
    let cpf: string | null = null;
    let cnpj: string | null = null;
    let razaoSocial: string | null = null;
    let cpfResponsavel: string | null = null;

    if (tipoPessoa === 'pf') {
      cpf = limparNumeros((formData.get('cpf') as string) ?? '');
      if (!validarCPF(cpf)) {
        return NextResponse.json(
          {
            success: false,
            error: 'CPF inválido',
            field: 'cpf',
            code: 'VALIDATION',
          },
          { status: 400 }
        );
      }
    } else {
      cnpj = limparNumeros((formData.get('cnpj') as string) ?? '');
      if (!validarCNPJ(cnpj)) {
        return NextResponse.json(
          {
            success: false,
            error: 'CNPJ inválido',
            field: 'cnpj',
            code: 'VALIDATION',
          },
          { status: 400 }
        );
      }

      razaoSocial = sanitizarString(
        (formData.get('razao_social') as string) ?? ''
      );
      if (!razaoSocial || razaoSocial.length < 3) {
        return NextResponse.json(
          {
            success: false,
            error: 'Razão social obrigatória para PJ',
            field: 'razao_social',
            code: 'VALIDATION',
          },
          { status: 400 }
        );
      }

      cpfResponsavel = limparNumeros(
        (formData.get('cpf_responsavel') as string) ?? ''
      );
      if (!validarCPF(cpfResponsavel)) {
        return NextResponse.json(
          {
            success: false,
            error: 'CPF do responsável inválido',
            field: 'cpf_responsavel',
            code: 'VALIDATION',
          },
          { status: 400 }
        );
      }
    }

    // 6. Verificar duplicatas no banco (apenas leads não rejeitados)
    const emailExists = await query(
      `SELECT id FROM representantes_cadastro_leads WHERE email = $1 AND status NOT IN ('rejeitado')`,
      [email]
    );
    if (emailExists.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este e-mail já possui um cadastro em análise',
          field: 'email',
          code: 'DUPLICATE',
        },
        { status: 409 }
      );
    }

    // Verificar duplicata também na tabela de representantes oficiais
    const emailExistsRep = await query(
      `SELECT id FROM representantes WHERE email = $1`,
      [email]
    );
    if (emailExistsRep.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este e-mail já está cadastrado como representante',
          field: 'email',
          code: 'DUPLICATE',
        },
        { status: 409 }
      );
    }

    if (tipoPessoa === 'pf' && cpf) {
      const cpfExists = await query(
        `SELECT id FROM representantes_cadastro_leads WHERE cpf = $1 AND status NOT IN ('rejeitado')`,
        [cpf]
      );
      if (cpfExists.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Este CPF já possui um cadastro em análise',
            field: 'cpf',
            code: 'DUPLICATE',
          },
          { status: 409 }
        );
      }
      const cpfExistsRep = await query(
        `SELECT id FROM representantes WHERE cpf = $1`,
        [cpf]
      );
      if (cpfExistsRep.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Este CPF já está cadastrado como representante',
            field: 'cpf',
            code: 'DUPLICATE',
          },
          { status: 409 }
        );
      }
    }

    if (tipoPessoa === 'pj' && cnpj) {
      const cnpjExists = await query(
        `SELECT id FROM representantes_cadastro_leads WHERE cnpj = $1 AND status NOT IN ('rejeitado')`,
        [cnpj]
      );
      if (cnpjExists.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Este CNPJ já possui um cadastro em análise',
            field: 'cnpj',
            code: 'DUPLICATE',
          },
          { status: 409 }
        );
      }
      const cnpjExistsRep = await query(
        `SELECT id FROM representantes WHERE cnpj = $1`,
        [cnpj]
      );
      if (cnpjExistsRep.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Este CNPJ já está cadastrado como representante',
            field: 'cnpj',
            code: 'DUPLICATE',
          },
          { status: 409 }
        );
      }
    }

    // 7. Validar e processar arquivos
    const identificador = tipoPessoa === 'pf' ? cpf! : cnpj!;
    const { docs: docsUpload, error: docError } =
      await processarDocumentosUpload(formData, tipoPessoa, identificador);
    if (docError) return docError;

    // 8. Inserir no banco
    const docCpfData = docsUpload.find((d) => d.tipo === 'cpf');
    const docCnpjData = docsUpload.find((d) => d.tipo === 'cnpj');
    const docCpfRespData = docsUpload.find((d) => d.tipo === 'cpf_responsavel');

    const userAgent = request.headers.get('user-agent') ?? '';

    const insertResult = await query<{ id: string }>(
      `INSERT INTO representantes_cadastro_leads (
        tipo_pessoa, nome, email, telefone,
        cpf, cnpj, razao_social, cpf_responsavel,
        doc_cpf_filename, doc_cpf_key, doc_cpf_url,
        doc_cnpj_filename, doc_cnpj_key, doc_cnpj_url,
        doc_cpf_resp_filename, doc_cpf_resp_key, doc_cpf_resp_url,
        ip_origem, user_agent
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19
      ) RETURNING id`,
      [
        tipoPessoa,
        nome,
        email,
        telefone,
        cpf,
        cnpj,
        razaoSocial,
        cpfResponsavel,
        docCpfData?.filename ?? null,
        docCpfData?.key ?? null,
        docCpfData?.url ?? null,
        docCnpjData?.filename ?? null,
        docCnpjData?.key ?? null,
        docCnpjData?.url ?? null,
        docCpfRespData?.filename ?? null,
        docCpfRespData?.key ?? null,
        docCpfRespData?.url ?? null,
        ip,
        userAgent,
      ]
    );

    const leadId = insertResult.rows[0]?.id;

    console.log(
      `[CADASTRO-REP] Novo lead criado: ${leadId} — ${tipoPessoa.toUpperCase()} — ${nome} — ${email}`
    );

    // 9. Notificar usuários comercial e suporte sobre novo cadastro de representante
    const nomeExibido = tipoPessoa === 'pf' ? nome : (razaoSocial ?? nome);
    const mensagemNotif = `${nomeExibido} solicitou cadastro como representante. Clique para analisar.`;

    const notificarPerfil = async (
      tipoUsuario: string,
      destinatarioTipo: string,
      linkAcao: string,
      logTag: string
    ) => {
      try {
        const usuarios = await query<{ cpf: string }>(
          `SELECT cpf FROM usuarios WHERE tipo_usuario = $1 AND ativo = true`,
          [tipoUsuario]
        );
        if (usuarios.rows.length === 0) return;
        for (const u of usuarios.rows) {
          await query(
            `INSERT INTO notificacoes
               (tipo, destinatario_cpf, destinatario_tipo, titulo, mensagem, link_acao)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              'novo_cadastro_representante',
              u.cpf,
              destinatarioTipo,
              'Novo cadastro de representante',
              mensagemNotif,
              linkAcao,
            ]
          );
        }
        console.log(
          `${logTag} ${usuarios.rows.length} notificação(ões) criada(s) para lead ${leadId}`
        );
      } catch (notifErr) {
        console.error(`${logTag} Erro ao criar notificações:`, notifErr);
      }
    };

    await notificarPerfil(
      'comercial',
      'comercial',
      `/comercial/representantes/cadastros/${leadId}`,
      '[NOTIF-COMERCIAL]'
    );
    await notificarPerfil('suporte', 'suporte', `/suporte`, '[NOTIF-SUPORTE]');

    // 10. Retornar sucesso
    const origin = request.headers.get('origin');
    return NextResponse.json(
      {
        success: true,
        id: leadId,
        status: 'pendente_verificacao',
        message:
          'Cadastro recebido com sucesso! Seus documentos serão analisados e você receberá um retorno em breve.',
      },
      { status: 201, headers: getCorsHeaders(origin) }
    );
  } catch (error) {
    console.error('[CADASTRO-REP] Erro no cadastro:', error);

    const origin = request.headers.get('origin');
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao processar cadastro. Tente novamente.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}
