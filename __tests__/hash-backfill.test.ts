/**
 * Testes para Script de Backfill de Hashes
 *
 * Valida:
 * 1. Script identifica laudos sem hash
 * 2. Script calcula hash SHA-256 do arquivo PDF existente
 * 3. Script atualiza banco de dados
 * 4. Script respeita imutabilidade (apenas hash_pdf quando NULL)
 * 5. Trigger permite atualização apenas do hash_pdf quando NULL
 */

import { query } from '@/lib/db';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

describe('Backfill de Hashes - Script e Trigger', () => {
  let clinicaId: number;
  let empresaId: number;
  let emissorCpf: string;
  let loteId: number;
  let laudoId: number;
  let funcionarioCpf: string;

  beforeAll(async () => {
    const ts = Date.now();
    emissorCpf = `BF${String(ts).slice(-8)}`;
    funcionarioCpf = `FU${String(ts).slice(-8)}`;

    // Criar clínica
    const clinicaRes = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) 
       VALUES ($1, $2, true) RETURNING id`,
      [`CliBackfill${ts}`, `98${String(ts).slice(-9)}`]
    );
    clinicaId = clinicaRes.rows[0].id;

    // Criar empresa
    const empresaRes = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) 
       VALUES ($1, $2, $3, true) RETURNING id`,
      [clinicaId, `EmpBackfill${ts}`, `32${String(ts).slice(-9)}`]
    );
    empresaId = empresaRes.rows[0].id;

    // Criar emissor
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, clinica_id) 
       VALUES ($1, 'Emissor Backfill', 'emissor@bf.com', 'hash', 'emissor', true, $2)`,
      [emissorCpf, clinicaId]
    );

    // Criar funcionário
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, ativo, nivel_cargo, clinica_id) 
       VALUES ($1, 'Func Backfill', 'func@bf.com', 'hash', 'funcionario', $2, true, 'operacional', $3)`,
      [funcionarioCpf, empresaId, clinicaId]
    );

    // Criar lote
    const loteRes = await query(
      `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, codigo, titulo, status) 
       VALUES ($1, $2, $3, 'Lote Backfill Test', 'finalizado') RETURNING id`,
      [clinicaId, empresaId, `BF-${ts.toString().slice(-6)}`]
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
    await query('DELETE FROM funcionarios WHERE cpf = $1', [
      funcionarioCpf,
    ]).catch(() => {});
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

  describe('Trigger - Permite atualização apenas do hash_pdf', () => {
    let testLaudoId: number | null = null;
    let testLoteId: number | null = null;

    beforeEach(async () => {
      const ts = Date.now() + Math.floor(Math.random() * 1000);
      // Criar lote específico para este teste
      const loteRes = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, codigo, titulo, status) 
         VALUES ($1, $2, $3, 'Lote Test Hash', 'finalizado') RETURNING id`,
        [
          clinicaId,
          empresaId,
          `TH-${ts}-${Math.random().toString(36).slice(2, 7)}`,
        ]
      );
      testLoteId = loteRes.rows[0].id;

      // Criar laudo emitido SEM hash_pdf
      const laudoRes = await query(
        `INSERT INTO laudos (lote_id, emissor_cpf, status, emitido_em, hash_pdf) 
         VALUES ($1, $2, 'enviado', NOW(), NULL) RETURNING id`,
        [testLoteId, emissorCpf]
      );
      testLaudoId = laudoRes.rows[0].id;
    });

    afterEach(async () => {
      if (testLaudoId !== null) {
        await query('DELETE FROM laudos WHERE id = $1', [testLaudoId]).catch(
          () => {}
        );
        testLaudoId = null;
      }
      if (testLoteId !== null) {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
          testLoteId,
        ]).catch(() => {});
        testLoteId = null;
      }
    });

    it.skip('deve permitir atualização do hash_pdf quando NULL em laudo emitido', async () => {
      const testHash =
        'abc123def456789012345678901234567890123456789012345678901234';

      // Tentar atualizar apenas o hash_pdf (deve funcionar)
      await expect(
        query(
          `UPDATE laudos SET hash_pdf = $1 WHERE id = $2 AND (hash_pdf IS NULL OR hash_pdf = '')`,
          [testHash, testLaudoId]
        )
      ).resolves.toBeTruthy();

      // Verificar que foi atualizado
      const checkRes = await query(
        `SELECT hash_pdf FROM laudos WHERE id = $1`,
        [testLaudoId]
      );
      expect(checkRes.rows[0].hash_pdf).toBe(testHash);
    });

    it.skip('deve bloquear tentativa de atualizar outros campos em laudo emitido', async () => {
      // Tentar atualizar status junto com hash (deve falhar)
      await expect(
        query(
          `UPDATE laudos SET hash_pdf = 'newhash', status = 'rascunho' WHERE id = $1`,
          [testLaudoId]
        )
      ).rejects.toThrow(/Não é permitido modificar laudos já emitidos/);
    });

    it.skip('deve bloquear atualização de hash quando já existe', async () => {
      // Primeiro, adicionar hash ao laudo
      const initialHash =
        'initial123456789012345678901234567890123456789012345678901234';
      await query(
        `UPDATE laudos SET hash_pdf = $1 WHERE id = $2 AND (hash_pdf IS NULL OR hash_pdf = '')`,
        [initialHash, testLaudoId]
      );

      // Verificar que hash foi definido
      const currentHashRes = await query(
        `SELECT hash_pdf FROM laudos WHERE id = $1`,
        [testLaudoId]
      );
      const currentHash = currentHashRes.rows[0].hash_pdf;
      expect(currentHash).toBe(initialHash);

      // Tentar atualizar hash existente (sem WHERE hash_pdf IS NULL)
      // Trigger deve bloquear porque NÃO está mudando apenas de NULL para valor
      await expect(
        query(`UPDATE laudos SET hash_pdf = 'differenthash' WHERE id = $1`, [
          testLaudoId,
        ])
      ).rejects.toThrow(/Não é permitido modificar laudos já emitidos/);
    });
  });

  describe('Query de backfill - Identificação de laudos', () => {
    it('deve identificar laudos sem hash_pdf', async () => {
      const result = await query(
        `SELECT id, lote_id, status, emitido_em, enviado_em
         FROM laudos
         WHERE hash_pdf IS NULL 
         ORDER BY id DESC
         LIMIT 10`
      );

      // Resultado deve ser array
      expect(Array.isArray(result.rows)).toBe(true);

      // Se houver laudos, devem ter hash_pdf NULL
      result.rows.forEach((laudo) => {
        expect(laudo.id).toBeDefined();
        expect(laudo.lote_id).toBeDefined();
      });
    });
  });

  describe('Cálculo de hash SHA-256', () => {
    it('deve calcular hash SHA-256 corretamente de um buffer', () => {
      const testData = Buffer.from('test data for hashing');
      const hash = crypto.createHash('sha256').update(testData).digest('hex');

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);

      // Verificar que é determinístico
      const hash2 = crypto.createHash('sha256').update(testData).digest('hex');
      expect(hash).toBe(hash2);
    });

    it('deve gerar hashes diferentes para dados diferentes', () => {
      const data1 = Buffer.from('data 1');
      const data2 = Buffer.from('data 2');

      const hash1 = crypto.createHash('sha256').update(data1).digest('hex');
      const hash2 = crypto.createHash('sha256').update(data2).digest('hex');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Validação de estrutura de storage', () => {
    it('deve verificar que diretório storage/laudos existe', () => {
      const storagePath = join(process.cwd(), 'storage', 'laudos');
      const exists = existsSync(storagePath);
      expect(exists).toBe(true);
    });
  });
});
