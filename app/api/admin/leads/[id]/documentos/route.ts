/**
 * GET /api/admin/leads/[id]/documentos
 *
 * Retorna URLs resolvidas para os documentos enviados por um candidato (lead).
 * Busca diretamente por ID na tabela representantes_cadastro_leads.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const REP_BUCKET = 'rep-qwork';

async function resolveRepDocUrl(
  key: string | null | undefined,
  fallbackUrl: string | null | undefined,
  expiresIn = 300
): Promise<string | null> {
  if (!key && !fallbackUrl) return null;

  if (key && key.startsWith('storage/')) {
    const relativePath = key.slice('storage/'.length);
    return `/api/storage/${relativePath}`;
  }

  if (key) {
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const repKeyId = process.env.BACKBLAZE_REP_KEY_ID?.trim();
      const repAppKey = process.env.BACKBLAZE_REP_APPLICATION_KEY?.trim();

      const rawEndpoint =
        process.env.BACKBLAZE_ENDPOINT ||
        process.env.BACKBLAZE_S2_ENDPOINT ||
        's3.us-east-005.backblazeb2.com';
      const endpoint =
        rawEndpoint.startsWith('https://') || rawEndpoint.startsWith('http://')
          ? rawEndpoint
          : `https://${rawEndpoint}`;
      const region =
        process.env.BACKBLAZE_REGION ||
        rawEndpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/)?.[1] ||
        'us-east-005';

      const keyId =
        repKeyId ||
        process.env.BACKBLAZE_KEY_ID ||
        process.env.BACKBLAZE_ACCESS_KEY_ID ||
        '';
      const applicationKey =
        repAppKey ||
        process.env.BACKBLAZE_APPLICATION_KEY ||
        process.env.BACKBLAZE_SECRET_ACCESS_KEY ||
        '';

      const client = new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId: keyId, secretAccessKey: applicationKey },
        forcePathStyle: true,
      });

      const command = new GetObjectCommand({ Bucket: REP_BUCKET, Key: key });
      return await getSignedUrl(client, command, { expiresIn });
    } catch (err) {
      console.error('[DOCS ADMIN LEAD] Erro ao gerar presigned URL:', err);
    }
  }

  if (fallbackUrl && fallbackUrl.startsWith('https://')) {
    return fallbackUrl;
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['comercial', 'suporte'], false);

    const id = params.id?.trim();
    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const result = await query<{
      tipo_pessoa: string;
      doc_cpf_key: string | null;
      doc_cpf_filename: string | null;
      doc_cpf_url: string | null;
      doc_cnpj_key: string | null;
      doc_cnpj_filename: string | null;
      doc_cnpj_url: string | null;
      doc_cpf_resp_key: string | null;
      doc_cpf_resp_filename: string | null;
      doc_cpf_resp_url: string | null;
    }>(
      `SELECT tipo_pessoa,
              doc_cpf_key, doc_cpf_filename, doc_cpf_url,
              doc_cnpj_key, doc_cnpj_filename, doc_cnpj_url,
              doc_cpf_resp_key, doc_cpf_resp_filename, doc_cpf_resp_url
       FROM representantes_cadastro_leads
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ documentos: null });
    }

    const lead = result.rows[0];

    const [docCpfUrl, docCnpjUrl, docCpfRespUrl] = await Promise.all([
      resolveRepDocUrl(lead.doc_cpf_key, lead.doc_cpf_url),
      resolveRepDocUrl(lead.doc_cnpj_key, lead.doc_cnpj_url),
      resolveRepDocUrl(lead.doc_cpf_resp_key, lead.doc_cpf_resp_url),
    ]);

    const documentos =
      lead.tipo_pessoa === 'pf'
        ? {
            doc_cpf: docCpfUrl
              ? {
                  url: docCpfUrl,
                  filename: lead.doc_cpf_filename ?? 'Documento CPF',
                }
              : null,
          }
        : {
            doc_cnpj: docCnpjUrl
              ? {
                  url: docCnpjUrl,
                  filename: lead.doc_cnpj_filename ?? 'Cartão CNPJ',
                }
              : null,
            doc_cpf_resp: docCpfRespUrl
              ? {
                  url: docCpfRespUrl,
                  filename: lead.doc_cpf_resp_filename ?? 'CPF Responsável',
                }
              : null,
          };

    return NextResponse.json({ tipo_pessoa: lead.tipo_pessoa, documentos });
  } catch (error: unknown) {
    const e = error as Error;
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (e.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
    console.error('[DOCS ADMIN LEAD]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
