/**
 * @file __tests__/api/rh/logo.test.ts
 * Testes: POST /api/rh/logo — Upload de logo da clínica
 */

// ---- Mocks ----

const mockGetSession = jest.fn();
jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

const mockSalvar = jest.fn();
jest.mock('@/lib/clinica-configuracao-service', () => ({
  ClinicaConfiguracaoService: {
    salvar: (...args: unknown[]) => mockSalvar(...args),
  },
}));

jest.mock('@/lib/authorization/policies', () => ({
  assertAuth: (session: unknown) => {
    if (!session)
      throw {
        message: 'Autenticação requerida',
        code: 'UNAUTHORIZED',
        status: 401,
      };
  },
  assertRoles: (session: { perfil: string }, roles: string[]) => {
    if (!roles.includes(session.perfil))
      throw { message: 'Acesso negado', code: 'FORBIDDEN', status: 403 };
  },
  ROLES: {
    RH: 'rh',
    ADMIN: 'admin',
    FUNCIONARIO: 'funcionario',
    GESTOR: 'gestor',
  },
  isApiError: (err: unknown) =>
    typeof err === 'object' && err !== null && 'status' in err,
}));

jest.spyOn(console, 'error').mockImplementation(() => {});

import { POST } from '@/app/api/rh/logo/route';

// Helper para criar Request
function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/rh/logo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/rh/logo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Auth
  describe('Autenticação e Autorização', () => {
    it('deve retornar 401 quando não há sessão', async () => {
      mockGetSession.mockReturnValue(null);
      const res = await POST(makeRequest({ logo_base64: 'abc' }));
      expect(res.status).toBe(401);
    });

    it('deve retornar 403 quando perfil não é rh', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'Test',
        perfil: 'funcionario',
      });
      const res = await POST(makeRequest({ logo_base64: 'abc' }));
      expect(res.status).toBe(403);
    });

    it('deve retornar 403 quando rh sem clinica_id', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'Test',
        perfil: 'rh',
      });
      const res = await POST(makeRequest({ logo_base64: 'abc' }));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/clínica não identificada/i);
    });
  });

  // Remoção de logo
  describe('Remoção de logo', () => {
    it('deve remover logo quando logo_base64 é vazio', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 6,
      });
      mockSalvar.mockResolvedValueOnce({});

      const res = await POST(makeRequest({ logo_base64: '' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.logo_url).toBeNull();
      expect(mockSalvar).toHaveBeenCalledWith(6, { logo_url: '' }, '111');
    });

    it('deve remover logo quando logo_base64 é null', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 6,
      });
      mockSalvar.mockResolvedValueOnce({});

      const res = await POST(
        makeRequest({ logo_base64: null as unknown as string })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.logo_url).toBeNull();
    });
  });

  // Validações
  describe('Validação de entrada', () => {
    const rhSession = { cpf: '111', nome: 'RH', perfil: 'rh', clinica_id: 6 };

    it('deve rejeitar MIME type inválido', async () => {
      mockGetSession.mockReturnValue(rhSession);

      const res = await POST(
        makeRequest({
          logo_base64: 'iVBORw0KGgo=',
          mime_type: 'application/pdf',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/formato não suportado/i);
    });

    it('deve rejeitar base64 inválido', async () => {
      mockGetSession.mockReturnValue(rhSession);

      const res = await POST(
        makeRequest({
          logo_base64: '!!!invalid-base64!!!',
          mime_type: 'image/png',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/dados da imagem inválidos/i);
    });

    it('deve rejeitar imagem maior que 256KB', async () => {
      mockGetSession.mockReturnValue(rhSession);

      // Gerar string base64 que representa > 256KB decodificado
      const bigBase64 = 'A'.repeat(400000); // ~300KB decodificado

      const res = await POST(
        makeRequest({
          logo_base64: bigBase64,
          mime_type: 'image/png',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/muito grande/i);
    });
  });

  // Upload com sucesso
  describe('Upload com sucesso', () => {
    it('deve salvar logo e retornar data URI', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 6,
      });
      mockSalvar.mockResolvedValueOnce({});

      const res = await POST(
        makeRequest({
          logo_base64: 'iVBORw0KGgo=',
          mime_type: 'image/png',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.logo_url).toBe('data:image/png;base64,iVBORw0KGgo=');
      expect(mockSalvar).toHaveBeenCalledWith(
        6,
        { logo_url: 'data:image/png;base64,iVBORw0KGgo=' },
        '111'
      );
    });

    it('deve aceitar image/jpeg', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 6,
      });
      mockSalvar.mockResolvedValueOnce({});

      const res = await POST(
        makeRequest({
          logo_base64: '/9j/4AAQ',
          mime_type: 'image/jpeg',
        })
      );

      expect(res.status).toBe(200);
    });

    it('deve aceitar image/webp', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 6,
      });
      mockSalvar.mockResolvedValueOnce({});

      const res = await POST(
        makeRequest({
          logo_base64: 'UklGRg==',
          mime_type: 'image/webp',
        })
      );

      expect(res.status).toBe(200);
    });

    it('deve aceitar image/svg+xml', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 6,
      });
      mockSalvar.mockResolvedValueOnce({});

      const res = await POST(
        makeRequest({
          logo_base64: 'PHN2Zz4=',
          mime_type: 'image/svg+xml',
        })
      );

      expect(res.status).toBe(200);
    });

    it('deve remover prefixo data: do base64 antes de salvar', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 6,
      });
      mockSalvar.mockResolvedValueOnce({});

      const res = await POST(
        makeRequest({
          logo_base64: 'data:image/png;base64,iVBORw0KGgo=',
          mime_type: 'image/png',
        })
      );
      const body = await res.json();

      expect(body.logo_url).toBe('data:image/png;base64,iVBORw0KGgo=');
    });
  });

  // Erro interno
  describe('Erro interno', () => {
    it('deve retornar 500 quando service lança exceção', async () => {
      mockGetSession.mockReturnValue({
        cpf: '111',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 6,
      });
      mockSalvar.mockRejectedValueOnce(new Error('DB down'));

      const res = await POST(
        makeRequest({
          logo_base64: 'iVBORw0KGgo=',
          mime_type: 'image/png',
        })
      );

      expect(res.status).toBe(500);
    });
  });
});
