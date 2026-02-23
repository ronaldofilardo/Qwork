/**
 * Gerenciador de armazenamento de arquivos de cadastro
 *
 * Fornece upload híbrido:
 * - DEV (local): Salva em public/uploads/
 * - PROD (serverless): Upload direto para Backblaze
 */

import { uploadToBackblaze } from './backblaze-client';

export interface CadastroArquivoResult {
  // Path local (DEV) ou URL remota (PROD)
  path: string;
  // Informações de arquivo remoto (apenas PROD)
  arquivo_remoto?: {
    provider: 'backblaze';
    bucket: string;
    key: string;
    url: string;
  };
}

/**
 * Salvar arquivo localmente (DEV)
 */
async function uploadArquivoCadastroLocal(
  buffer: Buffer,
  tipo: string,
  cnpj: string
): Promise<CadastroArquivoResult> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const uploadDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'cadastros',
    cnpj
  );
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = 'pdf'; // ou extrair de metadata se necessário
  const filename = `${tipo}_${Date.now()}.${ext}`;
  const filepath = path.join(uploadDir, filename);

  await fs.writeFile(filepath, buffer);

  console.log(`[STORAGE] Arquivo de cadastro ${tipo} salvo em ${filepath}`);

  return {
    path: `/uploads/cadastros/${cnpj}/${filename}`,
  };
}

/**
 * Upload para Backblaze (PROD)
 *
 * Faz upload direto para o bucket configurado em PROD com caminho:
 * cad-qwork/{cnpj}/{tipo}_{timestamp}.{ext}
 */
async function uploadArquivoCadastroToBackblaze(
  buffer: Buffer,
  tipo: string,
  cnpj: string
): Promise<CadastroArquivoResult> {
  try {
    // Detectar extensão pelo tipo MIME ou usar extensão padrão
    const ext = 'pdf'; // Em produção, esperamos sempre PDF

    // Caminho no bucket: cad-qwork/{cnpj}/{tipo}_{timestamp}.{ext}
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const key = `cad-qwork/${cnpj}/${tipo}-${timestamp}-${random}.${ext}`;

    const result = await uploadToBackblaze(buffer, key, 'application/pdf');

    console.log(
      `[STORAGE] Arquivo de cadastro ${tipo} (CNPJ: ${cnpj}) enviado para Backblaze: ${key}`
    );

    return {
      path: result.url, // URL remota
      arquivo_remoto: {
        provider: result.provider,
        bucket: result.bucket,
        key: result.key,
        url: result.url,
      },
    };
  } catch (error) {
    console.error(
      '[STORAGE] Erro ao upload arquivo de cadastro para Backblaze:',
      error
    );
    throw new Error(
      `Falha ao salvar arquivo de cadastro: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fazer upload de arquivo de cadastro (entidade/clínica/empresa)
 *
 * Em DEV: salva em public/uploads/
 * Em PROD: upload para Backblaze (ao bucket `d2eaa89114748cc094c10211` no caminho `/cad-qwork/{cnpj}/`)
 *
 * @param buffer - Buffer do arquivo
 * @param tipo - Tipo de arquivo (cartao_cnpj, contrato_social, doc_identificacao)
 * @param cnpj - CNPJ do contratante (sem formatação)
 * @returns CadastroArquivoResult com path (DEV) ou remote info (PROD)
 */
export async function uploadArquivoCadastro(
  buffer: Buffer,
  tipo: 'cartao_cnpj' | 'contrato_social' | 'doc_identificacao',
  cnpj: string
): Promise<CadastroArquivoResult> {
  const isServerless =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  if (isServerless) {
    // PROD: Upload para Backblaze
    return uploadArquivoCadastroToBackblaze(buffer, tipo, cnpj);
  } else {
    // DEV: Salvar localmente
    return uploadArquivoCadastroLocal(buffer, tipo, cnpj);
  }
}
