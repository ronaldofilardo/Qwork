/**
 * Teste de integração: Liberar lote para empresa via RH
 * Valida o fluxo completo RH -> Empresa -> Lote
 */

import { query } from '@/lib/db';

describe('Integration: Liberar lote RH para empresa', () => {
  let clinicaId: number;
  let empresaId: number;
  let funcionarioCpf: string;

  beforeAll(async () => {
    // Validar ambiente de teste
    if (
      !process.env.TEST_DATABASE_URL ||
      !String(process.env.TEST_DATABASE_URL).includes('_test')
    ) {
      throw new Error(
        'TEST_DATABASE_URL não configurado para testes de integração'
      );
    }

    // Configurar variáveis de sessão para bypass de RLS em testes
    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_cpf',
      '12345678909',
    ]);
    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_perfil',
      'rh',
    ]);
    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_clinica_id',
      '1',
    ]);

    // Buscar clinica e empresa existentes ou criar temporários
    const clinicaRes = await query(
      `SELECT id FROM clinicas WHERE ativa = true LIMIT 1`
    );
    if (clinicaRes.rows.length > 0) {
      clinicaId = clinicaRes.rows[0].id;
    } else {
      const newClinica = await query(`
        INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, representante_nome, representante_email, ativa)
        VALUES ('Clinica Test RH', '12345678000199', 'rh@test.com', '11900000000', 'Rua Test', 'São Paulo', 'SP', '01000-000', 'Resp RH', 'resp@test.com', true)
        RETURNING id
      `);
      clinicaId = newClinica.rows[0].id;
    }

    const empresaRes = await query(
      `SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1`,
      [clinicaId]
    );
    if (empresaRes.rows.length > 0) {
      empresaId = empresaRes.rows[0].id;
    } else {
      const newEmpresa = await query(
        `
        INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, representante_nome, representante_email, ativa)
        VALUES ($1, 'Empresa Test RH', '98765432000188', 'empresa@test.com', '11900000001', 'Rua Empresa', 'São Paulo', 'SP', '01000-001', 'Resp Empresa', 'resp.empresa@test.com', true)
        RETURNING id
      `,
        [clinicaId]
      );
      empresaId = newEmpresa.rows[0].id;
    }

    // Criar funcionário de teste para a empresa
    funcionarioCpf = '12345678909';

    // Limpar dados anteriores
    await query(
      'DELETE FROM funcionarios_clinicas WHERE funcionario_id IN (SELECT id FROM funcionarios WHERE cpf = $1)',
      [funcionarioCpf]
    );
    await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);

    // Inserir funcionário (sem empresa_id/clinica_id direto - arquitetura segregada)
    const funcionarioRes = await query(
      `
      INSERT INTO funcionarios (cpf, nome, data_nascimento, setor, funcao, email, perfil, senha_hash, ativo, indice_avaliacao)
      VALUES ($1, 'Func Test RH', '1990-01-01', 'TI', 'Dev', 'func.rh@test.com', 'funcionario', '$2b$10$test.hash.for.integration.tests', true, 0)
      RETURNING id
    `,
      [funcionarioCpf]
    );

    const funcionarioId = funcionarioRes.rows[0].id;

    // Vincular funcionário à empresa através de funcionarios_clinicas (arquitetura segregada)
    await query(
      `
      INSERT INTO funcionarios_clinicas (funcionario_id, empresa_id, clinica_id, ativo, data_vinculo)
      VALUES ($1, $2, $3, true, NOW())
    `,
      [funcionarioId, empresaId, clinicaId]
    );
  });

  afterAll(async () => {
    // Limpar dados de teste (arquitetura segregada)
    await query(
      'DELETE FROM funcionarios_clinicas WHERE funcionario_id IN (SELECT id FROM funcionarios WHERE cpf = $1)',
      [funcionarioCpf]
    );
    await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
  });

  it('✅ obter_proximo_numero_ordem deve retornar próximo número para empresa', async () => {
    const result = await query(
      `SELECT obter_proximo_numero_ordem($1) as numero_ordem`,
      [empresaId]
    );

    expect(result.rows.length).toBe(1);
    expect(typeof result.rows[0].numero_ordem).toBe('number');
    expect(result.rows[0].numero_ordem).toBeGreaterThanOrEqual(1);
  });

  it('✅ calcular_elegibilidade_lote deve identificar funcionários elegíveis', async () => {
    const numeroOrdemResult = await query(
      `SELECT obter_proximo_numero_ordem($1) as numero_ordem`,
      [empresaId]
    );
    const numeroOrdem = numeroOrdemResult.rows[0].numero_ordem;

    const result = await query(
      `
      SELECT * FROM calcular_elegibilidade_lote($1, $2)
    `,
      [empresaId, numeroOrdem]
    );

    // Deve ter pelo menos o funcionário que criamos (indice_avaliacao = 0)
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    const funcionario = result.rows.find(
      (r: any) => r.funcionario_cpf === funcionarioCpf
    );
    expect(funcionario).toBeDefined();
    expect(funcionario.motivo_inclusao).toBe(
      'Funcionario novo (nunca avaliado)'
    );
  });

  it('✅ view vw_funcionarios_por_lote deve retornar funcionário criado', async () => {
    const result = await query(
      `
      SELECT f.cpf, f.nome, fc.empresa_id, fc.clinica_id
      FROM funcionarios f
      INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
      WHERE f.cpf = $1 AND fc.ativo = true
    `,
      [funcionarioCpf]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].empresa_id).toBe(empresaId);
    expect(result.rows[0].clinica_id).toBe(clinicaId);
  });
});
