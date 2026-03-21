import { NextResponse } from 'next/server';
import {
  uploadDocumentoRepresentante,
  validarMagicBytes,
  DOCUMENTO_MIMES_ACEITOS,
  DOCUMENTO_MAX_SIZE_BYTES,
  type TipoDocumentoRepresentante,
} from '@/lib/storage/representante-storage';

// ---------------------------------------------------------------------------
// Validadores puros
// ---------------------------------------------------------------------------

export function validarCPF(cpf: string): boolean {
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

export function validarCNPJ(cnpj: string): boolean {
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

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

export function sanitizarString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function limparNumeros(str: string): string {
  return str.replace(/\D/g, '');
}

// ---------------------------------------------------------------------------
// Validação de arquivo individual
// ---------------------------------------------------------------------------

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  buffer?: Buffer;
  contentType?: string;
}

export async function validarArquivo(
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
// Upload de documentos do representante
// ---------------------------------------------------------------------------

export type UploadedDoc = {
  tipo: TipoDocumentoRepresentante;
  filename: string;
  key: string | null;
  url: string | null;
};

type DocUploadResult = { docs: UploadedDoc[]; error: NextResponse | null };

export async function processarDocumentosUpload(
  formData: FormData,
  tipoPessoa: 'pf' | 'pj',
  identificador: string
): Promise<DocUploadResult> {
  const docs: UploadedDoc[] = [];

  if (tipoPessoa === 'pf') {
    const bbKeyCpf =
      (formData.get('backblaze_key_cpf') as string | null)?.trim() || null;
    const bbUrlCpf =
      (formData.get('backblaze_url_cpf') as string | null)?.trim() || null;

    if (bbKeyCpf && bbUrlCpf) {
      if (!bbUrlCpf.startsWith('https://')) {
        return {
          docs: [],
          error: NextResponse.json(
            {
              success: false,
              error: 'URL do documento CPF inválida',
              field: 'backblaze_url_cpf',
              code: 'VALIDATION',
            },
            { status: 400 }
          ),
        };
      }
      docs.push({
        tipo: 'cpf',
        filename: bbKeyCpf.split('/').pop() ?? 'documento_cpf',
        key: bbKeyCpf,
        url: bbUrlCpf,
      });
    } else {
      const fileCpf = formData.get('documento_cpf') as File | null;
      const valCpf = await validarArquivo(fileCpf, 'Documento CPF');
      if (!valCpf.valid) {
        return {
          docs: [],
          error: NextResponse.json(
            {
              success: false,
              error: valCpf.error,
              field: 'documento_cpf',
              code: 'VALIDATION',
            },
            { status: 400 }
          ),
        };
      }
      const resultCpf = await uploadDocumentoRepresentante(
        valCpf.buffer!,
        'cpf',
        identificador,
        valCpf.contentType!,
        'pf',
        'CAD'
      );
      docs.push({
        tipo: 'cpf',
        filename: fileCpf!.name,
        key: resultCpf.arquivo_remoto?.key ?? resultCpf.path,
        url: resultCpf.arquivo_remoto?.url ?? null,
      });
    }
  } else {
    // PJ: cartão CNPJ
    const bbKeyCnpj =
      (formData.get('backblaze_key_cnpj') as string | null)?.trim() || null;
    const bbUrlCnpj =
      (formData.get('backblaze_url_cnpj') as string | null)?.trim() || null;

    if (bbKeyCnpj && bbUrlCnpj) {
      if (!bbUrlCnpj.startsWith('https://')) {
        return {
          docs: [],
          error: NextResponse.json(
            {
              success: false,
              error: 'URL do documento CNPJ inválida',
              field: 'backblaze_url_cnpj',
              code: 'VALIDATION',
            },
            { status: 400 }
          ),
        };
      }
      docs.push({
        tipo: 'cnpj',
        filename: bbKeyCnpj.split('/').pop() ?? 'documento_cnpj',
        key: bbKeyCnpj,
        url: bbUrlCnpj,
      });
    } else {
      const fileCnpj = formData.get('documento_cnpj') as File | null;
      const valCnpj = await validarArquivo(fileCnpj, 'Cartão CNPJ');
      if (!valCnpj.valid) {
        return {
          docs: [],
          error: NextResponse.json(
            {
              success: false,
              error: valCnpj.error,
              field: 'documento_cnpj',
              code: 'VALIDATION',
            },
            { status: 400 }
          ),
        };
      }
      const resultCnpj = await uploadDocumentoRepresentante(
        valCnpj.buffer!,
        'cnpj',
        identificador,
        valCnpj.contentType!,
        'pj',
        'CAD'
      );
      docs.push({
        tipo: 'cnpj',
        filename: fileCnpj!.name,
        key: resultCnpj.arquivo_remoto?.key ?? resultCnpj.path,
        url: resultCnpj.arquivo_remoto?.url ?? null,
      });
    }

    // PJ: CPF do responsável
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
        return {
          docs: [],
          error: NextResponse.json(
            {
              success: false,
              error: 'URL do CPF do responsável inválida',
              field: 'backblaze_url_cpf_responsavel',
              code: 'VALIDATION',
            },
            { status: 400 }
          ),
        };
      }
      docs.push({
        tipo: 'cpf_responsavel',
        filename: bbKeyCpfResp.split('/').pop() ?? 'documento_cpf_responsavel',
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
        return {
          docs: [],
          error: NextResponse.json(
            {
              success: false,
              error: valCpfResp.error,
              field: 'documento_cpf_responsavel',
              code: 'VALIDATION',
            },
            { status: 400 }
          ),
        };
      }
      const resultCpfResp = await uploadDocumentoRepresentante(
        valCpfResp.buffer!,
        'cpf_responsavel',
        identificador,
        valCpfResp.contentType!,
        'pj',
        'CAD'
      );
      docs.push({
        tipo: 'cpf_responsavel',
        filename: fileCpfResp!.name,
        key: resultCpfResp.arquivo_remoto?.key ?? resultCpfResp.path,
        url: resultCpfResp.arquivo_remoto?.url ?? null,
      });
    }
  }

  return { docs, error: null };
}
