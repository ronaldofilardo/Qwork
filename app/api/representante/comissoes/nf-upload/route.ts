/**
 * POST /api/representante/comissoes/nf-upload
 *
 * Upload de Nota Fiscal mensal do representante.
 * O rep envia NF referente a um mês de comissões pagas (compliance).
 *
 * Body (FormData):
 *   - mes: YYYY-MM (mês de referência)
 *   - arquivo: File (PDF — máx 3MB)
 *
 * Acesso: representante autenticado
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import type { Session } from '@/lib/session';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Envie os dados como multipart/form-data' },
        { status: 400 }
      );
    }

    const mes = (formData.get('mes') as string | null)?.trim();
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return NextResponse.json(
        { error: 'Mês inválido. Use formato YYYY-MM.' },
        { status: 400 }
      );
    }

    const arquivo = formData.get('arquivo') as File | null;
    if (!arquivo || arquivo.size === 0) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório.' },
        { status: 400 }
      );
    }
    if (arquivo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo excede 3MB.' },
        { status: 400 }
      );
    }
    if (arquivo.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são aceitos.' },
        { status: 400 }
      );
    }

    const mesRef = `${mes}-01`;
    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    // Buscar ou criar ciclo para este mês
    let cicloRes = await query(
      `SELECT id, status FROM ciclos_comissao
       WHERE representante_id = $1 AND mes_referencia = $2::date
       LIMIT 1`,
      [sess.representante_id, mesRef],
      rlsSess
    );

    if (cicloRes.rows.length === 0) {
      // Criar ciclo se não existir (pode acontecer se comissões foram pagas sem ciclo)
      cicloRes = await query(
        `INSERT INTO ciclos_comissao (representante_id, mes_referencia, status, valor_total, qtd_comissoes)
         VALUES ($1, $2::date, 'fechado', 0, 0)
         ON CONFLICT (representante_id, mes_referencia) DO NOTHING
         RETURNING id, status`,
        [sess.representante_id, mesRef],
        rlsSess
      );
      if (cicloRes.rows.length === 0) {
        // ON CONFLICT hit — re-fetch
        cicloRes = await query(
          `SELECT id, status FROM ciclos_comissao
           WHERE representante_id = $1 AND mes_referencia = $2::date
           LIMIT 1`,
          [sess.representante_id, mesRef],
          rlsSess
        );
      }
    }

    if (cicloRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível localizar o ciclo de comissões.' },
        { status: 404 }
      );
    }

    const ciclo = cicloRes.rows[0];

    // Só permite upload se ciclo está em 'fechado' ou 'aberto' (reenvio após rejeição)
    if (!['fechado', 'aberto'].includes(ciclo.status)) {
      return NextResponse.json(
        { error: `NF já enviada ou aprovada para este mês (status: ${ciclo.status}).` },
        { status: 409 }
      );
    }

    // Salvar arquivo — upload para storage
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const timestamp = Date.now();
    const nomeArquivo = `nf_${mes}_${timestamp}.pdf`;

    // Buscar dados do rep para storage path
    const repData = await query<{ cnpj: string | null }>(
      `SELECT cnpj FROM representantes WHERE id = $1`,
      [sess.representante_id],
      rlsSess
    );
    const repCnpj = repData.rows[0]?.cnpj ?? String(sess.representante_id);

    // Upload local (DEV) ou remoto (PROD)
    const { uploadDocumentoRepresentante } = await import('@/lib/storage/representante-storage');
    const uploadResult = await uploadDocumentoRepresentante(
      buffer,
      'nf',
      repCnpj,
      'application/pdf',
      'pj',
      'COMP'
    );

    const nfPath = uploadResult.arquivo_remoto?.key ?? uploadResult.path;

    // Atualizar ciclo
    await query(
      `UPDATE ciclos_comissao
       SET status = 'nf_enviada',
           nf_path = $2,
           nf_nome_arquivo = $3,
           nf_enviada_em = NOW(),
           nf_rejeitada_em = NULL,
           nf_motivo_rejeicao = NULL,
           atualizado_em = NOW()
       WHERE id = $1`,
      [ciclo.id, nfPath, nomeArquivo]
    );

    return NextResponse.json({
      success: true,
      ciclo_id: ciclo.id,
      nf_path: nfPath,
      nf_nome_arquivo: nomeArquivo,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
