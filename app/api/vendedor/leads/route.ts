/**
 * GET  /api/vendedor/leads — lista leads do vendedor logado
 * POST /api/vendedor/leads — cria novo lead (vendedor cadastra CNPJ)
 *
 * Regra: 1 vendedor = 1 representante ativo (via hierarquia_comercial)
 * O representante_id é sempre inferido do vínculo ativo do vendedor.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarEmail,
  validarTelefone,
} from '@/lib/validators';
import { calcularRequerAprovacao } from '@/lib/leads-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    const userResult = await query<{ id: number }>(
      `SELECT id FROM public.usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [session.cpf]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    const vendedorId = userResult.rows[0].id;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    const wheres = [`lr.vendedor_id = $1`];
    const params: unknown[] = [vendedorId];
    let idx = 2;

    if (statusFilter) {
      wheres.push(`lr.status = $${idx++}`);
      params.push(statusFilter);
    }

    const where = `WHERE ${wheres.join(' AND ')}`;

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM public.leads_representante lr ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         lr.id,
         lr.status,
         lr.contato_nome,
         lr.contato_email,
         lr.contato_telefone,
         lr.cnpj,
         lr.valor_negociado,
         lr.percentual_comissao,
         lr.criado_em,
         lr.data_conversao,
         r.id    AS representante_id,
         r.nome  AS representante_nome,
         r.codigo AS representante_codigo
       FROM public.leads_representante lr
       JOIN public.representantes r ON r.id = lr.representante_id
       ${where}
       ORDER BY lr.criado_em DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return NextResponse.json({ leads: rows.rows, total, page, limit });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[GET /api/vendedor/leads]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — vendedor cria novo lead
// O representante_id é inferido do vínculo ativo em hierarquia_comercial.
// ---------------------------------------------------------------------------

const novoLeadSchema = z.object({
  contato_nome: z.string().min(3).max(120),
  contato_email: z.string().email().optional().nullable(),
  contato_telefone: z.string().optional().nullable(),
  cnpj: z.string().min(1, 'CNPJ é obrigatório'),
  valor_negociado: z.number().positive().optional().nullable(),
  percentual_comissao: z.number().min(0).max(100).optional().nullable(),
  observacoes: z.string().max(1000).optional().nullable(),
  tipo_cliente: z.enum(['entidade', 'clinica']).optional().default('entidade'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    // Resolve usuario_id do vendedor autenticado
    const userResult = await query<{ id: number }>(
      `SELECT id FROM public.usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [session.cpf]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    const vendedorId = userResult.rows[0].id;

    // Garante que o vendedor está vinculado a exatamente 1 representante ativo
    const hierResult = await query<{ representante_id: number }>(
      `SELECT representante_id
         FROM public.hierarquia_comercial
        WHERE vendedor_id = $1 AND ativo = true
        LIMIT 1`,
      [vendedorId]
    );
    if (hierResult.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            'Você precisa estar vinculado a um representante para cadastrar leads.',
        },
        { status: 400 }
      );
    }
    const representanteId = hierResult.rows[0].representante_id;

    // Valida body
    const body = await request.json();
    const parsed = novoLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }
    const data = parsed.data;

    // Validações de formato
    if (data.contato_email && !validarEmail(data.contato_email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 422 });
    }
    if (data.contato_telefone && !validarTelefone(data.contato_telefone)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 422 });
    }

    const cnpjNorm = normalizeCNPJ(data.cnpj);
    if (!validarCNPJ(cnpjNorm)) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 422 });
    }

    // Verificar se já existe lead ativo (pendente) para esse CNPJ
    const leadExistente = await query(
      `SELECT id, representante_id FROM leads_representante
       WHERE cnpj = $1 AND status = 'pendente' LIMIT 1`,
      [cnpjNorm]
    );
    if (leadExistente.rows.length > 0) {
      const leadAtivo = leadExistente.rows[0];
      if (leadAtivo.representante_id === representanteId) {
        return NextResponse.json(
          { error: 'Você já possui um lead ativo para este CNPJ' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error:
            'Este CNPJ já foi registrado como lead por outro representante',
        },
        { status: 409 }
      );
    }

    // Verificar se o CNPJ já está cadastrado como entidade (cliente ativo)
    const entidadeExiste = await query(
      `SELECT id FROM entidades WHERE cnpj = $1 LIMIT 1`,
      [cnpjNorm]
    );
    if (entidadeExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado como cliente no QWork' },
        { status: 409 }
      );
    }

    // Verificar se o CNPJ já está cadastrado como clínica
    const clinicaExiste = await query(
      `SELECT id FROM clinicas WHERE cnpj = $1 LIMIT 1`,
      [cnpjNorm]
    );
    if (clinicaExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado como clínica no QWork' },
        { status: 409 }
      );
    }

    const requerAprovacao = calcularRequerAprovacao(
      data.valor_negociado ?? 0,
      data.percentual_comissao ?? 0,
      data.tipo_cliente
    );

    const leadResult = await query<{ id: number }>(
      `INSERT INTO public.leads_representante
         (representante_id, vendedor_id, contato_nome, contato_email,
          contato_telefone, cnpj, valor_negociado, percentual_comissao,
          observacoes, tipo_cliente, requer_aprovacao_comercial,
          status, criado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pendente',NOW())
       RETURNING id`,
      [
        representanteId,
        vendedorId,
        data.contato_nome,
        data.contato_email ?? null,
        data.contato_telefone ?? null,
        cnpjNorm,
        data.valor_negociado ?? null,
        data.percentual_comissao ?? null,
        data.observacoes ?? null,
        data.tipo_cliente,
        requerAprovacao,
      ]
    );

    console.info('[POST /api/vendedor/leads] lead_criado', {
      lead_id: leadResult.rows[0].id,
      vendedor_id: vendedorId,
      representante_id: representanteId,
    });

    return NextResponse.json(
      {
        id: leadResult.rows[0].id,
        message: requerAprovacao
          ? 'Lead cadastrado! Aguardando aprovação do Comercial.'
          : 'Lead cadastrado com sucesso.',
        requer_aprovacao_comercial: requerAprovacao,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[POST /api/vendedor/leads]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
