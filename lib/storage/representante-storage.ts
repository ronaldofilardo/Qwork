/**
 * Gerenciador de armazenamento de documentos de representantes (landing page)
 *
 * Fornece upload híbrido:
 * - DEV (local): Salva em storage/representante/{cpf_ou_cnpj}/
 * - PROD (serverless): Upload direto para Backblaze bucket rep-qwork
 */

import { uploadToBackblaze } from './backblaze-client';

/** Tipos de documento aceitos para representantes */
export type TipoDocumentoRepresentante =
  | 'cpf' // PF: documento de CPF
  | 'cnpj' // PJ: cartão CNPJ
  | 'cpf_responsavel' // PJ: CPF do responsável
  | 'rpa'; // Representante: NF/RPA de comissão

/** Tipos de documento aceitos para vendedores */
export type TipoDocumentoVendedor =
  | 'cpf' // PF: documento de CPF
  | 'cnpj' // PJ: cartão CNPJ
  | 'cpf_responsavel' // PJ: CPF do responsável
  | 'nf' // PJ: nota fiscal
  | 'rpa'; // PF: recibo de pagamento autônomo

export interface RepresentanteDocumentoResult {
  /** Path local (DEV) ou URL remota (PROD) */
  path: string;
  /** Informações de arquivo remoto (apenas PROD) */
  arquivo_remoto?: {
    provider: 'backblaze';
    bucket: string;
    key: string;
    url: string;
  };
}

/** MIME types aceitos para upload de documentos */
export const DOCUMENTO_MIMES_ACEITOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

/** Extensões aceitas */
export const DOCUMENTO_EXTENSOES_ACEITAS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
] as const;

/** Tamanho máximo por arquivo: 3MB */
export const DOCUMENTO_MAX_SIZE_BYTES = 3 * 1024 * 1024;

/** Bucket Backblaze dedicado para documentos de representantes */
const REP_BUCKET = 'rep-qwork';

/**
 * Detectar extensão do arquivo pelo MIME type
 */
function extensaoFromMime(mime: string): string {
  switch (mime) {
    case 'application/pdf':
      return 'pdf';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    default:
      return 'pdf';
  }
}

/**
 * Validar magic bytes do arquivo para garantir conteúdo real
 */
export function validarMagicBytes(
  buffer: Buffer,
  mimeDeclarado: string
): boolean {
  if (buffer.length < 4) return false;

  switch (mimeDeclarado) {
    case 'application/pdf':
      // PDF: %PDF
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    case 'image/jpeg':
      // JPEG: FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      // PNG: 89 50 4E 47
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );
    default:
      return false;
  }
}

/**
 * Salvar documento localmente (DEV)
 *
 * Path: storage/representantes/{PF|PJ}/{identificador}/{CAD|RPA|COMP}/{tipo}_{timestamp}.{ext}
 */
async function uploadLocal(
  buffer: Buffer,
  tipo: TipoDocumentoRepresentante,
  identificador: string,
  contentType: string,
  tipoPessoa: 'pf' | 'pj' = 'pf',
  subpasta: 'CAD' | 'RPA' | 'COMP' = 'CAD'
): Promise<RepresentanteDocumentoResult> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const subDir = tipoPessoa === 'pj' ? 'PJ' : 'PF';
  const storageDir = path.join(
    process.cwd(),
    'storage',
    'representantes',
    subDir,
    identificador,
    subpasta
  );
  await fs.mkdir(storageDir, { recursive: true });

  const ext = extensaoFromMime(contentType);
  const timestamp = Date.now();
  const filename = `${tipo}_${timestamp}.${ext}`;
  const filepath = path.join(storageDir, filename);

  await fs.writeFile(filepath, buffer);

  console.log(`[REP-STORAGE] Documento ${tipo} salvo localmente: ${filepath}`);

  return {
    path: `storage/representantes/${subDir}/${identificador}/${subpasta}/${filename}`,
  };
}

/**
 * Upload para Backblaze (PROD)
 *
 * Path no bucket rep-qwork: {PF|PJ}/{identificador}/{CAD|RPA|COMP}/{tipo}_{timestamp}-{random}.{ext}
 */
async function uploadRemoto(
  buffer: Buffer,
  tipo: TipoDocumentoRepresentante,
  identificador: string,
  contentType: string,
  tipoPessoa: 'pf' | 'pj' = 'pf',
  subpasta: 'CAD' | 'RPA' | 'COMP' = 'CAD'
): Promise<RepresentanteDocumentoResult> {
  try {
    const ext = extensaoFromMime(contentType);
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const subDir = tipoPessoa === 'pj' ? 'PJ' : 'PF';
    const key = `${subDir}/${identificador}/${subpasta}/${tipo}_${timestamp}-${random}.${ext}`;

    // Credenciais dedicadas ao bucket rep-qwork quando disponíveis
    const repKeyId = process.env.BACKBLAZE_REP_KEY_ID?.trim();
    const repAppKey = process.env.BACKBLAZE_REP_APPLICATION_KEY?.trim();
    const credentialsOverride =
      repKeyId && repAppKey
        ? { keyId: repKeyId, applicationKey: repAppKey }
        : undefined;

    if (credentialsOverride) {
      console.log(
        `[REP-STORAGE] Usando credenciais dedicadas para bucket ${REP_BUCKET}`
      );
    } else {
      console.warn(
        `[REP-STORAGE] BACKBLAZE_REP_KEY_ID não definido — usando credenciais padrão para ${REP_BUCKET}`
      );
    }

    const result = await uploadToBackblaze(
      buffer,
      key,
      contentType,
      REP_BUCKET,
      credentialsOverride
    );

    console.log(
      `[REP-STORAGE] Documento ${tipo} (${identificador}) enviado para Backblaze: ${REP_BUCKET}/${key}`
    );

    return {
      path: result.url,
      arquivo_remoto: {
        provider: result.provider,
        bucket: result.bucket,
        key: result.key,
        url: result.url,
      },
    };
  } catch (error) {
    console.error(
      '[REP-STORAGE] Erro ao upload documento para Backblaze:',
      error
    );
    throw new Error(
      `Falha ao salvar documento de representante: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Upload de documento de representante (híbrido DEV/PROD)
 *
 * DEV: storage/representantes/{PF|PJ}/{identificador}/{CAD|RPA|COMP}/{tipo}_{timestamp}.{ext}
 * PROD: Backblaze rep-qwork/{PF|PJ}/{identificador}/{CAD|RPA|COMP}/{tipo}_{timestamp}-{random}.{ext}
 *
 * @param buffer - Buffer do arquivo
 * @param tipo - Tipo de documento (cpf, cnpj, cpf_responsavel, rpa)
 * @param identificador - CPF (PF) ou CNPJ (PJ) sem formatação
 * @param contentType - MIME type do arquivo
 * @param tipoPessoa - 'pf' ou 'pj' (default: 'pf') — define subdiretório/prefixo
 * @param subpasta - 'CAD', 'RPA' ou 'COMP' (default: 'CAD') — define subpasta do tipo de documento
 * @returns RepresentanteDocumentoResult com path local ou info remota
 */
export async function uploadDocumentoRepresentante(
  buffer: Buffer,
  tipo: TipoDocumentoRepresentante,
  identificador: string,
  contentType: string,
  tipoPessoa: 'pf' | 'pj' = 'pf',
  subpasta: 'CAD' | 'RPA' | 'COMP' = 'CAD'
): Promise<RepresentanteDocumentoResult> {
  const isServerless =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  if (isServerless) {
    return uploadRemoto(
      buffer,
      tipo,
      identificador,
      contentType,
      tipoPessoa,
      subpasta
    );
  } else {
    return uploadLocal(
      buffer,
      tipo,
      identificador,
      contentType,
      tipoPessoa,
      subpasta
    );
  }
}

// ---------------------------------------------------------------------------
// Upload de documentos de VENDEDORES (subordinados a representantes)
// ---------------------------------------------------------------------------

/** Subpastas válidas p/ vendedores */
export type SubpastaVendedor = 'CAD' | 'NF' | 'RPA' | 'COMP';

export interface VendedorDocumentoParams {
  buffer: Buffer;
  tipo: TipoDocumentoVendedor;
  /** CPF (PF) ou CNPJ (PJ) do representante-pai — sem formatação */
  repIdentificador: string;
  /** Tipo pessoa do representante-pai */
  repTipoPessoa: 'pf' | 'pj';
  /** CPF (PF) ou CNPJ (PJ) do vendedor — sem formatação */
  vendedorIdentificador: string;
  /** Subpasta destino */
  subpasta: SubpastaVendedor;
  contentType: string;
}

/**
 * Salvar doc de vendedor localmente (DEV)
 *
 * Path: storage/representantes/{PF|PJ}/{repId}/vendedores/{vendId}/{CAD|NF|RPA|COMP}/{tipo}_{ts}.{ext}
 */
async function uploadLocalVendedor(
  params: VendedorDocumentoParams
): Promise<RepresentanteDocumentoResult> {
  const fs = await import('fs/promises');
  const pathMod = await import('path');

  const repDir = params.repTipoPessoa === 'pj' ? 'PJ' : 'PF';
  const storageDir = pathMod.join(
    process.cwd(),
    'storage',
    'representantes',
    repDir,
    params.repIdentificador,
    'vendedores',
    params.vendedorIdentificador,
    params.subpasta
  );
  await fs.mkdir(storageDir, { recursive: true });

  const ext = extensaoFromMime(params.contentType);
  const timestamp = Date.now();
  const filename = `${params.tipo}_${timestamp}.${ext}`;
  const filepath = pathMod.join(storageDir, filename);

  await fs.writeFile(filepath, params.buffer);

  const relativePath = `storage/representantes/${repDir}/${params.repIdentificador}/vendedores/${params.vendedorIdentificador}/${params.subpasta}/${filename}`;
  console.log(
    `[VND-STORAGE] Documento ${params.tipo} salvo localmente: ${filepath}`
  );

  return { path: relativePath };
}

/**
 * Upload doc de vendedor para Backblaze (PROD)
 *
 * Key: {PF|PJ}/{repId}/vendedores/{vendId}/{cad|nf|rpa|comp}/{tipo}_{ts}-{rnd}.{ext}
 */
async function uploadRemotoVendedor(
  params: VendedorDocumentoParams
): Promise<RepresentanteDocumentoResult> {
  try {
    const ext = extensaoFromMime(params.contentType);
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const repDir = params.repTipoPessoa === 'pj' ? 'PJ' : 'PF';
    const subLower = params.subpasta.toLowerCase();
    const key = `${repDir}/${params.repIdentificador}/vendedores/${params.vendedorIdentificador}/${subLower}/${params.tipo}_${timestamp}-${random}.${ext}`;

    const repKeyId = process.env.BACKBLAZE_REP_KEY_ID?.trim();
    const repAppKey = process.env.BACKBLAZE_REP_APPLICATION_KEY?.trim();
    const credentialsOverride =
      repKeyId && repAppKey
        ? { keyId: repKeyId, applicationKey: repAppKey }
        : undefined;

    const result = await uploadToBackblaze(
      params.buffer,
      key,
      params.contentType,
      REP_BUCKET,
      credentialsOverride
    );

    console.log(
      `[VND-STORAGE] Documento ${params.tipo} (${params.vendedorIdentificador}) enviado para Backblaze: ${REP_BUCKET}/${key}`
    );

    return {
      path: result.url,
      arquivo_remoto: {
        provider: result.provider,
        bucket: result.bucket,
        key: result.key,
        url: result.url,
      },
    };
  } catch (error) {
    console.error(
      '[VND-STORAGE] Erro ao upload doc de vendedor para Backblaze:',
      error
    );
    throw new Error(
      `Falha ao salvar documento de vendedor: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Upload de documento de vendedor (híbrido DEV/PROD)
 *
 * LOCAL: storage/representantes/{PF|PJ}/{repId}/vendedores/{vendId}/{CAD|NF|RPA|COMP}/{tipo}_{ts}.{ext}
 * PROD:  Backblaze rep-qwork/{PF|PJ}/{repId}/vendedores/{vendId}/{cad|nf|rpa|comp}/{tipo}_{ts}-{rnd}.{ext}
 */
export async function uploadDocumentoVendedor(
  params: VendedorDocumentoParams
): Promise<RepresentanteDocumentoResult> {
  const isServerless =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  if (isServerless) {
    return uploadRemotoVendedor(params);
  } else {
    return uploadLocalVendedor(params);
  }
}
