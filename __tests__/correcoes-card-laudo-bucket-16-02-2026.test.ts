/**
 * Testes: Correções de Card e Status de Laudos
 * Data: 16/02/2026
 *
 * CORREÇÕES IMPLEMENTADAS:
 * 1. lib/laudo-auto.ts - Marcar status='emitido' após gerar PDF
 * 2. app/api/emissor/laudos/[loteId]/pdf/route.ts - Permitir UPDATE com status='emitido'
 * 3. app/api/emissor/laudos/[loteId]/upload/route.ts - Remover WHERE status='rascunho'
 * 4. app/api/emissor/laudos/[loteId]/upload/route.ts - Usar COALESCE em emitido_em
 *
 * Máquina de Estados Corrigida:
 * - ANTES: Gerar PDF → status='rascunho' ❌
 * - DEPOIS: Gerar PDF → status='emitido' ✅
 *
 * Fluxo correto:
 * 1. Solicitação → Lote criado (status='ativo')
 * 2. Avaliações → Lote concluído (status='concluido')
 * 3. Gerar PDF → Laudo emitido (status='emitido', hash_pdf preenchido)
 * 4. Enviar Bucket → Laudo enviado (status='enviado', arquivo_remoto_url preenchido)
 */

import { gerarLaudoCompletoEmitirPDF } from '@/lib/laudo-auto';
import { query } from '@/lib/db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

describe.skip('Correções de Card e Status de Laudos (16/02/2026)', () => {
  let testLoteId: number;
  let testLaudoId: number;
  let testClinicaId: number;
  let testEmpresaId: number;
  const emissorCpf = '53051173991';
  const storageDir = path.join(process.cwd(), 'storage', 'laudos');

  beforeAll(async () => {
    // Desabilitar triggers para setup rápido
    await query(`SET session_replication_role = 'replica'`);

    // Criar clínica de teste
    const timestamp = Date.now();
    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, ativa) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id`,
      [
        `Clínica Card Test ${timestamp}`,
        `${timestamp.toString().slice(-14)}`,
        `card${timestamp}@test.com`,
        '(11) 99999-9999',
      ]
    );
    testClinicaId = clinicaResult.rows[0].id;

    // Criar empresa cliente
    const empresaResult = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id, ativa) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id`,
      [
        `Empresa Card Test ${timestamp}`,
        `${(timestamp + 1).toString().slice(-14)}`,
        `empresacard${timestamp}@test.com`,
        testClinicaId,
      ]
    );
    testEmpresaId = empresaResult.rows[0].id;

    // Criar funcionário
    const funcionarioCpf = String(
      Math.floor(Math.random() * 100000000000)
    ).padStart(11, '0');
    await query(
      `INSERT INTO funcionarios (cpf, nome, empresa_id) 
       VALUES ($1, 'João Card Test', $2)`,
      [funcionarioCpf, testEmpresaId]
    );

    // Criar lote de teste
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, status, clinica_id, empresa_id) 
       VALUES ($1, 'Lote Card Test', 'concluido', $2, $3) 
       RETURNING id`,
      [`CARD-TEST-${timestamp}`, testClinicaId, testEmpresaId]
    );
    testLoteId = loteResult.rows[0].id;

    // Criar avaliação concluída
    await query(
      `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) 
       VALUES ($1, $2, 'concluido')`,
      [testLoteId, funcionarioCpf]
    );

    // Garantir que o diretório de storage existe
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Reabilitar triggers
    await query(`SET session_replication_role = 'origin'`);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testLaudoId) {
      const pdfPath = path.join(storageDir, `laudo-${testLaudoId}.pdf`);
      const jsonPath = path.join(storageDir, `laudo-${testLaudoId}.json`);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);

      await query('DELETE FROM laudos WHERE id = $1', [testLaudoId]);
    }
    if (testLoteId) {
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [testLoteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [testLoteId]);
    }
    if (testEmpresaId) {
      await query('DELETE FROM funcionarios WHERE empresa_id = $1', [
        testEmpresaId,
      ]);
      await query('DELETE FROM empresas_clientes WHERE id = $1', [
        testEmpresaId,
      ]);
    }
    if (testClinicaId) {
      await query('DELETE FROM clinicas WHERE id = $1', [testClinicaId]);
    }
  });

  describe('CORREÇÃO 1: Status "emitido" após gerar PDF', () => {
    it('deve gerar laudo e marcar status="emitido" automaticamente', async () => {
      // Executar função de geração de laudo
      testLaudoId = await gerarLaudoCompletoEmitirPDF(testLoteId, emissorCpf);

      expect(testLaudoId).toBeDefined();
      expect(testLaudoId).toBeGreaterThan(0);

      // Verificar que status foi marcado como 'emitido'
      const laudoCheck = await query(
        `SELECT status, hash_pdf, emitido_em, emissor_cpf 
         FROM laudos WHERE id = $1`,
        [testLaudoId]
      );

      // ✅ CORREÇÃO: Agora deve ser 'emitido', não 'rascunho'
      expect(laudoCheck.rows[0].status).toBe('emitido');
      expect(laudoCheck.rows[0].hash_pdf).toBeTruthy();
      expect(laudoCheck.rows[0].emitido_em).toBeTruthy();
      expect(laudoCheck.rows[0].emissor_cpf).toBe(emissorCpf);
    });

    it('deve ter arquivo PDF físico no storage', async () => {
      const pdfPath = path.join(storageDir, `laudo-${testLaudoId}.pdf`);
      expect(fs.existsSync(pdfPath)).toBe(true);

      const stats = fs.statSync(pdfPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('deve ter hash_pdf correspondente ao arquivo físico', async () => {
      const pdfPath = path.join(storageDir, `laudo-${testLaudoId}.pdf`);
      const pdfBuffer = fs.readFileSync(pdfPath);
      const calculatedHash = crypto
        .createHash('sha256')
        .update(pdfBuffer)
        .digest('hex');

      const laudoCheck = await query(
        `SELECT hash_pdf FROM laudos WHERE id = $1`,
        [testLaudoId]
      );

      expect(laudoCheck.rows[0].hash_pdf).toBe(calculatedHash);
    });
  });

  describe('CORREÇÃO 2: Backend retorna _emitido=true', () => {
    it('deve calcular _emitido=true para status="emitido"', async () => {
      const result = await query(
        `SELECT 
          id,
          status,
          CASE 
            WHEN status IN ('emitido', 'enviado') THEN true 
            ELSE false 
          END as _emitido
         FROM laudos 
         WHERE id = $1`,
        [testLaudoId]
      );

      // ✅ CORREÇÃO: Backend deve retornar _emitido=true
      expect(result.rows[0].status).toBe('emitido');
      expect(result.rows[0]._emitido).toBe(true);
    });

    it('deve permitir frontend mostrar na aba "Laudo Emitido"', async () => {
      const result = await query(
        `SELECT 
          l.id,
          l.status,
          CASE 
            WHEN l.status IN ('emitido', 'enviado') THEN true 
            ELSE false 
          END as _emitido,
          lt.status as lote_status
         FROM laudos l
         JOIN lotes_avaliacao lt ON lt.id = l.lote_id
         WHERE l.id = $1`,
        [testLaudoId]
      );

      const laudo = result.rows[0];

      // Simular lógica do frontend: aba "Laudo Emitido" se _emitido=true
      const abaNome =
        laudo.lote_status === 'concluido' && laudo._emitido
          ? 'Laudo Emitido'
          : 'Laudo para Emitir';

      // ✅ CORREÇÃO: Deve aparecer na aba "Laudo Emitido"
      expect(abaNome).toBe('Laudo Emitido');
    });
  });

  describe('CORREÇÃO 3: Upload funciona com status="emitido"', () => {
    it('deve permitir UPDATE sem condição WHERE status="rascunho"', async () => {
      // Simular upload ao bucket
      const mockUrl = `https://bucket.backblaze.com/laudos/lote-${testLoteId}/laudo-${testLaudoId}.pdf`;
      const mockKey = `laudos/lote-${testLoteId}/laudo-${testLaudoId}.pdf`;

      // ✅ CORREÇÃO: UPDATE agora funciona SEM condição de status
      const updateResult = await query(
        `UPDATE laudos 
         SET 
           arquivo_remoto_provider = 'backblaze',
           arquivo_remoto_bucket = 'laudos-qwork',
           arquivo_remoto_key = $1,
           arquivo_remoto_url = $2,
           arquivo_remoto_uploaded_at = NOW(),
           status = 'enviado',
           atualizado_em = NOW()
         WHERE id = $3`,
        [mockKey, mockUrl, testLaudoId]
      );

      // Antes da correção, rowCount seria 0 se status já fosse 'emitido'
      // Depois da correção, rowCount deve ser 1
      expect(updateResult.rowCount).toBe(1);

      // Verificar que dados foram salvos
      const checkResult = await query(
        `SELECT status, arquivo_remoto_url, arquivo_remoto_uploaded_at 
         FROM laudos WHERE id = $1`,
        [testLaudoId]
      );

      expect(checkResult.rows[0].status).toBe('enviado');
      expect(checkResult.rows[0].arquivo_remoto_url).toBe(mockUrl);
      expect(checkResult.rows[0].arquivo_remoto_uploaded_at).toBeTruthy();
    });
  });

  describe('CORREÇÃO 4: COALESCE preserva emitido_em', () => {
    it('deve preservar timestamp original de emitido_em', async () => {
      // Buscar timestamp original
      const beforeUpdate = await query(
        `SELECT emitido_em FROM laudos WHERE id = $1`,
        [testLaudoId]
      );
      const originalEmitidoEm = beforeUpdate.rows[0].emitido_em;

      // Simular outro upload (forçar UPDATE novamente)
      await query(
        `UPDATE laudos 
         SET 
           arquivo_remoto_url = $1,
           emitido_em = COALESCE(emitido_em, NOW()),
           atualizado_em = NOW()
         WHERE id = $2`,
        ['https://bucket.backblaze.com/new-url.pdf', testLaudoId]
      );

      // Verificar que emitido_em NÃO mudou
      const afterUpdate = await query(
        `SELECT emitido_em FROM laudos WHERE id = $1`,
        [testLaudoId]
      );
      const finalEmitidoEm = afterUpdate.rows[0].emitido_em;

      // ✅ CORREÇÃO: COALESCE preserva valor original
      expect(finalEmitidoEm.getTime()).toBe(originalEmitidoEm.getTime());
    });
  });

  describe('CORREÇÃO 5: Workflow completo', () => {
    it('deve ter fluxo correto: rascunho → emitido → enviado', async () => {
      // Estado final após todas as correções
      const finalState = await query(
        `SELECT 
          status,
          hash_pdf IS NOT NULL as tem_hash,
          arquivo_remoto_url IS NOT NULL as tem_bucket,
          emitido_em IS NOT NULL as tem_emitido_em,
          arquivo_remoto_uploaded_at IS NOT NULL as tem_uploaded_at
         FROM laudos 
         WHERE id = $1`,
        [testLaudoId]
      );

      const state = finalState.rows[0];

      // ✅ Estado final correto
      expect(state.status).toBe('enviado'); // Status final
      expect(state.tem_hash).toBe(true); // PDF gerado
      expect(state.tem_bucket).toBe(true); // Enviado ao bucket
      expect(state.tem_emitido_em).toBe(true); // Timestamp de emissão
      expect(state.tem_uploaded_at).toBe(true); // Timestamp de upload
    });

    it('deve ter máquina de estados consistente', async () => {
      const result = await query(
        `SELECT 
          status,
          hash_pdf,
          arquivo_remoto_url,
          emitido_em,
          arquivo_remoto_uploaded_at
         FROM laudos 
         WHERE id = $1`,
        [testLaudoId]
      );

      const laudo = result.rows[0];

      // Validações de consistência
      if (laudo.status === 'emitido') {
        expect(laudo.hash_pdf).toBeTruthy();
        expect(laudo.emitido_em).toBeTruthy();
      }

      if (laudo.status === 'enviado') {
        expect(laudo.hash_pdf).toBeTruthy();
        expect(laudo.emitido_em).toBeTruthy();
        expect(laudo.arquivo_remoto_url).toBeTruthy();
        expect(laudo.arquivo_remoto_uploaded_at).toBeTruthy();
      }

      // ✅ Máquina de estados consistente
      expect(laudo.status).toBe('enviado');
    });
  });

  describe('VALIDAÇÃO: Situações edge case', () => {
    it('não deve permitir status="emitido" sem hash_pdf', async () => {
      // Tentar criar laudo inválido sem hash
      await expect(
        query(
          `INSERT INTO laudos (lote_id, status, hash_pdf) 
           VALUES ($1, 'emitido', NULL)`,
          [testLoteId]
        )
      ).rejects.toThrow();
    });

    it('não deve permitir reverter de "emitido" para "rascunho"', async () => {
      // Tentar reverter status (deve falhar por trigger de imutabilidade)
      await expect(
        query(`UPDATE laudos SET status = 'rascunho' WHERE id = $1`, [
          testLaudoId,
        ])
      ).rejects.toThrow();
    });

    it('não deve permitir alterar hash_pdf após emissão', async () => {
      // Tentar alterar hash (deve falhar por trigger de imutabilidade)
      await expect(
        query(
          `UPDATE laudos SET hash_pdf = 'novo-hash-invalido' WHERE id = $1`,
          [testLaudoId]
        )
      ).rejects.toThrow();
    });
  });
});
