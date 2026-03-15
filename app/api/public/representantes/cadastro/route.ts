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
  uploadDocumentoRepresentante,
  validarMagicBytes,
  DOCUMENTO_MIMES_ACEITOS,
  DOCUMENTO_MAX_SIZE_BYTES,
  type TipoDocumentoRepresentante,
} from '@/lib/storage/representante-storage';

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

// ---------------------------------------------------------------------------
// Validadores
// ---------------------------------------------------------------------------

function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(nums)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(nums[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(nums[10]);
}

function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(nums)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(nums[i]) * pesos1[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (d1 !== parseInt(nums[12])) return false;

  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(nums[i]) * pesos2[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  return d2 === parseInt(nums[13]);
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

function sanitizarString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

function limparNumeros(str: string): string {
  return str.replace(/\D/g, '');
}

// ---------------------------------------------------------------------------
// Validar arquivo individual
// ---------------------------------------------------------------------------
interface FileValidationResult {
  valid: boolean;
  error?: string;
  buffer?: Buffer;
  contentType?: string;
}

async function validarArquivo(
  file: File | null,
  label: string
): Promise<FileValidationResult> {
  if (!file || file.size === 0) {
    return { valid: false, error: `${label}: nenhum arquivo enviado` };
  }

  if (file.size > DOCUMENTO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `${label}: arquivo excede o limite de ${DOCUMENTO_MAX_SIZE_BYTES / (1024 * 1024)}MB`,
    };
  }

  const mimeOk = (DOCUMENTO_MIMES_ACEITOS as readonly string[]).includes(
    file.type
  );
  if (!mimeOk) {
    return {
      valid: false,
      error: `${label}: tipo "${file.type}" não aceito. Use PDF, JPG ou PNG.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!validarMagicBytes(buffer, file.type)) {
    return {
      valid: false,
      error: `${label}: conteúdo do arquivo não corresponde ao tipo declarado`,
    };
  }

  return { valid: true, buffer, contentType: file.type };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

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

    type UploadedDoc = {
      tipo: TipoDocumentoRepresentante;
      filename: string;
      key: string | null;
      url: string | null;
    };

    const docsUpload: UploadedDoc[] = [];

    if (tipoPessoa === 'pf') {
      // PF: documento CPF — aceita chave pré-uploadada (LP/Backblaze) ou arquivo direto (DEV)
      const bbKeyCpf =
        (formData.get('backblaze_key_cpf') as string | null)?.trim() || null;
      const bbUrlCpf =
        (formData.get('backblaze_url_cpf') as string | null)?.trim() || null;

      if (bbKeyCpf && bbUrlCpf) {
        // Staging/prod: LP já fez upload; apenas registra as referências
        if (!bbUrlCpf.startsWith('https://')) {
          return NextResponse.json(
            {
              success: false,
              error: 'URL do documento CPF inválida',
              field: 'backblaze_url_cpf',
              code: 'VALIDATION',
            },
            { status: 400 }
          );
        }
        docsUpload.push({
          tipo: 'cpf',
          filename: bbKeyCpf.split('/').pop() ?? 'documento_cpf',
          key: bbKeyCpf,
          url: bbUrlCpf,
        });
      } else {
        // DEV / fallback: arquivo enviado diretamente
        const fileCpf = formData.get('documento_cpf') as File | null;
        const valCpf = await validarArquivo(fileCpf, 'Documento CPF');
        if (!valCpf.valid) {
          return NextResponse.json(
            {
              success: false,
              error: valCpf.error,
              field: 'documento_cpf',
              code: 'VALIDATION',
            },
            { status: 400 }
          );
        }
        const resultCpf = await uploadDocumentoRepresentante(
          valCpf.buffer!,
          'cpf',
          identificador,
          valCpf.contentType!,
          'pf',
          'CAD'
        );
        docsUpload.push({
          tipo: 'cpf',
          filename: fileCpf!.name,
          key: resultCpf.arquivo_remoto?.key ?? resultCpf.path,
          url: resultCpf.arquivo_remoto?.url ?? null,
        });
      }
    } else {
      // PJ: cartão CNPJ — aceita chave pré-uploadada ou arquivo direto
      const bbKeyCnpj =
        (formData.get('backblaze_key_cnpj') as string | null)?.trim() || null;
      const bbUrlCnpj =
        (formData.get('backblaze_url_cnpj') as string | null)?.trim() || null;

      if (bbKeyCnpj && bbUrlCnpj) {
        if (!bbUrlCnpj.startsWith('https://')) {
          return NextResponse.json(
            {
              success: false,
              error: 'URL do documento CNPJ inválida',
              field: 'backblaze_url_cnpj',
              code: 'VALIDATION',
            },
            { status: 400 }
          );
        }
        docsUpload.push({
          tipo: 'cnpj',
          filename: bbKeyCnpj.split('/').pop() ?? 'documento_cnpj',
          key: bbKeyCnpj,
          url: bbUrlCnpj,
        });
      } else {
        const fileCnpj = formData.get('documento_cnpj') as File | null;
        const valCnpj = await validarArquivo(fileCnpj, 'Cartão CNPJ');
        if (!valCnpj.valid) {
          return NextResponse.json(
            {
              success: false,
              error: valCnpj.error,
              field: 'documento_cnpj',
              code: 'VALIDATION',
            },
            { status: 400 }
          );
        }
        const resultCnpj = await uploadDocumentoRepresentante(
          valCnpj.buffer!,
          'cnpj',
          identificador,
          valCnpj.contentType!,
          'pj',
          'CAD'
        );
        docsUpload.push({
          tipo: 'cnpj',
          filename: fileCnpj!.name,
          key: resultCnpj.arquivo_remoto?.key ?? resultCnpj.path,
          url: resultCnpj.arquivo_remoto?.url ?? null,
        });
      }

      // PJ: CPF do responsável — aceita chave pré-uploadada ou arquivo direto
      const bbKeyCpfResp =
        (
          formData.get('backblaze_key_cpf_responsavel') as string | null
        )?.trim() || null;
      const bbUrlCpfResp =
        (
          formData.get('backblaze_url_cpf_responsavel') as string | null
        )?.trim() || null;

      if (bbKeyCpfResp && bbUrlCpfResp) {
        if (!bbUrlCpfResp.startsWith('https://')) {
          return NextResponse.json(
            {
              success: false,
              error: 'URL do CPF do responsável inválida',
              field: 'backblaze_url_cpf_responsavel',
              code: 'VALIDATION',
            },
            { status: 400 }
          );
        }
        docsUpload.push({
          tipo: 'cpf_responsavel',
          filename:
            bbKeyCpfResp.split('/').pop() ?? 'documento_cpf_responsavel',
          key: bbKeyCpfResp,
          url: bbUrlCpfResp,
        });
      } else {
        const fileCpfResp = formData.get(
          'documento_cpf_responsavel'
        ) as File | null;
        const valCpfResp = await validarArquivo(
          fileCpfResp,
          'CPF do responsável'
        );
        if (!valCpfResp.valid) {
          return NextResponse.json(
            {
              success: false,
              error: valCpfResp.error,
              field: 'documento_cpf_responsavel',
              code: 'VALIDATION',
            },
            { status: 400 }
          );
        }
        const resultCpfResp = await uploadDocumentoRepresentante(
          valCpfResp.buffer!,
          'cpf_responsavel',
          identificador,
          valCpfResp.contentType!,
          'pj',
          'CAD'
        );
        docsUpload.push({
          tipo: 'cpf_responsavel',
          filename: fileCpfResp!.name,
          key: resultCpfResp.arquivo_remoto?.key ?? resultCpfResp.path,
          url: resultCpfResp.arquivo_remoto?.url ?? null,
        });
      }
    }

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

    // 9. Notificar admin por log (email externo pode ser adicionado depois)
    console.log(
      `[NOTIF-ADMIN] Novo cadastro de representante para análise.\n` +
        `  ID: ${leadId}\n` +
        `  Tipo: ${tipoPessoa.toUpperCase()}\n` +
        `  Nome: ${nome}\n` +
        `  Email: ${email}\n` +
        `  Tel: ${telefone}\n` +
        `  ${tipoPessoa === 'pf' ? `CPF: ***${cpf?.slice(-4)}` : `CNPJ: ***${cnpj?.slice(-4)}`}\n` +
        `  Docs: ${docsUpload.map((d) => d.tipo).join(', ')}\n` +
        `  IP: ${ip}\n` +
        `  Admin: contato@qwork.app.br`
    );

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
