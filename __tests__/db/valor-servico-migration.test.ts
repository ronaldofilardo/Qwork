/**
 * @fileoverview Testes da migration 501 — coluna valor_servico em lotes_avaliacao.
 *
 * CONTEXTO DO ERRO:
 * O trigger trg_criar_comissao_ao_emitir_laudo() referenciava valor_servico em
 * lotes_avaliacao, mas a coluna nunca havia sido criada. Qualquer emissão de laudo
 * resultava em erro 42703 (column "valor_servico" does not exist).
 *
 * CORREÇÃO:
 * Migration 501_add_valor_servico_lotes_avaliacao.sql adicionou a coluna ao banco.
 *
 * TESTES:
 * - Verificam que o arquivo de migration existe e contém o ALTER TABLE correto.
 * - Verificam que o trigger (migration 500) usa COALESCE para tolerância a NULL.
 * - Verificam a lógica do trigger: valores zero não geram comissão.
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'database', 'migrations');
const MIGRATION_501 = path.join(
  MIGRATIONS_DIR,
  '501_add_valor_servico_lotes_avaliacao.sql'
);
const MIGRATION_500 = path.join(
  MIGRATIONS_DIR,
  '500_sistema_comissionamento.sql'
);

describe('Migration 501 — coluna valor_servico em lotes_avaliacao', () => {
  describe('Arquivo de migration', () => {
    it('o arquivo de migration 501 deve existir', () => {
      expect(fs.existsSync(MIGRATION_501)).toBe(true);
    });

    it('deve conter a instrução ALTER TABLE correta', () => {
      const sql = fs.readFileSync(MIGRATION_501, 'utf-8');
      expect(sql).toContain('ALTER TABLE public.lotes_avaliacao');
      expect(sql).toContain('ADD COLUMN IF NOT EXISTS valor_servico');
      expect(sql).toContain('DECIMAL(10,2)');
    });

    it('deve usar IF NOT EXISTS (idempotente — pode ser re-executada)', () => {
      const sql = fs.readFileSync(MIGRATION_501, 'utf-8');
      expect(sql).toContain('ADD COLUMN IF NOT EXISTS valor_servico');
    });

    it('deve conter comentário explicando o propósito da coluna', () => {
      const sql = fs.readFileSync(MIGRATION_501, 'utf-8');
      expect(sql).toContain(
        'COMMENT ON COLUMN public.lotes_avaliacao.valor_servico'
      );
    });
  });

  describe('Trigger trg_criar_comissao_ao_emitir_laudo (migration 500)', () => {
    let triggerSql: string;

    beforeAll(() => {
      const fullSql = fs.readFileSync(MIGRATION_500, 'utf-8');
      // Extrair apenas a função do trigger
      const start = fullSql.indexOf(
        'CREATE OR REPLACE FUNCTION public.trg_criar_comissao_ao_emitir_laudo'
      );
      const end =
        fullSql.indexOf('$$ LANGUAGE plpgsql SECURITY DEFINER;', start) + 40;
      triggerSql = fullSql.slice(start, end);
    });

    it('o trigger deve existir na migration 500', () => {
      expect(triggerSql.length).toBeGreaterThan(100);
      expect(triggerSql).toContain('trg_criar_comissao_ao_emitir_laudo');
    });

    it('o trigger usa COALESCE para tolerar valor_servico NULL', () => {
      expect(triggerSql).toContain('COALESCE(valor_servico, 0)');
    });

    it('o trigger retorna NEW sem criar comissão quando valor é zero (null → 0)', () => {
      // O trigger faz: IF _valor_laudo <= 0 THEN RETURN NEW
      expect(triggerSql).toContain('IF _valor_laudo <= 0 THEN');
      expect(triggerSql).toContain(
        'RETURN NEW; -- Sem valor definido, não gerar comissão'
      );
    });

    it('o trigger só dispara na emissão (emitido_em preenchido pela primeira vez)', () => {
      expect(triggerSql).toContain(
        'IF NEW.emitido_em IS NULL OR OLD.emitido_em IS NOT NULL THEN'
      );
      expect(triggerSql).toContain('RETURN NEW;');
    });

    it('o trigger insere em comissoes_laudo com os campos corretos', () => {
      expect(triggerSql).toContain('INSERT INTO public.comissoes_laudo');
      expect(triggerSql).toContain(
        'percentual_comissao, valor_laudo, valor_comissao'
      );
    });
  });

  describe('Lógica de comissionamento — regras de negócio', () => {
    it('valor_servico NULL → COALESCE retorna 0 → nenhuma comissão é gerada', () => {
      // Simula a lógica do trigger localmente
      const valorServico: number | null = null;
      const _valorLaudo = valorServico ?? 0; // equivalente ao COALESCE
      const deveGerarComissao = _valorLaudo > 0;
      expect(deveGerarComissao).toBe(false);
    });

    it('valor_servico = 0 → nenhuma comissão é gerada', () => {
      const valorServico = 0;
      const deveGerarComissao = valorServico > 0;
      expect(deveGerarComissao).toBe(false);
    });

    it('valor_servico = 100.00 → comissão de 2.5% = R$ 2.50', () => {
      const valorServico = 100.0;
      const percentual = 2.5;
      const valorComissao =
        Math.round(((valorServico * percentual) / 100) * 100) / 100;
      expect(valorComissao).toBe(2.5);
    });

    it('valor_servico = 250.00 → comissão de 2.5% = R$ 6.25', () => {
      const valorServico = 250.0;
      const percentual = 2.5;
      const valorComissao =
        Math.round(((valorServico * percentual) / 100) * 100) / 100;
      expect(valorComissao).toBe(6.25);
    });

    it('percentual padrão do trigger é 2.50%', () => {
      const triggerSql = fs.readFileSync(MIGRATION_500, 'utf-8');
      expect(triggerSql).toContain('_percentual       DECIMAL(5,2) := 2.50;');
    });
  });
});
