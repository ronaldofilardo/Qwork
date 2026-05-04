import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const CADASTRO_BUCKET = 'cad-qwork';

/**
 * Gera uma URL presigned para um arquivo no bucket de cadastros.
 * Usa credenciais dedicadas (BACKBLAZE_CAD_KEY_ID) quando disponíveis.
 */
async function resolveDocUrl(
  path: string | null | undefined,
  remoteKey: string | null | undefined,
  expiresIn = 300
): Promise<string | null> {
  if (!path && !remoteKey) return null;

  // Se existe chave remota no Backblaze → gerar presigned URL
  if (remoteKey) {
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      // Usar credenciais dedicadas ao bucket cad-qwork quando disponíveis
      const cadKeyId = process.env.BACKBLAZE_CAD_KEY_ID?.replace(
        /^['"]|['"]$/g,
        ''
      ).trim();
      const cadAppKey = process.env.BACKBLAZE_CAD_APPLICATION_KEY?.replace(
        /^['"]|['"]$/g,
        ''
      ).trim();

      const rawEndpoint = (
        process.env.BACKBLAZE_ENDPOINT ||
        process.env.BACKBLAZE_S2_ENDPOINT ||
        'https://s3.us-east-005.backblazeb2.com'
      ).trim();
      const endpoint = rawEndpoint.startsWith('http')
        ? rawEndpoint
        : `https://${rawEndpoint}`;
      const region = (
        process.env.BACKBLAZE_REGION ||
        endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/)?.[1] ||
        'us-east-005'
      ).trim();

      const keyId =
        cadKeyId ||
        process.env.BACKBLAZE_KEY_ID ||
        process.env.BACKBLAZE_ACCESS_KEY_ID ||
        '';
      const applicationKey =
        cadAppKey ||
        process.env.BACKBLAZE_APPLICATION_KEY ||
        process.env.BACKBLAZE_SECRET_ACCESS_KEY ||
        '';

      const client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: keyId,
          secretAccessKey: applicationKey,
        },
        forcePathStyle: true,
      });

      const command = new GetObjectCommand({
        Bucket: CADASTRO_BUCKET,
        Key: remoteKey,
      });

      const url = await getSignedUrl(client, command, { expiresIn });
      return url;
    } catch (err) {
      console.error('[DOCS ADMIN] Erro ao gerar presigned URL:', err);
      // fallback: tentar retornar path se disponível
    }
  }

  // Path local DEV: começa com /uploads/ — servido via public/
  if (path && path.startsWith('/uploads/')) {
    return path;
  }

  // Path no diretório storage/ (arquivos de cadastro locais) — servido via /api/storage/[...path]
  // Remove o prefixo 'storage/' para evitar duplicação na URL da API
  if (path && path.startsWith('storage/')) {
    const relativePath = path.slice('storage/'.length);
    return `/api/storage/${relativePath}`;
  }

  // URL direta do Backblaze — extrair key e gerar presigned URL
  if (path && path.startsWith('https://') && path.includes('backblazeb2.com')) {
    try {
      const urlObj = new URL(path);
      const segments = urlObj.pathname.replace(/^\//, '').split('/');
      if (segments.length >= 2) {
        const extractedKey = segments.slice(1).join('/');
        return resolveDocUrl(null, extractedKey, expiresIn);
      }
    } catch {
      // fallback: retornar path bruto
    }
    return path;
  }

  // Outra URL HTTPS genérica
  if (path && path.startsWith('https://')) {
    return path;
  }

  return null;
}

/**
 * GET /api/admin/tomadores/[id]/documentos?tipo=clinica|entidade
 *
 * Retorna URLs resolvidas (presigned para Backblaze ou paths locais)
 * para os três documentos de cadastro de um tomador.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['admin', 'suporte'], false);

    const { id } = params;
    const tipo = new URL(request.url).searchParams.get('tipo') as
      | 'clinica'
      | 'entidade'
      | null;

    if (!tipo || !['clinica', 'entidade'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Parâmetro "tipo" deve ser "clinica" ou "entidade"' },
        { status: 400 }
      );
    }

    const tabela = tipo === 'clinica' ? 'clinicas' : 'entidades';

    const sql = `
      SELECT
        cartao_cnpj_path,
        contrato_social_path,
        doc_identificacao_path,
        cartao_cnpj_arquivo_remoto_key,
        contrato_social_arquivo_remoto_key,
        doc_identificacao_arquivo_remoto_key
      FROM ${tabela}
      WHERE id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    const [cartao_cnpj, contrato_social, doc_identificacao] = await Promise.all(
      [
        resolveDocUrl(row.cartao_cnpj_path, row.cartao_cnpj_arquivo_remoto_key),
        resolveDocUrl(
          row.contrato_social_path,
          row.contrato_social_arquivo_remoto_key
        ),
        resolveDocUrl(
          row.doc_identificacao_path,
          row.doc_identificacao_arquivo_remoto_key
        ),
      ]
    );

    return NextResponse.json({
      success: true,
      documentos: {
        cartao_cnpj,
        contrato_social,
        doc_identificacao,
      },
    });
  } catch (error) {
    console.error('[DOCS ADMIN] Erro ao buscar documentos:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno ao buscar documentos' },
      { status: 500 }
    );
  }
}
