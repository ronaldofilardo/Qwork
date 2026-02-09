/**
 * Testes Robustos para Correções 09/02/2026 - Migration entidade_id
 *
 * Objetivo: Validar correção definitiva do problema de lotes de entidades não
 * aparecerem no dashboard enquanto lotes de clínicas aparecem corretamente.
 *
 * Foco: Validações funcionais críticas (não detalhes de implementação)
 */

import { query } from '@/lib/db';

describe('Correções 09/02/2026 - entidade_id Critical Validations', () => {
  describe('1. Schema Essencial', () => {
    it('deve ter coluna entidade_id em lotes_avaliacao', async () => {
      const result = await query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'lotes_avaliacao' 
         AND column_name = 'entidade_id'`
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toBe('integer');
    });

    it('deve ter coluna contratante_id (backward compatibility)', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'lotes_avaliacao' 
         AND column_name = 'contratante_id'`
      );

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('2. Queries de API - Funcionalidades Core', () => {
    it('query GET /api/entidade/lotes deve retornar lotes usando entidade_id', async () => {
      // Simular query da API
      const entidadeId = 5;
      const result = await query(
        `SELECT la.id, la.descricao, la.tipo, la.status, la.liberado_em,
                e.nome AS entidade_nome, e.cnpj AS entidade_cnpj
         FROM lotes_avaliacao la
         LEFT JOIN entidades e ON la.entidade_id = e.id
         WHERE la.entidade_id = $1
         ORDER BY la.liberado_em DESC
         LIMIT 5`,
        [entidadeId]
      );

      // Validação crítica: deve retornar dados
      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((lote) => {
        expect(lote.entidade_nome).toBeTruthy();
        expect(lote.descricao).toBeTruthy();
      });
    });

    it('lotes de entidade devem ter JOIN correto com entidades.nome', async () => {
      const result = await query(
        `SELECT la.id, la.entidade_id, e.nome
         FROM lotes_avaliacao la
         INNER JOIN entidades e ON la.entidade_id = e.id
         WHERE la.entidade_id IS NOT NULL
         LIMIT 5`
      );

      result.rows.forEach((lote) => {
        expect(lote.entidade_id).toBeTruthy();
        expect(lote.nome).toBeTruthy();
        expect(typeof lote.nome).toBe('string');
      });
    });

    it('lotes de clínica NÃO devem ter entidade_id (segregação)', async () => {
      const result = await query(
        `SELECT la.id, la.clinica_id, la.empresa_id, la.entidade_id
         FROM lotes_avaliacao la
         WHERE la.clinica_id IS NOT NULL
         LIMIT 10`
      );

      result.rows.forEach((lote) => {
        expect(lote.clinica_id).toBeTruthy();
        expect(lote.empresa_id).toBeTruthy();
        expect(lote.entidade_id).toBeNull();
      });
    });
  });

  describe('3. Casos de Uso End-to-End', () => {
    it('criar e buscar lote de entidade (fluxo completo)', async () => {
      // 1. Criar lote usando entidade_id
      const insertResult = await query(
        `INSERT INTO lotes_avaliacao (entidade_id, descricao, tipo, status, numero_ordem)
         VALUES (5, 'LOTE E2E TESTE', 'completo', 'ativo', 9992)
         RETURNING id, entidade_id`
      );

      const loteId = insertResult.rows[0].id;
      expect(insertResult.rows[0].entidade_id).toBe(5);

      // 2. Buscar lote como API faria
      const selectResult = await query(
        `SELECT la.id, la.descricao, e.nome
         FROM lotes_avaliacao la
         INNER JOIN entidades e ON la.entidade_id = e.id
         WHERE la.entidade_id = 5 AND la.id = $1`,
        [loteId]
      );

      expect(selectResult.rows).toHaveLength(1);
      expect(selectResult.rows[0].nome).toBeTruthy();

      // 3. Limpar
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    });
  });

  describe('4. Validação de Correção Principal', () => {
    it('✅ CORREÇÃO: lotes de entidade devem ser retornáveis pelo dashboard', async () => {
      const result = await query(
        `SELECT 
          la.id AS lote_id,
          la.descricao,
          la.status,
          la.tipo,
          la.entidade_id,
          e.nome AS entidade_nome,
          e.cnpj AS entidade_cnpj,
          COUNT(a.id) AS total_avaliacoes
         FROM lotes_avaliacao la
         LEFT JOIN entidades e ON la.entidade_id = e.id
         LEFT JOIN avaliacoes a ON a.lote_id = la.id
         WHERE la.entidade_id = 5
         GROUP BY la.id, la.descricao, la.status, la.tipo, la.entidade_id, e.nome, e.cnpj
         ORDER BY la.liberado_em DESC`
      );

      // Validação principal: deve retornar lotes existentes
      expect(result.rows.length).toBeGreaterThan(0);

      result.rows.forEach((lote) => {
        expect(lote.entidade_id).toBe(5);
        expect(lote.entidade_nome).toBeTruthy();
        expect(lote.entidade_cnpj).toBeTruthy();
        expect(lote.total_avaliacoes).toBeDefined();
      });

      console.log(
        `✅ Dashboard pode renderizar ${result.rows.length} lotes da entidade 5`
      );
    });

    it('✅ GARANTIA: nenhum lote órfão (sem owner)', async () => {
      const result = await query(
        `SELECT COUNT(*) as orfaos
         FROM lotes_avaliacao
         WHERE clinica_id IS NULL 
         AND empresa_id IS NULL 
         AND entidade_id IS NULL`
      );

      expect(parseInt(result.rows[0].orfaos)).toBe(0);
    });

    it('✅ SEGREGAÇÃO: nenhum lote híbrido (entidade E clínica)', async () => {
      const result = await query(
        `SELECT COUNT(*) as hibridos
         FROM lotes_avaliacao
         WHERE entidade_id IS NOT NULL 
         AND clinica_id IS NOT NULL`
      );

      expect(parseInt(result.rows[0].hibridos)).toBe(0);
    });
  });

  describe('5. Compatibilidade Backward', () => {
    it('funcionarios_entidades deve usar entidade_id', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'funcionarios_entidades' 
         AND column_name = 'entidade_id'`
      );

      const columns = result.rows.map((r) => r.column_name);
      expect(columns).toContain('entidade_id');
    });

    it('campo contratante_id ainda existe (transição)', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'lotes_avaliacao' 
         AND column_name = 'contratante_id'`
      );

      expect(result.rows).toHaveLength(1);
    });
  });
});
