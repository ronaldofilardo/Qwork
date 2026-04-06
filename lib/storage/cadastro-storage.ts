/**
 * Gerenciador de armazenamento de arquivos de cadastro
 *
 * Fornece upload híbrido:
 * - DEV (local): Salva em storage/tomadores/{clinicas|entidades}/{cnpj}/
 * - PROD (serverless): Upload direto para Backblaze com segregação por tipo
 *
 * Estrutura de pastas:
 * - Entidades: cad-qwork/entidades/{cnpj}/{tipo}-{ts}-{rnd}.pdf
 * - Clínicas:  cad-qwork/clinicas/{cnpj}/{tipo}-{ts}-{rnd}.pdf
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

/** Mapeia tipoTomador para o nome da subpasta */
function pastaParaTipo(
  tipoTomador: 'entidade' | 'clinica' | undefined
): 'entidades' | 'clinicas' {
  return tipoTomador === 'clinica' ? 'clinicas' : 'entidades';
}

/**
 * Salvar arquivo localmente (DEV)
 *
 * Destino: storage/tomadores/{clinicas|entidades}/{cnpj}/{tipo}_{ts}.pdf
 */
async function uploadArquivoCadastroLocal(
  buffer: Buffer,
  tipo: string,
  cnpj: string,
  tipoTomador: 'entidade' | 'clinica' | undefined
): Promise<CadastroArquivoResult> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const pasta = pastaParaTipo(tipoTomador);
  const uploadDir = path.join(
    process.cwd(),
    'storage',
    'tomadores',
    pasta,
    cnpj
  );
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = 'pdf';
  const filename = `${tipo}_${Date.now()}.${ext}`;
  const filepath = path.join(uploadDir, filename);

  await fs.writeFile(filepath, buffer);

  console.log(`[STORAGE] Arquivo de cadastro ${tipo} salvo em ${filepath}`);

  return {
    path: `storage/tomadores/${pasta}/${cnpj}/${filename}`,
  };
}

// Bucket dedicado para arquivos de cadastro (separado do bucket de laudos)
const CADASTRO_BUCKET = 'cad-qwork';

/**
 * Upload para Backblaze (PROD)
 *
 * Faz upload para o bucket 'cad-qwork' com caminho:
 * {entidades|clinicas}/{cnpj}/{tipo}-{timestamp}-{random}.pdf
 */
async function uploadArquivoCadastroToBackblaze(
  buffer: Buffer,
  tipo: string,
  cnpj: string,
  tipoTomador: 'entidade' | 'clinica' | undefined
): Promise<CadastroArquivoResult> {
  try {
    const ext = 'pdf';

    const pasta = pastaParaTipo(tipoTomador);
    // Caminho no bucket cad-qwork: {entidades|clinicas}/{cnpj}/{tipo}-{timestamp}-{random}.pdf
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const key = `${pasta}/${cnpj}/${tipo}-${timestamp}-${random}.${ext}`;

    // Usar credenciais dedicadas ao bucket cad-qwork quando disponíveis
    const cadKeyId = process.env.BACKBLAZE_CAD_KEY_ID?.trim();
    const cadAppKey = process.env.BACKBLAZE_CAD_APPLICATION_KEY?.trim();
    const credentialsOverride =
      cadKeyId && cadAppKey
        ? { keyId: cadKeyId, applicationKey: cadAppKey }
        : undefined;

    if (credentialsOverride) {
      console.log(
        `[STORAGE] Usando credenciais dedicadas para bucket ${CADASTRO_BUCKET} (BACKBLAZE_CAD_KEY_ID)`
      );
    } else {
      console.warn(
        `[STORAGE] BACKBLAZE_CAD_KEY_ID/BACKBLAZE_CAD_APPLICATION_KEY não definidos – usando credenciais padrão para bucket ${CADASTRO_BUCKET}.` +
          ' Garanta que a chave padrão tenha acesso a este bucket.'
      );
    }

    const result = await uploadToBackblaze(
      buffer,
      key,
      'application/pdf',
      CADASTRO_BUCKET,
      credentialsOverride
    );

    console.log(
      `[STORAGE] Arquivo de cadastro ${tipo} (CNPJ: ${cnpj}, tipo: ${tipoTomador ?? 'entidade'}) enviado para Backblaze: ${CADASTRO_BUCKET}/${key}`
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
 * Em DEV: salva em storage/tomadores/{clinicas|entidades}/{cnpj}/
 * Em PROD: upload para Backblaze (bucket `cad-qwork`, caminho `{clinicas|entidades}/{cnpj}/{tipo}-{timestamp}.pdf`)
 *
 * @param buffer - Buffer do arquivo
 * @param tipo - Tipo de arquivo (cartao_cnpj, contrato_social, doc_identificacao)
 * @param cnpj - CNPJ do tomador (sem formatação)
 * @param tipoTomador - Tipo de tomador: 'entidade' ou 'clinica' (default: 'entidade')
 * @returns CadastroArquivoResult com path (DEV) ou remote info (PROD)
 */
export async function uploadArquivoCadastro(
  buffer: Buffer,
  tipo: 'cartao_cnpj' | 'contrato_social' | 'doc_identificacao',
  cnpj: string,
  tipoTomador?: 'entidade' | 'clinica'
): Promise<CadastroArquivoResult> {
  const isServerless =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  if (isServerless) {
    // PROD: Upload para Backblaze com segregação por tipo
    return uploadArquivoCadastroToBackblaze(buffer, tipo, cnpj, tipoTomador);
  } else {
    // DEV: Salvar localmente com segregação por tipo
    return uploadArquivoCadastroLocal(buffer, tipo, cnpj, tipoTomador);
  }
}
