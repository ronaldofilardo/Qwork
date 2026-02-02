/**
 * TESTES: Rastreabilidade de Emissão Manual de Laudos
 *
 * Objetivo: Validar que o sistema registra corretamente o solicitante
 * de emissões manuais (RH ou gestor_entidade) para fins de auditoria.
 *
 * Cenários:
 * 1. Validar existência de campos de rastreabilidade em fila_emissao
 * 2. Validar registro do solicitante ao solicitar emissão
 * 3. Validar auditoria completa (solicitação + emissão)
 * 4. Validar relatórios de emissões por usuário
 * 5. Validar constraints de integridade
 */

import { query } from '@/lib/db';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do .env.test
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

describe('Rastreabilidade de Emissão Manual - Estrutura do Banco', () => {
  describe('Tabela fila_emissao - Campos de Rastreabilidade', () => {
    test('deve ter coluna solicitado_por', async () => {
      const result = await query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'fila_emissao' AND column_name = 'solicitado_por'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('character varying');
      expect(result.rows[0].character_maximum_length).toBe(11);
    });

    test('deve ter coluna solicitado_em', async () => {
      const result = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'fila_emissao' AND column_name = 'solicitado_em'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('timestamp without time zone');
    });

    test('deve ter coluna tipo_solicitante', async () => {
      const result = await query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'fila_emissao' AND column_name = 'tipo_solicitante'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('character varying');
      expect(result.rows[0].character_maximum_length).toBe(20);
    });

    test('deve ter constraint CHECK em tipo_solicitante', async () => {
      const result = await query(`
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name = 'fila_emissao_tipo_solicitante_check'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].check_clause).toContain('rh');
      expect(result.rows[0].check_clause).toContain('gestor_entidade');
    });

    test('deve ter índice em solicitado_por', async () => {
      const result = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'fila_emissao' 
        AND indexname = 'idx_fila_emissao_solicitado_por'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('deve ter índice em solicitado_em', async () => {
      const result = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'fila_emissao' 
        AND indexname = 'idx_fila_emissao_solicitado_em'
      `);

      expect(result.rows.length).toBe(1);
    });
  });

  describe('Constraint de Integridade', () => {
    test('deve ter constraint que exige tipo_solicitante quando solicitado_por existe', async () => {
      const result = await query(`
        SELECT constraint_name
        FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_fila_emissao_solicitante'
      `);

      expect(result.rows.length).toBe(1);
    });
  });
});

describe('Rastreabilidade de Emissão Manual - Funcionalidade', () => {
  describe('Registro de Solicitante na Fila', () => {
    test('deve permitir inserir com campos de rastreabilidade', async () => {
      // Usar lote existente para teste
      const loteResult = await query(`
        SELECT id FROM lotes_avaliacao 
        WHERE clinica_id IS NOT NULL 
        LIMIT 1
      `);

      if (loteResult.rows.length === 0) {
        console.warn('[SKIP] Nenhum lote disponível para teste');
        return;
      }

      const loteId = loteResult.rows[0].id;
      const cpfSolicitante = '87545772920';

      // Tentar inserir na fila com rastreabilidade
      await query(
        `
        INSERT INTO fila_emissao (
          lote_id, tentativas, max_tentativas, proxima_tentativa,
          solicitado_por, solicitado_em, tipo_solicitante
        )
        VALUES ($1, 0, 3, NOW(), $2, NOW(), 'gestor_entidade')
        ON CONFLICT (lote_id) DO UPDATE SET
          solicitado_por = EXCLUDED.solicitado_por,
          tipo_solicitante = EXCLUDED.tipo_solicitante
      `,
        [loteId, cpfSolicitante]
      );

      const result = await query(
        'SELECT solicitado_por, tipo_solicitante, solicitado_em FROM fila_emissao WHERE lote_id = $1',
        [loteId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].solicitado_por).toBe(cpfSolicitante);
      expect(result.rows[0].tipo_solicitante).toBe('gestor_entidade');
      expect(result.rows[0].solicitado_em).toBeDefined();

      // Limpar
      await query('DELETE FROM fila_emissao WHERE lote_id = $1', [loteId]);
    });

    test('não deve permitir tipo_solicitante inválido', async () => {
      const timestamp = Date.now().toString().slice(-6); // Usar apenas últimos 6 dígitos

      // Criar lote temporário para teste de validação
      const loteResult = await query(`
        INSERT INTO lotes_avaliacao (
          codigo, titulo, tipo, status, clinica_id, criado_em
        )
        VALUES ('VAL-${timestamp}', 'Teste Validacao', 'completo', 'concluido', 1, NOW())
        RETURNING id
      `);
      const loteId = loteResult.rows[0].id;

      await expect(
        query(
          `
          INSERT INTO fila_emissao (
            lote_id, tentativas, max_tentativas, proxima_tentativa,
            solicitado_por, solicitado_em, tipo_solicitante
          )
          VALUES ($1, 0, 3, NOW(), '12345678901', NOW(), 'invalido')
        `,
          [loteId]
        )
      ).rejects.toThrow();

      // Limpar
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    });
  });

  describe('Auditoria de Solicitações', () => {
    test('deve registrar solicitação em auditoria_laudos', async () => {
      // Usar lote existente
      const loteResult = await query(`
        SELECT id FROM lotes_avaliacao 
        WHERE clinica_id IS NOT NULL 
        LIMIT 1
      `);

      if (loteResult.rows.length === 0) {
        console.warn('[SKIP] Nenhum lote disponível para teste');
        return;
      }

      const loteId = loteResult.rows[0].id;
      const cpfSolicitante = '87545772920';

      await query(
        `
        INSERT INTO auditoria_laudos (
          lote_id, acao, status, emissor_cpf, emissor_nome, observacoes
        )
        VALUES ($1, 'solicitacao_manual', 'pendente', $2, 'Gestor Teste', 'Solicitação manual de emissão')
      `,
        [loteId, cpfSolicitante]
      );

      const result = await query(
        `SELECT acao, emissor_cpf FROM auditoria_laudos 
         WHERE lote_id = $1 AND acao = 'solicitacao_manual'
         ORDER BY criado_em DESC
         LIMIT 1`,
        [loteId]
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      expect(result.rows[0].acao).toBe('solicitacao_manual');
      expect(result.rows[0].emissor_cpf).toBe(cpfSolicitante);

      // Limpar
      await query(
        'DELETE FROM auditoria_laudos WHERE lote_id = $1 AND acao = $2',
        [loteId, 'solicitacao_manual']
      );
    });
  });
});

describe('Rastreabilidade de Emissão Manual - Views de Auditoria', () => {
  describe('View v_auditoria_emissoes', () => {
    test('deve existir view v_auditoria_emissoes', async () => {
      const result = await query(`
        SELECT viewname
        FROM pg_views
        WHERE viewname = 'v_auditoria_emissoes'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('view deve ter colunas de rastreabilidade', async () => {
      const result = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'v_auditoria_emissoes'
        AND column_name IN ('solicitante_cpf', 'solicitante_perfil', 'solicitado_em')
      `);

      expect(result.rows.length).toBe(3);
    });
  });

  describe('View v_relatorio_emissoes_usuario', () => {
    test('deve existir view v_relatorio_emissoes_usuario', async () => {
      const result = await query(`
        SELECT viewname
        FROM pg_views
        WHERE viewname = 'v_relatorio_emissoes_usuario'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('view deve ter métricas de emissões', async () => {
      const result = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'v_relatorio_emissoes_usuario'
        AND column_name IN ('total_solicitacoes', 'emissoes_sucesso', 'emissoes_erro')
      `);

      expect(result.rows.length).toBe(3);
    });
  });
});

describe('Rastreabilidade de Emissão Manual - Funções de Auditoria', () => {
  test('deve existir função fn_buscar_solicitante_laudo', async () => {
    const result = await query(`
      SELECT proname
      FROM pg_proc
      WHERE proname = 'fn_buscar_solicitante_laudo'
    `);

    expect(result.rows.length).toBe(1);
  });

  test('função deve retornar CPF, nome, perfil e data de solicitação', async () => {
    const result = await query(`
      SELECT 
        parameter_name,
        data_type
      FROM information_schema.parameters
      WHERE specific_name LIKE '%fn_buscar_solicitante_laudo%'
      AND parameter_mode = 'OUT'
      ORDER BY ordinal_position
    `);

    expect(result.rows.length).toBe(4);
    expect(result.rows.map((r) => r.parameter_name)).toEqual(
      expect.arrayContaining(['cpf', 'nome', 'perfil', 'solicitado_em'])
    );
  });
});

describe('Rastreabilidade de Emissão Manual - Integração E2E', () => {
  test('fluxo completo: solicitação → auditoria → rastreabilidade', async () => {
    // Usar lote existente para evitar problemas de FK
    const loteResult = await query(`
      SELECT id FROM lotes_avaliacao 
      WHERE clinica_id IS NOT NULL 
      LIMIT 1
    `);

    if (loteResult.rows.length === 0) {
      console.warn('[SKIP] Nenhum lote disponível para teste E2E');
      return;
    }

    const loteId = loteResult.rows[0].id;
    const cpfGestor = '16543102047';

    try {
      // 1. Registrar solicitação na fila
      await query(
        `
        INSERT INTO fila_emissao (
          lote_id, tentativas, max_tentativas, proxima_tentativa,
          solicitado_por, solicitado_em, tipo_solicitante
        )
        VALUES ($1, 0, 3, NOW(), $2, NOW(), 'gestor_entidade')
        ON CONFLICT (lote_id) DO UPDATE SET
          solicitado_por = EXCLUDED.solicitado_por,
          tipo_solicitante = EXCLUDED.tipo_solicitante
      `,
        [loteId, cpfGestor]
      );

      // 2. Registrar na auditoria
      await query(
        `
        INSERT INTO auditoria_laudos (
          lote_id, acao, status, emissor_cpf, emissor_nome, observacoes
        )
        VALUES ($1, 'solicitacao_manual', 'pendente', $2, 'Gestor E2E', 
                'Solicitação E2E teste de rastreabilidade')
      `,
        [loteId, cpfGestor]
      );

      // 3. Validar dados na fila
      const filaResult = await query(
        'SELECT solicitado_por, tipo_solicitante FROM fila_emissao WHERE lote_id = $1',
        [loteId]
      );
      expect(filaResult.rows[0].solicitado_por).toBe(cpfGestor);
      expect(filaResult.rows[0].tipo_solicitante).toBe('gestor_entidade');

      // 4. Validar dados na auditoria
      const auditoriaResult = await query(
        `SELECT acao, emissor_cpf FROM auditoria_laudos 
         WHERE lote_id = $1 AND acao = 'solicitacao_manual'
         ORDER BY criado_em DESC
         LIMIT 1`,
        [loteId]
      );
      expect(auditoriaResult.rows.length).toBeGreaterThanOrEqual(1);
      expect(auditoriaResult.rows[0].emissor_cpf).toBe(cpfGestor);

      // 5. Validar rastreabilidade completa
      const rastreabilidadeResult = await query(
        `
        SELECT 
          fe.solicitado_por,
          fe.tipo_solicitante,
          al.acao
        FROM fila_emissao fe
        LEFT JOIN auditoria_laudos al ON fe.lote_id = al.lote_id
        WHERE fe.lote_id = $1
        LIMIT 1
      `,
        [loteId]
      );

      expect(rastreabilidadeResult.rows.length).toBeGreaterThanOrEqual(1);
      expect(rastreabilidadeResult.rows[0].solicitado_por).toBe(cpfGestor);
    } finally {
      // Limpar dados de teste
      await query(
        'DELETE FROM auditoria_laudos WHERE lote_id = $1 AND acao = $2',
        [loteId, 'solicitacao_manual']
      );
      await query(
        'DELETE FROM fila_emissao WHERE lote_id = $1 AND solicitado_por = $2',
        [loteId, cpfGestor]
      );
    }
  });

  test('deve responder: quem solicitou a emissão do lote X?', async () => {
    // Usar lote existente
    const loteResult = await query(`
      SELECT id FROM lotes_avaliacao 
      WHERE clinica_id IS NOT NULL 
      LIMIT 1
    `);

    if (loteResult.rows.length === 0) {
      console.warn('[SKIP] Nenhum lote disponível para teste');
      return;
    }

    const loteId = loteResult.rows[0].id;
    const cpfGestor = '87545772920';

    try {
      // Inserir solicitação de teste
      await query(
        `
        INSERT INTO fila_emissao (
          lote_id, tentativas, max_tentativas, proxima_tentativa,
          solicitado_por, solicitado_em, tipo_solicitante
        )
        VALUES ($1, 0, 3, NOW(), $2, NOW(), 'gestor_entidade')
        ON CONFLICT (lote_id) DO UPDATE SET
          solicitado_por = EXCLUDED.solicitado_por,
          tipo_solicitante = EXCLUDED.tipo_solicitante
      `,
        [loteId, cpfGestor]
      );

      // Consultar quem solicitou
      const result = await query(
        `
        SELECT solicitado_por, tipo_solicitante, solicitado_em
        FROM fila_emissao
        WHERE lote_id = $1
      `,
        [loteId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].solicitado_por).toBe(cpfGestor);
      expect(result.rows[0].tipo_solicitante).toBe('gestor_entidade');
      expect(result.rows[0].solicitado_em).toBeDefined();
    } finally {
      // Limpar
      await query(
        'DELETE FROM fila_emissao WHERE lote_id = $1 AND solicitado_por = $2',
        [loteId, cpfGestor]
      );
    }
  });
});

describe('Rastreabilidade de Emissão Manual - Compliance LGPD', () => {
  test('deve permitir gerar relatório de emissões por CPF específico', async () => {
    const cpf = '87545772920';

    const result = await query(
      `
      SELECT 
        COUNT(*) as total_solicitacoes
      FROM fila_emissao
      WHERE solicitado_por = $1
    `,
      [cpf]
    );

    expect(result.rows[0]).toHaveProperty('total_solicitacoes');
    expect(typeof result.rows[0].total_solicitacoes).toBe('string'); // bigint retorna como string
  });

  test('deve permitir identificar todas as emissões de um período', async () => {
    const result = await query(`
      SELECT 
        solicitado_por,
        COUNT(*) as total
      FROM fila_emissao
      WHERE solicitado_em >= NOW() - INTERVAL '7 days'
      AND solicitado_por IS NOT NULL
      GROUP BY solicitado_por
    `);

    expect(Array.isArray(result.rows)).toBe(true);
  });

  test('deve manter histórico imutável de solicitações', async () => {
    // Verificar que não há ON UPDATE CASCADE em solicitado_por
    const result = await query(`
      SELECT 
        conname AS constraint_name,
        confupdtype AS on_update_action
      FROM pg_constraint
      WHERE conrelid = 'fila_emissao'::regclass
      AND conname LIKE '%solicitado%'
    `);

    // Deve não ter constraint de CASCADE em update
    const hasCascadeUpdate = result.rows.some(
      (row) => row.on_update_action === 'c' // 'c' = CASCADE
    );
    expect(hasCascadeUpdate).toBe(false);
  });
});
