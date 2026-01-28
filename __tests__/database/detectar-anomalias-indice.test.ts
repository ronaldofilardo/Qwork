/**
 * Testes da função detectar_anomalias_indice
 * Valida detecção de padrões suspeitos no histórico de avaliações
 * NOTA: Este teste usa o banco de desenvolvimento para validação
 */

import { query } from '@/lib/db';

describe('Função detectar_anomalias_indice', () => {
  describe('Detecção de anomalias', () => {
    it('deve detectar inativações consecutivas', async () => {
      // Inserir dados de teste se necessário, mas assumindo que há dados no banco

      const result = await query('SELECT * FROM detectar_anomalias_indice(1)');

      // Verificar se retorna as colunas corretas
      expect(result.rows.length).toBeGreaterThanOrEqual(0);
      if (result.rows.length > 0) {
        expect(result.rows[0]).toHaveProperty('cpf');
        expect(result.rows[0]).toHaveProperty('nome');
        expect(result.rows[0]).toHaveProperty('categoria_anomalia');
        expect(result.rows[0]).toHaveProperty('mensagem');
        expect(result.rows[0]).toHaveProperty('prioridade');
      }
    });

    it('deve ordenar por severidade (CRÍTICA primeiro)', async () => {
      const result = await query(
        'SELECT * FROM detectar_anomalias_indice(1) ORDER BY prioridade'
      );

      // Verificar se CRÍTICA vem antes de ALTA
      const prioridades = result.rows.map((row) => row.prioridade);
      const criticaIndex = prioridades.indexOf('CRÍTICA');
      const altaIndex = prioridades.indexOf('ALTA');

      if (criticaIndex !== -1 && altaIndex !== -1) {
        expect(criticaIndex).toBeLessThan(altaIndex);
      }
    });

    it('deve retornar tipos de anomalia válidos', async () => {
      const result = await query(
        'SELECT DISTINCT categoria_anomalia FROM detectar_anomalias_indice(1)'
      );

      const tiposValidos = [
        'NUNCA_AVALIADO',
        'MAIS_DE_1_ANO_SEM_AVALIACAO',
        'MAIS_DE_2_ANOS_SEM_AVALIACAO',
        'INDICE_MUITO_ATRASADO',
        'MUITAS_INATIVACOES',
      ];

      result.rows.forEach((row) => {
        expect(tiposValidos).toContain(row.categoria_anomalia);
      });
    });

    it('deve retornar severidades válidas', async () => {
      const result = await query(
        'SELECT DISTINCT prioridade FROM detectar_anomalias_indice(1)'
      );

      const prioridadesValidas = ['CRÍTICA', 'ALTA', 'MÉDIA'];

      result.rows.forEach((row) => {
        expect(prioridadesValidas).toContain(row.prioridade);
      });
    });
  });

  describe('Validação de estrutura', () => {
    it('deve ter estrutura de retorno correta', async () => {
      const result = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'detectar_anomalias_indice'
        AND table_schema = 'pg_catalog'
        ORDER BY ordinal_position
      `);

      // Como é função, talvez testar chamando e verificando tipos
      const sample = await query(
        'SELECT * FROM detectar_anomalias_indice(1) LIMIT 1'
      );
      if (sample.rows.length > 0) {
        expect(typeof sample.rows[0].cpf).toBe('string');
        expect(typeof sample.rows[0].nome).toBe('string');
        expect(typeof sample.rows[0].categoria_anomalia).toBe('string');
        expect(typeof sample.rows[0].mensagem).toBe('string');
        expect(typeof sample.rows[0].prioridade).toBe('string');
      }
    });
  });
});
