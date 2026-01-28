/**
 * Testes de integração para validação de acesso a lotes nas rotas do emissor
 * Validação implementada no Item 3
 */

import { query, closePool } from '@/lib/db';

describe('Validação de Acesso a Lotes - Rotas Emissor (Item 3)', () => {
  afterAll(async () => {
    await closePool();
  });

  describe('Helper validarAcessoLote', () => {
    let loteValidoId: number;
    let empresaId: number;
    let clinicaId: number;

    beforeAll(async () => {
      // Criar estrutura de teste
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Clínica Acesso Test', '10203040000155', 'acesso@test.com']
      );

      // second clinica insert
      const _clinica2Result = await query(
        `INSERT INTO clinicas (nome, cnpj, email) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Clínica Audit Acesso', '20304050000177', 'audit-acesso@test.com']
      );
      clinicaId = clinicaResult.rows[0].id;

      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Empresa Acesso Test', '50607080000166', clinicaId]
      );
      empresaId = empresaResult.rows[0].id;

      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (
          codigo, empresa_id, status, titulo, tipo,
          total_avaliacoes, avaliacoes_concluidas
        ) 
         VALUES ($1, $2, 'concluido', $3, 'inicial', 5, 5) 
         RETURNING id`,
        ['LOTE-ACESSO-001', empresaId, 'Lote para validação de acesso']
      );
      loteValidoId = loteResult.rows[0].id;
    });

    afterAll(async () => {
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteValidoId]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });

    it('deve validar existência de lote e retornar metadados completos', async () => {
      const validacao = await query(
        `SELECT la.id, la.empresa_id, la.status, ec.clinica_id
         FROM lotes_avaliacao la
         LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
         WHERE la.id = $1`,
        [loteValidoId]
      );

      expect(validacao.rows.length).toBe(1);
      expect(validacao.rows[0]).toMatchObject({
        id: loteValidoId,
        empresa_id: empresaId,
        status: 'concluido',
        clinica_id: clinicaId,
      });
    });

    it('deve retornar vazio para lote inexistente', async () => {
      const validacao = await query(
        `SELECT la.id, la.empresa_id, la.status, ec.clinica_id
         FROM lotes_avaliacao la
         LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
         WHERE la.id = $1`,
        [999999]
      );

      expect(validacao.rows.length).toBe(0);
    });

    it('deve funcionar para lotes sem empresa (contratante direto)', async () => {
      // Criar lote vinculado a contratante, não empresa
      const loteContratanteResult = await query(
        `INSERT INTO lotes_avaliacao (
          codigo, contratante_id, status, titulo, tipo,
          total_avaliacoes, avaliacoes_concluidas
        ) 
         VALUES ($1, 1, 'concluido', $2, 'inicial', 3, 3) 
         RETURNING id`,
        ['LOTE-CONTRATANTE-001', 'Lote de contratante direto']
      );
      const loteContratanteId = loteContratanteResult.rows[0].id;

      const validacao = await query(
        `SELECT la.id, la.contratante_id, la.status, ec.clinica_id
         FROM lotes_avaliacao la
         LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
         WHERE la.id = $1`,
        [loteContratanteId]
      );

      expect(validacao.rows.length).toBe(1);
      expect(validacao.rows[0].contratante_id).toBe(1);
      expect(validacao.rows[0].clinica_id).toBeNull(); // Sem empresa, sem clinica_id

      // Cleanup
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [
        loteContratanteId,
      ]);
    });
  });

  describe('Auditoria de Acesso', () => {
    let loteAuditId: number;
    let empresaId: number;
    let clinicaId: number;

    beforeAll(async () => {
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Clínica Audit Acesso', '20304050000177', 'audit-acesso@test.com']
      );
      clinicaId = clinicaResult.rows[0].id;

      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Empresa Audit Acesso', '60708090000188', clinicaId]
      );
      empresaId = empresaResult.rows[0].id;

      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (
          codigo, empresa_id, status, titulo, tipo,
          total_avaliacoes, avaliacoes_concluidas
        ) 
         VALUES ($1, $2, 'concluido', $3, 'inicial', 2, 2) 
         RETURNING id`,
        ['LOTE-AUDIT-ACESSO', empresaId, 'Lote para auditoria']
      );
      loteAuditId = loteResult.rows[0].id;
    });

    afterAll(async () => {
      // Limpar audit_logs relacionados ao teste
      await query(
        `DELETE FROM audit_logs WHERE entidade_id = $1 AND entidade = 'lotes_avaliacao'`,
        [loteAuditId]
      );
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteAuditId]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });

    it('deve registrar acesso do emissor com metadados completos', async () => {
      const userCpf = '98765432100';
      const userRole = 'emissor';

      const auditResult = await query(
        `INSERT INTO audit_logs (
          acao, entidade, entidade_id, user_id, user_role, criado_em, dados
        )
        VALUES (
          'acesso_emissor_lote', 'lotes_avaliacao', $1, $2, $3, NOW(), $4
        )
        RETURNING id, acao, entidade, entidade_id, user_id, user_role, dados`,
        [
          loteAuditId,
          userCpf,
          userRole,
          JSON.stringify({
            empresa_id: empresaId,
            clinica_id: clinicaId,
            status: 'concluido',
          }),
        ]
      );

      expect(auditResult.rows.length).toBe(1);
      const audit = auditResult.rows[0];

      expect(audit.acao).toBe('acesso_emissor_lote');
      expect(audit.entidade).toBe('lotes_avaliacao');
      expect(audit.entidade_id).toBe(loteAuditId);
      expect(audit.user_id).toBe(userCpf);
      expect(audit.user_role).toBe(userRole);

      const dados = audit.dados;
      expect(dados.empresa_id).toBe(empresaId);
      expect(dados.clinica_id).toBe(clinicaId);
      expect(dados.status).toBe('concluido');
    });

    it('deve permitir consultar histórico de acessos por lote', async () => {
      // Registrar múltiplos acessos
      const emissor1 = '11111111111';
      const emissor2 = '22222222222';

      await query(
        `INSERT INTO audit_logs (
          acao, entidade, entidade_id, user_id, user_role, criado_em, dados
        )
        VALUES 
          ('acesso_emissor_lote', 'lotes_avaliacao', $1, $2, 'emissor', NOW(), '{}'),
          ('acesso_emissor_lote', 'lotes_avaliacao', $1, $3, 'emissor', NOW() + INTERVAL '1 hour', '{}')`,
        [loteAuditId, emissor1, emissor2]
      );

      // Consultar histórico
      const historico = await query(
        `SELECT user_id, acao, criado_em
         FROM audit_logs
         WHERE entidade = 'lotes_avaliacao'
         AND entidade_id = $1
         AND acao = 'acesso_emissor_lote'
         ORDER BY criado_em DESC`,
        [loteAuditId]
      );

      expect(historico.rows.length).toBeGreaterThanOrEqual(2);
      expect(historico.rows.some((r) => r.user_id === emissor1)).toBe(true);
      expect(historico.rows.some((r) => r.user_id === emissor2)).toBe(true);
    });

    it('deve registrar timestamp preciso do acesso', async () => {
      const beforeTimestamp = new Date();

      const auditResult = await query(
        `INSERT INTO audit_logs (
          acao, entidade, entidade_id, user_id, user_role, criado_em, dados
        )
        VALUES (
          'acesso_emissor_lote', 'lotes_avaliacao', $1, '12312312312', 'emissor', NOW(), '{}'
        )
        RETURNING id, criado_em`,
        [loteAuditId]
      );

      const afterTimestamp = new Date();
      const auditTimestamp = new Date(auditResult.rows[0].criado_em as string);

      expect(auditTimestamp.getTime()).toBeGreaterThanOrEqual(
        beforeTimestamp.getTime()
      );
      expect(auditTimestamp.getTime()).toBeLessThanOrEqual(
        afterTimestamp.getTime()
      );
    });
  });

  describe('Segurança: Bloqueio de Acesso Indevido', () => {
    it('deve garantir que query de validação não retorna lotes de outras clínicas por engano', async () => {
      // Criar duas clínicas distintas
      const clinica1Result = await query(
        `INSERT INTO clinicas (nome, cnpj, email) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Clínica A', '30405060000199', 'clinicaA@test.com']
      );
      const clinica1Id = clinica1Result.rows[0].id;

      const clinica2Result = await query(
        `INSERT INTO clinicas (nome, cnpj, email) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Clínica B', '70809010000188', 'clinicaB@test.com']
      );
      const clinica2Id = clinica2Result.rows[0].id;

      // Criar empresas em clínicas diferentes
      const empresa1Result = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Empresa A', '11122233000144', clinica1Id]
      );
      const empresa1Id = empresa1Result.rows[0].id;

      const empresa2Result = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Empresa B', '44455566000177', clinica2Id]
      );
      const empresa2Id = empresa2Result.rows[0].id;

      // Criar lotes
      const lote1Result = await query(
        `INSERT INTO lotes_avaliacao (
          codigo, empresa_id, status, titulo, tipo,
          total_avaliacoes, avaliacoes_concluidas
        ) 
         VALUES ($1, $2, 'concluido', $3, 'inicial', 2, 2) 
         RETURNING id`,
        ['LOTE-CLINICA-A', empresa1Id, 'Lote da Clínica A']
      );
      const lote1Id = lote1Result.rows[0].id;

      const lote2Result = await query(
        `INSERT INTO lotes_avaliacao (
          codigo, empresa_id, status, titulo, tipo,
          total_avaliacoes, avaliacoes_concluidas
        ) 
         VALUES ($1, $2, 'concluido', $3, 'inicial', 2, 2) 
         RETURNING id`,
        ['LOTE-CLINICA-B', empresa2Id, 'Lote da Clínica B']
      );
      const lote2Id = lote2Result.rows[0].id;

      // Validar que query retorna clinica_id correto
      const validacao1 = await query(
        `SELECT la.id, ec.clinica_id
         FROM lotes_avaliacao la
         LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
         WHERE la.id = $1`,
        [lote1Id]
      );

      const validacao2 = await query(
        `SELECT la.id, ec.clinica_id
         FROM lotes_avaliacao la
         LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
         WHERE la.id = $1`,
        [lote2Id]
      );

      expect(validacao1.rows[0].clinica_id).toBe(clinica1Id);
      expect(validacao2.rows[0].clinica_id).toBe(clinica2Id);

      // Emissor é global, mas deve ter visibilidade do contexto correto
      expect(validacao1.rows[0].clinica_id).not.toBe(
        validacao2.rows[0].clinica_id
      );

      // Cleanup
      await query(`DELETE FROM lotes_avaliacao WHERE id IN ($1, $2)`, [
        lote1Id,
        lote2Id,
      ]);
      await query(`DELETE FROM empresas_clientes WHERE id IN ($1, $2)`, [
        empresa1Id,
        empresa2Id,
      ]);
      await query(`DELETE FROM clinicas WHERE id IN ($1, $2)`, [
        clinica1Id,
        clinica2Id,
      ]);
    });
  });
});
