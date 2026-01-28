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
    if (!process.env.TEST_DATABASE_URL || !String(process.env.TEST_DATABASE_URL).includes('_test')) {
      throw new Error('TEST_DATABASE_URL não configurado para testes de integração');
    }

    // Buscar clinica e empresa existentes ou criar temporários
    const clinicaRes = await query(`SELECT id FROM clinicas WHERE ativa = true LIMIT 1`);
    if (clinicaRes.rows.length > 0) {
      clinicaId = clinicaRes.rows[0].id;
    } else {
      const newClinica = await query(`
        INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
        VALUES ('Clinica Test RH', '12345678000199', 'rh@test.com', '11900000000', 'Rua Test', 'São Paulo', 'SP', '01000-000', 'Resp RH', 'resp@test.com', true)
        RETURNING id
      `);
      clinicaId = newClinica.rows[0].id;
    }

    const empresaRes = await query(`SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1`, [clinicaId]);
    if (empresaRes.rows.length > 0) {
      empresaId = empresaRes.rows[0].id;
    } else {
      const newEmpresa = await query(`
        INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
        VALUES ($1, 'Empresa Test RH', '98765432000188', 'empresa@test.com', '11900000001', 'Rua Empresa', 'São Paulo', 'SP', '01000-001', 'Resp Empresa', 'resp.empresa@test.com', true)
        RETURNING id
      `, [clinicaId]);
      empresaId = newEmpresa.rows[0].id;
    }

    // Criar funcionário de teste para a empresa
    funcionarioCpf = '12345678909';
    await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    await query(`
      INSERT INTO funcionarios (cpf, nome, data_nascimento, setor, funcao, email, empresa_id, clinica_id, perfil, ativo, indice_avaliacao)
      VALUES ($1, 'Func Test RH', '1990-01-01', 'TI', 'Dev', 'func.rh@test.com', $2, $3, 'funcionario', true, 0)
    `, [funcionarioCpf, empresaId, clinicaId]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
  });

  it('✅ obter_proximo_numero_ordem deve retornar próximo número para empresa', async () => {
    const result = await query(`SELECT obter_proximo_numero_ordem($1) as numero_ordem`, [empresaId]);

    expect(result.rows.length).toBe(1);
    expect(typeof result.rows[0].numero_ordem).toBe('number');
    expect(result.rows[0].numero_ordem).toBeGreaterThanOrEqual(1);
  });

  it('✅ calcular_elegibilidade_lote deve identificar funcionários elegíveis', async () => {
    const numeroOrdemResult = await query(`SELECT obter_proximo_numero_ordem($1) as numero_ordem`, [empresaId]);
    const numeroOrdem = numeroOrdemResult.rows[0].numero_ordem;

    const result = await query(`
      SELECT * FROM calcular_elegibilidade_lote($1, $2)
    `, [empresaId, numeroOrdem]);

    // Deve ter pelo menos o funcionário que criamos (indice_avaliacao = 0)
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    const funcionario = result.rows.find((r: any) => r.funcionario_cpf === funcionarioCpf);
    expect(funcionario).toBeDefined();
    expect(funcionario.motivo_inclusao).toBe('novo');
  });

  it('✅ view vw_funcionarios_por_lote deve retornar funcionário criado', async () => {
    const result = await query(`
      SELECT cpf, nome, empresa_id, clinica_id
      FROM vw_funcionarios_por_lote
      WHERE cpf = $1
    `, [funcionarioCpf]);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].empresa_id).toBe(empresaId);
    expect(result.rows[0].clinica_id).toBe(clinicaId);
  });
});
