import { query } from '@/lib/db';

describe('Constraint funcionarios_clinica_id_check', () => {
  test('permite perfis especiais com clinica_id NULL', async () => {
    // Testar inserção de funcionário com perfil 'gestao' e clinica_id NULL
    const insertQuery = `
      INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, contratante_id, ativo
      ) VALUES (
        '11111111111',
        'Gestor Teste',
        'gestor@teste.com',
        '$2a$10$test.hash',
        'gestao',
        1,
        true
      )
    `;

    await expect(query(insertQuery)).resolves.not.toThrow();

    // Limpar dados de teste
    await query("DELETE FROM funcionarios WHERE cpf = '11111111111'");
  });

  test('permite perfis especiais com ambos NULL', async () => {
    // Testar inserção de funcionário com perfil 'rh' e ambos NULL (durante exclusão)
    const insertQuery = `
      INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, ativo
      ) VALUES (
        '22222222222',
        'RH Teste',
        'rh@teste.com',
        '$2a$10$test.hash',
        'rh',
        true
      )
    `;

    await expect(query(insertQuery)).resolves.not.toThrow();

    // Limpar dados de teste
    await query("DELETE FROM funcionarios WHERE cpf = '22222222222'");
  });

  test('rejeita funcionários comuns sem clinica_id ou contratante_id', async () => {
    // Testar inserção de funcionário comum sem clinica_id nem contratante_id deve falhar
    const insertQuery = `
      INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, ativo
      ) VALUES (
        '33333333333',
        'Funcionário Teste',
        'func@teste.com',
        '$2a$10$test.hash',
        'funcionario',
        true
      )
    `;

    await expect(query(insertQuery)).rejects.toThrow(
      /viola a restrição de verificação "funcionarios_clinica_check"/
    );
  });

  test('permite funcionários comuns com clinica_id', async () => {
    // Testar inserção de funcionário comum com clinica_id deve passar
    const insertQuery = `
      INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, clinica_id, ativo
      ) VALUES (
        '44444444444',
        'Funcionário Teste',
        'func@teste.com',
        '$2a$10$test.hash',
        'funcionario',
        1,
        true
      )
    `;

    await expect(query(insertQuery)).resolves.not.toThrow();

    // Limpar dados de teste
    await query("DELETE FROM funcionarios WHERE cpf = '44444444444'");
  });

  test('permite funcionário com contratante_id (entidade)', async () => {
    // Criar contratante temporário
    const contratanteRes = await query(`
      INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
      VALUES ('entidade', 'Test Entidade', '12345678000100', 'ent@test.com', '11900000000', 'Rua Test', 'SP', 'SP', '01000-000', 'Resp', '11111111111', 'resp@test.com', '11900000000', true, true)
      RETURNING id
    `);
    const contratanteId = contratanteRes.rows[0].id;

    const insertQuery = `
      INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, contratante_id, ativo
      ) VALUES (
        '55555555555',
        'Funcionário Entidade',
        'func.ent@teste.com',
        '$2a$10$test.hash',
        'funcionario',
        ${contratanteId},
        true
      )
    `;

    await expect(query(insertQuery)).resolves.not.toThrow();

    // Limpar dados de teste
    await query("DELETE FROM funcionarios WHERE cpf = '55555555555'");
    await query(`DELETE FROM contratantes WHERE id = ${contratanteId}`);
  });

  test('verifica estrutura do constraint atualizada', async () => {
    const result = await query(`
      SELECT conname as constraint_name, pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conname = 'funcionarios_clinica_check'
        AND conrelid = 'funcionarios'::regclass
    `);

    expect(result.rows).toHaveLength(1);
    const constraint = result.rows[0].constraint_definition;
    // Constraint deve aceitar clinica_id OR contratante_id OR perfis especiais
    expect(constraint).toMatch(
      /clinica_id IS NOT NULL.*OR.*contratante_id IS NOT NULL|contratante_id IS NOT NULL.*OR.*clinica_id IS NOT NULL/i
    );
    expect(constraint).toContain('clinica_id IS NOT NULL');
    expect(constraint).toContain('contratante_id IS NOT NULL');
  });
});
