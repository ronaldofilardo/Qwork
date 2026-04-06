/**
 * @fileoverview Correções 05/04/2026 — Remoção de data_liberacao_login
 *               do route /api/pagamento/confirmar
 *
 * A coluna data_liberacao_login (e pagamento_confirmado) foram removidas das
 * tabelas entidades e clinicas pela migration 1137_remover_colunas_pagamento_cadastro.
 *
 * Esta suite valida que o código de produção não referencia mais essas colunas,
 * garantindo que staging e outros ambientes não quebrem com a remoção.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

// ============================================================================
// Suite principal
// ============================================================================
describe('Correções 05/04/2026 — Remoção de data_liberacao_login do pagamento/confirmar', () => {
  // --------------------------------------------------------------------------
  // 1. app/api/pagamento/confirmar/route.ts
  // --------------------------------------------------------------------------
  describe('1. app/api/pagamento/confirmar/route.ts — sem colunas legadas', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('app/api/pagamento/confirmar/route.ts');
    });

    it('não contém data_liberacao_login em UPDATE SET', () => {
      // Verificar que nenhum UPDATE ainda usa a coluna removida
      expect(content).not.toContain('data_liberacao_login');
    });

    it('não contém pagamento_confirmado em UPDATE SET', () => {
      expect(content).not.toContain(
        "SET pagamento_confirmado"
      );
      // Aceita comentários sobre a remoção, mas não SQL ativo
      const lines = content.split('\n');
      const sqlLines = lines.filter(
        (l) =>
          l.trim().toUpperCase().startsWith('SET') ||
          l.trim().toUpperCase().startsWith('UPDATE')
      );
      sqlLines.forEach((line) => {
        expect(line).not.toContain('pagamento_confirmado');
      });
    });

    it('ainda autentica e ativa a entidade após pagamento confirmado', () => {
      // O UPDATE de ativação deve estar presente sem as colunas legadas
      expect(content).toContain("status = 'aprovado'");
      expect(content).toContain('ativa = true');
      expect(content).toContain('aprovado_em = COALESCE');
      expect(content).toContain('atualizado_em = CURRENT_TIMESTAMP');
    });

    it('mantém a lógica de aprovado_por_cpf no fluxo de ativação imediata', () => {
      expect(content).toContain("aprovado_por_cpf = '00000000000'");
    });
  });

  // --------------------------------------------------------------------------
  // 2. app/api/tomador/verificar-pagamento/route.ts — comentário de remoção
  // --------------------------------------------------------------------------
  describe('2. app/api/tomador/verificar-pagamento/route.ts — confirma remoção documentada', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('app/api/tomador/verificar-pagamento/route.ts');
    });

    it('contém comentário indicando remoção de pagamento_confirmado', () => {
      expect(content).toContain('pagamento_confirmado');
    });

    it('não faz SELECT de pagamento_confirmado no banco', () => {
      const lines = content.split('\n');
      const sqlLines = lines.filter((l) => {
        const trimmed = l.trim();
        return (
          trimmed.toUpperCase().startsWith('SELECT') ||
          (trimmed.toUpperCase().includes('SELECT') &&
            !trimmed.trim().startsWith('/') &&
            !trimmed.trim().startsWith('*'))
        );
      });
      sqlLines.forEach((line) => {
        expect(line).not.toContain('pagamento_confirmado');
      });
    });
  });

  // --------------------------------------------------------------------------
  // 3. app/api/pagamento/emissao/[token]/confirmar/route.ts
  //    — referência a pagamento_confirmado apenas como tipo de notificação (string literal)
  // --------------------------------------------------------------------------
  describe('3. app/api/pagamento/emissao/[token]/confirmar/route.ts — uso correto de pagamento_confirmado', () => {
    let content: string;

    beforeAll(() => {
      content = readFile(
        'app/api/pagamento/emissao/[token]/confirmar/route.ts'
      );
    });

    it('não faz UPDATE entidades SET pagamento_confirmado', () => {
      expect(content).not.toMatch(
        /UPDATE\s+entidades\s+SET[^;]*pagamento_confirmado/i
      );
    });

    it('não faz UPDATE clinicas SET pagamento_confirmado', () => {
      expect(content).not.toMatch(
        /UPDATE\s+clinicas\s+SET[^;]*pagamento_confirmado/i
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. Nenhuma rota de api/ usa data_liberacao_login em SQL ativo
  // --------------------------------------------------------------------------
  describe('4. Varredura global — nenhuma rota api/ usa data_liberacao_login em SQL', () => {
    const apiDir = path.join(ROOT, 'app', 'api');

    function getRouteFiles(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...getRouteFiles(full));
        } else if (entry.isFile() && entry.name === 'route.ts') {
          files.push(full);
        }
      }
      return files;
    }

    it('nenhum route.ts em app/api/ contém data_liberacao_login', () => {
      const routes = getRouteFiles(apiDir);
      const violators: string[] = [];

      for (const routeFile of routes) {
        const src = fs.readFileSync(routeFile, 'utf-8');
        if (src.includes('data_liberacao_login')) {
          // Aceita se for apenas comentário explicativo (linha começa com //)
          const lines = src.split('\n');
          const activeSqlLines = lines.filter(
            (line) =>
              line.includes('data_liberacao_login') &&
              !line.trim().startsWith('//')  &&
              !line.trim().startsWith('*')
          );
          if (activeSqlLines.length > 0) {
            violators.push(
              path.relative(ROOT, routeFile) +
                ': ' +
                activeSqlLines.map((l) => l.trim()).join(' | ')
            );
          }
        }
      }

      expect(violators).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Script de migrations — v5 criado e aplica 1137-1141
  // --------------------------------------------------------------------------
  describe('5. scripts/apply-migrations-staging-v5.ps1 — presente e correto', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('scripts/apply-migrations-staging-v5.ps1');
    });

    it('arquivo v5 existe', () => {
      expect(fs.existsSync(path.join(ROOT, 'scripts/apply-migrations-staging-v5.ps1'))).toBe(
        true
      );
    });

    it('cobre migration 1137_remover_colunas_pagamento_cadastro.sql', () => {
      expect(content).toContain('1137_remover_colunas_pagamento_cadastro.sql');
    });

    it('cobre migration 1139_fix_not_null_constraints.sql (usuario_tipo)', () => {
      expect(content).toContain('1139_fix_not_null_constraints.sql');
    });

    it('cobre migration 1141_add_link_disponibilizado_em_to_view.sql', () => {
      expect(content).toContain('1141_add_link_disponibilizado_em_to_view.sql');
    });

    it('target é neondb_staging (não neondb de produção)', () => {
      expect(content).toContain('neondb_staging');
      // Jamais deve apontar para o banco de produção (neondb sem sufixo)
      const hasProductionDb = /\$NEON_DB\s*=\s*["']neondb["']/.test(content);
      expect(hasProductionDb).toBe(false);
    });

    it('suporta modo DryRun', () => {
      expect(content).toContain('DryRun');
    });
  });
});
