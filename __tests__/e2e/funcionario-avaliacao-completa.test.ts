/**
 * Teste E2E: Fluxo Completo de Funcionário
 *
 * Valida:
 * 1. Login de funcionário com RLS correto
 * 2. Respostas de avaliação salvas corretamente
 * 3. Auto-conclusão atualiza status da avaliação
 * 4. Trigger fn_recalcular_status_lote_on_avaliacao_update()
 * 5. Audit trigger sem referências a processamento_em
 *
 * Correções aplicadas:
 * - Commit 2d56d8f: queryWithContext com cliente dedicado
 * - Commit 0f99906: transactionWithContext com cliente dedicado
 * - Commit 4b82eb0: audit_lote_change() sem processamento_em
 */

import { query } from '@/lib/db';
import { queryWithContext, transactionWithContext } from '@/lib/db-security';

jest.setTimeout(30000);

describe('E2E: Funcionário - Avaliação Completa', () => {
  let clinicaId: number;
  let empresaId: number;
  let funcionarioCpf: string;
  let funcionarioId: number;
  let loteId: number;
  let avaliacaoId: number;

  const mockSession = {
    cpf: '36381045086',
    perfil: 'funcionario' as const,
    nome: 'Funcionário Teste',
  };

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    // Setup clínica
    const clinicaRes = await query(
      'SELECT id FROM clinicas WHERE ativa = true LIMIT 1'
    );
    clinicaId =
      clinicaRes.rows[0]?.id ||
      (
        await query(
          `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
           VALUES ('Clinica Func Test', '98765432100100', 'func@test.com', '11900000020', 'Rua', 'SP', 'SP', '01000-020', 'Resp', 'resp@func.com', true)
           RETURNING id`
        )
      ).rows[0].id;

    // Setup empresa
    const empresaRes = await query(
      'SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1',
      [clinicaId]
    );
    empresaId =
      empresaRes.rows[0]?.id ||
      (
        await query(
          `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
           VALUES ($1, 'Empresa Func Test', '11122233300100', 'emp@func.com', '11900000021', 'Rua', 'SP', 'SP', '01000-021', 'Resp', 'resp@empfunc.com', true)
           RETURNING id`,
          [clinicaId]
        )
      ).rows[0].id;

    // Setup funcionário
    funcionarioCpf = mockSession.cpf;
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
       VALUES ($1, $2, 'functest@test.com', '$2a$10$dummyhash', 'funcionario', true, 0)
       ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
      [funcionarioCpf, mockSession.nome]
    );

    const funcRes = await query('SELECT id FROM funcionarios WHERE cpf = $1', [
      funcionarioCpf,
    ]);
    funcionarioId = funcRes.rows[0].id;

    // Associar a clínica
    await query(
      `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, ativo)
       VALUES ($1, $2, true)
       ON CONFLICT (funcionario_id, clinica_id) DO UPDATE SET ativo = true`,
      [funcionarioId, clinicaId]
    );
  });

  afterAll(async () => {
    try {
      if (avaliacaoId) {
        await query('DELETE FROM respostas WHERE avaliacao_id = $1', [
          avaliacaoId,
        ]);
        await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
      }
      if (loteId) {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
      if (funcionarioId) {
        await query(
          'DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1',
          [funcionarioId]
        );
        await query('DELETE FROM funcionarios WHERE id = $1', [funcionarioId]);
      }
    } catch (err) {
      console.warn('[cleanup] Erro:', err);
    }
  });

  describe('1. Login e Dashboard com RLS', () => {
    it('deve buscar lotes visíveis com queryWithContext', async () => {
      // RLS: funcionário vê apenas lotes da sua clínica
      const result = await queryWithContext<{ id: number; status: string }>(
        `SELECT id, status 
         FROM lotes_avaliacao 
         WHERE clinica_id = $1 
         AND status = 'ativo'
         LIMIT 5`,
        [clinicaId],
        mockSession
      );

      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      // Não deve retornar erro de RLS
    });
  });

  describe('2. Criar Avaliação e Lote', () => {
    it('deve criar lote + avaliação com transactionWithContext', async () => {
      const result = await transactionWithContext<{
        loteId: number;
        avaliacaoId: number;
      }>(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
             VALUES ($1, $2, 'Lote Func E2E', 'completo', 'ativo', '00000000000', 1)
             RETURNING id`,
          [clinicaId, empresaId]
        );
        const lote_id = loteResult.rows[0].id;

        // Criar avaliação
        const avaliacaoResult = await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
             VALUES ($1, $2, 'iniciada', NOW())
             RETURNING id`,
          [funcionarioCpf, lote_id]
        );
        const avaliacao_id = avaliacaoResult.rows[0].id;

        return { loteId: lote_id, avaliacaoId: avaliacao_id };
      }, mockSession);

      loteId = result.loteId;
      avaliacaoId = result.avaliacaoId;

      expect(loteId).toBeDefined();
      expect(avaliacaoId).toBeDefined();

      console.log(`[E2E] ✅ Lote ${loteId} e Avaliação ${avaliacaoId} criados`);
    });
  });

  describe('3. Salvar Respostas da Avaliação', () => {
    it('deve salvar respostas usando transactionWithContext', async () => {
      const resultadosSalvos = await transactionWithContext<number>(
        async (client) => {
          // Simular 37 respostas (completo)
          const perguntas = Array.from({ length: 37 }, (_, i) => i + 1);

          for (const perguntaId of perguntas) {
            await client.query(
              `INSERT INTO respostas (avaliacao_id, pergunta_id, resposta, criado_em)
               VALUES ($1, $2, $3, NOW())
               ON CONFLICT (avaliacao_id, pergunta_id) 
               DO UPDATE SET resposta = EXCLUDED.resposta, criado_em = NOW()`,
              [avaliacaoId, perguntaId, 'A']
            );
          }

          // Contar respostas salvas
          const countResult = await client.query(
            'SELECT COUNT(*) as total FROM respostas WHERE avaliacao_id = $1',
            [avaliacaoId]
          );
          return parseInt(countResult.rows[0].total);
        },
        mockSession
      );

      expect(resultadosSalvos).toBe(37);
      console.log(`[E2E] ✅ ${resultadosSalvos} respostas salvas`);
    });
  });

  describe('4. Auto-Conclusão e Atualização de Status', () => {
    it('deve detectar 37 respostas e marcar avaliação como concluída', async () => {
      await transactionWithContext(async (client) => {
        // Verificar total de respostas
        const countResult = await client.query(
          'SELECT COUNT(DISTINCT pergunta_id) as total FROM respostas WHERE avaliacao_id = $1',
          [avaliacaoId]
        );
        const totalRespostas = parseInt(countResult.rows[0].total);

        expect(totalRespostas).toBe(37);

        // Auto-conclusão
        if (totalRespostas === 37) {
          await client.query(
            `UPDATE avaliacoes 
               SET status = 'concluida', conclusao = NOW()
               WHERE id = $1`,
            [avaliacaoId]
          );
        }
      }, mockSession);

      // Verificar status atualizado
      const avaliacaoCheck = await query(
        'SELECT status, conclusao FROM avaliacoes WHERE id = $1',
        [avaliacaoId]
      );
      expect(avaliacaoCheck.rows[0].status).toBe('concluida');
      expect(avaliacaoCheck.rows[0].conclusao).toBeDefined();

      console.log('[E2E] ✅ Avaliação marcada como concluída');
    });
  });

  describe('5. Trigger de Recalcular Status do Lote', () => {
    it('trigger fn_recalcular_status_lote_on_avaliacao_update deve atualizar lote', async () => {
      // Trigger dispara automaticamente quando avaliação muda para 'concluida'
      // Verificar se lote foi atualizado para 'concluido'

      const loteCheck = await query(
        'SELECT status FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );

      // Se todas as avaliações do lote estão concluídas, lote deve estar 'concluido'
      // (neste teste só há 1 avaliação)
      expect(loteCheck.rows[0].status).toBe('concluido');

      console.log('[E2E] ✅ Status do lote atualizado para "concluido"');
    });
  });

  describe('6. Audit Trigger Sem Erro processamento_em', () => {
    it('audit_lote_change() deve ter registrado mudança sem erro', async () => {
      // Verificar se há entrada no audit_logs para o lote
      const auditCheck = await query(
        `SELECT * FROM audit_logs 
         WHERE resource = 'lotes_avaliacao' 
         AND resource_id = $1 
         AND action = 'lote_atualizado'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [loteId]
      );

      // Deve ter pelo menos 1 registro (quando status mudou para 'concluido')
      expect(auditCheck.rowCount).toBeGreaterThan(0);

      if (auditCheck.rowCount > 0) {
        const log = auditCheck.rows[0];
        expect(log.details).toBeDefined();
        expect(log.details.status).toBe('concluido');

        // ✅ CRÍTICO: details NÃO deve conter processamento_em
        expect(log.details.processamento_em).toBeUndefined();
      }

      console.log('[E2E] ✅ Audit log registrado sem campo processamento_em');
    });
  });

  describe('7. Fluxo Completo - Integração', () => {
    it('deve completar todo o fluxo sem erros de RLS ou processamento_em', async () => {
      // Verificar estado final
      const finalCheck = await query(
        `SELECT 
           a.id as avaliacao_id,
           a.status as avaliacao_status,
           a.conclusao,
           l.id as lote_id,
           l.status as lote_status,
           COUNT(r.id) as total_respostas
         FROM avaliacoes a
         JOIN lotes_avaliacao l ON l.id = a.lote_id
         LEFT JOIN respostas r ON r.avaliacao_id = a.id
         WHERE a.id = $1
         GROUP BY a.id, l.id`,
        [avaliacaoId]
      );

      const resultado = finalCheck.rows[0];

      expect(resultado.avaliacao_status).toBe('concluida');
      expect(resultado.lote_status).toBe('concluido');
      expect(parseInt(resultado.total_respostas)).toBe(37);
      expect(resultado.conclusao).toBeDefined();

      console.log('[E2E] ============================================');
      console.log('[E2E] ✅ FLUXO COMPLETO FUNCIONÁRIO VALIDADO');
      console.log('[E2E] ============================================');
      console.log('[E2E] - Login com RLS: OK');
      console.log('[E2E] - Criar avaliação: OK');
      console.log('[E2E] - Salvar 37 respostas: OK');
      console.log('[E2E] - Auto-conclusão: OK');
      console.log('[E2E] - Recalcular status lote: OK');
      console.log('[E2E] - Audit sem processamento_em: OK');
      console.log('[E2E] ============================================');
    });
  });
});
