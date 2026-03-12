/**
 * @jest-environment node
 */

/**
 * @fileoverview Testes da API GET /api/representante/comissoes/[id]/comprovante
 *
 * Cobre:
 *  - 401 não autenticado
 *  - 400 ID inválido
 *  - 404 comissão de outro representante
 *  - 404 comissão sem comprovante
 *  - 200 streaming local (DEV) — Content-Type e Content-Disposition inline
 *  - 200 download local (DEV) — Content-Disposition: attachment com ?download=1
 *  - 302 redirect para URL remota (PROD Backblaze)
 *  - 302 redirect com ?download=1 — query param de content-disposition
 *  - 404 quando arquivo local não existe no filesystem
 */

jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

import { GET } from '@/app/api/representante/comissoes/[id]/comprovante/route';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import * as fsPromises from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRepresentante = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockRepAuthErrorResponse = repAuthErrorResponse as jest.MockedFunction<
  typeof repAuthErrorResponse
>;
const mockReadFile = fsPromises.readFile as jest.MockedFunction<
  typeof fsPromises.readFile
>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(
  id: string,
  search = ''
): [NextRequest, { params: { id: string } }] {
  const url = `http://localhost/api/representante/comissoes/${id}/comprovante${search}`;
  return [new NextRequest(url, { method: 'GET' }), { params: { id } } as any];
}

/** Configura mock do DB retornando comprovante_pagamento_path */
function mockComissaoComComprovante(path: string) {
  mockQuery.mockResolvedValueOnce({
    rows: [{ comprovante_pagamento_path: path }],
    rowCount: 1,
  } as any);
}

/** Configura mock do DB retornando comissão sem comprovante */
function mockComissaoSemComprovante() {
  mockQuery.mockResolvedValueOnce({
    rows: [{ comprovante_pagamento_path: null }],
    rowCount: 1,
  } as any);
}

/** Configura mock do DB retornando zero linhas (comissão não pertence ao rep) */
function mockComissaoNaoEncontrada() {
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('GET /api/representante/comissoes/[id]/comprovante', () => {
  // O jest.setup.js usa MockNextResponse sem .redirect — adicionamos aqui.
  beforeAll(() => {
    (NextResponse as any).redirect = jest
      .fn()
      .mockImplementation(
        (url: string | URL, init?: number | { status?: number }) => {
          const statusCode =
            typeof init === 'number'
              ? init
              : typeof init === 'object' && init !== null
                ? (init.status ?? 302)
                : 302;
          const location = typeof url === 'string' ? url : url.toString();
          return {
            status: statusCode,
            headers: new Map([['location', location]]),
          };
        }
      );
  });

  afterAll(() => {
    delete (NextResponse as any).redirect;
  });
  beforeEach(() => {
    jest.clearAllMocks();

    // Sessão de representante padrão
    mockRequireRepresentante.mockReturnValue({
      representante_id: 5,
      cpf: '12345678901',
      nome: 'Rep Teste',
    } as any);

    // repAuthErrorResponse padrão: status 500 (erro genérico)
    mockRepAuthErrorResponse.mockReturnValue({
      status: 500,
      body: { error: 'Erro interno' },
    } as any);
  });

  // ── Autenticação ─────────────────────────────────────────────────────────

  it('deve retornar 401 quando não autenticado', async () => {
    mockRequireRepresentante.mockImplementationOnce(() => {
      throw new Error('Não autenticado');
    });
    mockRepAuthErrorResponse.mockReturnValueOnce({
      status: 401,
      body: { error: 'Não autenticado' },
    } as any);
    const [req, ctx] = makeReq('1');
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
  });

  // ── Validação de ID ───────────────────────────────────────────────────────

  it('deve retornar 400 para ID inválido (não numérico)', async () => {
    const [req, ctx] = makeReq('abc');
    const res = await GET(req, ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/id inválido/i);
  });

  // ── Comissão não encontrada ───────────────────────────────────────────────

  it('deve retornar 404 quando comissão pertence a outro representante', async () => {
    mockComissaoNaoEncontrada();
    const [req, ctx] = makeReq('99');
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/não encontrada/i);
  });

  // ── Sem comprovante ───────────────────────────────────────────────────────

  it('deve retornar 404 quando comissão não tem comprovante', async () => {
    mockComissaoSemComprovante();
    const [req, ctx] = makeReq('1');
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/nenhum comprovante/i);
  });

  // ── Redirect (PROD — URL remota) ──────────────────────────────────────────

  it('deve redirecionar para URL Backblaze quando path é remoto', async () => {
    const urlRemota =
      'https://s3.us-east-005.backblazeb2.com/rep-qwork/PF/12345678901/COMP/rpa_123.pdf';
    mockComissaoComComprovante(urlRemota);
    const [req, ctx] = makeReq('1');

    const res = await GET(req, ctx);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toContain('backblazeb2.com');
  });

  it('deve adicionar response-content-disposition ao redirect quando ?download=1', async () => {
    const urlRemota =
      'https://s3.us-east-005.backblazeb2.com/rep-qwork/PF/12345678901/COMP/rpa_123.pdf';
    mockComissaoComComprovante(urlRemota);
    const [req, ctx] = makeReq('1', '?download=1');

    const res = await GET(req, ctx);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('response-content-disposition');
    expect(decodeURIComponent(location ?? '')).toContain('attachment');
  });

  // ── Streaming local (DEV — path no filesystem) ────────────────────────────

  it('deve fazer streaming do arquivo local com Content-Disposition inline', async () => {
    const localPath = 'storage/representantes/PF/12345678901/COMP/rpa_1234.pdf';
    mockComissaoComComprovante(localPath);

    const fakeBuffer = Buffer.from('%PDF-1.4 fake pdf content');
    mockReadFile.mockResolvedValueOnce(fakeBuffer as any);

    const [req, ctx] = makeReq('1');
    const res = await GET(req, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const disposition = res.headers.get('Content-Disposition') ?? '';
    expect(disposition).toContain('inline');
    expect(disposition).toContain('rpa_1234.pdf');
  });

  it('deve retornar Content-Disposition: attachment com ?download=1', async () => {
    const localPath = 'storage/representantes/PF/12345678901/COMP/rpa_5678.pdf';
    mockComissaoComComprovante(localPath);

    const fakeBuffer = Buffer.from('%PDF-1.4 fake pdf content');
    mockReadFile.mockResolvedValueOnce(fakeBuffer as any);

    const [req, ctx] = makeReq('1', '?download=1');
    const res = await GET(req, ctx);

    expect(res.status).toBe(200);
    const disposition = res.headers.get('Content-Disposition') ?? '';
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('rpa_5678.pdf');
  });

  it('deve usar Content-Type correto para PNG', async () => {
    const localPath = 'storage/representantes/PF/12345678901/COMP/print_1.png';
    mockComissaoComComprovante(localPath);

    mockReadFile.mockResolvedValueOnce(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]) as any // magic bytes PNG
    );

    const [req, ctx] = makeReq('1');
    const res = await GET(req, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
  });

  it('deve retornar 404 quando arquivo local não existe no filesystem', async () => {
    const localPath =
      'storage/representantes/PF/12345678901/COMP/inexistente.pdf';
    mockComissaoComComprovante(localPath);

    mockReadFile.mockRejectedValueOnce(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    const [req, ctx] = makeReq('1');
    const res = await GET(req, ctx);

    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/arquivo não encontrado/i);
  });

  it('deve incluir Content-Length no header ao servir arquivo local', async () => {
    const localPath = 'storage/representantes/PF/12345678901/COMP/doc.pdf';
    mockComissaoComComprovante(localPath);

    const fakeBuffer = Buffer.alloc(1024, 0x25);
    mockReadFile.mockResolvedValueOnce(fakeBuffer as any);

    const [req, ctx] = makeReq('1');
    const res = await GET(req, ctx);

    expect(res.headers.get('Content-Length')).toBe('1024');
  });
});
