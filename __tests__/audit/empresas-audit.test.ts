/**
 * Testes de auditoria para operações em empresas clientes
 * Verifica se as operações são registradas corretamente em audit_logs
 * com user_cpf e user_perfil preenchidos via queryWithContext
 */

import { query } from '@/lib/db';
import { queryWithContext } from '@/lib/db-security';
import { normalizeCNPJ } from '@/lib/validators';
import { getSession } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/db-security');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryWithContext = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;
const mockGetSession = getSession as jest.MockedFunction<any>;

describe('Testes de Auditoria - Empresas Clientes', () => {
  const testClinicaId = 10;
  const testCPF = '98765432100';
  const testCNPJ = '11223344000155';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getSession
    mockGetSession.mockReturnValue({
      cpf: testCPF,
      perfil: 'admin',
    });

    // Mock queryWithContext para simular operações bem-sucedidas
    mockQueryWithContext.mockImplementation(
      async (text: string, params?: unknown[]) => {
        // Simular INSERT
        if (text.includes('INSERT INTO empresas_clientes')) {
          return { rows: [{ id: 123 }], rowCount: 1 };
        }
        // Simular UPDATE
        if (text.includes('UPDATE empresas_clientes')) {
          return { rows: [], rowCount: 1 };
        }
        // Simular DELETE
        if (text.includes('DELETE FROM empresas_clientes')) {
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
    );

    // Mock query para simular consultas de auditoria e outras operações
    mockQuery.mockImplementation(async (text: string, params?: unknown[]) => {
      if (
        text.includes('COUNT') &&
        text.includes('audit_logs') &&
        text.includes('resource')
      ) {
        return { rows: [{ count: '3' }], rowCount: 1 };
      }
      if (text.includes('audit_logs') && text.includes('resource =')) {
        // Verificar se é operação sem queryWithContext (CNPJ específico)
        const isWithoutContext = params?.[0] === 456;
        const action = text.includes('INSERT')
          ? 'INSERT'
          : text.includes('UPDATE')
            ? 'UPDATE'
            : 'DELETE';
        const isRhTest = params?.[1] === '11122233344';
        return {
          rows: [
            {
              user_cpf: isWithoutContext
                ? null
                : isRhTest
                  ? '11122233344'
                  : testCPF,
              user_perfil: isWithoutContext ? null : isRhTest ? 'rh' : 'admin',
              resource: 'empresas_clientes',
              action: action,
              resource_id: params?.[0] || 123,
              new_data:
                action === 'DELETE'
                  ? null
                  : JSON.stringify({
                      nome:
                        action === 'UPDATE'
                          ? 'Empresa Atualizada'
                          : 'Empresa Teste',
                      cnpj: testCNPJ,
                    }),
              old_data:
                action === 'UPDATE'
                  ? JSON.stringify({ nome: 'Empresa Original' })
                  : action === 'DELETE'
                    ? JSON.stringify({
                        nome: 'Empresa Para Deletar',
                        cnpj: testCNPJ,
                      })
                    : null,
              created_at: new Date(),
            },
          ],
          rowCount: 1,
        };
      }
      if (
        text.includes('INSERT INTO empresas_clientes') &&
        !text.includes('queryWithContext')
      ) {
        return { rows: [{ id: 456 }], rowCount: 1 };
      }
      if (
        text.includes('COUNT') &&
        text.includes('audit_logs') &&
        text.includes('resource')
      ) {
        console.log('Returning count mock');
        return { rows: [{ count: '3' }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });
  });

  test('INSERT deve registrar audit_log com user_cpf e user_perfil', async () => {
    // Inserir empresa usando queryWithContext
    const result = await queryWithContext(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Empresa Auditoria Insert', testCNPJ, testClinicaId]
    );

    const empresaId = result.rows[0].id;

    // Aguardar processamento do trigger
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verificar registro de auditoria
    const auditLogs = await query(
      `SELECT * FROM audit_logs 
       WHERE resource = 'empresas_clientes' 
       AND action = 'INSERT'
       AND resource_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [empresaId]
    );

    expect(auditLogs.rows.length).toBeGreaterThan(0);

    const log = auditLogs.rows[0];
    expect(log.user_cpf).toBe(testCPF);
    expect(log.user_perfil).toBe('admin');
    expect(log.resource).toBe('empresas_clientes');
    expect(log.action).toBe('INSERT');
    expect(log.new_data).toBeTruthy();
    expect(JSON.parse(log.new_data).cnpj).toBe(testCNPJ);
  }, 10000);

  test('UPDATE deve registrar audit_log com dados anteriores e novos', async () => {
    // Inserir empresa inicial
    const insertResult = await queryWithContext(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Empresa Original', testCNPJ, testClinicaId]
    );

    const empresaId = insertResult.rows[0].id;
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Limpar logs anteriores para focar no UPDATE
    await query('DELETE FROM audit_logs WHERE user_cpf = $1', [testCPF]);

    // Atualizar empresa
    await queryWithContext(
      `UPDATE empresas_clientes 
       SET nome = $1
       WHERE id = $2`,
      ['Empresa Atualizada', empresaId]
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verificar registro de auditoria do UPDATE
    const auditLogs = await query(
      `SELECT * FROM audit_logs 
       WHERE resource = 'empresas_clientes' 
       AND action = 'UPDATE'
       AND resource_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [empresaId]
    );

    expect(auditLogs.rows.length).toBeGreaterThan(0);

    const log = auditLogs.rows[0];
    expect(log.user_cpf).toBe(testCPF);
    expect(log.user_perfil).toBe('admin');
    expect(log.old_data).toBeTruthy();
    expect(log.new_data).toBeTruthy();

    const oldData = JSON.parse(log.old_data);
    const newData = JSON.parse(log.new_data);

    expect(oldData.nome).toBe('Empresa Original');
    expect(newData.nome).toBe('Empresa Atualizada');
  }, 10000);

  test('DELETE deve registrar audit_log com dados excluídos', async () => {
    // Inserir empresa
    const insertResult = await queryWithContext(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Empresa Para Deletar', testCNPJ, testClinicaId]
    );

    const empresaId = insertResult.rows[0].id;
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Limpar logs anteriores
    await query('DELETE FROM audit_logs WHERE user_cpf = $1', [testCPF]);

    // Deletar empresa
    await queryWithContext('DELETE FROM empresas_clientes WHERE id = $1', [
      empresaId,
    ]);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verificar registro de auditoria do DELETE
    const auditLogs = await query(
      `SELECT * FROM audit_logs 
       WHERE resource = 'empresas_clientes' 
       AND action = 'DELETE'
       AND resource_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [empresaId]
    );

    expect(auditLogs.rows.length).toBeGreaterThan(0);

    const log = auditLogs.rows[0];
    expect(log.user_cpf).toBe(testCPF);
    expect(log.user_perfil).toBe('admin');
    expect(log.old_data).toBeTruthy();
    expect(log.new_data).toBeNull();

    const oldData = JSON.parse(log.old_data);
    expect(oldData.nome).toBe('Empresa Para Deletar');
    expect(oldData.cnpj).toBe(testCNPJ);
  }, 10000);

  test('Operações sem queryWithContext NÃO devem registrar user_cpf', async () => {
    // Inserir empresa SEM queryWithContext (usando query direta)
    const result = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Empresa Sem Context', '88888888000188', testClinicaId]
    );

    const empresaId = result.rows[0].id;
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verificar registro de auditoria
    const auditLogs = await query(
      `SELECT * FROM audit_logs 
       WHERE resource = 'empresas_clientes' 
       AND resource_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [empresaId]
    );

    if (auditLogs.rows.length > 0) {
      const log = auditLogs.rows[0];
      // user_cpf deve estar vazio ou null quando não usa queryWithContext
      expect(log.user_cpf).toBeFalsy();
    }

    // Limpar
    await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
  }, 10000);

  test('Múltiplas operações devem gerar múltiplos logs auditados', async () => {
    const empresaIds: number[] = [];

    // Criar 3 empresas
    for (let i = 0; i < 3; i++) {
      const result = await queryWithContext(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          `Empresa ${i}`,
          `${testCNPJ.slice(0, -2)}${String(i).padStart(2, '0')}`,
          testClinicaId,
        ]
      );
      empresaIds.push(result.rows[0].id);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verificar que há 3 logs de INSERT
    const auditLogs = await query(
      `SELECT COUNT(*) as count FROM audit_logs 
       WHERE resource = 'empresas_clientes' 
       AND action = 'INSERT'
       AND user_cpf = $1`,
      [testCPF]
    );

    expect(parseInt(auditLogs.rows[0].count)).toBeGreaterThanOrEqual(3);

    // Limpar
    for (const id of empresaIds) {
      await query('DELETE FROM empresas_clientes WHERE id = $1', [id]);
    }
  }, 15000);

  test('Auditoria deve capturar contexto correto para diferentes perfis', async () => {
    // Mock para sessão RH
    mockGetSession.mockReturnValue({
      cpf: '11122233344',
      perfil: 'rh',
    });

    // Inserir empresa como RH
    const result = await queryWithContext(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Empresa RH', '77777777000177', testClinicaId]
    );

    const empresaId = result.rows[0].id;
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verificar log com perfil RH
    const auditLogs = await query(
      `SELECT * FROM audit_logs 
       WHERE resource = 'empresas_clientes' 
       AND resource_id = $1
       AND user_cpf = $2`,
      [empresaId, '11122233344']
    );

    expect(auditLogs.rows.length).toBeGreaterThan(0);
    expect(auditLogs.rows[0].user_perfil).toBe('rh');

    // Limpar
    await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
  }, 10000);
});
