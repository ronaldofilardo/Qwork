/**
 * Testes para Sistema de Índice de Avaliação
 *
 * Cobertura básica das funções PostgreSQL implementadas
 */

import { query } from '@/lib/db';

describe('Sistema de Índice de Avaliação', () => {
  let empresaIdTeste: number;
  let funcionarioCpfTeste: string;
  let clinicaIdTeste: number;

  beforeAll(async () => {
    // Setup: Criar clínica primeiro (para satisfazer foreign key)
    // Deletar registros antigos primeiro
    await query(`DELETE FROM funcionarios WHERE cpf = '11122233344'`, []);
    await query(
      `DELETE FROM empresas_clientes WHERE cnpj = '12345678000199'`,
      []
    );
    await query(`DELETE FROM clinicas WHERE cnpj = '98765432000199'`, []);

    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email)
       VALUES ('Clínica Teste Índice', '98765432000199', 'clinica@teste.com')
       RETURNING id`,
      []
    );
    clinicaIdTeste = clinicaResult.rows[0].id;

    // Criar empresa e funcionário de teste
    const empresaResult = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
       VALUES ('Empresa Teste Índice', '12345678000199', $1)
       RETURNING id`,
      [clinicaIdTeste]
    );
    empresaIdTeste = empresaResult.rows[0].id;

    const funcionarioResult = await query(
      `INSERT INTO funcionarios (cpf, nome, setor, funcao, email, senha_hash, empresa_id, clinica_id, ativo, indice_avaliacao, perfil, nivel_cargo)
       VALUES ('11122233344', 'João Teste', 'TI', 'Desenvolvedor', 'joao@teste.com', '$2b$10$dummy.hash.for.test', $1, $2, true, 0, 'funcionario', 'operacional')
       RETURNING cpf`,
      [empresaIdTeste, clinicaIdTeste]
    );
    funcionarioCpfTeste = funcionarioResult.rows[0].cpf;
  });

  afterAll(async () => {
    // Cleanup: Remover dados de teste
    await query('DELETE FROM funcionarios WHERE cpf = $1', [
      funcionarioCpfTeste,
    ]);
    await query('DELETE FROM empresas_clientes WHERE id = $1', [
      empresaIdTeste,
    ]);
  });

  describe('Campos da tabela funcionarios', () => {
    it('deve ter campos indice_avaliacao e data_ultimo_lote', async () => {
      const result = await query(
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
      const result = await query(
        'SELECT numero_ordem FROM lotes_avaliacao LIMIT 1'
      );

      // Apenas verificar que a coluna existe
      expect(result.rows.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Função obter_proximo_numero_ordem', () => {
    it('deve retornar próximo número de ordem', async () => {
      const result = await query(
        'SELECT obter_proximo_numero_ordem($1) as proximo',
        [empresaIdTeste]
      );

      expect(result.rows[0].proximo).toBeGreaterThan(0);
    });
  });

  describe('Atualização de Índice', () => {
    it('deve atualizar índice após conclusão de avaliação', async () => {
      // Criar lote com numero_ordem
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, tipo, status, empresa_id, clinica_id, liberado_por, numero_ordem)
         VALUES ('TEST-INDICE', 'Lote Índice', 'completo', 'ativo', $1, $2, $3, 5)
         RETURNING id`,
        [empresaIdTeste, clinicaIdTeste, funcionarioCpfTeste]
      );
      const loteId = loteResult.rows[0].id;

      // Criar e concluir avaliação
      const avaliacaoResult = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
         VALUES ($1, $2, 'concluida', NOW())
         RETURNING id`,
        [funcionarioCpfTeste, loteId]
      );
      const avaliacaoId = avaliacaoResult.rows[0].id;

      // Simular atualização de índice (como faz a API)
      await query(
        `UPDATE funcionarios
         SET indice_avaliacao = (SELECT numero_ordem FROM lotes_avaliacao WHERE id = $2),
             data_ultimo_lote = NOW()
         WHERE cpf = $1`,
        [funcionarioCpfTeste, loteId]
      );

      // Verificar atualização
      const result = await query(
        'SELECT indice_avaliacao, data_ultimo_lote FROM funcionarios WHERE cpf = $1',
        [funcionarioCpfTeste]
      );

      expect(result.rows[0].indice_avaliacao).toBe(5);
      expect(result.rows[0].data_ultimo_lote).toBeTruthy();

      // Cleanup
      await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    });

    it('não deve considerar funcionário com indice = numero_ordem - 1 como atrasado (caso limite)', async () => {
      // Criar um contratante e funcionário atrelado a ele (empresa_id = NULL)
      // Criar contratante com email unico para evitar conflitos de unicidade em ambiente de teste
      const timestamp = Date.now();
      const emailContratante = `contratante+${timestamp}@teste.local`;
      const cnpjDinamico = ('00000000000000' + String(timestamp)).slice(-14);
      const responsavelCpf = ('00000000000' + String(timestamp)).slice(-11);
      const responsavelEmail = `resp+${timestamp}@teste.local`;
      const responsavelCelular = ('0000000000' + String(timestamp)).slice(-10);
      const contratante = await query(
        `INSERT INTO contratantes (nome, responsavel_cpf, tipo, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, responsavel_celular) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [
          'Contratante Teste',
          responsavelCpf,
          'entidade',
          cnpjDinamico,
          emailContratante,
          '0000000000',
          'Rua Teste, 1',
          'Cidade',
          'SP',
          '00000000',
          'Responsavel Teste',
          responsavelEmail,
          responsavelCelular,
        ]
      );
      const contratanteId = contratante.rows[0].id;

      const cpfTeste = '99988877766';
      // inserir funcionário com indice = 1 e data_ultimo_lote recente
      await query(
        `INSERT INTO funcionarios (cpf, nome, contratante_id, empresa_id, ativo, indice_avaliacao, data_ultimo_lote, perfil, nivel_cargo, senha_hash)
         VALUES ($1, $2, $3, NULL, true, 1, NOW(), 'funcionario', 'operacional', '$2b$10$dummy.hash.for.test')`,
        [cpfTeste, 'Limite Teste', contratanteId]
      );

      // Chamar função de elegibilidade com numero_ordem = 2 -> diff = 0
      const res = await query(
        'SELECT funcionario_cpf FROM calcular_elegibilidade_lote_contratante($1::integer, $2::integer)',
        [contratanteId, 2]
      );

      // Não deve conter o cpfTeste
      const cpfs = res.rows.map((r: any) => r.funcionario_cpf);
      expect(cpfs).not.toContain(cpfTeste);

      // Cleanup
      await query('DELETE FROM funcionarios WHERE cpf = $1', [cpfTeste]);
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    });
  });

  afterAll(async () => {
    // Cleanup final
    await query('DELETE FROM funcionarios WHERE cpf = $1', [
      funcionarioCpfTeste,
    ]);
    await query('DELETE FROM empresas_clientes WHERE id = $1', [
      empresaIdTeste,
    ]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaIdTeste]);
  });
});
