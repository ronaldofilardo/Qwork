import fs from 'fs';
import path from 'path';

describe('Forçar troca de senha no primeiro login (specs)', () => {
  test('migration deve definir coluna primeira_senha_alterada BOOLEAN DEFAULT false', () => {
    const migrationPath = path.join(
      process.cwd(),
      'database/migration-002-gestor-entidade.sql'
    );
    const content = fs.readFileSync(migrationPath, 'utf-8');

    expect(content).toContain('primeira_senha_alterada BOOLEAN DEFAULT false');
    expect(content).toContain(
      "COMMENT ON COLUMN contratantes_senhas.primeira_senha_alterada IS 'Flag para forçar alteração de senha no primeiro acesso'"
    );
  });

  test.skip('login deve redirecionar para troca de senha no primeiro acesso (a implementar)', () => {
    /**
     * Especificação esperada (deve ser implementada assim que a feature for
     * adicionada):
     * - Quando o registro em contratantes_senhas tiver `primeira_senha_alterada = false`,
     *   a API de login deve retornar `redirectTo: '/trocar-senha'` ao invés de '/entidade'.
     * - Após troca de senha bem sucedida, a flag deve ser atualizada para true.
     */
  });
});
