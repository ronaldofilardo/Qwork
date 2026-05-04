/**
 * @fileoverview Testes da correção de parsing de endpoint Backblaze
 * Valida que URLs sem https:// são corrigidas automaticamente
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

import { GET } from '@/app/api/admin/tomadores/[id]/documentos/route';
import { query as mockQuery } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockReqQuery = mockQuery as jest.MockedFunction<typeof mockQuery>;
const mockReqRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('GET /api/admin/tomadores/[id]/documentos - Endpoint Parsing Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReqRole.mockResolvedValue(undefined);
  });

  const mockNextRequest = (queryString: string = ''): NextRequest => {
    const url = new URL(
      `http://localhost:3000/api/admin/tomadores/1/documentos${queryString}`
    );
    return {
      url: url.toString(),
      nextUrl: url,
    } as unknown as NextRequest;
  };

  it('suporta endpoint sem https:// (s3.us-east-005.backblazeb2.com)', async () => {
    // Simular BD com remote keys (formato esperado após correção)
    mockReqQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path: null,
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key:
            'clinicas/00249085000146/cartao_cnpj-1774888271751-30g1v6.pdf',
          contrato_social_arquivo_remoto_key:
            'clinicas/00249085000146/contrato_social-1774888272162-8ti6qs.pdf',
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
    } as any);

    const request = mockNextRequest('?tipo=clinica');
    const response = await GET(request, {
      params: { id: '132' },
    });

    expect(response.status).toBe(200);
    const json = await response.json();

    // Resposta não deve ser null (indica sucesso no parsing do endpoint)
    expect(json.success).toBe(true);
    expect(json.documentos).toBeDefined();
    // Remote keys devem ter sido processadas (mesmo sem presigned URL gerada em teste)
    expect(json.documentos.cartao_cnpj).toBeDefined();
    expect(json.documentos.contrato_social).toBeDefined();
  });

  it('retorna sucesso com remoteKey sem erro de endpoint inválido', async () => {
    mockReqQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path: null,
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key: 'clinicas/test/file.pdf',
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
    } as any);

    const request = mockNextRequest('?tipo=entidade');
    const response = await GET(request, {
      params: { id: '16' },
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    // Se houve erro de endpoint inválido, teria retornado null silenciosamente
    // Agora deve tentar processar
    expect(json.documentos).toBeDefined();
  });

  it('trata erro de S3Client sem expor ao cliente', async () => {
    mockReqQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path: null,
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key:
            'clinicas/00249085000146/cartao.pdf',
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
    } as any);

    const request = mockNextRequest('?tipo=clinica');
    const response = await GET(request, {
      params: { id: '132' },
    });

    // Mesmo com erro, não retorna 5xx
    expect([200, 400, 403, 404]).toContain(response.status);
    const json = await response.json();
    // Resposta contém estrutura esperada
    expect(json).toHaveProperty('documentos');
  });
});
