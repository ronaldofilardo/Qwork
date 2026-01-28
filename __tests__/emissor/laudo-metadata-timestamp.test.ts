import { query } from '@/lib/db';
import { gerarLaudoCompletoEmitirPDF } from '@/lib/laudo-auto';

describe('Consistência de timestamp entre storage e DB para laudos', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let emissorCpf: string;
  let funcionarioCpf: string;
  let loteCodigo: string;

  beforeAll(async () => {
    // Limpeza mínima
    await query(
      "DELETE FROM laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE liberado_por IN ('77777777777'))",
      []
    );
    await query(
      "DELETE FROM lotes_avaliacao WHERE liberado_por = '77777777777'",
      []
    );
    await query(
      "DELETE FROM funcionarios WHERE cpf IN ('77777777777','66666666666')",
      []
    );
    await query("DELETE FROM clinicas WHERE cnpj = '99999999000188'", []);

    // Criar clínica
    const clinicaRes = await query(
      `INSERT INTO clinicas (nome, cnpj, email, ativa) VALUES ('Clínica TS', '99999999000188', 'ts@test.com', true) RETURNING id`,
      []
    );
    clinicaId = clinicaRes.rows[0].id;

    // Criar empresa
    const empresaRes = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) VALUES ($1, 'Empresa TS', '33333333000166', true) RETURNING id`,
      [clinicaId]
    );
    empresaId = empresaRes.rows[0].id;

    // Criar emissor e funcionario
    const emissorRes = await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, clinica_id) VALUES ('77777777777','Emissor TS','emissor-ts@test.com','hash','emissor',true,$1) RETURNING cpf`,
      [clinicaId]
    );
    emissorCpf = emissorRes.rows[0].cpf;

    const funcRes = await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, ativo, nivel_cargo, clinica_id) VALUES ('66666666666','Funcionario TS','func-ts@test.com','hash','funcionario',$1,true,'operacional',$2) RETURNING cpf`,
      [empresaId, clinicaId]
    );
    funcionarioCpf = funcRes.rows[0].cpf;

    loteCodigo = `TS-${Date.now().toString().slice(-6)}`;

    const loteRes = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, empresa_id, clinica_id, tipo, status, liberado_por) VALUES ($1, 'Lote TS', $2, $3, 'completo', 'rascunho', $4) RETURNING id`,
      [loteCodigo, empresaId, clinicaId, emissorCpf]
    );
    loteId = loteRes.rows[0].id;

    // Criar avaliação e marcar concluída
    await query('BEGIN');
    try {
      const aval = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, $2, 'iniciada') RETURNING id`,
        [loteId, funcionarioCpf]
      );
      const avaliacaoId = aval.rows[0].id;

      await query(
        `INSERT INTO respostas (avaliacao_id, grupo, item, valor) VALUES ($1,1,'1',25),($1,1,'2',50)`,
        [avaliacaoId]
      );
      await query(
        `INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria) VALUES ($1,1,'G1',50.0,'medio')`,
        [avaliacaoId]
      );
      await query(`UPDATE avaliacoes SET status = 'concluida' WHERE id = $1`, [
        avaliacaoId,
      ]);
      await query(
        `UPDATE lotes_avaliacao SET status = 'concluido', atualizado_em = NOW() WHERE id = $1`,
        [loteId]
      );
      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  });

  afterAll(async () => {
    // Cleanup DB
    try {
      if (loteId) {
        await query('DELETE FROM laudos WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
      if (empresaId) {
        await query('DELETE FROM funcionarios WHERE empresa_id = $1', [
          empresaId,
        ]);
        await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
      }
      if (emissorCpf)
        await query('DELETE FROM funcionarios WHERE cpf = $1', [emissorCpf]);
      if (clinicaId)
        await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    } catch (err) {
      // ignore
    }

    // Cleanup files
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
      const files = await fs.readdir(laudosDir);
      for (const f of files) {
        if (f.startsWith(`laudo-${loteId}`)) {
          await fs.unlink(path.join(laudosDir, f)).catch(() => {});
        }
      }
    } catch (err) {
      // ignore
    }
  });

  test('criadoEm no storage deve bater com emitido_em/enviado_em no DB (diferença <= 5s)', async () => {
    const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);
    expect(laudoId).toBeDefined();

    const fs = await import('fs/promises');
    const path = await import('path');
    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );
    const metaRaw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw);
    expect(meta).toHaveProperty('criadoEm');

    const metaMs = Date.parse(meta.criadoEm);
    expect(isFinite(metaMs)).toBe(true);

    const laudoResult = await query(
      'SELECT emitido_em, enviado_em FROM laudos WHERE id = $1',
      [laudoId]
    );
    const emitido = laudoResult.rows[0].emitido_em;
    const enviado = laudoResult.rows[0].enviado_em;

    expect(emitido).toBeDefined();
    expect(enviado).toBeDefined();

    const emitidoMs = new Date(emitido).getTime();
    const enviadoMs = new Date(enviado).getTime();

    // Comparar com tolerância de 5 segundos
    const deltaEmitido = Math.abs(metaMs - emitidoMs);
    const deltaEnviado = Math.abs(metaMs - enviadoMs);

    expect(deltaEmitido).toBeLessThanOrEqual(5000);
    expect(deltaEnviado).toBeLessThanOrEqual(5000);
  });
});
