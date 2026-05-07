/**
 * ZapSign API Client
 *
 * Integração com a plataforma de assinatura digital ZapSign.
 * Suporta sandbox e produção via variável ZAPSIGN_BASE_URL.
 *
 * Documentação: https://docs.zapsign.com.br
 * Sandbox: https://sandbox.api.zapsign.com.br
 * Produção: https://api.zapsign.com.br
 *
 * ⚠️ USO EXCLUSIVO SERVER-SIDE — nunca importar em client components.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ZapSignSigner {
  token: string;
  name: string;
  email: string;
  status: string;
  sign_url: string;
  signed_at?: string;
}

export interface ZapSignDocument {
  open_id: number;
  token: string;
  name: string;
  status: string;
  created_at: string;
  last_update_at: string;
  signed_file?: string;
  signers: ZapSignSigner[];
}

export interface CriarDocumentoParams {
  /** Nome do documento exibido na plataforma ZapSign */
  nome: string;
  /** PDF em base64 (sem prefixo data:application/pdf;base64,) */
  base64Pdf: string;
  /** Nome do assinante */
  nomeAssinante: string;
  /** Email do assinante — receberá o link de assinatura */
  emailAssinante: string;
  /** Enviar email automático ao assinante (default: true) */
  enviarEmailAutomatico?: boolean;
  /**
   * Ambiente do banco escolhido pelo emissor local.
   * Quando fornecido, usa credenciais ZapSign específicas do ambiente:
   *   'production' → ZAPSIGN_BASE_URL_PRODUCTION / ZAPSIGN_API_TOKEN_PRODUCTION
   *   'staging'    → ZAPSIGN_BASE_URL_STAGING / ZAPSIGN_API_TOKEN_STAGING
   *   'development'→ fallback para ZAPSIGN_BASE_URL (sandbox)
   */
  dbEnvironment?: 'development' | 'staging' | 'production';
}

export interface ResultadoCriarDocumento {
  docToken: string;
  signerToken: string;
  signUrl: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Retorna baseUrl e apiToken para o ambiente especificado.
 *
 * Prioridade para 'production':
 *   1. ZAPSIGN_BASE_URL_PRODUCTION / ZAPSIGN_API_TOKEN_PRODUCTION
 *   2. ZAPSIGN_BASE_URL / ZAPSIGN_API_TOKEN (fallback — funciona no Vercel)
 *
 * Prioridade para 'staging':
 *   1. ZAPSIGN_BASE_URL_STAGING / ZAPSIGN_API_TOKEN_STAGING
 *   2. ZAPSIGN_BASE_URL / ZAPSIGN_API_TOKEN (fallback)
 *
 * Para 'development' ou sem ambiente: sempre ZAPSIGN_BASE_URL.
 */
function getCredentials(dbEnvironment?: string): {
  baseUrl: string;
  apiToken: string;
} {
  let baseUrl: string | undefined;
  let apiToken: string | undefined;

  if (dbEnvironment === 'production') {
    baseUrl = process.env.ZAPSIGN_BASE_URL_PRODUCTION?.trim().replace(
      /\/$/,
      ''
    );
    apiToken = process.env.ZAPSIGN_API_TOKEN_PRODUCTION?.trim();
  } else if (dbEnvironment === 'staging') {
    baseUrl = process.env.ZAPSIGN_BASE_URL_STAGING?.trim().replace(/\/$/, '');
    apiToken = process.env.ZAPSIGN_API_TOKEN_STAGING?.trim();
  }

  // Fallback para variáveis genéricas (Vercel produção, ou dev sem env específico)
  if (!baseUrl) {
    baseUrl = process.env.ZAPSIGN_BASE_URL?.trim().replace(/\/$/, '');
  }
  if (!apiToken) {
    apiToken = process.env.ZAPSIGN_API_TOKEN?.trim();
  }

  if (!baseUrl) {
    throw new Error(
      'ZAPSIGN_BASE_URL não está configurado. Defina no .env.local.'
    );
  }
  if (!apiToken) {
    throw new Error(
      'ZAPSIGN_API_TOKEN não está configurado ou está vazio. Defina no .env.local.'
    );
  }

  return { baseUrl, apiToken };
}

function getBaseUrl(): string {
  return getCredentials().baseUrl;
}

/**
 * Retorna a URL base do app ZapSign para assinatura (https://app.zapsign.com.br ou https://sandbox.app.zapsign.com.br)
 * Convertendo da URL da API (que usa /api/v1)
 */
export function getZapSignAppBaseUrl(dbEnvironment?: string): string {
  const { baseUrl } = getCredentials(dbEnvironment);
  // Converter: https://api.zapsign.com.br → https://app.zapsign.com.br
  //           https://sandbox.api.zapsign.com.br → https://sandbox.app.zapsign.com.br
  return baseUrl.replace('api.zapsign', 'app.zapsign');
}

function buildHeaders(dbEnvironment?: string): Record<string, string> {
  const { apiToken } = getCredentials(dbEnvironment);
  return {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'QWork-ZapSign-Client/1.0',
  };
}

/** Lança erro informativo quando a API ZapSign retorna status != 2xx */
async function handleZapSignError(
  response: Response,
  contexto: string
): Promise<never> {
  let corpo: unknown;
  try {
    corpo = await response.json();
  } catch {
    corpo = await response.text().catch(() => '<sem corpo>');
  }
  throw new Error(
    `[ZapSign] ${contexto}: HTTP ${response.status} — ${JSON.stringify(corpo)}`
  );
}

// ─── Funções públicas ─────────────────────────────────────────────────────────

/**
 * Cria um documento no ZapSign a partir de um PDF em base64.
 * Retorna os tokens necessários para rastrear o documento e o link de assinatura.
 */
export async function criarDocumentoZapSign(
  params: CriarDocumentoParams
): Promise<ResultadoCriarDocumento> {
  const {
    nome,
    base64Pdf,
    nomeAssinante,
    emailAssinante,
    enviarEmailAutomatico = true,
    dbEnvironment,
  } = params;

  const { baseUrl } = getCredentials(dbEnvironment);

  // sandbox: false garante criação em produção quando baseUrl não contém 'sandbox'
  const isSandbox =
    baseUrl.includes('sandbox') || process.env.ZAPSIGN_SANDBOX === '1';

  const headers = buildHeaders(dbEnvironment);

  console.log(
    `[ZapSign] criarDocumento: baseUrl=${baseUrl} | sandbox=${isSandbox} | dbEnv=${dbEnvironment ?? 'não informado'} | doc="${nome}" | tokenLen=${headers.Authorization.split(' ')[1].length}`
  );

  const body = {
    name: nome,
    base64_pdf: base64Pdf,
    sandbox: isSandbox,
    signers: [
      {
        name: nomeAssinante,
        email: emailAssinante,
        send_automatic_email: enviarEmailAutomatico,
      },
    ],
  };

  const response = await fetch(`${baseUrl}/api/v1/docs/`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await handleZapSignError(response, 'criarDocumento');
  }

  const doc: ZapSignDocument = await response.json();

  const signer = doc.signers[0];
  if (!signer) {
    throw new Error('[ZapSign] criarDocumento: resposta sem signers.');
  }

  return {
    docToken: doc.token,
    signerToken: signer.token,
    signUrl: signer.sign_url,
  };
}

/**
 * Busca o estado atual de um documento no ZapSign.
 * Usado pelo webhook e pelo endpoint de status para verificar se foi assinado.
 */
export async function buscarDocumentoZapSign(
  docToken: string
): Promise<ZapSignDocument> {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/api/v1/docs/${docToken}/`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    await handleZapSignError(response, `buscarDocumento(${docToken})`);
  }

  return response.json() as Promise<ZapSignDocument>;
}

/**
 * Faz download do PDF assinado a partir da URL retornada pelo ZapSign.
 * O hash SHA-256 deve ser calculado deste buffer — é o arquivo final.
 */
export async function downloadPdfAssinado(
  signedFileUrl: string
): Promise<Buffer> {
  const response = await fetch(signedFileUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(
      `[ZapSign] downloadPdfAssinado: HTTP ${response.status} ao baixar ${signedFileUrl}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Verifica se a integração ZapSign está habilitada neste ambiente.
 * Retorna false quando DISABLE_ZAPSIGN=1 (utilitário para dev local sem sandbox).
 */
export function isZapSignHabilitado(): boolean {
  return process.env.DISABLE_ZAPSIGN !== '1';
}
