/**
 * Teste de integração: Criar funcionário para entidade
 * Valida as correções aplicadas em 23/01/2026:
 * - Constraint funcionarios_clinica_check aceita contratante_id
 * - Funcionários podem ser vinculados diretamente a entidades
 */

import { query } from '@/lib/db';

describe('Integration: Criar funcionário para entidade', () => {
  const testCpf = '71188557099'; // CPF válido para teste
  let contratanteId: number;

  beforeAll(async () => {
    // Validar ambiente de teste
    if (!process.env.TEST_DATABASE_URL || !String(process.env.TEST_DATABASE_URL).includes('_test')) {
      throw new Error('TEST_DATABASE_URL não configurado para testes de integração');
    }

    // Criar contratante de teste tipo entidade
    const cnpj = `88${Date.now().toString().slice(-12)}`;
    const res = await query(`
      INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
      VALUES ('entidade', 'Entidade Integration Test', $1, 'int@test.com', '11900000000', 'Rua Test, 1', 'São Paulo', 'SP', '01000-000', 'Responsavel Test', '52998224725', 'resp@test.com', '11911111111', true, true)
      RETURNING id
    `, [cnpj]);
    contratanteId = res.rows[0].id;

    // Limpar funcionário de teste se existir
    await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
  });

  it('✅ deve criar funcionário vinculado diretamente à entidade (contratante_id)', async () => {
    const result = await query(`
      INSERT INTO funcionarios (cpf, nome, data_nascimento, setor, funcao, email, contratante_id, perfil, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'funcionario', true)
      RETURNING id, cpf, nome, contratante_id, clinica_id, empresa_id
    `, [testCpf, 'Funcionario Entidade Test', '1990-01-01', 'RH', 'Assistente', 'func.int@test.com', contratanteId]);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].cpf).toBe(testCpf);
    expect(result.rows[0].contratante_id).toBe(contratanteId);
    expect(result.rows[0].clinica_id).toBeNull();
    expect(result.rows[0].empresa_id).toBeNull();
  });

  it('✅ constraint funcionarios_clinica_check deve aceitar contratante_id OR clinica_id', async () => {
    // Verificar constraint
    const constraintCheck = await query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'funcionarios_clinica_check'
    `);

    expect(constraintCheck.rows.length).toBeGreaterThan(0);
    const definition = constraintCheck.rows[0].definition;

    // Deve aceitar clinica_id OR contratante_id OR perfis específicos
    expect(definition).toMatch(/clinica_id IS NOT NULL.*OR.*contratante_id IS NOT NULL/i);
  });

  it('✅ deve rejeitar funcionário sem clinica_id, contratante_id e perfil não especial', async () => {
    await expect(
      query(`
        INSERT INTO funcionarios (cpf, nome, data_nascimento, setor, funcao, email, perfil, ativo)
        VALUES ('11122233399', 'Invalid Test', '1990-01-01', 'RH', 'Test', 'invalid@test.com', 'funcionario', true)
      `)
    ).rejects.toThrow();
  });
});
