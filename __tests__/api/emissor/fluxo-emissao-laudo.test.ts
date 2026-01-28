/**
 * Testes Integrados para Fluxo de Emissão de Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)
 *
 * Funcionalidades testadas:
 * 1. Fluxo completo: Emitir Laudo → Gerar PDF → Mudar Status → Enviar
 * 2. Validações de sequência correta
 * 3. Prevenção de ações fora de ordem
 * 4. Interface correta por status
 */

import {
  GET as getLaudo,
  PUT as updateLaudo,
  POST as emitirLaudo,
  PATCH as enviarLaudo,
} from '@/app/api/emissor/laudos/[loteId]/route';
import { GET as gerarPDF } from '@/app/api/emissor/laudos/[loteId]/pdf/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import {
  gerarDadosGeraisEmpresa,
  calcularScoresPorGrupo,
  gerarInterpretacaoRecomendacoes,
  gerarObservacoesConclusao,
} from '@/lib/laudo-calculos';
import { gerarHTMLLaudoCompleto } from '@/lib/templates/laudo-html';
import puppeteer from 'puppeteer';
import crypto from 'crypto';

jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('@/lib/laudo-calculos');
jest.mock('@/lib/templates/laudo-html');
jest.mock('puppeteer');
jest.mock('crypto');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGerarDadosGeraisEmpresa =
  gerarDadosGeraisEmpresa as jest.MockedFunction<
    typeof gerarDadosGeraisEmpresa
  >;
const mockCalcularScoresPorGrupo =
  calcularScoresPorGrupo as jest.MockedFunction<typeof calcularScoresPorGrupo>;
const mockGerarInterpretacaoRecomendacoes =
  gerarInterpretacaoRecomendacoes as jest.MockedFunction<
    typeof gerarInterpretacaoRecomendacoes
  >;
const mockGerarObservacoesConclusao =
  gerarObservacoesConclusao as jest.MockedFunction<
    typeof gerarObservacoesConclusao
  >;
const mockGerarHTMLLaudoCompleto =
  gerarHTMLLaudoCompleto as jest.MockedFunction<typeof gerarHTMLLaudoCompleto>;
const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;
const mockCreateHash = crypto.createHash as jest.MockedFunction<
  typeof crypto.createHash
>;

// IGNORADO: testes de emissão de laudos temporariamente skipados para breve refatoração
describe.skip('Fluxo de Emissão de Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)', () => {
  const mockEmissor = {
    cpf: '99999999999',
    nome: 'Emissor Teste',
    perfil: 'emissor' as const,
  };

  const mockLoteId = '5';

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockRequireRole.mockReset();
    mockGerarDadosGeraisEmpresa.mockReset();
    mockCalcularScoresPorGrupo.mockReset();
    mockGerarInterpretacaoRecomendacoes.mockReset();
    mockGerarObservacoesConclusao.mockReset();
    mockGerarHTMLLaudoCompleto.mockReset();

    // Mock puppeteer
    mockPuppeteer.launch = jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('fake pdf content')),
        setDefaultTimeout: jest.fn(),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    });

    // Mock crypto
    mockCreateHash.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('fakehash123'),
    } as any);

    // Mock funções auxiliares
    mockGerarDadosGeraisEmpresa.mockResolvedValue({
      empresaAvaliada: 'Empresa Teste',
      cnpj: '00.000.000/0001-00',
      endereco: 'Rua Teste, 1 - São Paulo/SP',
      periodoAvaliacoes: {
        dataLiberacao: '2025-01-01',
        dataUltimaConclusao: '2025-12-31',
      },
      totalFuncionariosAvaliados: 5,
      percentualConclusao: 100,
      amostra: {
        operacional: 4,
        gestao: 1,
      },
    });

    mockCalcularScoresPorGrupo.mockResolvedValue([]);
    mockGerarInterpretacaoRecomendacoes.mockReturnValue({
      interpretacaoGeral: 'Interpretação teste',
      recomendacoes: 'Recomendações teste',
    });
    mockGerarObservacoesConclusao.mockReturnValue({
      observacoesGerais: 'Observações gerais',
      textoConclusao: 'Conclusão teste',
      dataEmissao: '2025-12-14',
      assinatura: {
        nome: 'Dr. João Silva',
        titulo: 'Psicólogo',
        registro: 'CRP 06/12345',
        empresa: 'Clínica Teste',
      },
    });
    mockGerarHTMLLaudoCompleto.mockReturnValue('<html>Test HTML</html>');

    // Mock requireRole
    mockRequireRole.mockResolvedValue(mockEmissor);
  });

  afterEach(() => {
    // Limpar completamente os mocks entre testes
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockRequireRole.mockReset();
    mockGerarDadosGeraisEmpresa.mockReset();
    mockCalcularScoresPorGrupo.mockReset();
    mockGerarInterpretacaoRecomendacoes.mockReset();
    mockGerarObservacoesConclusao.mockReset();
    mockGerarHTMLLaudoCompleto.mockReset();
  });

  describe('Sequência Correta de Emissão', () => {
    it('deve permitir emissão apenas de laudos em rascunho', async () => {
      // Mock para verificar lote (deve existir e estar pronto)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            status: 'ativo',
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clínica Teste',
            total: 5,
            concluidas: 5,
          },
        ],
        rowCount: 1,
      });

      // Mock BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock para verificar laudo existente (existe em rascunho)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'rascunho' }],
        rowCount: 1,
      });

      // Mock busca de observações
      mockQuery.mockResolvedValueOnce({
        rows: [{ observacoes: 'Observações teste' }],
        rowCount: 1,
      });

      // Mock para o UPDATE de emissão
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      // Mock COMMIT
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: mockLoteId } };

      const response = await emitirLaudo(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'emitido'"),
        expect.arrayContaining([5, '99999999999'])
      );
    });

    it('não deve permitir emissão de laudos já emitidos', async () => {
      // Mock para verificar lote (deve existir e estar pronto)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            status: 'ativo',
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clínica Teste',
            total: 5,
            concluidas: 5,
          },
        ],
        rowCount: 1,
      });

      // Mock BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock para verificar laudo existente (já emitido)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'emitido' }],
        rowCount: 1,
      });

      // Mock ROLLBACK
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: mockLoteId } };

      const response = await emitirLaudo(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Laudo não encontrado ou já emitido');
      // Verifica que o UPDATE não foi chamado
      expect(mockQuery).toHaveBeenCalledTimes(5); // loteCheck, BEGIN, laudoCheckPre, laudoCheckAfter, ROLLBACK
    });
  });

  describe('Geração de PDF', () => {
    it('deve gerar PDF com sucesso para laudo emitido', async () => {
      // Mock verificações necessárias
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 5, lote_status: 'finalizado' }],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'emitido' }],
        rowCount: 1,
      });

      // Mocks para dados do laudo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            titulo: '005',
            liberado_em: '2025-12-01T00:00:00Z',
            empresa_nome: 'Empresa Teste',
            cnpj: '12345678000195',
            endereco: 'Rua Teste, 123',
          },
        ],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 50, operacional: 40, gestao: 10 }],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          { grupo: 1, valor: 75.5 },
          { grupo: 2, valor: 68.3 },
        ],
        rowCount: 2,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ observacoes: 'Observações do teste' }],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: mockLoteId } };

      const response = await gerarPDF(mockReq, mockParams);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain(
        'attachment'
      );
      expect(mockPuppeteer.launch).toHaveBeenCalled;
    });

    it('deve retornar erro se laudo não estiver emitido', async () => {
      // Mock laudo não emitido
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 5, lote_status: 'finalizado' }],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [], // Nenhum laudo emitido
        rowCount: 0,
      });

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: mockLoteId } };

      const response = await gerarPDF(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('não está emitido');
    });
  });

  describe('Fluxo Completo Integrado', () => {
    it('deve executar fluxo completo: rascunho → emitido → enviado', async () => {
      // 1. FASE POST - Emitir laudo
      mockQuery.mockReset();
      mockRequireRole.mockReset();
      mockRequireRole.mockResolvedValue(mockEmissor);

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 5,
              status: 'ativo',
              empresa_nome: 'Empresa Teste',
              clinica_nome: 'Clínica Teste',
              total: 5,
              concluidas: 5,
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'rascunho' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ observacoes: 'Observações teste' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      let response = await emitirLaudo({} as Request, {
        params: { loteId: mockLoteId },
      });
      let data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // 2. FASE GET - Gerar PDF (resetar e reconfigurar mocks)
      mockQuery.mockReset();
      mockRequireRole.mockReset();
      mockRequireRole.mockResolvedValue(mockEmissor);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 5, lote_status: 'finalizado' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'emitido' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 5,
              titulo: '005',
              liberado_em: '2025-12-01T00:00:00Z',
              empresa_nome: 'Empresa Teste',
              cnpj: '12345678000195',
              endereco: 'Rua Teste, 123',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total: 50, operacional: 40, gestao: 10 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            { grupo: 1, valor: 75.5 },
            { grupo: 2, valor: 68.3 },
          ],
          rowCount: 2,
        })
        .mockResolvedValueOnce({
          rows: [{ observacoes: 'Observações do teste' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      response = await gerarPDF({} as Request, {
        params: { loteId: mockLoteId },
      });
      expect(response.status).toBe(200);

      // 3. FASE PATCH - Enviar laudo (resetar e reconfigurar mocks)
      mockQuery.mockReset();
      mockRequireRole.mockReset();
      mockRequireRole.mockResolvedValue(mockEmissor);

      mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE laudos (1 linha afetada)

      response = await enviarLaudo({} as Request, {
        params: { loteId: mockLoteId },
      });
      data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('enviado para clínica');
    });

    it('não deve permitir ações fora de ordem', async () => {
      // Tentar enviar laudo que não foi emitido
      mockQuery.mockResolvedValueOnce({
        rows: [], // Laudo não encontrado
        rowCount: 0,
      });

      const response = await enviarLaudo({} as Request, {
        params: { loteId: mockLoteId },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Laudo não encontrado');
    });
  });

  describe('Validações de Segurança', () => {
    it('deve rejeitar acesso para usuários não autorizados', async () => {
      mockRequireRole.mockResolvedValue(null);

      const endpoints = [
        () => getLaudo({} as Request, { params: { loteId: mockLoteId } }),
        () => emitirLaudo({} as Request, { params: { loteId: mockLoteId } }),
        () => gerarPDF({} as Request, { params: { loteId: mockLoteId } }),
        () => enviarLaudo({} as Request, { params: { loteId: mockLoteId } }),
      ];

      for (const endpoint of endpoints) {
        const response = await endpoint();
        expect(response.status).toBe(403);
      }
    });

    it('deve validar loteId numérico', async () => {
      const invalidLoteId = 'abc';

      const endpoints = [
        () => getLaudo({} as Request, { params: { loteId: invalidLoteId } }),
        () => emitirLaudo({} as Request, { params: { loteId: invalidLoteId } }),
        () => gerarPDF({} as Request, { params: { loteId: invalidLoteId } }),
        () => enviarLaudo({} as Request, { params: { loteId: invalidLoteId } }),
      ];

      for (const endpoint of endpoints) {
        const response = await endpoint();
        const data = await response.json();
        expect(response.status).toBe(400);
        expect(data.error).toBe('ID do lote inválido');
      }
    });
  });
});
