/**
 * Teste de integração: Imutabilidade de lote após emissão de laudo + persistência do laudo
 *
 * Cenário:
 * 1. Criar lote com 2 avaliações
 * 2. Inativar 1 avaliação (resta 1 concluída + 1 inativada)
 * 3. Recalcular status → deve ficar 'concluido' e emitir laudo automaticamente
 * 4. Verificar que laudo foi persistido em storage/laudos/
 * 5. Tentar atualizar status do lote → deve falhar devido ao trigger de imutabilidade
 */

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

import { query } from '@/lib/db';
import { recalcularStatusLotePorId } from '@/lib/lotes';
import { uniqueCode } from '../helpers/test-data-factory';

describe('Imutabilidade de Lote + Persistência de Laudo - Integração', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let avaliacao1Id: number;
  let avaliacao2Id: number;
  const emissorCpf = '77777777777';

  beforeAll(async () => {
    // Desabilitar triggers temporariamente para cleanup
    await query(`ALTER TABLE laudos DISABLE TRIGGER trg_immutable_laudo`);
    await query(
      `ALTER TABLE laudos DISABLE TRIGGER trg_prevent_laudo_lote_id_change`
    );
    await query(
      `ALTER TABLE lotes_avaliacao DISABLE TRIGGER trg_immutable_lote`
    );

    // Cleanup
    await query(
      `DELETE FROM laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE liberado_por = $1)`,
      [emissorCpf]
    );
    await query(`DELETE FROM lotes_avaliacao WHERE liberado_por = $1`, [
      emissorCpf,
    ]);
    await query(
      `DELETE FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE liberado_por = $1)`,
      [emissorCpf]
    );
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [emissorCpf]);

    // Reabilitar triggers
    await query(`ALTER TABLE laudos ENABLE TRIGGER trg_immutable_laudo`);
    await query(
      `ALTER TABLE laudos ENABLE TRIGGER trg_prevent_laudo_lote_id_change`
    );
    await query(
      `ALTER TABLE lotes_avaliacao ENABLE TRIGGER trg_immutable_lote`
    );

    // Criar clínica
    const clinicaResult = await query(
      `INSERT INTO contratantes (cnpj, razao_social, tipo, ativo) VALUES ($1, $2, $3, true) RETURNING id`,
      ['11122233000144', 'Clínica Teste Imutabilidade', 'clinica']
    );
    clinicaId = clinicaResult.rows[0].id;

    // Criar empresa
    const empresaResult = await query(
      `INSERT INTO empresas_clientes (cnpj, razao_social, contratante_id, ativo) VALUES ($1, $2, $3, true) RETURNING id`,
      ['55566677000188', 'Empresa Teste Imutabilidade', clinicaId]
    );
    empresaId = empresaResult.rows[0].id;

    // Criar emissor
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, contratante_id)
       VALUES ($1, $2, $3, $4, $5, true, $6)`,
      [
        emissorCpf,
        'Emissor Teste',
        'emissor@teste.com',
        '$2b$10$dummyhash',
        'emissor',
        clinicaId,
      ]
    );

    // Criar lote
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (contratante_id, empresa_id, liberado_por, status)
       VALUES ($1, $2, $3, $4, 'ativo') RETURNING id`,
      [uniqueCode(), clinicaId, empresaId, emissorCpf]
    );
    loteId = loteResult.rows[0].id;

    // Criar 2 funcionários para avaliações
    const func1Result = await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, contratante_id)
       VALUES ($1, $2, $3, $4, $5, true, $6) RETURNING id`,
      [
        '88888888888',
        'Funcionário 1',
        'func1@teste.com',
        '$2b$10$dummyhash',
        'funcionario',
        clinicaId,
      ]
    );
    const func1Id = func1Result.rows[0].id;

    const func2Result = await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, contratante_id)
       VALUES ($1, $2, $3, $4, $5, true, $6) RETURNING id`,
      [
        '99999999999',
        'Funcionário 2',
        'func2@teste.com',
        '$2b$10$dummyhash',
        'funcionario',
        clinicaId,
      ]
    );
    const func2Id = func2Result.rows[0].id;

    // Criar 2 avaliações concluídas
    const aval1Result = await query(
      `INSERT INTO avaliacoes (lote_id, funcionario_id, status, concluida_em)
       VALUES ($1, $2, 'concluida', NOW()) RETURNING id`,
      [loteId, func1Id]
    );
    avaliacao1Id = aval1Result.rows[0].id;

    const aval2Result = await query(
      `INSERT INTO avaliacoes (lote_id, funcionario_id, status, concluida_em)
       VALUES ($1, $2, 'concluida', NOW()) RETURNING id`,
      [loteId, func2Id]
    );
    avaliacao2Id = aval2Result.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await query(`ALTER TABLE laudos DISABLE TRIGGER trg_immutable_laudo`);
    await query(
      `ALTER TABLE laudos DISABLE TRIGGER trg_prevent_laudo_lote_id_change`
    );
    await query(
      `ALTER TABLE lotes_avaliacao DISABLE TRIGGER trg_immutable_lote`
    );

    await query(`DELETE FROM laudos WHERE lote_id = $1`, [loteId]);
    await query(`DELETE FROM avaliacoes WHERE lote_id = $1`, [loteId]);
    await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    await query(`DELETE FROM funcionarios WHERE cpf IN ($1, $2, $3)`, [
      emissorCpf,
      '88888888888',
      '99999999999',
    ]);
    await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
    await query(`DELETE FROM contratantes WHERE id = $1`, [clinicaId]);

    await query(`ALTER TABLE laudos ENABLE TRIGGER trg_immutable_laudo`);
    await query(
      `ALTER TABLE laudos ENABLE TRIGGER trg_prevent_laudo_lote_id_change`
    );
    await query(
      `ALTER TABLE lotes_avaliacao ENABLE TRIGGER trg_immutable_lote`
    );
  });

  test('Deve emitir laudo automaticamente ao concluir lote e persistir arquivos', async () => {
    // Inativar uma avaliação (resta 1 concluída + 1 inativada = concluído)
    await query(`UPDATE avaliacoes SET status = 'inativada' WHERE id = $1`, [
      avaliacao2Id,
    ]);

    // Recalcular status → deve emitir laudo
    const novoStatus = await recalcularStatusLotePorId(loteId);
    expect(novoStatus).toBe('concluido');

    // Verificar que laudo foi criado
    const laudoResult = await query(
      `SELECT id, status FROM laudos WHERE lote_id = $1`,
      [loteId]
    );
    expect(laudoResult.rows.length).toBe(1);
    const laudoId = laudoResult.rows[0].id;
    expect(laudoResult.rows[0].status).toBe('emitido'); // Status emitido ao gerar

    // Verificar persistência dos arquivos
    const fs = await import('fs/promises');
    const path = await import('path');
    const pdfPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.pdf`
    );
    const jsonPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );

    await expect(fs.access(pdfPath)).resolves.toBeUndefined();
    await expect(fs.access(jsonPath)).resolves.toBeUndefined();

    // Verificar conteúdo do JSON
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const meta = JSON.parse(jsonContent);
    expect(meta).toHaveProperty('hash');
    expect(typeof meta.hash).toBe('string');
  });

  test('Deve impedir atualização do lote após emissão do laudo devido ao trigger de imutabilidade', async () => {
    // Tentar atualizar status do lote (já deve ter laudo enviado do teste anterior)
    await expect(
      query(`UPDATE lotes_avaliacao SET status = 'ativo' WHERE id = $1`, [
        loteId,
      ])
    ).rejects.toThrow(/Lote possui laudo enviado/);
  });
});
