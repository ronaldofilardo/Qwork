/**
 * @file __tests__/api/utils/verificar-cpf.test.ts
 *
 * Testes unitários para GET /api/utils/verificar-cpf
 * Cobre: autenticação, validação de CPF, respostas disponível e indisponível
 */

jest.mock('@/lib/session');
jest.mock('@/lib/validators/cpf-unico');
jest.mock('@/lib/cpf-utils');

import { GET } from '@/app/api/utils/verificar-cpf/route';
import { requireRole } from '@/lib/session';
import { checkCpfUnicoSistema } from '@/lib/validators/cpf-unico';
import { validarCPF } from '@/lib/cpf-utils';
import { NextRequest } from 'next/server';

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockCheckCpf = checkCpfUnicoSistema as jest.MockedFunction<typeof checkCpfUnicoSistema>;
const mockValidarCPF = validarCPF as jest.MockedFunction<typeof validarCPF>;

function makeRequest(cpf?: string) {
  const url = `http://localhost/api/utils/verificar-cpf${cpf ? `?cpf=${cpf}` : ''}`;
  return new NextRequest(url);
}

describe('GET /api/utils/verificar-cpf — autenticação', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 401 quando não autenticado', async () => {
    mockRequireRole.mockRejectedValue(new Error('Não autenticado'));
    const res = await GET(makeRequest('83905249022'));
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando sem permissão', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await GET(makeRequest('83905249022'));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/utils/verificar-cpf — validação de input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({} as never);
  });

  it('retorna 400 quando CPF tem menos de 11 dígitos', async () => {
    const res = await GET(makeRequest('123'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/11/);
  });

  it('retorna 400 quando CPF não informado', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it('retorna disponivel=false com motivo quando CPF inválido (dígitos verificadores)', async () => {
    mockValidarCPF.mockReturnValue(false);
    const res = await GET(makeRequest('11111111111'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.disponivel).toBe(false);
    expect(body.motivo).toMatch(/inválido/i);
  });
});

describe('GET /api/utils/verificar-cpf — resultado disponível', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({} as never);
    mockValidarCPF.mockReturnValue(true);
  });

  it('retorna disponivel=true quando CPF não existe no sistema', async () => {
    mockCheckCpf.mockResolvedValue({ disponivel: true, perfil: null, message: null });
    const res = await GET(makeRequest('83905249022'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.disponivel).toBe(true);
    expect(body.motivo).toBeUndefined();
  });
});

describe('GET /api/utils/verificar-cpf — resultado indisponível', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({} as never);
    mockValidarCPF.mockReturnValue(true);
  });

  it('retorna disponivel=false com motivo quando CPF é de representante', async () => {
    mockCheckCpf.mockResolvedValue({
      disponivel: false,
      perfil: 'representante',
      message: 'Este CPF já está cadastrado como representante',
    });
    const res = await GET(makeRequest('83905249022'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.disponivel).toBe(false);
    expect(body.motivo).toMatch(/representante/i);
  });

  it('retorna disponivel=false com motivo quando CPF é de vendedor', async () => {
    mockCheckCpf.mockResolvedValue({
      disponivel: false,
      perfil: 'vendedor',
      message: 'Este CPF já está cadastrado como vendedor no sistema',
    });
    const res = await GET(makeRequest('83905249022'));
    const body = await res.json();
    expect(body.disponivel).toBe(false);
    expect(body.motivo).toMatch(/vendedor/i);
  });
});
