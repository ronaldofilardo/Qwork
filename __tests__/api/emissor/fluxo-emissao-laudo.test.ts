/**
 * Testes Integrados para Fluxo de Emissão de Laudo
 *
 * Funcionalidades testadas:
 * 1. Fluxo completo: GET preview → POST emitir → GET PDF → PATCH enviar
 * 2. Validações de sequência correta
 * 3. Prevenção de ações fora de ordem
 * 4. Validações de segurança
 */

import {
  GET as getLaudo,
  POST as emitirLaudo,
  PATCH as enviarLaudo,
} from '@/app/api/emissor/laudos/[loteId]/route';
import { GET as gerarPDF } from '@/app/api/emissor/laudos/[loteId]/pdf/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

// Mock laudo-auto (usado pelo POST)
jest.mock('@/lib/laudo-auto', () => ({
  gerarLaudoCompletoEmitirPDF: jest.fn().mockResolvedValue(42),
}));

// Mock laudo-calculos (usado pelo GET)
jest.mock('@/lib/laudo-calculos', () => ({
  gerarDadosGeraisEmpresa: jest.fn().mockResolvedValue({
    empresaAvaliada: { nome: 'Empresa Teste', cnpj: '12345678000195' },
  }),
  calcularScoresPorGrupo: jest.fn().mockResolvedValue([
    { grupo: 1, valor: 75 },
    { grupo: 2, valor: 80 },
  ]),
  gerarInterpretacaoRecomendacoes: jest.fn().mockReturnValue({}),
  gerarObservacoesConclusao: jest.fn().mockReturnValue({}),
}));

// Mock template HTML (usado pelo PDF route)
jest.mock('@/lib/templates/laudo-html', () => ({
  gerarHTMLLaudoCompleto: jest.fn().mockReturnValue('<html>laudo</html>'),
}));

// Mock puppeteer via pdf-generator
jest.mock('@/lib/infrastructure/pdf/generators/pdf-generator', () => ({
  getPuppeteerInstance: jest.fn().mockResolvedValue({
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('fake pdf content')),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  }),
}));

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Fluxo de Emissão de Laudo', () => {
  const mockEmissor = {
    cpf: '99999999999',
    nome: 'Emissor Teste',
    perfil: 'emissor' as const,
  };

  const mockLoteId = '5';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(mockEmissor);
  });

  describe('Sequência Correta de Emissão', () => {
    it('POST deve emitir laudo quando lote concluído e pago', async () => {
      // loteCheck
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            status: 'concluido',
            status_pagamento: 'pago',
            pago_em: '2025-01-01',
            empresa_nome: 'Empresa Teste',
            total_liberadas: '5',
            concluidas: '5',
            inativadas: '0',
          },
        ],
        rowCount: 1,
      } as any);
      // laudoExistente - nenhum
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await emitirLaudo({} as Request, {
        params: { loteId: mockLoteId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Laudo gerado com sucesso');
    });

    it('POST não deve permitir emissão se laudo já enviado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            status: 'concluido',
            status_pagamento: 'pago',
            pago_em: '2025-01-01',
            empresa_nome: 'Empresa Teste',
            total_liberadas: '5',
            concluidas: '5',
            inativadas: '0',
          },
        ],
        rowCount: 1,
      } as any);
      // laudo já enviado
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'enviado', emitido_em: '2025-01-01' }],
        rowCount: 1,
      } as any);

      const response = await emitirLaudo({} as Request, {
        params: { loteId: mockLoteId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Geração de PDF', () => {
    it('deve retornar 400 se laudo não está emitido para PDF', async () => {
      // validarAcessoLote - lote ok
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 5, empresa_id: 1, status: 'ativo', clinica_id: 1 }],
        rowCount: 1,
      } as any);
      // audit log
      mockQuery.mockResolvedValueOnce({} as any);
      // laudoCheck - nenhum laudo emitido
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await gerarPDF({} as Request, {
        params: { loteId: mockLoteId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Fluxo Completo Integrado', () => {
    it('deve executar fluxo: emitir → enviar', async () => {
      // 1. POST - Emitir laudo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            status: 'concluido',
            status_pagamento: 'pago',
            pago_em: '2025-01-01',
            empresa_nome: 'Empresa Teste',
            total_liberadas: '5',
            concluidas: '5',
            inativadas: '0',
          },
        ],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      let response = await emitirLaudo({} as Request, {
        params: { loteId: mockLoteId },
      });
      let data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // 2. PATCH - Enviar laudo
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 42, status: 'enviado' }],
        rowCount: 1,
      } as any);

      response = await enviarLaudo(
        { json: jest.fn().mockResolvedValue({ status: 'enviado' }) } as any,
        { params: { loteId: mockLoteId } }
      );
      data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Laudo enviado para clínica');
    });

    it('PATCH não deve permitir envio se laudo não é emitido', async () => {
      // UPDATE retorna 0 rows (nenhum laudo com status='emitido')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await enviarLaudo(
        { json: jest.fn().mockResolvedValue({ status: 'enviado' }) } as any,
        { params: { loteId: mockLoteId } }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Laudo não encontrado');
    });
  });

  describe('Validações de Segurança', () => {
    it('deve rejeitar acesso para usuários não autorizados', async () => {
      mockRequireRole.mockResolvedValue(null as any);

      const responses = await Promise.all([
        getLaudo({} as Request, { params: { loteId: mockLoteId } }),
        emitirLaudo({} as Request, { params: { loteId: mockLoteId } }),
        gerarPDF({} as Request, { params: { loteId: mockLoteId } }),
        enviarLaudo(
          { json: jest.fn().mockResolvedValue({ status: 'enviado' }) } as any,
          { params: { loteId: mockLoteId } }
        ),
      ]);

      for (const response of responses) {
        expect(response.status).toBe(403);
      }
    });

    it('deve validar loteId numérico', async () => {
      const invalidLoteId = 'abc';

      const responses = await Promise.all([
        getLaudo({} as Request, { params: { loteId: invalidLoteId } }),
        emitirLaudo({} as Request, { params: { loteId: invalidLoteId } }),
        gerarPDF({} as Request, { params: { loteId: invalidLoteId } }),
        enviarLaudo(
          { json: jest.fn().mockResolvedValue({ status: 'enviado' }) } as any,
          { params: { loteId: invalidLoteId } }
        ),
      ]);

      for (const response of responses) {
        const data = await response.json();
        expect(response.status).toBe(400);
        expect(data.error).toBe('ID do lote inválido');
      }
    });
  });
});
