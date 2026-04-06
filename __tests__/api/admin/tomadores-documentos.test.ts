/**
 * @fileoverview Testes da API GET /api/admin/tomadores/[id]/documentos
 * Cobre: resolução de URL local, URL pública, presigned Backblaze, campos nulos, erros
 */

import { GET } from '@/app/api/admin/tomadores/[id]/documentos/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

// Mock AWS SDK (para paths com remote key)
const mockGetSignedUrl = jest
  .fn()
  .mockResolvedValue('https://presigned.example.com/file.pdf?X-Amz=sig');
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  GetObjectCommand: jest.fn().mockImplementation((args) => args),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

let mockQuery: jest.MockedFunction<(...args: unknown[]) => unknown>;
let mockRequireRole: jest.MockedFunction<(...args: unknown[]) => unknown>;

beforeAll(async () => {
  const db = await import('@/lib/db');
  const session = await import('@/lib/session');
  mockQuery = db.query as jest.MockedFunction<typeof db.query>;
  mockRequireRole = (session as any).requireRole as jest.MockedFunction<
    typeof session.requireRole
  >;
});

const adminSession = {
  cpf: '12345678901',
  nome: 'Admin',
  perfil: 'admin' as const,
};

const makeRequest = (id: string, tipo: string) =>
  new NextRequest(
    `http://localhost/api/admin/tomadores/${id}/documentos?tipo=${tipo}`
  );

const makeParams = (id: string) => ({ params: { id } });

describe('GET /api/admin/tomadores/[id]/documentos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 403 se não for admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

    const res = await GET(makeRequest('1', 'clinica'), makeParams('1'));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  it('retorna 400 se tipo não for clinica ou entidade', async () => {
    mockRequireRole.mockResolvedValue(adminSession);

    const res = await GET(
      new NextRequest(
        'http://localhost/api/admin/tomadores/1/documentos?tipo=invalido'
      ),
      makeParams('1')
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('tipo');
  });

  it('retorna 404 quando tomador não encontrado', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest('999', 'clinica'), makeParams('999'));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain('não encontrado');
  });

  it('retorna null para todos os campos quando paths são nulos', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path: null,
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key: null,
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
      rowCount: 1,
    });

    const res = await GET(makeRequest('1', 'clinica'), makeParams('1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.documentos.cartao_cnpj).toBeNull();
    expect(data.documentos.contrato_social).toBeNull();
    expect(data.documentos.doc_identificacao).toBeNull();
  });

  it('retorna path local (/uploads/) diretamente sem gerar presigned URL', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path:
            '/uploads/cadastros/12345678000190/cartao_cnpj_1234.pdf',
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key: null,
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
      rowCount: 1,
    });

    const res = await GET(makeRequest('1', 'clinica'), makeParams('1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.documentos.cartao_cnpj).toBe(
      '/uploads/cadastros/12345678000190/cartao_cnpj_1234.pdf'
    );
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('retorna URL https pública diretamente quando não há remote key', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path: 'https://cdn.example.com/file.pdf',
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key: null,
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
      rowCount: 1,
    });

    const res = await GET(makeRequest('1', 'entidade'), makeParams('1'));
    const data = await res.json();

    expect(data.documentos.cartao_cnpj).toBe(
      'https://cdn.example.com/file.pdf'
    );
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('extrai key de URL Backblaze direta e gera presigned URL quando arquivo_remoto_key é nulo', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path:
            'https://s3.us-east-005.backblazeb2.com/cad-qwork/clinicas/12345678000190/cartao_cnpj-1234-abc.pdf',
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key: null,
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
      rowCount: 1,
    });

    const res = await GET(makeRequest('1', 'clinica'), makeParams('1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    // Deve gerar presigned URL ao extrair key da URL Backblaze
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    expect(data.documentos.cartao_cnpj).toBe(
      'https://presigned.example.com/file.pdf?X-Amz=sig'
    );
  });

  it('gera presigned URL quando remote key está preenchida', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path:
            'https://s3.backblaze.com/cad-qwork/12345678000190/cartao_cnpj-1234-abc.pdf',
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key:
            '12345678000190/cartao_cnpj-1234-abc.pdf',
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
      rowCount: 1,
    });

    const res = await GET(makeRequest('1', 'clinica'), makeParams('1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    expect(data.documentos.cartao_cnpj).toBe(
      'https://presigned.example.com/file.pdf?X-Amz=sig'
    );
  });

  it('consulta a tabela correta conforme tipo (clinicas vs entidades)', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path: null,
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key: null,
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
      rowCount: 1,
    });

    await GET(makeRequest('5', 'clinica'), makeParams('5'));
    const sqlClinica = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sqlClinica).toContain('from clinicas');

    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path: null,
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key: null,
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
      rowCount: 1,
    });

    await GET(makeRequest('5', 'entidade'), makeParams('5'));
    const sqlEntidade = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sqlEntidade).toContain('from entidades');
  });
});
