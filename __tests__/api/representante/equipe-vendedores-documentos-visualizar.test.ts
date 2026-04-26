/**
 * @jest-environment node
 */

/**
 * @fileoverview Testes da API GET /api/representante/equipe/vendedores/[id]/documentos/visualizar
 *
 * Cobre:
 *  - 401 sessão não autenticada
 *  - 400 ID inválido
 *  - 400 tipo inválido
 *  - 404 vendedor não pertence à equipe
 *  - 404 documento não enviado (doc_path nulo)
 *  - BUG FIX: path com prefixo 'storage/' → deve normalizar e não criar caminho duplo
 *  - BUG FIX: doc_cad_path com múltiplos caminhos separados por ';' → usa primeiro
 *  - 200 arquivo PDF com Content-Type correto
 *  - 200 arquivo JPG com Content-Type correto
 *  - 403 tentativa de path traversal
 *  - 404 ENOENT quando arquivo não existe no filesystem
 */

jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

import { GET } from '@/app/api/representante/equipe/vendedores/[id]/documentos/visualizar/route';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import * as fsPromises from 'fs/promises';
import { NextRequest } from 'next/server';

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
  tipo: string
): [NextRequest, { params: { id: string } }] {
  const url = `http://localhost/api/representante/equipe/vendedores/${id}/documentos/visualizar?tipo=${tipo}`;
  const req = new NextRequest(url, { method: 'GET' });
  // MockNextRequest não tem nextUrl — necessário para request.nextUrl.searchParams.get('tipo')
  (req as any).nextUrl = new URL(url);
  return [req, { params: { id } } as any];
}

function mockVendedorComDoc(docPath: string, tipo: 'cad' | 'nf' = 'cad') {
  const key = tipo === 'cad' ? 'doc_path' : 'doc_path';
  mockQuery.mockResolvedValueOnce({
    rows: [{ [key]: docPath }],
    rowCount: 1,
  } as any);
}

function mockVendedorSemDoc() {
  mockQuery.mockResolvedValueOnce({
    rows: [{ doc_path: null }],
    rowCount: 1,
  } as any);
}

function mockVendedorNaoEncontrado() {
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
}

const PDF_BUFFER = Buffer.from('%PDF-1.4 fake content');
const IMG_BUFFER = Buffer.from('\xFF\xD8\xFF\xE0 fake jpeg');

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('GET /api/representante/equipe/vendedores/[id]/documentos/visualizar', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireRepresentante.mockReturnValue({
      representante_id: 10,
      cpf: '12345678901',
      nome: 'Rep Teste',
    } as any);

    mockRepAuthErrorResponse.mockReturnValue({
      status: 500,
      body: { error: 'Erro interno' },
    } as any);
  });

  // ── Autenticação ──────────────────────────────────────────────────────────

  it('deve retornar 401 quando sessão não está autenticada', async () => {
    // Arrange
    mockRequireRepresentante.mockImplementationOnce(() => {
      throw new Error('Não autenticado');
    });
    mockRepAuthErrorResponse.mockReturnValueOnce({
      status: 401,
      body: { error: 'Não autenticado' },
    } as any);

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(401);
  });

  // ── Validação de parâmetros ───────────────────────────────────────────────

  it('deve retornar 400 para ID não numérico', async () => {
    // Act
    const [req, ctx] = makeReq('abc', 'cad');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/id inválido/i);
  });

  it('deve retornar 400 para tipo inválido', async () => {
    // Act
    const [req, ctx] = makeReq('73', 'invalido');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/tipo inválido/i);
  });

  it('deve retornar 400 quando tipo não é fornecido', async () => {
    // Arrange
    const url =
      'http://localhost/api/representante/equipe/vendedores/73/documentos/visualizar';
    const req = new NextRequest(url, { method: 'GET' });
    (req as any).nextUrl = new URL(url);

    // Act
    const res = await GET(req, { params: { id: '73' } } as any);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/tipo inválido/i);
  });

  // ── Vendedor não encontrado ───────────────────────────────────────────────

  it('deve retornar 404 quando vendedor não pertence à equipe', async () => {
    // Arrange
    mockVendedorNaoEncontrado();

    // Act
    const [req, ctx] = makeReq('999', 'cad');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado/i);
  });

  // ── Documento não enviado ─────────────────────────────────────────────────

  it('deve retornar 404 quando documento não foi enviado (doc_path nulo)', async () => {
    // Arrange
    mockVendedorSemDoc();

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/documento não enviado/i);
  });

  // ── BUG FIX: prefixo storage/ duplicado ──────────────────────────────────

  it('deve normalizar path com prefixo storage/ e não criar caminho duplicado (BUG FIX)', async () => {
    // Arrange
    // uploadLocalVendedor salva com prefixo 'storage/', mas baseDir já é {cwd}/storage
    // Antes do fix: resolve('{cwd}/storage', 'storage/representantes/...') = '{cwd}/storage/storage/...' (ERRADO)
    // Após o fix: strip 'storage/' → resolve('{cwd}/storage', 'representantes/...') = '{cwd}/storage/representantes/...' (CORRETO)
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/CAD/cnh_doc.pdf';
    mockVendedorComDoc(storedPath, 'cad');
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);

    // Caminho passado ao readFile não deve conter prefixo duplicado
    // Normaliza separadores de path (Windows usa \, Unix usa /)
    const calledPath = (mockReadFile.mock.calls[0][0] as string).replace(
      /\\/g,
      '/'
    );
    expect(calledPath).not.toContain('storage/storage');
    expect(calledPath).toContain(
      'representantes/PF/12345678901/vendedores/98765432100/CAD/cnh_doc.pdf'
    );
  });

  // ── BUG FIX: múltiplos paths separados por ';' ────────────────────────────

  it('deve usar apenas o primeiro path quando doc_cad_path contém múltiplos separados por ";" (PJ vendedor)', async () => {
    // Arrange
    // PJ: doc_cad_path armazena 'CNPJ_doc.pdf;CPF_responsavel_doc.pdf'
    const multiPath =
      'storage/representantes/PJ/12345678000190/vendedores/98765432100/CAD/cnpj_doc.pdf;' +
      'storage/representantes/PJ/12345678000190/vendedores/98765432100/CAD/cpf_resp_doc.pdf';
    mockVendedorComDoc(multiPath, 'cad');
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);

    // Deve ter usado o primeiro path (CNPJ doc)
    const calledPath = (mockReadFile.mock.calls[0][0] as string).replace(
      /\\/g,
      '/'
    );
    expect(calledPath).toContain('cnpj_doc.pdf');
    expect(calledPath).not.toContain('cpf_resp_doc.pdf');
    expect(calledPath).not.toContain('storage/storage');
  });

  it('deve aceitar path sem prefixo storage/ (caso legado ou edge case)', async () => {
    // Arrange
    // Path sem prefixo storage/ deve funcionar normalmente
    const pathSemPrefixo =
      'representantes/PF/12345678901/vendedores/98765432100/CAD/doc.pdf';
    mockVendedorComDoc(pathSemPrefixo, 'cad');
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);

    const calledPath = (mockReadFile.mock.calls[0][0] as string).replace(
      /\\/g,
      '/'
    );
    expect(calledPath).toContain(
      'representantes/PF/12345678901/vendedores/98765432100/CAD/doc.pdf'
    );
    expect(calledPath).not.toContain('storage/storage');
  });

  // ── Sucesso: PDF ──────────────────────────────────────────────────────────

  it('deve retornar 200 com Content-Type application/pdf para arquivo PDF', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/CAD/cnh.pdf';
    mockVendedorComDoc(storedPath, 'cad');
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Length')).toBe(
      PDF_BUFFER.length.toString()
    );
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=0');
    expect(res.headers.get('Content-Disposition')).toMatch(/inline/);
  });

  // ── Sucesso: imagem JPG ───────────────────────────────────────────────────

  it('deve retornar 200 com Content-Type image/jpeg para arquivo JPG', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/CAD/cnh.jpg';
    mockVendedorComDoc(storedPath, 'cad');
    mockReadFile.mockResolvedValueOnce(IMG_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });

  // ── Sucesso: tipo nf ──────────────────────────────────────────────────────

  it('deve retornar 200 para tipo nf', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/NF/nota_fiscal.pdf';
    mockVendedorComDoc(storedPath, 'nf');
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('73', 'nf');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);
  });

  // ── Arquivo não encontrado no filesystem ──────────────────────────────────

  it('deve retornar 404 quando arquivo não existe no filesystem (ENOENT)', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/CAD/inexistente.pdf';
    mockVendedorComDoc(storedPath, 'cad');
    const enoentError = Object.assign(new Error('ENOENT: no such file'), {
      code: 'ENOENT',
    });
    mockReadFile.mockRejectedValueOnce(enoentError);

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado no storage/i);
  });

  // ── Path traversal ────────────────────────────────────────────────────────

  it('deve retornar 403 em tentativa de path traversal', async () => {
    // Arrange
    // Path com '..' para escapar do diretório storage
    const traversalPath = '../../../etc/passwd';
    mockVendedorComDoc(traversalPath, 'cad');
    // readFile não deve ser chamado

    // Act
    const [req, ctx] = makeReq('73', 'cad');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toMatch(/acesso não permitido/i);
    expect(mockReadFile).not.toHaveBeenCalled();
  });
});
