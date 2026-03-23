/**
 * GET  /api/suporte/representantes/[id]  — retorna dados completos do representante
 * PATCH /api/suporte/representantes/[id] — edita dados cadastrais e status
 *
 * Acesso restrito ao perfil 'suporte'.
 * Todas as edições são registradas em log de console (auditoria futura).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  nome: z.string().min(2).max(200).trim().optional(),
  email: z.string().email().max(100).optional(),
  telefone: z.string().max(30).optional().nullable(),
  status: z
    .enum([
      'ativo',
      'apto_pendente',
      'apto',
      'apto_bloqueado',
      'suspenso',
      'desativado',
      'rejeitado',
    ])
    .optional(),
  percentual_comissao: z.number().min(0).max(100).optional().nullable(),
  percentual_vendedor_direto: z.number().min(0).max(100).optional().nullable(),
  // Dados bancários do representante (campos opcionais)
  banco_codigo: z.string().max(10).optional().nullable(),
  agencia: z.string().max(20).optional().nullable(),
  conta: z.string().max(30).optional().nullable(),
  tipo_conta: z.enum(['corrente', 'poupanca']).optional().nullable(),
  titular_conta: z.string().max(200).optional().nullable(),
  pix_chave: z.string().max(200).optional().nullable(),
  pix_tipo: z
    .enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'])
    .optional()
    .nullable(),
});

type PatchInput = z.infer<typeof PatchSchema>;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'comercial', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const result = await query(
      `SELECT
         r.*,
         COUNT(DISTINCT hc.vendedor_id) FILTER (WHERE hc.ativo = true) AS total_vendedores,
         COUNT(DISTINCT lr.id) FILTER (WHERE lr.status = 'pendente')    AS leads_pendentes,
         COUNT(DISTINCT lr.id) FILTER (WHERE lr.status = 'convertido')  AS leads_convertidos,
         COUNT(DISTINCT vc.id) FILTER (WHERE vc.status = 'ativo')       AS vinculos_ativos
       FROM representantes r
       LEFT JOIN hierarquia_comercial hc ON hc.representante_id = r.id
       LEFT JOIN leads_representante lr ON lr.representante_id = r.id
       LEFT JOIN vinculos_comissao vc ON vc.representante_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    // Nunca expor senha ou tokens
    const {
      senha_hash: _,
      token_convite: __,
      ...representante
    } = result.rows[0] as Record<string, unknown>;

    console.info(
      JSON.stringify({
        event: 'suporte_representante_visualizado',
        representante_id: id,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({ representante });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[GET /api/suporte/representantes/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que o representante existe
    const exists = await query(
      `SELECT id, status FROM representantes WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (exists.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }
    const statusAnterior = exists.rows[0].status as string;

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: PatchInput = parsed.data;

    // Campos da tabela representantes
    const repFields: Record<string, unknown> = {};
    if (data.nome !== undefined) repFields['nome'] = data.nome;
    if (data.email !== undefined) repFields['email'] = data.email;
    if (data.telefone !== undefined) repFields['telefone'] = data.telefone;
    if (data.status !== undefined) repFields['status'] = data.status;
    if (data.percentual_comissao !== undefined)
      repFields['percentual_comissao'] = data.percentual_comissao;
    if (data.percentual_vendedor_direto !== undefined)
      repFields['percentual_vendedor_direto'] = data.percentual_vendedor_direto;
    if (data.banco_codigo !== undefined)
      repFields['banco_codigo'] = data.banco_codigo;
    if (data.agencia !== undefined) repFields['agencia'] = data.agencia;
    if (data.conta !== undefined) repFields['conta'] = data.conta;
    if (data.tipo_conta !== undefined)
      repFields['tipo_conta'] = data.tipo_conta;
    if (data.titular_conta !== undefined)
      repFields['titular_conta'] = data.titular_conta;
    if (data.pix_chave !== undefined) repFields['pix_chave'] = data.pix_chave;
    if (data.pix_tipo !== undefined) repFields['pix_tipo'] = data.pix_tipo;

    if (Object.keys(repFields).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    const keys = Object.keys(repFields);
    const values = Object.values(repFields);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const updated = await query(
      `UPDATE representantes
       SET ${setClauses}, atualizado_em = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING id, nome, email, status, codigo, percentual_comissao, percentual_vendedor_direto, atualizado_em`,
      [...values, id]
    );

    console.info(
      JSON.stringify({
        event: 'suporte_representante_editado',
        representante_id: id,
        campos_alterados: keys,
        status_anterior: statusAnterior,
        status_novo: data.status ?? statusAnterior,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({ representante: updated.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[PATCH /api/suporte/representantes/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
