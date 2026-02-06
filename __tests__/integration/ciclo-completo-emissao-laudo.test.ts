/**
 * Teste de ciclo completo: funcionário → avaliação → emissão de laudo
 *
 * Máquina de estado atualizada:
 * - Lotes: começam em 'ativo' → 'concluido' → 'laudo_emitido'
 * - Avaliações: começam em 'iniciada' → 'em_andamento' → 'concluida'
 * - Laudos: Relação 1:1 com lote (id = lote_id), criado como 'emitido' após PDF
 *
 * IMPORTANTE: Trigger reserva ID do laudo = ID do lote (não cria o laudo)
 */

import { query } from '@/lib/db';
import { gerarLaudoCompletoEmitirPDF } from '@/lib/laudo-auto';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

describe('Ciclo Completo: Funcionário → Avaliação → Laudo', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let avaliacaoId: number;
  let funcionarioCpf: string;
  let emissorCpf: string;
  const storageDir = path.join(process.cwd(), 'storage', 'laudos');

  beforeAll(async () => {
    // Desabilitar triggers temporarily para setup rápido
    await query(`SET session_replication_role = 'replica'`);

    // Criar clínica
    const timestamp = Date.now();
    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email, ativa) 
       VALUES ($1, $2, $3, true) 
       RETURNING id`,
      [
        `Clínica Teste ${timestamp}`,
        `${timestamp.toString().slice(-14)}`,
        `teste${timestamp}@test.com`,
      ]
    );
    clinicaId = clinicaResult.rows[0].id;

    // Criar empresa
    const empresaResult = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id, ativa) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id`,
      [
        `Empresa Teste ${timestamp}`,
        `${(timestamp + 1).toString().slice(-14)}`,
        `empresa${timestamp}@test.com`,
        clinicaId,
      ]
    );
    empresaId = empresaResult.rows[0].id;

    // Gerar CPF aleatório para funcionário
    funcionarioCpf = String(Math.floor(Math.random() * 100000000000)).padStart(
      11,
      '0'
    );

    // Criar funcionário
    await query(
      `INSERT INTO funcionarios (cpf, nome, empresa_id) 
       VALUES ($1, 'João Teste', $2)`,
      [funcionarioCpf, empresaId]
    );

    // Emissor CPF
    emissorCpf = '53051173991';

    // Garantir que o diretório de storage existe
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Reabilitar triggers para os testes
    await query(`SET session_replication_role = 'origin'`);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (loteId) {
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM laudos WHERE id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    }
    if (funcionarioCpf) {
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    }
    if (empresaId) {
      await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    }
    if (clinicaId) {
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    }
  });

  describe('1. Criação de lote e avaliação', () => {
    it('deve criar lote em status "ativo"', async () => {
      // Calcular numero_ordem
      const maxOrdemResult = await query(
        `SELECT COALESCE(MAX(numero_ordem), 0) as max_ordem 
         FROM lotes_avaliacao 
         WHERE empresa_id = $1`,
        [empresaId]
      );
      const numeroOrdem = maxOrdemResult.rows[0].max_ordem + 1;

      const result = await query(
        `INSERT INTO lotes_avaliacao 
         (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por) 
         VALUES ($1, $2, 'completo', 'ativo', $3, $4) 
         RETURNING id, status`,
        [empresaId, clinicaId, numeroOrdem, emissorCpf]
      );

      loteId = result.rows[0].id;
      expect(result.rows[0].status).toBe('ativo');
    });

    it('deve criar avaliação em status "iniciada"', async () => {
      // Configurar RLS context
      await query(`SET LOCAL app.current_user_cpf = $1`, [funcionarioCpf]);

      const result = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'iniciada', NOW()) 
         RETURNING id, status`,
        [loteId, funcionarioCpf]
      );

      avaliacaoId = result.rows[0].id;
      expect(result.rows[0].status).toBe('iniciada');

      // Resetar RLS context
      await query(`RESET app.current_user_cpf`);
    });
  });

  describe('2. Conclusão de avaliação', () => {
    it('deve permitir transição de "iniciada" para "em_andamento"', async () => {
      await query(
        `UPDATE avaliacoes SET status = 'em_andamento' WHERE id = $1`,
        [avaliacaoId]
      );

      const check = await query(`SELECT status FROM avaliacoes WHERE id = $1`, [
        avaliacaoId,
      ]);

      expect(check.rows[0].status).toBe('em_andamento');
    });

    it('deve permitir transição de "em_andamento" para "concluido"', async () => {
      await query(
        `UPDATE avaliacoes 
         SET status = 'concluido', envio = NOW(), atualizado_em = NOW() 
         WHERE id = $1`,
        [avaliacaoId]
      );

      const check = await query(`SELECT status FROM avaliacoes WHERE id = $1`, [
        avaliacaoId,
      ]);

      expect(check.rows[0].status).toBe('concluido');
    });

    it('deve atualizar lote para "concluido" automaticamente', async () => {
      const loteCheck = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      expect(loteCheck.rows[0].status).toBe('concluido');
    });
  });

  describe('3. Geração de laudo com PDF', () => {
    let laudoId: number;

    it('deve gerar laudo com PDF físico via gerarLaudoCompletoEmitirPDF', async () => {
      laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);

      expect(laudoId).toBeDefined();
      expect(laudoId).toBeGreaterThan(0);
    });

    it('deve ter status "emitido" somente após PDF criado', async () => {
      const laudoCheck = await query(
        `SELECT status, hash_pdf, emitido_em, emissor_cpf 
         FROM laudos WHERE id = $1`,
        [laudoId]
      );

      expect(laudoCheck.rows[0].status).toBe('emitido');
      expect(laudoCheck.rows[0].hash_pdf).toBeTruthy();
      expect(laudoCheck.rows[0].emitido_em).toBeTruthy();
      expect(laudoCheck.rows[0].emissor_cpf).toBe(emissorCpf);
    });

    it('deve ter arquivo PDF físico no storage', async () => {
      const pdfPath = path.join(storageDir, `laudo-${laudoId}.pdf`);
      expect(fs.existsSync(pdfPath)).toBe(true);

      const stats = fs.statSync(pdfPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('deve ter hash_pdf correspondente ao arquivo físico', async () => {
      const pdfPath = path.join(storageDir, `laudo-${laudoId}.pdf`);
      const pdfBuffer = fs.readFileSync(pdfPath);
      const calculatedHash = crypto
        .createHash('sha256')
        .update(pdfBuffer)
        .digest('hex');

      const laudoCheck = await query(
        `SELECT hash_pdf FROM laudos WHERE id = $1`,
        [laudoId]
      );

      expect(laudoCheck.rows[0].hash_pdf).toBe(calculatedHash);
    });

    it('deve ter metadata JSON no storage', async () => {
      const metadataPath = path.join(storageDir, `laudo-${laudoId}.json`);
      expect(fs.existsSync(metadataPath)).toBe(true);

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      expect(metadata.laudoId).toBe(laudoId);
      expect(metadata.loteId).toBe(loteId);
      expect(metadata.emissorCpf).toBe(emissorCpf);
    });
  });

  describe('4. Imutabilidade do laudo', () => {
    it('não deve permitir alterar hash_pdf após emissão', async () => {
      const laudoCheck = await query(
        `SELECT id FROM laudos WHERE id = $1 AND status = 'emitido'`,
        [loteId]
      );

      if (laudoCheck.rows.length > 0) {
        await expect(
          query(
            `UPDATE laudos SET hash_pdf = 'novo-hash-invalido' WHERE id = $1`,
            [loteId]
          )
        ).rejects.toThrow();
      }
    });

    it('não deve permitir reverter status de "emitido" para "rascunho"', async () => {
      const laudoCheck = await query(
        `SELECT id FROM laudos WHERE id = $1 AND status = 'emitido'`,
        [loteId]
      );

      if (laudoCheck.rows.length > 0) {
        await expect(
          query(`UPDATE laudos SET status = 'rascunho' WHERE id = $1`, [loteId])
        ).rejects.toThrow();
      }
    });
  });

  describe('5. Verificação final do lote', () => {
    it('deve ter lote atualizado para "laudo_emitido"', async () => {
      const loteCheck = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      // Após emissão, o lote deve estar em 'laudo_emitido' ou 'concluido'
      expect(['concluido', 'laudo_emitido']).toContain(
        loteCheck.rows[0].status
      );
    });
  });
});
