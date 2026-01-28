import fs from 'fs/promises';
import path from 'path';
import {
  salvarLaudoLocal,
  lerLaudo,
  laudoExists,
  lerMetadados,
  calcularHash,
} from '@/lib/storage/laudo-storage';

jest.mock('@/lib/storage/backblaze-client', () => ({
  downloadFromBackblaze: jest.fn().mockResolvedValue(Buffer.from('remotepdf')),
  checkBackblazeFileExists: jest.fn().mockResolvedValue(true),
  uploadToBackblaze: jest
    .fn()
    .mockResolvedValue({
      provider: 'backblaze',
      bucket: 'laudos-qwork',
      key: 'laudos/lote-1/remote.pdf',
      url: 'https://s3.test/laudos-qwork/laudos/lote-1/remote.pdf',
    }),
}));

const storageDir = path.join(process.cwd(), 'storage', 'laudos');

describe('Laudo Storage', () => {
  beforeEach(async () => {
    // limpar pasta storage/laudos
    try {
      await fs.rm(storageDir, { recursive: true, force: true });
    } catch (e) {}
    await fs.mkdir(storageDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(storageDir, { recursive: true, force: true });
    } catch (e) {}
  });

  it('salvarLaudoLocal salva arquivo e metadados', async () => {
    const laudoId = Date.now();
    const buf = Buffer.from('hello world');
    const hash = calcularHash(buf);

    const p = await salvarLaudoLocal(laudoId, buf, hash);
    expect(p).toContain(`laudo-${laudoId}.pdf`);

    const file = await fs.readFile(
      path.join(storageDir, `laudo-${laudoId}.pdf`)
    );
    expect(file.toString()).toBe('hello world');

    const meta = await lerMetadados(laudoId);
    expect(meta).not.toBeNull();
    expect(meta.hash).toBe(hash);
    expect(meta.arquivo).toBe(`laudo-${laudoId}.pdf`);
  });

  it('lerLaudo lê arquivo local quando presente', async () => {
    const laudoId = Date.now() + 1;
    await fs.writeFile(
      path.join(storageDir, `laudo-${laudoId}.pdf`),
      'localpdf'
    );
    const buf = await lerLaudo(laudoId);
    expect(buf.toString()).toBe('localpdf');
  });

  it('lerLaudo faz fallback para Backblaze quando local ausente', async () => {
    const laudoId = Date.now() + 2;
    const meta = {
      arquivo: `laudo-${laudoId}.pdf`,
      hash: 'abc',
      criadoEm: new Date().toISOString(),
      arquivo_remoto: {
        provider: 'backblaze',
        bucket: 'laudos-qwork',
        key: 'laudos/lote-1/remote.pdf',
        url: 'https://s3.test/laudos-qwork/laudos/lote-1/remote.pdf',
      },
    };

    await fs.writeFile(
      path.join(storageDir, `laudo-${laudoId}.json`),
      JSON.stringify(meta, null, 2)
    );

    const buf = await lerLaudo(laudoId);
    expect(buf.toString()).toBe('remotepdf');

    // agora arquivo local foi cacheado
    const local = await fs.readFile(
      path.join(storageDir, `laudo-${laudoId}.pdf`)
    );
    expect(local.toString()).toBe('remotepdf');
  });

  it('laudoExists verifica local e remoto', async () => {
    const laudoId = 999999;
    // nenhum arquivo
    let exists = await laudoExists(laudoId);
    expect(exists).toBe(false);

    const buf = Buffer.from('ok');
    const hash = calcularHash(buf);
    await salvarLaudoLocal(laudoId, buf, hash);

    exists = await laudoExists(laudoId);
    expect(exists).toBe(true);
  });
});
