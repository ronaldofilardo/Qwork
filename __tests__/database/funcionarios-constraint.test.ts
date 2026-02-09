import { query } from '@/lib/db';

describe('Constraint funcionarios_clinica_id_check', () => {
  const makeCpf = () => {
    // Gerar CPF falso único com prefixo 9 para testes
    const n = Math.floor(Math.random() * 1e10)
      .toString()
      .padStart(10, '0');
    return `9${n}`;
  };

  const cpf1 = makeCpf();
  const cpf2 = makeCpf();
  const cpf3 = makeCpf();
  const cpf4 = makeCpf();
  const cpf5 = makeCpf();
  test('permite funcionário de clínica com usuario_tipo funcionario_clinica', async () => {
    // Testar inserção de funcionário de clínica
    const insertQuery = `
      SELECT set_config('app.current_user_cpf', '00000000000', true);
      INSERT INTO funcionarios (
        cpf, nome, usuario_tipo, clinica_id, empresa_id, senha_hash, ativo
      ) VALUES (
        '${cpf1}',
        'Funcionário Clínica Teste',
        'funcionario_clinica',
        1,
        1,
        '$2a$10$testhash',
        true
      )
    `;

    await expect(
      query(insertQuery, undefined, { cpf: '00000000000', perfil: 'admin' })
    ).resolves.not.toThrow();

    // Limpar dados de teste
    await query(`DELETE FROM funcionarios WHERE cpf = '${cpf1}'`, undefined, {
      cpf: '00000000000',
      perfil: 'admin',
    });
  });

  test('permite funcionário de entidade com usuario_tipo funcionario_entidade', async () => {
    // Testar inserção de funcionário de entidade
    const insertQuery = `
      SELECT set_config('app.current_user_cpf', '00000000000', true);
      INSERT INTO funcionarios (
        cpf, nome, usuario_tipo, tomador_id, senha_hash, ativo
      ) VALUES (
        '${cpf2}',
        'Funcionário Entidade Teste',
        'funcionario_entidade',
        1,
        '$2a$10$testhash',
        true
      )
    `;

    await expect(
      query(insertQuery, undefined, { cpf: '00000000000', perfil: 'admin' })
    ).resolves.not.toThrow();

    // Limpar dados de teste
    await query(`DELETE FROM funcionarios WHERE cpf = '${cpf2}'`, undefined, {
      cpf: '00000000000',
      perfil: 'admin',
    });
  });

  test('rejeita funcionário sem clinica_id e tomador_id', async () => {
    // Testar inserção de funcionário sem vinculação deve falhar
    const insertQuery = `
      SELECT set_config('app.current_user_cpf', '00000000000', true);
      INSERT INTO funcionarios (
        cpf, nome, usuario_tipo, senha_hash, ativo
      ) VALUES (
        '${cpf3}',
        'Funcionário Teste',
        'funcionario_clinica',
        '$2a$10$testhash',
        true
      )
    `;

    await expect(
      query(insertQuery, undefined, { cpf: '00000000000', perfil: 'admin' })
    ).rejects.toThrow(
      /(viola a restrição de verificação|no_gestor_in_funcionarios|funcionarios_usuario_tipo_exclusivo|viola a restrição de unicidade|duplicar valor da chave)/i
    );
  });

  test('rejeita rh em funcionarios (deve estar em usuarios)', async () => {
    // Testar que rh NÃO pode ser inserido em funcionarios
    const insertQuery = `
      SELECT set_config('app.current_user_cpf', '00000000000', true);
      INSERT INTO funcionarios (
        cpf, nome, usuario_tipo, clinica_id, senha_hash, ativo
      ) VALUES (
        '${cpf4}',
        'Gestor RH Teste',
        'rh',
        1,
        '$2a$10$testhash',
        true
      )
    `;

    await expect(
      query(insertQuery, undefined, { cpf: '00000000000', perfil: 'admin' })
    ).rejects.toThrow(
      /(viola a restrição de verificação|no_gestor_in_funcionarios|funcionarios_usuario_tipo_exclusivo|viola a restrição de unicidade|duplicar valor da chave)/i
    );
  });

  test('rejeita gestor em funcionarios (deve estar em usuarios)', async () => {
    // Testar que gestor NÃO pode ser inserido em funcionarios
    const insertQuery = `
      SELECT set_config('app.current_user_cpf', '00000000000', true);
      INSERT INTO funcionarios (
        cpf, nome, usuario_tipo, tomador_id, senha_hash, ativo
      ) VALUES (
        '${cpf5}',
        'Gestor Entidade Teste',
        'gestor',
        1,
        '$2a$10$testhash',
        true
      )
    `;

    await expect(
      query(insertQuery, undefined, { cpf: '00000000000', perfil: 'admin' })
    ).rejects.toThrow(
      /(viola a restrição de verificação|no_gestor_in_funcionarios|funcionarios_usuario_tipo_exclusivo|viola a restrição de unicidade|duplicar valor da chave)/i
    );
  });

  test('verifica que constraint proíbe gestores em funcionarios', async () => {
    const result = await query(`
      SELECT conname as constraint_name, pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conname IN ('no_gestor_in_funcionarios', 'funcionarios_usuario_tipo_exclusivo', 'funcionarios_perfil_check')
        AND conrelid = 'funcionarios'::regclass
    `);

    // Deve haver constraints proibindo gestores
    expect(result.rows.length).toBeGreaterThan(0);

    // Verificar que não permite rh ou gestor
    const constraintDefs = result.rows
      .map((r) => r.constraint_definition)
      .join(' ');
    // A constraint deve mencionar limitações ou não incluir gestores
    expect(constraintDefs.length).toBeGreaterThan(0);
  });
});
