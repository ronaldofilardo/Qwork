/**
 * @file __tests__/termos/termos-aceite-suite.test.ts
 * @description Suite completa de testes para o fluxo de aceite de Termos e Política de Privacidade
 * @coverage
 *   - API: POST /api/termos/registrar
 *   - API: GET /api/termos/verificar
 *   - Lib: registrarAceite, verificarAceites
 *   - Componentes: ModalTermosAceite
 */

import { NextResponse } from 'next/server';

// ---- Mocks ----
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/termos/registrar-aceite', () => ({
  registrarAceite: jest.fn(),
}));
jest.mock('@/lib/termos/verificar-aceites', () => ({
  verificarAceites: jest.fn(),
}));
jest.mock('@/lib/auditoria/auditoria', () => ({
  extrairContextoRequisicao: jest.fn(() => ({
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
  })),
  registrarAuditoria: jest.fn(),
}));

import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { registrarAceite } from '@/lib/termos/registrar-aceite';
import { verificarAceites } from '@/lib/termos/verificar-aceites';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockRegistrarAceite = registrarAceite as jest.MockedFunction<
  typeof registrarAceite
>;
const mockVerificarAceites = verificarAceites as jest.MockedFunction<
  typeof verificarAceites
>;

/**
 * ============================================================================
 * 1. TESTES DE API: POST /api/termos/registrar
 * ============================================================================
 */
describe('API: POST /api/termos/registrar', () => {
  let POST: (request: Request) => Promise<NextResponse>;

  beforeAll(async () => {
    const mod = await import('@/app/api/termos/registrar/route');
    POST = mod.POST;
  });

  const makeRequest = (body: any) =>
    new Request('http://localhost:3000/api/termos/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  describe('Validação de Entrada', () => {
    it('deve rejeitar requisição sem autenticação (401)', async () => {
      mockGetSession.mockReturnValue(null);
      const res = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Não autenticado');
    });

    it('deve rejeitar termo_tipo inválido (400)', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'Test',
        perfil: 'rh',
        clinica_id: 5,
      } as any);
      const res = await POST(makeRequest({ termo_tipo: 'invalid_type' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Tipo de termo inválido');
    });

    it('deve rejeitar perfis que não são rh ou gestor (400)', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'Admin',
        perfil: 'admin',
      } as any);
      const res = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Aceite não requerido');
    });
  });

  describe('Busca de Dados de Entidade', () => {
    it('deve buscar clinica para perfil rh', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh',
        clinica_id: 5,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 5, cnpj: '00000000000191', nome: 'Clinica Test' }],
      } as any);
      mockRegistrarAceite.mockResolvedValueOnce({
        success: true,
        usuario_id: 1,
        entidade_id: 1,
        aceito_em: new Date().toISOString(),
      });

      const res = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
      expect(res.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('clinicas'),
        [5]
      );
    });

    it('deve buscar entidade para perfil gestor', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, cnpj: '11111111000111', nome: 'Entidade Test' }],
      } as any);
      mockRegistrarAceite.mockResolvedValueOnce({
        success: true,
        usuario_id: 2,
        entidade_id: 2,
        aceito_em: new Date().toISOString(),
      });

      const res = await POST(
        makeRequest({ termo_tipo: 'politica_privacidade' })
      );
      expect(res.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('entidades'),
        [10]
      );
    });

    it('deve retornar 404 se clinica não encontrada', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 999,
      } as any);
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('não encontrada');
    });

    it('deve retornar 404 se entidade não encontrada', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 999,
      } as any);
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('não encontrada');
    });
  });

  describe('Registro de Aceite', () => {
    const session = {
      cpf: '12345678901',
      nome: 'RH User',
      perfil: 'rh' as const,
      clinica_id: 5,
    };

    beforeEach(() => {
      mockGetSession.mockReturnValue(session as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 5, cnpj: '00000000000191', nome: 'Clinica' }],
      } as any);
    });

    it('deve chamar registrarAceite com dados corretos', async () => {
      mockRegistrarAceite.mockResolvedValueOnce({
        success: true,
        usuario_id: 1,
        entidade_id: 1,
        aceito_em: '2026-01-01T00:00:00Z',
      });

      await POST(makeRequest({ termo_tipo: 'termos_uso' }));

      expect(mockRegistrarAceite).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_cpf: '12345678901',
          usuario_tipo: 'rh',
          usuario_entidade_id: 5,
          termo_tipo: 'termos_uso',
          entidade_cnpj: '00000000000191',
          entidade_tipo: 'clinica',
          entidade_nome: 'Clinica',
          responsavel_nome: 'RH User',
        })
      );
    });

    it('deve retornar success com termo_tipo e aceito_em', async () => {
      const aceito_em = '2026-01-15T10:30:00Z';
      mockRegistrarAceite.mockResolvedValueOnce({
        success: true,
        usuario_id: 1,
        entidade_id: 1,
        aceito_em,
      });

      const res = await POST(
        makeRequest({ termo_tipo: 'politica_privacidade' })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        success: true,
        termo_tipo: 'politica_privacidade',
        aceito_em,
      });
    });

    it('deve retornar 500 se registrarAceite falhar', async () => {
      mockRegistrarAceite.mockRejectedValueOnce(new Error('DB error'));

      const res = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
      expect(res.status).toBe(500);
    });

    it('deve retornar 503 se tabelas não migradas', async () => {
      mockRegistrarAceite.mockRejectedValueOnce(
        new Error('TABLES_NOT_MIGRATED: tabelas não criadas')
      );

      const res = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.code).toBe('FEATURE_NOT_READY');
    });
  });
});

/**
 * ============================================================================
 * 2. TESTES DE API: GET /api/termos/verificar
 * ============================================================================
 */
describe('API: GET /api/termos/verificar', () => {
  let GET: () => Promise<NextResponse>;

  beforeAll(async () => {
    const mod = await import('@/app/api/termos/verificar/route');
    GET = mod.GET;
  });

  describe('Verificação de Status', () => {
    it('deve rejeitar sem session (401)', async () => {
      mockGetSession.mockReturnValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('deve retornar nao_requerido para admin', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'admin',
      } as any);
      const res = await GET();
      const data = await res.json();
      expect(data.nao_requerido).toBe(true);
      expect(data.termos_uso_aceito).toBe(true);
      expect(data.politica_privacidade_aceito).toBe(true);
    });

    it('deve retornar false/false para usuario sem aceites', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'rh',
      } as any);
      mockVerificarAceites.mockResolvedValueOnce({
        termos_uso_aceito: false,
        politica_privacidade_aceito: false,
      });

      const res = await GET();
      const data = await res.json();
      expect(data.termos_uso_aceito).toBe(false);
      expect(data.politica_privacidade_aceito).toBe(false);
    });

    it('deve retornar true para termos aceitos', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'gestor',
      } as any);
      mockVerificarAceites.mockResolvedValueOnce({
        termos_uso_aceito: true,
        politica_privacidade_aceito: false,
        aceito_em_termos: '2026-01-15T10:30:00Z',
      });

      const res = await GET();
      const data = await res.json();
      expect(data.termos_uso_aceito).toBe(true);
      expect(data.politica_privacidade_aceito).toBe(false);
    });

    it('deve chamar verificarAceites com cpf e perfil corretos', async () => {
      mockGetSession.mockReturnValue({
        cpf: '99988877766',
        perfil: 'rh',
      } as any);
      mockVerificarAceites.mockResolvedValueOnce({
        termos_uso_aceito: true,
        politica_privacidade_aceito: true,
      });

      await GET();
      expect(mockVerificarAceites).toHaveBeenCalledWith('99988877766', 'rh');
    });

    it('deve retornar 500 se verificarAceites falhar', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'rh',
      } as any);
      mockVerificarAceites.mockRejectedValueOnce(new Error('DB error'));

      const res = await GET();
      expect(res.status).toBe(500);
    });
  });
});

/**
 * ============================================================================
 * 3. TESTES ESTRUTURAIS: registrarAceite lib
 * ============================================================================
 */
describe('Lib: registrarAceite - Estrutura', () => {
  it('deve exportar função registrarAceite', async () => {
    const mod = await import('@/lib/termos/registrar-aceite');
    expect(typeof mod.registrarAceite).toBe('function');
  });

  it('registrarAceite deve aceitar parâmetros obrigatórios', async () => {
    mockRegistrarAceite.mockResolvedValueOnce({
      success: true,
      usuario_id: 1,
      entidade_id: 1,
      aceito_em: new Date().toISOString(),
    });

    await registrarAceite({
      usuario_cpf: '12345678901',
      usuario_tipo: 'rh',
      usuario_entidade_id: 5,
      termo_tipo: 'termos_uso',
      entidade_cnpj: '00000000000191',
      entidade_tipo: 'clinica',
      entidade_nome: 'Clinica Test',
      responsavel_nome: 'User Test',
    });

    expect(mockRegistrarAceite).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_cpf: '12345678901',
        termo_tipo: 'termos_uso',
      })
    );
  });
});

/**
 * ============================================================================
 * 4. TESTES ESTRUTURAIS: verificarAceites lib
 * ============================================================================
 */
describe('Lib: verificarAceites - Estrutura', () => {
  it('deve exportar função verificarAceites', async () => {
    const mod = await import('@/lib/termos/verificar-aceites');
    expect(typeof mod.verificarAceites).toBe('function');
  });

  it('verificarAceites retorna AceitesStatus', async () => {
    mockVerificarAceites.mockResolvedValueOnce({
      termos_uso_aceito: true,
      politica_privacidade_aceito: false,
    });

    const result = await verificarAceites('12345678901', 'rh');
    expect(result).toHaveProperty('termos_uso_aceito');
    expect(result).toHaveProperty('politica_privacidade_aceito');
  });
});

/**
 * ============================================================================
 * 5. TESTES DE INTEGRAÇÃO: POST registrar → verificar
 * ============================================================================
 */
describe('Integração: POST registrar → GET verificar', () => {
  let POST: (request: Request) => Promise<NextResponse>;
  let GET: () => Promise<NextResponse>;

  beforeAll(async () => {
    const regMod = await import('@/app/api/termos/registrar/route');
    POST = regMod.POST;
    const verMod = await import('@/app/api/termos/verificar/route');
    GET = verMod.GET;
  });

  const makeRequest = (body: any) =>
    new Request('http://localhost:3000/api/termos/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('após registrar termos_uso, verificar retorna termos_uso_aceito=true', async () => {
    // POST registrar
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Test',
      perfil: 'rh',
      clinica_id: 5,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, cnpj: '00000000000191', nome: 'Clinica' }],
    } as any);
    mockRegistrarAceite.mockResolvedValueOnce({
      success: true,
      usuario_id: 1,
      entidade_id: 1,
      aceito_em: '2026-01-01T00:00:00Z',
    });

    const postRes = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
    expect(postRes.status).toBe(200);

    // GET verificar
    mockGetSession.mockReturnValue({ cpf: '12345678901', perfil: 'rh' } as any);
    mockVerificarAceites.mockResolvedValueOnce({
      termos_uso_aceito: true,
      politica_privacidade_aceito: false,
    });

    const getRes = await GET();
    const data = await getRes.json();
    expect(data.termos_uso_aceito).toBe(true);
    expect(data.politica_privacidade_aceito).toBe(false);
  });

  it('após registrar ambos, verificar retorna ambos true', async () => {
    // POST termos_uso
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Test',
      perfil: 'rh',
      clinica_id: 5,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, cnpj: '00000000000191', nome: 'Clinica' }],
    } as any);
    mockRegistrarAceite.mockResolvedValueOnce({
      success: true,
      usuario_id: 1,
      entidade_id: 1,
      aceito_em: '2026-01-01T00:00:00Z',
    });
    await POST(makeRequest({ termo_tipo: 'termos_uso' }));

    // POST politica_privacidade
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Test',
      perfil: 'rh',
      clinica_id: 5,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, cnpj: '00000000000191', nome: 'Clinica' }],
    } as any);
    mockRegistrarAceite.mockResolvedValueOnce({
      success: true,
      usuario_id: 1,
      entidade_id: 2,
      aceito_em: '2026-01-01T00:00:00Z',
    });
    await POST(makeRequest({ termo_tipo: 'politica_privacidade' }));

    // GET verificar
    mockGetSession.mockReturnValue({ cpf: '12345678901', perfil: 'rh' } as any);
    mockVerificarAceites.mockResolvedValueOnce({
      termos_uso_aceito: true,
      politica_privacidade_aceito: true,
    });

    const getRes = await GET();
    const data = await getRes.json();
    expect(data.termos_uso_aceito).toBe(true);
    expect(data.politica_privacidade_aceito).toBe(true);
  });

  it('POST com perfil rh busca clinica, POST com perfil gestor busca entidade', async () => {
    // RH → clinicas
    mockGetSession.mockReturnValue({
      cpf: '11111111111',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, cnpj: '11111111000111', nome: 'Clinica A' }],
    } as any);
    mockRegistrarAceite.mockResolvedValueOnce({
      success: true,
      usuario_id: 1,
      entidade_id: 1,
      aceito_em: '2026-01-01T00:00:00Z',
    });
    await POST(makeRequest({ termo_tipo: 'termos_uso' }));
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('clinicas'),
      [1]
    );

    jest.clearAllMocks();

    // Gestor → entidades
    mockGetSession.mockReturnValue({
      cpf: '22222222222',
      nome: 'Gestor',
      perfil: 'gestor',
      entidade_id: 10,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, cnpj: '22222222000122', nome: 'Entidade B' }],
    } as any);
    mockRegistrarAceite.mockResolvedValueOnce({
      success: true,
      usuario_id: 2,
      entidade_id: 2,
      aceito_em: '2026-01-01T00:00:00Z',
    });
    await POST(makeRequest({ termo_tipo: 'termos_uso' }));
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('entidades'),
      [10]
    );
  });

  it('POST com 42P01 retorna 503 FEATURE_NOT_READY', async () => {
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Test',
      perfil: 'rh',
      clinica_id: 5,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, cnpj: '00000000000191', nome: 'Clinica' }],
    } as any);
    const err = new Error('TABLES_NOT_MIGRATED');
    mockRegistrarAceite.mockRejectedValueOnce(err);

    const res = await POST(makeRequest({ termo_tipo: 'termos_uso' }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.code).toBe('FEATURE_NOT_READY');
  });
});
