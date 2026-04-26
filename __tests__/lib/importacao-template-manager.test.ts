/**
 * Testes unitários para TemplateManager.
 * Cobre: updateTemplateNivelCargo (fire-and-forget via fetch), ImportTemplate type.
 *
 * As funções de localStorage foram removidas — templates agora são armazenados
 * no banco de dados via API (/api/{rh|entidade}/importacao/templates).
 */

import {
  updateTemplateNivelCargo,
  type ImportTemplate,
} from '@/components/importacao/TemplateManager';

const RH_API = '/api/rh/importacao/templates';
const ENT_API = '/api/entidade/importacao/templates';

// ====================================================================
// Mock global do fetch
// ====================================================================
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
beforeEach(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));
});
afterEach(() => {
  jest.clearAllMocks();
});

// ====================================================================
// ImportTemplate — garantia de tipagem
// ====================================================================
describe('ImportTemplate interface', () => {
  it('aceita template com todos os campos', () => {
    const t: ImportTemplate = {
      id: '1',
      nome: 'Modelo Principal',
      criadoEm: '01/01/2026',
      mapeamentos: [
        { nomeOriginal: 'CPF', campoQWork: 'cpf' },
        { nomeOriginal: 'Nome', campoQWork: 'nome' },
      ],
      nivelCargoMap: { Médico: 'gestao' },
    };
    expect(t.id).toBe('1');
    expect(t.mapeamentos).toHaveLength(2);
  });

  it('aceita template sem nivelCargoMap (opcional)', () => {
    const t: ImportTemplate = {
      id: '2',
      nome: 'Simples',
      criadoEm: '02/01/2026',
      mapeamentos: [{ nomeOriginal: 'CPF', campoQWork: 'cpf' }],
    };
    expect(t.nivelCargoMap).toBeUndefined();
  });
});

// ====================================================================
// updateTemplateNivelCargo — fire-and-forget via fetch PATCH
// ====================================================================
describe('updateTemplateNivelCargo', () => {
  it('chama PATCH na URL correta com apiBase RH', () => {
    updateTemplateNivelCargo(RH_API, '42', { Médico: 'gestao' });
    expect(mockFetch).toHaveBeenCalledWith(
      `${RH_API}/42`,
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivelCargoMap: { Médico: 'gestao' } }),
      })
    );
  });

  it('chama PATCH na URL correta com apiBase Entidade', () => {
    updateTemplateNivelCargo(ENT_API, '99', { Enfermeiro: 'operacional' });
    expect(mockFetch).toHaveBeenCalledWith(
      `${ENT_API}/99`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ nivelCargoMap: { Enfermeiro: 'operacional' } }),
      })
    );
  });

  it('não lança exceção quando fetch rejeita (fire-and-forget)', () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    expect(() =>
      updateTemplateNivelCargo(RH_API, '5', { Cargo: 'gestao' })
    ).not.toThrow();
  });

  it('envia múltiplas chaves de nivelCargoMap corretamente', () => {
    const map = {
      Médico: 'gestao',
      Enfermeiro: 'operacional',
      Técnico: 'operacional',
    };
    updateTemplateNivelCargo(RH_API, '7', map);
    const call = mockFetch.mock.calls[0];
    const bodyParsed = JSON.parse((call[1] as RequestInit).body as string) as {
      nivelCargoMap: Record<string, string>;
    };
    expect(bodyParsed.nivelCargoMap).toEqual(map);
  });
});
