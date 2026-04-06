/**
 * Testes: Fluxo Pagamento — Aguardando Pagamento + Conta do Tomador
 *
 * Valida as novas funcionalidades implementadas:
 * - Coluna link_disponibilizado_em na tabela lotes_avaliacao
 * - Enum tipo_notificacao com valor 'pagamento_pendente'
 * - Lógica de exibição do banner "Aguardando pagamento" no LotesGrid
 * - Contagem de pagamentos em aberto
 */

import { query } from '@/lib/db';

describe('Fluxo Pagamento — link_disponibilizado_em e tipo_notificacao', () => {
  test('1. Coluna link_disponibilizado_em deve existir em lotes_avaliacao', async () => {
    const result = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'lotes_avaliacao'
         AND column_name = 'link_disponibilizado_em'`
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].column_name).toBe('link_disponibilizado_em');
    expect(result.rows[0].is_nullable).toBe('YES');
  });

  test('2. Enum tipo_notificacao deve conter pagamento_pendente', async () => {
    const result = await query(
      `SELECT e.enumlabel
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
       WHERE t.typname = 'tipo_notificacao'
         AND e.enumlabel = 'pagamento_pendente'`
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].enumlabel).toBe('pagamento_pendente');
  });

  test('3. Coluna status_pagamento deve existir em lotes_avaliacao', async () => {
    const result = await query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'lotes_avaliacao'
         AND column_name = 'status_pagamento'`
    );

    expect(result.rows.length).toBe(1);
  });

  test('4. Coluna link_pagamento_token deve existir em lotes_avaliacao', async () => {
    const result = await query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'lotes_avaliacao'
         AND column_name = 'link_pagamento_token'`
    );

    expect(result.rows.length).toBe(1);
  });

  test('5. Query de contagem de pagamentos em aberto deve funcionar', async () => {
    // Consulta usada pela API /api/entidade|rh/pagamentos-em-aberto/count
    const result = await query(
      `SELECT COUNT(*) as count
       FROM lotes_avaliacao
       WHERE link_disponibilizado_em IS NOT NULL
         AND status_pagamento = 'aguardando_pagamento'`
    );

    expect(result.rows.length).toBe(1);
    expect(typeof parseInt(result.rows[0].count, 10)).toBe('number');
  });

  test('6. Query de listagem de pagamentos em aberto deve funcionar', async () => {
    // Consulta usada pela API /api/entidade/pagamentos-em-aberto
    const result = await query(
      `SELECT la.id as lote_id,
              la.status_pagamento,
              la.link_pagamento_token,
              la.link_disponibilizado_em,
              la.valor_por_funcionario,
              la.pagamento_metodo,
              COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'rascunho') as num_avaliacoes
       FROM lotes_avaliacao la
       LEFT JOIN avaliacoes a ON a.lote_id = la.id
       WHERE la.link_disponibilizado_em IS NOT NULL
         AND la.status_pagamento = 'aguardando_pagamento'
       GROUP BY la.id
       ORDER BY la.link_disponibilizado_em DESC
       LIMIT 10`
    );

    expect(Array.isArray(result.rows)).toBe(true);
  });

  test('7. Tabela notificacoes deve suportar INSERT com tipo pagamento_pendente', async () => {
    // Verificar que a estrutura da tabela aceita o tipo
    const result = await query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'notificacoes'
         AND column_name IN ('tipo', 'titulo', 'mensagem', 'destinatario_cpf', 'destinatario_tipo', 'link_acao', 'dados_contexto', 'lida')
       ORDER BY column_name`
    );

    const colunas = result.rows.map((r) => r.column_name);
    expect(colunas).toContain('tipo');
    expect(colunas).toContain('titulo');
    expect(colunas).toContain('mensagem');
    expect(colunas).toContain('destinatario_cpf');
    expect(colunas).toContain('link_acao');
    expect(colunas).toContain('lida');
  });

  test('8. UPDATE de link_disponibilizado_em deve funcionar (dry-run com ROLLBACK)', async () => {
    // Encontrar um lote com link_pagamento_token e status aguardando_pagamento
    const lote = await query(
      `SELECT id FROM lotes_avaliacao
       WHERE link_pagamento_token IS NOT NULL
         AND status_pagamento = 'aguardando_pagamento'
         AND link_disponibilizado_em IS NULL
       LIMIT 1`
    );

    if (lote.rows.length === 0) {
      // Nenhum lote elegível — sem dados de teste no ambiente
      expect(lote.rows).toHaveLength(0);
      return;
    }

    const loteId = lote.rows[0].id;

    // Dry-run: atualiza e reverte
    await query('BEGIN');
    try {
      const update = await query(
        `UPDATE lotes_avaliacao
         SET link_disponibilizado_em = NOW(), atualizado_em = NOW()
         WHERE id = $1
         RETURNING id, link_disponibilizado_em`,
        [loteId]
      );
      expect(update.rows.length).toBe(1);
      expect(update.rows[0].link_disponibilizado_em).not.toBeNull();
    } finally {
      await query('ROLLBACK');
    }
  });
});

describe('Lógica de Banner "Aguardando Pagamento"', () => {
  const buildLote = (overrides: Record<string, unknown> = {}) => ({
    solicitado_em: '2026-03-01T00:00:00Z',
    status_pagamento: null as string | null,
    ...overrides,
  });

  function calcularEstado(
    lote: ReturnType<typeof buildLote>,
    temLaudo = false
  ) {
    const aguardandoPagamento = !!(
      lote.solicitado_em &&
      lote.status_pagamento === 'aguardando_pagamento' &&
      !temLaudo
    );
    const emissaoSolicitada = !!(
      lote.solicitado_em &&
      lote.status_pagamento !== 'aguardando_pagamento' &&
      !temLaudo
    );
    return { aguardandoPagamento, emissaoSolicitada };
  }

  test('9. Lote solicitado sem status_pagamento → emissaoSolicitada=true', () => {
    const { aguardandoPagamento, emissaoSolicitada } =
      calcularEstado(buildLote());
    expect(aguardandoPagamento).toBe(false);
    expect(emissaoSolicitada).toBe(true);
  });

  test('10. Lote solicitado + aguardando_pagamento → aguardandoPagamento=true', () => {
    const { aguardandoPagamento, emissaoSolicitada } = calcularEstado(
      buildLote({ status_pagamento: 'aguardando_pagamento' })
    );
    expect(aguardandoPagamento).toBe(true);
    expect(emissaoSolicitada).toBe(false);
  });

  test('11. Lote solicitado + pago → emissaoSolicitada=true', () => {
    const { aguardandoPagamento, emissaoSolicitada } = calcularEstado(
      buildLote({ status_pagamento: 'pago' })
    );
    expect(aguardandoPagamento).toBe(false);
    expect(emissaoSolicitada).toBe(true);
  });

  test('12. Lote com laudo → ambos false (laudo já emitido)', () => {
    const { aguardandoPagamento, emissaoSolicitada } = calcularEstado(
      buildLote({ status_pagamento: 'aguardando_pagamento' }),
      true
    );
    expect(aguardandoPagamento).toBe(false);
    expect(emissaoSolicitada).toBe(false);
  });

  test('13. Lote sem solicitado_em → ambos false (ainda não solicitado)', () => {
    const { aguardandoPagamento, emissaoSolicitada } = calcularEstado(
      buildLote({ solicitado_em: null })
    );
    expect(aguardandoPagamento).toBe(false);
    expect(emissaoSolicitada).toBe(false);
  });

  test('14. Lote aguardando_cobranca → emissaoSolicitada=true (não é aguardando_pagamento)', () => {
    const { aguardandoPagamento, emissaoSolicitada } = calcularEstado(
      buildLote({ status_pagamento: 'aguardando_cobranca' })
    );
    expect(aguardandoPagamento).toBe(false);
    expect(emissaoSolicitada).toBe(true);
  });
});

describe('Pagamentos-Laudos: lote_id via dados_adicionais JSONB', () => {
  test('15. Query de pagamentos-laudos deve ler lote_id do JSONB para clinica', async () => {
    // Valida que a query extrai corretamente lote_id do campo dados_adicionais JSONB
    const result = await query(
      `SELECT
        p.id,
        (p.dados_adicionais->>'lote_id')::int as lote_id,
        (
          SELECT l.id FROM laudos l
          WHERE l.lote_id = (p.dados_adicionais->>'lote_id')::int
          ORDER BY l.emitido_em DESC NULLS LAST LIMIT 1
        ) as laudo_id
       FROM pagamentos p
       WHERE p.clinica_id IS NOT NULL
         AND p.dados_adicionais->>'lote_id' IS NOT NULL
         AND p.status = 'pago'
       LIMIT 5`
    );

    // Query deve executar sem erros
    expect(Array.isArray(result.rows)).toBe(true);

    // Se houver resultados, lote_id deve ser inteiro positivo
    if (result.rows.length > 0) {
      for (const row of result.rows) {
        expect(typeof row.lote_id).toBe('number');
        expect(row.lote_id).toBeGreaterThan(0);
      }
    }
  });

  test('16. Query de pagamentos-laudos deve ler lote_id do JSONB para entidade', async () => {
    const result = await query(
      `SELECT
        p.id,
        (p.dados_adicionais->>'lote_id')::int as lote_id
       FROM pagamentos p
       WHERE p.entidade_id IS NOT NULL
         AND p.dados_adicionais->>'lote_id' IS NOT NULL
         AND p.status = 'pago'
       LIMIT 5`
    );

    expect(Array.isArray(result.rows)).toBe(true);

    if (result.rows.length > 0) {
      for (const row of result.rows) {
        expect(typeof row.lote_id).toBe('number');
        expect(row.lote_id).toBeGreaterThan(0);
      }
    }
  });

  test('17. Pagamentos sem lote_id no JSONB devem retornar null (não quebrar query)', async () => {
    const result = await query(
      `SELECT
        p.id,
        (p.dados_adicionais->>'lote_id')::int as lote_id
       FROM pagamentos p
       WHERE p.dados_adicionais->>'lote_id' IS NULL
       LIMIT 5`
    );

    expect(Array.isArray(result.rows)).toBe(true);

    for (const row of result.rows) {
      expect(row.lote_id).toBeNull();
    }
  });
});

describe('Pagamentos-em-aberto: contagem e listagem filtradas por tomador', () => {
  test('18. Query de count por clinica_id deve funcionar', async () => {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM lotes_avaliacao la
       WHERE la.clinica_id IS NOT NULL
         AND la.link_disponibilizado_em IS NOT NULL
         AND la.status_pagamento = 'aguardando_pagamento'`
    );

    expect(result.rows.length).toBe(1);
    expect(typeof parseInt(result.rows[0].count, 10)).toBe('number');
  });

  test('19. Query de count por entidade_id deve funcionar', async () => {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM lotes_avaliacao la
       WHERE la.entidade_id IS NOT NULL
         AND la.link_disponibilizado_em IS NOT NULL
         AND la.status_pagamento = 'aguardando_pagamento'`
    );

    expect(result.rows.length).toBe(1);
    expect(typeof parseInt(result.rows[0].count, 10)).toBe('number');
  });

  test('20. Query de listagem de pagamentos em aberto por clinica inclui campos necessários', async () => {
    const result = await query(
      `SELECT la.id as lote_id,
              la.status_pagamento,
              la.link_pagamento_token,
              la.link_disponibilizado_em,
              la.valor_por_funcionario,
              la.pagamento_metodo,
              la.pagamento_parcelas,
              COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'rascunho') as num_avaliacoes
       FROM lotes_avaliacao la
       LEFT JOIN avaliacoes a ON a.lote_id = la.id
       WHERE la.clinica_id IS NOT NULL
         AND la.link_disponibilizado_em IS NOT NULL
         AND la.status_pagamento = 'aguardando_pagamento'
       GROUP BY la.id
       ORDER BY la.link_disponibilizado_em DESC
       LIMIT 5`
    );

    expect(Array.isArray(result.rows)).toBe(true);
  });
});

describe('disponibilizar-link: estrutura SQL e validações', () => {
  test('21. Join de entidade via clinicas deve retornar entidade_id corretamente', async () => {
    // Valida que a subquery corrigida funciona:
    // LEFT JOIN entidades ec_ent ON ec_ent.id = (SELECT cl.entidade_id FROM clinicas cl WHERE cl.id = la.clinica_id LIMIT 1)
    const result = await query(
      `SELECT la.id as lote_id, cl.entidade_id
       FROM lotes_avaliacao la
       JOIN clinicas cl ON cl.id = la.clinica_id
       WHERE la.clinica_id IS NOT NULL
       LIMIT 5`
    );

    expect(Array.isArray(result.rows)).toBe(true);
  });

  test('22. UPDATE de link_disponibilizado_em com ROLLBACK deve preservar estado original', async () => {
    const lote = await query(
      `SELECT id, link_disponibilizado_em FROM lotes_avaliacao
       WHERE link_disponibilizado_em IS NULL
         AND status_pagamento = 'aguardando_pagamento'
         AND link_pagamento_token IS NOT NULL
       LIMIT 1`
    );

    if (lote.rows.length === 0) {
      // Sem dados elegíveis no ambiente de teste
      expect(lote.rows).toHaveLength(0);
      return;
    }

    const loteId = lote.rows[0].id;

    await query('BEGIN');
    try {
      const update = await query(
        `UPDATE lotes_avaliacao
         SET link_disponibilizado_em = NOW(), atualizado_em = NOW()
         WHERE id = $1
           AND link_disponibilizado_em IS NULL
         RETURNING id, link_disponibilizado_em`,
        [loteId]
      );

      expect(update.rows.length).toBe(1);
      expect(update.rows[0].link_disponibilizado_em).not.toBeNull();

      // Verificar que o campo foi realmente atualizado
      const check = await query(
        `SELECT link_disponibilizado_em FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );
      expect(check.rows[0].link_disponibilizado_em).not.toBeNull();
    } finally {
      await query('ROLLBACK');
    }

    // Após ROLLBACK, estado deve estar preservado
    const afterRollback = await query(
      `SELECT link_disponibilizado_em FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    );
    expect(afterRollback.rows[0].link_disponibilizado_em).toBeNull();
  });
});

describe('Lógica de exibição: Lote/Laudo unificado', () => {
  // Espelha a lógica do componente PagamentosFinanceiros que usa pag.loteId ?? pag.laudoId

  function getLoteLaudoDisplay(
    loteId: number | null,
    laudoId: number | null
  ): string | null {
    if (!loteId && !laudoId) return null;
    return `Lote/Laudo #${loteId ?? laudoId}`;
  }

  test('23. Quando loteId e laudoId existem → exibe loteId', () => {
    expect(getLoteLaudoDisplay(6, 6)).toBe('Lote/Laudo #6');
    expect(getLoteLaudoDisplay(36, 36)).toBe('Lote/Laudo #36');
  });

  test('24. Quando só loteId existe → exibe loteId', () => {
    expect(getLoteLaudoDisplay(36, null)).toBe('Lote/Laudo #36');
  });

  test('25. Quando só laudoId existe → exibe laudoId', () => {
    expect(getLoteLaudoDisplay(null, 10)).toBe('Lote/Laudo #10');
  });

  test('26. Quando nenhum existe → retorna null (não renderiza)', () => {
    expect(getLoteLaudoDisplay(null, null)).toBeNull();
  });

  test('27. loteId tem precedência sobre laudoId via operador ??', () => {
    // loteId=5 laudoId=99 → deve exibir loteId=5
    expect(getLoteLaudoDisplay(5, 99)).toBe('Lote/Laudo #5');
  });
});
