/**
 * GET  /api/comercial/representantes/[id] — perfil completo do representante
 * PATCH /api/comercial/representantes/[id] — atualiza dados cadastrais e bancários
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['comercial', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const result = await query(
      `SELECT
         r.id, r.nome, r.email, r.codigo, r.status, r.tipo_pessoa,
         r.telefone, r.cpf, r.cnpj,
         r.criado_em, r.aprovado_em,
         r.aceite_termos, r.aceite_termos_em,
         r.aceite_disclaimer_nv, r.aceite_disclaimer_nv_em,
         r.banco_codigo, r.agencia, r.conta, r.tipo_conta, r.titular_conta,
         r.pix_chave, r.pix_tipo,
         r.dados_bancarios_status,
         r.dados_bancarios_solicitado_em,
         r.dados_bancarios_confirmado_em,
         r.percentual_comissao,
         COUNT(DISTINCT l.id)                                                        AS total_leads,
         COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'pendente')                  AS leads_ativos,
         COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'convertido')                AS leads_convertidos,
         COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'expirado')                  AS leads_expirados,
         COUNT(DISTINCT v.id)                                                        AS total_vinculos,
         COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'ativo')                     AS vinculos_ativos,
         COUNT(DISTINCT c.id)                                                        AS total_comissoes,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status = 'paga'), 0)         AS valor_total_pago,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status IN ('aprovada','liberada')), 0) AS valor_pendente
       FROM representantes r
       LEFT JOIN leads_representante l ON l.representante_id = r.id
       LEFT JOIN vinculos_comissao   v ON v.representante_id = r.id
       LEFT JOIN comissoes_laudo     c ON c.representante_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id]
    );

    if (result.rows.length === 0)
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );

    return NextResponse.json({ representante: result.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/comercial/representantes/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

const PatchSchema = z.object({
  nome:            z.string().min(2).max(200).optional(),
  email:           z.string().email().max(100).optional(),
  telefone:        z.string().max(20).optional().nullable(),
  cpf:             z.string().regex(/^\d{11}$/).optional().nullable(),
  cnpj:            z.string().regex(/^\d{14}$/).optional().nullable(),
  status:          z.enum(['ativo', 'apto_pendente', 'apto', 'apto_bloqueado', 'suspenso', 'desativado', 'rejeitado']).optional(),
  percentual_comissao: z.number().min(0).max(100).optional().nullable(),
  banco_codigo:    z.string().max(10).optional().nullable(),
  agencia:         z.string().max(20).optional().nullable(),
  conta:           z.string().max(30).optional().nullable(),
  tipo_conta:      z.enum(['corrente', 'poupanca']).optional().nullable(),
  titular_conta:   z.string().max(200).optional().nullable(),
  pix_chave:       z.string().max(200).optional().nullable(),
  pix_tipo:        z.enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['comercial', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );

    const data = parsed.data;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const addField = (col: string, val: unknown) => {
      fields.push(`${col} = $${idx++}`);
      values.push(val);
    };

    if (data.nome            !== undefined) addField('nome', data.nome);
    if (data.email           !== undefined) addField('email', data.email);
    if (data.telefone        !== undefined) addField('telefone', data.telefone);
    if (data.cpf             !== undefined) addField('cpf', data.cpf);
    if (data.cnpj            !== undefined) addField('cnpj', data.cnpj);
    if (data.status          !== undefined) addField('status', data.status);
    if (data.percentual_comissao !== undefined) addField('percentual_comissao', data.percentual_comissao);
    if (data.banco_codigo    !== undefined) addField('banco_codigo', data.banco_codigo);
    if (data.agencia         !== undefined) addField('agencia', data.agencia);
    if (data.conta           !== undefined) addField('conta', data.conta);
    if (data.tipo_conta      !== undefined) addField('tipo_conta', data.tipo_conta);
    if (data.titular_conta   !== undefined) addField('titular_conta', data.titular_conta);
    if (data.pix_chave       !== undefined) addField('pix_chave', data.pix_chave);
    if (data.pix_tipo        !== undefined) addField('pix_tipo', data.pix_tipo);

    if (fields.length === 0)
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });

    fields.push(`atualizado_em = NOW()`);
    values.push(id);

    await query(
      `UPDATE representantes SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[PATCH /api/comercial/representantes/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
