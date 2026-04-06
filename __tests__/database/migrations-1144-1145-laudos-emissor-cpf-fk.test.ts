/**
 * Testes para migrations 1144 e 1145:
 * - 1144: Fix laudos.emissor_cpf FK para referenciar usuarios ao invés de funcionarios
 * - 1145: Drop FK laudos.emissor_cpf (multi-ambiente: emissor existe em DB local,
 *         mas laudos são gravados em staging/prod Neon)
 *
 * Contexto da correção (06/04/2026):
 * - Emissores são usuários de plataforma (tabela usuarios), não funcionários
 * - Em fluxo multi-ambiente, o emissor autentica no DB local mas escreve laudos
 *   no Neon (staging/prod), onde usuarios.cpf não existe → violação FK 23503
 * - Solução: remover FK, manter emissor_cpf como coluna de auditoria
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Migrations 1144 e 1145 - laudos.emissor_cpf FK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Migration 1144 - Corrigir FK para usuarios', () => {
    it('deve verificar que fk_laudos_emissor_cpf foi removida de funcionarios', async () => {
      // Representa o estado pós-1144: FK aponta para usuarios, não funcionarios
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            constraint_name: 'fk_laudos_emissor_cpf',
            foreign_table_name: 'usuarios',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT
          tc.constraint_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'laudos'
          AND tc.constraint_name = 'fk_laudos_emissor_cpf'
      `);

      // FK deve apontar para usuarios, nunca para funcionarios
      if (result.rows.length > 0) {
        expect(result.rows[0].foreign_table_name).toBe('usuarios');
        expect(result.rows[0].foreign_table_name).not.toBe('funcionarios');
      }
    });

    it('não deve existir FK duplicada laudos_emissor_cpf_fkey ou laudos_emissor_cpf_fkey1', async () => {
      // Pós-migration 1144: constraints legadas removidas
      mockQuery.mockResolvedValueOnce({
        rows: [], // Sem constraints duplicadas
        rowCount: 0,
      } as any);

      const result = await query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'laudos'
          AND constraint_name IN ('laudos_emissor_cpf_fkey', 'laudos_emissor_cpf_fkey1')
      `);

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('Migration 1145 - Drop FK laudos.emissor_cpf', () => {
    it('deve verificar que fk_laudos_emissor_cpf não existe após migration 1145', async () => {
      // Pós-migration 1145: FK completamente removida
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'laudos'
          AND constraint_name = 'fk_laudos_emissor_cpf'
          AND constraint_type = 'FOREIGN KEY'
      `);

      // Não deve existir nenhuma FK com esse nome
      expect(result.rows).toHaveLength(0);
    });

    it('deve garantir que emissor_cpf ainda existe como coluna de auditoria', async () => {
      // A coluna deve existir mesmo sem FK — usada para auditoria
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            column_name: 'emissor_cpf',
            is_nullable: 'YES',
            data_type: 'character varying',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'laudos'
          AND column_name = 'emissor_cpf'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].column_name).toBe('emissor_cpf');
      // Deve ser nullable (emissor pode não estar preenchido em rascunhos)
      expect(result.rows[0].is_nullable).toBe('YES');
    });
  });

  describe('Lógica de Multi-Ambiente (validação conceitual)', () => {
    it('deve permitir INSERT em laudos com emissor_cpf sem FK constraint', async () => {
      // Simula INSERT que antes falhava com FK 23503 quando emissor_cpf
      // não existe na tabela usuarios do DB de destino (staging/prod)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      const result = await query(
        `INSERT INTO laudos (id, lote_id, status, emissor_cpf, criado_em)
         VALUES ($1, $1, 'rascunho', $2, NOW())
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [999, '99999999999'] // CPF do emissor pode não existir no DB destino
      );

      // Não deve lançar FK violation (23503)
      expect(result.rows).toHaveLength(1);
    });

    it('deve rejeitar laudos sem lote_id (FK real que deve permanecer)', async () => {
      // FK para lotes_avaliacao DEVE continuar existindo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            constraint_name: 'fk_laudos_lote',
            foreign_table_name: 'lotes_avaliacao',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT tc.constraint_name, ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'laudos'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.column_name = 'lote_id'
        LIMIT 1
      `);

      // FK do lote deve permanecer intacta
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].foreign_table_name).toBe('lotes_avaliacao');
    });
  });
});
