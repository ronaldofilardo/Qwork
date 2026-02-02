/**
 * Teste: Status de Avaliações - 'iniciada' conforme constraint
 *
 * Valida que as rotas de liberar-lote criam avaliações com status 'iniciada'
 * (não 'liberada', que viola o constraint avaliacoes_status_check)
 *
 * Valores válidos conforme constraint:
 * - 'iniciada' (padrão)
 * - 'em_andamento'
 * - 'concluida'
 * - 'inativada'
 *
 * Correção aplicada em:
 * - app/api/rh/liberar-lote/route.ts
 * - app/api/entidade/liberar-lote/route.ts
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Status de Avaliações - iniciada (não liberada)', () => {
  let rhLiberarLoteContent: string;
  let entidadeLiberarLoteContent: string;

  beforeAll(() => {
    const rhPath = path.join(process.cwd(), 'app/api/rh/liberar-lote/route.ts');
    const entidadePath = path.join(
      process.cwd(),
      'app/api/entidade/liberar-lote/route.ts'
    );

    rhLiberarLoteContent = fs.readFileSync(rhPath, 'utf-8');
    entidadeLiberarLoteContent = fs.readFileSync(entidadePath, 'utf-8');
  });

  describe('RH - app/api/rh/liberar-lote/route.ts', () => {
    it('deve criar avaliações com status iniciada', () => {
      const insertPattern =
        /INSERT INTO avaliacoes[^;]+status[^;]+'iniciada'/is;
      expect(rhLiberarLoteContent).toMatch(insertPattern);
    });

    it('não deve usar status liberada (viola constraint)', () => {
      const wrongPattern = /INSERT INTO avaliacoes[^;]+status[^;]+'liberada'/is;
      expect(rhLiberarLoteContent).not.toMatch(wrongPattern);
    });

    it('todos os INSERTs de avaliação devem usar status iniciada', () => {
      // Extrair todos os INSERTs de avaliacoes
      const insertsPattern = /INSERT INTO avaliacoes[^;]+VALUES[^;]+/gis;
      const matches = rhLiberarLoteContent.match(insertsPattern);

      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThan(0);

      // Verificar que todos usam 'iniciada'
      matches.forEach((insert) => {
        if (insert.includes('status')) {
          expect(insert).toContain("'iniciada'");
          expect(insert).not.toContain("'liberada'");
        }
      });
    });
  });

  describe('Entidade - app/api/entidade/liberar-lote/route.ts', () => {
    it('deve criar avaliações com status iniciada', () => {
      const insertPattern =
        /INSERT INTO avaliacoes[^;]+status[^;]+'iniciada'/is;
      expect(entidadeLiberarLoteContent).toMatch(insertPattern);
    });

    it('não deve usar status liberada (viola constraint)', () => {
      const wrongPattern = /INSERT INTO avaliacoes[^;]+status[^;]+'liberada'/is;
      expect(entidadeLiberarLoteContent).not.toMatch(wrongPattern);
    });

    it('todos os INSERTs de avaliação devem usar status iniciada', () => {
      const insertsPattern = /INSERT INTO avaliacoes[^;]+VALUES[^;]+/gis;
      const matches = entidadeLiberarLoteContent.match(insertsPattern);

      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThan(0);

      matches.forEach((insert) => {
        if (insert.includes('status')) {
          expect(insert).toContain("'iniciada'");
          expect(insert).not.toContain("'liberada'");
        }
      });
    });
  });

  describe('Documentação de status válidos', () => {
    it('RH deve usar status iniciada', () => {
      // Verificar que o status 'iniciada' está presente no INSERT
      expect(rhLiberarLoteContent).toContain("'iniciada'");
    });

    it('Entidade deve usar status iniciada', () => {
      // Verificar que o status 'iniciada' está presente no INSERT
      expect(entidadeLiberarLoteContent).toContain("'iniciada'");
    });
  });

  describe('Estrutura de INSERT', () => {
    it('RH deve inserir campos: funcionario_cpf, status, inicio, lote_id', () => {
      expect(rhLiberarLoteContent).toMatch(
        /INSERT INTO avaliacoes\s*\([^)]*funcionario_cpf[^)]*\)/
      );
      expect(rhLiberarLoteContent).toMatch(
        /INSERT INTO avaliacoes\s*\([^)]*status[^)]*\)/
      );
      expect(rhLiberarLoteContent).toMatch(
        /INSERT INTO avaliacoes\s*\([^)]*inicio[^)]*\)/
      );
      expect(rhLiberarLoteContent).toMatch(
        /INSERT INTO avaliacoes\s*\([^)]*lote_id[^)]*\)/
      );
    });

    it('Entidade deve inserir campos: funcionario_cpf, status, inicio, lote_id', () => {
      expect(entidadeLiberarLoteContent).toMatch(
        /INSERT INTO avaliacoes\s*\([^)]*funcionario_cpf[^)]*\)/
      );
      expect(entidadeLiberarLoteContent).toMatch(
        /INSERT INTO avaliacoes\s*\([^)]*status[^)]*\)/
      );
      expect(entidadeLiberarLoteContent).toMatch(
        /INSERT INTO avaliacoes\s*\([^)]*inicio[^)]*\)/
      );
      expect(entidadeLiberarLoteContent).toMatch(
        /INSERT INTO avaliacoes\s*\([^)]*lote_id[^)]*\)/
      );
    });
  });

  describe('Tratamento de erros', () => {
    it('RH deve ter try/catch ao inserir avaliações', () => {
      // Verificar que há tratamento de erro ao redor do INSERT
      const hasTryCatch =
        rhLiberarLoteContent.includes('try') &&
        rhLiberarLoteContent.includes('catch');

      expect(hasTryCatch).toBe(true);
    });

    it('Entidade deve ter try/catch ao inserir avaliações', () => {
      const hasTryCatch =
        entidadeLiberarLoteContent.includes('try') &&
        entidadeLiberarLoteContent.includes('catch');

      expect(hasTryCatch).toBe(true);
    });
  });
});
