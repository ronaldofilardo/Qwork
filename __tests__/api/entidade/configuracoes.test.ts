/**
 * @file __tests__/api/entidade/configuracoes.test.ts
 * Testes: GET/PUT /api/entidade/configuracoes — Gerenciamento de config de entidade
 */

// ---- Mocks ----

const mockRequireEntity = jest.fn();
jest.mock('@/lib/session', () => ({
  requireEntity: () => mockRequireEntity(),
}));

const mockBuscarPorEntidade = jest.fn();
const mockSalvar = jest.fn();
const mockValidarCor = jest.fn();
jest.mock('@/lib/entidade-configuracao-service', () => ({
  EntidadeConfiguracaoService: {
    buscarPorEntidade: (...args: unknown[]) => mockBuscarPorEntidade(...args),
    salvar: (...args: unknown[]) => mockSalvar(...args),
    validarCor: (cor: string) => mockValidarCor(cor),
  },
}));

jest.spyOn(console, 'error').mockImplementation(() => {});

import { GET, PUT } from '@/app/api/entidade/configuracoes/route';

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/entidade/configuracoes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/entidade/configuracoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 403 quando não é gestor', async () => {
    mockRequireEntity.mockRejectedValueOnce(
      new Error('Acesso restrito a gestores de entidade')
    );

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('deve retornar config padrão quando entidade não tem configuração salva', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      cpf: '222',
      nome: 'G',
      perfil: 'gestor',
      entidade_id: 22,
    });
    mockBuscarPorEntidade.mockResolvedValueOnce(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.entidade_id).toBe(22);
    expect(body.logo_url).toBeNull();
    expect(body.cor_primaria).toBe('#FF6B00');
    expect(body.cor_secundaria).toBe('#0066CC');
  });

  it('deve retornar config salva quando existe', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      cpf: '222',
      nome: 'G',
      perfil: 'gestor',
      entidade_id: 22,
    });
    mockBuscarPorEntidade.mockResolvedValueOnce({
      entidade_id: 22,
      logo_url: 'data:image/png;base64,abc',
      cor_primaria: '#112233',
      cor_secundaria: '#445566',
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.logo_url).toBe('data:image/png;base64,abc');
    expect(body.cor_primaria).toBe('#112233');
  });
});

describe('PUT /api/entidade/configuracoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidarCor.mockReturnValue(true);
  });

  it('deve retornar 403 quando não é gestor', async () => {
    mockRequireEntity.mockRejectedValueOnce(
      new Error('Acesso restrito a gestores de entidade')
    );

    const res = await PUT(makeRequest({ cor_primaria: '#FF0000' }));
    expect(res.status).toBe(403);
  });

  it('deve retornar 400 para cor primária inválida', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      cpf: '222',
      nome: 'G',
      perfil: 'gestor',
      entidade_id: 22,
    });
    mockValidarCor.mockReturnValue(false);

    const res = await PUT(makeRequest({ cor_primaria: 'nao-e-cor' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/cor primária inválida/i);
  });

  it('deve retornar 400 para cor secundária inválida', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      cpf: '222',
      nome: 'G',
      perfil: 'gestor',
      entidade_id: 22,
    });
    mockValidarCor
      .mockReturnValueOnce(true) // cor_primaria ok (ou não enviada)
      .mockReturnValueOnce(false); // cor_secundaria inválida

    const res = await PUT(
      makeRequest({ cor_primaria: '#FF0000', cor_secundaria: 'xyz' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/cor secundária inválida/i);
  });

  it('deve salvar configurações com sucesso', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      cpf: '222',
      nome: 'G',
      perfil: 'gestor',
      entidade_id: 22,
    });
    const configSalva = {
      entidade_id: 22,
      cor_primaria: '#FF0000',
      cor_secundaria: '#00FF00',
    };
    mockSalvar.mockResolvedValueOnce(configSalva);

    const res = await PUT(
      makeRequest({ cor_primaria: '#FF0000', cor_secundaria: '#00FF00' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cor_primaria).toBe('#FF0000');
    expect(mockSalvar).toHaveBeenCalledWith(22, expect.any(Object), '222');
  });
});
