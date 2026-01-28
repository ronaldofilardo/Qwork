jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock('@/lib/storage/backblaze-client', () => ({
  uploadToBackblaze: jest.fn(),
  checkBackblazeFileExists: jest.fn(),
}));

let mockQuery: jest.Mock;
let fs: any;
let backblaze: any;
let syncMain: any;

describe('scripts/batch-sync-laudos', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockQuery = require('@/lib/db').query as jest.Mock;
    fs = require('fs/promises');
    backblaze = require('@/lib/storage/backblaze-client');
    syncMain = require('@/scripts/batch-sync-laudos').main;
  });

  it('should perform dry-run and skip actual uploads', async () => {
    // Simular laudos
    mockQuery.mockResolvedValue({
      rows: [{ id: 1, lote_id: 30 }],
      rowCount: 1,
    });

    // Simular que existe arquivo local
    fs.readFile.mockResolvedValue(Buffer.from('pdf'));

    // Run with env override args
    const originalArgv = process.argv;
    process.argv = [
      'node',
      'scripts/batch-sync-laudos.ts',
      '--dry-run',
      '--limit',
      '1',
    ];

    await syncMain();

    expect(backblaze.uploadToBackblaze).not.toHaveBeenCalled();

    process.argv = originalArgv;
  });

  it('should upload when not dry-run and update metadata', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: 2, lote_id: 31 }],
      rowCount: 1,
    });
    fs.readFile.mockResolvedValue(Buffer.from('pdf'));

    backblaze.checkBackblazeFileExists.mockResolvedValue(false);
    backblaze.uploadToBackblaze.mockResolvedValue({
      key: 'laudos/lote-31/laudo-uploaded.pdf',
      bucket: 'laudos-qwork',
      url: 'https://example.com/laudo',
    });
    const originalArgv = process.argv;
    process.argv = ['node', 'scripts/batch-sync-laudos.ts', '--limit', '1'];

    await syncMain();

    expect(backblaze.uploadToBackblaze).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();

    process.argv = originalArgv;
  });
});
