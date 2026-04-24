/**
 * @fileoverview Testes de validação da migration 1139 — NOT NULL constraints + usuario_tipo
 * @description
 * Valida que a migration 1139_fix_not_null_constraints.sql foi aplicada corretamente:
 *  1. Coluna usuario_tipo adicionada em funcionarios (NOT NULL, tipo usuario_tipo_enum)
 *  2. clinicas.ativa → NOT NULL DEFAULT true
 *  3. entidades.tipo → NOT NULL DEFAULT 'entidade'
 *  4. empresas_clientes.ativa → NOT NULL DEFAULT true
 *  5. lotes_avaliacao.tipo → NOT NULL DEFAULT 'completo'
 *  6. lotes_avaliacao.status → NOT NULL DEFAULT 'ativo'
 *  7. avaliacoes.lote_id → NOT NULL (FK obrigatória)
 *  8. avaliacoes.status → NOT NULL DEFAULT 'iniciada'
 *  9. Validação do script validate-test-data-integrity.cjs:
 *     - tomador_id removido dos checks de funcionarios (M:N via funcionarios_entidades)
 *     - empresa_id, clinica_id, liberado_por removidos de lotes_avaliacao (nullable by design)
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// Tipo para simplicidade de asserção de colunas
type ColInfo = {
  is_nullable: string;
  udt_name?: string;
  column_default?: string;
};

describe('Migration 1139 — Correções NOT NULL + usuario_tipo em funcionarios', () => {
  // ============================================================================
  // Helpers: leitura do schema via SQL (apenas leitura — sem escrita no banco)
  // ============================================================================

  // Pre-aquece a conexão DB antes dos testes, aumenta timeout para testes de integração
  beforeAll(async () => {
    const { query } = await import('@/lib/db');
    await query('SELECT 1', undefined, { cpf: '00000000000', perfil: 'admin' });
  }, 30000);

  async function getColumnInfo(
    tableName: string,
    columnName: string
  ): Promise<ColInfo | null> {
    // Importação dinâmica para não afetar outros contextos de importação
    const { query } = await import('@/lib/db');
    const result = await query(
      `SELECT is_nullable, udt_name, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name   = $1
         AND column_name  = $2`,
      [tableName, columnName],
      { cpf: '00000000000', perfil: 'admin' }
    );
    if (!result.rows || result.rows.length === 0) return null;
    return result.rows[0] as ColInfo;
  }

  // ============================================================================
  // 1. funcionarios.usuario_tipo
  // ============================================================================
  describe('1. funcionarios.usuario_tipo (migration 1139)', () => {
    it('coluna existe em funcionarios', async () => {
      const col = await getColumnInfo('funcionarios', 'usuario_tipo');
      expect(col).not.toBeNull();
    }, 30000);

    it('é NOT NULL', async () => {
      const col = await getColumnInfo('funcionarios', 'usuario_tipo');
      expect(col?.is_nullable).toBe('NO');
    }, 30000);

    it('é do tipo usuario_tipo_enum', async () => {
      const col = await getColumnInfo('funcionarios', 'usuario_tipo');
      expect(col?.udt_name).toBe('usuario_tipo_enum');
    }, 30000);

    it('enum usuario_tipo_enum contém os valores esperados', async () => {
      const { query } = await import('@/lib/db');
      const result = await query(
        `SELECT enumlabel FROM pg_enum
         JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
         WHERE pg_type.typname = 'usuario_tipo_enum'
         ORDER BY enumsortorder`,
        undefined,
        { cpf: '00000000000', perfil: 'admin' }
      );
      const labels = result.rows.map((r: { enumlabel: string }) => r.enumlabel);
      expect(labels).toContain('funcionario_clinica');
      expect(labels).toContain('funcionario_entidade');
      expect(labels).toContain('admin');
      expect(labels).toContain('gestor');
      expect(labels).toContain('rh');
      expect(labels).toContain('emissor');
    });

    it('tomador_id NÃO existe em funcionarios (arquitetura M:N via migration 605)', async () => {
      const col = await getColumnInfo('funcionarios', 'tomador_id');
      expect(col).toBeNull();
    });
  });

  // ============================================================================
  // 2. clinicas.ativa
  // ============================================================================
  describe('2. clinicas.ativa', () => {
    it('é NOT NULL', async () => {
      const col = await getColumnInfo('clinicas', 'ativa');
      expect(col?.is_nullable).toBe('NO');
    });

    it('tem DEFAULT true', async () => {
      const col = await getColumnInfo('clinicas', 'ativa');
      expect(col?.column_default).toMatch(/true/i);
    });
  });

  // ============================================================================
  // 3. entidades.tipo
  // ============================================================================
  describe('3. entidades.tipo', () => {
    it('é NOT NULL', async () => {
      const col = await getColumnInfo('entidades', 'tipo');
      expect(col?.is_nullable).toBe('NO');
    });

    it("tem DEFAULT 'entidade'", async () => {
      const col = await getColumnInfo('entidades', 'tipo');
      expect(col?.column_default).toMatch(/entidade/i);
    });
  });

  // ============================================================================
  // 4. empresas_clientes.ativa
  // ============================================================================
  describe('4. empresas_clientes.ativa', () => {
    it('é NOT NULL', async () => {
      const col = await getColumnInfo('empresas_clientes', 'ativa');
      expect(col?.is_nullable).toBe('NO');
    });

    it('tem DEFAULT true', async () => {
      const col = await getColumnInfo('empresas_clientes', 'ativa');
      expect(col?.column_default).toMatch(/true/i);
    });
  });

  // ============================================================================
  // 5. lotes_avaliacao.tipo
  // ============================================================================
  describe('5. lotes_avaliacao.tipo', () => {
    it('é NOT NULL', async () => {
      const col = await getColumnInfo('lotes_avaliacao', 'tipo');
      expect(col?.is_nullable).toBe('NO');
    });

    it("tem DEFAULT 'completo'", async () => {
      const col = await getColumnInfo('lotes_avaliacao', 'tipo');
      expect(col?.column_default).toMatch(/completo/i);
    });
  });

  // ============================================================================
  // 6. lotes_avaliacao.status
  // ============================================================================
  describe('6. lotes_avaliacao.status', () => {
    it('é NOT NULL', async () => {
      const col = await getColumnInfo('lotes_avaliacao', 'status');
      expect(col?.is_nullable).toBe('NO');
    });

    it("tem DEFAULT 'ativo'", async () => {
      const col = await getColumnInfo('lotes_avaliacao', 'status');
      expect(col?.column_default).toMatch(/ativo/i);
    });
  });

  // ============================================================================
  // 7. lotes_avaliacao — nullable by design (entidade-type lotes)
  // ============================================================================
  describe('7. lotes_avaliacao — nullable by design', () => {
    it('empresa_id é nullable (lotes de entidade usam entidade_id)', async () => {
      const col = await getColumnInfo('lotes_avaliacao', 'empresa_id');
      expect(col?.is_nullable).toBe('YES');
    });

    it('clinica_id é nullable (lotes de entidade usam entidade_id)', async () => {
      const col = await getColumnInfo('lotes_avaliacao', 'clinica_id');
      expect(col?.is_nullable).toBe('YES');
    });

    it('liberado_por é nullable (lotes de entidade podem ter liberado_por nulo)', async () => {
      const col = await getColumnInfo('lotes_avaliacao', 'liberado_por');
      expect(col?.is_nullable).toBe('YES');
    });
  });

  // ============================================================================
  // 8. avaliacoes.lote_id
  // ============================================================================
  describe('8. avaliacoes.lote_id', () => {
    it('é NOT NULL (FK obrigatória — avaliação sempre pertence a um lote)', async () => {
      const col = await getColumnInfo('avaliacoes', 'lote_id');
      expect(col?.is_nullable).toBe('NO');
    });
  });

  // ============================================================================
  // 9. avaliacoes.status
  // ============================================================================
  describe('9. avaliacoes.status', () => {
    it('é NOT NULL', async () => {
      const col = await getColumnInfo('avaliacoes', 'status');
      expect(col?.is_nullable).toBe('NO');
    });

    it("tem DEFAULT 'iniciada'", async () => {
      const col = await getColumnInfo('avaliacoes', 'status');
      expect(col?.column_default).toMatch(/iniciada/i);
    });
  });

  // ============================================================================
  // 10. Script validate-test-data-integrity.cjs atualizado
  // ============================================================================
  describe('10. Script validate-test-data-integrity.cjs', () => {
    const scriptPath = path.join(
      ROOT,
      'scripts/checks/validate-test-data-integrity.cjs'
    );
    let scriptContent: string;

    beforeAll(() => {
      scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    });

    it('não checa tomador_id em funcionarios (coluna removida na migration 605)', () => {
      // tomador_id foi removido da lista de checks
      expect(scriptContent).not.toContain("'tomador_id'");
    });

    it('não checa empresa_id em lotes_avaliacao (nullable by design)', () => {
      expect(scriptContent).not.toContain("'empresa_id'");
    });

    it('não checa clinica_id de lotes_avaliacao (nullable by design)', () => {
      // clinica_id pode aparecer em empresas_clientes (OK), mas não deve estar em lotes_avaliacao
      const loteBlock = scriptContent.match(/lotes_avaliacao[\s\S]*?]/);
      if (loteBlock) {
        expect(loteBlock[0]).not.toContain("'clinica_id'");
      }
    });

    it('não checa liberado_por em lotes_avaliacao (nullable by design)', () => {
      expect(scriptContent).not.toContain("'liberado_por'");
    });

    it('checa usuario_tipo em funcionarios (adicionado na migration 1139)', () => {
      expect(scriptContent).toContain("'usuario_tipo'");
    });

    it('checa ativa em clinicas', () => {
      const clinicasBlock = scriptContent.match(/clinicas[\s\S]*?]/);
      expect(clinicasBlock?.[0]).toContain("'ativa'");
    });
  });
});
