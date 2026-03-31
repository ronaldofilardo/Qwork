/**
 * @jest-environment node
 */

/**
 * @fileoverview Testes da API GET /api/comercial/representantes/[id]/documentos/visualizar
 *
 * Cobre:
 *  - 401/403 não autorizado (perfil inválido)
 *  - 400 ID inválido
 *  - 400 tipo inválido
 *  - tipo=identificacao: 404 representante não encontrado, 404 doc nulo, 200 OK
 *  - tipo=vendedor_cad: 400 sem vendedor_id, 404 vendedor não encontrado, 200 OK
 *  - tipo=vendedor_nf_rpa: 200 OK
 *  - BUG FIX: path com prefixo 'storage/' → normaliza e não cria caminho duplo
 *  - BUG FIX: doc_cad_path com múltiplos caminhos separados por ';' → usa primeiro
 *  - 200 PDF com Content-Type correto
 *  - 200 imagem PNG com Content-Type correto
 *  - 403 tentativa de path traversal
 *  - 404 ENOENT quando arquivo não existe no filesystem
 */

jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

import { GET } from '@/app/api/comercial/representantes/[id]/documentos/visualizar/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import * as fsPromises from 'fs/promises';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockReadFile = fsPromises.readFile as jest.MockedFunction<
  typeof fsPromises.readFile
>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(
  repId: string,
  tipo: string,
  vendedorId?: string
): [NextRequest, { params: { id: string } }] {
  let url = `http://localhost/api/comercial/representantes/${repId}/documentos/visualizar?tipo=${tipo}`;
  if (vendedorId) url += `&vendedor_id=${vendedorId}`;
  const req = new NextRequest(url, { method: 'GET' });
  // MockNextRequest não tem nextUrl — necessário para request.nextUrl.searchParams.get('tipo')
  (req as any).nextUrl = new URL(url);
  return [req, { params: { id: repId } } as any];
}

function mockRepresentanteComDoc(docPath: string) {
  mockQuery.mockResolvedValueOnce({
    rows: [{ doc_identificacao_path: docPath }],
    rowCount: 1,
  } as any);
}

function mockRepresentanteSemDoc() {
  mockQuery.mockResolvedValueOnce({
    rows: [{ doc_identificacao_path: null }],
    rowCount: 1,
  } as any);
}

function mockRepresentanteNaoEncontrado() {
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
}

function mockVendedorComDoc(docPath: string) {
  mockQuery.mockResolvedValueOnce({
    rows: [{ doc_path: docPath }],
    rowCount: 1,
  } as any);
}

function mockVendedorNaoEncontrado() {
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
}

const comercialSession = {
  cpf: '11122233344',
  nome: 'Comercial Teste',
  perfil: 'comercial' as const,
};

const PDF_BUFFER = Buffer.from('%PDF-1.4 fake content');
const PNG_BUFFER = Buffer.from('\x89PNG\r\n fake png');

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('GET /api/comercial/representantes/[id]/documentos/visualizar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(comercialSession as any);
  });

  // ── Autenticação / autorização ────────────────────────────────────────────

  it('deve retornar 500 quando usuário não está autorizado', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act
    const [req, ctx] = makeReq('1', 'identificacao');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(500);
  });

  // ── Validação de parâmetros ───────────────────────────────────────────────

  it('deve retornar 400 para ID de representante inválido', async () => {
    // Act
    const [req, ctx] = makeReq('xyz', 'identificacao');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/id inválido/i);
  });

  it('deve retornar 400 para tipo inválido', async () => {
    // Act
    const [req, ctx] = makeReq('5', 'outro_tipo');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/tipo inválido/i);
  });

  // ── tipo=identificacao ────────────────────────────────────────────────────

  it('deve retornar 404 quando representante não encontrado (tipo=identificacao)', async () => {
    // Arrange
    mockRepresentanteNaoEncontrado();

    // Act
    const [req, ctx] = makeReq('999', 'identificacao');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('deve retornar 404 quando documento de identificação não foi enviado', async () => {
    // Arrange
    mockRepresentanteSemDoc();

    // Act
    const [req, ctx] = makeReq('5', 'identificacao');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/documento não enviado/i);
  });

  it('deve retornar 200 para tipo=identificacao com doc_path válido', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/IDENT/cnh.pdf';
    mockRepresentanteComDoc(storedPath);
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('5', 'identificacao');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });

  // ── tipo=vendedor_cad ─────────────────────────────────────────────────────

  it('deve retornar 400 quando vendedor_id não é fornecido (tipo=vendedor_cad)', async () => {
    // Act
    const [req, ctx] = makeReq('5', 'vendedor_cad'); // sem vendedor_id
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/vendedor_id/i);
  });

  it('deve retornar 404 quando vendedor não está vinculado ao representante', async () => {
    // Arrange
    mockVendedorNaoEncontrado();

    // Act
    const [req, ctx] = makeReq('5', 'vendedor_cad', '999');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('deve retornar 200 para tipo=vendedor_cad com doc_path válido', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/CAD/cnh.pdf';
    mockVendedorComDoc(storedPath);
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('5', 'vendedor_cad', '73');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);
  });

  it('deve retornar 200 para tipo=vendedor_nf_rpa com doc_path válido', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/NF/nota.pdf';
    mockVendedorComDoc(storedPath);
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('5', 'vendedor_nf_rpa', '73');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);
  });

  // ── BUG FIX: prefixo storage/ duplicado ──────────────────────────────────

  it('deve normalizar path com prefixo storage/ e não criar caminho duplicado (BUG FIX)', async () => {
    // Arrange
    // uploadLocal salva com prefixo 'storage/', mas baseDir já é {cwd}/storage
    // Antes do fix: resolve('{cwd}/storage', 'storage/representantes/...') = '{cwd}/storage/storage/...' (ERRADO)
    // Após o fix: strip 'storage/' → resolve('{cwd}/storage', 'representantes/...') = '{cwd}/storage/representantes/...' (CORRETO)
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/CAD/cnpj.pdf';
    mockVendedorComDoc(storedPath);
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('5', 'vendedor_cad', '73');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);

    // Caminho passado ao readFile não deve conter prefixo duplicado
    // Normaliza separadores de path (Windows usa \, Unix usa /)
    const calledPath = (mockReadFile.mock.calls[0][0] as string).replace(/\\/g, '/');
    expect(calledPath).not.toContain('storage/storage');
    expect(calledPath).toContain(
      'representantes/PF/12345678901/vendedores/98765432100/CAD/cnpj.pdf'
    );
  });

  // ── BUG FIX: múltiplos paths separados por ';' ────────────────────────────

  it('deve usar apenas o primeiro path quando doc_path contém múltiplos separados por ";" (PJ vendedor)', async () => {
    // Arrange
    // PJ: doc_cad_path armazena 'CNPJ_doc.pdf;CPF_responsavel_doc.pdf'
    const multiPath =
      'storage/representantes/PJ/12345678000190/vendedores/98765432100/CAD/cnpj_doc.pdf;' +
      'storage/representantes/PJ/12345678000190/vendedores/98765432100/CAD/cpf_resp_doc.pdf';
    mockVendedorComDoc(multiPath);
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('5', 'vendedor_cad', '73');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);

    const calledPath = (mockReadFile.mock.calls[0][0] as string).replace(/\\/g, '/');
    expect(calledPath).toContain('cnpj_doc.pdf');
    expect(calledPath).not.toContain('cpf_resp_doc.pdf');
    expect(calledPath).not.toContain('storage/storage');
  });

  it('deve aceitar path sem prefixo storage/ (caso legado)', async () => {
    // Arrange
    const pathSemPrefixo =
      'representantes/PF/12345678901/vendedores/98765432100/CAD/doc.pdf';
    mockVendedorComDoc(pathSemPrefixo);
    mockReadFile.mockResolvedValueOnce(PDF_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('5', 'vendedor_cad', '73');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);

    const calledPath = (mockReadFile.mock.calls[0][0] as string).replace(/\\/g, '/');
    expect(calledPath).toContain(
      'representantes/PF/12345678901/vendedores/98765432100/CAD/doc.pdf'
    );
    expect(calledPath).not.toContain('storage/storage');
  });

  // ── Sucesso: PNG ──────────────────────────────────────────────────────────

  it('deve retornar 200 com Content-Type image/png para arquivo PNG', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/IDENT/cnh.png';
    mockRepresentanteComDoc(storedPath);
    mockReadFile.mockResolvedValueOnce(PNG_BUFFER as any);

    // Act
    const [req, ctx] = makeReq('5', 'identificacao');
    const res = await GET(req, ctx);

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=0');
    expect(res.headers.get('Content-Disposition')).toMatch(/inline/);
  });

  // ── Arquivo não encontrado no filesystem ──────────────────────────────────

  it('deve retornar 404 quando arquivo não existe no filesystem (ENOENT)', async () => {
    // Arrange
    const storedPath =
      'storage/representantes/PF/12345678901/vendedores/98765432100/CAD/inexistente.pdf';
    mockVendedorComDoc(storedPath);
    const enoentError = Object.assign(new Error('ENOENT: no such file'), {
      code: 'ENOENT',
    });
    mockReadFile.mockRejectedValueOnce(enoentError);

    // Act
    const [req, ctx] = makeReq('5', 'vendedor_cad', '73');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado no storage/i);
  });

  // ── Path traversal ────────────────────────────────────────────────────────

  it('deve retornar 403 em tentativa de path traversal', async () => {
    // Arrange
    const traversalPath = '../../../etc/passwd';
    mockVendedorComDoc(traversalPath);

    // Act
    const [req, ctx] = makeReq('5', 'vendedor_cad', '73');
    const res = await GET(req, ctx);
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toMatch(/acesso não permitido/i);
    expect(mockReadFile).not.toHaveBeenCalled();
  });
});
