/**
 * GET  /api/representante/leads        — lista leads do representante logado
 * POST /api/representante/leads        — cria novo lead
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarEmail,
  validarTelefone,
} from '@/lib/validators';
import {
  calcularRequerAprovacao,
  calcularComissaoCustoFixo,
  valorMinimoCustoFixoTotal,
  CUSTO_POR_AVALIACAO,
  TIPOS_CLIENTE,
} from '@/lib/leads-config';
import type { TipoCliente } from '@/lib/leads-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sess = requireRepresentante();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 20;
    const offset = (page - 1) * limit;

    const wheres = [`l.representante_id = $1`];
    const params: unknown[] = [sess.representante_id];
    let i = 2;

    if (status && ['pendente', 'convertido', 'expirado'].includes(status)) {
      wheres.push(`l.status = $${i++}`);
      params.push(status);
    } else {
      // Por padrão, leads convertidos não aparecem na aba Leads (apenas em Vínculos)
      wheres.push(`l.status != 'convertido'`);
    }

    const where = `WHERE ${wheres.join(' AND ')}`;
    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM leads_representante l ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    // Contagens por status (para cards de resumo)
    const statsResult = await query(
      `SELECT status, COUNT(*)::int as count
       FROM leads_representante
       WHERE representante_id = $1
       GROUP BY status`,
      [sess.representante_id]
    );
    const contagens: Record<string, number> = {
      pendente: 0,
      convertido: 0,
      expirado: 0,
    };
    for (const row of statsResult.rows) {
      contagens[row.status] = row.count;
    }

    params.push(limit, offset);
    const rows = await query(
      `SELECT l.*,
              e.nome AS entidade_nome
       FROM leads_representante l
       LEFT JOIN entidades e ON e.id = l.entidade_id
       ${where}
       ORDER BY l.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    return NextResponse.json({
      leads: rows.rows,
      total,
      page,
      limit,
      contagens,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[GET /api/representante/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sess = requireRepresentante();
    const body = await request.json();
    const {
      cnpj,
      razao_social,
      contato_nome,
      contato_email,
      contato_telefone,
      valor_negociado,
      tipo_cliente: tipoClienteRaw,
      num_vidas_estimado: numVidasRaw,
    } = body;

    const tipoCliente: TipoCliente =
      tipoClienteRaw && TIPOS_CLIENTE.includes(tipoClienteRaw)
        ? tipoClienteRaw
        : 'entidade';

    const cnpjLimpo = normalizeCNPJ(cnpj ?? '');
    if (!cnpjLimpo || !validarCNPJ(cnpjLimpo)) {
      return NextResponse.json(
        { error: 'CNPJ inválido. Verifique os dígitos e tente novamente.' },
        { status: 400 }
      );
    }

    const valorNum = Number(valor_negociado);
    if (isNaN(valorNum) || valorNum <= 0) {
      return NextResponse.json(
        { error: 'Valor negociado é obrigatório e deve ser maior que zero.' },
        { status: 400 }
      );
    }

    const numVidas =
      typeof numVidasRaw === 'number' && numVidasRaw > 0
        ? Math.round(numVidasRaw)
        : null;
    if (!numVidas) {
      return NextResponse.json(
        {
          error:
            'Quantidade de vidas estimada é obrigatória e deve ser maior que zero.',
        },
        { status: 400 }
      );
    }

    if (contato_email && !validarEmail(contato_email)) {
      return NextResponse.json(
        { error: 'E-mail do contato inválido.' },
        { status: 400 }
      );
    }

    if (contato_telefone && !validarTelefone(contato_telefone)) {
      return NextResponse.json(
        {
          error: 'Telefone do contato inválido. Use o formato (11) 91234-5678.',
        },
        { status: 400 }
      );
    }

    // Buscar percentuais e modelo do representante
    const repResult = await query<{
      percentual_comissao: string | null;
      percentual_comissao_comercial: string | null;
      modelo_comissionamento: 'percentual' | 'custo_fixo' | null;
      valor_custo_fixo_entidade: string | null;
      valor_custo_fixo_clinica: string | null;
    }>(
      `SELECT percentual_comissao, percentual_comissao_comercial,
              modelo_comissionamento, valor_custo_fixo_entidade, valor_custo_fixo_clinica
       FROM representantes WHERE id = $1 LIMIT 1`,
      [sess.representante_id]
    );
    const percRep = Number(repResult.rows[0]?.percentual_comissao ?? 0);
    const modeloComissionamento =
      repResult.rows[0]?.modelo_comissionamento ?? null;

    // Bloquear criação de lead se modelo de comissionamento não foi definido
    if (!modeloComissionamento) {
      return NextResponse.json(
        {
          error:
            'Cadastro de leads indisponível. Aguarde a definição do modelo de comissionamento pelo Comercial.',
          code: 'COMISSIONAMENTO_NAO_DEFINIDO',
        },
        { status: 403 }
      );
    }

    const percComercial = Number(
      repResult.rows[0]?.percentual_comissao_comercial ?? 0
    );

    // ── Lógica de custo_fixo ──────────────────────────────────────────────
    let requerAprovacao = false;
    let valorCustoFixoSnapshot: number | null = null;

    if (modeloComissionamento === 'custo_fixo') {
      const custoFixoRaw =
        tipoCliente === 'entidade'
          ? repResult.rows[0]?.valor_custo_fixo_entidade
          : repResult.rows[0]?.valor_custo_fixo_clinica;
      const valorCustoFixo =
        custoFixoRaw != null
          ? Number(custoFixoRaw)
          : CUSTO_POR_AVALIACAO[tipoCliente];
      const calc = calcularComissaoCustoFixo(
        valorNum,
        valorCustoFixo,
        percComercial,
        CUSTO_POR_AVALIACAO[tipoCliente]
      );
      if (calc.abaixoMinimo) {
        return NextResponse.json(
          {
            error: `Valor negociado (R$ ${valorNum.toFixed(2)}) inferior ao mínimo para ${tipoCliente}. Valor mínimo: R$ ${valorMinimoCustoFixoTotal(tipoCliente, valorCustoFixo).toFixed(2)}.`,
          },
          { status: 400 }
        );
      }
      requerAprovacao = false;
      valorCustoFixoSnapshot = valorCustoFixo;
    } else {
      requerAprovacao = calcularRequerAprovacao(
        valorNum,
        percRep,
        percComercial,
        tipoCliente
      );
    }

    // Verificar se já existe lead ativo para esse CNPJ
    const existente = await query(
      `SELECT id, representante_id, status FROM leads_representante
       WHERE cnpj = $1 AND status = 'pendente' LIMIT 1`,
      [cnpjLimpo]
    );

    if (existente.rows.length > 0) {
      const lead = existente.rows[0];
      if (lead.representante_id === sess.representante_id) {
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
      [cnpjLimpo]
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
      [cnpjLimpo]
    );
    if (clinicaExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado como clínica no QWork' },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO leads_representante (
         representante_id, cnpj, razao_social, contato_nome, contato_email,
         contato_telefone, valor_negociado, percentual_comissao,
         percentual_comissao_representante, percentual_comissao_comercial,
         tipo_cliente, requer_aprovacao_comercial, num_vidas_estimado,
         valor_custo_fixo_snapshot, modelo_comissionamento
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        sess.representante_id,
        cnpjLimpo,
        razao_social ?? null,
        contato_nome ?? null,
        contato_email ?? null,
        contato_telefone ?? null,
        valorNum,
        percRep,
        percRep,
        percComercial,
        tipoCliente,
        requerAprovacao,
        numVidas,
        valorCustoFixoSnapshot,
        modeloComissionamento,
      ]
    );

    return NextResponse.json(
      { lead: result.rows[0], requer_aprovacao_comercial: requerAprovacao },
      { status: 201 }
    );
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Lead duplicado para este CNPJ' },
        { status: 409 }
      );
    }
    console.error('[POST /api/representante/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
