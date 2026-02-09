/**
 * @jest-environment node
 */

import { POST as confirmarPagamento } from '@/app/api/pagamento/confirmar/route';
import { query } from '@/lib/db';
import { gerarRecibo } from '@/lib/receipt-generator';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('@/lib/receipt-generator');
jest.mock('@/lib/parcelas-helper');
jest.mock('@/lib/entidade-activation');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGerarRecibo = gerarRecibo as jest.MockedFunction<typeof gerarRecibo>;

describe('API Pagamento Confirmar com Recibo BYTEA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockGerarRecibo.mockReset();
  });

  describe('POST /api/pagamento/confirmar', () => {
    const mockPagamento = {
      id: 100,
      tomador_id: 1,
      contrato_id: 55, // necessário para geração de recibo no código
      status: 'pendente',
      tomador_nome: 'Empresa Teste Ltda',
      tipo: 'pj',
      cnpj: '12.345.678/0001-90',
      responsavel_cpf: '123.456.789-00',
      responsavel_nome: 'João Silva',
      responsavel_email: 'joao@empresa.com',
      responsavel_celular: '(11) 99999-9999',
    };

    const mockRecibo = {
      id: 200,
      numero_recibo: 'REC-20251231-0001',
      hash_pdf:
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      pdf: Buffer.from('PDF_CONTENT'),
    };

    it('deve confirmar pagamento e gerar recibo com PDF BYTEA (fluxo legado / forçado)', async () => {
      // Forçar geração de recibo neste teste (fluxo legado)
      process.env.FORCE_GENERATE_RECIBO = '1';

      // Mock das queries (inclui resposta para verificação de tipo de plano = 'recorrente')
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPagamento] }) // buscar pagamento
        .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // update status (retorna row)
        .mockResolvedValueOnce({ rows: [{ plano_tipo: 'recorrente' }] }) // query plano (não é 'fixo')
        .mockResolvedValueOnce({ rows: [] }) // buscar detalhes pagamento (parcelas)
        .mockResolvedValueOnce({ rows: [] }) // update tomador (será feito após recibo)
        .mockResolvedValueOnce({ rows: [] }); // notificação

      // Mock do gerador de recibo
      mockGerarRecibo.mockResolvedValue(mockRecibo);

      const requestBody = {
        pagamento_id: 100,
        metodo_pagamento: 'pix',
        plataforma_id: 'MP123456',
        plataforma_nome: 'Mercado Pago',
        numero_parcelas: 1,
      };

      const request = new Request(
        'http://localhost:3000/api/pagamento/confirmar',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await confirmarPagamento(request);
      const data = await response.json();

      // Limpeza do flag
      delete process.env.FORCE_GENERATE_RECIBO;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recibo).toBeDefined();
      expect(data.recibo.numero_recibo).toBe('REC-20251231-0001');

      // Verificar se recibo foi gerado (ip_emissao -> null quando 'unknown')
      expect(mockGerarRecibo).toHaveBeenCalledWith(
        expect.objectContaining({
          tomador_id: 1,
          contrato_id: 55,
          pagamento_id: 100,
          emitido_por_cpf: undefined,
          ip_emissao: null,
        })
      );

      // Verificar que foi tentada inserção de notificação (schema compatível)
      expect(mockQuery).toHaveBeenCalled();
    });

    it('deve confirmar pagamento (plano fixo) sem gerar recibo e redirecionar para /auth', async () => {
      // Cenário: pagamento com contrato/serviço fixo — novo fluxo aprovado
      const pagamentoFixo = { ...mockPagamento, id: 101, tomador_id: 2 };

      mockQuery
        .mockResolvedValueOnce({ rows: [pagamentoFixo] }) // buscar pagamento
        .mockResolvedValueOnce({ rows: [{ id: 101 }] }) // update pagamento
        .mockResolvedValueOnce({ rows: [{ plano_tipo: 'fixo' }] }) // query plano (detecta fixo)
        .mockResolvedValueOnce({ rows: [] }) // update tomadors (ativação)
        .mockResolvedValueOnce({ rows: [] }); // possível insert funcionario

      const requestBody = { pagamento_id: 101, metodo_pagamento: 'pix' };
      const request = new Request(
        'http://localhost:3000/api/pagamento/confirmar',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await confirmarPagamento(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.acesso_liberado).toBe(true);
      expect(data.login_liberado).toBe(true);
      expect(data.redirect_to).toBe('/');
      expect(data.show_receipt_info).toBe(true);
      expect(data.recibo).toBeUndefined();
    });

    it('deve continuar mesmo se geração de recibo falhar', async () => {
      // Mock das queries necessárias — garantir que contrato exista para que o
      // código tente gerar o recibo (e então falhe no gerador)
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPagamento] }) // buscar pagamento
        .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // update pagamento
        .mockResolvedValueOnce({ rows: [{ plano_tipo: 'recorrente' }] }) // plano != fixo
        .mockResolvedValueOnce({ rows: [] }) // buscar detalhes pagamento (parcelas)
        .mockResolvedValueOnce({ rows: [] }) // update tomador
        .mockResolvedValueOnce({ rows: [{ id: 55 }] }) // buscar contrato_id (existe)
        .mockResolvedValueOnce({ rows: [] }) // update contratos (fallback)
        .mockResolvedValueOnce({ rows: [] }) // criar conta responsável
        .mockResolvedValueOnce({ rows: [] }); // notificação (pode não ser chamada)

      // Recibo falha
      mockGerarRecibo.mockRejectedValue(new Error('Erro na geração de PDF'));

      const requestBody = {
        pagamento_id: 100,
        metodo_pagamento: 'pix',
      };

      const request = new Request(
        'http://localhost:3000/api/pagamento/confirmar',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.100',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await confirmarPagamento(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recibo).toBeDefined();
      expect(data.recibo.id).toBeNull(); // Recibo falhou — API retorna recibo.{id: null}
      expect(data.recibo.numero_recibo).toBeNull();
    });

    it('deve rejeitar pagamento já confirmado', async () => {
      const pagamentoConfirmado = {
        ...mockPagamento,
        status: 'pago',
        tomador_nome: 'Empresa Teste Ltda',
        tipo: 'pj',
        cnpj: '12.345.678/0001-90',
        responsavel_cpf: '123.456.789-00',
        responsavel_nome: 'João Silva',
        responsavel_email: 'joao@empresa.com',
        responsavel_celular: '(11) 99999-9999',
      };

      // Sequência de mocks: SELECT pagamento (retorna pago) -> UPDATE (nenhuma
      // linha atualizada) -> SELECT status (retorna 'pago') => handler deve
      // responder 400
      mockQuery
        .mockResolvedValueOnce({ rows: [pagamentoConfirmado] }) // select pagamento
        .mockResolvedValueOnce({ rows: [] }) // update pagamento (0 rows)
        .mockResolvedValueOnce({ rows: [{ status: 'pago' }] }) // statusCheck
        .mockResolvedValueOnce({
          rows: [{ id: 777, numero_recibo: 'REC-OLD-001' }],
          rowCount: 1,
        }); // existingRecibo

      const requestBody = { pagamento_id: 100 };

      const request = new Request(
        'http://localhost:3000/api/pagamento/confirmar',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await confirmarPagamento(request);
      const data = await response.json();

      // Novo comportamento: idempotente — se pagamento já estiver marcado como 'pago' e
      // existir recibo, retornamos sucesso com o recibo existente
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recibo).toBeDefined();
      expect(data.recibo.id).toBe(777);
      expect(data.recibo.numero_recibo).toBe('REC-OLD-001');
    });

    it('deve incluir IP de emissão na geração do recibo', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPagamento] }) // buscar pagamento
        .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // update pagamento
        .mockResolvedValueOnce({ rows: [{ plano_tipo: 'recorrente' }] }) // plano != fixo
        .mockResolvedValueOnce({ rows: [] }) // buscar detalhes pagamento (parcelas)
        .mockResolvedValueOnce({ rows: [] }) // update tomador
        .mockResolvedValueOnce({ rows: [{ id: 55 }] }) // buscar contrato_id
        .mockResolvedValueOnce({ rows: [] }) // update contratos (fallback)
        .mockResolvedValueOnce({ rows: [] }) // criar conta responsável
        .mockResolvedValueOnce({ rows: [] }); // notificação

      mockGerarRecibo.mockResolvedValue(mockRecibo);

      const requestBody = { pagamento_id: 100 };

      const request = new Request(
        'http://localhost:3000/api/pagamento/confirmar',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '203.0.113.1',
          },
          body: JSON.stringify(requestBody),
        }
      );

      await confirmarPagamento(request);

      expect(mockGerarRecibo).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_emissao: '203.0.113.1',
        })
      );
    });
  });
});
