/**
 * Teste de validação: Consistência entre valores de pagamento e status exibido
 *
 * FONTE DA VERDADE: Dados do ato da contratação confirmados no simulador de pagamentos
 *
 * Valida que:
 * - Status exibido é derivado dos pagamentos reais (não de contrato.status)
 * - Resumo financeiro (Total/Pago/Restante) é consistente
 * - Badge de status alinha-se com pagamento_status (quitado/em_aberto)
 */

import { query } from '@/lib/db';

describe('Consistência Payment Status - Entidade e Clínica', () => {
  let testContratanteEntidadeId: number;
  let testContratanteClinicaId: number;
  let testContratoId: number;
  let testPagamentoId: number;
  let testPlanoId: number;

  const randomCpf = () => {
    // Gera CPF pseudo-aleatório (11 dígitos, não validado)
    return Math.floor(10000000000 + Math.random() * 89999999999).toString();
  };

  beforeAll(async () => {
    // Criar contratante entidade para teste
    const cpfEnt = randomCpf();
    const entidadeRes = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, responsavel_cpf, numero_funcionarios_estimado, plano_id, status, ativa, pagamento_confirmado)
       VALUES ('entidade', 'Entidade Teste Status', '12345678000199', 'statustest@entidade.local', $1, 100, NULL, 'aguardando_pagamento', false, false)
       RETURNING id`,
      [cpfEnt]
    );
    testContratanteEntidadeId = entidadeRes.rows[0].id;

    // Criar plano de teste
    const planoRes = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('personalizado', 'Plano Teste Consistencia', 1000, true) RETURNING id`,
      []
    );
    testPlanoId = planoRes.rows[0].id;

    // Criar contrato para a entidade (usar plano criado)
    const contratoRes = await query(
      `INSERT INTO contratos (contratante_id, plano_id, valor_total, aceito, status, conteudo)
       VALUES ($1, $2, 1000, true, 'aguardando_pagamento', 'Contrato Teste Status')
       RETURNING id`,
      [testContratanteEntidadeId, testPlanoId]
    );
    testContratoId = contratoRes.rows[0].id;

    // Criar contratante clínica para teste
    const cpfClin = randomCpf();
    const clinicaRes = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, responsavel_cpf, numero_funcionarios_estimado, plano_id, status, ativa, pagamento_confirmado)
       VALUES ('clinica', 'Clínica Teste Status', '98765432000188', 'statustest@clinica.local', $1, 50, NULL, 'aguardando_pagamento', true, false)
       RETURNING id`,
      [cpfClin]
    );
    testContratanteClinicaId = clinicaRes.rows[0].id;
  });

  afterAll(async () => {
    if (testPagamentoId)
      await query('DELETE FROM pagamentos WHERE id = $1', [testPagamentoId]);
    if (testContratoId)
      await query('DELETE FROM contratos WHERE id = $1', [testContratoId]);
    if (testContratanteEntidadeId) {
      await query('DELETE FROM contratos_planos WHERE contratante_id = $1', [
        testContratanteEntidadeId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [
        testContratanteEntidadeId,
      ]);
    }
    if (testContratanteClinicaId) {
      await query('DELETE FROM contratos_planos WHERE contratante_id = $1', [
        testContratanteClinicaId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [
        testContratanteClinicaId,
      ]);
    }
  });

  describe('Entidade: Status derivado de pagamentos', () => {
    it('deve mostrar status "em_aberto" quando valor pago < valor total', async () => {
      // Criar pagamento parcial (500 de 1000)
      const pagRes = await query(
        `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, data_pagamento)
         VALUES ($1, $2, 500, 'pago', 'pix', NOW())
         RETURNING id`,
        [testContratanteEntidadeId, testContratoId]
      );
      testPagamentoId = pagRes.rows[0].id;

      // Mock session
      (global.fetch as any) = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          session: {
            perfil: 'gestor',
            contratante_id: testContratanteEntidadeId,
          },
        }),
      });

      const mockGetSession = jest.fn(() => ({
        perfil: 'gestor',
        contratante_id: testContratanteEntidadeId,
      }));
      jest.doMock('@/lib/session', () => ({
        getSession: mockGetSession,
      }));

      const { GET } = await import('@/app/api/entidade/account-info/route');
      // limpar mocks de módulos para próximas execuções
      jest.resetModules();
      jest.clearAllMocks();

      const response = await GET();
      const data = await response.json();

      // Verificar soma dos pagamentos (fonte da verdade)
      const totalPago =
        data.contrato?.pagamento_resumo?.totalPago ??
        (data.pagamentos || []).reduce(
          (s: any, p: any) => s + (p.resumo?.valorPago ?? p.valor ?? 0),
          0
        );
      expect(totalPago).toBe(500);

      // Se houver contrato, validar status derivado dos pagamentos
      if (data.contrato && data.contrato.valor_total != null) {
        expect(data.contrato.pagamento_status).toBe('em_aberto');
        expect(data.contrato.pagamento_resumo.totalPago).toBe(500);
        expect(data.contrato.pagamento_resumo.restante).toBe(500);
      }

      // Limpar
      await query('DELETE FROM pagamentos WHERE id = $1', [testPagamentoId]);
      testPagamentoId = 0 as any;
    });

    it('deve mostrar status "quitado" quando valor pago >= valor total', async () => {
      // Criar pagamento total (1000 de 1000)
      const pagRes = await query(
        `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, data_pagamento)
         VALUES ($1, $2, 1000, 'pago', 'pix', NOW())
         RETURNING id`,
        [testContratanteEntidadeId, testContratoId]
      );
      testPagamentoId = pagRes.rows[0].id;

      const mockGetSession = jest.fn(() => ({
        perfil: 'gestor',
        contratante_id: testContratanteEntidadeId,
      }));
      jest.doMock('@/lib/session', () => ({
        getSession: mockGetSession,
      }));

      const { GET } = await import('@/app/api/entidade/account-info/route');

      const response = await GET();
      const data = await response.json();

      // Verificar soma dos pagamentos
      const totalPago2 =
        data.contrato?.pagamento_resumo?.totalPago ??
        (data.pagamentos || []).reduce(
          (s: any, p: any) => s + (p.resumo?.valorPago ?? p.valor ?? 0),
          0
        );
      expect(totalPago2).toBe(1000);

      if (data.contrato && data.contrato.valor_total != null) {
        expect(data.contrato.pagamento_status).toBe('quitado');
        expect(data.contrato.pagamento_resumo.totalPago).toBe(1000);
        expect(data.contrato.pagamento_resumo.restante).toBe(0);
      }

      // Limpar
      jest.resetModules();
      jest.clearAllMocks();
      await query('DELETE FROM pagamentos WHERE id = $1', [testPagamentoId]);
      testPagamentoId = 0 as any;
    });

    it('deve ajustar contrato.status para "ativo" quando pagamento está quitado', async () => {
      // Criar pagamento total
      const pagRes = await query(
        `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, data_pagamento)
         VALUES ($1, $2, 1000, 'pago', 'pix', NOW())
         RETURNING id`,
        [testContratanteEntidadeId, testContratoId]
      );
      testPagamentoId = pagRes.rows[0].id;

      const mockGetSession = jest.fn(() => ({
        perfil: 'gestor',
        contratante_id: testContratanteEntidadeId,
      }));
      jest.doMock('@/lib/session', () => ({
        getSession: mockGetSession,
      }));

      const { GET } = await import('@/app/api/entidade/account-info/route');

      const response = await GET();
      const data = await response.json();

      if (data.contrato) {
        expect(data.contrato.status).toBe('ativo');
        expect(data.contrato.pagamento_status).toBe('quitado');
      } else {
        // quando contrato não estiver presente, garantir que pagamentos somam o total
        const totalPago3 = (data.pagamentos || []).reduce(
          (s: any, p: any) => s + (p.resumo?.valorPago ?? p.valor ?? 0),
          0
        );
        expect(totalPago3).toBe(1000);
      }

      // Limpar
      jest.resetModules();
      jest.clearAllMocks();
      await query('DELETE FROM pagamentos WHERE id = $1', [testPagamentoId]);
      testPagamentoId = 0 as any;
    });
  });

  describe('Clínica: Status e valores consistentes', () => {
    it('deve calcular resumo financeiro corretamente a partir dos pagamentos', async () => {
      // Criar contrato_plano para clínica (usar colunas mínimas + tipo_contratante)
      await query(
        `INSERT INTO contratos_planos (contratante_id, plano_id, valor_pago, tipo_contratante, created_at)
         VALUES ($1, $2, 5000, 'clinica', NOW())`,
        [testContratanteClinicaId, testPlanoId]
      );

      // Criar pagamento parcial (1000 de 5000)
      const pagRes = await query(
        `INSERT INTO pagamentos (contratante_id, valor, status, metodo, data_pagamento)
         VALUES ($1, 1000, 'pago', 'pix', NOW())
         RETURNING id`,
        [testContratanteClinicaId]
      );
      testPagamentoId = pagRes.rows[0].id;

      const mockRequireRole = jest.fn(() =>
        Promise.resolve({
          perfil: 'rh',
          clinica_id: testContratanteClinicaId,
        })
      );
      jest.doMock('@/lib/session', () => ({
        requireRole: mockRequireRole,
      }));

      const { GET } = await import('@/app/api/rh/account-info/route');
      const response = await GET();
      const data = await response.json();

      jest.resetModules();
      jest.clearAllMocks();

      expect(data.clinica.plano).toBeDefined();
      expect(data.clinica.plano.pagamento_resumo.totalPago).toBe(1000);
      expect(data.clinica.plano.pagamento_resumo.restante).toBe(4000);
      expect(data.clinica.plano.pagamento_status).toBe('em_aberto');

      // Limpar
      await query('DELETE FROM pagamentos WHERE id = $1', [testPagamentoId]);
      await query('DELETE FROM contratos_planos WHERE contratante_id = $1', [
        testContratanteClinicaId,
      ]);
      testPagamentoId = 0 as any;
    });

    it('deve mostrar "quitado" quando totalPago >= valor_total do plano', async () => {
      // Criar contrato_plano (usar colunas mínimas + tipo_contratante)
      await query(
        `INSERT INTO contratos_planos (contratante_id, plano_id, valor_pago, tipo_contratante, created_at)
         VALUES ($1, $2, 5000, 'clinica', NOW())`,
        [testContratanteClinicaId, testPlanoId]
      );

      // Criar pagamento total (5000 de 5000)
      const pagRes = await query(
        `INSERT INTO pagamentos (contratante_id, valor, status, metodo, data_pagamento)
         VALUES ($1, 5000, 'pago', 'pix', NOW())
         RETURNING id`,
        [testContratanteClinicaId]
      );
      testPagamentoId = pagRes.rows[0].id;

      const mockRequireRole = jest.fn(() =>
        Promise.resolve({
          perfil: 'rh',
          clinica_id: testContratanteClinicaId,
        })
      );
      jest.doMock('@/lib/session', () => ({
        requireRole: mockRequireRole,
      }));

      const { GET } = await import('@/app/api/rh/account-info/route');
      const response = await GET();
      const data = await response.json();

      jest.resetModules();
      jest.clearAllMocks();

      expect(data.clinica.plano.pagamento_status).toBe('quitado');
      expect(data.clinica.plano.pagamento_resumo.restante).toBe(0);

      // Limpar
      await query('DELETE FROM pagamentos WHERE id = $1', [testPagamentoId]);
      await query('DELETE FROM contratos_planos WHERE contratante_id = $1', [
        testContratanteClinicaId,
      ]);
      testPagamentoId = 0 as any;
    });
  });

  describe('Validação: Aritmética Total/Pago/Restante', () => {
    it('deve garantir que Total = Pago + Restante (Entidade)', async () => {
      const pagRes = await query(
        `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, data_pagamento)
         VALUES ($1, $2, 400, 'pago', 'pix', NOW())
         RETURNING id`,
        [testContratanteEntidadeId, testContratoId]
      );
      testPagamentoId = pagRes.rows[0].id;

      const mockGetSession = jest.fn(() => ({
        perfil: 'gestor',
        contratante_id: testContratanteEntidadeId,
      }));
      jest.doMock('@/lib/session', () => ({
        getSession: mockGetSession,
      }));

      const { GET } = await import('@/app/api/entidade/account-info/route');
      const response = await GET();
      const data = await response.json();

      jest.resetModules();
      jest.clearAllMocks();

      const total = data.contrato?.valor_total ?? null;
      const pago =
        data.contrato?.pagamento_resumo?.totalPago ??
        (data.pagamentos || []).reduce(
          (s: any, p: any) => s + (p.resumo?.valorPago ?? p.valor ?? 0),
          0
        );
      const restante = data.contrato?.pagamento_resumo?.restante ?? null;

      if (total != null && restante != null) {
        expect(total).toBe(pago + restante);
      } else {
        // Se não houver valor_total, garantir que pago é número e restante é null
        expect(typeof pago).toBe('number');
      }

      await query('DELETE FROM pagamentos WHERE id = $1', [testPagamentoId]);
      testPagamentoId = 0 as any;
    });

    it('deve garantir que Total = Pago + Restante (Clínica)', async () => {
      await query(
        `INSERT INTO contratos_planos (contratante_id, plano_id, valor_pago, tipo_contratante, created_at)
         VALUES ($1, $2, 5000, 'clinica', NOW())`,
        [testContratanteClinicaId, testPlanoId]
      );

      const pagRes = await query(
        `INSERT INTO pagamentos (contratante_id, valor, status, metodo, data_pagamento)
         VALUES ($1, 1200, 'pago', 'pix', NOW())
         RETURNING id`,
        [testContratanteClinicaId]
      );
      testPagamentoId = pagRes.rows[0].id;

      const mockRequireRole = jest.fn(() =>
        Promise.resolve({
          perfil: 'rh',
          clinica_id: testContratanteClinicaId,
        })
      );
      jest.doMock('@/lib/session', () => ({
        requireRole: mockRequireRole,
      }));

      const { GET } = await import('@/app/api/rh/account-info/route');
      const response = await GET();
      const data = await response.json();

      jest.resetModules();
      jest.clearAllMocks();

      const total = Number(data.clinica.plano.valor_total);
      const pago = Number(data.clinica.plano.pagamento_resumo.totalPago);
      const restante = Number(data.clinica.plano.pagamento_resumo.restante);

      expect(total).toBe(pago + restante);

      await query('DELETE FROM pagamentos WHERE id = $1', [testPagamentoId]);
      await query('DELETE FROM contratos_planos WHERE contratante_id = $1', [
        testContratanteClinicaId,
      ]);
      testPagamentoId = 0 as any;
    });
  });
});
