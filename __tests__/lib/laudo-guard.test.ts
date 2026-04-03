/**
 * @file __tests__/lib/laudo-guard.test.ts
 * Testes: laudo-guard — proteção permanente contra deleção de laudos
 *
 * Verifica que todas as funções de guarda bloqueiam corretamente caminhos
 * protegidos e permitem caminhos fora da zona de proteção.
 */

import path from 'path';
import {
  LaudoDeletionBlockedError,
  assertNotLaudoLocalPath,
  assertNotLaudoBackblazeKey,
  deleteStorageFileSafe,
  deleteStorageDirSafe,
  LAUDOS_BACKBLAZE_PROTECTED_PREFIX,
} from '@/lib/storage/laudo-guard';

// Mock fs/promises para não tocar o filesystem real nos testes unitários
jest.mock('fs/promises', () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
  rm: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fsMock = require('fs/promises') as {
  unlink: jest.Mock;
  rm: jest.Mock;
};

beforeEach(() => {
  fsMock.unlink.mockClear();
  fsMock.rm.mockClear();
});

// ─── LaudoDeletionBlockedError ─────────────────────────────────────────────

describe('LaudoDeletionBlockedError', () => {
  it('deve ter code === LAUDO_DELETION_BLOCKED', () => {
    const err = new LaudoDeletionBlockedError(
      'storage/laudos/laudo-1.pdf',
      'local'
    );
    expect(err.code).toBe('LAUDO_DELETION_BLOCKED');
  });

  it('deve ter name === LaudoDeletionBlockedError', () => {
    const err = new LaudoDeletionBlockedError(
      'laudos/lote-1/file.pdf',
      'backblaze'
    );
    expect(err.name).toBe('LaudoDeletionBlockedError');
  });

  it('deve ser instância de Error', () => {
    const err = new LaudoDeletionBlockedError('any', 'local');
    expect(err).toBeInstanceOf(Error);
  });

  it('deve ser instância de LaudoDeletionBlockedError via instanceof', () => {
    const err = new LaudoDeletionBlockedError('any', 'backblaze');
    expect(err).toBeInstanceOf(LaudoDeletionBlockedError);
  });

  it('mensagem deve mencionar contexto "backblaze"', () => {
    const err = new LaudoDeletionBlockedError(
      'laudos/lote-1/laudo.pdf',
      'backblaze'
    );
    expect(err.message).toMatch(/Backblaze/i);
  });

  it('mensagem deve mencionar contexto "local"', () => {
    const err = new LaudoDeletionBlockedError(
      'storage/laudos/laudo-1.pdf',
      'local'
    );
    expect(err.message).toMatch(/local/i);
  });
});

// ─── LAUDOS_BACKBLAZE_PROTECTED_PREFIX ────────────────────────────────────

describe('LAUDOS_BACKBLAZE_PROTECTED_PREFIX', () => {
  it('deve ser "laudos/"', () => {
    expect(LAUDOS_BACKBLAZE_PROTECTED_PREFIX).toBe('laudos/');
  });
});

// ─── assertNotLaudoBackblazeKey ────────────────────────────────────────────

describe('assertNotLaudoBackblazeKey', () => {
  it('deve lançar para chave que começa com "laudos/"', () => {
    expect(() =>
      assertNotLaudoBackblazeKey('laudos/lote-1/laudo-123.pdf')
    ).toThrow(LaudoDeletionBlockedError);
  });

  it('deve lançar para chave "laudos/"  (apenas o prefixo)', () => {
    expect(() => assertNotLaudoBackblazeKey('laudos/')).toThrow(
      LaudoDeletionBlockedError
    );
  });

  it('deve lançar para chave com backslash (normalização Windows)', () => {
    expect(() =>
      assertNotLaudoBackblazeKey('laudos\\lote-5\\laudo.pdf')
    ).toThrow(LaudoDeletionBlockedError);
  });

  it('deve PERMITIR chave de recibo (fora de laudos/)', () => {
    expect(() => assertNotLaudoBackblazeKey('recibos/rec-1.pdf')).not.toThrow();
  });

  it('deve PERMITIR chave de health check', () => {
    expect(() => assertNotLaudoBackblazeKey('health/check.txt')).not.toThrow();
  });

  it('deve PERMITIR chave de upload genérico', () => {
    expect(() =>
      assertNotLaudoBackblazeKey('uploads/2026/doc.pdf')
    ).not.toThrow();
  });
});

// ─── assertNotLaudoLocalPath ───────────────────────────────────────────────

describe('assertNotLaudoLocalPath', () => {
  const cwd = process.cwd();

  it('deve lançar para path absoluto dentro de storage/laudos', () => {
    const p = path.join(cwd, 'storage', 'laudos', 'laudo-5.pdf');
    expect(() => assertNotLaudoLocalPath(p)).toThrow(LaudoDeletionBlockedError);
  });

  it('deve lançar para path relativo storage/laudos/laudo-1.json', () => {
    const p = path.join('storage', 'laudos', 'laudo-1.json');
    expect(() => assertNotLaudoLocalPath(p)).toThrow(LaudoDeletionBlockedError);
  });

  it('deve lançar ao tentar remover o diretório storage/laudos inteiro', () => {
    const p = path.join(cwd, 'storage', 'laudos');
    expect(() => assertNotLaudoLocalPath(p)).toThrow(LaudoDeletionBlockedError);
  });

  it('deve PERMITIR path dentro de storage/laudos/pending/ (temp pré-upload)', () => {
    const p = path.join(
      cwd,
      'storage',
      'laudos',
      'pending',
      'temp-abc.pdf.tmp'
    );
    expect(() => assertNotLaudoLocalPath(p)).not.toThrow();
  });

  it('deve PERMITIR path de outro storage (storage/recibos)', () => {
    const p = path.join(cwd, 'storage', 'recibos', 'rec-1.pdf');
    expect(() => assertNotLaudoLocalPath(p)).not.toThrow();
  });

  it('deve PERMITIR path public/uploads/doc.pdf', () => {
    const p = path.join(cwd, 'public', 'uploads', 'doc.pdf');
    expect(() => assertNotLaudoLocalPath(p)).not.toThrow();
  });

  it('deve PERMITIR tmp/laudo-temp.pdf (sem storage/laudos)', () => {
    const p = path.join('tmp', 'laudo-temp.pdf');
    expect(() => assertNotLaudoLocalPath(p)).not.toThrow();
  });
});

// ─── deleteStorageFileSafe ────────────────────────────────────────────────

describe('deleteStorageFileSafe', () => {
  const cwd = process.cwd();

  it('deve lançar LaudoDeletionBlockedError e NÃO chamar unlink para path protegido', async () => {
    const p = path.join(cwd, 'storage', 'laudos', 'laudo-10.pdf');
    await expect(deleteStorageFileSafe(p)).rejects.toThrow(
      LaudoDeletionBlockedError
    );
    expect(fsMock.unlink).not.toHaveBeenCalled();
  });

  it('deve chamar unlink para path NÃO protegido', async () => {
    const p = path.join(cwd, 'storage', 'recibos', 'rec-1.pdf');
    await expect(deleteStorageFileSafe(p)).resolves.toBeUndefined();
    expect(fsMock.unlink).toHaveBeenCalledWith(p);
  });

  it('deve chamar unlink para path em pending/ (permitido)', async () => {
    const p = path.join(cwd, 'storage', 'laudos', 'pending', 'temp-xyz.tmp');
    await expect(deleteStorageFileSafe(p)).resolves.toBeUndefined();
    expect(fsMock.unlink).toHaveBeenCalledWith(p);
  });
});

// ─── deleteStorageDirSafe ─────────────────────────────────────────────────

describe('deleteStorageDirSafe', () => {
  const cwd = process.cwd();

  it('deve lançar LaudoDeletionBlockedError e NÃO chamar rm para storage/laudos', async () => {
    const p = path.join(cwd, 'storage', 'laudos');
    await expect(deleteStorageDirSafe(p)).rejects.toThrow(
      LaudoDeletionBlockedError
    );
    expect(fsMock.rm).not.toHaveBeenCalled();
  });

  it('deve lançar LaudoDeletionBlockedError para subdir de laudos (não pending)', async () => {
    const p = path.join(cwd, 'storage', 'laudos', 'lote-1');
    await expect(deleteStorageDirSafe(p)).rejects.toThrow(
      LaudoDeletionBlockedError
    );
    expect(fsMock.rm).not.toHaveBeenCalled();
  });

  it('deve chamar rm para diretório não protegido', async () => {
    const p = path.join(cwd, 'storage', 'recibos');
    await expect(deleteStorageDirSafe(p)).resolves.toBeUndefined();
    expect(fsMock.rm).toHaveBeenCalledWith(p, { recursive: true, force: true });
  });

  it('deve chamar rm para storage/laudos/pending/', async () => {
    const p = path.join(cwd, 'storage', 'laudos', 'pending');
    await expect(deleteStorageDirSafe(p)).resolves.toBeUndefined();
    expect(fsMock.rm).toHaveBeenCalledWith(p, { recursive: true, force: true });
  });
});
