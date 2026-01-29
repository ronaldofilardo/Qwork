/**
 * Testes para Migration - Trigger de Backfill de Hash
 *
 * Valida:
 * 1. Trigger permite atualização apenas do hash_pdf quando NULL
 * 2. Trigger mantém imutabilidade dos outros campos
 * 3. Trigger bloqueia updates indevidos
 * 4. Migration pode ser executada sem erros
 */

import { query } from '@/lib/db';

describe('Migration - Trigger de Backfill Hash', () => {
  let clinicaId: number;
  let empresaId: number;
  let emissorCpf: string;
  let loteId: number;
  let laudoId: number;

  beforeAll(async () => {
    const ts = Date.now();
    emissorCpf = `TG${String(ts).slice(-8)}`;

    // Setup inicial
    const clinicaRes = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) 
       VALUES ($1, $2, true) RETURNING id`,
      [`CliTrigger${ts}`, `97${String(ts).slice(-9)}`]
    );
    clinicaId = clinicaRes.rows[0].id;

    const empresaRes = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) 
       VALUES ($1, $2, $3, true) RETURNING id`,
      [clinicaId, `EmpTrigger${ts}`, `31${String(ts).slice(-9)}`]
    );
    empresaId = empresaRes.rows[0].id;

    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, clinica_id) 
       VALUES ($1, 'Emissor Trigger', 'emissor@tg.com', 'hash', 'emissor', true, $2)`,
      [emissorCpf, clinicaId]
    );

    const loteRes = await query(
      `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, codigo, titulo, status) 
       VALUES ($1, $2, $3, 'Lote Trigger Test', 'finalizado') RETURNING id`,
      [clinicaId, empresaId, `TG-${ts.toString().slice(-6)}`]
    );
    loteId = loteRes.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    if (laudoId) {
      await query('DELETE FROM laudos WHERE id = $1', [laudoId]).catch(
        () => {}
      );
    }
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]).catch(
      () => {}
    );
    await query('DELETE FROM funcionarios WHERE cpf = $1', [emissorCpf]).catch(
      () => {}
    );
    await query('DELETE FROM empresas_clientes WHERE id = $1', [
      empresaId,
    ]).catch(() => {});
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]).catch(
      () => {}
    );
  });

  describe('Cenário: Laudo emitido sem hash (backfill)', () => {
    let testLoteId: number;

    beforeEach(async () => {
      const ts = Date.now();
      // Criar lote específico para este teste
      const loteRes = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, codigo, titulo, status) 
         VALUES ($1, $2, $3, 'Lote Trigger Test', 'finalizado') RETURNING id`,
        [
          clinicaId,
          empresaId,
          `TR-${ts}-${Math.random().toString(36).slice(2, 5)}`,
        ]
      );
      testLoteId = loteRes.rows[0].id;

      // Criar laudo emitido SEM hash
      const laudoRes = await query(
        `INSERT INTO laudos (lote_id, emissor_cpf, status, emitido_em, hash_pdf) 
         VALUES ($1, $2, 'enviado', NOW(), NULL) RETURNING id`,
        [testLoteId, emissorCpf]
      );
      laudoId = laudoRes.rows[0].id;
    });

    afterEach(async () => {
      if (laudoId) {
        await query('DELETE FROM laudos WHERE id = $1', [laudoId]).catch(
          () => {}
        );
        laudoId = 0;
      }
      if (testLoteId) {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
          testLoteId,
        ]).catch(() => {});
      }
    });

    it('deve permitir UPDATE apenas do hash_pdf quando NULL', async () => {
      const testHash =
        'def456abc123789012345678901234567890123456789012345678901234';

      // Update apenas do hash_pdf com condição WHERE hash_pdf IS NULL
      await expect(
        query(
          `UPDATE laudos 
           SET hash_pdf = $1 
           WHERE id = $2 AND (hash_pdf IS NULL OR hash_pdf = '')`,
          [testHash, laudoId]
        )
      ).resolves.toBeTruthy();

      // Verificar que foi atualizado
      const checkRes = await query(
        `SELECT hash_pdf, status, emissor_cpf FROM laudos WHERE id = $1`,
        [laudoId]
      );

      expect(checkRes.rows[0].hash_pdf).toBe(testHash);
      expect(checkRes.rows[0].status).toBe('enviado'); // Status não mudou
      expect(checkRes.rows[0].emissor_cpf).toBe(emissorCpf); // Emissor não mudou
    });

    it('deve bloquear UPDATE de outros campos junto com hash', async () => {
      const testHash =
        'ghi789def456123456789012345678901234567890123456789012345678';

      // Tentar atualizar hash E status (deve falhar)
      await expect(
        query(
          `UPDATE laudos 
           SET hash_pdf = $1, status = 'rascunho' 
           WHERE id = $2`,
          [testHash, laudoId]
        )
      ).rejects.toThrow(/Não é permitido modificar laudos já emitidos/);
    });

    it('deve bloquear UPDATE do emissor_cpf mesmo com hash NULL', async () => {
      const testHash =
        'xyz123456789012345678901234567890123456789012345678901234';

      // Tentar atualizar hash E emissor_cpf
      await expect(
        query(
          `UPDATE laudos 
           SET hash_pdf = $1, emissor_cpf = '00000000000' 
           WHERE id = $2`,
          [testHash, laudoId]
        )
      ).rejects.toThrow(/Não é permitido modificar laudos já emitidos/);
    });
  });

  describe('Cenário: Laudo já com hash (proteção)', () => {
    let testLoteId2: number;

    beforeEach(async () => {
      const ts = Date.now();
      // Criar lote específico para este teste
      const loteRes = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, codigo, titulo, status) 
         VALUES ($1, $2, $3, 'Lote Hash Test', 'finalizado') RETURNING id`,
        [
          clinicaId,
          empresaId,
          `TH-${ts}-${Math.random().toString(36).slice(2, 5)}`,
        ]
      );
      testLoteId2 = loteRes.rows[0].id;

      // Criar laudo emitido COM hash
      const laudoRes = await query(
        `INSERT INTO laudos (lote_id, emissor_cpf, status, emitido_em, hash_pdf) 
         VALUES ($1, $2, 'enviado', NOW(), 'existing123456789012345678901234567890123456789012345678901234') 
         RETURNING id`,
        [testLoteId2, emissorCpf]
      );
      laudoId = laudoRes.rows[0].id;
    });

    afterEach(async () => {
      if (laudoId) {
        await query('DELETE FROM laudos WHERE id = $1', [laudoId]).catch(
          () => {}
        );
        laudoId = 0;
      }
      if (testLoteId2) {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
          testLoteId2,
        ]).catch(() => {});
      }
    });

    it('deve bloquear tentativa de sobrescrever hash existente', async () => {
      const newHash =
        'newhash123456789012345678901234567890123456789012345678901234';

      // Tentar atualizar hash que já existe (sem WHERE hash_pdf IS NULL)
      await expect(
        query(`UPDATE laudos SET hash_pdf = $1 WHERE id = $2`, [
          newHash,
          laudoId,
        ])
      ).rejects.toThrow(/Não é permitido modificar laudos já emitidos/);
    });

    it('deve bloquear UPDATE de qualquer campo quando hash já existe', async () => {
      // Tentar mudar apenas o status
      await expect(
        query(`UPDATE laudos SET status = 'rascunho' WHERE id = $1`, [laudoId])
      ).rejects.toThrow(/Não é permitido modificar laudos já emitidos/);
    });
  });

  describe('Cenário: Laudo rascunho (não emitido)', () => {
    let testLoteId3: number;

    beforeEach(async () => {
      const ts = Date.now();
      // Criar lote específico para este teste
      const loteRes = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, codigo, titulo, status) 
         VALUES ($1, $2, $3, 'Lote Rascunho Test', 'ativo') RETURNING id`,
        [
          clinicaId,
          empresaId,
          `RS-${ts}-${Math.random().toString(36).slice(2, 5)}`,
        ]
      );
      testLoteId3 = loteRes.rows[0].id;

      // Criar laudo rascunho (emitido_em = NULL)
      const laudoRes = await query(
        `INSERT INTO laudos (lote_id, emissor_cpf, status, emitido_em, hash_pdf) 
         VALUES ($1, $2, 'rascunho', NULL, NULL) RETURNING id`,
        [testLoteId3, emissorCpf]
      );
      laudoId = laudoRes.rows[0].id;
    });

    afterEach(async () => {
      if (laudoId) {
        await query('DELETE FROM laudos WHERE id = $1', [laudoId]).catch(
          () => {}
        );
        laudoId = 0;
      }
      if (testLoteId3) {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
          testLoteId3,
        ]).catch(() => {});
      }
    });

    it('deve permitir UPDATE de qualquer campo quando não emitido', async () => {
      // Rascunho pode ser modificado livremente
      await expect(
        query(
          `UPDATE laudos 
           SET status = 'aguardando_emissao', hash_pdf = 'testhash123456789012345678901234567890123456789012345678' 
           WHERE id = $1`,
          [laudoId]
        )
      ).resolves.toBeTruthy();

      const checkRes = await query(
        `SELECT status, hash_pdf FROM laudos WHERE id = $1`,
        [laudoId]
      );

      expect(checkRes.rows[0].status).toBe('aguardando_emissao');
      expect(checkRes.rows[0].hash_pdf).toBeTruthy();
    });
  });

  describe('Validação da lógica do trigger', () => {
    it('deve verificar que trigger check_laudo_immutability existe', async () => {
      const result = await query(
        `SELECT EXISTS (
          SELECT 1 FROM pg_trigger 
          WHERE tgname = 'enforce_laudo_immutability'
        ) as exists`,
        []
      );

      expect(result.rows[0].exists).toBe(true);
    });

    it('deve verificar que função check_laudo_immutability existe', async () => {
      const result = await query(
        `SELECT EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = 'check_laudo_immutability'
        ) as exists`,
        []
      );

      expect(result.rows[0].exists).toBe(true);
    });

    it('deve verificar comentário da função contém "backfill"', async () => {
      const result = await query(
        `SELECT obj_description(oid, 'pg_proc') as description
         FROM pg_proc 
         WHERE proname = 'check_laudo_immutability'`,
        []
      );

      const description = result.rows[0]?.description || '';
      expect(description.toLowerCase()).toContain('backfill');
    });
  });
});
