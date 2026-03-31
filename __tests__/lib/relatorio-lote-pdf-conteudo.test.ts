/**
 * @file __tests__/lib/relatorio-lote-pdf-conteudo.test.ts
 *
 * Testes unitários para lib/pdf/relatorio-lote.ts
 *
 * Validações desta conversa (26/03/2026):
 * 1. Linha "Gerado em" da tabela usa emitido_em (timestamp do laudo), não new Date()
 * 2. Linha "Status" foi removida — NUNCA deve aparecer
 * 3. Quando emitido_em é null, "Gerado em" exibe "Pendente"
 * 4. Rodapé da página usa timestamp atual (new Date()), não emitido_em
 */

// Captura chamadas ao autoTable para inspecionar body da tabela
const capturedAutoTableCalls: any[][] = [];

jest.mock('jspdf', () => {
  const mockDoc = {
    internal: {
      pageSize: {
        getWidth: jest.fn(() => 210),
        getHeight: jest.fn(() => 297),
      },
    },
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    addImage: jest.fn(),
    output: jest.fn(() => new ArrayBuffer(8)),
  };
  return { __esModule: true, default: jest.fn(() => mockDoc) };
});

jest.mock('jspdf-autotable', () => {
  return jest.fn((doc: any, options: any) => {
    capturedAutoTableCalls.push(options);
    // Simula lastAutoTable.finalY requerido pelo código
    doc.lastAutoTable = { finalY: 80 };
  });
});

jest.mock('@/lib/config/branding/logo', () => ({
  QWORK_LOGO_BASE64: 'data:image/png;base64,mock',
}));

jest.mock('@/lib/pdf/timezone-helper', () => ({
  formatarDataCorrigida: (date: Date) => {
    if (!date) return '';
    return date.toISOString().replace('T', ' ').slice(0, 19);
  },
}));

import { gerarRelatorioLotePDF } from '@/lib/pdf/relatorio-lote';

const EMITIDO_EM = new Date('2026-03-26T13:16:54Z');
const CRIADO_EM = new Date('2026-03-14T22:21:56Z');

function buildDados(emitidoEm: Date | null = EMITIDO_EM) {
  return {
    lote: {
      id: 33,
      criado_em: CRIADO_EM,
      emitido_em: emitidoEm,
      hash_pdf:
        '2c66b0fb35eaa5b70c0ca121b674aaafaa85d0bfbf5d09ecc273c1a93d4daa21',
      status: 'concluido',
    },
    funcionarios: [
      {
        nome: 'João Silva',
        cpf: '11111111111',
        concluida_em: new Date('2026-03-26T12:00:00Z'),
        status: 'concluida',
      },
    ],
  };
}

describe('gerarRelatorioLotePDF — conteúdo da tabela', () => {
  beforeEach(() => {
    capturedAutoTableCalls.length = 0;
    jest.clearAllMocks();
  });

  it('deve gerar Buffer sem lançar erros', () => {
    const result = gerarRelatorioLotePDF(buildDados());
    expect(result).toBeInstanceOf(Buffer);
  });

  it('tabela de info do lote deve conter linha "Gerado em" (não "Status")', () => {
    gerarRelatorioLotePDF(buildDados());

    // Primeira chamada ao autoTable = tabela de info do lote
    const infoTable = capturedAutoTableCalls[0];
    expect(infoTable).toBeDefined();

    const campos = infoTable.body.map((row: string[]) => row[0]);
    expect(campos).toContain('Gerado em');
    expect(campos).not.toContain('Status');
  });

  it('"Gerado em" usa emitido_em do laudo, não o timestamp atual', () => {
    gerarRelatorioLotePDF(buildDados(EMITIDO_EM));

    const infoTable = capturedAutoTableCalls[0];
    const geradoEmRow = infoTable.body.find(
      (row: string[]) => row[0] === 'Gerado em'
    );
    expect(geradoEmRow).toBeDefined();

    // formatarDataCorrigida mock: date.toISOString().replace('T', ' ').slice(0, 19)
    // EMITIDO_EM = new Date('2026-03-26T13:16:54Z') → '2026-03-26 13:16:54'
    expect(geradoEmRow[1]).toBe('2026-03-26 13:16:54');
  });

  it('quando emitido_em é null, "Gerado em" exibe "Pendente"', () => {
    gerarRelatorioLotePDF(buildDados(null));

    const infoTable = capturedAutoTableCalls[0];
    const geradoEmRow = infoTable.body.find(
      (row: string[]) => row[0] === 'Gerado em'
    );
    expect(geradoEmRow).toBeDefined();
    expect(geradoEmRow[1]).toBe('Pendente');
  });

  it('tabela de info deve conter ID do Lote, Data de Criação e Hash PDF', () => {
    gerarRelatorioLotePDF(buildDados());

    const infoTable = capturedAutoTableCalls[0];
    const campos = infoTable.body.map((row: string[]) => row[0]);
    expect(campos).toContain('ID do Lote');
    expect(campos).toContain('Data de Criação');
    expect(campos).toContain('Hash PDF');
  });

  it('tabela de info deve ter exatamente 4 linhas (sem linha "Status")', () => {
    gerarRelatorioLotePDF(buildDados());

    const infoTable = capturedAutoTableCalls[0];
    expect(infoTable.body).toHaveLength(4);
  });

  it('ID do lote na tabela corresponde ao lote passado', () => {
    gerarRelatorioLotePDF(buildDados());

    const infoTable = capturedAutoTableCalls[0];
    const idRow = infoTable.body.find(
      (row: string[]) => row[0] === 'ID do Lote'
    );
    expect(idRow[1]).toBe('33');
  });

  it('Hash PDF exibe o valor correto quando disponível', () => {
    gerarRelatorioLotePDF(buildDados());

    const infoTable = capturedAutoTableCalls[0];
    const hashRow = infoTable.body.find(
      (row: string[]) => row[0] === 'Hash PDF'
    );
    expect(hashRow[1]).toBe(
      '2c66b0fb35eaa5b70c0ca121b674aaafaa85d0bfbf5d09ecc273c1a93d4daa21'
    );
  });

  it('Hash PDF exibe "Não disponível" quando null', () => {
    const dados = buildDados();
    dados.lote.hash_pdf = null;
    gerarRelatorioLotePDF(dados);

    const infoTable = capturedAutoTableCalls[0];
    const hashRow = infoTable.body.find(
      (row: string[]) => row[0] === 'Hash PDF'
    );
    expect(hashRow[1]).toBe('Não disponível');
  });
});
