/**
 * correcoes-06-03-2026.test.ts
 *
 * Testes para as correções de 06/03/2026:
 *
 * 1. Migration 522 — corrige v_solicitacoes_emissao para incluir lotes de entidade
 *    - INNER JOIN em empresas_clientes substituído por LEFT JOIN
 *    - Adicionado LEFT JOIN em entidades para resolver nome_tomador
 *    - COALESCE(c.nome, e.nome, ent.nome) cobre os três casos
 *
 * 2. solicitar-emissao/route.ts — remoção de INSERT de notificação inválida
 *    - tipo_notificacao ENUM não contém 'solicitacao_emissao'
 *    - O INSERT causava rollback silencioso de toda a transação
 *    - Admin verifica lotes pela aba "Aguardando Cobrança", sem notificação
 *
 * 3. Validação do ENUM tipo_notificacao (banco de testes)
 *    - Confirma ausência de 'solicitacao_emissao' no ENUM
 *    - Confirma presença de 'emissao_solicitada_sucesso' (usado para solicitante)
 *
 * 4. Validação da view no banco de testes
 *    - View deve retornar lotes de entidade (empresa_id IS NULL)
 *    - nome_tomador resolvido pelo nome da entidade
 *    - tipo_solicitante = 'gestor' para lotes de entidade
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { query } from '@/lib/db';

const ROOT = path.resolve(__dirname, '../..');

// ============================================================================
// 1. MIGRAÇÃO 522 — Conteúdo do arquivo SQL
// ============================================================================
describe('1. Migration 522 — v_solicitacoes_emissao corrigida para entidades', () => {
  const sqlPath = path.join(
    ROOT,
    'database',
    'migrations',
    '522_fix_view_solicitacoes_emissao_entidade.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(sqlPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });

  it('deve fazer DROP VIEW IF EXISTS antes de recriar', () => {
    expect(src).toMatch(/DROP VIEW IF EXISTS v_solicitacoes_emissao/i);
  });

  it('deve recriar a view com CREATE VIEW', () => {
    expect(src).toMatch(/CREATE VIEW v_solicitacoes_emissao/i);
  });

  it('deve usar LEFT JOIN em empresas_clientes (não INNER JOIN)', () => {
    // Garantir que o JOIN com empresas_clientes é LEFT
    expect(src).toMatch(
      /LEFT JOIN empresas_clientes e ON e\.id = la\.empresa_id/i
    );
  });

  it('NÃO deve conter INNER JOIN em empresas_clientes', () => {
    // Regexp negativa: "JOIN empresas_clientes" sem "LEFT" antes
    const innerJoinMatch = src.match(/(?<!LEFT\s)JOIN empresas_clientes/i);
    expect(innerJoinMatch).toBeNull();
  });

  it('deve incluir LEFT JOIN em entidades para lotes de entidade pura', () => {
    expect(src).toMatch(
      /LEFT JOIN entidades ent ON ent\.id = la\.entidade_id/i
    );
  });

  it('deve usar COALESCE incluindo ent.nome para resolver nome_tomador', () => {
    expect(src).toMatch(
      /COALESCE\(c\.nome,\s*e\.nome,\s*ent\.nome\)\s*AS nome_tomador/i
    );
  });

  it('deve incluir ent.nome no GROUP BY para evitar erro de agregação', () => {
    expect(src).toMatch(/ent\.nome/i);
    // Garantir que está no GROUP BY
    const groupBySection = src.split(/GROUP BY/i)[1] || '';
    expect(groupBySection).toMatch(/ent\.nome/i);
  });

  it('deve manter filtro WHERE la.status_pagamento IS NOT NULL', () => {
    expect(src).toMatch(/WHERE la\.status_pagamento IS NOT NULL/i);
  });

  it('deve manter COUNT de avaliações concluídas', () => {
    expect(src).toMatch(/COUNT\(a\.id\)/i);
    expect(src).toMatch(/a\.status = 'concluida'/i);
  });

  it('deve conter COMMENT ON VIEW com nota sobre a correção', () => {
    expect(src).toMatch(/COMMENT ON VIEW v_solicitacoes_emissao/i);
    expect(src).toMatch(/LEFT JOIN|empresa_id = NULL|entidade/i);
  });
});

// ============================================================================
// 2. ROTA solicitar-emissao — Remoção da notificação admin inválida
// ============================================================================
describe('2. solicitar-emissao/route.ts — notificação admin inválida removida', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'lotes',
    '[loteId]',
    'solicitar-emissao',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('NÃO deve conter cast para solicitacao_emissao::tipo_notificacao', () => {
    // Esta conversão causava erro pois o valor não existe no ENUM
    expect(src).not.toContain("'solicitacao_emissao'::tipo_notificacao");
  });

  it('NÃO deve conter INSERT de notificação com destinatario_tipo admin para emissão', () => {
    // Garante que não há INSERT inserindo notificação de admin com o tipo removido
    expect(src).not.toMatch(
      /'solicitacao_emissao'[\s\S]{0,200}destinatario_tipo[\s\S]{0,50}'admin'/i
    );
  });

  it('deve ainda conter INSERT de notificação emissao_solicitada_sucesso para o solicitante', () => {
    // Notificação de sucesso para o próprio solicitante deve permanecer
    expect(src).toContain("'emissao_solicitada_sucesso'::tipo_notificacao");
  });

  it('deve atualizar status_pagamento para aguardando_cobranca', () => {
    expect(src).toContain("status_pagamento = 'aguardando_cobranca'");
  });

  it('deve atualizar solicitacao_emissao_em = NOW()', () => {
    expect(src).toContain('solicitacao_emissao_em = NOW()');
  });

  it('deve usar transação via transactionWithContext', () => {
    expect(src).toContain('transactionWithContext');
  });

  it('deve usar advisory lock para prevenir race condition', () => {
    expect(src).toContain('pg_advisory_xact_lock');
  });
});

// ============================================================================
// 3. BANCO DE TESTES — ENUM tipo_notificacao
// ============================================================================
describe('3. ENUM tipo_notificacao — validações no banco', () => {
  it('NÃO deve conter solicitacao_emissao (causa DB error se usado)', async () => {
    const result = await query(
      `SELECT enum_range(NULL::tipo_notificacao) AS valores`
    );
    const valores: string = result.rows[0].valores;
    expect(valores).not.toContain('solicitacao_emissao');
  });

  it('deve conter emissao_solicitada_sucesso (notificação válida para o solicitante)', async () => {
    const result = await query(
      `SELECT enum_range(NULL::tipo_notificacao) AS valores`
    );
    const valores: string = result.rows[0].valores;
    expect(valores).toContain('emissao_solicitada_sucesso');
  });

  it('deve conter laudo_emitido (notificação pós-emissão)', async () => {
    const result = await query(
      `SELECT enum_range(NULL::tipo_notificacao) AS valores`
    );
    const valores: string = result.rows[0].valores;
    expect(valores).toContain('laudo_emitido');
  });
});

// ============================================================================
// 4. BANCO DE TESTES — View v_solicitacoes_emissao inclui lotes de entidade
// ============================================================================
describe('4. View v_solicitacoes_emissao — lotes de entidade incluídos', () => {
  it('view deve existir na base de dados', async () => {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.views
        WHERE table_schema = 'public'
          AND table_name   = 'v_solicitacoes_emissao'
      ) AS existe`
    );
    expect(result.rows[0].existe).toBe(true);
  });

  it('view deve retornar colunas nome_tomador e tipo_solicitante', async () => {
    const result = await query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'v_solicitacoes_emissao'
         AND column_name IN ('nome_tomador', 'tipo_solicitante', 'entidade_id', 'empresa_id')
       ORDER BY column_name`
    );
    const colunas = result.rows.map(
      (r: { column_name: string }) => r.column_name
    );
    expect(colunas).toContain('nome_tomador');
    expect(colunas).toContain('tipo_solicitante');
    expect(colunas).toContain('entidade_id');
    expect(colunas).toContain('empresa_id');
  });

  it('lotes de entidade (empresa_id NULL) devem aparecer na view quando status_pagamento está definido', async () => {
    // Verificar se existem lotes de entidade com status_pagamento na base de testes
    const loteEntidade = await query(
      `SELECT id FROM lotes_avaliacao
       WHERE entidade_id IS NOT NULL
         AND empresa_id IS NULL
         AND status_pagamento IS NOT NULL
       LIMIT 1`
    );

    if (loteEntidade.rows.length === 0) {
      // Pular se não há dados de entidade no banco de testes
      console.warn(
        '[SKIP] Sem lotes de entidade com status_pagamento no banco de testes'
      );
      return;
    }

    const loteId = loteEntidade.rows[0].id;
    const result = await query(
      `SELECT lote_id, tipo_solicitante, nome_tomador, empresa_id
       FROM v_solicitacoes_emissao
       WHERE lote_id = $1`,
      [loteId]
    );

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].tipo_solicitante).toBe('gestor');
    // Lotes de entidade não têm empresa_id — deve ser null
    expect(result.rows[0].empresa_id).toBeNull();
    // nome_tomador não deve ser null (deveria vir da entidade)
    expect(result.rows[0].nome_tomador).not.toBeNull();
  });

  it('lotes de clínica (empresa_id preenchido) devem continuar na view', async () => {
    const loteClinica = await query(
      `SELECT id FROM lotes_avaliacao
       WHERE clinica_id IS NOT NULL
         AND empresa_id IS NOT NULL
         AND status_pagamento IS NOT NULL
       LIMIT 1`
    );

    if (loteClinica.rows.length === 0) {
      console.warn(
        '[SKIP] Sem lotes de clínica com status_pagamento no banco de testes'
      );
      return;
    }

    const loteId = loteClinica.rows[0].id;
    const result = await query(
      `SELECT lote_id, tipo_solicitante, nome_tomador, empresa_id
       FROM v_solicitacoes_emissao
       WHERE lote_id = $1`,
      [loteId]
    );

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].tipo_solicitante).toBe('rh');
    expect(result.rows[0].empresa_id).not.toBeNull();
  });

  it('lotes sem status_pagamento NÃO devem aparecer na view', async () => {
    // Pegar um lote qualquer sem status_pagamento
    const loteSemPagamento = await query(
      `SELECT id FROM lotes_avaliacao
       WHERE status_pagamento IS NULL
       LIMIT 1`
    );

    if (loteSemPagamento.rows.length === 0) {
      console.warn(
        '[SKIP] Todos os lotes têm status_pagamento no banco de testes'
      );
      return;
    }

    const loteId = loteSemPagamento.rows[0].id;
    const result = await query(
      `SELECT lote_id FROM v_solicitacoes_emissao WHERE lote_id = $1`,
      [loteId]
    );

    expect(result.rows.length).toBe(0);
  });

  it('view deve suportar consulta com filtro status_pagamento = aguardando_cobranca', async () => {
    // Simula o que o admin vê na aba "Aguardando Cobrança"
    const result = await query(
      `SELECT lote_id, status_pagamento, nome_tomador, tipo_solicitante
       FROM v_solicitacoes_emissao
       WHERE status_pagamento = 'aguardando_cobranca'
       ORDER BY lote_id DESC
       LIMIT 20`
    );

    // A query não deve lançar erro — se executar, está correta
    expect(Array.isArray(result.rows)).toBe(true);

    // Cada linha deve ter campos obrigatórios
    for (const row of result.rows) {
      expect(row.lote_id).toBeDefined();
      expect(row.status_pagamento).toBe('aguardando_cobranca');
      // nome_tomador pode ser null apenas se entidade/empresa/clinica não resolveu
      expect(
        typeof row.tipo_solicitante === 'string' ||
          row.tipo_solicitante === null
      ).toBe(true);
    }
  });
});
