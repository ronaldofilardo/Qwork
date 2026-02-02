/**
 * Testes de concorrência para criação de empresas clientes
 * Verifica que múltiplas requisições simultâneas com mesmo CNPJ
 * respeitam a constraint UNIQUE(clinica_id, cnpj)
 */

import { query } from '@/lib/db';
import { normalizeCNPJ } from '@/lib/validators';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import { POST as createEmpresa } from '@/app/api/rh/empresas/route';

// Mock de sessão para simular usuário autenticado
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({
    cpf: '12345678901',
    perfil: 'rh',
    clinica_id: 1,
  }),
  // getSession is synchronous in lib/session; use mockReturnValue to avoid returning a Promise
  getSession: jest.fn().mockReturnValue({
    cpf: '12345678901',
    perfil: 'rh',
    clinica_id: 1,
  }),
  requireRHWithEmpresaAccess: jest.fn().mockResolvedValue(true),
}));

describe('Testes de Concorrência - Empresas Clientes', () => {
  const testClinicaId = 1;
  const testCNPJ = '12345678000190';

  beforeAll(async () => {
    // Garantir que existe uma clínica de teste
    await query(
      `
      INSERT INTO clinicas (id, nome, cnpj, email, telefone, endereco, ativa)
      VALUES ($1, 'Clínica Teste Concorrência', '11111111000111', 'teste@clinica.com', '11999999999', 'Endereço Teste', true)
      ON CONFLICT (id) DO NOTHING
    `,
      [testClinicaId]
    );

    // Garantir que existe um usuário RH de teste com senha conhecida (123456)
    const senhaHash = await bcrypt.hash('123456', 10);
    await query(
      `
      INSERT INTO funcionarios (cpf, nome, senha_hash, perfil, clinica_id, ativo)
      VALUES ('12345678901', 'RH Teste', $1, 'rh', $2, true)
      ON CONFLICT (cpf) DO UPDATE SET clinica_id = $2, senha_hash = $1, ativo = true
    `,
      [senhaHash, testClinicaId]
    );
  });

  beforeEach(async () => {
    // Limpar empresas de teste antes de cada teste
    await query(
      'DELETE FROM empresas_clientes WHERE cnpj = $1 AND clinica_id = $2',
      [testCNPJ, testClinicaId]
    );
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM empresas_clientes WHERE clinica_id = $1', [
      testClinicaId,
    ]);
    await query('DELETE FROM funcionarios WHERE cpf = $1', ['12345678901']);
    await query('DELETE FROM clinicas WHERE id = $1', [testClinicaId]);
  });

  test('Deve rejeitar criações simultâneas com mesmo CNPJ na mesma clínica', async () => {
    // Preparar payloads de teste
    const empresaData = {
      nome: 'Empresa Teste Concorrência',
      cnpj: testCNPJ,
      email: 'teste@concorrencia.com',
      clinica_id: testClinicaId,
    };

    // Executar 5 chamadas internas ao handler POST em paralelo (evita depender do servidor dev)
    const promises = Array(5)
      .fill(null)
      .map(() =>
        createEmpresa(
          new Request('http://localhost/api/rh/empresas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empresaData),
          }) as any
        )
      );

    const results = await Promise.allSettled(promises);

    // Extrair respostas bem-sucedidas (NextResponse retornado)
    const fulfilled = results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);

      'Response statuses:',
      fulfilled.map((r: any) => r.status)
    );

    const successResults = fulfilled.filter((r: any) => r.status === 201);
    const conflictResults = fulfilled.filter((r: any) => r.status === 409);

    // Deve haver exatamente 1 sucesso e 4 conflitos
    expect(successResults.length).toBe(1);
    expect(conflictResults.length).toBe(4);

    // Verificar que apenas 1 registro foi criado no banco
    const dbCheck = await query(
      'SELECT COUNT(*) as count FROM empresas_clientes WHERE cnpj = $1 AND clinica_id = $2',
      [testCNPJ, testClinicaId]
    );
    expect(parseInt(dbCheck.rows[0].count)).toBe(1);

    expect(parseInt(dbCheck.rows[0].count)).toBe(1);
  }, 30000); // Timeout de 30s

  test('Deve permitir mesmo CNPJ em clínicas diferentes simultaneamente', async () => {
    // Criar segunda clínica
    const clinica2Id = 2;
    await query(
      `
      INSERT INTO clinicas (id, nome, cnpj, email, telefone, endereco, ativa)
      VALUES ($1, 'Clínica Teste 2', '22222222000222', 'teste2@clinica.com', '11888888888', 'Endereço Teste 2', true)
      ON CONFLICT (id) DO NOTHING
    `,
      [clinica2Id]
    );

    const empresaData1 = {
      nome: 'Empresa Clínica 1',
      cnpj: testCNPJ,
      clinica_id: testClinicaId,
    };

    const empresaData2 = {
      nome: 'Empresa Clínica 2',
      cnpj: testCNPJ,
      clinica_id: clinica2Id,
    };

    // Inserir diretamente no banco para simular criações simultâneas
    const promise1 = query(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [empresaData1.nome, empresaData1.cnpj, empresaData1.clinica_id]
    );

    const promise2 = query(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [empresaData2.nome, empresaData2.cnpj, empresaData2.clinica_id]
    );

    const results = await Promise.allSettled([promise1, promise2]);

    // Ambas devem ter sucesso
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('fulfilled');

    // Verificar registros no banco
    const dbCheck = await query(
      'SELECT COUNT(*) as count FROM empresas_clientes WHERE cnpj = $1',
      [testCNPJ]
    );
    expect(parseInt(dbCheck.rows[0].count)).toBeGreaterThanOrEqual(2);

    // Limpar
    await query('DELETE FROM empresas_clientes WHERE clinica_id = $1', [
      clinica2Id,
    ]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinica2Id]);
  }, 30000);

  test('Deve tratar race condition com normalização de CNPJ', async () => {
    // Testar variações de formatação
    const cnpjVariacoes = [
      '12.345.678/0001-90', // Formatado
      '12345678000190', // Normalizado
      '12 345 678 0001 90', // Com espaços
    ];

    const promises = cnpjVariacoes.map((cnpjVariacao) =>
      query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
         VALUES ($1, $2, $3)`,
        ['Empresa Variação', normalizeCNPJ(cnpjVariacao), testClinicaId]
      ).then(
        () => ({ success: true }),
        (error) => ({ success: false, error: error.code })
      )
    );

    const results = await Promise.allSettled(promises);

    // Apenas 1 deve ter sucesso, outros devem falhar com constraint violation
    const successCount = results.filter(
      (r: any) => r.status === 'fulfilled' && r.value.success
    ).length;
    const duplicateErrors = results.filter(
      (r: any) =>
        r.status === 'fulfilled' &&
        !r.value.success &&
        r.value.error === '23505'
    ).length;

    expect(successCount).toBe(1);
    expect(duplicateErrors).toBe(2);
  }, 30000);

  test('Deve manter integridade sob carga com transações', async () => {
    const baseCNPJ = '99999999000';

    // Criar 10 empresas diferentes simultaneamente
    const promises = Array(10)
      .fill(null)
      .map((_, index) => {
        const cnpj = `${baseCNPJ}${String(index).padStart(3, '0')}`;
        return query(
          `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
           VALUES ($1, $2, $3) RETURNING id`,
          [`Empresa ${index}`, cnpj, testClinicaId]
        );
      });

    const results = await Promise.allSettled(promises);

    // Todas devem ter sucesso (CNPJs diferentes)
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    expect(successCount).toBe(10);

    // Verificar contagem no banco
    const dbCheck = await query(
      'SELECT COUNT(*) as count FROM empresas_clientes WHERE clinica_id = $1 AND cnpj LIKE $2',
      [testClinicaId, `${baseCNPJ}%`]
    );
    expect(parseInt(dbCheck.rows[0].count)).toBe(10);

    // Limpar
    await query(
      'DELETE FROM empresas_clientes WHERE clinica_id = $1 AND cnpj LIKE $2',
      [testClinicaId, `${baseCNPJ}%`]
    );
  }, 30000);
});
