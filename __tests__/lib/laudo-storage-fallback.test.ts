// Mocks precisam estar antes dos imports
const mockListObjectsByPrefix = jest.fn();
const mockFindLatestLaudoForLote = jest.fn();
const mockDownloadFromBackblaze = jest.fn();
const mockCheckBackblazeFileExists = jest.fn();

jest.mock('@/lib/storage/backblaze-client', () => ({
  listObjectsByPrefix: (...args: any[]) => mockListObjectsByPrefix(...args),
  findLatestLaudoForLote: (...args: any[]) =>
    mockFindLatestLaudoForLote(...args),
  downloadFromBackblaze: (...args: any[]) => mockDownloadFromBackblaze(...args),
  checkBackblazeFileExists: (...args: any[]) =>
    mockCheckBackblazeFileExists(...args),
}));

const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockAccess = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: (...args: any[]) => mockReadFile(...args),
  writeFile: (...args: any[]) => mockWriteFile(...args),
  access: (...args: any[]) => mockAccess(...args),
}));

const mockQuery = jest.fn();

jest.mock('@/lib/db', () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

import { lerLaudo, laudoExists } from '@/lib/storage/laudo-storage';

describe('laudo-storage fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Defaults: simular que arquivos locais não existem
    mockAccess.mockRejectedValue(new Error('ENOENT'));
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockWriteFile.mockResolvedValue(undefined);
    // Mock do query para buscar lote_id
    mockQuery.mockResolvedValue({ rows: [{ lote_id: 123 }], rowCount: 1 });
  });

  it('deve baixar do backblaze quando metadados locais ausentes', async () => {
    // Setup: Backblaze tem o arquivo
    const remoteKey = 'laudos/lote-123/laudo-timestamp.pdf';
    mockFindLatestLaudoForLote.mockResolvedValue(remoteKey);
    mockDownloadFromBackblaze.mockResolvedValue(Buffer.from('remote-pdf-data'));

    const buf = await lerLaudo(123);

    expect(buf.toString()).toBe('remote-pdf-data');
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT lote_id FROM laudos WHERE id = $1',
      [123]
    );
    expect(mockFindLatestLaudoForLote).toHaveBeenCalledWith(123);
    expect(mockDownloadFromBackblaze).toHaveBeenCalledWith(remoteKey);
    // Deve ter salvado cache local dos metadados e do PDF
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it('laudoExists retorna true se houver objeto por prefixo', async () => {
    mockListObjectsByPrefix.mockResolvedValue(['laudos/lote-123/laudo-1.pdf']);

    const res = await laudoExists(123);

    expect(res).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT lote_id FROM laudos WHERE id = $1',
      [123]
    );
    expect(mockListObjectsByPrefix).toHaveBeenCalledWith('laudos/lote-123/', 5);
  });

  it('laudoExists retorna false se não houver objeto local nem remoto', async () => {
    mockListObjectsByPrefix.mockResolvedValue([]);

    const res = await laudoExists(123);

    expect(res).toBe(false);
  });
});
