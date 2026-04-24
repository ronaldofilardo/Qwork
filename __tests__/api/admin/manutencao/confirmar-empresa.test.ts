/**
 * @fileoverview Testes da API POST /api/admin/manutencao/empresa/[id]/confirmar
 * @description Testa geração de cobrança de taxa de manutenção para empresas de clínicas
 */

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/manutencao-taxa', () => ({
  VALOR_TAXA_MANUTENCAO: 250,
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/manutencao/empresa/[id]/confirmar/route';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function makeRequest(id: string) {
  return new NextRequest(
    `http://localhost/api/admin/manutencao/empresa/${id}/confirmar`,
    {
      method: 'POST',
    }
  );
}

describe('POST /api/admin/manutencao/empresa/[id]/confirmar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 sem sessão', async () => {
    mockGetSession.mockReturnValue(null);
    const res = await POST(makeRequest('1'), { params: { id: '1' } });
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para perfil funcionario', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Func',
      perfil: 'funcionario',
    } as any);
    const res = await POST(makeRequest('1'), { params: { id: '1' } });
    expect(res.status).toBe(403);
  });

  it('deve retornar 404 quando empresa não existe', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeRequest('99'), { params: { id: '99' } });
    expect(res.status).toBe(404);
  });

  it('deve retornar 409 quando taxa já cobrada', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          nome: 'Empresa B',
          cnpj: '11',
          clinica_id: 5,
          clinica_nome: 'Clínica X',
          ativa: true,
          manutencao_ja_cobrada: true,
          limite_primeira_cobranca_manutencao: new Date(
            Date.now() - 86400000
          ).toISOString(),
        },
      ],
      rowCount: 1,
    } as any);
    const res = await POST(makeRequest('2'), { params: { id: '2' } });
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/já foi gerada/);
  });

  it('deve criar pagamento com sucesso', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            nome: 'Empresa Teste',
            cnpj: '11',
            clinica_id: 5,
            clinica_nome: 'Clínica Y',
            ativa: true,
            manutencao_ja_cobrada: false,
            limite_primeira_cobranca_manutencao: new Date(
              Date.now() - 86400000
            ).toISOString(),
          },
        ],
        rowCount: 1,
      } as any) // empresa
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // sem laudo
      .mockResolvedValueOnce({ rows: [{ id: 77 }], rowCount: 1 } as any) // insert pagamento
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // update manutencao_ja_cobrada

    const res = await POST(makeRequest('2'), { params: { id: '2' } });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.pagamento_id).toBe(77);
    expect(data.valor).toBe(250);
    expect(data.empresa_nome).toBe('Empresa Teste');
    expect(data.clinica_nome).toBe('Clínica Y');
  });
});
