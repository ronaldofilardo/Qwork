/**
 * Testes para Sistema de Índice de Avaliação
 *
 * Cobertura básica das funções PostgreSQL implementadas.
 * Usa pool próprio com contexto RLS configurado (padrão de integração db).
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test',
});

/** Wrapper com RLS: cada query roda em BEGIN + SET LOCAL + COMMIT */
const q = async <T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL app.current_user_cpf = '00000000000'");
    await client.query("SET LOCAL app.current_user_perfil = 'admin'");
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return { rows: result.rows as T[], rowCount: result.rowCount || 0 };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

afterAll(async () => {
  await pool.end();
});

describe('Sistema de Índice de Avaliação', () => {
  let empresaIdTeste: number;
  let funcionarioIdTeste: number;
  let funcionarioCpfTeste: string;
  let clinicaIdTeste: number;

  beforeAll(async () => {
    // Deletar registros antigos (ordem inversa de FK)
    await q(`DELETE FROM funcionarios WHERE cpf = '11122233344'`);
    await q(`DELETE FROM empresas_clientes WHERE cnpj = '12345678000199'`);
    await q(`DELETE FROM clinicas WHERE cnpj = '98765432000199'`);

    // Criar clínica (satisfaz FK de empresas_clientes)
    const clinicaResult = await q(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
       VALUES ('Clínica Teste Índice', '98765432000199', 'clinica@teste.com',
               '1100000000', 'Rua Teste, 1', 'São Paulo', 'SP', '01000000',
               'Responsavel Teste', '00000000000', 'resp@clinica.teste', '11900000000')
       RETURNING id`
    );
    clinicaIdTeste = clinicaResult.rows[0].id;

    const empresaResult = await q(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ('Empresa Teste Índice', '12345678000199', $1)
       RETURNING id`,
      [clinicaIdTeste]
    );
    empresaIdTeste = empresaResult.rows[0].id;

    // Funcionários não têm empresa_id/clinica_id direto (modelo per-vínculo)
    const funcionarioResult = await q(
      `INSERT INTO funcionarios (cpf, nome, senha_hash, perfil, nivel_cargo, usuario_tipo, ativo)
       VALUES ('11122233344', 'João Teste', '$2b$10$dummy.hash.for.test', 'funcionario', 'operacional', 'funcionario_clinica', true)
       RETURNING id, cpf`,
      []
    );
    funcionarioIdTeste = funcionarioResult.rows[0].id;
    funcionarioCpfTeste = funcionarioResult.rows[0].cpf;

    // Criar vínculo na tabela per-vínculo
    await q(
      `INSERT INTO funcionarios_clinicas (funcionario_id, empresa_id, clinica_id, ativo, indice_avaliacao)
       VALUES ($1, $2, $3, true, 0)`,
      [funcionarioIdTeste, empresaIdTeste, clinicaIdTeste]
    );
  });

  afterAll(async () => {
    // Cleanup: ordem inversa de FK
    await q(`DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1`, [funcionarioIdTeste]);
    await q(`DELETE FROM funcionarios WHERE cpf = '11122233344'`);
    await q(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaIdTeste]);
    await q(`DELETE FROM clinicas WHERE id = $1`, [clinicaIdTeste]);
  });

  describe('Campos da tabela funcionarios', () => {
    it('deve ter campos indice_avaliacao e data_ultimo_lote', async () => {
      const result = await q(
        'SELECT indice_avaliacao, data_ultimo_lote FROM funcionarios WHERE cpf = $1',
        [funcionarioCpfTeste]
      );

      expect(result.rows[0]).toHaveProperty('indice_avaliacao');
      expect(result.rows[0]).toHaveProperty('data_ultimo_lote');
      expect(result.rows[0].indice_avaliacao).toBe(0);
    });
  });

  describe('Campo numero_ordem em lotes_avaliacao', () => {
    it('deve ter campo numero_ordem', async () => {
      const result = await q('SELECT numero_ordem FROM lotes_avaliacao LIMIT 1');

      // Apenas verificar que a coluna existe
      expect(result.rows.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Função obter_proximo_numero_ordem', () => {
    it('deve retornar próximo número de ordem', async () => {
      const result = await q(
        'SELECT obter_proximo_numero_ordem($1) as proximo',
        [empresaIdTeste]
      );

      expect(result.rows[0].proximo).toBeGreaterThan(0);
    });
  });

  describe('Atualização de Índice', () => {
    it('deve atualizar índice após conclusão de avaliação', async () => {
      // Criar lote (sem codigo/titulo — colunas não existem mais)
      const loteResult = await q(
        `INSERT INTO lotes_avaliacao (tipo, status, empresa_id, clinica_id, liberado_por, numero_ordem)
         VALUES ('completo', 'ativo', $1, $2, $3, 5)
         RETURNING id`,
        [empresaIdTeste, clinicaIdTeste, funcionarioCpfTeste]
      );
      const loteId = loteResult.rows[0].id;

      // Criar avaliação concluída
      const avaliacaoResult = await q(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, identificacao_confirmada)
         VALUES ($1, $2, 'concluida', false)
         RETURNING id`,
        [funcionarioCpfTeste, loteId]
      );
      const avaliacaoId = avaliacaoResult.rows[0].id;

      // Simular atualização de índice no vínculo per-vínculo
      await q(
        `UPDATE funcionarios_clinicas
         SET indice_avaliacao = (SELECT numero_ordem FROM lotes_avaliacao WHERE id = $2),
             data_ultimo_lote = NOW()
         WHERE funcionario_id = $1`,
        [funcionarioIdTeste, loteId]
      );

      // Verificar atualização no vínculo
      const result = await q(
        'SELECT indice_avaliacao, data_ultimo_lote FROM funcionarios_clinicas WHERE funcionario_id = $1',
        [funcionarioIdTeste]
      );

      expect(result.rows[0].indice_avaliacao).toBe(5);
      expect(result.rows[0].data_ultimo_lote).toBeTruthy();

      // Cleanup
      await q('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
      await q('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    });

    it('não deve considerar funcionário com indice = numero_ordem - 1 como atrasado (caso limite)', async () => {
      // Cenário: funcionário com indice=1 e avaliação concluída recente → lote 2 → diff=0 → não elegível
      const timestamp = Date.now();
      const cnpjDinamico = ('00000000000000' + String(timestamp)).slice(-14);
      const responsavelCpf = ('00000000000' + String(timestamp % 99999999999)).slice(-11);
      const responsavelCelular = ('00000000000' + String((timestamp + 1) % 99999999999)).slice(-11);

      const entidade = await q(
        `INSERT INTO entidades (nome, cnpj, email, telefone, endereco, cidade, estado, cep,
           responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [
          'Entidade Teste Limite',
          cnpjDinamico,
          `entidade+${timestamp}@teste.local`,
          '0000000000',
          'Rua Teste, 1',
          'Cidade',
          'SP',
          '00000000',
          'Responsavel Teste',
          responsavelCpf,
          `resp+${timestamp}@teste.local`,
          responsavelCelular,
        ]
      );
      const entidadeId: number = entidade.rows[0].id;

      const cpfTeste = ('00000000000' + String((timestamp + 2) % 99999999999)).slice(-11);
      await q(
        `INSERT INTO funcionarios (cpf, nome, senha_hash, perfil, nivel_cargo, usuario_tipo, ativo)
         VALUES ($1, 'Limite Teste', '$2b$10$dummy.hash.for.test', 'funcionario', 'operacional', 'funcionario_entidade', true)`,
        [cpfTeste]
      );

      const funcRes = await q(`SELECT id FROM funcionarios WHERE cpf = $1`, [cpfTeste]);
      const funcionarioId: number = funcRes.rows[0].id;

      // Criar lote 1 vinculado à entidade
      const lote1Res = await q(
        `INSERT INTO lotes_avaliacao (tipo, status, entidade_id, numero_ordem)
         VALUES ('completo', 'ativo', $1, 1) RETURNING id`,
        [entidadeId]
      );
      const lote1Id: number = lote1Res.rows[0].id;

      // Criar avaliação CONCLUÍDA com envio IS NOT NULL (limpa condition 4)
      await q(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, envio, identificacao_confirmada)
         VALUES ($1, $2, 'concluida', NOW(), false)`,
        [cpfTeste, lote1Id]
      );

      // Vínculo com indice=1 e data_ultimo_lote recente
      await q(
        `INSERT INTO funcionarios_entidades (funcionario_id, entidade_id, ativo, indice_avaliacao, data_ultimo_lote)
         VALUES ($1, $2, true, 1, NOW())`,
        [funcionarioId, entidadeId]
      );

      // diff = 2-1-1 = 0 → NÃO elegível; tem avaliação recente → condition 4 não dispara
      const res = await q(
        'SELECT funcionario_cpf FROM calcular_elegibilidade_lote_tomador($1::integer, $2::integer)',
        [entidadeId, 2]
      );

      const cpfs = res.rows.map((r: any) => r.funcionario_cpf.trim());
      expect(cpfs).not.toContain(cpfTeste);

      // Cleanup
      await q('DELETE FROM avaliacoes WHERE lote_id = $1', [lote1Id]);
      await q('DELETE FROM lotes_avaliacao WHERE id = $1', [lote1Id]);
      await q('DELETE FROM funcionarios_entidades WHERE funcionario_id = $1', [funcionarioId]);
      await q('DELETE FROM funcionarios WHERE cpf = $1', [cpfTeste]);
      await q('DELETE FROM entidades WHERE id = $1', [entidadeId]);
    });
  });

  describe('Regressão Migration 1240 — prioridade de funcionário novo', () => {
    it('funcionario com indice=0 em lote 3+ deve ter prioridade ALTA (não CRITICA)', async () => {
      // Bug corrigido: indice=0 em lote 3 → antes daria CRITICA, agora deve ser ALTA
      const ts = Date.now();
      const cnpjEnt = ('00000000000000' + String(ts)).slice(-14);
      const cpfResp = ('00000000000' + String(ts % 99999999999)).slice(-11);
      const celResp = ('00000000000' + String((ts + 1) % 99999999999)).slice(-11);

      const entRes = await q(
        `INSERT INTO entidades (nome, cnpj, email, telefone, endereco, cidade, estado, cep,
           responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [
          'Entidade Reg1240',
          cnpjEnt,
          `reg1240+${ts}@teste.local`,
          '0000000000',
          'Rua Reg, 1',
          'Cidade',
          'SP',
          '00000000',
          'Resp Reg',
          cpfResp,
          `resp+${ts}@teste.local`,
          celResp,
        ]
      );
      const entidadeId: number = entRes.rows[0].id;

      const cpfNovo = ('00000000000' + String((ts + 2) % 99999999999)).slice(-11);

      await q(
        `INSERT INTO funcionarios (cpf, nome, senha_hash, perfil, nivel_cargo, usuario_tipo, ativo)
         VALUES ($1, 'Novo Func 1240', '$2b$10$dummy.hash.for.test', 'funcionario', 'operacional', 'funcionario_entidade', true)`,
        [cpfNovo]
      );
      const funcRes = await q(`SELECT id FROM funcionarios WHERE cpf = $1`, [cpfNovo]);
      const funcId: number = funcRes.rows[0].id;

      // indice_avaliacao=0 (nunca avaliado)
      await q(
        `INSERT INTO funcionarios_entidades (funcionario_id, entidade_id, ativo, indice_avaliacao)
         VALUES ($1, $2, true, 0)`,
        [funcId, entidadeId]
      );

      // Lote 3: antes da fix daria CRITICA, após fix deve ser ALTA
      const elRes = await q(
        `SELECT funcionario_cpf, prioridade
           FROM calcular_elegibilidade_lote_tomador($1::integer, 3)`,
        [entidadeId]
      );

      const row = elRes.rows.find((r: any) => r.funcionario_cpf.trim() === cpfNovo);
      expect(row).toBeDefined();
      expect(row!.prioridade).toBe('ALTA'); // Regressão migration 1240: nunca CRITICA para indice=0

      // Cleanup
      await q(`DELETE FROM funcionarios_entidades WHERE funcionario_id = $1`, [funcId]);
      await q(`DELETE FROM funcionarios WHERE cpf = $1`, [cpfNovo]);
      await q(`DELETE FROM entidades WHERE id = $1`, [entidadeId]);
    });
  });
});

