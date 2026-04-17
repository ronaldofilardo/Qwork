/**
 * POST /api/representante/ciclos/[id]/nf
 * Upload de NF/RPA para um ciclo de comissão do representante.
 *
 * Body (multipart/form-data):
 *   - nf: File (PDF, JPG, PNG — máx 3MB)
 *
 * Fluxo:
 * 1. Valida ciclo pertence ao representante autenticado
 * 2. Valida arquivo (tipo, tamanho, magic bytes)
 * 3. Upload via uploadDocumentoRepresentante (local DEV / Backblaze PROD)
 * 4. UPDATE ciclos_comissao SET nf_path, nf_nome_arquivo, nf_enviada_em, status='nf_enviada'
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import {
  uploadDocumentoRepresentante,
  validarMagicBytes,
  DOCUMENTO_MAX_SIZE_BYTES,
  DOCUMENTO_MIMES_ACEITOS,
} from '@/lib/storage/representante-storage';

export const dynamic = 'force-dynamic';

const MIMES_ACEITOS = new Set<string>(DOCUMENTO_MIMES_ACEITOS);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    const cicloId = parseInt(params.id, 10);
    if (isNaN(cicloId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Parse multipart
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Envie os dados como multipart/form-data' },
        { status: 400 }
      );
    }

    const arquivo = formData.get('nf') as File | null;
    if (!arquivo || arquivo.size === 0)
      return NextResponse.json(
        { error: 'Arquivo NF/RPA obrigatório', field: 'nf' },
        { status: 400 }
      );

    if (arquivo.size > DOCUMENTO_MAX_SIZE_BYTES)
      return NextResponse.json(
        { error: 'Arquivo muito grande (máx 3MB)', field: 'nf' },
        { status: 400 }
      );

    const mimeType = arquivo.type;
    if (!MIMES_ACEITOS.has(mimeType))
      return NextResponse.json(
        {
          error: 'Formato não aceito. Envie PDF, JPG ou PNG',
          field: 'nf',
        },
        { status: 400 }
      );

    const buffer = Buffer.from(await arquivo.arrayBuffer());

    if (!validarMagicBytes(buffer, mimeType))
      return NextResponse.json(
        { error: 'Arquivo corrompido ou formato inválido', field: 'nf' },
        { status: 400 }
      );

    // Validar que o ciclo pertence ao representante e está em status permitido
    const cicloResult = await query<{
      id: number;
      status: string;
      representante_id: number;
    }>(
      `SELECT id, status, representante_id
       FROM ciclos_comissao
       WHERE id = $1 AND representante_id = $2`,
      [cicloId, sess.representante_id]
    );

    if (cicloResult.rows.length === 0)
      return NextResponse.json(
        { error: 'Ciclo não encontrado' },
        { status: 404 }
      );

    const ciclo = cicloResult.rows[0];
    const statusPermitidos = ['fechado', 'nf_enviada']; // permite reenvio
    if (!statusPermitidos.includes(ciclo.status))
      return NextResponse.json(
        {
          error: `NF não pode ser enviada para ciclo com status "${ciclo.status}"`,
        },
        { status: 422 }
      );

    // Upload do arquivo
    const identificador = sess.cpf ?? String(sess.representante_id);
    const tipoPessoa: 'pf' | 'pj' = sess.tipo_pessoa ?? 'pf';

    const resultado = await uploadDocumentoRepresentante(
      buffer,
      'rpa',
      identificador,
      mimeType,
      tipoPessoa,
      'RPA'
    );

    // Atualizar ciclo
    await query(
      `UPDATE ciclos_comissao
       SET nf_path           = $1,
           nf_nome_arquivo   = $2,
           nf_enviada_em     = NOW(),
           nf_aprovada_em    = NULL,
           nf_rejeitada_em   = NULL,
           nf_motivo_rejeicao = NULL,
           status            = 'nf_enviada'
       WHERE id = $3 AND representante_id = $4`,
      [resultado.path, arquivo.name, cicloId, sess.representante_id]
    );

    return NextResponse.json({
      ok: true,
      ciclo_id: cicloId,
      nf_path: resultado.path,
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('REP_')) {
      const r = repAuthErrorResponse(err);
      return NextResponse.json(r.body, { status: r.status });
    }
    console.error('[POST /api/representante/ciclos/[id]/nf]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
