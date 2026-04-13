/**
 * @file Teste de validação — Remoção definitiva do sistema de planos/contratação personalizada
 * @date 2026-04-01
 *
 * Verifica que todas as referências ao sistema legado de "contratacao_personalizada",
 * "plano_personalizado" e "tipo_plano" foram removidas do codebase de produção.
 *
 * Contexto:
 * - Migration 1136 removeu tabelas, funções, triggers, indexes, FKs, sequences e colunas
 * - Código de produção limpo de todas as referências
 * - Testes e scripts legados deletados/atualizados
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ---------- helpers ----------

function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readFileIfExists(relPath: string): string | null {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

function globFiles(dir: string, extensions: string[]): string[] {
  const result: string[] = [];
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return result;

  function walk(d: string): void {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'node_modules' &&
        entry.name !== '.next'
      ) {
        walk(p);
      } else if (
        entry.isFile() &&
        extensions.some((ext) => entry.name.endsWith(ext))
      ) {
        result.push(p);
      }
    }
  }
  walk(full);
  return result;
}

// ---------- tests ----------

describe('Remoção definitiva — sistema personalizado/planos (Migration 1136)', () => {
  describe('Arquivos legados foram removidos', () => {
    const deletedFiles = [
      'cypress/e2e/sucesso-cadastro-personalizado.cy.ts',
      'cypress/e2e/sucesso-cadastro-personalizado.spec.ts',
      'cypress/e2e/contratante-plano-personalizado.cy.ts',
      'scripts/run-approve-personalizado.ts',
      'scripts/import-plan-personalizado-2026-02-02.sql',
      'scripts/backfill-valor-pago-insert.js',
      'scripts/apply-contratos-migration.js',
      'scripts/_rewrite-clinicas.cjs',
      'scripts/_rewrite-clinicas2.cjs',
      'app/api/contratacao_personalizada',
      'components/modals/ModalDefinirValorPersonalizado.tsx',
      'components/modals/ModalLinkContratoPersonalizado.tsx',
      'components/admin/clinicas/PlanoPersonalizadoCard.tsx',
    ];

    test.each(deletedFiles)('%s não existe no codebase', (file) => {
      expect(fileExists(file)).toBe(false);
    });
  });

  describe('Migration 1136 existe e cobre remoção completa', () => {
    const migration = readFileIfExists(
      'database/migrations/archived/1136_remocao_definitiva_planos_contratacao.sql'
    );

    test('arquivo de migration existe', () => {
      expect(migration).not.toBeNull();
    });

    test('migration dropa tabela contratacao_personalizada', () => {
      expect(migration).toContain('contratacao_personalizada');
      expect(migration).toMatch(/DROP\s+TABLE/i);
    });

    test('migration dropa tabela planos', () => {
      expect(migration).toContain('planos');
    });

    test('migration dropa tabela contratos_planos', () => {
      expect(migration).toContain('contratos_planos');
    });

    test('migration dropa funções legadas', () => {
      expect(migration).toContain('sync_personalizado_status');
      expect(migration).toContain('fn_validar_token_pagamento');
    });

    test('migration dropa triggers legados', () => {
      expect(migration).toContain('sync_personalizado_status_trg');
    });

    test('migration é idempotente (IF EXISTS)', () => {
      expect(migration).toContain('IF EXISTS');
    });
  });

  describe('Schema files limpos de referências legadas', () => {
    test('01-foundation.sql não contém tipo_plano enum', () => {
      const content = readFileIfExists(
        'database/schemas/modular/01-foundation.sql'
      );
      expect(content).not.toBeNull();
      expect(content).not.toContain('tipo_plano');
      expect(content).not.toContain('contratacao_personalizada');
    });

    test('03-entidades-comercial.sql não contém plano_personalizado', () => {
      const content = readFileIfExists(
        'database/schemas/modular/03-entidades-comercial.sql'
      );
      expect(content).not.toBeNull();
      expect(content).not.toContain('plano_personalizado');
      expect(content).not.toContain('valor_personalizado');
    });

    test('05-financeiro-notificacoes.sql não contém contratacao_personalizada_id', () => {
      const content = readFileIfExists(
        'database/schemas/modular/05-financeiro-notificacoes.sql'
      );
      expect(content).not.toBeNull();
      expect(content).not.toContain('contratacao_personalizada_id');
    });
  });

  describe('Página sucesso-cadastro sem lógica personalizada', () => {
    const page = readFileIfExists('app/sucesso-cadastro/page.tsx');

    test('arquivo existe', () => {
      expect(page).not.toBeNull();
    });

    test('sem condicional tipo=personalizado', () => {
      expect(page).not.toContain("tipoParam === 'personalizado'");
      expect(page).not.toContain('tipo=personalizado');
    });

    test('sem estado dadosEnviados', () => {
      expect(page).not.toContain('dadosEnviados');
    });
  });

  describe('Código de produção (app/, lib/, components/) sem referências a tabelas legadas', () => {
    const dirs = ['app', 'lib', 'components'];
    const exts = ['.ts', '.tsx'];

    // Patterns legados que NÃO devem aparecer no código de produção
    const forbiddenPatterns = [
      'contratacao_personalizada',
      'plano_personalizado',
      'tipo_plano',
      'ModalDefinirValorPersonalizado',
      'ModalLinkContratoPersonalizado',
      'PlanoPersonalizadoCard',
    ];

    const productionFiles: string[] = [];
    for (const dir of dirs) {
      productionFiles.push(...globFiles(dir, exts));
    }

    test('existem arquivos de produção para verificar', () => {
      expect(productionFiles.length).toBeGreaterThan(0);
    });

    test.each(forbiddenPatterns)(
      'nenhum arquivo de produção contém "%s"',
      (pattern) => {
        const matches: string[] = [];
        for (const file of productionFiles) {
          const content = fs.readFileSync(file, 'utf-8');
          if (content.includes(pattern)) {
            matches.push(path.relative(ROOT, file));
          }
        }
        expect(matches).toEqual([]);
      }
    );
  });

  describe('API endpoint legado de proposta removido', () => {
    test('rota proposta/[token]/route.ts foi deletada do sistema', () => {
      const route = readFileIfExists('app/api/proposta/[token]/route.ts');
      // Rota foi completamente removida (remoção mais forte que 410)
      expect(route).toBeNull();
    });
  });
});
