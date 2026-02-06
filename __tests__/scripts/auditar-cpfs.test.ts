/**
 * Testes para Script de Auditoria de CPFs - LGPD
 */

import { jest } from '@jest/globals';

// Mock das dependências
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockQuery = jest.fn();
const mockValidarCPF = jest.fn();
const mockMascararCPFParaLog = jest.fn();

// @ts-expect-error - Mock parcial de fs para testes, não precisa implementar toda interface
jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync,
}));

const mockFs = jest.requireMock('fs');

jest.mock('@/lib/db', () => ({
  query: mockQuery,
}));

jest.mock('@/lib/cpf-utils', () => ({
  validarCPF: mockValidarCPF,
  mascararCPFParaLog: mockMascararCPFParaLog,
}));

// Importar o script após os mocks
let auditarCPFs: any;
beforeAll(async () => {
  const auditModule = await import('@/scripts/auditar-cpfs.ts');
  auditarCPFs = auditModule.auditarCPFs;
});

describe('Script Auditoria CPFs - LGPD', () => {
  const mockConsoleLog = jest
    .spyOn(console, 'log')
    .mockImplementation(() => {});
  const mockConsoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  const mockProcessExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockValidarCPF.mockReset();
    mockMascararCPFParaLog.mockReset();
    mockExistsSync.mockReset();
    mockMkdirSync.mockReset();
    mockWriteFileSync.mockReset();

    mockExistsSync.mockReturnValue(true);
    mockMkdirSync.mockImplementation(() => undefined);
    mockWriteFileSync.mockImplementation(() => undefined);
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  it('deve auditar CPFs válidos e inválidos corretamente', async () => {
    // Mock dos dados do banco
    const mockFuncionarios = [
      { cpf: '12345678909', nome: 'João Silva' },
      { cpf: '11111111111', nome: 'Maria Santos' }, // CPF inválido
      { cpf: '52998224725', nome: 'Pedro Costa' },
    ];

    const mockAvaliacoes = [
      { id: 1, funcionario_cpf: '12345678909', status: 'concluido' },
      { id: 2, funcionario_cpf: '11111111111', status: 'pendente' },
    ];

    mockQuery
      .mockResolvedValueOnce({
        rows: mockFuncionarios,
        rowCount: mockFuncionarios.length,
      }) // funcionários
      .mockResolvedValueOnce({
        rows: mockAvaliacoes,
        rowCount: mockAvaliacoes.length,
      }); // avaliações

    // Mock da validação de CPF
    mockValidarCPF
      .mockReturnValueOnce(true) // 12345678909 - válido
      .mockReturnValueOnce(false) // 11111111111 - inválido
      .mockReturnValueOnce(true); // 52998224725 - válido

    mockMascararCPFParaLog
      .mockReturnValueOnce('*******8909')
      .mockReturnValueOnce('*******1111')
      .mockReturnValueOnce('*******4725');

    const result = await auditarCPFs();

    expect(result).toEqual({
      totalFuncionarios: 3,
      cpfsValidos: 2,
      cpfsInvalidos: 1,
      totalAvaliacoes: 2,
      relatorioGerado: true,
      duplicatasCount: 0,
    });

    // @ts-expect-error - Mock fs pode não ter todos os tipos exatos, mas funciona para teste
    expect(mockFs.writeFileSync as any).toHaveBeenCalledTimes(2); // JSON e relatório

    // Verificar se o relatório foi gerado corretamente
    const jsonCall = mockWriteFileSync.mock.calls.find((call) =>
      JSON.stringify(call[0]).includes('auditoria-cpfs-')
    );
    expect(jsonCall).toBeDefined();

    const relatorioCall = mockWriteFileSync.mock.calls.find((call) =>
      JSON.stringify(call[0]).includes('relatorio-auditoria-cpfs-')
    );
    expect(relatorioCall).toBeDefined();
  });

  it('deve lidar com erro na consulta de funcionários', async () => {
    (mockQuery as any).mockRejectedValueOnce(new Error('Erro de conexão'));

    await expect(auditarCPFs()).rejects.toThrow('Erro de conexão');
  });

  it('deve lidar com erro na consulta de avaliações', async () => {
    (mockQuery as any)
      .mockResolvedValueOnce({
        rows: [{ cpf: '12345678909', nome: 'João Silva' }],
        rowCount: 1,
      })
      .mockRejectedValueOnce(new Error('Erro na consulta de avaliações'));

    await expect(auditarCPFs()).rejects.toThrow(
      'Erro na consulta de avaliações'
    );
  });

  it('deve criar diretório de relatórios se não existir', async () => {
    mockExistsSync.mockReturnValue(false);

    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await auditarCPFs();

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('reports'),
      { recursive: true }
    );
  });

  it('deve gerar relatório detalhado', async () => {
    const mockFuncionarios = [
      { cpf: '12345678909', nome: 'João Silva' },
      { cpf: '11111111111', nome: 'Maria Santos' },
    ];

    mockQuery
      .mockResolvedValueOnce({
        rows: mockFuncionarios,
        rowCount: mockFuncionarios.length,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    mockValidarCPF.mockReturnValueOnce(true).mockReturnValueOnce(false);

    mockMascararCPFParaLog
      .mockReturnValueOnce('*******8909')
      .mockReturnValueOnce('*******1111');

    await auditarCPFs();

    // Verificar se writeFileSync foi chamado para o relatório
    expect(mockWriteFileSync).toHaveBeenCalled();

    const relatorioCall = (mockFs.writeFileSync as any).mock.calls[1]; // Segundo arquivo (relatório)
    const relatorioContent = relatorioCall[1];

    expect(relatorioContent).toContain('RELATÓRIO DE AUDITORIA DE CPFs - LGPD');
    expect(relatorioContent).toContain('Total de funcionários: 2');
    expect(relatorioContent).toContain('CPFs válidos: 1');
    expect(relatorioContent).toContain('CPFs inválidos: 1');
    expect(relatorioContent).toContain('*******8909');
    expect(relatorioContent).toContain('*******1111');
  });
});
