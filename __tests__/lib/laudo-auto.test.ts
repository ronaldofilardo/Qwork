/**
 * Testes para lib/laudo-auto.ts
 *
 * Funcionalidades testadas:
 * 1. gerarLaudoCompletoEmitirPDF - fluxo completo de emissão
 * 2. Propagação de session RLS para todas as queries internas
 * 3. Imutabilidade: rejeitar re-emissão de laudos já emitidos/enviados
 * 4. Criação de rascunho quando laudo não existe
 * 5. Atualização de rascunho existente
 */

import { gerarLaudoCompletoEmitirPDF } from '@/lib/laudo-auto';
import { query } from '@/lib/db';

// Mock de todos os módulos externos pesados
jest.mock('@/lib/db');
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}));
jest.mock('@/lib/laudo-calculos', () => ({
  gerarDadosGeraisEmpresa: jest.fn().mockResolvedValue({
    empresaAvaliada: 'Empresa Teste',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua Teste, 1 - SP - SP, CEP: 01000-000',
    periodoAvaliacoes: {
      dataLiberacao: '01/01/2026',
      dataUltimaConclusao: '10/01/2026',
    },
    totalFuncionariosAvaliados: 5,
    amostra: { operacional: 3, gestao: 2 },
  }),
  calcularScoresPorGrupo: jest.fn().mockResolvedValue([
    {
      grupo: 1,
      media: 60,
      desvioPadrao: 5,
      mediaMenosDP: 55,
      mediaMaisDP: 65,
      categoriaRisco: 'medio',
      classificacaoSemaforo: 'amarelo',
      acaoRecomendada: 'Atenção preventiva',
    },
  ]),
  gerarInterpretacaoRecomendacoes: jest.fn().mockReturnValue({
    textoPrincipal: 'Texto mock',
    conclusao: 'Conclusão mock',
    gruposAtencao: [],
    gruposExcelente: [],
    gruposMonitoramento: [],
    gruposAltoRisco: [],
  }),
  gerarObservacoesConclusao: jest.fn().mockReturnValue({
    observacoesLaudo: 'Observações',
    textoConclusao: 'Conclusão',
    dataEmissao: 'Curitiba, 6 de abril de 2026',
    assinatura: {
      nome: 'GILSON DANTAS DAMASCENO',
      titulo: 'Psicólogo',
      registro: 'CRP 08/4053',
      empresa: 'Responsável Técnico',
    },
  }),
}));

jest.mock('@/lib/templates/laudo-html', () => ({
  gerarHTMLLaudoCompleto: jest
    .fn()
    .mockReturnValue('<html>Mock PDF HTML</html>'),
}));

jest.mock('@/lib/infrastructure/pdf/generators/pdf-generator', () => ({
  getPuppeteerInstance: jest.fn().mockResolvedValue({
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('FAKE_PDF_BYTES')),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  }),
}));

jest.mock('@/lib/storage/backblaze-client', () => ({
  getPresignedUrl: jest
    .fn()
    .mockResolvedValue(
      'https://s3.us-east-005.backblazeb2.com/laudos-qwork/test.pdf'
    ),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('lib/laudo-auto - gerarLaudoCompletoEmitirPDF', () => {
  const mockEmissorCpf = '99999999999';
  const mockSession = {
    cpf: '99999999999',
    perfil: 'emissor',
    dbEnvironment: 'staging',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Imutabilidade de laudos', () => {
    it('deve lançar erro ao tentar re-emitir laudo com status "emitido"', async () => {
      // Arrange: laudo já emitido
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'emitido' }],
        rowCount: 1,
      } as any);

      // Act & Assert
      await expect(
        gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession)
      ).rejects.toThrow('não pode ser regenerado');
    });

    it('deve lançar erro ao tentar re-emitir laudo com status "enviado"', async () => {
      // Arrange: laudo já enviado ao bucket
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'enviado' }],
        rowCount: 1,
      } as any);

      await expect(
        gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession)
      ).rejects.toThrow('não pode ser regenerado');
    });
  });

  describe('Propagação de session RLS', () => {
    it('deve passar session a query ao verificar laudo existente', async () => {
      // Arrange: laudo não existe
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // check laudo
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // INSERT rascunho
      // Observações
      mockQuery.mockResolvedValueOnce({
        rows: [{ observacoes: '' }],
        rowCount: 1,
      } as any);
      // UPDATE para emitido
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      await gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession);

      // Primeira query (check existência) deve receber session
      expect(mockQuery.mock.calls[0][2]).toBe(mockSession);
    });

    it('deve passar session a query ao criar rascunho', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // check laudo
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // INSERT rascunho
      mockQuery.mockResolvedValueOnce({
        rows: [{ observacoes: '' }],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      await gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession);

      // Segunda query (INSERT rascunho) deve receber session
      expect(mockQuery.mock.calls[1][2]).toBe(mockSession);
    });

    it('deve passar session a query ao atualizar rascunho existente', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'rascunho' }],
          rowCount: 1,
        } as any) // check laudo = rascunho
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE emissor
        .mockResolvedValueOnce({
          rows: [{ observacoes: 'Obs anterior' }],
          rowCount: 1,
        } as any) // SELECT observacoes
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any); // UPDATE emitido

      await gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession);

      // Todas as queries devem receber session
      mockQuery.mock.calls.forEach((call) => {
        expect(call[2]).toBe(mockSession);
      });
    });

    it('funciona sem session (undefined) - backward compatibility', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ observacoes: '' }],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      // Não deve lançar erro quando session não é passado
      await expect(
        gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf)
      ).resolves.toMatchObject({ laudoId: 1 });
    });
  });

  describe('Fluxo de criação de laudo', () => {
    it('deve retornar o laudoId (= loteId) após emissão com sucesso', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // check
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT
        .mockResolvedValueOnce({
          rows: [{ observacoes: '' }],
          rowCount: 1,
        } as any) // SELECT obs
        .mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any); // UPDATE emitido

      const result = await gerarLaudoCompletoEmitirPDF(
        42,
        mockEmissorCpf,
        mockSession
      );

      expect((result as any).laudoId).toBe(42);
    });

    it('deve lançar erro quando UPDATE para emitido não afeta nenhuma linha', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // check
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT
        .mockResolvedValueOnce({
          rows: [{ observacoes: '' }],
          rowCount: 1,
        } as any) // SELECT obs
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // UPDATE retorna 0 rows

      await expect(
        gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession)
      ).rejects.toThrow('Falha ao atualizar laudo para pdf_gerado');
    });
  });
});
