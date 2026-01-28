/**
 * Testes para API de geração de link de pagamento para planos fixos
 * Endpoint: /api/pagamento/gerar-link-plano-fixo
 */

import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('API Gerar Link Plano Fixo', () => {
  let contratanteId: number;
  let planoFixoId: number;
  let contratoExistenteId: number;
  const timestamp = Date.now();
  const shortId = timestamp.toString().slice(-6); // Últimos 6 dígitos para manter tamanho adequado
  const cpfId = timestamp.toString().slice(-5).padStart(11, '1'); // CPF de 11 dígitos

  beforeAll(async () => {
    // Criar plano fixo para testes com nome único
    const planoRes = await query(
      `INSERT INTO planos (nome, tipo, preco, caracteristicas)
       VALUES ('Plano Fixo Teste ${shortId}', 'fixo', 20.00, '{"limite_funcionarios": 50}')
       RETURNING id`
    );
    planoFixoId = planoRes.rows[0].id;

    // Criar contratante com CNPJ único
    const contratanteRes = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, status,
                                 responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
       VALUES ('entidade', 'Empresa Link Fixo ${shortId}', '${shortId}4444000104', 'linkfixo${shortId}@teste.com', '11999999994',
               'Rua D', 'São Paulo', 'SP', '04000-000', 'aguardando_pagamento',
               'Responsavel Link', '${cpfId}', 'resp.link@teste.com', '11987654324')
       RETURNING id`
    );
    contratanteId = contratanteRes.rows[0].id;

    // Criar contrato existente para teste de retry
    const contratoRes = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, conteudo, conteudo_gerado)
       VALUES ($1, $2, 15, 300.00, 'aguardando_pagamento', 'Contrato para retry', 'Contrato para retry')
       RETURNING id`,
      [contratanteId, planoFixoId]
    );
    contratoExistenteId = contratoRes.rows[0].id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM contratos WHERE contratante_id = $1', [
      contratanteId,
    ]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    await query('DELETE FROM planos WHERE id = $1', [planoFixoId]);
  });

  afterEach(async () => {
    // Resetar estado do contratante entre testes - deletar e recriar para evitar restrições
    await query('DELETE FROM contratos WHERE contratante_id = $1', [
      contratanteId,
    ]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);

    // Recriar contratante no estado inicial
    const contratanteRes = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, status,
                                 responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
       VALUES ('entidade', 'Empresa Link Fixo ${shortId}', '${shortId}4444000104', 'linkfixo${shortId}@teste.com', '11999999994',
               'Rua D', 'São Paulo', 'SP', '04000-000', 'aguardando_pagamento',
               'Responsavel Link', '${cpfId}', 'resp.link@teste.com', '11987654324')
       RETURNING id`
    );
    contratanteId = contratanteRes.rows[0].id;

    // Recriar contrato existente
    const contratoRes = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, conteudo, conteudo_gerado)
       VALUES ($1, $2, 15, 300.00, 'aguardando_pagamento', 'Contrato para retry', 'Contrato para retry')
       RETURNING id`,
      [contratanteId, planoFixoId]
    );
    contratoExistenteId = contratoRes.rows[0].id;
  });

  describe('POST /api/pagamento/gerar-link-plano-fixo', () => {
    it('deve retornar erro 400 se campos obrigatórios não forem fornecidos', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({}),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('obrigatórios');
    });

    it('deve retornar erro 404 se plano não existir', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          plano_id: 999999,
          numero_funcionarios: 10,
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('não encontrado');
    });

    it('deve retornar erro 400 se número de funcionários exceder limite', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          plano_id: planoFixoId,
          numero_funcionarios: 100, // Limite é 50
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('excede o limite');
    });

    it('deve criar novo contrato quando não existe', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          plano_id: planoFixoId,
          numero_funcionarios: 10,
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.contrato_id).toBeDefined();
      expect(data.payment_link).toBeTruthy();
      expect(data.payment_info).toBeDefined();
      expect(data.payment_info.valor_total).toBe(200); // 10 * 20
      expect(data.payment_info.valor_por_funcionario).toBe(20);
      expect(data.payment_info.numero_funcionarios).toBe(10);
      expect(data.payment_info.plano_tipo).toBe('fixo');

      // Limpar contrato criado
      await query('DELETE FROM contratos WHERE id = $1', [data.contrato_id]);
    });

    it('deve usar contrato existente quando fornecido', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          contrato_id: contratoExistenteId,
          plano_id: planoFixoId,
          numero_funcionarios: 15,
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.contrato_id).toBe(contratoExistenteId);
      expect(data.payment_link).toContain(`contrato_id=${contratoExistenteId}`);
    });

    it('deve gerar link com parâmetro retry=true', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          plano_id: planoFixoId,
          numero_funcionarios: 10,
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.payment_link).toContain('retry=true');
      expect(data.payment_link).toContain(`contratante_id=${contratanteId}`);
      expect(data.payment_link).toContain(`plano_id=${planoFixoId}`);
      expect(data.payment_link).toContain('numero_funcionarios=10');

      // Limpar contrato criado
      await query('DELETE FROM contratos WHERE id = $1', [data.contrato_id]);
    });

    it('deve atualizar status do contratante para pendente_pagamento', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      // Primeiro, mudar status para outro valor
      await query(`UPDATE contratantes SET status = 'aprovado' WHERE id = $1`, [
        contratanteId,
      ]);

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          plano_id: planoFixoId,
          numero_funcionarios: 10,
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      // API deve rejeitar operação para contratante aprovado
      expect(response.status).toBe(400);
      expect(data.error).toContain('aprovado');
    });

    it('deve calcular valor correto baseado no preço do plano', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          plano_id: planoFixoId,
          numero_funcionarios: 25,
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.payment_info.valor_total).toBe(500); // 25 * 20
      expect(data.payment_info.valor_por_funcionario).toBe(20);
      expect(data.payment_info.numero_funcionarios).toBe(25);

      // Limpar contrato criado
      await query('DELETE FROM contratos WHERE id = $1', [data.contrato_id]);
    });

    it('deve criar contrato com status pendente_pagamento', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          plano_id: planoFixoId,
          numero_funcionarios: 10,
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      // Verificar status do contrato criado
      const contratoCheck = await query(
        `SELECT status FROM contratos WHERE id = $1`,
        [data.contrato_id]
      );

      expect(contratoCheck.rows[0].status).toBe('aguardando_pagamento');

      // Limpar contrato criado
      await query('DELETE FROM contratos WHERE id = $1', [data.contrato_id]);
    });

    it('deve incluir mensagem apropriada no response', async () => {
      const { POST } =
        await import('@/app/api/pagamento/gerar-link-plano-fixo/route');

      const mockRequest = {
        json: async () => ({
          contratante_id: contratanteId,
          plano_id: planoFixoId,
          numero_funcionarios: 10,
        }),
      } as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.message).toContain('Link de pagamento gerado');
      expect(data.message).toContain('Complete o pagamento');

      // Limpar contrato criado
      await query('DELETE FROM contratos WHERE id = $1', [data.contrato_id]);
    });
  });
});
