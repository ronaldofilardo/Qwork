/**
 * Teste de isolamento: Entidades x Clínicas
 * Garante que funcionários de entidades não aparecem em queries de clínica e vice-versa
 */

import { query } from '@/lib/db';

describe('Isolamento: Funcionários Entidade vs Clínica', () => {
  let tomadorId: number;
  let clinicaId: number;
  let empresaId: number;
  let cpfFuncEntidade: string;
  let cpfFuncClinica: string;

  beforeAll(async () => {
    // Criar tomador tipo entidade
    const tomadorRes = await query(
      `INSERT INTO tomadors (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa, pagamento_confirmado
      ) VALUES (
        'entidade', 'Entidade Teste Isolamento', '55666777000188',
        'isolamento@entidade.com', '1199998888', 'Rua Ent 123',
        'São Paulo', 'SP', '01000-000',
        'Resp Ent', '88877766655', 'resp@ent.com', '11988887777',
        true, true
      ) RETURNING id`,
      []
    );
    tomadorId = tomadorRes.rows[0].id;

    // Criar clínica (usar apenas colunas existentes)
    const clinicaRes = await query(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, ativa)
       VALUES ('Clínica Teste Isolamento', '77888999000166', 'clinica@isolamento.com',
               '1199997777', 'Rua Cli 456', true)
       RETURNING id`,
      []
    );
    clinicaId = clinicaRes.rows[0].id;

    // Criar empresa dentro da clínica
    const empresaRes = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id, ativa)
       VALUES ('Empresa Teste Isolamento', '99000111000122', $1, true)
       RETURNING id`,
      [clinicaId]
    );
    empresaId = empresaRes.rows[0].id;

    // Remover CPFs antigos caso existam (idempotência)
    await query('DELETE FROM funcionarios WHERE cpf IN ($1, $2)', [
      '11111111111',
      '22222222222',
    ]);

    // Criar funcionário vinculado à ENTIDADE (tomador_id, sem empresa/clinica)
    cpfFuncEntidade = '11111111111';
    await query(
      `INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, setor, funcao, nivel_cargo,
        tomador_id, empresa_id, clinica_id, ativo
      ) VALUES (
        $1, 'Func Entidade', 'func@entidade.com', 'hash123', 'funcionario',
        'TI', 'Desenvolvedor', 'operacional',
        $2, NULL, NULL, true
      )`,
      [cpfFuncEntidade, tomadorId]
    );

    // Criar funcionário vinculado à CLÍNICA/EMPRESA (empresa_id + clinica_id, sem tomador)
    cpfFuncClinica = '22222222222';
    await query(
      `INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, setor, funcao, nivel_cargo,
        tomador_id, empresa_id, clinica_id, ativo
      ) VALUES (
        $1, 'Func Clínica', 'func@clinica.com', 'hash456', 'funcionario',
        'RH', 'Analista', 'operacional',
        NULL, $2, $3, true
      )`,
      [cpfFuncClinica, empresaId, clinicaId]
    );
  });

  afterAll(async () => {
    // Cleanup
    await query('DELETE FROM funcionarios WHERE cpf = $1 OR cpf = $2', [
      cpfFuncEntidade,
      cpfFuncClinica,
    ]);
    await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    await query('DELETE FROM tomadors WHERE id = $1', [tomadorId]);
  });

  test('✅ Funcionário de entidade NÃO aparece em query de clínica/empresa', async () => {
    const result = await query(
      `SELECT cpf FROM funcionarios
       WHERE empresa_id = $1 AND clinica_id = $2 AND tomador_id IS NULL`,
      [empresaId, clinicaId]
    );

    const cpfs = result.rows.map((r) => r.cpf);
    expect(cpfs).toContain(cpfFuncClinica);
    expect(cpfs).not.toContain(cpfFuncEntidade);
  });

  test('✅ Funcionário de clínica NÃO aparece em query de entidade', async () => {
    const result = await query(
      `SELECT cpf FROM funcionarios
       WHERE tomador_id = $1 AND empresa_id IS NULL AND clinica_id IS NULL`,
      [tomadorId]
    );

    const cpfs = result.rows.map((r) => r.cpf);
    expect(cpfs).toContain(cpfFuncEntidade);
    expect(cpfs).not.toContain(cpfFuncClinica);
  });

  test('✅ Constraint permite funcionário com tomador_id (sem empresa/clinica)', async () => {
    // Tentar inserir funcionário válido de entidade
    const cpfTest = '33333333333';
    await expect(
      query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, tomador_id, empresa_id, clinica_id, nivel_cargo, ativo)
         VALUES ($1, 'Func Teste', 'teste@ent.com', 'hash', 'funcionario', $2, NULL, NULL, 'operacional', true)`,
        [cpfTest, tomadorId]
      )
    ).resolves.not.toThrow();

    // Cleanup
    await query('DELETE FROM funcionarios WHERE cpf = $1', [cpfTest]);
  });

  test('✅ Constraint permite funcionário com empresa_id+clinica_id (sem tomador)', async () => {
    // Tentar inserir funcionário válido de clínica (idempotente: remover CPF antes)
    const cpfTest = '44444444444';
    await query('DELETE FROM funcionarios WHERE cpf = $1', [cpfTest]);
    await expect(
      query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, tomador_id, empresa_id, clinica_id, nivel_cargo, ativo)
         VALUES ($1, 'Func Teste Cli', 'teste@cli.com', 'hash', 'funcionario', NULL, $2, $3, 'operacional', true)`,
        [cpfTest, empresaId, clinicaId]
      )
    ).resolves.not.toThrow();

    // Cleanup
    await query('DELETE FROM funcionarios WHERE cpf = $1', [cpfTest]);
  });

  test('❌ Constraint REJEITA funcionário sem tomador_id nem clinica_id (exceto perfis especiais)', async () => {
    const cpfInvalido = '55555555555';

    // Deve falhar para perfil funcionario sem vínculos
    await expect(
      query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, tomador_id, empresa_id, clinica_id, nivel_cargo, ativo)
         VALUES ($1, 'Func Inválido', 'invalido@test.com', 'hash', 'funcionario', NULL, NULL, NULL, 'operacional', true)`,
        [cpfInvalido]
      )
    ).rejects.toThrow();
  });
});
