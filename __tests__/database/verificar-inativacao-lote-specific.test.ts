import { query } from '@/lib/db';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// (LEGACY) Teste específico convertido para skipped — verifique o teste sistêmico em verificar-inativacao-systemic.test.ts
describe.skip('DB: verificar_inativacao_consecutiva - caso lote 005-060126 (skipped)', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteAnteriorId: number;
  let loteAtualId: number;
  const cpf = '99999999990'; // CPF de teste

  beforeAll(async () => {
    // Criar clinica de teste (necessaria para FK)
    const uniqueClinicaCnpj =
      '111' + (Date.now() % 1000000000).toString().padStart(9, '0');
    const resClinica = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
      ['Clinica Teste Inativacao', uniqueClinicaCnpj, true]
    );
    clinicaId = resClinica.rows[0].id;

    // Criar empresa de teste (usar CNPJ unico para evitar conflito com outros testes)
    const uniqueCnpj =
      '000' + (Date.now() % 1000000000).toString().padStart(9, '0');
    const resEmpresa = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) VALUES ($1, $2, $3) RETURNING id`,
      ['Empresa Teste Inativacao', uniqueCnpj, clinicaId]
    );
    empresaId = resEmpresa.rows[0].id;

    // Criar dois lotes: anterior (ordem 4) e atual (ordem 5) com codigo similar ao informado
    const resLoteAnt = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, clinica_id, empresa_id, liberado_por, status, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      ['005-060125', 'Lote anterior', clinicaId, empresaId, 1, 'concluido', 4]
    );
    loteAnteriorId = resLoteAnt.rows[0].id;

    const resLoteAt = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, clinica_id, empresa_id, liberado_por, status, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      ['005-060126', 'Lote 005-060126', clinicaId, empresaId, 1, 'liberado', 5]
    );
    loteAtualId = resLoteAt.rows[0].id;

    // Criar funcionario vinculado à mesma empresa sem avaliacoes anteriores
    await query(
      `INSERT INTO funcionarios (cpf, nome, ativo, perfil, contratante_id, empresa_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        cpf,
        'Funcionario Recem Inserido',
        true,
        'funcionario',
        null,
        empresaId,
        'hash_dummy',
        'analista',
      ]
    );

    // Criar avaliacao atual no lote atual (status em_andamento)
    await query(
      `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [cpf, loteAtualId, 'em_andamento']
    );
  });

  afterAll(async () => {
    // Limpar registros criados
    await query(`DELETE FROM avaliacoes WHERE funcionario_cpf = $1`, [cpf]);
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [cpf]);
    await query(`DELETE FROM lotes_avaliacao WHERE id IN ($1,$2)`, [
      loteAnteriorId,
      loteAtualId,
    ]);
    await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
    await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
  });

  it('deve permitir inativacao para funcionario recem inserido no lote 005-060126', async () => {
    const res = await query(
      `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
      [cpf, loteAtualId]
    );
    expect(res.rowCount).toBeGreaterThan(0);
    const row = res.rows[0];
    expect(row.permitido).toBe(true);
  });

  it('deve bloquear quando ja existe 1 inativacao anterior (2a inativacao)', async () => {
    // Inserir avaliacao anterior inativada (no lote anterior)
    await query(
      `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
      [cpf, loteAnteriorId, 'inativada']
    );

    const res = await query(
      `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
      [cpf, loteAtualId]
    );
    expect(res.rowCount).toBeGreaterThan(0);
    const row = res.rows[0];
    expect(row.permitido).toBe(false);
    expect(row.total_inativacoes_consecutivas).toBeGreaterThanOrEqual(1);

    // Remover a avaliacao anterior inativada para não afetar outros testes
    await query(
      `DELETE FROM avaliacoes WHERE funcionario_cpf = $1 AND lote_id = $2`,
      [cpf, loteAnteriorId]
    );
  });

  // ---------------------- cenário ENTIDADE/CONTRATANTE ----------------------
  describe('Cenario Entidade (contratante) - mesmo comportamento sistemico', () => {
    let contratanteId: number;
    let loteContratanteAntId: number;
    let loteContratanteAtId: number;
    const cpfEnt = '99999999991';

    beforeAll(async () => {
      // Criar contratante
      const resContr = await query(
        `INSERT INTO contratantes (tipo, nome, cnpj, email, responsavel_nome, responsavel_cpf, ativa, pagamento_confirmado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          'entidade',
          'Contratante Teste Inativacao',
          '22333000100',
          'contrato@teste.com',
          'Resp Teste',
          '00000000000',
          true,
          false,
        ]
      );
      contratanteId = resContr.rows[0].id;

      // Criar lotes vinculados ao contratante (ordem 4 e 5)
      const resLoteCAnt = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, contratante_id, status, liberado_por, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [
          'ENT-005-060125',
          'Lote Entidade Anterior',
          contratanteId,
          'concluido',
          1,
          4,
        ]
      );
      loteContratanteAntId = resLoteCAnt.rows[0].id;

      const resLoteCAt = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, contratante_id, status, liberado_por, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [
          'ENT-005-060126',
          'Lote Entidade Atual',
          contratanteId,
          'liberado',
          1,
          5,
        ]
      );
      loteContratanteAtId = resLoteCAt.rows[0].id;

      // Criar funcionario vinculado à contratante sem avaliacoes anteriores
      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, contratante_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          cpfEnt,
          'Funcionario Recem Entidade',
          true,
          'funcionario',
          contratanteId,
          'hash_dummy',
          'analista',
        ]
      );

      // Criar avaliacao atual no lote atual (status em_andamento)
      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1, $2, $3, NOW()) RETURNING id`,
        [cpfEnt, loteContratanteAtId, 'em_andamento']
      );
    });

    afterAll(async () => {
      await query(`DELETE FROM avaliacoes WHERE funcionario_cpf = $1`, [
        cpfEnt,
      ]);
      await query(`DELETE FROM funcionarios WHERE cpf = $1`, [cpfEnt]);
      await query(`DELETE FROM lotes_avaliacao WHERE id IN ($1,$2)`, [
        loteContratanteAntId,
        loteContratanteAtId,
      ]);
      await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);
    });

    it('deve permitir inativacao para funcionario recem inserido em entidade', async () => {
      const res = await query(
        `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
        [cpfEnt, loteContratanteAtId]
      );
      expect(res.rowCount).toBeGreaterThan(0);
      const row = res.rows[0];
      expect(row.permitido).toBe(true);
    });

    it('deve bloquear a partir da 2a inativacao no contexto da entidade', async () => {
      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
        [cpfEnt, loteContratanteAntId, 'inativada']
      );

      const res = await query(
        `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
        [cpfEnt, loteContratanteAtId]
      );
      expect(res.rowCount).toBeGreaterThan(0);
      const row = res.rows[0];
      expect(row.permitido).toBe(false);

      await query(
        `DELETE FROM avaliacoes WHERE funcionario_cpf = $1 AND lote_id = $2`,
        [cpfEnt, loteContratanteAntId]
      );
    });
  });
});
