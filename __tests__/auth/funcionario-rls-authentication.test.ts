/**
 * Teste: Autenticação e RLS para Funcionário
 *
 * Valida:
 * 1. Login de funcionário com senha em funcionarios.senha_hash
 * 2. RLS configurado corretamente (app.current_perfil, app.current_user_cpf)
 * 3. queryWithContext e transactionWithContext usam cliente dedicado
 * 4. Funcionário só acessa dados da sua clínica
 *
 * Correções aplicadas:
 * - Commit 2d56d8f: queryWithContext com transaction()
 * - Commit 0f99906: transactionWithContext com transaction()
 * - Neon serverless pool: Requer cliente dedicado para session vars
 */

import { query } from '@/lib/db';
import { queryWithContext, transactionWithContext } from '@/lib/db-security';
import bcrypt from 'bcryptjs';

describe('Autenticação Funcionário + RLS', () => {
  const TEST_CPF = '99988877766';
  const TEST_PASSWORD = 'senha123';
  let testClinicaId: number;
  let testFuncionarioId: number;

  const mockSession = {
    cpf: TEST_CPF,
    perfil: 'funcionario' as const,
    nome: 'Funcionário RLS Test',
  };

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    // Criar clínica para teste
    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ('Clinica RLS Test', '99988877700100', 'rls@test.com', '11900000030', 'Rua', 'SP', 'SP', '01000-030', 'Resp', 'resp@rls.com', true)
       RETURNING id`
    );
    testClinicaId = clinicaResult.rows[0].id;

    // Criar funcionário com senha
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    const funcionarioResult = await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
       VALUES ($1, $2, 'rlsfunc@test.com', $3, 'funcionario', true, 0)
       RETURNING id`,
      [TEST_CPF, mockSession.nome, hashedPassword]
    );
    testFuncionarioId = funcionarioResult.rows[0].id;

    // Associar à clínica
    await query(
      `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, ativo)
       VALUES ($1, $2, true)`,
      [testFuncionarioId, testClinicaId]
    );
  });

  afterAll(async () => {
    try {
      await query('DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1', [testFuncionarioId]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [TEST_CPF]);
      await query('DELETE FROM clinicas WHERE id = $1', [testClinicaId]);
    } catch (err) {
      console.warn('[cleanup] Erro:', err);
    }
  });

  describe('1. Estrutura de Dados', () => {
    it('tabela funcionarios deve ter senha_hash', async () => {
      const columns = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'funcionarios' 
         AND column_name = 'senha_hash'`
      );

      expect(columns.rows.length).toBe(1);
    });

    it('funcionário de teste deve ter senha hash válida', async () => {
      const result = await query(
        'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
        [TEST_CPF]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].senha_hash).toBeDefined();
      expect(result.rows[0].senha_hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    it('tabela funcionarios_clinicas deve associar funcionário à clínica', async () => {
      const result = await query(
        `SELECT fc.*, f.cpf, c.nome as clinica_nome
         FROM funcionarios_clinicas fc
         JOIN funcionarios f ON f.id = fc.funcionario_id
         JOIN clinicas c ON c.id = fc.clinica_id
         WHERE f.cpf = $1`,
        [TEST_CPF]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].clinica_id).toBe(testClinicaId);
      expect(result.rows[0].ativo).toBe(true);
    });
  });

  describe('2. Validação de Senha (Login)', () => {
    it('bcrypt.compare deve validar senha correta', async () => {
      const result = await query(
        'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
        [TEST_CPF]
      );

      const isValid = await bcrypt.compare(
        TEST_PASSWORD,
        result.rows[0].senha_hash
      );

      expect(isValid).toBe(true);
    });

    it('bcrypt.compare deve rejeitar senha incorreta', async () => {
      const result = await query(
        'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
        [TEST_CPF]
      );

      const isValid = await bcrypt.compare(
        'senha_errada',
        result.rows[0].senha_hash
      );

      expect(isValid).toBe(false);
    });
  });

  describe('3. RLS com queryWithContext', () => {
    it('deve executar query com RLS vars configuradas', async () => {
      const result = await queryWithContext<{ cpf: string; nome: string }>(
        'SELECT cpf, nome FROM funcionarios WHERE cpf = $1',
        [TEST_CPF],
        mockSession
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].cpf).toBe(TEST_CPF);
      expect(result.rows[0].nome).toBe(mockSession.nome);
    });

    it('deve acessar apenas lotes da clínica associada', async () => {
      // Criar lote na clínica do funcionário
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, 1, 'Lote RLS Test', 'completo', 'ativo', '00000000000', 1)
         RETURNING id`,
        [testClinicaId]
      );
      const loteId = loteResult.rows[0].id;

      try {
        // Buscar lotes com RLS (deve retornar apenas da clínica associada)
        const result = await queryWithContext<{ id: number; clinica_id: number }>(
          'SELECT id, clinica_id FROM lotes_avaliacao WHERE id = $1',
          [loteId],
          mockSession
        );

        expect(result.rows.length).toBe(1);
        expect(result.rows[0].clinica_id).toBe(testClinicaId);
      } finally {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    });

    it('NÃO deve acessar lotes de outra clínica', async () => {
      // Criar outra clínica
      const outraClinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
         VALUES ('Outra Clinica', '88877766600100', 'outra@test.com', '11900000031', 'Rua', 'SP', 'SP', '01000-031', 'Resp', 'resp@outra.com', true)
         RETURNING id`
      );
      const outraClinicaId = outraClinicaResult.rows[0].id;

      // Criar lote na outra clínica
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, 1, 'Lote Outra Clinica', 'completo', 'ativo', '00000000000', 1)
         RETURNING id`,
        [outraClinicaId]
      );
      const loteId = loteResult.rows[0].id;

      try {
        // Tentar buscar lote de outra clínica com RLS
        const result = await queryWithContext<{ id: number }>(
          'SELECT id FROM lotes_avaliacao WHERE id = $1',
          [loteId],
          mockSession
        );

        // RLS deve bloquear acesso (retornar 0 rows)
        expect(result.rows.length).toBe(0);
      } finally {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
        await query('DELETE FROM clinicas WHERE id = $1', [outraClinicaId]);
      }
    });
  });

  describe('4. RLS com transactionWithContext', () => {
    it('deve executar transação com RLS vars configuradas', async () => {
      const result = await transactionWithContext<number>(
        async (client) => {
          const countResult = await client.query(
            'SELECT COUNT(*) as total FROM funcionarios WHERE cpf = $1',
            [TEST_CPF]
          );
          return parseInt(countResult.rows[0].total);
        },
        mockSession
      );

      expect(result).toBe(1);
    });

    it('deve manter RLS durante toda a transação', async () => {
      const result = await transactionWithContext<{
        funcionario: string;
        clinica: number;
      }>(
        async (client) => {
          // Query 1: Buscar funcionário
          const funcResult = await client.query(
            'SELECT nome FROM funcionarios WHERE cpf = $1',
            [TEST_CPF]
          );
          const funcionarioNome = funcResult.rows[0].nome;

          // Query 2: Buscar clínica associada
          const clinicaResult = await client.query(
            `SELECT c.id 
             FROM clinicas c
             JOIN funcionarios_clinicas fc ON fc.clinica_id = c.id
             JOIN funcionarios f ON f.id = fc.funcionario_id
             WHERE f.cpf = $1`,
            [TEST_CPF]
          );
          const clinicaId = clinicaResult.rows[0].id;

          return { funcionario: funcionarioNome, clinica: clinicaId };
        },
        mockSession
      );

      expect(result.funcionario).toBe(mockSession.nome);
      expect(result.clinica).toBe(testClinicaId);
    });
  });

  describe('5. Integração: Login → Dashboard → Avaliacão', () => {
    it('fluxo completo deve funcionar com RLS', async () => {
      // Simular fluxo:
      // 1. Login (validar senha) ✅ já testado acima
      
      // 2. Dashboard: buscar lotes disponíveis
      const lotesDisponiveis = await queryWithContext<{ id: number }>(
        `SELECT id FROM lotes_avaliacao 
         WHERE clinica_id = $1 
         AND status = 'ativo'
         LIMIT 5`,
        [testClinicaId],
        mockSession
      );
      
      expect(lotesDisponiveis.rows).toBeDefined();
      expect(Array.isArray(lotesDisponiveis.rows)).toBe(true);

      // 3. Criar avaliação com transactionWithContext
      let loteId: number | null = null;
      let avaliacaoId: number | null = null;

      try {
        const result = await transactionWithContext<{
          loteId: number;
          avaliacaoId: number;
        }>(
          async (client) => {
            // Criar lote
            const loteResult = await client.query(
              `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
               VALUES ($1, 1, 'Lote Fluxo RLS', 'completo', 'ativo', '00000000000', 1)
               RETURNING id`,
              [testClinicaId]
            );
            const lote_id = loteResult.rows[0].id;

            // Criar avaliação
            const avaliacaoResult = await client.query(
              `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
               VALUES ($1, $2, 'iniciada', NOW())
               RETURNING id`,
              [TEST_CPF, lote_id]
            );
            const avaliacao_id = avaliacaoResult.rows[0].id;

            return { loteId: lote_id, avaliacaoId: avaliacao_id };
          },
          mockSession
        );

        loteId = result.loteId;
        avaliacaoId = result.avaliacaoId;

        expect(loteId).toBeDefined();
        expect(avaliacaoId).toBeDefined();

        console.log('[RLS] ✅ Fluxo Login → Dashboard → Avaliação validado');
      } finally {
        if (avaliacaoId) {
          await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
        }
        if (loteId) {
          await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
        }
      }
    });
  });
});
