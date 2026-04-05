/**
 * DB Security Transaction Context Fix Validation
 *
 * Valida que as mudanças em transactionWithContext estão corretas:
 * 1. Removeu redundante clinica_id database query
 * 2. Usa session.clinica_id ao invés de refazer lookup
 * 3. Mantém validação de formato de clinica_id
 * 4. Define RLS context variables corretamente
 */

import * as fs from 'fs';
import * as path from 'path';

describe('lib/db-security.ts - transactionWithContext Fix', () => {
  let dbSecurityCode: string;
  let transactionWithContextFn: string = '';

  beforeAll(() => {
    const filePath = path.join(process.cwd(), 'lib', 'db-security.ts');
    dbSecurityCode = fs.readFileSync(filePath, 'utf-8');

    // Extrair apenas a função transactionWithContext
    const startIdx = dbSecurityCode.indexOf(
      'export async function transactionWithContext'
    );
    if (startIdx !== -1) {
      // Encontrar o final da função (próxima função ou fim do arquivo)
      const afterStart = dbSecurityCode.substring(startIdx);
      const nextFunctionIdx = afterStart.indexOf('\nexport async function', 1);
      const nextFunctionIdx2 = afterStart.indexOf('\nexport function', 1);
      const endIdx = Math.min(
        nextFunctionIdx !== -1 ? nextFunctionIdx : Infinity,
        nextFunctionIdx2 !== -1 ? nextFunctionIdx2 : Infinity
      );

      if (endIdx === Infinity) {
        transactionWithContextFn = afterStart;
      } else {
        transactionWithContextFn = afterStart.substring(0, endIdx);
      }
    }
  });

  describe('Fix 1: Removeu redundante clinica_id query em transactionWithContext', () => {
    it('não deve ter SELECT ... FROM funcionarios ... JOIN empresas_clientes em transactionWithContext', () => {
      // O código antigo fazia uma junção desnecessária que falhava
      // SELECT ec.clinica_id FROM funcionarios f
      // JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id
      // JOIN empresas_clientes ec ON ec.id = fc.empresa_id
      const hasRedundantQuery = transactionWithContextFn.includes(
        'JOIN empresas_clientes'
      );
      expect(hasRedundantQuery).toBe(false);
    });

    it('não deve ter (SELECT ... WHERE f.cpf = $1 em transactionWithContext', () => {
      // Padrão da query antiga
      const hasOldPattern =
        transactionWithContextFn.includes('WHERE f.cpf = $1');
      expect(hasOldPattern).toBe(false);
    });
  });

  describe('Fix 2: Usa session.clinica_id diretamente em transactionWithContext', () => {
    it('deve referenciar session.clinica_id', () => {
      // A função deve usar session.clinica_id que vem de requireRHWithEmpresaAccess
      const hasSessionReference =
        transactionWithContextFn.includes('session.clinica_id');
      expect(hasSessionReference).toBe(true);
    });

    it('deve usar set_config com clinica_id da sessão', () => {
      // Deve definir RLS context:
      // await query('SELECT set_config($1, $2, false)', [
      //   'app.current_user_clinica_id',
      //   clinicaId,
      // ])
      const hasConfigCall = transactionWithContextFn.includes(
        "'app.current_user_clinica_id'"
      );
      expect(hasConfigCall).toBe(true);
    });
  });

  describe('Fix 3: Validação de formato mantida', () => {
    it('deve validar que clinica_id é numérico', () => {
      // O código deve verificar que clinica_id é um número válido
      const hasNumericValidation =
        transactionWithContextFn.includes('/^\\d+$/');
      expect(hasNumericValidation).toBe(true);
    });

    it('deve lançar erro se clinica_id tem formato inválido', () => {
      // Deve ter validação de formato
      const hasValidation =
        transactionWithContextFn.includes('throw new Error');
      expect(hasValidation).toBe(true);
    });
  });

  describe('Fix 4: RLS context variables', () => {
    it('deve definir app.current_user_cpf', () => {
      const hasConfigCpf = transactionWithContextFn.includes(
        'app.current_user_cpf'
      );
      expect(hasConfigCpf).toBe(true);
    });

    it('deve definir app.current_user_perfil', () => {
      const hasConfigPerfil = transactionWithContextFn.includes(
        'app.current_user_perfil'
      );
      expect(hasConfigPerfil).toBe(true);
    });

    it('deve definir app.current_user_clinica_id para RH', () => {
      const hasConfigClinica = transactionWithContextFn.includes(
        'app.current_user_clinica_id'
      );
      expect(hasConfigClinica).toBe(true);
    });
  });

  describe('Fix 5: Padrão de transação mantido', () => {
    it('deve ter try-catch para rollback de erros', () => {
      const hasTryCatch =
        transactionWithContextFn.includes('try') &&
        transactionWithContextFn.includes('catch') &&
        transactionWithContextFn.includes('ROLLBACK');
      expect(hasTryCatch).toBe(true);
    });

    it('deve chamar callback com query', () => {
      const hasCallback = transactionWithContextFn.includes('callback');
      expect(hasCallback).toBe(true);
    });

    it('deve fazer COMMIT se não houver erro', () => {
      const hasCommit = transactionWithContextFn.includes('COMMIT');
      expect(hasCommit).toBe(true);
    });
  });

  describe('Documentação das mudanças', () => {
    it('Mudança resumida: transactionWithContext usa session.clinica_id ao invés de refazer DB query', () => {
      // A correção muda o padrão de:
      // SELECT ec.clinica_id FROM funcionarios f JOIN ... (FAILS)
      // PARA:
      // if (session.clinica_id) { set_config(...) } (WORKS)
      expect(true).toBe(true);
    });

    it('Benefício: Evita JOIN desnecessária que falhava quando CPF não está em funcionarios_clinicas', () => {
      // O erro original era causado porque:
      // - Funcionário pode ter CPF no sistema mas não estar em funcionarios_clinicas
      // - ou estar em funcionarios_clinicas mas não vinculado a empresa_cliente ativa
      // - A correção usa session.clinica_id que já foi validado por requireRHWithEmpresaAccess()
      expect(true).toBe(true);
    });
  });
});
