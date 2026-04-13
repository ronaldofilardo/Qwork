/**
 * GET  /api/representante/minhas-vendas/leads  — lista leads diretos do representante (vendedor_id IS NULL)
 * POST /api/representante/minhas-vendas/leads  — cria novo lead direto (sem vendedor intermediário)
 *
 * "Minhas Vendas": representante atuando como vendedor direto.
 * A diferenciação de leads próprios vs. leads de equipe é feita por vendedor_id IS NULL.
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
import { calcularRequerAprovacao, calcularComissaoCustoFixo, CUSTO_POR_AVALIACAO, TIPOS_CLIENTE } from '@/lib/leads-config';
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

    // Apenas leads DIRETOS — sem vendedor intermediário
    const wheres = [`l.representante_id = $1`, `l.vendedor_id IS NULL`];
    const params: unknown[] = [sess.representante_id];
    let i = 2;

    if (
      status &&
      [
        'pendente',
        'em_analise',
        'aprovado',
        'convertido',
        'expirado',
        'rejeitado',
      ].includes(status)
    ) {
      wheres.push(`l.status = $${i++}`);
      params.push(status);
    } else {
      // Por padrão, exclui convertidos (aparecem em Vínculos)
      wheres.push(`l.status != 'convertido'`);
    }

    const where = `WHERE ${wheres.join(' AND ')}`;

    const [countResult, statsResult] = await Promise.all([
      query<{ total: string }>(
        `SELECT COUNT(*) as total FROM leads_representante l ${where}`,
        params
      ),
      query(
        `SELECT status, COUNT(*)::int as count
         FROM leads_representante
         WHERE representante_id = $1 AND vendedor_id IS NULL
         GROUP BY status`,
        [sess.representante_id]
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    const contagens: Record<string, number> = {
      pendente: 0,
      em_analise: 0,
      aprovado: 0,
      convertido: 0,
      expirado: 0,
      rejeitado: 0,
    };
    for (const row of statsResult.rows) {
      contagens[row.status as string] = row.count as number;
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
    console.error('[GET /api/representante/minhas-vendas/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sess = requireRepresentante();
    const body = (await request.json()) as Record<string, unknown>;
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
      typeof tipoClienteRaw === 'string' &&
      TIPOS_CLIENTE.includes(tipoClienteRaw as TipoCliente)
        ? (tipoClienteRaw as TipoCliente)
        : 'entidade';

    const cnpjLimpo = normalizeCNPJ(typeof cnpj === 'string' ? cnpj : '');
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

    // Busca os percentuais de comissão cadastrados do representante
    const repResult = await query<{
      percentual_comissao: string | null;
      percentual_comissao_comercial: string | null;
      modelo_comissionamento: string | null;
      valor_custo_fixo_entidade: string | null;
      valor_custo_fixo_clinica: string | null;
    }>(
      `SELECT percentual_comissao, percentual_comissao_comercial,
              modelo_comissionamento, valor_custo_fixo_entidade, valor_custo_fixo_clinica
       FROM representantes WHERE id = $1`,
      [sess.representante_id]
    );
    const comissaoNum = Number(repResult.rows[0]?.percentual_comissao ?? 0);
    const percComercial = Number(
      repResult.rows[0]?.percentual_comissao_comercial ?? 0
    );
    const modeloComissionamento = repResult.rows[0]?.modelo_comissionamento ?? null;

    if (
      typeof contato_email === 'string' &&
      contato_email &&
      !validarEmail(contato_email)
    ) {
      return NextResponse.json(
        { error: 'E-mail do contato inválido.' },
        { status: 400 }
      );
    }

    if (
      typeof contato_telefone === 'string' &&
      contato_telefone &&
      !validarTelefone(contato_telefone)
    ) {
      return NextResponse.json(
        {
          error: 'Telefone do contato inválido. Use o formato (11) 91234-5678.',
        },
        { status: 400 }
      );
    }

    // Verificar duplicatas de lead ativo para o mesmo CNPJ
    const existente = await query(
      `SELECT id, representante_id, status FROM leads_representante
       WHERE cnpj = $1 AND status = 'pendente' LIMIT 1`,
      [cnpjLimpo]
    );

    if (existente.rows.length > 0) {
      const lead = existente.rows[0] as { representante_id: number };
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

    // Verificar se CNPJ já está cadastrado como entidade ou clínica
    const [entidadeExiste, clinicaExiste] = await Promise.all([
      query(`SELECT id FROM entidades WHERE cnpj = $1 LIMIT 1`, [cnpjLimpo]),
      query(`SELECT id FROM clinicas WHERE cnpj = $1 LIMIT 1`, [cnpjLimpo]),
    ]);

    if (entidadeExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado como cliente no QWork' },
        { status: 409 }
      );
    }
    if (clinicaExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado como clínica no QWork' },
        { status: 409 }
      );
    }

    // ── Lógica de custo_fixo ──────────────────────────────────────────────
    let requerAprovacao = false;
    let valorCustoFixoSnapshot: number | null = null;

    if (modeloComissionamento === 'custo_fixo') {
      const custoFixoRaw =
        tipoCliente === 'entidade'
          ? repResult.rows[0]?.valor_custo_fixo_entidade
          : repResult.rows[0]?.valor_custo_fixo_clinica;
      const valorCustoFixo = custoFixoRaw != null ? Number(custoFixoRaw) : CUSTO_POR_AVALIACAO[tipoCliente];
      const calc = calcularComissaoCustoFixo(valorNum, valorCustoFixo);
      if (calc.abaixoMinimo) {
        return NextResponse.json(
          {
            error: `Valor negociado (R$ ${valorNum.toFixed(2)}) inferior ao custo fixo QWork (R$ ${valorCustoFixo.toFixed(2)}) para ${tipoCliente}.`,
          },
          { status: 400 }
        );
      }
      requerAprovacao = false;
      valorCustoFixoSnapshot = valorCustoFixo;
    } else {
      requerAprovacao = calcularRequerAprovacao(
        valorNum,
        comissaoNum,
        percComercial,
        tipoCliente
      );
    }

    // Lead direto: vendedor_id = NULL, origem implícita via representante_id
    const result = await query(
      `INSERT INTO leads_representante
         (representante_id, vendedor_id, cnpj, razao_social, contato_nome, contato_email,
          contato_telefone, valor_negociado, percentual_comissao,
          percentual_comissao_representante, percentual_comissao_comercial,
          tipo_cliente, requer_aprovacao_comercial, num_vidas_estimado, valor_custo_fixo_snapshot)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        sess.representante_id,
        cnpjLimpo,
        typeof razao_social === 'string' ? razao_social : null,
        typeof contato_nome === 'string' ? contato_nome : null,
        typeof contato_email === 'string' ? contato_email : null,
        typeof contato_telefone === 'string' ? contato_telefone : null,
        valorNum,
        comissaoNum,
        comissaoNum, // percentual_comissao_representante
        percComercial,
        tipoCliente,
        requerAprovacao,
        numVidas,
        valorCustoFixoSnapshot,
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
    console.error('[POST /api/representante/minhas-vendas/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
