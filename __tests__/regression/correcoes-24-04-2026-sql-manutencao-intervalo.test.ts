/**
 * @fileoverview Regressão 24/04/2026 — Bug SQL: integer + interval em limite_primeira_cobranca_manutencao
 *
 * Causa raiz:
 *   `UPDATE entidades SET limite_primeira_cobranca_manutencao = $1 + INTERVAL '90 days'`
 *   onde $1 era o tomador_id (integer), não um timestamp — PostgreSQL code 42883.
 *
 * Correção aplicada:
 *   Query consolidada com COALESCE(data_aceite do contrato, NOW()) + INTERVAL '90 days'
 *   usando dois parâmetros distintos: $1 = tomador_id, $2 = contrato_id.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

describe('Regressão 24/04/2026 — SQL limite manutenção com INTERVAL correto', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('app/api/contratos/route.ts');
  });

  // --------------------------------------------------------------------------
  // 1. Ausência do padrão bugado
  // --------------------------------------------------------------------------
  describe('1. Padrão bugado removido', () => {
    it('não usa $1 diretamente com INTERVAL (bug: integer + interval)', () => {
      // O padrão antigo era: SET col = $1 + INTERVAL onde $1 = tomador_id (integer)
      expect(content).not.toMatch(
        /limite_primeira_cobranca_manutencao\s*=\s*\$1\s*\+\s*INTERVAL/
      );
    });

    it('não executa dois UPDATEs separados para limite_primeira_cobranca_manutencao', () => {
      // O padrão antigo tinha dois UPDATE consecutivos para a mesma coluna
      const matches = content.match(
        /SET limite_primeira_cobranca_manutencao\s*=/g
      );
      // Deve haver apenas uma ocorrência (query consolidada)
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Presença do padrão correto
  // --------------------------------------------------------------------------
  describe('2. Padrão correto implementado', () => {
    it('usa COALESCE para preferir data_aceite do contrato sobre NOW()', () => {
      expect(content).toContain('COALESCE(');
      expect(content).toContain('data_aceite');
    });

    it('usa NOW() como fallback para o timestamp base', () => {
      expect(content).toContain('NOW()');
    });

    it('usa dois parâmetros distintos: $1 (tomador_id) e $2 (contrato_id)', () => {
      // A query correta usa $1 para o WHERE id = $1 e $2 para buscar data_aceite
      expect(content).toContain('$2');
      // Deve haver referência a updated.id como segundo parâmetro
      expect(content).toContain('updated.tomador_id, updated.id');
    });

    it('condição WHERE mantém proteção contra sobrescrever valor já definido', () => {
      expect(content).toContain('limite_primeira_cobranca_manutencao IS NULL');
    });

    it('operação é não-bloqueante (catch isolado)', () => {
      expect(content).toContain(
        '[CONTRATOS] Erro ao fixar limite de manutenção (não-bloqueante)'
      );
    });
  });
});
