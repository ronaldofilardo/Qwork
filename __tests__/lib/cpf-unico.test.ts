/**
 * @file __tests__/lib/cpf-unico.test.ts
 *
 * Testes unitários para lib/validators/cpf-unico.ts
 * Cobre: checkCpfUnicoSistema — todas as tabelas e opções de ignore
 */

jest.mock('@/lib/db');

import { query } from '@/lib/db';
import {
  checkCpfUnicoSistema,
  type CpfUnicoResult,
} from '@/lib/validators/cpf-unico';

const mockQuery = query as jest.MockedFunction<typeof query>;

const CPF = '83905249022';

function makeRows<T>(rows: T[]) {
  return { rows, rowCount: rows.length } as ReturnType<typeof query> extends Promise<infer R> ? R : never;
}

// Helper: resolve todas as consultas com 0 resultados (disponível)
function mockDisponivel() {
  mockQuery.mockResolvedValue(makeRows([]));
}

describe('checkCpfUnicoSistema — CPF disponível', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDisponivel();
  });

  it('retorna disponivel=true quando CPF não existe em nenhuma tabela', async () => {
    const result: CpfUnicoResult = await checkCpfUnicoSistema(CPF);
    expect(result.disponivel).toBe(true);
    expect(result.perfil).toBeNull();
    expect(result.message).toBeNull();
  });
});

describe('checkCpfUnicoSistema — CPF em representantes (PF)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna disponivel=false com perfil=representante', async () => {
    // repPfResult tem 1 resultado; os demais 4 retornam vazio
    mockQuery
      .mockResolvedValueOnce(makeRows([{ id: 37 }]))  // representantes.cpf
      .mockResolvedValue(makeRows([]));

    const result = await checkCpfUnicoSistema(CPF);
    expect(result.disponivel).toBe(false);
    expect(result.perfil).toBe('representante');
    expect(result.message).toMatch(/representante/i);
  });
});

describe('checkCpfUnicoSistema — CPF em representantes (PJ responsável)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna disponivel=false com perfil=representante_pj', async () => {
    mockQuery
      .mockResolvedValueOnce(makeRows([]))            // representantes.cpf
      .mockResolvedValueOnce(makeRows([{ id: 37 }])) // representantes.cpf_responsavel_pj
      .mockResolvedValue(makeRows([]));

    const result = await checkCpfUnicoSistema(CPF);
    expect(result.disponivel).toBe(false);
    expect(result.perfil).toBe('representante_pj');
  });
});

describe('checkCpfUnicoSistema — CPF em lead PF ativo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna disponivel=false com perfil=representante_lead', async () => {
    mockQuery
      .mockResolvedValueOnce(makeRows([]))                             // rep.cpf
      .mockResolvedValueOnce(makeRows([]))                             // rep.cpf_responsavel_pj
      .mockResolvedValueOnce(makeRows([{ id: 'uuid-lead-1' }]))       // leads.cpf
      .mockResolvedValue(makeRows([]));

    const result = await checkCpfUnicoSistema(CPF);
    expect(result.disponivel).toBe(false);
    expect(result.perfil).toBe('representante_lead');
  });
});

describe('checkCpfUnicoSistema — CPF em lead PJ (cpf_responsavel)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna disponivel=false com perfil=representante_lead', async () => {
    mockQuery
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([{ id: 'uuid-lead-2' }])) // leads.cpf_responsavel
      .mockResolvedValue(makeRows([]));

    const result = await checkCpfUnicoSistema(CPF);
    expect(result.disponivel).toBe(false);
    expect(result.perfil).toBe('representante_lead');
  });
});

describe('checkCpfUnicoSistema — CPF em usuarios (vendedor)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna disponivel=false com perfil=vendedor', async () => {
    mockQuery
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([{ id: 10, tipo_usuario: 'vendedor' }]));

    const result = await checkCpfUnicoSistema(CPF);
    expect(result.disponivel).toBe(false);
    expect(result.perfil).toBe('vendedor');
    expect(result.message).toMatch(/vendedor/i);
  });
});

describe('checkCpfUnicoSistema — CPF em usuarios (gestor)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna disponivel=false com perfil=gestor', async () => {
    mockQuery
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([{ id: 20, tipo_usuario: 'gestor' }]));

    const result = await checkCpfUnicoSistema(CPF);
    expect(result.disponivel).toBe(false);
    expect(result.perfil).toBe('gestor');
    expect(result.message).toMatch(/gestor/i);
  });
});

describe('checkCpfUnicoSistema — CPF em usuarios (rh)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna disponivel=false com perfil=rh', async () => {
    mockQuery
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([]))
      .mockResolvedValueOnce(makeRows([{ id: 30, tipo_usuario: 'rh' }]));

    const result = await checkCpfUnicoSistema(CPF);
    expect(result.disponivel).toBe(false);
    expect(result.perfil).toBe('rh');
    expect(result.message).toMatch(/gestor rh/i);
  });
});

describe('checkCpfUnicoSistema — opção ignorarRepresentanteId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ignora o representante especificado e retorna disponivel=true', async () => {
    // Sem o ignore, repPjResult teria resultado. Com ignore, query usa $2 e mock retorna []
    mockDisponivel();
    const result = await checkCpfUnicoSistema(CPF, { ignorarRepresentanteId: 37 });
    expect(result.disponivel).toBe(true);
    // Verificar que a query foi chamada com o parâmetro de ignore
    const calls = mockQuery.mock.calls;
    // Queries 1 e 2 (representantes) devem receber [cpf, 37]
    expect(calls[0][1]).toEqual([CPF, 37]);
    expect(calls[1][1]).toEqual([CPF, 37]);
  });
});

describe('checkCpfUnicoSistema — opção ignorarUsuarioId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ignora o usuário especificado e retorna disponivel=true', async () => {
    mockDisponivel();
    const result = await checkCpfUnicoSistema(CPF, { ignorarUsuarioId: 99 });
    expect(result.disponivel).toBe(true);
    // Última query (usuarios) deve receber [cpf, 99]
    const calls = mockQuery.mock.calls;
    expect(calls[4][1]).toEqual([CPF, 99]);
  });
});
