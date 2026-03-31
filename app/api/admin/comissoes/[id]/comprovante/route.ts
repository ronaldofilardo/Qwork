/**
 * POST /api/admin/comissoes/[id]/comprovante
 * Admin envia comprovante de pagamento e marca a comissão como paga.
 *
 * Aceita PDF, PNG, JPG, JPEG, WEBP — máx 5MB.
 * Armazena em:
 *   DEV  → storage/representantes/{PF|PJ}/{CPF|CNPJ}/COMP/
 *   PROD → rep-qwork/{PF|PJ}/{CPF|CNPJ}/COMP/ (Backblaze)
 *
 * Validações de negócio:
 *   - Status da comissão deve ser 'liberada'
 *   - Arquivo obrigatório nesta rota (caso sem arquivo, usar PATCH /api/admin/comissoes/[id])
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { registrarAuditoria } from '@/lib/db/comissionamento';
import { requireRole } from '@/lib/session';
import { uploadDocumentoRepresentante } from '@/lib/storage/representante-storage';

export const dynamic = 'force-dynamic';

const COMPROVANTE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const COMPROVANTE_MIMES_ACEITOS = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('suporte', false);
    const comissaoId = parseInt(params.id, 10);
    if (isNaN(comissaoId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get('comprovante') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado. Use o campo "comprovante".' },
        { status: 400 }
      );
    }

    if (file.size > COMPROVANTE_MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Arquivo excede o limite de 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB enviado).`,
        },
        { status: 400 }
      );
    }

    if (!COMPROVANTE_MIMES_ACEITOS.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Tipo não aceito: ${file.type}. Use PDF, PNG, JPG ou WEBP.`,
        },
        { status: 400 }
      );
    }

    // Buscar comissão + dados do representante para montar o path de storage
    const comissaoResult = await query(
      `SELECT c.id, c.status, c.representante_id,
              r.tipo_pessoa, r.cpf, r.cnpj, r.nome AS representante_nome
       FROM comissoes_laudo c
       JOIN representantes r ON r.id = c.representante_id
       WHERE c.id = $1 LIMIT 1`,
      [comissaoId]
    );

    if (comissaoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comissão não encontrada.' },
        { status: 404 }
      );
    }

    const comissao = comissaoResult.rows[0];

    if (comissao.status !== 'liberada') {
      return NextResponse.json(
        {
          error: `Comprovante só pode ser enviado para comissão com status 'liberada'. Status atual: '${comissao.status}'.`,
        },
        { status: 422 }
      );
    }

    const tipoPessoa: 'pf' | 'pj' = comissao.tipo_pessoa ?? 'pf';
    const identificador: string =
      tipoPessoa === 'pj'
        ? (comissao.cnpj ?? String(comissao.representante_id))
        : (comissao.cpf ?? String(comissao.representante_id));

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await uploadDocumentoRepresentante(
      buffer,
      'rpa',
      identificador,
      file.type,
      tipoPessoa,
      'COMP'
    );

    const comprovantePath = uploadResult.path;

    // Marcar comissão como paga e salvar path do comprovante
    const updated = await query(
      `UPDATE comissoes_laudo
       SET status = 'paga',
           data_pagamento = NOW(),
           comprovante_pagamento_path = $2,
           atualizado_em = NOW()
       WHERE id = $1
       RETURNING *`,
      [comissaoId, comprovantePath]
    );

    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissaoId,
      status_anterior: 'liberada',
      status_novo: 'paga',
      triggador: 'admin_action',
      motivo: `Comprovante de pagamento anexado: ${file.name}`,
      criado_por_cpf: session.cpf,
    });

    return NextResponse.json(
      {
        success: true,
        comissao: updated.rows[0],
        comprovante_path: comprovantePath,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[POST /api/admin/comissoes/[id]/comprovante]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
