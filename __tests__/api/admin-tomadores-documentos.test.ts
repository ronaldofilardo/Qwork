/**
 * @fileoverview Testes da rota /api/admin/tomadores/[id]/documentos
 * Verifica: transformação de paths storage/, presigned URLs, tratamento de erros
 */

import { NextRequest } from 'next/server';

// Mock da query
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Mock da autenticação
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

// Mock do AWS SDK - iremos mockar na função specific
jest.mock('@aws-sdk/client-s3', () => ({}), { virtual: true });
jest.mock('@aws-sdk/s3-request-presigner', () => ({}), { virtual: true });

import { GET } from '@/app/api/admin/tomadores/[id]/documentos/route';
import { query as mockQuery } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockReqQuery = mockQuery as jest.MockedFunction<typeof mockQuery>;
const mockReqRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('GET /api/admin/tomadores/[id]/documentos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReqRole.mockResolvedValue(undefined); // Autoriza por padrão
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

  it('transforma paths storage/ em URLs de /api/storage/', async () => {
    mockReqQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path:
            'storage/tomadores/entidades/51790945000195/cartao_cnpj_1772823362843.pdf',
          contrato_social_path:
            'storage/tomadores/entidades/51790945000195/contrato_social_1772823362847.pdf',
          doc_identificacao_path:
            'storage/tomadores/entidades/51790945000195/doc_identificacao_1772823362849.pdf',
          cartao_cnpj_arquivo_remoto_key: null,
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
    expect(json.documentos.cartao_cnpj).toBe(
      '/api/storage/tomadores/entidades/51790945000195/cartao_cnpj_1772823362843.pdf'
    );
    expect(json.documentos.contrato_social).toBe(
      '/api/storage/tomadores/entidades/51790945000195/contrato_social_1772823362847.pdf'
    );
    expect(json.documentos.doc_identificacao).toBe(
      '/api/storage/tomadores/entidades/51790945000195/doc_identificacao_1772823362849.pdf'
    );
  });

  it('retorna null para documentos nulos', async () => {
    mockReqQuery.mockResolvedValue({
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
    } as any);

    const request = mockNextRequest('?tipo=clinica');
    const response = await GET(request, {
      params: { id: '1' },
    });

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.documentos.cartao_cnpj).toBeNull();
    expect(json.documentos.contrato_social).toBeNull();
    expect(json.documentos.doc_identificacao).toBeNull();
  });

  it('retorna URLs HTTPS sem modificação', async () => {
    mockReqQuery.mockResolvedValue({
      rows: [
        {
          cartao_cnpj_path: 'https://s3.example.com/cartao.pdf',
          contrato_social_path: null,
          doc_identificacao_path: null,
          cartao_cnpj_arquivo_remoto_key: null,
          contrato_social_arquivo_remoto_key: null,
          doc_identificacao_arquivo_remoto_key: null,
        },
      ],
    } as any);

    const request = mockNextRequest('?tipo=clinica');
    const response = await GET(request, {
      params: { id: '1' },
    });

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.documentos.cartao_cnpj).toBe(
      'https://s3.example.com/cartao.pdf'
    );
  });

  it('retorna erro 400 quando tipo está faltando', async () => {
    const request = mockNextRequest(''); // sem ?tipo=
    const response = await GET(request, {
      params: { id: '1' },
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('tipo');
  });

  it('retorna 404 quando tomador não existe', async () => {
    mockReqQuery.mockResolvedValue({ rows: [] });

    const request = mockNextRequest('?tipo=clinica');
    const response = await GET(request, {
      params: { id: '999' },
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Tomador não encontrado');
  });

  it('retorna erro 403 quando usuário sem permissão', async () => {
    mockReqRole.mockRejectedValue(new Error('Sem permissão'));

    const request = mockNextRequest('?tipo=clinica');
    const response = await GET(request, {
      params: { id: '1' },
    });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Acesso negado');
  });
});
