/**
 * Testes de Isolamento: Entidades vs Clínicas
 *
 * Valida que:
 * - Funcionários de ENTIDADES não aparecem em queries de CLÍNICA
 * - Funcionários de EMPRESAS/CLÍNICAS não aparecem em queries de ENTIDADE
 * - Lotes de ENTIDADES não aparecem em queries de CLÍNICA
 * - Lotes de CLÍNICAS não aparecem em queries de ENTIDADE
 * - Avaliações respeitam o isolamento entre os dois fluxos
 */

import { query } from '@/lib/db';

describe('Isolamento: Entidades vs Clínicas', () => {
  // Dados da Entidade
  let entidadeId: number;
  let gestorEntidadeCpf: string;
  let funcEntidadeCpf: string;
  let loteEntidadeId: number;
  let avaliacaoEntidadeId: number;

  // Dados da Clínica
  let tomadorClinicaId: number;
  let clinicaId: number;
  let rhCpf: string;
  let empresaId: number;
  let funcClinicaCpf: string;
  let loteClinicaId: number;
  let avaliacaoClinicaId: number;

  beforeAll(async () => {
    const timestamp = Date.now();

    // ========================================
    // SETUP ENTIDADE
    // ========================================

    // 1. Criar entidade
    const entidadeResult = await query(
      `INSERT INTO entidades (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa, pagamento_confirmado, status
      ) VALUES (
        'entidade', $1, $2, $3, '1199999999', 'Rua Entidade', 'São Paulo', 'SP', '01234567',
        'Resp Entidade', '11111111111', $4, '11988888888',
        true, true, 'ativa'
      ) RETURNING id`,
      [
        `Entidade Isolamento ${timestamp}`,
        `${String(timestamp).slice(-8)}0001${String(timestamp % 100).padStart(2, '0')}`,
        `entidade_iso${timestamp}@teste.com`,
        `resp_ent${timestamp}@teste.com`,
      ]
    );
    entidadeId = entidadeResult.rows[0].id;

    // 2. Criar gestor da entidade
    gestorEntidadeCpf = `${String(timestamp + 1000).slice(-11)}`;
    await query(
      `INSERT INTO usuarios (
        cpf, nome, email, senha_hash, tipo_usuario, entidade_id, ativo
      ) VALUES ($1, 'Gestor Entidade Iso', $2, $3, 'gestor', $4, true)`,
      [
        gestorEntidadeCpf,
        `gestor_ent${timestamp}@teste.com`,
        '$2b$10$dummyhash',
        entidadeId,
      ]
    );

    // 3. Criar funcionário de entidade
    funcEntidadeCpf = `${String(timestamp + 2000).slice(-11)}`;
    await query(
      `INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, tomador_id, ativo, nivel_cargo
      ) VALUES ($1, 'Func Entidade Iso', $2, $3, 'funcionario', $4, true, 'operacional')`,
      [
        funcEntidadeCpf,
        `func_ent${timestamp}@teste.com`,
        '$2b$10$dummyhash',
        entidadeId,
      ]
    );

    // 4. Criar lote de entidade
    const loteEntResult = await query(
      `INSERT INTO lotes_avaliacao (
        tomador_id, codigo, titulo, tipo, status, liberado_por, numero_ordem
      ) VALUES ($1, $2, $3, 'completo', 'ativo', $4, 1)
      RETURNING id`,
      [
        entidadeId,
        `ENT-ISO-${timestamp}`,
        `Lote Entidade Isolamento ${timestamp}`,
        gestorEntidadeCpf,
      ]
    );
    loteEntidadeId = loteEntResult.rows[0].id;

    // 5. Criar avaliação de entidade
    const avalEntResult = await query(
      `INSERT INTO avaliacoes (
        funcionario_cpf, lote_id, status, criado_em
      ) VALUES ($1, $2, 'iniciada', NOW())
      RETURNING id`,
      [funcEntidadeCpf, loteEntidadeId]
    );
    avaliacaoEntidadeId = avalEntResult.rows[0].id;

    // ========================================
    // SETUP CLÍNICA
    // ========================================

    // 1. Criar clínica
    const contClinicaResult = await query(
      `INSERT INTO clinicas (
        nome, cnpj, email, ativa
      ) VALUES (
        $1, $2, $3, true
      ) RETURNING id`,
      [
        `Clínica Isolamento ${timestamp}`,
        `${String(timestamp).slice(-8)}0002${String(timestamp % 100).padStart(2, '0')}`,
        `clinica_iso${timestamp}@teste.com`,
      ]
    );
    tomadorClinicaId = contClinicaResult.rows[0].id;
    clinicaId = tomadorClinicaId;

    // 3. Criar gestor RH
    rhCpf = `${String(timestamp + 3000).slice(-11)}`;
    await query(
      `INSERT INTO usuarios (
        cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo
      ) VALUES ($1, 'RH Clínica Iso', $2, $3, 'rh', $4, true)`,
      [rhCpf, `rh${timestamp}@teste.com`, '$2b$10$dummyhash', clinicaId]
    );

    // 4. Criar empresa cliente
    const empresaResult = await query(
      `INSERT INTO empresas_clientes (
        nome, cnpj, email, telefone, endereco, clinica_id, ativa
      ) VALUES ($1, $2, $3, '1188888888', 'Rua Empresa', $4, true)
      RETURNING id`,
      [
        `Empresa Isolamento ${timestamp}`,
        `${String(timestamp).slice(-8)}0003${String(timestamp % 100).padStart(2, '0')}`,
        `empresa_iso${timestamp}@teste.com`,
        clinicaId,
      ]
    );
    empresaId = empresaResult.rows[0].id;

    // 5. Criar funcionário de empresa
    funcClinicaCpf = `${String(timestamp + 4000).slice(-11)}`;
    await query(
      `INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, ativo, nivel_cargo
      ) VALUES ($1, 'Func Empresa Iso', $2, $3, 'funcionario', $4, $5, true, 'operacional')`,
      [
        funcClinicaCpf,
        `func_emp${timestamp}@teste.com`,
        '$2b$10$dummyhash',
        empresaId,
        clinicaId,
      ]
    );

    // 6. Criar lote de clínica
    const loteCliResult = await query(
      `INSERT INTO lotes_avaliacao (
        clinica_id, empresa_id, codigo, titulo, tipo, status, liberado_por, numero_ordem
      ) VALUES ($1, $2, $3, $4, 'completo', 'ativo', $5, 1)
      RETURNING id`,
      [
        clinicaId,
        empresaId,
        `CLI-ISO-${timestamp}`,
        `Lote Clínica Isolamento ${timestamp}`,
        rhCpf,
      ]
    );
    loteClinicaId = loteCliResult.rows[0].id;

    // 7. Criar avaliação de clínica
    const avalCliResult = await query(
      `INSERT INTO avaliacoes (
        funcionario_cpf, lote_id, status, criado_em
      ) VALUES ($1, $2, 'iniciada', NOW())
      RETURNING id`,
      [funcClinicaCpf, loteClinicaId]
    );
    avaliacaoClinicaId = avalCliResult.rows[0].id;
  });

  afterAll(async () => {
    // Limpeza Clínica
    if (avaliacaoClinicaId) {
      await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoClinicaId]);
    }
    if (loteClinicaId) {
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteClinicaId]);
    }
    if (funcClinicaCpf) {
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcClinicaCpf]);
    }
    if (empresaId) {
      await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    }
    if (rhCpf) {
      await query('DELETE FROM usuarios WHERE cpf = $1', [rhCpf]);
    }
    if (clinicaId) {
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    }
    if (tomadorClinicaId) {
      await query('DELETE FROM tomadors WHERE id = $1', [
        tomadorClinicaId,
      ]);
    }

    // Limpeza Entidade
    if (avaliacaoEntidadeId) {
      await query('DELETE FROM avaliacoes WHERE id = $1', [
        avaliacaoEntidadeId,
      ]);
    }
    if (loteEntidadeId) {
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
        loteEntidadeId,
      ]);
    }
    if (funcEntidadeCpf) {
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcEntidadeCpf]);
    }
    if (gestorEntidadeCpf) {
      await query('DELETE FROM usuarios WHERE cpf = $1', [gestorEntidadeCpf]);
    }
    if (entidadeId) {
      await query('DELETE FROM tomadors WHERE id = $1', [entidadeId]);
    }
  });

  describe('1. Isolamento de Funcionários', () => {
    it('funcionário de ENTIDADE NÃO deve aparecer em query de CLÍNICA', async () => {
      const result = await query(
        `SELECT cpf, tomador_id, clinica_id, empresa_id
         FROM funcionarios
         WHERE clinica_id = $1 AND cpf = $2`,
        [clinicaId, funcEntidadeCpf]
      );

      expect(result.rows.length).toBe(0); // NÃO deve encontrar
    });

    it('funcionário de EMPRESA/CLÍNICA NÃO deve aparecer em query de ENTIDADE', async () => {
      const result = await query(
        `SELECT cpf, tomador_id, clinica_id, empresa_id
         FROM funcionarios
         WHERE tomador_id = $1 AND cpf = $2`,
        [entidadeId, funcClinicaCpf]
      );

      expect(result.rows.length).toBe(0); // NÃO deve encontrar
    });

    it('query de funcionários de ENTIDADE deve retornar APENAS funcionários com tomador_id', async () => {
      const result = await query(
        `SELECT cpf, tomador_id, clinica_id, empresa_id
         FROM funcionarios
         WHERE tomador_id = $1`,
        [entidadeId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((func) => {
        expect(func.tomador_id).toBe(entidadeId);
        expect(func.clinica_id).toBeNull();
        expect(func.empresa_id).toBeNull();
      });
    });

    it('query de funcionários de CLÍNICA deve retornar APENAS funcionários com clinica_id', async () => {
      const result = await query(
        `SELECT cpf, tomador_id, clinica_id, empresa_id
         FROM funcionarios
         WHERE clinica_id = $1`,
        [clinicaId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((func) => {
        expect(func.clinica_id).toBe(clinicaId);
        expect(func.tomador_id).toBeNull();
        expect(func.empresa_id).not.toBeNull();
      });
    });
  });

  describe('2. Isolamento de Lotes', () => {
    it('lote de ENTIDADE NÃO deve aparecer em query de CLÍNICA', async () => {
      const result = await query(
        `SELECT id, tomador_id, clinica_id, empresa_id
         FROM lotes_avaliacao
         WHERE clinica_id = $1 AND id = $2`,
        [clinicaId, loteEntidadeId]
      );

      expect(result.rows.length).toBe(0); // NÃO deve encontrar
    });

    it('lote de CLÍNICA NÃO deve aparecer em query de ENTIDADE', async () => {
      const result = await query(
        `SELECT id, tomador_id, clinica_id, empresa_id
         FROM lotes_avaliacao
         WHERE tomador_id = $1 AND id = $2`,
        [entidadeId, loteClinicaId]
      );

      expect(result.rows.length).toBe(0); // NÃO deve encontrar
    });

    it('query de lotes de ENTIDADE deve retornar APENAS lotes com tomador_id', async () => {
      const result = await query(
        `SELECT id, tomador_id, clinica_id, empresa_id
         FROM lotes_avaliacao
         WHERE tomador_id = $1`,
        [entidadeId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((lote) => {
        expect(lote.tomador_id).toBe(entidadeId);
        expect(lote.clinica_id).toBeNull();
        expect(lote.empresa_id).toBeNull();
      });
    });

    it('query de lotes de CLÍNICA deve retornar APENAS lotes com clinica_id', async () => {
      const result = await query(
        `SELECT id, tomador_id, clinica_id, empresa_id
         FROM lotes_avaliacao
         WHERE clinica_id = $1`,
        [clinicaId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((lote) => {
        expect(lote.clinica_id).toBe(clinicaId);
        expect(lote.tomador_id).toBeNull();
        expect(lote.empresa_id).not.toBeNull();
      });
    });
  });

  describe('3. Isolamento de Avaliações', () => {
    it('avaliação de funcionário ENTIDADE NÃO deve aparecer em query de CLÍNICA', async () => {
      const result = await query(
        `SELECT a.id, f.tomador_id, f.clinica_id
         FROM avaliacoes a
         JOIN funcionarios f ON a.funcionario_cpf = f.cpf
         WHERE f.clinica_id = $1 AND a.id = $2`,
        [clinicaId, avaliacaoEntidadeId]
      );

      expect(result.rows.length).toBe(0); // NÃO deve encontrar
    });

    it('avaliação de funcionário CLÍNICA NÃO deve aparecer em query de ENTIDADE', async () => {
      const result = await query(
        `SELECT a.id, f.tomador_id, f.clinica_id
         FROM avaliacoes a
         JOIN funcionarios f ON a.funcionario_cpf = f.cpf
         WHERE f.tomador_id = $1 AND a.id = $2`,
        [entidadeId, avaliacaoClinicaId]
      );

      expect(result.rows.length).toBe(0); // NÃO deve encontrar
    });

    it('query de avaliações de ENTIDADE deve respeitar isolamento', async () => {
      const result = await query(
        `SELECT a.id, a.lote_id, f.tomador_id, f.clinica_id, l.tomador_id as lote_tomador_id
         FROM avaliacoes a
         JOIN funcionarios f ON a.funcionario_cpf = f.cpf
         JOIN lotes_avaliacao l ON a.lote_id = l.id
         WHERE f.tomador_id = $1 AND l.tomador_id = $1`,
        [entidadeId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((aval) => {
        expect(aval.tomador_id).toBe(entidadeId);
        expect(aval.lote_tomador_id).toBe(entidadeId);
        expect(aval.clinica_id).toBeNull();
      });
    });

    it('query de avaliações de CLÍNICA deve respeitar isolamento', async () => {
      const result = await query(
        `SELECT a.id, a.lote_id, f.clinica_id, l.clinica_id as lote_clinica_id
         FROM avaliacoes a
         JOIN funcionarios f ON a.funcionario_cpf = f.cpf
         JOIN lotes_avaliacao l ON a.lote_id = l.id
         WHERE f.clinica_id = $1 AND l.clinica_id = $1`,
        [clinicaId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((aval) => {
        expect(aval.clinica_id).toBe(clinicaId);
        expect(aval.lote_clinica_id).toBe(clinicaId);
      });
    });
  });

  describe('4. Validar Exclusividade de Campos', () => {
    it('funcionário NÃO pode ter tomador_id E clinica_id ao mesmo tempo', async () => {
      const allFuncs = await query(
        `SELECT cpf, tomador_id, clinica_id
         FROM funcionarios
         WHERE tomador_id IS NOT NULL AND clinica_id IS NOT NULL`
      );

      expect(allFuncs.rows.length).toBe(0); // ZERO registros com ambos preenchidos
    });

    it('lote NÃO pode ter tomador_id E clinica_id ao mesmo tempo', async () => {
      const allLotes = await query(
        `SELECT id, tomador_id, clinica_id
         FROM lotes_avaliacao
         WHERE tomador_id IS NOT NULL AND clinica_id IS NOT NULL`
      );

      expect(allLotes.rows.length).toBe(0); // ZERO registros com ambos preenchidos
    });

    it('funcionário de entidade DEVE ter tomador_id E NÃO ter clinica_id/empresa_id', async () => {
      const result = await query(
        `SELECT cpf, tomador_id, clinica_id, empresa_id
         FROM funcionarios
         WHERE cpf = $1`,
        [funcEntidadeCpf]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tomador_id).toBe(entidadeId);
      expect(result.rows[0].clinica_id).toBeNull();
      expect(result.rows[0].empresa_id).toBeNull();
    });

    it('funcionário de empresa DEVE ter clinica_id E empresa_id E NÃO ter tomador_id', async () => {
      const result = await query(
        `SELECT cpf, tomador_id, clinica_id, empresa_id
         FROM funcionarios
         WHERE cpf = $1`,
        [funcClinicaCpf]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tomador_id).toBeNull();
      expect(result.rows[0].clinica_id).toBe(clinicaId);
      expect(result.rows[0].empresa_id).toBe(empresaId);
    });
  });

  describe('5. Validar Contagem de Recursos', () => {
    it('deve contar corretamente funcionários de ENTIDADE vs CLÍNICA', async () => {
      const countEntidade = await query(
        `SELECT COUNT(*) as total FROM funcionarios WHERE tomador_id = $1`,
        [entidadeId]
      );

      const countClinica = await query(
        `SELECT COUNT(*) as total FROM funcionarios WHERE clinica_id = $1`,
        [clinicaId]
      );

      expect(parseInt(countEntidade.rows[0].total)).toBeGreaterThan(0);
      expect(parseInt(countClinica.rows[0].total)).toBeGreaterThan(0);

      // Devem ser conjuntos diferentes
      expect(countEntidade.rows[0].total).not.toBe(countClinica.rows[0].total);
    });

    it('deve contar corretamente lotes de ENTIDADE vs CLÍNICA', async () => {
      const countEntidade = await query(
        `SELECT COUNT(*) as total FROM lotes_avaliacao WHERE tomador_id = $1`,
        [entidadeId]
      );

      const countClinica = await query(
        `SELECT COUNT(*) as total FROM lotes_avaliacao WHERE clinica_id = $1`,
        [clinicaId]
      );

      expect(parseInt(countEntidade.rows[0].total)).toBeGreaterThan(0);
      expect(parseInt(countClinica.rows[0].total)).toBeGreaterThan(0);
    });
  });
});
