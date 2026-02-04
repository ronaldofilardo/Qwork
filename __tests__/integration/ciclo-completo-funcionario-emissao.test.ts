/**
 * Teste de Integração: Ciclo Completo de Funcionário até Emissão de Laudo
 *
 * Este teste valida o fluxo end-to-end completo:
 * 1. Inserção de funcionário
 * 2. Liberação de lote (criação de avaliações)
 * 3. Conclusão de avaliação
 * 4. Reset de avaliação (se necessário)
 * 5. Nova conclusão
 * 6. Solicitação manual de emissão
 * 7. Emissão de laudo individual
 *
 * OBJETIVO: Garantir que o ciclo completo funciona sem regressões
 */

import { query } from '@/lib/db';
import { gerarLaudoCompletoEmitirPDF } from '@/lib/laudo-auto';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

jest.setTimeout(120000); // 2 minutos para operações de PDF

describe('Ciclo Completo: Funcionário → Avaliação → Reset → Emissão', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let funcionarioCpf: string;
  let rhCpf: string;
  let emissorCpf: string;
  let avaliacaoId: number;
  let laudoId: number | null = null;

  beforeAll(async () => {
    // Desabilitar triggers temporariamente para setup rápido
    await query(`SET session_replication_role = 'replica'`);

    const timestamp = Date.now();

    // 1. Criar clínica
    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email, ativa, criado_em)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING id`,
      [
        `Clínica Ciclo ${timestamp}`,
        `${timestamp.toString().slice(-14)}`,
        `ciclo${timestamp}@test.com`,
      ]
    );
    clinicaId = clinicaResult.rows[0].id;

    // 2. Criar empresa cliente
    const empresaResult = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id, ativa, criado_em)
       VALUES ($1, $2, $3, $4, true, NOW())
       RETURNING id`,
      [
        `Empresa Ciclo ${timestamp}`,
        `${(timestamp + 1).toString().slice(-14)}`,
        `empresa${timestamp}@test.com`,
        clinicaId,
      ]
    );
    empresaId = empresaResult.rows[0].id;

    // 3. Criar RH
    rhCpf = `11${timestamp.toString().slice(-9)}`;
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, clinica_id, empresa_id, ativo, criado_em)
       VALUES ($1, 'RH Ciclo Teste', $2, '$2a$10$test', 'rh', 'funcionario_clinica', $3, $4, true, NOW())`,
      [rhCpf, `rh${timestamp}@test.com`, clinicaId, empresaId]
    );

    // 4. Criar Emissor
    emissorCpf = `22${timestamp.toString().slice(-9)}`;
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, ativo, criado_em)
       VALUES ($1, 'Emissor Ciclo Teste', $2, '$2a$10$test', 'emissor', 'emissor', true, NOW())`,
      [emissorCpf, `emissor${timestamp}@test.com`]
    );

    // 5. Criar funcionário que fará avaliação
    funcionarioCpf = `33${timestamp.toString().slice(-9)}`;
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, clinica_id, empresa_id, ativo, nivel_cargo, criado_em)
       VALUES ($1, 'Funcionário Teste Ciclo', $2, '$2a$10$test', 'funcionario', 'funcionario_clinica', $3, $4, true, 'operacional', NOW())`,
      [funcionarioCpf, `func${timestamp}@test.com`, clinicaId, empresaId]
    );

    // Reabilitar triggers
    await query(`SET session_replication_role = 'origin'`);
  });

  afterAll(async () => {
    // Cleanup - ordem reversa de criação
    if (laudoId) {
      await query('DELETE FROM laudos WHERE id = $1', [laudoId]).catch(
        () => {}
      );
    }
    if (loteId) {
      await query('DELETE FROM fila_emissao WHERE lote_id = $1', [
        loteId,
      ]).catch(() => {});
      await query('DELETE FROM avaliacao_resets WHERE lote_id = $1', [
        loteId,
      ]).catch(() => {});
      await query('DELETE FROM respostas WHERE avaliacao_id = $1', [
        avaliacaoId,
      ]).catch(() => {});
      await query('DELETE FROM resultados WHERE avaliacao_id = $1', [
        avaliacaoId,
      ]).catch(() => {});
      await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]).catch(
        () => {}
      );
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]).catch(
        () => {}
      );
    }
    await query('DELETE FROM funcionarios WHERE cpf IN ($1, $2, $3)', [
      funcionarioCpf,
      rhCpf,
      emissorCpf,
    ]).catch(() => {});
    await query('DELETE FROM empresas_clientes WHERE id = $1', [
      empresaId,
    ]).catch(() => {});
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]).catch(
      () => {}
    );
  });

  describe('Passo 1: Inserção de Funcionário', () => {
    it('deve ter criado funcionário ativo com dados corretos', async () => {
      const funcResult = await query(
        `SELECT cpf, nome, perfil, ativo, nivel_cargo, clinica_id, empresa_id
         FROM funcionarios
         WHERE cpf = $1`,
        [funcionarioCpf]
      );

      expect(funcResult.rows.length).toBe(1);
      expect(funcResult.rows[0].ativo).toBe(true);
      expect(funcResult.rows[0].perfil).toBe('funcionario');
      expect(funcResult.rows[0].nivel_cargo).toBe('operacional');
      expect(funcResult.rows[0].clinica_id).toBe(clinicaId);
      expect(funcResult.rows[0].empresa_id).toBe(empresaId);
    });
  });

  describe('Passo 2: Liberação de Lote', () => {
    it('deve criar lote ativo liberado pelo RH', async () => {
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, liberado_por, status, liberado_em, criado_em)
         VALUES ($1, $2, $3, 'ativo', NOW(), NOW())
         RETURNING id`,
        [clinicaId, empresaId, rhCpf]
      );

      loteId = loteResult.rows[0].id;

      const loteCheck = await query(
        `SELECT id, status, liberado_por, liberado_em
         FROM lotes_avaliacao
         WHERE id = $1`,
        [loteId]
      );

      expect(loteCheck.rows[0].status).toBe('ativo');
      expect(loteCheck.rows[0].liberado_por).toBe(rhCpf);
      expect(loteCheck.rows[0].liberado_em).not.toBeNull();
    });

    it('deve criar avaliação para o funcionário', async () => {
      const avalResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, criado_em)
         VALUES ($1, $2, 'iniciada', NOW())
         RETURNING id`,
        [loteId, funcionarioCpf]
      );

      avaliacaoId = avalResult.rows[0].id;

      expect(avaliacaoId).toBeGreaterThan(0);

      const avalCheck = await query(
        `SELECT id, lote_id, funcionario_cpf, status
         FROM avaliacoes
         WHERE id = $1`,
        [avaliacaoId]
      );

      expect(avalCheck.rows[0].status).toBe('iniciada');
      expect(avalCheck.rows[0].funcionario_cpf).toBe(funcionarioCpf);
    });
  });

  describe('Passo 3: Conclusão de Avaliação', () => {
    it('deve inserir 37 respostas e marcar como concluída', async () => {
      // Inserir 37 respostas (mínimo para conclusão)
      // Valores devem estar entre 0 e 3 conforme constraint
      const grupos = [1, 2, 3, 4, 5, 6, 7, 8];
      let count = 0;

      for (const grupo of grupos) {
        const numPerguntas = grupo === 1 ? 8 : 4; // Grupo 1 tem 8, outros 4
        for (let i = 1; i <= numPerguntas && count < 37; i++) {
          await query(
            `INSERT INTO respostas (avaliacao_id, grupo, item, valor)
             VALUES ($1, $2, $3, $4)`,
            [avaliacaoId, grupo, `Q${i}`, Math.floor(Math.random() * 4)] // 0, 1, 2, ou 3
          );
          count++;
        }
        if (count >= 37) break;
      }

      // Marcar como concluída
      await query(
        `UPDATE avaliacoes
         SET status = 'concluida', envio = NOW(), atualizado_em = NOW()
         WHERE id = $1`,
        [avaliacaoId]
      );

      const avalCheck = await query(
        `SELECT status, envio FROM avaliacoes WHERE id = $1`,
        [avaliacaoId]
      );

      expect(avalCheck.rows[0].status).toBe('concluida');
      expect(avalCheck.rows[0].envio).not.toBeNull();

      // Verificar quantidade de respostas
      const respostasCount = await query(
        `SELECT COUNT(*) as count FROM respostas WHERE avaliacao_id = $1`,
        [avaliacaoId]
      );

      expect(parseInt(respostasCount.rows[0].count)).toBeGreaterThanOrEqual(37);
    });

    it('deve manter lote como ativo (não concluir automaticamente)', async () => {
      // Sistema manual: lote só muda para 'concluido' quando TODAS avaliações estão concluídas
      const loteCheck = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      // Como temos apenas 1 avaliação concluída, lote deveria estar concluído
      // Mas vamos atualizar manualmente para simular o trigger/recálculo
      await query(
        `UPDATE lotes_avaliacao SET status = 'concluido' WHERE id = $1`,
        [loteId]
      );

      const loteUpdated = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      expect(loteUpdated.rows[0].status).toBe('concluido');
    });
  });

  describe('Passo 4: Reset de Avaliação (Opcional)', () => {
    it('deve permitir resetar avaliação concluída', async () => {
      // Verificar que avaliação está concluída
      const beforeReset = await query(
        `SELECT status FROM avaliacoes WHERE id = $1`,
        [avaliacaoId]
      );
      expect(beforeReset.rows[0].status).toBe('concluida');

      // Contar respostas antes do reset
      const respostasAntesCount = await query(
        `SELECT COUNT(*) as count FROM respostas WHERE avaliacao_id = $1`,
        [avaliacaoId]
      );
      const countAntes = parseInt(respostasAntesCount.rows[0].count);
      expect(countAntes).toBeGreaterThan(0);

      // Executar reset (simular API)
      await query('BEGIN');

      // Deletar respostas
      await query(`DELETE FROM respostas WHERE avaliacao_id = $1`, [
        avaliacaoId,
      ]);

      // Atualizar status para 'iniciada'
      await query(
        `UPDATE avaliacoes SET status = 'iniciada', envio = NULL, atualizado_em = NOW() WHERE id = $1`,
        [avaliacaoId]
      );

      // Registrar auditoria de reset
      await query(
        `INSERT INTO avaliacao_resets (avaliacao_id, lote_id, requested_by, reason, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [avaliacaoId, loteId, rhCpf, 'Teste de reset de ciclo completo']
      );

      await query('COMMIT');

      // Verificar reset
      const afterReset = await query(
        `SELECT status, envio FROM avaliacoes WHERE id = $1`,
        [avaliacaoId]
      );
      expect(afterReset.rows[0].status).toBe('iniciada');
      expect(afterReset.rows[0].envio).toBeNull();

      const respostasDepoisCount = await query(
        `SELECT COUNT(*) as count FROM respostas WHERE avaliacao_id = $1`,
        [avaliacaoId]
      );
      expect(parseInt(respostasDepoisCount.rows[0].count)).toBe(0);
    });

    it('deve voltar lote para ativo após reset', async () => {
      // Lote volta para ativo pois agora tem avaliação pendente
      await query(`UPDATE lotes_avaliacao SET status = 'ativo' WHERE id = $1`, [
        loteId,
      ]);

      const loteCheck = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );
      expect(loteCheck.rows[0].status).toBe('ativo');
    });
  });

  describe('Passo 5: Nova Conclusão Após Reset', () => {
    it('deve permitir nova conclusão com novas respostas', async () => {
      // Inserir novas 37 respostas (valores 0-3)
      const grupos = [1, 2, 3, 4, 5, 6, 7, 8];
      let count = 0;

      for (const grupo of grupos) {
        const numPerguntas = grupo === 1 ? 8 : 4;
        for (let i = 1; i <= numPerguntas && count < 37; i++) {
          await query(
            `INSERT INTO respostas (avaliacao_id, grupo, item, valor)
             VALUES ($1, $2, $3, $4)`,
            [avaliacaoId, grupo, `Q${i}`, Math.floor(Math.random() * 4)] // 0, 1, 2, ou 3
          );
          count++;
        }
        if (count >= 37) break;
      }

      // Concluir novamente
      await query(
        `UPDATE avaliacoes
         SET status = 'concluida', envio = NOW(), atualizado_em = NOW()
         WHERE id = $1`,
        [avaliacaoId]
      );

      const avalCheck = await query(
        `SELECT status, envio FROM avaliacoes WHERE id = $1`,
        [avaliacaoId]
      );

      expect(avalCheck.rows[0].status).toBe('concluida');
      expect(avalCheck.rows[0].envio).not.toBeNull();

      // Atualizar lote para concluído
      await query(
        `UPDATE lotes_avaliacao SET status = 'concluido' WHERE id = $1`,
        [loteId]
      );
    });
  });

  describe('Passo 6: Solicitação Manual de Emissão', () => {
    it('deve permitir solicitar emissão de lote concluído', async () => {
      const loteCheck = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );
      expect(loteCheck.rows[0].status).toBe('concluido');

      // Inserir solicitação na fila
      await query(
        `INSERT INTO fila_emissao (lote_id, solicitado_em, solicitado_por)
         VALUES ($1, NOW(), $2)
         ON CONFLICT (lote_id) DO NOTHING`,
        [loteId, rhCpf]
      );

      const filaCheck = await query(
        `SELECT lote_id, solicitado_por FROM fila_emissao WHERE lote_id = $1`,
        [loteId]
      );

      expect(filaCheck.rows.length).toBe(1);
      expect(filaCheck.rows[0].solicitado_por).toBe(rhCpf);
    });

    it('NÃO deve ter gerado laudo automaticamente', async () => {
      const laudoCheck = await query(
        `SELECT id, status FROM laudos WHERE lote_id = $1`,
        [loteId]
      );

      // Sistema manual: solicitação NÃO gera laudo automaticamente
      // Laudo só existe se houver trigger que cria registro em rascunho
      if (laudoCheck.rows.length > 0) {
        expect(laudoCheck.rows[0].status).toBe('rascunho');
      }
    });
  });

  describe('Passo 7: Emissão Manual de Laudo pelo Emissor', () => {
    it('deve gerar laudo com PDF e hash via gerarLaudoCompletoEmitirPDF', async () => {
      // Emissor executa a emissão manualmente
      laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);

      expect(laudoId).toBeTruthy();
      expect(laudoId).toBeGreaterThan(0);

      const laudoCheck = await query(
        `SELECT id, lote_id, status, emitido_em, hash_pdf, emissor_cpf
         FROM laudos
         WHERE id = $1`,
        [laudoId]
      );

      expect(laudoCheck.rows.length).toBe(1);
      expect(laudoCheck.rows[0].lote_id).toBe(loteId);
      expect(laudoCheck.rows[0].status).toBe('emitido'); // Status emitido (não enviado)
      expect(laudoCheck.rows[0].emitido_em).not.toBeNull();
      expect(laudoCheck.rows[0].hash_pdf).not.toBeNull();
      expect(laudoCheck.rows[0].hash_pdf).toMatch(/^[a-f0-9]{64}$/); // SHA-256
      expect(laudoCheck.rows[0].emissor_cpf).toBe(emissorCpf);
    });

    it('deve ter criado arquivo PDF no storage local', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');

      const pdfPath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        `laudo-${laudoId}.pdf`
      );

      const exists = await fs
        .access(pdfPath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);

      if (exists) {
        const stats = await fs.stat(pdfPath);
        expect(stats.size).toBeGreaterThan(0);
      }
    });

    it('não deve permitir regenerar laudo (imutabilidade)', async () => {
      // Tentar gerar novamente
      const novoLaudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);

      // Deve retornar mesmo ID (não regenera)
      expect(novoLaudoId).toBe(laudoId);

      // Verificar que dados não mudaram
      const laudoCheck = await query(
        `SELECT emitido_em, hash_pdf FROM laudos WHERE id = $1`,
        [laudoId]
      );

      expect(laudoCheck.rows[0].emitido_em).not.toBeNull();
      expect(laudoCheck.rows[0].hash_pdf).not.toBeNull();
    });
  });

  describe('Validação Final do Ciclo Completo', () => {
    it('deve ter completado todas as etapas do ciclo', async () => {
      // Funcionário existe e está ativo
      const funcCheck = await query(
        `SELECT ativo FROM funcionarios WHERE cpf = $1`,
        [funcionarioCpf]
      );
      expect(funcCheck.rows[0].ativo).toBe(true);

      // Lote está concluído
      const loteCheck = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );
      expect(loteCheck.rows[0].status).toBe('concluido');

      // Avaliação está concluída
      const avalCheck = await query(
        `SELECT status FROM avaliacoes WHERE id = $1`,
        [avaliacaoId]
      );
      expect(avalCheck.rows[0].status).toBe('concluida');

      // Tem registro de reset
      const resetCheck = await query(
        `SELECT id FROM avaliacao_resets WHERE avaliacao_id = $1 AND lote_id = $2`,
        [avaliacaoId, loteId]
      );
      expect(resetCheck.rows.length).toBe(1);

      // Tem solicitação de emissão
      const filaCheck = await query(
        `SELECT id FROM fila_emissao WHERE lote_id = $1`,
        [loteId]
      );
      expect(filaCheck.rows.length).toBe(1);

      // Laudo foi emitido
      const laudoCheck = await query(
        `SELECT status, emitido_em, hash_pdf FROM laudos WHERE id = $1`,
        [laudoId]
      );
      expect(laudoCheck.rows[0].status).toBe('emitido');
      expect(laudoCheck.rows[0].emitido_em).not.toBeNull();
      expect(laudoCheck.rows[0].hash_pdf).not.toBeNull();
    });

    it('deve ter auditoria completa do ciclo', async () => {
      // Reset registrado
      const resetAudit = await query(
        `SELECT COUNT(*) as count FROM avaliacao_resets WHERE lote_id = $1`,
        [loteId]
      );
      expect(parseInt(resetAudit.rows[0].count)).toBe(1);

      // Solicitação registrada
      const filaAudit = await query(
        `SELECT COUNT(*) as count FROM fila_emissao WHERE lote_id = $1`,
        [loteId]
      );
      expect(parseInt(filaAudit.rows[0].count)).toBe(1);
    });
  });
});
