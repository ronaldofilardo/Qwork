/**
 * Gerenciador de armazenamento de laudos
 *
 * Gerencia armazenamento híbrido: local (storage/laudos) + remoto (Backblaze)
 * - Arquivos são sempre salvos localmente primeiro
 * - Upload para Backblaze é feito de forma assíncrona após commit
 * - Download tenta local primeiro, depois Backblaze como fallback
 */

import crypto from 'crypto';
import {
  uploadToBackblaze,
  downloadFromBackblaze,
  checkBackblazeFileExists,
} from './backblaze-client';

export interface LaudoMetadata {
  arquivo: string;
  hash: string;
  criadoEm: string;
  arquivo_remoto?: {
    provider: 'backblaze';
    bucket: string;
    key: string;
    url: string;
    uploadedAt?: string;
  };
}

/**
 * Salvar laudo localmente
 */
export async function salvarLaudoLocal(
  laudoId: number,
  pdfBuffer: Buffer,
  hash: string
): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
  await fs.mkdir(laudosDir, { recursive: true });

  const fileName = `laudo-${laudoId}.pdf`;
  const tempFileName = `laudo-${laudoId}.pdf.tmp`;
  const filePath = path.join(laudosDir, fileName);
  const tempFilePath = path.join(laudosDir, tempFileName);

  // Escrever em arquivo temporário
  await fs.writeFile(tempFilePath, pdfBuffer);

  // Rename atômico
  await fs.rename(tempFilePath, filePath);

  // Gravar metadados
  const metadata: LaudoMetadata = {
    arquivo: fileName,
    hash,
    criadoEm: new Date().toISOString(),
  };

  const metaTempPath = path.join(laudosDir, `laudo-${laudoId}.json.tmp`);
  const metaPath = path.join(laudosDir, `laudo-${laudoId}.json`);
  await fs.writeFile(metaTempPath, JSON.stringify(metadata, null, 2));
  await fs.rename(metaTempPath, metaPath);

  console.log(`[STORAGE] Laudo ${laudoId} salvo localmente em ${filePath}`);

  return filePath;
}

/**
 * Fazer upload do laudo para Backblaze de forma assíncrona
 * Esta função não deve bloquear o fluxo principal
 */
export async function uploadLaudoToBackblaze(
  laudoId: number,
  loteId: number,
  pdfBuffer: Buffer
): Promise<void> {
  try {
    // Verificar se Backblaze está configurado
    const hasBackblazeConfig =
      (process.env.BACKBLAZE_KEY_ID && process.env.BACKBLAZE_APPLICATION_KEY) ||
      (process.env.BACKBLAZE_ACCESS_KEY_ID &&
        process.env.BACKBLAZE_SECRET_ACCESS_KEY) ||
      (process.env.BACKBLAZE_KEY && process.env.BACKBLAZE_SECRET_KEY);

    if (!hasBackblazeConfig) {
      console.warn(
        '[STORAGE] Backblaze não configurado (verifique BACKBLAZE_KEY_ID/BACKBLAZE_APPLICATION_KEY ou BACKBLAZE_ACCESS_KEY_ID/BACKBLAZE_SECRET_ACCESS_KEY) - pulando upload remoto'
      );
      return;
    }

    // Chave no formato: laudos/lote-{loteId}/laudo-{timestamp}-{random}.pdf
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const key = `laudos/lote-${loteId}/laudo-${timestamp}-${random}.pdf`;

    const result = await uploadToBackblaze(pdfBuffer, key, 'application/pdf');

    // Atualizar metadados locais com informações do arquivo remoto
    const fs = await import('fs/promises');
    const path = await import('path');
    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );

    try {
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const metadata: LaudoMetadata = JSON.parse(metaContent);

      metadata.arquivo_remoto = {
        ...result,
        uploadedAt: new Date().toISOString(),
      };

      await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));

      console.log(
        `[STORAGE] Metadados atualizados com URL remota para laudo ${laudoId}`
      );
    } catch (metaError) {
      console.warn(
        `[STORAGE] Não foi possível atualizar metadados locais:`,
        metaError
      );
      // Não propagar erro - upload foi bem-sucedido
    }

    console.log(
      `[STORAGE] Upload para Backblaze concluído: laudo ${laudoId} → ${result.url}`
    );
  } catch (error) {
    // Log mas não propaga - upload remoto é opcional/assíncrono
    console.error(
      `[STORAGE] Erro ao fazer upload para Backblaze (laudo ${laudoId}):`,
      error
    );

    // Registrar auditoria do erro
    try {
      const { query } = await import('../db');
      await query(
        `INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_role, criado_em)
         VALUES ('laudo_upload_backblaze_erro', 'laudos', $1, $2, 'sistema', NOW())`,
        [
          laudoId,
          JSON.stringify({
            erro: error instanceof Error ? error.message : String(error),
            lote_id: loteId,
          }),
        ]
      );
    } catch (auditError) {
      console.error(
        '[STORAGE] Falha ao registrar auditoria de erro:',
        auditError
      );
    }
  }
}

/**
 * Ler laudo do storage (tenta local primeiro, depois Backblaze)
 */
export async function lerLaudo(laudoId: number): Promise<Buffer> {
  const fs = await import('fs/promises');
  const path = await import('path');

  // Tentar local primeiro
  const localPath = path.join(
    process.cwd(),
    'storage',
    'laudos',
    `laudo-${laudoId}.pdf`
  );

  try {
    const buffer = await fs.readFile(localPath);
    console.log(`[STORAGE] Laudo ${laudoId} lido do storage local`);
    return buffer;
  } catch {
    console.warn(
      `[STORAGE] Arquivo local não encontrado para laudo ${laudoId}, tentando Backblaze...`
    );
  }

  // Tentar Backblaze como fallback
  try {
    // Ler metadados para obter chave remota
    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );
    const metaContent = await fs.readFile(metaPath, 'utf-8');
    const metadata: LaudoMetadata = JSON.parse(metaContent);

    if (!metadata.arquivo_remoto?.key) {
      throw new Error('Metadados não contêm informação de arquivo remoto');
    }

    const buffer = await downloadFromBackblaze(metadata.arquivo_remoto.key);

    // Salvar localmente para cache
    await fs.writeFile(localPath, buffer);
    console.log(
      `[STORAGE] Laudo ${laudoId} baixado do Backblaze e salvo localmente`
    );

    return buffer;
  } catch (remoteError) {
    console.error(`[STORAGE] Falha ao ler do Backblaze:`, remoteError);
    throw new Error(`Laudo ${laudoId} não encontrado em nenhum storage`);
  }
}

/**
 * Verificar se laudo existe (local ou remoto)
 */
export async function laudoExists(laudoId: number): Promise<boolean> {
  const fs = await import('fs/promises');
  const path = await import('path');

  // Verificar local
  const localPath = path.join(
    process.cwd(),
    'storage',
    'laudos',
    `laudo-${laudoId}.pdf`
  );

  try {
    await fs.access(localPath);
    return true;
  } catch {
    // Arquivo local não existe
  }

  // Verificar Backblaze
  try {
    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );
    const metaContent = await fs.readFile(metaPath, 'utf-8');
    const metadata: LaudoMetadata = JSON.parse(metaContent);

    if (!metadata.arquivo_remoto?.key) {
      return false;
    }

    return await checkBackblazeFileExists(metadata.arquivo_remoto.key);
  } catch {
    return false;
  }
}

/**
 * Ler metadados do laudo
 */
export async function lerMetadados(
  laudoId: number
): Promise<LaudoMetadata | null> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );
    const metaContent = await fs.readFile(metaPath, 'utf-8');

    return JSON.parse(metaContent);
  } catch (error) {
    console.warn(
      `[STORAGE] Não foi possível ler metadados do laudo ${laudoId}:`,
      error
    );
    return null;
  }
}

/**
 * Calcular hash SHA-256 de um buffer
 */
export function calcularHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
