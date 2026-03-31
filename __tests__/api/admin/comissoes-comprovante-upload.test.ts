/**
 * @fileoverview Testes da API POST /api/admin/comissoes/[id]/comprovante
 *
 * Cobre:
 *  - 401 não autenticado
 *  - 403 sem permissão (perfil incorreto)
 *  - 400 ID inválido
 *  - 400 sem arquivo enviado
 *  - 400 arquivo excede 5MB
 *  - 400 tipo MIME não aceito
 *  - 404 comissão não encontrada
 *  - 422 status da comissão diferente de 'liberada'
 *  - 201 sucesso — path salvo e auditoria registrada
 */

jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/db/comissionamento');
jest.mock('@/lib/storage/representante-storage');

import { POST } from '@/app/api/admin/comissoes/[id]/comprovante/route';
import { query } from '@/lib/db';
import { registrarAuditoria } from '@/lib/db/comissionamento';
import { requireRole } from '@/lib/session';
import { uploadDocumentoRepresentante } from '@/lib/storage/representante-storage';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockAuditoria = registrarAuditoria as jest.MockedFunction<
  typeof registrarAuditoria
>;
const mockUpload = uploadDocumentoRepresentante as jest.MockedFunction<
  typeof uploadDocumentoRepresentante
>;

// ── Helpers ──────────────────────────────────────────────────────────────────

type FileLike = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => ArrayBuffer;
};

/**
 * Cria um objeto file-like sem usar a API File/FormData do browser.
 * Compatível com o que a rota espera de formData.get('comprovante').
 */
function criarFileLike(
  nome: string,
  tipo: string,
  tamanhoBytes: number
): FileLike {
  return {
    name: nome,
    type: tipo,
    size: tamanhoBytes,
    arrayBuffer: () => new ArrayBuffer(tamanhoBytes),
  };
}

/**
 * Cria um mock de NextRequest com formData() retornando o file-like.
 * Usar este padrão (em vez de NextRequest real) é necessário no ambiente
 * Jest/Node onde request.formData() lança erro para corpos multipart.
 */
function makeReqComArquivo(
  file: FileLike | null,
  id = '1'
): [any, { params: { id: string } }] {
  const fakeFd = {
    get: (key: string) => (key === 'comprovante' ? file : null),
  };
  const req = {
    url: `http://localhost/api/admin/comissoes/${id}/comprovante`,
    method: 'POST',
    formData: () => Promise.resolve(fakeFd),
  };
  return [req, { params: { id } } as any];
}

/** Mock de NextRequest sem o campo 'comprovante' */
function makeReqSemArquivo(id = '1'): [any, { params: { id: string } }] {
  return makeReqComArquivo(null, id);
}

/** Configura mock de comissão encontrada no DB */
function mockComissaoLiberada(extraFields: Record<string, unknown> = {}) {
  mockQuery.mockResolvedValueOnce({
    rows: [
      {
        id: 1,
        status: 'liberada',
        representante_id: 2,
        tipo_pessoa: 'pf',
        cpf: '12345678901',
        cnpj: null,
        representante_nome: 'Ana Rep',
        ...extraFields,
      },
    ],
    rowCount: 1,
  } as any);
}

/** Configura mock do UPDATE RETURNING após upload */
function mockUpdate() {
  mockQuery.mockResolvedValueOnce({
    rows: [
      {
        id: 1,
        status: 'paga',
        data_pagamento: new Date().toISOString(),
        comprovante_pagamento_path:
          'storage/representantes/PF/12345678901/COMP/rpa_123.pdf',
      },
    ],
    rowCount: 1,
  } as any);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('POST /api/admin/comissoes/[id]/comprovante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
    mockAuditoria.mockResolvedValue(undefined as any);
    mockUpload.mockResolvedValue({
      path: 'storage/representantes/PF/12345678901/COMP/rpa_123.pdf',
    });
  });

  // ── Autenticação e autorização ────────────────────────────────────────────

  it('deve retornar 401 para não autenticado', async () => {
    mockRequireRole.mockRejectedValue(new Error('Não autenticado'));
    const [req, ctx] = makeReqSemArquivo();
    const res = await POST(req, ctx);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/autenticado/i);
  });

  it('deve retornar 403 sem permissão', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const [req, ctx] = makeReqSemArquivo();
    const res = await POST(req, ctx);
    expect(res.status).toBe(403);
  });

  // ── Validação de ID ───────────────────────────────────────────────────────

  it('deve retornar 400 para ID inválido', async () => {
    const [req, ctx] = makeReqSemArquivo('xyz');
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/id inválido/i);
  });

  // ── Validação de arquivo ──────────────────────────────────────────────────

  it('deve retornar 400 quando nenhum arquivo é enviado', async () => {
    const [req, ctx] = makeReqSemArquivo();
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/nenhum arquivo/i);
  });

  it('deve retornar 400 quando arquivo excede 5MB', async () => {
    // Arrange: arquivo de 5MB + 1 byte
    const fileGrande = criarFileLike(
      'comprovante.pdf',
      'application/pdf',
      5 * 1024 * 1024 + 1
    );
    const [req, ctx] = makeReqComArquivo(fileGrande);

    // Act
    const res = await POST(req, ctx);

    // Assert
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/excede/i);
  });

  it('deve retornar 400 para tipo MIME não aceito (text/plain)', async () => {
    const fileTxt = criarFileLike('comprovante.txt', 'text/plain', 100);
    const [req, ctx] = makeReqComArquivo(fileTxt);
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/tipo não aceito/i);
  });

  // ── Validação de negócio ──────────────────────────────────────────────────

  it('deve retornar 404 quando comissão não é encontrada', async () => {
    // Arquivo válido — falha será no banco
    const file = criarFileLike('ok.pdf', 'application/pdf', 1000);
    const [req, ctx] = makeReqComArquivo(file);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await POST(req, ctx);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/não encontrada/i);
  });

  it('deve retornar 422 quando comissão não está com status "liberada"', async () => {
    const file = criarFileLike('ok.pdf', 'application/pdf', 1000);
    const [req, ctx] = makeReqComArquivo(file);
    // Comissão com status 'paga' (já paga)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'paga', representante_id: 2 }],
      rowCount: 1,
    } as any);

    const res = await POST(req, ctx);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toMatch(/liberada/i);
    expect(data.error).toMatch(/paga/i);
  });

  it('deve retornar 422 quando comissão está com status "pendente_nf"', async () => {
    const file = criarFileLike('ok.pdf', 'application/pdf', 1000);
    const [req, ctx] = makeReqComArquivo(file);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'pendente_nf', representante_id: 2 }],
      rowCount: 1,
    } as any);

    const res = await POST(req, ctx);
    expect(res.status).toBe(422);
  });

  // ── Sucesso ───────────────────────────────────────────────────────────────

  it('deve marcar como paga e salvar comprovante (PDF — representante PF)', async () => {
    // Arrange
    const file = criarFileLike('comprovante_jan.pdf', 'application/pdf', 1000);
    const [req, ctx] = makeReqComArquivo(file);
    mockComissaoLiberada(); // SELECT comissão
    mockUpdate(); // UPDATE RETURNING

    // Act
    const res = await POST(req, ctx);

    // Assert — status HTTP
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.comprovante_path).toContain('COMP');

    // Assert — upload foi chamado com args corretos
    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(Buffer),
      'rpa',
      '12345678901', // CPF do representante PF
      'application/pdf',
      'pf',
      'COMP'
    );

    // Assert — UPDATE atualizou status para paga
    const updateCall = mockQuery.mock.calls[1]; // 2.ª chamada = UPDATE
    expect(updateCall[0]).toMatch(/status = 'paga'/);
    expect(updateCall[1]).toContain(1); // comissaoId
    expect(updateCall[1]).toContain(
      'storage/representantes/PF/12345678901/COMP/rpa_123.pdf'
    );

    // Assert — auditoria foi registrada
    expect(mockAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        status_anterior: 'liberada',
        status_novo: 'paga',
        criado_por_cpf: '00000000000',
      })
    );
  });

  it('deve usar CNPJ como identificador quando representante é PJ', async () => {
    const file = criarFileLike('nota.pdf', 'application/pdf', 500);
    const [req, ctx] = makeReqComArquivo(file);
    mockComissaoLiberada({
      tipo_pessoa: 'pj',
      cpf: null,
      cnpj: '12345678000190',
    });
    mockUpdate();

    await POST(req, ctx);

    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(Buffer),
      'rpa',
      '12345678000190', // CNPJ
      'application/pdf',
      'pj',
      'COMP'
    );
  });

  it('deve aceitar imagem PNG como comprovante', async () => {
    const file = criarFileLike('print.png', 'image/png', 2000);
    const [req, ctx] = makeReqComArquivo(file);
    mockComissaoLiberada();
    mockUpdate();

    const res = await POST(req, ctx);
    expect(res.status).toBe(201);
    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(Buffer),
      'rpa',
      expect.any(String),
      'image/png',
      'pf',
      'COMP'
    );
  });

  it('deve aceitar imagem JPEG como comprovante', async () => {
    const file = criarFileLike('foto.jpg', 'image/jpeg', 1500);
    const [req, ctx] = makeReqComArquivo(file);
    mockComissaoLiberada();
    mockUpdate();

    const res = await POST(req, ctx);
    expect(res.status).toBe(201);
  });

  it('deve aceitar imagem WEBP como comprovante', async () => {
    const file = criarFileLike('screen.webp', 'image/webp', 800);
    const [req, ctx] = makeReqComArquivo(file);
    mockComissaoLiberada();
    mockUpdate();

    const res = await POST(req, ctx);
    expect(res.status).toBe(201);
  });

  it('deve retornar 500 em erro inesperado do storage', async () => {
    const file = criarFileLike('fail.pdf', 'application/pdf', 100);
    const [req, ctx] = makeReqComArquivo(file);
    mockComissaoLiberada();
    mockUpload.mockRejectedValueOnce(new Error('Storage offline'));

    const res = await POST(req, ctx);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Erro interno');
  });
});
