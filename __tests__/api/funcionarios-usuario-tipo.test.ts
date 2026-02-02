/**
 * Teste: Criação de Funcionários - usuario_tipo correto
 *
 * Valida que as rotas de criação de funcionários usam os valores corretos de usuario_tipo:
 * - RH: 'funcionario_clinica'
 * - Entidade: 'funcionario_entidade'
 *
 * Correção aplicada em:
 * - app/api/rh/funcionarios/route.ts
 * - app/api/entidade/funcionarios/route.ts
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Criação de Funcionários - usuario_tipo correto', () => {
  let rhFuncionariosContent: string;
  let entidadeFuncionariosContent: string;

  beforeAll(() => {
    const rhPath = path.join(process.cwd(), 'app/api/rh/funcionarios/route.ts');
    const entidadePath = path.join(
      process.cwd(),
      'app/api/entidade/funcionarios/route.ts'
    );

    rhFuncionariosContent = fs.readFileSync(rhPath, 'utf-8');
    entidadeFuncionariosContent = fs.readFileSync(entidadePath, 'utf-8');
  });

  describe('RH - app/api/rh/funcionarios/route.ts', () => {
    it('deve usar usuario_tipo funcionario_clinica', () => {
      // Verificar INSERT com funcionario_clinica
      const insertPattern =
        /INSERT INTO funcionarios[^;]+usuario_tipo[^;]+'funcionario_clinica'/is;
      expect(rhFuncionariosContent).toMatch(insertPattern);
    });

    it('não deve usar usuario_tipo rh (valor antigo/incorreto)', () => {
      // Garantir que não está usando 'rh' como usuario_tipo
      const wrongPattern = /usuario_tipo[^']*'rh'/is;
      expect(rhFuncionariosContent).not.toMatch(wrongPattern);
    });

    it('deve passar session como terceiro parâmetro do query()', () => {
      // Verificar que está usando query() com session
      const queryWithSessionPattern = /query\([^,]+,[^,]+,\s*session/;
      expect(rhFuncionariosContent).toMatch(queryWithSessionPattern);
    });

    it('não deve usar queryWithContext (deve usar query com session)', () => {
      // Verificar que não está tentando usar queryWithContext
      expect(rhFuncionariosContent).not.toContain('queryWithContext');
    });
  });

  describe('Entidade - app/api/entidade/funcionarios/route.ts', () => {
    it('deve usar usuario_tipo funcionario_entidade', () => {
      // Verificar INSERT com funcionario_entidade no VALUES
      const insertPattern = /VALUES[^;]+'funcionario_entidade'/is;
      expect(entidadeFuncionariosContent).toMatch(insertPattern);
    });

    it('não deve usar usuario_tipo entidade (valor antigo/incorreto)', () => {
      // Garantir que não está usando 'entidade' como usuario_tipo
      const wrongPattern = /'entidade',?\s*\)/;
      expect(entidadeFuncionariosContent).not.toMatch(wrongPattern);
    });

    it('deve passar session como último parâmetro do query() no INSERT', () => {
      // Verificar que está usando query() com session no final
      const queryWithSessionPattern = /query\([^)]+,\s*session\s*\)/s;
      expect(entidadeFuncionariosContent).toMatch(queryWithSessionPattern);
    });

    it('não deve usar queryWithContext (deve usar query com session)', () => {
      expect(entidadeFuncionariosContent).not.toContain('queryWithContext');
    });
  });

  describe('Validação de enum usuario_tipo_enum', () => {
    it('RH deve ter comentário sobre valores válidos', () => {
      // Verificar documentação dos valores válidos
      const hasValidValuesDoc =
        rhFuncionariosContent.includes('funcionario_clinica') ||
        rhFuncionariosContent.includes('funcionario_entidade') ||
        rhFuncionariosContent.includes('gestor_rh');

      expect(hasValidValuesDoc).toBe(true);
    });

    it('Entidade deve ter comentário sobre valores válidos', () => {
      const hasValidValuesDoc =
        entidadeFuncionariosContent.includes('funcionario_clinica') ||
        entidadeFuncionariosContent.includes('funcionario_entidade') ||
        entidadeFuncionariosContent.includes('gestor_entidade');

      expect(hasValidValuesDoc).toBe(true);
    });
  });

  describe('Estrutura de session e RLS', () => {
    it('RH deve obter session via requireRHWithEmpresaAccess', () => {
      expect(rhFuncionariosContent).toContain('requireRHWithEmpresaAccess');
      expect(rhFuncionariosContent).toMatch(
        /const session = await requireRHWithEmpresaAccess/
      );
    });

    it('Entidade deve obter session via requireEntity', () => {
      expect(entidadeFuncionariosContent).toContain('requireEntity');
      expect(entidadeFuncionariosContent).toMatch(
        /const session = await requireEntity/
      );
    });

    it('RH deve usar session.clinica_id', () => {
      expect(rhFuncionariosContent).toContain('session.clinica_id');
    });

    it('Entidade deve usar session.contratante_id', () => {
      expect(entidadeFuncionariosContent).toContain('session.contratante_id');
    });
  });

  describe('Imports corretos', () => {
    it('RH deve importar query de @/lib/db', () => {
      expect(rhFuncionariosContent).toContain(
        "import { query } from '@/lib/db'"
      );
    });

    it('Entidade deve importar query de @/lib/db', () => {
      expect(entidadeFuncionariosContent).toContain(
        "import { query } from '@/lib/db'"
      );
    });

    it('RH não deve ter import de queryWithContext', () => {
      expect(rhFuncionariosContent).not.toContain('queryWithContext');
    });

    it('Entidade não deve ter import de queryWithContext', () => {
      expect(entidadeFuncionariosContent).not.toContain('queryWithContext');
    });
  });
});
