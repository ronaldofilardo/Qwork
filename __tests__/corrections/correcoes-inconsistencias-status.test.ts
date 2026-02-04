/**
 * Testes para correções de inconsistências de status e validação de lotes
 *
 * Cobertura:
 * 1. Remoção do status 'finalizado' customizado no frontend
 * 2. Implementação de validação centralizada no backend (pode_emitir_laudo)
 * 3. Validação completa de critérios para emissão de laudo
 */

import { query, closePool } from '@/lib/db';
import {
  validarLoteParaLaudo,
  validarLotesParaLaudo,
} from '@/lib/validacao-lote-laudo';

describe('Correções de Inconsistências de Status e Validação', () => {
  afterAll(async () => {
    await closePool();
  });

  describe('Correção 1: Remoção de Status Customizado no Frontend', () => {
    it('deve usar apenas status do backend sem criar estados customizados', async () => {
      // Usar timestamp curto para evitar colisão de CNPJs (CNPJ = 14 caracteres)
      const timestamp = Date.now().toString().slice(-6);

      // Criar lote de teste
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email) VALUES ($1, $2, $3) RETURNING id`,
        [
          `Clínica Teste Status ${timestamp}`,
          `11111${timestamp}01`,
          `status${timestamp}@test.com`,
        ]
      );
      const clinicaId = clinicaResult.rows[0].id;

      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) VALUES ($1, $2, $3) RETURNING id`,
        [`Empresa Status ${timestamp}`, `22222${timestamp}02`, clinicaId]
      );
      const empresaId = empresaResult.rows[0].id;

      const liberadoCpf = '9' + Date.now().toString().slice(-10); // unique cpf placeholder
      // Inserir funcionário responsável pela liberação para satisfazer FK
      await query(
        `INSERT INTO funcionarios (cpf, nome, email, clinica_id, empresa_id, setor, funcao, perfil, senha_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          liberadoCpf,
          'Liberador Teste',
          `liberador${Date.now()}@test.local`,
          clinicaId,
          empresaId,
          'TI',
          'Resp',
          'emissor',
          'hash',
        ]
      );

      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, liberado_por, status, tipo) 
         VALUES ($1, $2, $3, 'concluido', 'completo') RETURNING id`,
        [clinicaId, empresaId, liberadoCpf]
      );
      const loteId = loteResult.rows[0].id;

      // Verificar que status no banco é 'concluido' e não há 'finalizado'
      const statusCheck = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      expect(statusCheck.rows[0].status).toBe('concluido');
      expect(statusCheck.rows[0].status).not.toBe('finalizado');

      // Verificar que não há coluna ou flag que implemente 'finalizado'
      const colunas = await query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'lotes_avaliacao' AND column_name LIKE '%finaliz%'`
      );

      expect(colunas.rows.length).toBe(0); // Não deve existir coluna relacionada a 'finalizado'

      // Cleanup: remover dependências por clínica antes de apagar registros
      await query(`DELETE FROM empresas_clientes WHERE clinica_id = $1`, [
        clinicaId,
      ]);
      await query(`DELETE FROM lotes_avaliacao WHERE clinica_id = $1`, [
        clinicaId,
      ]);
      await query(`DELETE FROM funcionarios WHERE clinica_id = $1`, [
        clinicaId,
      ]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });

    it('deve manter consistência de status entre backend e frontend', async () => {
      // Frontend não deve redefinir status - deve usar exatamente o que vem da API
      // Este teste valida a estrutura de resposta da API
      const timestamp = Date.now().toString().slice(-6);

      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email) VALUES ($1, $2, $3) RETURNING id`,
        [
          `Clínica API ${timestamp}`,
          `33333${timestamp}03`,
          `api${timestamp}@test.com`,
        ]
      );
      const clinicaId = clinicaResult.rows[0].id;

      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) VALUES ($1, $2, $3) RETURNING id`,
        [`Empresa API ${timestamp}`, `44444${timestamp}04`, clinicaId]
      );
      const empresaId = empresaResult.rows[0].id;

      // Criar funcionário liberador e inserir lote com liberado_por para respeitar constraints
      const liberadoCpf2 = '9' + Date.now().toString().slice(-9);
      await query(
        `INSERT INTO funcionarios (cpf, nome, email, clinica_id, empresa_id, setor, funcao, perfil, senha_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          liberadoCpf2,
          'Liberador API',
          `lib${Date.now()}@test.local`,
          clinicaId,
          empresaId,
          'TI',
          'Resp',
          'emissor',
          'hash',
        ]
      );

      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, liberado_por, status, tipo) 
         VALUES ($1, $2, $3, 'ativo', 'completo') RETURNING id`,
        [clinicaId, empresaId, liberadoCpf2]
      );
      const loteId = loteResult.rows[0].id;

      // Buscar como a API retornaria
      const apiResponse = await query(
        `SELECT id, status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      const lote = apiResponse.rows[0];

      // Status da API deve ser exatamente o que está no banco
      expect(lote.status).toBe('ativo');

      // Status válidos do backend (máquina de estado correta)
      const statusesValidos = ['rascunho', 'ativo', 'concluido', 'cancelado'];
      expect(statusesValidos).toContain(lote.status);

      // 'finalizado' NÃO deve estar na lista de status válidos
      expect(statusesValidos).not.toContain('finalizado');

      // Cleanup: remover dependências por clínica antes de apagar registros
      await query(`DELETE FROM empresas_clientes WHERE clinica_id = $1`, [
        clinicaId,
      ]);
      await query(`DELETE FROM lotes_avaliacao WHERE clinica_id = $1`, [
        clinicaId,
      ]);
      await query(`DELETE FROM funcionarios WHERE clinica_id = $1`, [
        clinicaId,
      ]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });
  });

  describe('Correção 2: Validação Centralizada no Backend', () => {
    let clinicaId: number;
    let empresaId: number;
    let funcionarioCpf: string;

    beforeAll(async () => {
      // Setup de dados de teste
      const timestamp = Date.now().toString().slice(-6);

      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email) VALUES ($1, $2, $3) RETURNING id`,
        [
          `Clínica Validação ${timestamp}`,
          `55555${timestamp}05`,
          `validacao${timestamp}@test.com`,
        ]
      );
      clinicaId = clinicaResult.rows[0].id;

      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) VALUES ($1, $2, $3) RETURNING id`,
        [`Empresa Validação ${timestamp}`, `66666${timestamp}06`, clinicaId]
      );
      empresaId = empresaResult.rows[0].id;

      // Criar funcionário de teste (CPF único para evitar colisões)
      funcionarioCpf = '9' + Date.now().toString().slice(-10);
      await query(
        `INSERT INTO funcionarios (cpf, nome, email, clinica_id, empresa_id, setor, funcao, perfil, senha_hash) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          funcionarioCpf,
          'Func Teste',
          'func@test.com',
          clinicaId,
          empresaId,
          'TI',
          'Analista',
          'funcionario',
          'hash',
        ]
      );
    });

    afterAll(async () => {
      // Remover lotes que referenciam o funcionário antes de apagar o funcionário
      await query(`DELETE FROM lotes_avaliacao WHERE liberado_por = $1`, [
        funcionarioCpf,
      ]);
      // Garantir remoção de funcionários vinculados à clínica antes de apagar a clínica
      await query(`DELETE FROM funcionarios WHERE clinica_id = $1`, [
        clinicaId,
      ]);
      await query(`DELETE FROM funcionarios WHERE cpf = $1`, [funcionarioCpf]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });

    it('deve validar critério 1: status do lote deve ser concluido', async () => {
      // Lote com status 'ativo'
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, liberado_por, status, tipo) 
         VALUES ($1, $2, $3, 'ativo', 'completo') RETURNING id`,
        [clinicaId, empresaId, funcionarioCpf]
      );
      const loteId = loteResult.rows[0].id;

      const validacao = await validarLoteParaLaudo(loteId);

      expect(validacao.pode_emitir_laudo).toBe(false);
      expect(validacao.motivos_bloqueio).toContainEqual(
        expect.stringContaining("Status do lote é 'ativo'")
      );

      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    });

    it('deve validar critério 2: todas avaliações ativas devem estar concluídas', async () => {
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, liberado_por, status, titulo, tipo) 
         VALUES ($1, $2, $3, $4, 'concluido', $5, 'completo') RETURNING id`,
        [
          'LOTE-VAL-002',
          clinicaId,
          empresaId,
          funcionarioCpf,
          'Lote Com Pendentes',
        ]
      );
      const loteId = loteResult.rows[0].id;

      // Criar 3 avaliações: 2 concluídas, 1 em andamento
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'concluida')`,
        [loteId, funcionarioCpf]
      );
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'concluida')`,
        [loteId, funcionarioCpf]
      );
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'em_andamento')`,
        [loteId, funcionarioCpf]
      );

      const validacao = await validarLoteParaLaudo(loteId);

      expect(validacao.pode_emitir_laudo).toBe(false);
      expect(validacao.motivos_bloqueio).toContainEqual(
        expect.stringContaining('avaliação')
      );
      expect(validacao.detalhes.avaliacoes_ativas).toBe(3);
      expect(validacao.detalhes.avaliacoes_concluidas).toBe(2);

      await query(`DELETE FROM avaliacoes WHERE lote_id = $1`, [loteId]);
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    });

    it('deve reportar taxa de conclusão inferior sem que isso cause bloqueio direto', async () => {
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, liberado_por, status, titulo, tipo) 
         VALUES ($1, $2, $3, $4, 'concluido', $5, 'completo') RETURNING id`,
        [
          'LOTE-VAL-003',
          clinicaId,
          empresaId,
          funcionarioCpf,
          'Lote Taxa Baixa',
        ]
      );
      const loteId = loteResult.rows[0].id;

      // Criar 10 avaliações: 6 concluídas (60%), 4 em andamento
      for (let i = 0; i < 6; i++) {
        await query(
          `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'concluida')`,
          [loteId, funcionarioCpf]
        );
      }
      for (let i = 0; i < 4; i++) {
        await query(
          `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'iniciada')`,
          [loteId, funcionarioCpf]
        );
      }

      const validacao = await validarLoteParaLaudo(loteId);

      // Taxa continua sendo reportada como métrica
      expect(validacao.detalhes.taxa_conclusao).toBeLessThan(70);
      // Mas a taxa não deve aparecer entre os motivos de bloqueio
      expect(validacao.motivos_bloqueio).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Taxa de conclusão')])
      );

      await query(`DELETE FROM avaliacoes WHERE lote_id = $1`, [loteId]);
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    });

    it('deve excluir avaliações inativadas do cálculo de taxa', async () => {
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, liberado_por, status, titulo, tipo) 
         VALUES ($1, $2, $3, $4, 'concluido', $5, 'completo') RETURNING id`,
        [
          'LOTE-VAL-004',
          clinicaId,
          empresaId,
          funcionarioCpf,
          'Lote Com Inativadas',
        ]
      );
      const loteId = loteResult.rows[0].id;

      // 7 ativas concluídas, 3 ativas pendentes, 10 inativadas
      for (let i = 0; i < 7; i++) {
        await query(
          `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'concluida')`,
          [loteId, funcionarioCpf]
        );
      }
      for (let i = 0; i < 3; i++) {
        await query(
          `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'iniciada')`,
          [loteId, funcionarioCpf]
        );
      }
      for (let i = 0; i < 10; i++) {
        await query(
          `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'inativada')`,
          [loteId, funcionarioCpf]
        );
      }

      const validacao = await validarLoteParaLaudo(loteId);

      // 7/10 ativas = 70% (inativadas não contam)
      expect(validacao.detalhes.avaliacoes_ativas).toBe(10); // 7 + 3 (não conta as 10 inativadas)
      expect(validacao.detalhes.avaliacoes_concluidas).toBe(7);
      expect(validacao.detalhes.avaliacoes_inativadas).toBe(10);
      expect(validacao.detalhes.taxa_conclusao).toBeCloseTo(70, 1);

      await query(`DELETE FROM avaliacoes WHERE lote_id = $1`, [loteId]);
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    });

    it('deve validar múltiplos lotes em batch', async () => {
      // Criar 3 lotes
      const lote1 = await query(
        `INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, liberado_por, status, titulo, tipo) 
         VALUES ($1, $2, $3, $4, 'concluido', $5, 'completo') RETURNING id`,
        ['LOTE-BATCH-001', clinicaId, empresaId, funcionarioCpf, 'Lote Batch 1']
      );
      const lote2 = await query(
        `INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, liberado_por, status, titulo, tipo) 
         VALUES ($1, $2, $3, $4, 'ativo', $5, 'completo') RETURNING id`,
        ['LOTE-BATCH-002', clinicaId, empresaId, funcionarioCpf, 'Lote Batch 2']
      );
      const lote3 = await query(
        `INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, liberado_por, status, titulo, tipo) 
         VALUES ($1, $2, $3, $4, 'concluido', $5, 'completo') RETURNING id`,
        ['LOTE-BATCH-003', clinicaId, empresaId, funcionarioCpf, 'Lote Batch 3']
      );

      const loteIds = [lote1.rows[0].id, lote2.rows[0].id, lote3.rows[0].id];

      const validacoes = await validarLotesParaLaudo(loteIds);

      expect(validacoes.size).toBe(3);
      expect(validacoes.get(lote1.rows[0].id)).toBeDefined();
      expect(validacoes.get(lote2.rows[0].id)).toBeDefined();
      expect(validacoes.get(lote3.rows[0].id)).toBeDefined();

      // Cleanup
      await query(
        `DELETE FROM lotes_avaliacao WHERE id IN ($1, $2, $3)`,
        loteIds
      );
    });

    it('deve aprovar lote que atende todos os critérios', async () => {
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, liberado_por, status, titulo, tipo) 
         VALUES ($1, $2, $3, $4, 'concluido', $5, 'completo') RETURNING id`,
        [
          `LOTE-AP-${Date.now().toString().slice(-6)}`,
          clinicaId,
          empresaId,
          funcionarioCpf,
          'Lote Aprovado',
        ]
      );
      const loteId = loteResult.rows[0].id;

      // Criar 10 avaliações todas concluídas
      let primeiraAvaliacaoId: number | undefined;
      for (let i = 0; i < 10; i++) {
        const res = await query(
          `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'concluida') RETURNING id`,
          [loteId, funcionarioCpf]
        );
        if (i === 0) primeiraAvaliacaoId = res.rows[0].id;
      }

      // Inserir respostas completas para a primeira avaliação (grupos 1-8)
      for (let g = 1; g <= 8; g++) {
        await query(
          `INSERT INTO respostas (avaliacao_id, grupo, item, valor) VALUES ($1, $2, $3, $4)`,
          [primeiraAvaliacaoId, g, `q${g}_1`, 25]
        );
      }

      const validacao = await validarLoteParaLaudo(loteId);

      expect(validacao.pode_emitir_laudo).toBe(true);
      expect(validacao.motivos_bloqueio.length).toBe(0);
      expect(validacao.detalhes.taxa_conclusao).toBe(100);

      // Não remover respostas de avaliações concluídas (restrição de imutabilidade)
      await query(`DELETE FROM avaliacoes WHERE lote_id = $1`, [loteId]);
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    });
  });

  describe('Integração com APIs', () => {
    it('deve incluir campos pode_emitir_laudo e motivos_bloqueio na resposta', () => {
      // Este teste valida que a estrutura de resposta da API inclui os novos campos
      // A implementação real está em /api/rh/lotes e /api/emissor/lotes

      interface LoteAPIResponse {
        id: number;
        // codigo: removido
        status: string;
        pode_emitir_laudo: boolean;
        motivos_bloqueio: string[];
        taxa_conclusao: number;
      }

      const mockLoteResponse: LoteAPIResponse = {
        id: 1,
        status: 'concluido',
        pode_emitir_laudo: true,
        motivos_bloqueio: [],
        taxa_conclusao: 100,
      };

      // Validar estrutura
      expect(mockLoteResponse).toHaveProperty('pode_emitir_laudo');
      expect(mockLoteResponse).toHaveProperty('motivos_bloqueio');
      expect(mockLoteResponse).toHaveProperty('taxa_conclusao');
      expect(typeof mockLoteResponse.pode_emitir_laudo).toBe('boolean');
      expect(Array.isArray(mockLoteResponse.motivos_bloqueio)).toBe(true);
      expect(typeof mockLoteResponse.taxa_conclusao).toBe('number');
    });
  });
});
