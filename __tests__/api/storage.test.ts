/**
 * @fileoverview Testes da rota /api/storage/[...path]
 * Verifica: autorização de caminho, deteção de MIME type, tratamento de erros
 */

import { GET } from '@/app/api/storage/[...path]/route';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

jest.mock('fs/promises');

const mockNextRequest = (path: string): NextRequest => {
  const url = new URL(`http://localhost:3000/api/storage${path}`);
  return {
    url: url.toString(),
    nextUrl: url,
  } as NextRequest;
};

describe('GET /api/storage/[...path]', () => {
  const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serve arquivo PDF com MIME type correto', async () => {
    const testPath =
      '/api/storage/tomadores/clinicas/12345678000190/cartao_cnpj_123.pdf';
    const testBuffer = Buffer.from('PDF content');

    mockReadFile.mockResolvedValue(testBuffer);

    const request = mockNextRequest(testPath);
    const response = await GET(request, {
      params: {
        path: [
          'tomadores',
          'clinicas',
          '12345678000190',
          'cartao_cnpj_123.pdf',
        ],
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Length')).toBe(
      testBuffer.length.toString()
    );
  });

  it('nega acesso a caminhos fora de tomadores/ ou uploads/', async () => {
    const request = mockNextRequest('/api/storage/etc/passwd');
    const response = await GET(request, {
      params: {
        path: ['etc', 'passwd'],
      },
    });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Acesso não permitido');
  });

  it('retorna 404 quando arquivo não existe', async () => {
    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    );

    const request = mockNextRequest(
      '/api/storage/tomadores/clinicas/00000000000000/documento.pdf'
    );
    const response = await GET(request, {
      params: {
        path: ['tomadores', 'clinicas', '00000000000000', 'documento.pdf'],
      },
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Arquivo não encontrado');
  });

  it('permite acesso a uploads/ para compatibilidade', async () => {
    const testPath = '/api/storage/uploads/some-file.jpg';
    const testBuffer = Buffer.from('Image content');

    mockReadFile.mockResolvedValue(testBuffer);

    const request = mockNextRequest(testPath);
    const response = await GET(request, {
      params: {
        path: ['uploads', 'some-file.jpg'],
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('detecta MIME type PNG corretamente', async () => {
    const testPath =
      '/api/storage/tomadores/clinicas/12345678000190/documento.png';
    const testBuffer = Buffer.from('PNG content');

    mockReadFile.mockResolvedValue(testBuffer);

    const request = mockNextRequest(testPath);
    const response = await GET(request, {
      params: {
        path: ['tomadores', 'clinicas', '12345678000190', 'documento.png'],
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('retorna erro 400 quando path está vazio', async () => {
    const request = mockNextRequest('/api/storage');
    const response = await GET(request, {
      params: {
        path: [],
      },
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Caminho não especificado');
  });

  it('define Cache-Control header com 1 hora', async () => {
    const testPath =
      '/api/storage/tomadores/clinicas/12345678000190/documento.pdf';
    const testBuffer = Buffer.from('PDF');

    mockReadFile.mockResolvedValue(testBuffer);

    const request = mockNextRequest(testPath);
    const response = await GET(request, {
      params: {
        path: ['tomadores', 'clinicas', '12345678000190', 'documento.pdf'],
      },
    });

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });
});
