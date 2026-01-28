import { query } from '@/lib/db';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Testes sistêmicos para verificar o comportamento global da função
// - Primeira avaliação de um funcionário recém inserido deve ser permitida
// - A partir da segunda inativação no mesmo contexto (empresa ou contratante) a operação é sinalizada

describe('DB: verificar_inativacao_consecutiva - testes sistemicos', () => {
  // ========== TESTE 1: Funcionário recém-inserido EMPRESA ==========
  describe('Empresa - funcionario recem inserido', () => {
    let clinicaId: number;
    let empresaId: number;
    let adminCpf: string;
    let loteId: number;
    let funcCpf: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      funcCpf = `99${String(timestamp).slice(-8)}`;
      adminCpf = `88${String(timestamp).slice(-8)}`;

      // Criar clinica
      const resClinica = await query(
        `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
        [`Cli${timestamp}`, `11${timestamp.toString().slice(-9)}`, true]
      );
      clinicaId = resClinica.rows[0].id;

      // Criar empresa
      const resEmpresa = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) VALUES ($1,$2,$3) RETURNING id`,
        [`Emp${timestamp}`, `00${timestamp.toString().slice(-9)}`, clinicaId]
      );
      empresaId = resEmpresa.rows[0].id;

      // Criar admin
      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, empresa_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [adminCpf, 'Admin', true, 'admin', empresaId, 'hash', 'gestao']
      );

      // Criar lote
      const resLote = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, clinica_id, empresa_id, liberado_por, status, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [`L${timestamp}`, 'Lote', clinicaId, empresaId, adminCpf, 'ativo', 1]
      );
      loteId = resLote.rows[0].id;

      // Criar funcionário sem avaliações anteriores
      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, empresa_id, clinica_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          funcCpf,
          'Func',
          true,
          'funcionario',
          empresaId,
          clinicaId,
          'hash',
          'operacional',
        ]
      );

      // Criar avaliação em andamento
      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
        [funcCpf, loteId, 'em_andamento']
      );
    });

    afterAll(async () => {
      await query(`DELETE FROM avaliacoes WHERE funcionario_cpf = $1`, [
        funcCpf,
      ]);
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
      await query(`DELETE FROM funcionarios WHERE cpf IN ($1,$2)`, [
        funcCpf,
        adminCpf,
      ]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });

    it('deve permitir inativacao (sem avaliacoes anteriores)', async () => {
      const res = await query(
        `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
        [funcCpf, loteId]
      );
      expect(res.rows[0].permitido).toBe(true);
      expect(res.rows[0].motivo).toContain('sem avaliacoes anteriores');
    });
  });

  // ========== TESTE 2: Segunda inativação EMPRESA ==========
  describe('Empresa - segunda inativacao', () => {
    let clinicaId: number;
    let empresaId: number;
    let adminCpf: string;
    let loteAntId: number;
    let loteAtualId: number;
    let funcCpf: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      funcCpf = `97${String(timestamp).slice(-8)}`;
      adminCpf = `86${String(timestamp).slice(-8)}`;

      const resClinica = await query(
        `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
        [`Cli2${timestamp}`, `12${timestamp.toString().slice(-9)}`, true]
      );
      clinicaId = resClinica.rows[0].id;

      const resEmpresa = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) VALUES ($1,$2,$3) RETURNING id`,
        [`Emp2${timestamp}`, `01${timestamp.toString().slice(-9)}`, clinicaId]
      );
      empresaId = resEmpresa.rows[0].id;

      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, empresa_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [adminCpf, 'Admin2', true, 'admin', empresaId, 'hash', 'gestao']
      );

      const resLoteAnt = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, clinica_id, empresa_id, liberado_por, status, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [
          `LA${timestamp}`,
          'Ant',
          clinicaId,
          empresaId,
          adminCpf,
          'concluido',
          1,
        ]
      );
      loteAntId = resLoteAnt.rows[0].id;

      const resLoteAtual = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, clinica_id, empresa_id, liberado_por, status, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [`LC${timestamp}`, 'Atual', clinicaId, empresaId, adminCpf, 'ativo', 2]
      );
      loteAtualId = resLoteAtual.rows[0].id;

      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, empresa_id, clinica_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          funcCpf,
          'Func2',
          true,
          'funcionario',
          empresaId,
          clinicaId,
          'hash',
          'operacional',
        ]
      );

      // Criar 1 inativação anterior
      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
        [funcCpf, loteAntId, 'inativada']
      );

      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
        [funcCpf, loteAtualId, 'em_andamento']
      );
    });

    afterAll(async () => {
      await query(`DELETE FROM avaliacoes WHERE funcionario_cpf = $1`, [
        funcCpf,
      ]);
      await query(`DELETE FROM lotes_avaliacao WHERE id IN ($1,$2)`, [
        loteAntId,
        loteAtualId,
      ]);
      await query(`DELETE FROM funcionarios WHERE cpf IN ($1,$2)`, [
        funcCpf,
        adminCpf,
      ]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });

    it('deve bloquear (ja tem 1 inativacao anterior)', async () => {
      const res = await query(
        `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
        [funcCpf, loteAtualId]
      );
      expect(res.rows[0].permitido).toBe(false);
      expect(res.rows[0].total_inativacoes_consecutivas).toBeGreaterThanOrEqual(
        1
      );
    });
  });

  // ========== TESTE 3: Funcionário recém-inserido ENTIDADE ==========
  describe('Entidade - funcionario recem inserido', () => {
    let contratanteId: number;
    let adminCpf: string;
    let loteId: number;
    let funcCpf: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      funcCpf = `960${String(timestamp).slice(-8)}`;
      adminCpf = `850${String(timestamp).slice(-8)}`;

      const resContr = await query(
        `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado, endereco, cidade, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [
          'entidade',
          `Ent${timestamp}`,
          `13${timestamp.toString().slice(-9)}`,
          'e@t.com',
          '11999999999',
          '01310-100',
          'Resp',
          adminCpf,
          'resp@t.com',
          '11888888888',
          true,
          true,
          'Rua X',
          'SP',
          'SP',
        ]
      );
      contratanteId = resContr.rows[0].id;

      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, contratante_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [adminCpf, 'Admin3', true, 'admin', contratanteId, 'hash', 'gestao']
      );

      const resLote = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, contratante_id, status, liberado_por, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [`LE${timestamp}`, 'LoteEnt', contratanteId, 'ativo', adminCpf, 1]
      );
      loteId = resLote.rows[0].id;

      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, contratante_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          funcCpf,
          'FuncEnt',
          true,
          'funcionario',
          contratanteId,
          'hash',
          'operacional',
        ]
      );

      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
        [funcCpf, loteId, 'em_andamento']
      );
    });

    afterAll(async () => {
      await query(`DELETE FROM avaliacoes WHERE funcionario_cpf = $1`, [
        funcCpf,
      ]);
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
      await query(`DELETE FROM funcionarios WHERE cpf IN ($1,$2)`, [
        funcCpf,
        adminCpf,
      ]);
      await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);
    });

    it('deve permitir inativacao (sem avaliacoes anteriores)', async () => {
      const res = await query(
        `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
        [funcCpf, loteId]
      );
      expect(res.rows[0].permitido).toBe(true);
      expect(res.rows[0].motivo).toContain('sem avaliacoes anteriores');
    });
  });

  // ========== TESTE 4: Segunda inativação ENTIDADE ==========
  describe('Entidade - segunda inativacao', () => {
    let contratanteId: number;
    let adminCpf: string;
    let loteAntId: number;
    let loteAtualId: number;
    let funcCpf: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      funcCpf = `950${String(timestamp).slice(-8)}`;
      adminCpf = `840${String(timestamp).slice(-8)}`;

      const resContr = await query(
        `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado, endereco, cidade, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [
          'entidade',
          `Ent2${timestamp}`,
          `14${timestamp.toString().slice(-9)}`,
          'e2@t.com',
          '11988888888',
          '01310-100',
          'Resp2',
          adminCpf,
          'resp2@t.com',
          '11777777777',
          true,
          true,
          'Rua Y',
          'SP',
          'SP',
        ]
      );
      contratanteId = resContr.rows[0].id;

      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, contratante_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [adminCpf, 'Admin4', true, 'admin', contratanteId, 'hash', 'gestao']
      );

      const resLoteAnt = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, contratante_id, status, liberado_por, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [`LEA${timestamp}`, 'Ant', contratanteId, 'concluido', adminCpf, 1]
      );
      loteAntId = resLoteAnt.rows[0].id;

      const resLoteAtual = await query(
        `INSERT INTO lotes_avaliacao (codigo, titulo, contratante_id, status, liberado_por, numero_ordem) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [`LEC${timestamp}`, 'Atual', contratanteId, 'ativo', adminCpf, 2]
      );
      loteAtualId = resLoteAtual.rows[0].id;

      await query(
        `INSERT INTO funcionarios (cpf, nome, ativo, perfil, contratante_id, senha_hash, nivel_cargo) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          funcCpf,
          'FuncEnt2',
          true,
          'funcionario',
          contratanteId,
          'hash',
          'operacional',
        ]
      );

      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
        [funcCpf, loteAntId, 'inativada']
      );

      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em) VALUES ($1,$2,$3,NOW())`,
        [funcCpf, loteAtualId, 'em_andamento']
      );
    });

    afterAll(async () => {
      await query(`DELETE FROM avaliacoes WHERE funcionario_cpf = $1`, [
        funcCpf,
      ]);
      await query(`DELETE FROM lotes_avaliacao WHERE id IN ($1,$2)`, [
        loteAntId,
        loteAtualId,
      ]);
      await query(`DELETE FROM funcionarios WHERE cpf IN ($1,$2)`, [
        funcCpf,
        adminCpf,
      ]);
      await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);
    });

    it('deve bloquear (ja tem 1 inativacao anterior)', async () => {
      const res = await query(
        `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
        [funcCpf, loteAtualId]
      );
      expect(res.rows[0].permitido).toBe(false);
      expect(res.rows[0].total_inativacoes_consecutivas).toBeGreaterThanOrEqual(
        1
      );
    });
  });
});
