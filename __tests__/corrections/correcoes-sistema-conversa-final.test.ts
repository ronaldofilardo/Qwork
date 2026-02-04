/**
 * Testes para verificar correções no sistema após migração de lotes
 * Data: 30/01/2026
 *
 * Verifica:
 * 1. APIs de RH funcionam sem erro de RLS
 * 2. API de entidade não tem referências a tabelas inexistentes
 * 3. Queries retornam dados corretamente
 * 4. Lotes de clínica e entidade são diferenciados corretamente
 */

import { query } from '@/lib/db';

describe('Correções Sistema - APIs RH e Entidade', () => {
  describe('API /api/rh/empresas', () => {
    it('deve usar query direto sem queryWithContext', async () => {
      const fs = require('fs');
      const apiPath = 'app/api/rh/empresas/route.ts';
      const content = fs.readFileSync(apiPath, 'utf-8');

      // Verificar que usa query direto no import
      expect(content).toContain("from '@/lib/db'");
      expect(content).toMatch(
        /import\s+\{[^}]*query[^}]*\}\s+from\s+['"]@\/lib\/db['"]/
      );

      // Verificar que NÃO importa queryWithContext
      expect(content).not.toMatch(
        /import\s+\{[^}]*queryWithContext[^}]*\}\s+from\s+['"]@\/lib\/db['"]/
      );

      // Verificar que as chamadas de query não usam queryWithContext
      expect(content).not.toMatch(/await\s+queryWithContext\s*\(/);
    });

    it('deve filtrar empresas por clinica_id explicitamente', async () => {
      const fs = require('fs');
      const apiPath = 'app/api/rh/empresas/route.ts';
      const content = fs.readFileSync(apiPath, 'utf-8');

      // Verificar filtro por clinica_id
      expect(content).toMatch(/clinica_id\s*=\s*\$\d+/);
      expect(content).toContain('ativa = true');
    });
  });

  describe('API /api/rh/lotes', () => {
    it('deve usar query direto sem queryWithContext', async () => {
      const fs = require('fs');
      const apiPath = 'app/api/rh/lotes/route.ts';
      const content = fs.readFileSync(apiPath, 'utf-8');

      expect(content).not.toContain('queryWithContext');
      expect(content).toMatch(
        /import\s+\{[^}]*query[^}]*\}\s+from\s+['"]@\/lib\/db['"]/
      );
    });

    it('deve filtrar lotes por empresa_id', async () => {
      const fs = require('fs');
      const apiPath = 'app/api/rh/lotes/route.ts';
      const content = fs.readFileSync(apiPath, 'utf-8');

      expect(content).toMatch(/empresa_id\s*=\s*\$\d+/);
    });
  });

  describe('API /api/rh/laudos', () => {
    it('deve usar query direto sem queryWithContext', async () => {
      const fs = require('fs');
      const apiPath = 'app/api/rh/laudos/route.ts';
      const content = fs.readFileSync(apiPath, 'utf-8');

      expect(content).not.toContain('queryWithContext');
      expect(content).toMatch(
        /import\s+\{[^}]*query[^}]*\}\s+from\s+['"]@\/lib\/db['"]/
      );
    });
  });

  describe('API /api/entidade/lotes', () => {
    it('não deve referenciar tabela contratantes_funcionarios', async () => {
      const fs = require('fs');
      const apiPath = 'app/api/entidade/lotes/route.ts';
      const content = fs.readFileSync(apiPath, 'utf-8');

      // Verificar que NÃO referencia a tabela inexistente
      expect(content).not.toContain('contratantes_funcionarios');
    });

    it('deve filtrar lotes por contratante_id', async () => {
      const fs = require('fs');
      const apiPath = 'app/api/entidade/lotes/route.ts';
      const content = fs.readFileSync(apiPath, 'utf-8');

      expect(content).toMatch(/contratante_id\s*=\s*\$\d+/);
    });
  });
});

describe('Correções Banco - Estrutura de Lotes', () => {
  it('deve ter lotes de ENTIDADE com contratante_id preenchido', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM lotes_avaliacao
      WHERE contratante_id IS NOT NULL
      AND clinica_id IS NULL
    `);

    const count = parseInt(result.rows[0].count);
    expect(count).toBeGreaterThan(0);
  });

  it('deve ter lotes de CLÍNICA com clinica_id e empresa_id preenchidos', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM lotes_avaliacao
      WHERE clinica_id IS NOT NULL
      AND empresa_id IS NOT NULL
      AND contratante_id IS NULL
    `);

    const count = parseInt(result.rows[0].count);
    expect(count).toBeGreaterThan(0);
  });

  it('não deve ter lotes com ambos contratante_id e clinica_id preenchidos', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM lotes_avaliacao
      WHERE contratante_id IS NOT NULL
      AND clinica_id IS NOT NULL
    `);

    const count = parseInt(result.rows[0].count);
    expect(count).toBe(0);
  });

  it('deve ter constraint OR entre contratante_id e clinica_id', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM lotes_avaliacao
      WHERE contratante_id IS NULL
      AND clinica_id IS NULL
    `);

    const count = parseInt(result.rows[0].count);
    expect(count).toBe(0);
  });
});

describe('Correções Banco - Relação Lotes e Contratantes', () => {
  it('lotes com contratante_id devem referenciar contratantes do tipo "entidade"', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM lotes_avaliacao la
      INNER JOIN contratantes c ON c.id = la.contratante_id
      WHERE c.tipo != 'entidade'
    `);

    const count = parseInt(result.rows[0].count);
    expect(count).toBe(0);
  });

  it('lotes com clinica_id devem referenciar contratantes do tipo "clinica"', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM lotes_avaliacao la
      INNER JOIN clinicas c ON c.id = la.clinica_id
      LEFT JOIN contratantes cont ON cont.nome = c.nome
      WHERE la.clinica_id IS NOT NULL
      AND cont.tipo IS NOT NULL
      AND cont.tipo != 'clinica'
    `);

    const count = parseInt(result.rows[0].count);
    expect(count).toBe(0);
  });
});

describe('Correções Sistema - Validações de Dados', () => {
  it('todas as empresas devem ter clinica_id preenchido', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM empresas_clientes
      WHERE clinica_id IS NULL
    `);

    const count = parseInt(result.rows[0].count);
    expect(count).toBe(0);
  });

  it('todos os laudos devem ter lote_id preenchido', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM laudos
      WHERE lote_id IS NULL
    `);

    const count = parseInt(result.rows[0].count);
    expect(count).toBe(0);
  });

  it('laudos devem ter id = lote_id (relação 1:1) para laudos novos', async () => {
    // Este teste verifica a constraint para novos laudos
    // Laudos antigos podem ter IDs diferentes (legado)
    const result = await query(`
      SELECT COUNT(*) as count
      FROM laudos
      WHERE id != lote_id
      AND criado_em > '2026-01-29'
    `);

    const count = parseInt(result.rows[0].count);
    // Laudos criados recentemente devem ter id = lote_id
    expect(count).toBe(0);
  });
});

describe('Correções Sistema - Queries Funcionais', () => {
  it('deve conseguir buscar lotes de entidade por contratante_id', async () => {
    const result = await query(`
      SELECT la.id,  la.contratante_id, c.tipo
      FROM lotes_avaliacao la
      INNER JOIN contratantes c ON c.id = la.contratante_id
      WHERE la.contratante_id IS NOT NULL
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      expect(result.rows[0].contratante_id).toBeDefined();
      expect(result.rows[0].tipo).toBe('entidade');
    }
  });

  it('deve conseguir buscar lotes de clínica por clinica_id e empresa_id', async () => {
    const result = await query(`
      SELECT 
        la.id, 
         
        la.clinica_id, 
        la.empresa_id,
        c.nome as clinica_nome,
        ec.nome as empresa_nome
      FROM lotes_avaliacao la
      INNER JOIN clinicas c ON c.id = la.clinica_id
      INNER JOIN empresas_clientes ec ON ec.id = la.empresa_id
      WHERE la.clinica_id IS NOT NULL
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      expect(result.rows[0].clinica_id).toBeDefined();
      expect(result.rows[0].empresa_id).toBeDefined();
      expect(result.rows[0].clinica_nome).toBeDefined();
      expect(result.rows[0].empresa_nome).toBeDefined();
    }
  });

  it('deve conseguir listar empresas de uma clínica', async () => {
    // Primeiro, pegar uma clínica que tenha empresas
    const clinicaResult = await query(`
      SELECT DISTINCT clinica_id
      FROM empresas_clientes
      WHERE ativa = true
      LIMIT 1
    `);

    if (clinicaResult.rows.length > 0) {
      const clinicaId = clinicaResult.rows[0].clinica_id;

      const empresasResult = await query(
        `
        SELECT id, nome, cnpj, clinica_id
        FROM empresas_clientes
        WHERE clinica_id = $1 AND ativa = true
      `,
        [clinicaId]
      );

      expect(empresasResult.rows.length).toBeGreaterThan(0);
      empresasResult.rows.forEach((empresa) => {
        expect(empresa.clinica_id).toBe(clinicaId);
      });
    }
  });
});

describe('Correções Sistema - Tabelas Inexistentes Removidas', () => {
  it('não deve haver referências a contratantes_funcionarios no código', async () => {
    const fs = require('fs');
    const path = require('path');

    // Verificar arquivo da API de entidade
    const apiPath = 'app/api/entidade/lotes/route.ts';
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf-8');
      expect(content).not.toContain('contratantes_funcionarios');
    }
  });

  it('tabela contratantes_funcionarios não deve ser usada nas queries', async () => {
    // Verificar que não há queries ativas usando esta tabela no código
    const fs = require('fs');
    const apiPath = 'app/api/entidade/lotes/route.ts';

    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf-8');
      // Verificar que não há JOINs com contratantes_funcionarios
      expect(content).not.toMatch(/JOIN\s+contratantes_funcionarios/i);
      expect(content).not.toMatch(/FROM\s+contratantes_funcionarios/i);
    }
  });
});
