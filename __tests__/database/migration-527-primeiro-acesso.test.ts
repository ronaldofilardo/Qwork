/**
 * @fileoverview Testes da Migration 527 — Aceites de Termos para Representantes (PRODUÇÃO)
 *
 * Cobre:
 *   - Lógica do filtro de data: apenas reps criados ANTES de 2026-03-08 marcados como TRUE
 *   - Reps criados EM ou APÓS 2026-03-08 permanecem FALSE (verão o modal)
 *   - Idempotência: re-execução não altera reps já marcados como TRUE
 *   - Gate do layout: aceite_politica_privacidade=false → modal exibido
 *   - Gate do layout: aceite_politica_privacidade=true → modal NÃO exibido
 *
 * Estes são testes de lógica (sem conexão real ao banco) que validam
 * as regras de negócio implementadas na migration e no layout gate.
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../../database/migrations/527_representantes_aceites_politica_prod.sql'
);

const MIGRATION_526_PATH = path.resolve(
  __dirname,
  '../../database/migrations/526_representantes_aceites_politica.sql'
);

const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
const migration526Sql = fs.readFileSync(MIGRATION_526_PATH, 'utf-8');

describe('Migration 527 — Regras de Negócio', () => {
  describe('Estrutura do arquivo SQL', () => {
    it('deve ser idempotente: conter IF NOT EXISTS para ADD COLUMN', () => {
      expect(migrationSql).toContain('IF NOT EXISTS');
      expect(migrationSql).toContain('ADD COLUMN aceite_politica_privacidade');
    });

    it('deve conter DEFAULT FALSE para a nova coluna', () => {
      expect(migrationSql).toContain('DEFAULT FALSE');
    });

    it('deve executar dentro de uma transação (BEGIN/COMMIT)', () => {
      expect(migrationSql).toMatch(/^\s*BEGIN\s*;/m);
      expect(migrationSql).toMatch(/^\s*COMMIT\s*;/m);
    });
  });

  describe('Filtro de data: critério de corte 2026-03-08', () => {
    it('deve ter filtro AND criado_em < data de corte no UPDATE', () => {
      expect(migrationSql).toContain("criado_em < '2026-03-08'::date");
    });

    it('deve NÃO ter UPDATE sem filtro de data (bug da migration 526)', () => {
      // Migration 526 errada: UPDATE sem filtro de data
      // Verifica que a 527 NÃO repete esse erro
      const updateMatch = migrationSql.match(
        /UPDATE public\.representantes[\s\S]*?WHERE[\s\S]*?;/
      );
      expect(updateMatch).toBeTruthy();
      const updateClause = updateMatch[0];
      expect(updateClause).toContain('criado_em');
    });
  });

  describe('Comparação com Migration 526 (bug corrigido)', () => {
    it('migration 526 não tinha filtro de data (era incorreta para prod)', () => {
      // Documenta o bug: 526 usava WHERE aceite_politica_privacidade = FALSE sem AND criado_em
      const hasDateFilter526 = migration526Sql.includes('criado_em');
      expect(hasDateFilter526).toBe(false); // confirma que 526 NÃO tinha filtro
    });

    it('migration 527 corrige o bug adicionando filtro de data', () => {
      const hasDateFilter527 = migrationSql.includes('criado_em');
      expect(hasDateFilter527).toBe(true); // confirma que 527 TEM o filtro
    });
  });
});

describe('Gate do Layout — aceite_politica_privacidade', () => {
  /**
   * Simula a lógica do layout.tsx:
   *   if (session && !session.aceite_politica_privacidade) → exibir modal
   */
  function deveExibirModal(
    session: { aceite_politica_privacidade: boolean } | null
  ): boolean {
    return !!(session && !session.aceite_politica_privacidade);
  }

  it('deve exibir modal quando aceite_politica_privacidade = false', () => {
    expect(deveExibirModal({ aceite_politica_privacidade: false })).toBe(true);
  });

  it('deve NÃO exibir modal quando aceite_politica_privacidade = true', () => {
    expect(deveExibirModal({ aceite_politica_privacidade: true })).toBe(false);
  });

  it('deve NÃO exibir modal quando session é null', () => {
    expect(deveExibirModal(null)).toBe(false);
  });

  it('representante novo (criado em 08/03/2026) → aceite = false → modal exibido', () => {
    // Simula CPF 59073257042 (criado em 08/03/2026)
    const novoRep = { aceite_politica_privacidade: false };
    expect(deveExibirModal(novoRep)).toBe(true);
  });

  it('representante antigo (criado antes de 08/03/2026) → aceite = true → sem modal', () => {
    // Simula rep existente marcado pela migration 527
    const repAntigo = { aceite_politica_privacidade: true };
    expect(deveExibirModal(repAntigo)).toBe(false);
  });
});

describe('Lógica de aceite — endpoint /api/representante/aceitar-termos', () => {
  /**
   * Simula a query UPDATE idempotente:
   *   UPDATE representantes SET campo = TRUE WHERE id = $1 AND campo = FALSE
   */
  function simulaUpdate(
    estado: boolean,
    novoValor: boolean
  ): { updated: boolean; valorFinal: boolean } {
    if (!estado) {
      return { updated: true, valorFinal: novoValor };
    }
    return { updated: false, valorFinal: estado }; // campo já era TRUE, WHERE não bate
  }

  it('deve atualizar quando campo ainda é FALSE (primeiro aceite)', () => {
    const result = simulaUpdate(false, true);
    expect(result.updated).toBe(true);
    expect(result.valorFinal).toBe(true);
  });

  it('deve ser idempotente: re-aceite não altera campo já TRUE', () => {
    const result = simulaUpdate(true, true);
    expect(result.updated).toBe(false);
    expect(result.valorFinal).toBe(true);
  });

  it('gate deve passar após aceite dos 3 documentos', () => {
    const session = {
      aceite_disclaimer_nv: true,
      aceite_politica_privacidade: true,
      aceite_termos: true,
    };
    const todosAceitos =
      session.aceite_disclaimer_nv &&
      session.aceite_politica_privacidade &&
      session.aceite_termos;
    expect(todosAceitos).toBe(true);
  });

  it('gate não deve passar se pelo menos 1 aceite faltando', () => {
    const session = {
      aceite_disclaimer_nv: true,
      aceite_politica_privacidade: false,
      aceite_termos: true,
    };
    const todosAceitos =
      session.aceite_disclaimer_nv &&
      session.aceite_politica_privacidade &&
      session.aceite_termos;
    expect(todosAceitos).toBe(false);
  });
});
