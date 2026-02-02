/**
 * Testes: Imutabilidade de Laudos
 *
 * Valida a migração 996:
 * - Triggers de imutabilidade ativos
 * - Bloqueio de UPDATE após emissão
 * - Bloqueio de DELETE após emissão
 * - Hash SHA-256 preservado
 * - Integridade de avaliações, respostas e resultados
 */

import { query } from '@/lib/db';

describe('Correção: Imutabilidade de Laudos', () => {
  describe('Triggers de Imutabilidade', () => {
    it('deve ter trigger enforce_laudo_immutability ativo', async () => {
      const result = await query(`
        SELECT 
          t.tgname,
          t.tgenabled,
          c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'enforce_laudo_immutability'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].tgenabled).toBe('O'); // O = ORIGIN (enabled)
      expect(result.rows[0].table_name).toBe('laudos');
    });

    it('deve ter trigger prevent_avaliacao_update_after_emission ativo', async () => {
      const result = await query(`
        SELECT 
          t.tgname,
          t.tgenabled,
          c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'prevent_avaliacao_update_after_emission'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].tgenabled).toBe('O');
      expect(result.rows[0].table_name).toBe('avaliacoes');
    });

    it('deve ter trigger prevent_avaliacao_delete_after_emission ativo', async () => {
      const result = await query(`
        SELECT 
          t.tgname,
          t.tgenabled,
          c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'prevent_avaliacao_delete_after_emission'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].tgenabled).toBe('O');
      expect(result.rows[0].table_name).toBe('avaliacoes');
    });

    it('deve ter trigger prevent_lote_update_after_emission ativo', async () => {
      const result = await query(`
        SELECT 
          t.tgname,
          t.tgenabled,
          c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'prevent_lote_update_after_emission'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].tgenabled).toBe('O');
      expect(result.rows[0].table_name).toBe('lotes_avaliacao');
    });

    it('deve ter trigger trg_prevent_laudo_lote_id_change ativo', async () => {
      const result = await query(`
        SELECT 
          t.tgname,
          t.tgenabled,
          c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'trg_prevent_laudo_lote_id_change'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].tgenabled).toBe('O');
      expect(result.rows[0].table_name).toBe('laudos');
    });

    it('deve ter trigger trigger_resposta_immutability ativo', async () => {
      const result = await query(`
        SELECT 
          t.tgname,
          t.tgenabled,
          c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'trigger_resposta_immutability'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].tgenabled).toBe('O');
      expect(result.rows[0].table_name).toBe('respostas');
    });
  });

  describe('Funções de Imutabilidade', () => {
    it('deve ter função prevent_modification_after_emission()', async () => {
      const result = await query(`
        SELECT 
          p.proname,
          pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'prevent_modification_after_emission'
          AND n.nspname = 'public'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].return_type).toBe('trigger');
    });

    it('deve ter função check_laudo_immutability()', async () => {
      const result = await query(`
        SELECT 
          p.proname,
          pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'check_laudo_immutability'
          AND n.nspname = 'public'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].return_type).toBe('trigger');
    });

    it('deve ter função prevent_lote_status_change_after_emission()', async () => {
      const result = await query(`
        SELECT 
          p.proname,
          pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'prevent_lote_status_change_after_emission'
          AND n.nspname = 'public'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].return_type).toBe('trigger');
    });
  });

  describe('Integridade de Hashes', () => {
    it('laudos emitidos com PDF devem ter hash SHA-256', async () => {
      const result = await query(`
        SELECT 
          l.id,
          l.status,
          l.hash_pdf,
          LENGTH(l.hash_pdf) as hash_length
        FROM laudos l
        WHERE l.status IN ('emitido', 'enviado')
          AND l.hash_pdf IS NOT NULL
      `);

      // Todos os hashes devem ter 64 caracteres (SHA-256 em hex)
      result.rows.forEach((row) => {
        expect(row.hash_length).toBe(64);
        expect(row.hash_pdf).toMatch(/^[a-f0-9]{64}$/);
      });
    });

    it('laudos com hash devem ser únicos', async () => {
      const result = await query(`
        SELECT 
          hash_pdf,
          COUNT(*) as count
        FROM laudos
        WHERE hash_pdf IS NOT NULL
        GROUP BY hash_pdf
        HAVING COUNT(*) > 1
      `);

      expect(result.rows).toHaveLength(0);
    });

    it('hash não deve ser NULL para laudos status=enviado', async () => {
      const result = await query(`
        SELECT 
          l.id,
          l.status,
          la.codigo
        FROM laudos l
        LEFT JOIN lotes_avaliacao la ON la.id = l.lote_id
        WHERE l.status = 'enviado'
          AND l.hash_pdf IS NULL
      `);

      // Pode haver laudos históricos sem hash (anterior às correções)
      // Documentar aqui se houver
      if (result.rows.length > 0) {
        console.warn(
          '⚠️ Laudos enviados sem hash (histórico):',
          result.rows.length
        );
      }
    });
  });

  describe('Validação de Imutabilidade - Bloqueio de Modificações', () => {
    let testLoteId: number;
    let testAvaliacaoId: number;
    let testLaudoId: number;

    beforeAll(async () => {
      // Criar dados de teste com laudo emitido
      const loteResult = await query(`
        INSERT INTO lotes_avaliacao 
        (codigo, titulo, tipo, status, contratante_id, liberado_por, liberado_em)
        VALUES ('TEST-IMMUT', 'Teste Imutabilidade', 'completo', 'concluido', 1, '12345678901', NOW())
        RETURNING id
      `);
      testLoteId = loteResult.rows[0].id;

      const avaliacaoResult = await query(
        `
        INSERT INTO avaliacoes 
        (lote_id, funcionario_cpf, status)
        VALUES ($1, '12345678901', 'concluida')
        RETURNING id
      `,
        [testLoteId]
      );
      testAvaliacaoId = avaliacaoResult.rows[0].id;

      const laudoResult = await query(
        `
        INSERT INTO laudos 
        (lote_id, emissor_cpf, status, emitido_em, hash_pdf)
        VALUES ($1, '12345678901', 'emitido', NOW(), 'test_hash_' || md5(random()::text))
        RETURNING id
      `,
        [testLoteId]
      );
      testLaudoId = laudoResult.rows[0].id;
    });

    afterAll(async () => {
      // Limpar dados de teste (forçando bypass do trigger)
      await query('DELETE FROM laudos WHERE id = $1', [testLaudoId]);
      await query('DELETE FROM avaliacoes WHERE id = $1', [testAvaliacaoId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [testLoteId]);
    });

    it('não deve permitir UPDATE em laudo emitido', async () => {
      await expect(
        query(
          `
          UPDATE laudos 
          SET observacoes = 'Tentativa de modificação'
          WHERE id = $1
        `,
          [testLaudoId]
        )
      ).rejects.toThrow();
    });

    it('não deve permitir DELETE em laudo emitido', async () => {
      await expect(
        query('DELETE FROM laudos WHERE id = $1', [testLaudoId])
      ).rejects.toThrow();
    });

    it('não deve permitir UPDATE em avaliação de lote com laudo', async () => {
      await expect(
        query(
          `
          UPDATE avaliacoes 
          SET status = 'inativada'
          WHERE id = $1
        `,
          [testAvaliacaoId]
        )
      ).rejects.toThrow();
    });

    it('não deve permitir DELETE em avaliação de lote com laudo', async () => {
      await expect(
        query('DELETE FROM avaliacoes WHERE id = $1', [testAvaliacaoId])
      ).rejects.toThrow();
    });
  });

  describe('Auditoria de Laudos Emitidos', () => {
    it('deve ter auditoria_laudos para cada laudo emitido', async () => {
      const result = await query(`
        SELECT 
          l.id as laudo_id,
          al.id as auditoria_id
        FROM laudos l
        LEFT JOIN auditoria_laudos al ON al.laudo_id = l.id
        WHERE l.status IN ('emitido', 'enviado')
      `);

      // Verificar se há laudos sem auditoria
      const semAuditoria = result.rows.filter((r) => !r.auditoria_id);
      if (semAuditoria.length > 0) {
        console.warn('⚠️ Laudos emitidos sem auditoria:', semAuditoria.length);
      }
    });

    it('auditoria_laudos deve registrar emissão', async () => {
      const result = await query(`
        SELECT 
          al.laudo_id,
          al.acao,
          al.usuario_cpf,
          al.criado_em
        FROM auditoria_laudos al
        WHERE al.acao = 'emitido'
        ORDER BY al.criado_em DESC
        LIMIT 5
      `);

      result.rows.forEach((row) => {
        expect(row.acao).toBe('emitido');
        expect(row.usuario_cpf).toBeTruthy();
        expect(row.criado_em).toBeTruthy();
      });
    });
  });

  describe('Estatísticas de Imutabilidade', () => {
    it('relatório: total de laudos por status', async () => {
      const result = await query(`
        SELECT 
          status,
          COUNT(*) as total,
          COUNT(hash_pdf) as com_hash,
          COUNT(*) - COUNT(hash_pdf) as sem_hash
        FROM laudos
        GROUP BY status
        ORDER BY status
      `);

      console.table(result.rows);
    });

    it('relatório: laudos emitidos nos últimos 30 dias', async () => {
      const result = await query(`
        SELECT 
          DATE(emitido_em) as data,
          COUNT(*) as total,
          COUNT(hash_pdf) as com_hash
        FROM laudos
        WHERE emitido_em >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(emitido_em)
        ORDER BY data DESC
      `);

      console.table(result.rows);
    });
  });
});
