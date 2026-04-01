/**
 * db-no-hardcoded-credentials.test.ts
 *
 * Valida a correção de segurança aplicada em 01/04/2026:
 *
 * PROBLEMA (OWASP A2 - Broken Authentication / Exposed Credentials):
 *   lib/db/connection.ts tinha URL hardcoded como fallback quando
 *   LOCAL_DATABASE_URL não estava definido:
 *     return 'postgresql://postgres:123456@localhost:5432/nr-bps_db'
 *
 *   Isso expunha credenciais padrão no código-fonte e impedia que
 *   desenvolvedores percebessem que LOCAL_DATABASE_URL estava ausente.
 *
 * CORREÇÃO:
 *   Substituído por throw new Error() com mensagem clara e sem credenciais,
 *   referenciando docs/policies/DATABASE_SETUP.md para instruções.
 *
 * Este arquivo garante que a correção não seja revertida acidentalmente.
 */

import * as fs from 'fs';
import * as path from 'path';

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');
}

// ─── Bloco principal — lib/db/connection.ts ──────────────────────────────────

describe('lib/db/connection.ts — sem credenciais hardcoded (OWASP A2)', () => {
  let src: string;

  beforeAll(() => {
    src = readSource('lib/db/connection.ts');
  });

  describe('Remoção do fallback hardcoded', () => {
    it('NÃO deve conter a URL hardcoded como valor de retorno no bloco isDevelopment', () => {
      // Garantia de que a URL de fallback com credenciais foi removida
      expect(src).not.toMatch(
        /return\s*['"]postgresql:\/\/postgres:123456@localhost:5432\/nr-bps_db['"]/
      );
    });

    it('NÃO deve conter console.warn como único aviso para LOCAL_DATABASE_URL ausente', () => {
      // O comportamento anterior era: console.warn + return URL_hardcoded
      // Garantir que não existe mais a combinação console.warn → return URL_hardcoded
      const warnBeforeHardcode = src.match(
        /console\.warn[\s\S]{0,200}return\s*'postgresql:\/\/postgres:123456/
      );
      expect(warnBeforeHardcode).toBeNull();
    });

    it('DEVE lançar Error quando LOCAL_DATABASE_URL não está definido', () => {
      // Novo comportamento: fail-fast com mensagem clara
      expect(src).toMatch(/throw new Error\(/);
      expect(src).toMatch(/LOCAL_DATABASE_URL não está definido/);
    });

    it('mensagem de erro NÃO deve conter credenciais (usuário/senha hardcoded)', () => {
      // Extrair trecho ao redor do throw de LOCAL_DATABASE_URL
      const throwIdx = src.indexOf('LOCAL_DATABASE_URL não está definido');
      expect(throwIdx).not.toBe(-1);
      // Expandir ±500 chars ao redor
      const snippet = src.slice(Math.max(0, throwIdx - 50), throwIdx + 500);
      // Não deve conter senha hardcoded na mensagem de erro
      expect(snippet).not.toMatch(/postgres:123456/);
      expect(snippet).not.toMatch(/:\d{4,5}\/nr-bps_db['"]/);
    });

    it('mensagem de erro deve referenciar docs/policies/DATABASE_SETUP.md', () => {
      // A mensagem deve orientar o desenvolvedor para a documentação
      expect(src).toMatch(/DATABASE_SETUP\.md/);
    });

    it('mensagem de erro deve mencionar .env.local como arquivo a configurar', () => {
      expect(src).toMatch(/\.env\.local/);
    });
  });

  describe('Remoção de credenciais da mensagem de erro de isolamento', () => {
    it('NÃO deve sugerir URL com credenciais na mensagem ERRO CRÍTICO DE ISOLAMENTO', () => {
      // Antes: mensagem sugeria postgresql://postgres:123456@localhost:5432/nr-bps_db
      // Depois: referenciar apenas DATABASE_SETUP.md
      const isolationIdx = src.indexOf('ERRO CRÍTICO DE ISOLAMENTO');
      expect(isolationIdx).not.toBe(-1);
      // O trecho ao redor do erro de isolamento não deve ter a URL com senha
      const snippet = src.slice(isolationIdx, isolationIdx + 600);
      expect(snippet).not.toMatch(/postgres:123456/);
    });

    it('mensagem ERRO CRÍTICO DE ISOLAMENTO NÃO deve conter URL de banco hardcoded como sugestão', () => {
      const isolationIdx = src.indexOf('ERRO CRÍTICO DE ISOLAMENTO');
      const snippet = src.slice(isolationIdx, isolationIdx + 600);
      // Não deve ter: "para: postgresql://..."
      expect(snippet).not.toMatch(/para:\s*postgresql:\/\//);
    });

    it('mensagem ERRO CRÍTICO DE ISOLAMENTO deve referenciar DATABASE_SETUP.md', () => {
      // Orientar para documentação em vez de hardcode
      const isolationIdx = src.indexOf('ERRO CRÍTICO DE ISOLAMENTO');
      const snippet = src.slice(isolationIdx, isolationIdx + 600);
      expect(snippet).toMatch(/DATABASE_SETUP\.md/);
    });
  });

  describe('Comportamento ainda correto — sem regressões', () => {
    it('ainda tem proteção para Neon em testes (neon.tech)', () => {
      expect(src).toMatch(/neon\.tech/);
      expect(src).toMatch(/ERRO CRÍTICO DE SEGURANÇA/);
    });

    it('ainda tem throw para TEST_DATABASE_URL ausente em testes', () => {
      expect(src).toMatch(/TEST_DATABASE_URL não está definido/);
    });

    it('ainda tem throw para DATABASE_URL ausente em produção', () => {
      expect(src).toMatch(
        /DATABASE_URL não está definido para ambiente de produção/
      );
    });

    it('ainda exige LOCAL_DATABASE_URL em desenvolvimento (fail-fast)', () => {
      // Novo comportamento: throw em vez de fallback silencioso
      expect(src).toMatch(/LOCAL_DATABASE_URL não está definido/);
      // E o throw deve ocorrer DENTRO do bloco isDevelopment
      const devIdx = src.indexOf('if (isDevelopment)');
      expect(devIdx).not.toBe(-1);
      const throwLocalIdx = src.indexOf(
        'LOCAL_DATABASE_URL não está definido',
        devIdx
      );
      expect(throwLocalIdx).not.toBe(-1);
      expect(throwLocalIdx).toBeGreaterThan(devIdx);
    });

    it('ainda tem isolamento: LOCAL_DATABASE_URL apontando para _test lança ERRO CRÍTICO', () => {
      expect(src).toMatch(/ERRO CRÍTICO DE ISOLAMENTO/);
      // Deve ser um throw, não console.warn
      const isolationIdx = src.indexOf('ERRO CRÍTICO DE ISOLAMENTO');
      const segment = src.slice(Math.max(0, isolationIdx - 100), isolationIdx);
      expect(segment).toMatch(/throw new Error/);
    });
  });
});

// ─── Verificação de consistência nos outros módulos ──────────────────────────

describe('Módulos DB — nenhum tem return de URL hardcoded como fallback', () => {
  const modulesToCheck = [
    'lib/db/connection.ts',
    'lib/infrastructure/database/connection.ts',
  ];

  for (const modulePath of modulesToCheck) {
    it(`${modulePath} — NÃO contém return de URL com credenciais hardcoded`, () => {
      let src: string;
      try {
        src = readSource(modulePath);
      } catch {
        // Arquivo não existe — teste passa (nada a verificar)
        return;
      }
      expect(src).not.toMatch(
        /return\s*['"]postgresql:\/\/postgres:123456@localhost:5432\/nr-bps_db['"]/
      );
    });
  }
});
