/**
 * POST /api/representante/financeiro/nf-rpa
 *
 * O representante envia (upload) o arquivo NF/RPA para um ciclo em status
 * 'aguardando_nf_rpa'.
 *
 * Body: multipart/form-data
 *   ciclo_id — ID do ciclo
 *   arquivo  — arquivo (PDF, JPEG, PNG, WEBP; máx 2 MB)
 *
 * Armazena em storage/nf-rpa/{representante_id}/{ciclo_id}/{filename}
 * e atualiza o ciclo para status 'nf_rpa_enviada'.
 *
 * Acesso: representante autenticado
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { query } from '@/lib/db';
import {
  requireRepresentanteComDB,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const TIPOS_ACEITOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const sess = await requireRepresentanteComDB();

    const formData = await request.formData();
    const cicloIdRaw = formData.get('ciclo_id');
    const arquivo = formData.get('arquivo') as File | null;

    if (!cicloIdRaw || !arquivo) {
      return NextResponse.json(
        { error: 'ciclo_id e arquivo são obrigatórios' },
        { status: 400 }
      );
    }

    const cicloId = parseInt(String(cicloIdRaw), 10);
    if (isNaN(cicloId)) {
      return NextResponse.json({ error: 'ciclo_id inválido' }, { status: 400 });
    }

    // Validar arquivo
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não aceito. Use PDF, JPEG, PNG ou WEBP.' },
        { status: 422 }
      );
    }
    if (arquivo.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo excede o limite de 2 MB.' },
        { status: 422 }
      );
    }

    // Verificar que o ciclo pertence ao representante e está aguardando NF
    const cicloRes = await query(
      `SELECT id, status FROM ciclos_comissao_mensal
       WHERE id = $1 AND representante_id = $2
       LIMIT 1`,
      [cicloId, sess.representante_id]
    );

    if (cicloRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ciclo não encontrado' },
        { status: 404 }
      );
    }

    const ciclo = cicloRes.rows[0] as { id: number; status: string };
    if (ciclo.status !== 'aguardando_nf_rpa') {
      return NextResponse.json(
        {
          error: `Ciclo está com status '${ciclo.status}'. Apenas 'aguardando_nf_rpa' aceita envio de NF/RPA.`,
          code: 'STATUS_INVALIDO',
        },
        { status: 409 }
      );
    }

    // Salvar arquivo em disco (storage local)
    const ext = arquivo.name.split('.').pop() ?? 'bin';
    const nomeArquivo = `nf_rpa_ciclo_${cicloId}_${Date.now()}.${ext}`;
    const dirPath = path.join(
      process.cwd(),
      'storage',
      'nf-rpa',
      String(sess.representante_id),
      String(cicloId)
    );
    await mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, nomeArquivo);
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    await writeFile(filePath, buffer);

    const storagePath = `nf-rpa/${sess.representante_id}/${cicloId}/${nomeArquivo}`;

    // Atualizar ciclo
    await query(
      `UPDATE ciclos_comissao_mensal
       SET status             = 'nf_rpa_enviada',
           nf_rpa_path        = $1,
           nf_rpa_nome_arquivo = $2,
           data_envio_nf_rpa  = NOW(),
           atualizado_em      = NOW()
       WHERE id = $3`,
      [storagePath, arquivo.name, cicloId]
    );

    return NextResponse.json({
      ok: true,
      message: 'NF/RPA enviada com sucesso. Aguardando validação.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    const { status, body } = repAuthErrorResponse(e);
    if (status !== 500) return NextResponse.json(body, { status });
    console.error('[POST /api/representante/financeiro/nf-rpa]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
