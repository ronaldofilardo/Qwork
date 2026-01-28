/**
 * Cliente Backblaze B2 para armazenamento de laudos
 *
 * Usa S3-compatible API do Backblaze para upload e download de arquivos
 */

import crypto from 'crypto';

interface BackblazeConfig {
  endpoint: string;
  region: string;
  bucket: string;
  keyId: string;
  applicationKey: string;
}

interface UploadResult {
  provider: 'backblaze';
  bucket: string;
  key: string;
  url: string;
  etag?: string;
}

/**
 * Obter configuração do Backblaze a partir de variáveis de ambiente
 */
function getBackblazeConfig(): BackblazeConfig {
  const provider = (process.env.BACKBLAZE_PROVIDER || 'b2').toLowerCase();

  // Se o provedor for 's2' (Backblaze S2), permitir endpoint/região específicos via env
  let endpoint = process.env.BACKBLAZE_ENDPOINT;
  let region = process.env.BACKBLAZE_REGION || '';

  if (provider === 's2') {
    endpoint = endpoint || process.env.BACKBLAZE_S2_ENDPOINT || '';
    region = region || process.env.BACKBLAZE_S2_REGION || '';
  } else {
    // Comportamento legacy para Backblaze B2 S3-compatible
    endpoint = endpoint || 'https://s3.us-east-005.backblazeb2.com';
    region = region || 'us-east-005';
  }

  // Trim and normalize env vars (remove accidental quotes)
  const bucket = (process.env.BACKBLAZE_BUCKET || 'laudos-qwork').replace(
    /^['"]|['"]$/g,
    ''
  );
  // Suporte a nomes de variáveis antigos/alternativos (compatibilidade local)
  const rawKeyId =
    process.env.BACKBLAZE_KEY_ID ||
    process.env.BACKBLAZE_ACCESS_KEY_ID ||
    process.env.BACKBLAZE_KEY ||
    '';
  const rawApplicationKey =
    process.env.BACKBLAZE_APPLICATION_KEY ||
    process.env.BACKBLAZE_SECRET_ACCESS_KEY ||
    process.env.BACKBLAZE_SECRET_KEY ||
    '';

  // Normalizar e trim
  let keyId = String(rawKeyId)
    .replace(/^['"]|['"]$/g, '')
    .trim();
  let applicationKey = String(rawApplicationKey)
    .replace(/^['"]|['"]$/g, '')
    .trim();

  if (!keyId || !applicationKey) {
    throw new Error(
      'Configuração Backblaze incompleta: defina BACKBLAZE_KEY_ID/BACKBLAZE_APPLICATION_KEY (ou BACKBLAZE_ACCESS_KEY_ID/BACKBLAZE_SECRET_ACCESS_KEY para compatibilidade)'
    );
  }

  // Heurísticas para identificar Key IDs vs Application Keys
  const looksLikeKeyId = (v: string) => /^0{0,}5[0-9a-f]{6,}/i.test(v);
  const looksLikeApplicationKey = (v: string) => v.length >= 32;

  // Caso comum: valores trocados (ex.: o secret foi colocado em BACKBLAZE_KEY_ID e o Key ID em BACKBLAZE_APPLICATION_KEY)
  if (looksLikeApplicationKey(keyId) && looksLikeKeyId(applicationKey)) {
    console.warn(
      '[BACKBLAZE] Detected BACKBLAZE_KEY_ID and BACKBLAZE_APPLICATION_KEY appear to be swapped. Auto-correcting for runtime. Please update your environment variables to correct the order.'
    );
    // Realocar corretamente
    [keyId, applicationKey] = [applicationKey, keyId];
  }

  // Se a keyId parecer curta (p.ex. não corresponder ao padrão 0052...), avisar sobre usar Application Key ID (S3 compatível)
  if (keyId && keyId.length < 20) {
    const masked = `${keyId.slice(0, 8)}...`;
    console.warn(
      `[BACKBLAZE] Aviso: BACKBLAZE keyId (${masked}) parece curto. Para S3 (S2) use Application Key ID (ex.: '0052...') e Application Key.`
    );
  }

  // Detectar se a applicationKey parece um keyId (indica valor invertido)
  const appLooksLikeKeyId =
    looksLikeKeyId(applicationKey) && applicationKey.length <= 32;
  if (appLooksLikeKeyId) {
    throw new Error(
      'Aparentemente BACKBLAZE_APPLICATION_KEY contém um Key ID (ex.: começa com 005...). Verifique se você copiou a *Application Key* (secret) e não o Key ID. Se você acidentalmente inverteu os valores, corrija suas variáveis de ambiente (BACKBLAZE_KEY_ID ↔ BACKBLAZE_APPLICATION_KEY).'
    );
  }

  if (!endpoint) {
    throw new Error(
      'Configuração Backblaze incompleta: BACKBLAZE_ENDPOINT ou BACKBLAZE_S2_ENDPOINT deve ser definido para o provider selecionado'
    );
  }

  // Normalizar endpoint: garantir que exista o esquema (http/https) para o SDK
  if (!/^[a-z]+:\/\//i.test(endpoint)) {
    endpoint = `https://${endpoint}`;
  }

  // Remover barra final para consistência
  endpoint = endpoint.replace(/\/$/, '');

  // Identificar origem das variáveis usadas (mascarar valores por segurança)
  const keySource = process.env.BACKBLAZE_KEY_ID
    ? 'BACKBLAZE_KEY_ID'
    : process.env.BACKBLAZE_ACCESS_KEY_ID
      ? 'BACKBLAZE_ACCESS_KEY_ID'
      : process.env.BACKBLAZE_KEY
        ? 'BACKBLAZE_KEY'
        : 'none';
  const appKeySource = process.env.BACKBLAZE_APPLICATION_KEY
    ? 'BACKBLAZE_APPLICATION_KEY'
    : process.env.BACKBLAZE_SECRET_ACCESS_KEY
      ? 'BACKBLAZE_SECRET_ACCESS_KEY'
      : process.env.BACKBLAZE_SECRET_KEY
        ? 'BACKBLAZE_SECRET_KEY'
        : 'none';

  const mask = (v: string | undefined) =>
    v ? `${String(v).slice(0, 8)}...` : '(none)';

  console.log(
    `[BACKBLAZE] Provider: ${provider}, endpoint: ${endpoint}, bucket: ${bucket}`
  );
  console.log(
    `[BACKBLAZE] Key source: ${keySource}=${mask(keyId)}, AppKey source: ${appKeySource}=${mask(applicationKey)}`
  );

  return {
    endpoint,
    region,
    bucket,
    keyId,
    applicationKey,
  };
}

/**
 * Fazer upload de arquivo para Backblaze B2
 *
 * @param buffer - Buffer do arquivo
 * @param key - Chave (caminho) do arquivo no bucket
 * @param contentType - Tipo MIME do arquivo
 * @returns Informações do arquivo armazenado
 */
export async function uploadToBackblaze(
  buffer: Buffer,
  key: string,
  contentType: string = 'application/pdf'
): Promise<UploadResult> {
  try {
    const config = getBackblazeConfig();

    // Usar SDK da AWS (compatível com S3) para Backblaze
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
      forcePathStyle: true, // Necessário para Backblaze
    });

    // Calcular MD5 para verificação de integridade
    const md5Hash = crypto.createHash('md5').update(buffer).digest('base64');

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentMD5: md5Hash,
      // Metadados adicionais
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'file-size': buffer.length.toString(),
      },
    });

    const response = await client.send(command);

    console.log(
      `[BACKBLAZE] Upload bem-sucedido: ${key} (${buffer.length} bytes)`
    );

    return {
      provider: 'backblaze',
      bucket: config.bucket,
      key,
      url: `${config.endpoint}/${config.bucket}/${key}`,
      etag: response.ETag,
    };
  } catch (error: any) {
    console.error('[BACKBLAZE] Erro no upload:', error);
    if (
      error &&
      (error.Code === 'InvalidAccessKeyId' ||
        /InvalidAccessKeyId|Malformed Access Key Id/i.test(
          String(error.message || '')
        ))
    ) {
      throw new Error(
        'Falha ao fazer upload para Backblaze: Credenciais inválidas (InvalidAccessKeyId). Verifique se BACKBLAZE_KEY_ID/BACKBLAZE_APPLICATION_KEY estão corretos e correspondem a uma Application Key S3 (ex.: chave começando com 005...).'
      );
    }
    throw new Error(
      `Falha ao fazer upload para Backblaze: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fazer download de arquivo do Backblaze B2
 *
 * @param key - Chave (caminho) do arquivo no bucket
 * @returns Buffer do arquivo
 */
export async function downloadFromBackblaze(key: string): Promise<Buffer> {
  try {
    const config = getBackblazeConfig();

    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
      forcePathStyle: true,
    });

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      throw new Error('Resposta sem corpo');
    }

    // Converter stream para buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    console.log(
      `[BACKBLAZE] Download bem-sucedido: ${key} (${buffer.length} bytes)`
    );

    return buffer;
  } catch (error) {
    console.error('[BACKBLAZE] Erro no download:', error);
    throw new Error(
      `Falha ao fazer download do Backblaze: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Verificar se arquivo existe no Backblaze
 *
 * @param key - Chave (caminho) do arquivo no bucket
 * @returns true se existir, false caso contrário
 */
export async function checkBackblazeFileExists(key: string): Promise<boolean> {
  try {
    const config = getBackblazeConfig();

    const { S3Client, HeadObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
      forcePathStyle: true,
    });

    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Deletar arquivo do Backblaze
 *
 * @param key - Chave (caminho) do arquivo no bucket
 */
export async function deleteFromBackblaze(key: string): Promise<void> {
  try {
    const config = getBackblazeConfig();

    const { S3Client, DeleteObjectCommand } =
      await import('@aws-sdk/client-s3');

    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
      forcePathStyle: true,
    });

    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    await client.send(command);

    console.log(`[BACKBLAZE] Arquivo deletado: ${key}`);
  } catch (error) {
    console.error('[BACKBLAZE] Erro ao deletar arquivo:', error);
    throw new Error(
      `Falha ao deletar arquivo do Backblaze: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Verificar se o Backblaze está configurado e acessível
 */
export async function checkBackblazeConnection(): Promise<boolean> {
  try {
    const config = getBackblazeConfig();

    const { S3Client, ListObjectsV2Command } =
      await import('@aws-sdk/client-s3');

    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
      forcePathStyle: true,
    });

    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1,
    });

    await client.send(command);

    console.log('[BACKBLAZE] Conexão verificada com sucesso');
    return true;
  } catch (error) {
    console.error('[BACKBLAZE] Falha na verificação de conexão:', error);
    return false;
  }
}
