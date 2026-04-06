/**
 * @file __tests__/api/entidade/logo.test.ts
 * Testes: POST /api/entidade/logo — Upload de logo da entidade
 */

// ---- Mocks ----

const mockRequireEntity = jest.fn();
jest.mock('@/lib/session', () => ({
  requireEntity: () => mockRequireEntity(),
}));

const mockSalvar = jest.fn();
const mockRemoverLogo = jest.fn();
const mockBuscarPorEntidade = jest.fn();
jest.mock('@/lib/entidade-configuracao-service', () => ({
  EntidadeConfiguracaoService: {
    salvar: (...args: unknown[]) => mockSalvar(...args),
    removerLogo: (...args: unknown[]) => mockRemoverLogo(...args),
    buscarPorEntidade: (...args: unknown[]) => mockBuscarPorEntidade(...args),
  },
}));

jest.spyOn(console, 'error').mockImplementation(() => {});

import { POST, GET } from '@/app/api/entidade/logo/route';

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/entidade/logo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/entidade/logo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Auth
  describe('Autenticação e Autorização', () => {
    it('deve retornar 403 quando perfil não é gestor', async () => {
      mockRequireEntity.mockRejectedValueOnce(
        new Error('Acesso restrito a gestores de entidade')
      );

      const res = await POST(makeRequest({ logo_base64: 'abc' }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toMatch(/acesso restrito/i);
    });

    it('deve retornar 403 quando entidade não identificada', async () => {
      mockRequireEntity.mockRejectedValueOnce(
        new Error('Entidade não identificada na sessão')
      );

      const res = await POST(makeRequest({ logo_base64: 'abc' }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toMatch(/não identificada/i);
    });
  });

  // Remoção
  describe('Remoção de logo', () => {
    it('deve remover logo quando logo_base64 é vazio', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        cpf: '222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 22,
      });
      mockRemoverLogo.mockResolvedValueOnce({});

      const res = await POST(makeRequest({ logo_base64: '' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.logo_url).toBeNull();
      expect(mockRemoverLogo).toHaveBeenCalledWith(22, '222');
    });
  });

  // Validações
  describe('Validação de entrada', () => {
    const gestorSession = {
      cpf: '222',
      nome: 'Gestor',
      perfil: 'gestor',
      entidade_id: 22,
    };

    it('deve rejeitar MIME type inválido', async () => {
      mockRequireEntity.mockResolvedValueOnce(gestorSession);

      const res = await POST(
        makeRequest({
          logo_base64: 'iVBORw0KGgo=',
          mime_type: 'text/html',
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/formato não suportado/i);
    });

    it('deve rejeitar base64 inválido', async () => {
      mockRequireEntity.mockResolvedValueOnce(gestorSession);

      const res = await POST(
        makeRequest({
          logo_base64: '@@@not-base64@@@',
          mime_type: 'image/png',
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/dados da imagem inválidos/i);
    });

    it('deve rejeitar imagem maior que 256KB', async () => {
      mockRequireEntity.mockResolvedValueOnce(gestorSession);
      const bigBase64 = 'A'.repeat(400000);

      const res = await POST(
        makeRequest({
          logo_base64: bigBase64,
          mime_type: 'image/png',
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/muito grande/i);
    });
  });

  // Upload com sucesso
  describe('Upload com sucesso', () => {
    it('deve salvar logo e retornar data URI', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        cpf: '222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 22,
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
        22,
        { logo_url: 'data:image/png;base64,iVBORw0KGgo=' },
        '222'
      );
    });

    it('deve remover prefixo data: do base64 antes de salvar', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        cpf: '222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 22,
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
    it('deve retornar 500 quando service lança exceção genérica', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        cpf: '222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 22,
      });
      mockSalvar.mockRejectedValueOnce(new Error('DB timeout'));

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

describe('GET /api/entidade/logo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Autenticação e Autorização', () => {
    it('deve retornar 403 quando perfil não é gestor', async () => {
      mockRequireEntity.mockRejectedValueOnce(
        new Error('Acesso restrito a gestores de entidade')
      );

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toMatch(/acesso restrito/i);
    });

    it('deve retornar 403 quando entidade não identificada', async () => {
      mockRequireEntity.mockRejectedValueOnce(
        new Error('Entidade não identificada na sessão')
      );

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toMatch(/não identificada/i);
    });
  });

  describe('Busca de logo', () => {
    it('deve retornar logo_url quando configuração existe', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        cpf: '222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 22,
      });
      mockBuscarPorEntidade.mockResolvedValueOnce({
        logo_url: 'data:image/png;base64,xyz789',
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.logo_url).toBe('data:image/png;base64,xyz789');
      expect(mockBuscarPorEntidade).toHaveBeenCalledWith(22);
    });

    it('deve retornar logo_url null quando não há configuração', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        cpf: '222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 22,
      });
      mockBuscarPorEntidade.mockResolvedValueOnce(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.logo_url).toBeNull();
    });

    it('deve retornar logo_url null quando logo_url está vazio', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        cpf: '222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 22,
      });
      mockBuscarPorEntidade.mockResolvedValueOnce({ logo_url: '' });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.logo_url).toBeNull();
    });

    it('deve retornar 500 quando service lança exceção genérica', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        cpf: '222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 22,
      });
      mockBuscarPorEntidade.mockRejectedValueOnce(new Error('DB timeout'));

      const res = await GET();
      expect(res.status).toBe(500);
    });
  });
});
