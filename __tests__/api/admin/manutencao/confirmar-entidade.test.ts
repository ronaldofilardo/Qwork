/**
 * @fileoverview Testes da API POST /api/admin/manutencao/entidade/[id]/confirmar
 * @description Testa geração de cobrança de taxa de manutenção para entidades
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
import { POST } from '@/app/api/admin/manutencao/entidade/[id]/confirmar/route';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function makeRequest(id: string) {
  return new NextRequest(
    `http://localhost/api/admin/manutencao/entidade/${id}/confirmar`,
    {
      method: 'POST',
    }
  );
}

describe('POST /api/admin/manutencao/entidade/[id]/confirmar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 sem sessão', async () => {
    mockGetSession.mockReturnValue(null);
    const res = await POST(makeRequest('1'), { params: { id: '1' } });
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para perfil rh', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'RH',
      perfil: 'rh',
    } as any);
    const res = await POST(makeRequest('1'), { params: { id: '1' } });
    expect(res.status).toBe(403);
  });

  it('deve retornar 400 para id inválido', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    const res = await POST(makeRequest('abc'), { params: { id: 'abc' } });
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando entidade não existe', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // entidade not found
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
          id: 1,
          nome: 'Ent A',
          cnpj: '00',
          ativa: true,
          manutencao_ja_cobrada: true,
          limite_primeira_cobranca_manutencao: new Date(
            Date.now() - 86400000
          ).toISOString(),
        },
      ],
      rowCount: 1,
    } as any);
    const res = await POST(makeRequest('1'), { params: { id: '1' } });
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/já foi gerada/);
  });

  it('deve retornar 409 quando já existe laudo emitido', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Ent A',
            cnpj: '00',
            ativa: true,
            manutencao_ja_cobrada: false,
            limite_primeira_cobranca_manutencao: new Date(
              Date.now() - 86400000
            ).toISOString(),
          },
        ],
        rowCount: 1,
      } as any) // entidade exists
      .mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as any); // laudo exists
    const res = await POST(makeRequest('1'), { params: { id: '1' } });
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/laudo emitido/);
  });

  it('deve criar pagamento com sucesso para suporte', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Entidade Teste',
            cnpj: '00',
            ativa: true,
            manutencao_ja_cobrada: false,
            limite_primeira_cobranca_manutencao: new Date(
              Date.now() - 86400000
            ).toISOString(),
          },
        ],
        rowCount: 1,
      } as any) // entidade
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // sem laudo
      .mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any) // insert pagamento
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // update manutencao_ja_cobrada

    const res = await POST(makeRequest('1'), { params: { id: '1' } });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.pagamento_id).toBe(42);
    expect(data.valor).toBe(250);
    expect(data.entidade_nome).toBe('Entidade Teste');
  });

  it('deve retornar 400 quando prazo ainda não venceu', async () => {
    mockGetSession.mockReturnValue({
      cpf: '000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Ent A',
          cnpj: '00',
          ativa: true,
          manutencao_ja_cobrada: false,
          limite_primeira_cobranca_manutencao: new Date(
            Date.now() + 86400000 * 30
          ).toISOString(), // 30 dias no futuro
        },
      ],
      rowCount: 1,
    } as any);
    const res = await POST(makeRequest('1'), { params: { id: '1' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/prazo/i);
  });
});
