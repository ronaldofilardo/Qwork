import { main as linkMain } from '@/scripts/link-remote-laudos';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/storage/backblaze-client', () => ({
  findLatestLaudoForLote: jest.fn(),
  checkBackblazeFileExists: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

const db = require('@/lib/db');
const backblaze = require('@/lib/storage/backblaze-client');
const fs = require('fs/promises');

describe('scripts/link-remote-laudos', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should link remote keys when found (by lote)', async () => {
    db.query.mockResolvedValue({
      rows: [{ laudo_id: 14, lote_id: 30 }],
      rowCount: 1,
    });
    fs.readFile.mockRejectedValue(new Error('ENOENT'));
    backblaze.findLatestLaudoForLote.mockResolvedValue(
      'laudos/lote-30/laudo-123.pdf'
    );
    backblaze.checkBackblazeFileExists.mockResolvedValue(true);

    const originalArgv = process.argv;
    process.argv = [
      'node',
      'scripts/link-remote-laudos.ts',
      '--lote',
      '30',
      '--limit',
      '1',
    ];

    await linkMain();

    expect(backblaze.findLatestLaudoForLote).toHaveBeenCalledWith(30);
    expect(fs.writeFile).toHaveBeenCalled();

    process.argv = originalArgv;
  });

  it('should link remote keys when found (by laudo id)', async () => {
    db.query.mockResolvedValue({
      rows: [{ laudo_id: 14, lote_id: 30 }],
      rowCount: 1,
    });
    fs.readFile.mockRejectedValue(new Error('ENOENT'));
    backblaze.findLatestLaudoForLote.mockResolvedValue(
      'laudos/lote-30/laudo-123.pdf'
    );
    backblaze.checkBackblazeFileExists.mockResolvedValue(true);

    const originalArgv = process.argv;
    process.argv = ['node', 'scripts/link-remote-laudos.ts', '--laudo', '14'];

    await linkMain();

    expect(backblaze.findLatestLaudoForLote).toHaveBeenCalledWith(30);
    expect(fs.writeFile).toHaveBeenCalled();

    process.argv = originalArgv;
  });

  it('should skip when no remote found', async () => {
    db.query.mockResolvedValue({
      rows: [{ laudo_id: 15, lote_id: 31 }],
      rowCount: 1,
    });
    fs.readFile.mockRejectedValue(new Error('ENOENT'));
    backblaze.findLatestLaudoForLote.mockResolvedValue(null);

    const originalArgv = process.argv;
    process.argv = ['node', 'scripts/link-remote-laudos.ts', '--limit', '1'];

    await linkMain();

    expect(fs.writeFile).not.toHaveBeenCalled();

    process.argv = originalArgv;
  });
});
