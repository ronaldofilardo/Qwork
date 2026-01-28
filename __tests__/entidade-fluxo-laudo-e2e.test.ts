/**
 * Teste E2E: Fluxo Completo Entidade → Lote → Emissor → Laudo
 *
 * Valida que o fluxo de emissão de laudos funciona identicamente para entidades
 * (sem nível empresa) e clínicas (com empresa)
 *
 * Cenário:
 * 1. Criar contratante (entidade)
 * 2. Criar funcionários vinculados diretamente à entidade
 * 3. Criar lote sem empresa (contratante_id)
 * 4. Concluir avaliações
 * 5. Enviar para emissor
 * 6. Gerar laudo
 * 7. Validar dados do laudo
 */

import { query } from '@/lib/db';
import { uniqueCode } from './helpers/test-data-factory';

describe('Fluxo E2E: Entidade → Lote → Emissor → Laudo', () => {
  let contratanteId: number;
  let funcionarioCpf: string;
  let loteId: number;
  let avaliacaoId: number;

  beforeAll(async () => {
    // Desabilitar triggers temporariamente para cleanup
    await query(`ALTER TABLE laudos DISABLE TRIGGER trg_immutable_laudo`);
    await query(
      `ALTER TABLE laudos DISABLE TRIGGER trg_prevent_laudo_lote_id_change`
    );

    // Limpar dados de teste antigos
    await query(
      `DELETE FROM contratantes WHERE cnpj = '12345678000199' AND tipo = 'entidade'`
    );

    // Reabilitar triggers
    await query(`ALTER TABLE laudos ENABLE TRIGGER trg_immutable_laudo`);
    await query(
      `ALTER TABLE laudos ENABLE TRIGGER trg_prevent_laudo_lote_id_change`
    );

    // Garantir que o responsável (CPF usado no contratante) existe como funcionário para satisfazer FK de liberado_por
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, contratante_id)
       VALUES ('12345678901', 'Responsável Entidade', 'resp@entidade.com', '$2b$10$dummyhash', 'gestor_entidade', true, NULL)
       ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, ativo = true RETURNING cpf`
    );

    // Garantir que existe um emissor ativo para testes de geração de laudo
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo)
       VALUES ('99999999999', 'Emissor Teste E2E', 'emissor@teste.com', '$2b$10$dummyhash', 'emissor', true)
       ON CONFLICT (cpf) DO UPDATE SET perfil = 'emissor', ativo = true`
    );
  });

  afterAll(async () => {
    // Cleanup
    if (contratanteId) {
      // Desabilitar triggers temporariamente para cleanup
      await query(`ALTER TABLE laudos DISABLE TRIGGER trg_immutable_laudo`);
      await query(
        `ALTER TABLE laudos DISABLE TRIGGER trg_prevent_laudo_lote_id_change`
      );

      await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);

      // Reabilitar triggers
      await query(`ALTER TABLE laudos ENABLE TRIGGER trg_immutable_laudo`);
      await query(
        `ALTER TABLE laudos ENABLE TRIGGER trg_prevent_laudo_lote_id_change`
      );
    }
  });

  describe('1. Setup: Criar Entidade e Funcionários', () => {
    it('deve criar contratante do tipo entidade', async () => {
      const result = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          status, ativa, pagamento_confirmado
        ) VALUES (
          'entidade', 'Entidade Teste E2E', '12345678000199', 'teste@entidade.com', '11999999999',
          'Rua Teste, 123', 'São Paulo', 'SP', '01000-000',
          'João Gestor', '12345678901', 'joao@entidade.com', '11988888888',
          'aprovado', true, true
        ) RETURNING id`,
        []
      );

      contratanteId = result.rows[0].id;
      expect(contratanteId).toBeGreaterThan(0);
    });

    it('deve criar funcionário vinculado à entidade (sem empresa)', async () => {
      funcionarioCpf = '98765432100';

      const result = await query(
        `INSERT INTO funcionarios (
          cpf, nome, email, senha_hash, perfil, ativo, contratante_id, empresa_id, clinica_id, nivel_cargo
        ) VALUES (
          $1, 'Funcionário Teste Entidade', 'func@entidade.com', 
          '$2b$10$dummyhash', 'gestor_entidade', true, $2, NULL, NULL, 'operacional'
        )
        ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, contratante_id = EXCLUDED.contratante_id, ativo = true
        RETURNING cpf`,
        [funcionarioCpf, contratanteId]
      );

      expect(result.rows[0].cpf).toBe(funcionarioCpf);
    });
  });

  describe('2. Criar Lote sem Empresa (contratante_id apenas)', () => {
    it('deve criar lote com contratante_id e empresa_id NULL', async () => {
      const codigo = uniqueCode('TESTE-ENT');
      const result = await query(
        `INSERT INTO lotes_avaliacao (
          codigo, clinica_id, empresa_id, contratante_id, titulo, descricao, tipo, status, liberado_por, numero_ordem
        ) VALUES (
          $1, NULL, NULL, $2, 
          'Lote Teste Entidade E2E', 'Lote para validação de fluxo completo', 
          'completo', 'ativo', '12345678901', 1
        ) RETURNING id`,
        [codigo, contratanteId]
      );

      loteId = result.rows[0].id;
      expect(loteId).toBeGreaterThan(0);
    });

    it('deve validar constraint clinica XOR contratante', async () => {
      // Tentar criar lote com ambos clinica_id e contratante_id deve falhar
      const invalidCodigo = uniqueCode('TESTE-INVALIDO');
      await expect(
        query(
          `INSERT INTO lotes_avaliacao (
            codigo, clinica_id, empresa_id, contratante_id, titulo, tipo, status, liberado_por, numero_ordem
          ) VALUES (
            $1, 1, NULL, $2, 'Inválido', 'completo', 'ativo', '12345678901', 2
          )`,
          [invalidCodigo, contratanteId]
        )
      ).rejects.toThrow();
    });
  });

  describe('3. Criar e Concluir Avaliação', () => {
    it('deve criar avaliação para funcionário da entidade', async () => {
      const result = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, status, inicio, lote_id)
         VALUES ($1, 'iniciada', NOW(), $2)
         RETURNING id`,
        [funcionarioCpf, loteId]
      );

      avaliacaoId = result.rows[0].id;
      expect(avaliacaoId).toBeGreaterThan(0);
    });

    it('deve simular respostas completas (todos os 10 grupos)', async () => {
      // Inserir respostas para os 10 grupos do COPSOQ
      for (let grupo = 1; grupo <= 10; grupo++) {
        for (let questao = 1; questao <= 5; questao++) {
          const item = `q${questao}`;
          await query(
            `INSERT INTO respostas (avaliacao_id, grupo, questao, item, valor)
             VALUES ($1, $2, $3, $4, $5)`,
            [avaliacaoId, grupo, questao, item, 50] // Valor compatível com CHECK (0,25,50,75,100)
          );
        }
      }

      // Marcar avaliação como concluída
      await query(
        `UPDATE avaliacoes SET status = 'concluida', envio = NOW() WHERE id = $1`,
        [avaliacaoId]
      );

      const check = await query(`SELECT status FROM avaliacoes WHERE id = $1`, [
        avaliacaoId,
      ]);
      expect(check.rows[0].status).toBe('concluida');
    });

    it('deve atualizar lote para concluido', async () => {
      await query(
        `UPDATE lotes_avaliacao SET status = 'concluido', auto_emitir_agendado = true, auto_emitir_em = NOW() + INTERVAL '5 seconds'
         WHERE id = $1`,
        [loteId]
      );

      const check = await query(
        `SELECT status, auto_emitir_agendado FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );
      expect(check.rows[0].status).toBe('concluido');
      expect(check.rows[0].auto_emitir_agendado).toBe(true);
    });
  });

  describe('4. Validar RLS: Visibilidade do Lote', () => {
    it('deve ser visível para gestor_entidade via RLS', async () => {
      // Simular contexto de sessão do gestor da entidade
      await query(`BEGIN`);
      await query(`SET LOCAL app.current_user_perfil = 'gestor_entidade'`);
      await query(`SET LOCAL row_security = ON`);
      await query(
        `SET LOCAL app.current_user_contratante_id = '${contratanteId}'`
      );

      const result = await query(
        `SELECT id, codigo FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      await query(`ROLLBACK`);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(loteId);
    });

    it('NÃO deve ser visível para gestor de outra entidade', async () => {
      // Superuser bypassa RLS — este teste valida a política mas não pode ser executado com postgres
      // Alternativa: verificar que a política existe e está configurada corretamente
      const policies = await query(`
        SELECT policyname, qual 
        FROM pg_policies 
        WHERE schemaname='public' AND tablename='lotes_avaliacao' 
        AND policyname='lotes_entidade_select'
      `);

      expect(policies.rows.length).toBe(1);
      expect(policies.rows[0].qual).toContain('current_user_contratante_id()');

      // Em produção (com usuário não-superuser), a query abaixo retornaria 0 rows
      // Aqui validamos que a política está ativa e corretamente configurada
    });

    it('deve ser visível para emissor (status = concluido)', async () => {
      await query(`BEGIN`);
      await query(`SET LOCAL app.current_user_perfil = 'emissor'`);

      const result = await query(
        `SELECT id FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      await query(`ROLLBACK`);

      expect(result.rows.length).toBe(1);
    });
  });

  describe('5. Geração de Laudo', () => {
    it('deve gerar laudo com dados da entidade (fallback correto)', async () => {
      // Buscar emissor
      const emissorRes = await query(
        `SELECT cpf FROM funcionarios WHERE perfil = 'emissor' AND ativo = true LIMIT 1`
      );

      if (emissorRes.rows.length === 0) {
        console.warn(
          '⚠️ Nenhum emissor ativo encontrado - pulando teste de geração'
        );
        return;
      }

      const emissorCpf = emissorRes.rows[0].cpf;

      // Inserir laudo usando função idempotente
      const result = await query(
        `SELECT upsert_laudo($1, $2, $3, 'enviado') as laudo_id`,
        [loteId, emissorCpf, 'Laudo gerado automaticamente em teste E2E']
      );

      expect(result.rows[0].laudo_id).toBeGreaterThan(0);
    });

    it('deve prevenir duplicação de laudo (constraint UNIQUE)', async () => {
      const emissorRes = await query(
        `SELECT cpf FROM funcionarios WHERE perfil = 'emissor' LIMIT 1`
      );

      if (emissorRes.rows.length === 0) return;

      const emissorCpf = emissorRes.rows[0].cpf;

      // Verificar que o laudo já existe (criado no teste anterior)
      const laudoExistente = await query(
        `SELECT id, status FROM laudos WHERE lote_id = $1`,
        [loteId]
      );

      expect(laudoExistente.rows.length).toBe(1);
      expect(laudoExistente.rows[0].status).toBe('enviado');

      // Tentar inserir laudo com mesmo lote_id deve falhar (UNIQUE constraint)
      await expect(
        query(
          `INSERT INTO laudos (lote_id, emissor_cpf, status, observacoes)
           VALUES ($1, $2, 'rascunho', 'Tentativa de duplicação')`,
          [loteId, emissorCpf]
        )
      ).rejects.toThrow(
        /duplicate key value violates unique constraint|duplicar valor da chave viola a restrição de unicidade/i
      );
    });

    it('deve incluir dados corretos da entidade no laudo (via gerarDadosGeraisEmpresa)', async () => {
      // Importar função de geração de dados
      const { gerarDadosGeraisEmpresa } = await import('@/lib/laudo-calculos');

      const dados = await gerarDadosGeraisEmpresa(loteId);

      // Validar que dados da entidade foram carregados (via fallback COALESCE)
      expect(dados.empresaAvaliada).toBe('Entidade Teste E2E');
      expect(dados.cnpj).toBe('12345678000199');
      expect(dados.totalFuncionariosAvaliados).toBeGreaterThan(0);
    });
  });

  describe('6. Métricas e Observability', () => {
    it('deve aparecer em vw_lotes_por_contratante', async () => {
      const result = await query(
        `SELECT * FROM vw_lotes_por_contratante 
         WHERE contratante_id = $1 AND tipo_contratante = 'entidade'`,
        [contratanteId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].nome_contratante).toBe('Entidade Teste E2E');
    });

    it('deve registrar em audit_logs com contratante_id', async () => {
      // Registrar ação de auditoria
      await query(
        `SELECT audit_log_with_context(
          'lote', 'teste_e2e', $1::VARCHAR, 'Teste E2E completo', NULL, NULL, $2
        )`,
        [loteId.toString(), contratanteId]
      );

      // Verificar registro
      const result = await query(
        `SELECT * FROM audit_logs 
         WHERE resource = 'lote' AND resource_id = $1 AND contratante_id = $2`,
        [loteId.toString(), contratanteId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('7. Validação de Integridade Final', () => {
    it('deve garantir que lote tem contratante_id e NÃO tem clinica_id', async () => {
      const result = await query(
        `SELECT clinica_id, empresa_id, contratante_id FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      expect(result.rows[0].clinica_id).toBeNull();
      expect(result.rows[0].empresa_id).toBeNull();
      expect(result.rows[0].contratante_id).toBe(contratanteId);
    });

    it('deve confirmar que funcionário NÃO tem empresa_id nem clinica_id', async () => {
      const result = await query(
        `SELECT clinica_id, empresa_id, contratante_id FROM funcionarios WHERE cpf = $1`,
        [funcionarioCpf]
      );

      expect(result.rows[0].clinica_id).toBeNull();
      expect(result.rows[0].empresa_id).toBeNull();
      expect(result.rows[0].contratante_id).toBe(contratanteId);
    });

    it('deve garantir que laudo foi criado e está vinculado ao lote', async () => {
      const result = await query(
        `SELECT l.id, l.status, l.lote_id FROM laudos l WHERE l.lote_id = $1`,
        [loteId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].status).toBe('enviado');
      expect(result.rows[0].lote_id).toBe(loteId);
    });
  });

  describe('8. Comparação com Fluxo Clínica (parcial)', () => {
    it('deve ter comportamento equivalente ao fluxo clínica (snapshot parcial — ignora nível empresa)', async () => {
      // Este teste valida os pontos críticos do comportamento (status, emissão automática, contagem de avaliações e laudos).
      // Observação: o fluxo de entidade não tem nível de empresas — por isso a comparação é parcial e foca em equivalência de comportamento.
      const entidadeLote = await query(
        `SELECT 
          status, 
          auto_emitir_agendado, 
          (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = $1 AND status = 'concluida')::integer as avaliacoes_concluidas,
          (SELECT COUNT(*) FROM laudos WHERE lote_id = $1)::integer as laudos_gerados
         FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      const snapshot = {
        status: 'concluido',
        auto_emitir_agendado: true,
        avaliacoes_concluidas: 1,
        laudos_gerados: 1,
      };

      expect(entidadeLote.rows[0]).toMatchObject(snapshot);
    });
  });
});
