/**
 * @file __tests__/lib/laudo-storage.test.ts
 * Testes: Laudo Storage
 */

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
  uploadToBackblaze: jest.fn().mockResolvedValue({
    provider: 'backblaze',
    bucket: 'laudos-qwork',
    key: 'laudos/lote-1/remote.pdf',
    url: 'https://s3.test/laudos-qwork/laudos/lote-1/remote.pdf',
  }),
}));

const storageDir = path.join(process.cwd(), 'storage', 'laudos');

// IDs criados nesta suíte — limpeza cirúrgica no afterAll (nunca destruir o diretório inteiro)
const createdTestIds = new Set<number>();
// ID estático usado em um dos testes
const STATIC_TEST_ID = 999999;

describe('Laudo Storage', () => {
  beforeAll(async () => {
    // Garantir que o diretório existe
    await fs.mkdir(storageDir, { recursive: true });
    // Limpar apenas o arquivo de ID estático para garantir estado inicial limpo
    await fs
      .rm(path.join(storageDir, `laudo-${STATIC_TEST_ID}.pdf`), { force: true })
      .catch(() => {});
    await fs
      .rm(path.join(storageDir, `laudo-${STATIC_TEST_ID}.json`), {
        force: true,
      })
      .catch(() => {});
  });

  beforeEach(async () => {
    // Apenas garantir que o diretório existe — NUNCA destruir storage/laudos inteiro
    await fs.mkdir(storageDir, { recursive: true });
  });

  afterAll(async () => {
    // Limpeza cirúrgica: apenas arquivos criados nesta suíte de teste
    for (const id of createdTestIds) {
      await fs
        .rm(path.join(storageDir, `laudo-${id}.pdf`), { force: true })
        .catch(() => {});
      await fs
        .rm(path.join(storageDir, `laudo-${id}.json`), { force: true })
        .catch(() => {});
      await fs
        .rm(path.join(storageDir, `laudo-${id}.pdf.tmp`), { force: true })
        .catch(() => {});
    }
    await fs
      .rm(path.join(storageDir, `laudo-${STATIC_TEST_ID}.pdf`), { force: true })
      .catch(() => {});
    await fs
      .rm(path.join(storageDir, `laudo-${STATIC_TEST_ID}.json`), {
        force: true,
      })
      .catch(() => {});
  });

  it('salvarLaudoLocal salva arquivo e metadados', async () => {
    const laudoId = Date.now();
    createdTestIds.add(laudoId);
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
    createdTestIds.add(laudoId);
    await fs.writeFile(
      path.join(storageDir, `laudo-${laudoId}.pdf`),
      'localpdf'
    );
    const buf = await lerLaudo(laudoId);
    expect(buf.toString()).toBe('localpdf');
  });

  it('lerLaudo faz fallback para Backblaze quando local ausente', async () => {
    const laudoId = Date.now() + 2;
    createdTestIds.add(laudoId);
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
    const laudoId = STATIC_TEST_ID;
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
