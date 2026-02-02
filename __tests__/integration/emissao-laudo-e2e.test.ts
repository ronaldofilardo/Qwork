/**
 * E2E: Emissão de laudo (integração)
 *
 * NOTA: Emissão automática foi REMOVIDA.
 * Este teste usa gerarLaudoCompletoEmitirPDF diretamente para gerar o PDF.
 */

import { query } from '@/lib/db';
import { gerarLaudoCompletoEmitirPDF } from '@/lib/laudo-auto';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';

describe('E2E: Emissão de laudo (integração)', () => {
  let clinicaId: number;
  let empresaId: number;
  let emissorCpf: string;
  let loteId: number;
  let laudoId: number | null = null;
  let funcCpf: string | null = null;

  beforeAll(async () => {
    const ts = Date.now();
    emissorCpf = `EM${String(ts).slice(-8)}`;

    const resCli = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
      [`CliE2E${ts}`, `99${String(ts).slice(-9)}`, true]
    );
    clinicaId = resCli.rows[0].id;

    const resEmp = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) VALUES ($1,$2,$3) RETURNING id`,
      [`EmpE2E${ts}`, `88${String(ts).slice(-9)}`, clinicaId]
    );
    empresaId = resEmp.rows[0].id;

    // Criar emissor ativo (perfil 'emissor') — não definir nivel_cargo
    await query(
      `INSERT INTO funcionarios (cpf, nome, ativo, perfil, empresa_id, senha_hash) VALUES ($1,$2,$3,$4,$5,$6)`,
      [emissorCpf, 'Emissor Teste', true, 'emissor', empresaId, 'hash']
    );

    // Criar lote
    const resLote = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, clinica_id, empresa_id, liberado_por, status, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [`L-E2E-${ts}`, 'Lote E2E', clinicaId, empresaId, emissorCpf, 'ativo', 1]
    );
    loteId = resLote.rows[0].id;

    // Inserir uma avaliação concluída (opcional, as funções toleram ausência de respostas)
    funcCpf = `F${String(ts).slice(-8)}`;
    await query(
      `INSERT INTO funcionarios (cpf, nome, ativo, perfil, empresa_id, clinica_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        funcCpf,
        'Func E2E',
        true,
        'funcionario',
        empresaId,
        clinicaId,
        'hash',
        'operacional',
      ]
    );
    await query(
      `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
      [funcCpf, loteId, 'concluida']
    );
  });

  afterAll(async () => {
    try {
      // remover arquivos locais se existirem
      if (laudoId) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(
          process.cwd(),
          'storage',
          'laudos',
          `laudo-${laudoId}.pdf`
        );
        const metaPath = path.join(
          process.cwd(),
          'storage',
          'laudos',
          `laudo-${laudoId}.json`
        );
        await fs.rm(filePath).catch(() => {});
        await fs.rm(metaPath).catch(() => {});
      }
    } catch {
      // ignore
    }

    // Limpeza DB
    // Observe: se laudo foi emitido, há triggers que impedem deletar avaliações.
    // Portanto: deletar primeiro os laudos, depois as avaliações e o lote.
    try {
      await query(`DELETE FROM laudos WHERE lote_id = $1`, [loteId]);
    } catch (err) {
      // ignore
    }

    try {
      await query(`DELETE FROM avaliacoes WHERE lote_id = $1`, [loteId]);
    } catch (err) {
      // ignore
    }

    try {
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    } catch (err) {
      // ignore
    }

    if (funcCpf) {
      await query(`DELETE FROM funcionarios WHERE cpf = $1`, [funcCpf]).catch(
        () => {}
      );
    }
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [emissorCpf]).catch(
      () => {}
    );
    await query(`DELETE FROM empresas_clientes WHERE id = $1`, [
      empresaId,
    ]).catch(() => {});
    await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]).catch(
      () => {}
    );
  });

  it('deve emitir laudo completo e gravar PDF + registros DB', async () => {
    // NOTA: Usando gerarLaudoCompletoEmitirPDF diretamente (emissão automática removida)
    const result = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);
    expect(result).toBeTruthy();
    laudoId = result;

    // Verificar que laudo foi criado com status 'emitido'
    const resLaudo = await query(
      `SELECT id, hash_pdf, status, emitido_em, enviado_em FROM laudos WHERE lote_id = $1`,
      [loteId]
    );
    expect(resLaudo.rows.length).toBeGreaterThan(0);
    laudoId = resLaudo.rows[0].id;
    expect(resLaudo.rows[0].hash_pdf).toBeTruthy();
    expect(resLaudo.rows[0].status).toBe('emitido'); // Status deve ser 'emitido'
    expect(resLaudo.rows[0].emitido_em).not.toBeNull();
    expect(resLaudo.rows[0].enviado_em).toBeNull(); // Ainda não foi enviado

    // Verificar que lote foi marcado como emitido
    const resLote = await query(
      `SELECT emitido_em FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    );
    expect(resLote.rows.length).toBe(1);
    expect(resLote.rows[0].emitido_em).toBeTruthy();

    // Verificar arquivo local
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.pdf`
    );
    await expect(fs.access(filePath)).resolves.toBeUndefined();
  }, 20000);
});
