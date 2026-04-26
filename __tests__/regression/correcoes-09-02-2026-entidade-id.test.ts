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
  let testEntidadeId: number;

  beforeAll(async () => {
    const res = await query(`SELECT id FROM entidades LIMIT 1`);
    if (res.rows.length === 0) throw new Error('Nenhuma entidade encontrada no banco de testes');
    testEntidadeId = res.rows[0].id;
  });

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

    it('coluna contratante_id não deve existir (migração concluída)', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'lotes_avaliacao' 
         AND column_name = 'contratante_id'`
      );

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('2. Queries de API - Funcionalidades Core', () => {
    let tempLoteId: number;

    beforeAll(async () => {
      // Inserir lote de teste para entidade 1 (que existe no banco de testes)
      const ins = await query(
        `INSERT INTO lotes_avaliacao (entidade_id, descricao, tipo, status, numero_ordem)
         VALUES ($1, 'LOTE TESTE ENTIDADE', 'completo', 'ativo', 99981)
         RETURNING id`,
        [testEntidadeId],
        { cpf: '00000000000', perfil: 'admin' }
      );
      tempLoteId = ins.rows[0].id;
    });

    afterAll(async () => {
      if (tempLoteId) {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [tempLoteId], { cpf: '00000000000', perfil: 'admin' });
      }
    });

    it('query GET /api/entidade/lotes deve retornar lotes usando entidade_id', async () => {
      // Simular query da API
      const entidadeId = testEntidadeId;
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
      // 1. Criar lote usando testEntidadeId (existe no banco de testes)
      const insertResult = await query(
        `INSERT INTO lotes_avaliacao (entidade_id, descricao, tipo, status, numero_ordem)
         VALUES ($1, 'LOTE E2E TESTE', 'completo', 'ativo', 9992)
         RETURNING id, entidade_id`,
        [testEntidadeId],
        { cpf: '00000000000', perfil: 'admin' }
      );

      const loteId = insertResult.rows[0].id;
      expect(insertResult.rows[0].entidade_id).toBe(testEntidadeId);

      // 2. Buscar lote como API faria
      const selectResult = await query(
        `SELECT la.id, la.descricao, e.nome
         FROM lotes_avaliacao la
         INNER JOIN entidades e ON la.entidade_id = e.id
         WHERE la.entidade_id = $2 AND la.id = $1`,
        [loteId, testEntidadeId]
      );

      expect(selectResult.rows).toHaveLength(1);
      expect(selectResult.rows[0].nome).toBeTruthy();

      // 3. Limpar
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId], { cpf: '00000000000', perfil: 'admin' });
    });
  });

  describe('4. Validação de Correção Principal', () => {
    let tempLoteId4: number;

    beforeAll(async () => {
      // Inserir lote de teste para entidade 1 para validar queries de dashboard
      const ins = await query(
        `INSERT INTO lotes_avaliacao (entidade_id, descricao, tipo, status, numero_ordem)
         VALUES ($1, 'LOTE DASHBOARD TESTE', 'completo', 'ativo', 99982)
         RETURNING id`,
        [testEntidadeId],
        { cpf: '00000000000', perfil: 'admin' }
      );
      tempLoteId4 = ins.rows[0].id;
    });

    afterAll(async () => {
      if (tempLoteId4) {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [tempLoteId4], { cpf: '00000000000', perfil: 'admin' });
      }
    });

    it('✅ CORREÇÃO: lotes de entidade devem ser retornáveis pelo dashboard', async () => {
      // Usar entidade_id = 1 (existe no banco de testes)
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
         WHERE la.entidade_id = $1
         GROUP BY la.id, la.descricao, la.status, la.tipo, la.entidade_id, e.nome, e.cnpj
         ORDER BY la.liberado_em DESC`,
        [testEntidadeId]
      );

      // Validação principal: deve retornar lotes existentes
      expect(result.rows.length).toBeGreaterThan(0);

      result.rows.forEach((lote) => {
        expect(lote.entidade_id).toBe(testEntidadeId);
        expect(lote.entidade_nome).toBeTruthy();
        expect(lote.total_avaliacoes).toBeDefined();
      });

      console.log(
        `✅ Dashboard pode renderizar ${result.rows.length} lotes da entidade ${testEntidadeId}`
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

    it('coluna contratante_id não deve existir (migração concluída)', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'lotes_avaliacao' 
         AND column_name = 'contratante_id'`
      );

      expect(result.rows).toHaveLength(0);
    });
  });
});
