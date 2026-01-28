/**
 * Testes mínimos para regras de finalização/cancelamento de lotes
 * - Lote CONCLUÍDO se: todas avaliações concluídas OR (concluídas + inativadas) == total
 * - Lote CANCELADO se: todas avaliações inativadas
 * - Ao concluir, o lote deve disparar emissão imediata (recalcularStatusLotePorId retorna loteFinalizado = true)
 *
 * Observação: testes limitados apenas a esses cenários conforme especificado
 */

import { query } from '@/lib/db';
import { recalcularStatusLotePorId } from '@/lib/lotes';
import { uniqueCode } from './helpers/test-data-factory';

describe('Regras de finalização de lote (mínimo)', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number | null = null;
  let funcionario1Cpf: string;
  let funcionario2Cpf: string;

  beforeAll(async () => {
    // Criar contexto isolado com códigos únicos
    const codigoClinica = `CLI-${Date.now()}`;
    const codigoEmpresa = `EMP-${Date.now()}`;

    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email, ativa) VALUES ($1,$2,$3,true) RETURNING id`,
      [codigoClinica, codigoClinica.slice(0, 14), `${codigoClinica}@test.com`]
    );
    clinicaId = clinicaResult.rows[0].id;

    const empresaResult = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) VALUES ($1,$2,$3,true) RETURNING id`,
      [clinicaId, codigoEmpresa, codigoEmpresa.slice(0, 14)]
    );
    empresaId = empresaResult.rows[0].id;

    // CPFs únicos
    funcionario1Cpf = String(Date.now()).slice(-11).padStart(11, '2');
    funcionario2Cpf = String(Date.now() + 1)
      .slice(-11)
      .padStart(11, '3');

    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, ativo) VALUES ($1,'F1','f1@test', 'h', 'funcionario', $2, $3, true)`,
      [funcionario1Cpf, empresaId, clinicaId]
    );
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, ativo) VALUES ($1,'F2','f2@test', 'h', 'funcionario', $2, $3, true)`,
      [funcionario2Cpf, empresaId, clinicaId]
    );
  });

  afterAll(async () => {
    // Cleanup seguro: remover laudo -> respostas/avaliacoes -> lote -> funcionarios -> empresa -> clinica
    if (loteId) {
      await query('DELETE FROM laudos WHERE lote_id = $1', [loteId]);
      await query(
        'DELETE FROM respostas WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id = $1)',
        [loteId]
      );
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    }

    if (empresaId) {
      await query('DELETE FROM funcionarios WHERE empresa_id = $1', [
        empresaId,
      ]);
      await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    }

    if (clinicaId) {
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    }
  });

  test('Lote é concluído quando todas avaliações estão concluídas', async () => {
    const codigo = `LF1-${Date.now()}`.slice(0, 20);
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, empresa_id, clinica_id, tipo, status) VALUES ($1,$2,$3,$4,'completo','rascunho') RETURNING id`,
      [codigo, 'Lote Final 1', empresaId, clinicaId]
    );
    loteId = loteResult.rows[0].id;

    await query(
      `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1,$2,'concluida'), ($1,$3,'concluida')`,
      [loteId, funcionario1Cpf, funcionario2Cpf]
    );

    const { novoStatus } = await recalcularStatusLotePorId(loteId);
    expect(novoStatus).toBe('concluido');

    const row = await query(
      'SELECT status FROM lotes_avaliacao WHERE id = $1',
      [loteId]
    );
    expect(row.rows[0].status).toBe('concluido');
  });

  test('Lote é cancelado quando todas avaliações estão inativadas', async () => {
    const codigo = `LF2-${Date.now()}`.slice(0, 20);
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, empresa_id, clinica_id, tipo, status) VALUES ($1,$2,$3,$4,'completo','rascunho') RETURNING id`,
      [codigo, 'Lote Cancel 1', empresaId, clinicaId]
    );
    const testLoteId = loteResult.rows[0].id;

    await query(
      `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1,$2,'inativada'), ($1,$3,'inativada')`,
      [testLoteId, funcionario1Cpf, funcionario2Cpf]
    );

    const { novoStatus } = await recalcularStatusLotePorId(testLoteId);
    expect(novoStatus).toBe('cancelado');

    const row = await query(
      'SELECT status FROM lotes_avaliacao WHERE id = $1',
      [testLoteId]
    );
    expect(row.rows[0].status).toBe('cancelado');

    // cleanup (cancelado)
    await query('DELETE FROM avaliacoes WHERE lote_id = $1', [testLoteId]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [testLoteId]);
  });

  test('Lote é concluído quando (concluídas + inativadas) == total', async () => {
    const codigo = `LF3-${Date.now()}`.slice(0, 20);
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, empresa_id, clinica_id, tipo, status) VALUES ($1,$2,$3,$4,'completo','rascunho') RETURNING id`,
      [codigo, 'Lote Final 2', empresaId, clinicaId]
    );
    const testLoteId = loteResult.rows[0].id;

    await query(
      `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1,$2,'concluida'), ($1,$3,'inativada')`,
      [testLoteId, funcionario1Cpf, funcionario2Cpf]
    );

    const { novoStatus } = await recalcularStatusLotePorId(testLoteId);
    expect(novoStatus).toBe('concluido');

    const row = await query(
      'SELECT status FROM lotes_avaliacao WHERE id = $1',
      [testLoteId]
    );
    expect(row.rows[0].status).toBe('concluido');

    // cleanup
    await query('DELETE FROM laudos WHERE lote_id = $1', [testLoteId]);
    await query('DELETE FROM avaliacoes WHERE lote_id = $1', [testLoteId]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [testLoteId]);
  });

  test('Lote não é concluído se existir avaliação pendente (ex.: inativada + pendente)', async () => {
    const codigo = `LF4-${Date.now()}`.slice(0, 20);
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, empresa_id, clinica_id, tipo, status) VALUES ($1,$2,$3,$4,'completo','rascunho') RETURNING id`,
      [codigo, 'Lote Final 3', empresaId, clinicaId]
    );
    const testLoteId = loteResult.rows[0].id;

    await query(
      `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1,$2,'inativada'), ($1,$3,'iniciada')`,
      [testLoteId, funcionario1Cpf, funcionario2Cpf]
    );

    const { novoStatus } = await recalcularStatusLotePorId(testLoteId);
    expect(novoStatus).not.toBe('concluido');
    expect(novoStatus).not.toBe('cancelado');

    // cleanup
    await query('DELETE FROM avaliacoes WHERE lote_id = $1', [testLoteId]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [testLoteId]);
  });
});
