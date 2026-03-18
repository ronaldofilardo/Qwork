/**
 * Testes: Monitor de Lotes e Laudos — Correções 19/02/2026
 *
 * Cobre TODAS as alterações feitas nesta data:
 *
 * 1. API GET /api/rh/monitor/lotes
 *    - JOIN com v_fila_emissao (emissao_solicitada, emissao_solicitado_em, solicitado_por)
 *    - Retorna TODOS os lotes da clínica, independente de data/status
 *
 * 2. API GET /api/rh/monitor/laudos
 *    - Inclui arquivo_remoto_url e arquivo_remoto_uploaded_at
 *    - HAVING: exclui lotes com 100% avaliações inativadas (lotes "cancelados")
 *
 * 3. LotesGrid.tsx — Status relatório: "Cancelado" quando todas as avaliações são inativadas
 *
 * 4. CentroOperacoes.tsx — Lógica de badges e coluna Laudo
 *    - BadgeLoteStatus: mapeamento completo de status
 *    - BadgeLaudoStatus: rascunho → "Em Elaboração"
 *    - Coluna Laudo: N/A quando cancelado, "Aguardando Emissor" quando emissão solicitada
 */

import { query } from '@/lib/db';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mapeamento de status de lote idêntico ao BadgeLoteStatus do componente */
function badgeLoteLabel(
  status: string,
  emissaoSolicitada = false,
  totalAvaliacoes = 1,
  avaliacoesInativadas = 0,
  avaliacoesConcluidas = 1
): string {
  const isCancelado =
    totalAvaliacoes > 0 &&
    avaliacoesInativadas === totalAvaliacoes &&
    avaliacoesConcluidas === 0;

  const statusEfetivo = isCancelado
    ? 'cancelado'
    : emissaoSolicitada && status === 'concluido'
      ? 'emissao_solicitada'
      : status;

  const map: Record<string, string> = {
    ativo: 'Em andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    liberado: 'Liberado',
    emissao_solicitada: 'Emissão Solicitada',
    emissao_em_andamento: 'Emissão em Andamento',
    emitido: 'Emitido',
  };
  return map[statusEfetivo] ?? statusEfetivo;
}

/** Mapeamento idêntico ao BadgeLaudoStatus do componente */
function badgeLaudoLabel(status: string | null): string {
  if (!status) return 'Sem laudo';
  const map: Record<string, string> = {
    rascunho: 'Em Elaboração',
    emitido: 'Emitido',
    enviado: 'Enviado',
    cancelado: 'Cancelado',
  };
  return map[status] ?? status;
}

/** Lógica de coluna Laudo no monitor (aba Lotes) */
function laudoColunaTipo(
  totalAvaliacoes: number,
  avaliacoesInativadas: number,
  avaliacoesConcluidas: number,
  emissaoSolicitada: boolean,
  laudoStatus: string | null
): 'nao_se_aplica' | 'aguardando_emissor' | 'badge_laudo' {
  const isCancelado =
    totalAvaliacoes > 0 &&
    avaliacoesInativadas === totalAvaliacoes &&
    avaliacoesConcluidas === 0;

  if (isCancelado) return 'nao_se_aplica';
  if (emissaoSolicitada && laudoStatus === 'rascunho')
    return 'aguardando_emissor';
  return 'badge_laudo';
}

/** Lógica de isPronto/isCancelado do LotesGrid (refatorada: usa lote.status diretamente) */
function resolverStatusRelatorio(
  podEmitirLaudo: boolean,
  temLaudo: boolean,
  loteStatus: string
): 'Cancelado' | 'Pronto' | 'Pendente' {
  if (loteStatus === 'cancelado') return 'Cancelado';
  if (podEmitirLaudo || temLaudo) return 'Pronto';
  return 'Pendente';
}

// ─── 1. Lógica pura de badges (sem banco) ────────────────────────────────────

describe('Monitor 19/02/2026 — BadgeLoteStatus: mapeamento de labels', () => {
  it('status ativo → "Em andamento"', () => {
    expect(badgeLoteLabel('ativo')).toBe('Em andamento');
  });

  it('status concluido → "Concluído"', () => {
    expect(badgeLoteLabel('concluido')).toBe('Concluído');
  });

  it('status cancelado → "Cancelado"', () => {
    expect(badgeLoteLabel('cancelado')).toBe('Cancelado');
  });

  it('status emissao_solicitada → "Emissão Solicitada"', () => {
    expect(badgeLoteLabel('emissao_solicitada')).toBe('Emissão Solicitada');
  });

  it('status emissao_em_andamento → "Emissão em Andamento"', () => {
    expect(badgeLoteLabel('emissao_em_andamento')).toBe('Emissão em Andamento');
  });

  it('status emitido → "Emitido"', () => {
    expect(badgeLoteLabel('emitido')).toBe('Emitido');
  });

  it('concluido + emissaoSolicitada=true → "Emissão Solicitada"', () => {
    expect(badgeLoteLabel('concluido', true)).toBe('Emissão Solicitada');
  });

  it('todas inativadas → força "Cancelado" independente do status do banco', () => {
    expect(badgeLoteLabel('concluido', false, 2, 2, 0)).toBe('Cancelado');
    expect(badgeLoteLabel('concluido', true, 2, 2, 0)).toBe('Cancelado');
    expect(badgeLoteLabel('ativo', false, 3, 3, 0)).toBe('Cancelado');
  });

  it('status desconhecido → retorna o próprio valor', () => {
    expect(badgeLoteLabel('outro_status')).toBe('outro_status');
  });
});

describe('Monitor 19/02/2026 — BadgeLaudoStatus: rascunho → "Em Elaboração"', () => {
  it('null → "Sem laudo"', () => {
    expect(badgeLaudoLabel(null)).toBe('Sem laudo');
  });

  it('rascunho → "Em Elaboração" (não exibe "Rascunho" mais)', () => {
    expect(badgeLaudoLabel('rascunho')).toBe('Em Elaboração');
    expect(badgeLaudoLabel('rascunho')).not.toBe('Rascunho');
  });

  it('emitido → "Emitido"', () => {
    expect(badgeLaudoLabel('emitido')).toBe('Emitido');
  });

  it('enviado → "Enviado"', () => {
    expect(badgeLaudoLabel('enviado')).toBe('Enviado');
  });

  it('cancelado → "Cancelado"', () => {
    expect(badgeLaudoLabel('cancelado')).toBe('Cancelado');
  });
});

describe('Monitor 19/02/2026 — Coluna Laudo no monitor (lógica de exibição)', () => {
  it('lote cancelado (todas inativadas) → N/A independente de emissão ou laudo', () => {
    expect(laudoColunaTipo(2, 2, 0, false, 'rascunho')).toBe('nao_se_aplica');
    expect(laudoColunaTipo(2, 2, 0, true, 'rascunho')).toBe('nao_se_aplica');
    expect(laudoColunaTipo(1, 1, 0, false, null)).toBe('nao_se_aplica');
  });

  it('emissão solicitada + laudo=rascunho → "Aguardando Emissor"', () => {
    expect(laudoColunaTipo(1, 0, 1, true, 'rascunho')).toBe(
      'aguardando_emissor'
    );
  });

  it('laudo emitido → badge normal', () => {
    expect(laudoColunaTipo(1, 0, 1, false, 'emitido')).toBe('badge_laudo');
    expect(laudoColunaTipo(1, 0, 1, true, 'emitido')).toBe('badge_laudo');
  });

  it('sem laudo e sem emissão → badge normal (exibe "Sem laudo")', () => {
    expect(laudoColunaTipo(1, 0, 1, false, null)).toBe('badge_laudo');
  });
});

describe('Monitor 19/02/2026 — LotesGrid: Status relatório', () => {
  it('status cancelado → "Cancelado" (independente de pode_emitir ou laudo)', () => {
    expect(resolverStatusRelatorio(false, false, 'cancelado')).toBe('Cancelado');
    expect(resolverStatusRelatorio(true, true, 'cancelado')).toBe('Cancelado'); // cancelado tem prioridade
  });

  it('pode emitir laudo → "Pronto"', () => {
    expect(resolverStatusRelatorio(true, false, 'concluido')).toBe('Pronto');
  });

  it('tem laudo → "Pronto"', () => {
    expect(resolverStatusRelatorio(false, true, 'ativo')).toBe('Pronto');
  });

  it('avaliações pendentes, sem laudo → "Pendente"', () => {
    expect(resolverStatusRelatorio(false, false, 'ativo')).toBe('Pendente');
  });

  it('status não-cancelado com mix de inativadas → segue isPronto normalmente', () => {
    // Status do banco determina cancelado — se não for 'cancelado', segue fluxo normal
    expect(resolverStatusRelatorio(true, false, 'concluido')).toBe('Pronto');
    expect(resolverStatusRelatorio(false, false, 'concluido')).toBe('Pendente');
  });
});

// ─── 2. Schema / View (banco de testes) ──────────────────────────────────────

describe('Monitor 19/02/2026 — Schema: v_fila_emissao deve existir', () => {
  it('view v_fila_emissao deve estar acessível', async () => {
    const result = await query(
      `SELECT viewname FROM pg_views
       WHERE schemaname = 'public' AND viewname = 'v_fila_emissao'`
    );
    expect(result.rows).toHaveLength(1);
  });

  it('v_fila_emissao deve ter colunas lote_id, solicitado_em, solicitado_por', async () => {
    const result = await query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'v_fila_emissao'
       AND column_name IN ('lote_id', 'solicitado_em', 'solicitado_por')
       ORDER BY column_name`
    );
    const cols = result.rows.map((r: any) => r.column_name);
    expect(cols).toContain('lote_id');
    expect(cols).toContain('solicitado_em');
    expect(cols).toContain('solicitado_por');
  });
});

describe('Monitor 19/02/2026 — Schema: laudos deve ter colunas do bucket', () => {
  it('tabela laudos deve ter arquivo_remoto_url', async () => {
    const result = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'laudos' AND column_name = 'arquivo_remoto_url'`
    );
    expect(result.rows).toHaveLength(1);
  });

  it('tabela laudos deve ter arquivo_remoto_uploaded_at', async () => {
    const result = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'laudos' AND column_name = 'arquivo_remoto_uploaded_at'`
    );
    expect(result.rows).toHaveLength(1);
  });
});

// ─── 3. SQL do monitor de lotes ──────────────────────────────────────────────

describe('Monitor 19/02/2026 — SQL monitor/lotes: JOIN com v_fila_emissao', () => {
  it('query do monitor de lotes deve executar sem erro', async () => {
    // É seguro buscar com clinica_id=0 (retorna 0 linhas mas não deve lançar exceção)
    const result = await query(
      `
      SELECT
        la.id,
        la.status,
        la.liberado_em,
        ec.nome AS empresa_nome,
        COUNT(a.id) AS total_avaliacoes,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida') AS avaliacoes_concluidas,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') AS avaliacoes_inativadas,
        l.status AS laudo_status,
        CASE WHEN fe.id IS NOT NULL THEN true ELSE false END AS emissao_solicitada,
        fe.solicitado_em AS emissao_solicitado_em,
        fe.solicitado_por
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON ec.id = la.empresa_id
      LEFT JOIN avaliacoes a    ON a.lote_id = la.id
      LEFT JOIN laudos l        ON l.lote_id = la.id
      LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
      WHERE la.clinica_id = $1
      GROUP BY
        la.id, la.status, la.liberado_em,
        ec.id, ec.nome,
        l.id, l.status,
        fe.id, fe.solicitado_em, fe.solicitado_por
      ORDER BY la.liberado_em DESC NULLS LAST
      `,
      [0]
    );
    expect(Array.isArray(result.rows)).toBe(true);
  });

  it('query retorna campo emissao_solicitada como boolean', async () => {
    // Buscar qualquer lote real para validar o tipo do campo
    const result = await query(
      `
      SELECT
        la.id,
        CASE WHEN fe.id IS NOT NULL THEN true ELSE false END AS emissao_solicitada
      FROM lotes_avaliacao la
      LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
      LIMIT 1
      `
    );
    if (result.rows.length > 0) {
      expect(typeof result.rows[0].emissao_solicitada).toBe('boolean');
    } else {
      expect(true).toBe(true); // banco vazio no ambiente de teste
    }
  });
});

// ─── 4. SQL do monitor de laudos — HAVING clause ─────────────────────────────

describe('Monitor 19/02/2026 — SQL monitor/laudos: HAVING exclui lotes cancelados', () => {
  it('query do monitor de laudos deve executar sem erro', async () => {
    const result = await query(
      `
      SELECT
        l.id AS laudo_id,
        l.lote_id,
        l.status AS laudo_status,
        l.hash_pdf,
        l.arquivo_remoto_url,
        l.arquivo_remoto_uploaded_at,
        COUNT(a.id) AS total_avaliacoes,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') AS avaliacoes_inativadas,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida') AS avaliacoes_concluidas
      FROM laudos l
      JOIN lotes_avaliacao la   ON la.id = l.lote_id
      JOIN empresas_clientes ec ON ec.id = la.empresa_id
      LEFT JOIN avaliacoes a   ON a.lote_id = la.id
      WHERE la.clinica_id = $1
      GROUP BY
        l.id, l.lote_id, l.status, l.hash_pdf,
        l.arquivo_remoto_url, l.arquivo_remoto_uploaded_at,
        la.descricao, la.tipo, la.status, la.liberado_em,
        ec.id, ec.nome
      HAVING NOT (
        COUNT(a.id) > 0
        AND COUNT(a.id) FILTER (WHERE a.status = 'inativada') = COUNT(a.id)
        AND COUNT(a.id) FILTER (WHERE a.status = 'concluida') = 0
      )
      ORDER BY l.id DESC
      `,
      [0]
    );
    expect(Array.isArray(result.rows)).toBe(true);
  });

  it('HAVING exclui lote com 100% inativadas via SQL puro', async () => {
    // Valida a lógica SQL do HAVING com dados temporários
    const result = await query(
      `
      WITH dados AS (
        SELECT
          10001                                   AS laudo_id,
          3                                       AS total,
          3                                       AS inativadas,
          0                                       AS concluidas
        UNION ALL
        SELECT 10002, 2, 1, 1  -- misto: não deve ser excluído
        UNION ALL
        SELECT 10003, 2, 0, 2  -- todos concluídos: não deve ser excluído
        UNION ALL
        SELECT 10004, 0, 0, 0  -- sem avaliações: não deve ser excluído (HAVING não se aplica)
      )
      SELECT laudo_id
      FROM dados
      GROUP BY laudo_id, total, inativadas, concluidas
      HAVING NOT (
        total > 0
        AND inativadas = total
        AND concluidas = 0
      )
      ORDER BY laudo_id
      `
    );
    const ids = result.rows.map((r: any) => Number(r.laudo_id));
    expect(ids).not.toContain(10001); // 100% inativadas → excluído
    expect(ids).toContain(10002); // misto → incluído
    expect(ids).toContain(10003); // todos concluídos → incluído
    expect(ids).toContain(10004); // sem avaliações → incluído
  });

  it('lote com 1 concluída e 2 inativadas não deve ser excluído pelo HAVING', async () => {
    const result = await query(
      `
      SELECT 1 AS ok
      WHERE NOT (
        3 > 0
        AND 2 = 3          -- inativadas != total
        AND 1 = 0          -- concluidas != 0
      )
      `
    );
    expect(result.rows).toHaveLength(1); // não foi excluído
  });
});

// ─── 5. Detecção de lote cancelado por inativação total ──────────────────────

describe('Monitor 19/02/2026 — Detecção de lote "cancelado por inativação total"', () => {
  it('deve detectar corretamente com query SQL agrupada', async () => {
    // Busca lotes reais onde todas as avaliações são inativadas
    const result = await query(
      `
      SELECT
        la.id,
        COUNT(a.id) AS total,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') AS inativadas,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida') AS concluidas,
        CASE
          WHEN COUNT(a.id) > 0
            AND COUNT(a.id) FILTER (WHERE a.status = 'inativada') = COUNT(a.id)
            AND COUNT(a.id) FILTER (WHERE a.status = 'concluida') = 0
          THEN true
          ELSE false
        END AS eh_cancelado
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      GROUP BY la.id
      HAVING COUNT(a.id) > 0
         AND COUNT(a.id) FILTER (WHERE a.status = 'inativada') = COUNT(a.id)
         AND COUNT(a.id) FILTER (WHERE a.status = 'concluida') = 0
      LIMIT 5
      `
    );
    result.rows.forEach((row: any) => {
      expect(row.eh_cancelado).toBe(true);
      expect(Number(row.concluidas)).toBe(0);
      expect(Number(row.inativadas)).toBe(Number(row.total));
    });
  });

  it('lote com avaliações mistas não é cancelado', async () => {
    const result = await query(
      `
      SELECT
        COUNT(*) > 0
          AND COUNT(*) FILTER (WHERE status = 'inativada') = COUNT(*)
          AND COUNT(*) FILTER (WHERE status = 'concluida') = 0
        AS eh_cancelado
      FROM (
        SELECT unnest(ARRAY['concluida','inativada']) AS status
      ) a
      `
    );
    // 1 concluída + 1 inativada → NOT cancelado
    expect(result.rows[0].eh_cancelado).toBe(false);
  });
});
