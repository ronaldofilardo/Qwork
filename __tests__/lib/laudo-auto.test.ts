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

  // Helper: monta a sequência completa de 7 mocks para o fluxo happy path
  // q0: SELECT laudo (inexistente), q1: INSERT rascunho, q2: SELECT obs,
  // q3-q5: state walk lotes_avaliacao (3 UPDATEs), q6: UPDATE laudos SET pdf_gerado
  function mockFullFlow(opts?: { laudoId?: number; q6RowCount?: number; existingRascunho?: boolean }) {
    const id = opts?.laudoId ?? 1;
    if (opts?.existingRascunho) {
      mockQuery.mockResolvedValueOnce({ rows: [{ id, status: 'rascunho' }], rowCount: 1 } as any); // q0: rascunho
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // q1: UPDATE emissor_cpf
    } else {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // q0: inexistente
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // q1: INSERT
    }
    mockQuery.mockResolvedValueOnce({ rows: [{ observacoes: '' }], rowCount: 1 } as any); // q2: obs
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // q3: state walk 1
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // q4: state walk 2
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // q5: state walk 3
    const q6RowCount = opts?.q6RowCount ?? 1;
    mockQuery.mockResolvedValueOnce({ rows: q6RowCount > 0 ? [{ id }] : [], rowCount: q6RowCount } as any); // q6: UPDATE laudos
  }

  describe('Propagação de session RLS', () => {
    it('deve passar session a query ao verificar laudo existente', async () => {
      mockFullFlow();

      await gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession);

      // Primeira query (check existência) deve receber session
      expect(mockQuery.mock.calls[0][2]).toBe(mockSession);
    });

    it('deve passar session a query ao criar rascunho', async () => {
      mockFullFlow();

      await gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession);

      // Segunda query (INSERT rascunho) deve receber session
      expect(mockQuery.mock.calls[1][2]).toBe(mockSession);
    });

    it('deve passar session a query ao atualizar rascunho existente', async () => {
      mockFullFlow({ existingRascunho: true });

      await gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession);

      // Todas as queries devem receber session
      mockQuery.mock.calls.forEach((call) => {
        expect(call[2]).toBe(mockSession);
      });
    });

    it('funciona sem session (undefined) - backward compatibility', async () => {
      mockFullFlow({ laudoId: 1 });

      // Não deve lançar erro quando session não é passado
      await expect(
        gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf)
      ).resolves.toMatchObject({ laudoId: 1 });
    });
  });

  describe('Fluxo de criação de laudo', () => {
    it('deve retornar o laudoId (= loteId) após emissão com sucesso', async () => {
      mockFullFlow({ laudoId: 42 });

      const result = await gerarLaudoCompletoEmitirPDF(
        42,
        mockEmissorCpf,
        mockSession
      );

      expect((result as any).laudoId).toBe(42);
    });

    it('deve lançar erro quando UPDATE para pdf_gerado não afeta nenhuma linha', async () => {
      mockFullFlow({ q6RowCount: 0 });

      await expect(
        gerarLaudoCompletoEmitirPDF(1, mockEmissorCpf, mockSession)
      ).rejects.toThrow('Falha ao atualizar laudo para pdf_gerado');
    });
  });
});

// ─── Testes para gerarPDFLaudo (fluxo único após remoção do ZapSign) ────────────────

describe('lib/laudo-auto - gerarPDFLaudo', () => {
  const mockEmissorCpf = '99999999999';
  const mockSession = { cpf: '99999999999', perfil: 'emissor' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * No fluxo legado, gerarPDFLaudo deve executar as seguintes queries:
   *  0. SELECT id, status FROM laudos (check existente)
   *  1. INSERT INTO laudos (criar rascunho)
   *  2. SELECT observacoes FROM laudos
   *  3. UPDATE lotes_avaliacao concluido → emissao_solicitada   (state walk 1)
   *  4. UPDATE lotes_avaliacao emissao_solicitada → emissao_em_andamento (state walk 2)
   *  5. UPDATE lotes_avaliacao emissao_em_andamento → laudo_emitido     (state walk 3)
   *  6. UPDATE laudos SET hash_pdf, status='emitido', emitido_em
   */
  function mockLegadoQueries(overrides?: { step6RowCount?: number }) {
    // q0: check laudo existente
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // q1: INSERT rascunho
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // q2: SELECT observacoes
    mockQuery.mockResolvedValueOnce({
      rows: [{ observacoes: '' }],
      rowCount: 1,
    } as any);
    // q3-q5: state walk (3 UPDATEs lotes_avaliacao)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // concluido→emissao_solicitada
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // emissao_solicitada→emissao_em_andamento
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // emissao_em_andamento→laudo_emitido
    // q6: UPDATE laudos SET pdf_gerado
    mockQuery.mockResolvedValueOnce({
      rows: overrides?.step6RowCount === 0 ? [] : [{ id: 42 }],
      rowCount: overrides?.step6RowCount ?? 1,
    } as any);
  }

  it('deve caminhar lote pela máquina de estados antes de setar pdf_gerado_em', async () => {
    const { gerarPDFLaudo } = await import('@/lib/laudo-auto');
    mockLegadoQueries();

    await gerarPDFLaudo(42, mockEmissorCpf, mockSession);

    // Verificar que houve exatamente 7 queries
    expect(mockQuery).toHaveBeenCalledTimes(7);

    // q3: state walk concluido → emissao_solicitada
    const q3 = mockQuery.mock.calls[3];
    expect(q3[0]).toContain('UPDATE lotes_avaliacao');
    expect(q3[1]).toEqual(['emissao_solicitada', 42, 'concluido']);

    // q4: state walk emissao_solicitada → emissao_em_andamento
    const q4 = mockQuery.mock.calls[4];
    expect(q4[0]).toContain('UPDATE lotes_avaliacao');
    expect(q4[1]).toEqual(['emissao_em_andamento', 42, 'emissao_solicitada']);

    // q5: state walk emissao_em_andamento → laudo_emitido
    const q5 = mockQuery.mock.calls[5];
    expect(q5[0]).toContain('UPDATE lotes_avaliacao');
    expect(q5[1]).toEqual(['laudo_emitido', 42, 'emissao_em_andamento']);

    // q6: UPDATE laudos SET pdf_gerado
    const q6 = mockQuery.mock.calls[6];
    expect(q6[0]).toContain("status        = 'pdf_gerado'");
    expect(q6[0]).toContain('pdf_gerado_em = NOW()');
  });

  it('state walk PRECEDE o UPDATE laudos SET pdf_gerado_em (ordem crítica)', async () => {
    const { gerarPDFLaudo } = await import('@/lib/laudo-auto');
    mockLegadoQueries();

    await gerarPDFLaudo(42, mockEmissorCpf, mockSession);

    // q6: UPDATE laudos SET pdf_gerado_em — deve vir APÓS as 3 queries de state walk
    const q6 = mockQuery.mock.calls[6];
    expect(q6[0]).toContain("status        = 'pdf_gerado'");
    expect(q6[0]).toContain('pdf_gerado_em = NOW()');
    // Index 6 = após as 3 state walks (indices 3,4,5)
    expect(mockQuery.mock.calls.length).toBeGreaterThanOrEqual(7);
  });

  it('deve retornar status="pdf_gerado" após geração com sucesso', async () => {
    const { gerarPDFLaudo } = await import('@/lib/laudo-auto');
    mockLegadoQueries();

    const result = await gerarPDFLaudo(42, mockEmissorCpf, mockSession);

    expect(result.status).toBe('pdf_gerado');
    expect(result.laudoId).toBe(42);
  });

  it('deve lançar erro quando UPDATE laudos para pdf_gerado não afeta nenhuma linha', async () => {
    const { gerarPDFLaudo } = await import('@/lib/laudo-auto');
    mockLegadoQueries({ step6RowCount: 0 });

    await expect(
      gerarPDFLaudo(42, mockEmissorCpf, mockSession)
    ).rejects.toThrow('Falha ao atualizar laudo para pdf_gerado');
  });

  it('deve continuar mesmo se state walk falhar (lote já no status correto)', async () => {
    const { gerarPDFLaudo } = await import('@/lib/laudo-auto');

    // q0: check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // q1: INSERT
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // q2: SELECT observacoes
    mockQuery.mockResolvedValueOnce({
      rows: [{ observacoes: '' }],
      rowCount: 1,
    } as any);
    // q3-q5: state walk — todos com rowCount=0 (lote já em laudo_emitido, sem mudança)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // q6: UPDATE laudos SET emitido
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any);

    // Não deve lançar erro — state walk sem match é tratado silenciosamente
    await expect(
      gerarPDFLaudo(42, mockEmissorCpf, mockSession)
    ).resolves.toMatchObject({ status: 'pdf_gerado', laudoId: 42 });
  });
});
