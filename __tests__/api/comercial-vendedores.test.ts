/**
 * @jest-environment node
 */
const {
  GET: getVendedores,
  POST: createVendedor,
} = require('@/app/api/comercial/vendedores/route');
const { query } = require('@/lib/db');
const { requireRole } = require('@/lib/session');

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pass'),
}));

describe('Portal Comercial - API Vendedores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/comercial/vendedores', () => {
    it('deve listar vendedores e apoiar filtro por representante_id', async () => {
      requireRole.mockResolvedValue({ cpf: '12345678901', role: 'comercial' });
      query.mockImplementation((q) => {
        if (q.includes('COUNT(*)'))
          return Promise.resolve({ rows: [{ total: '1' }] });
        return Promise.resolve({
          rows: [
            {
              id: 10,
              cpf: '00011122233',
              nome: 'Vendedor Teste',
              email: 'vend@teste.com',
              ativo: true,
              vinculos: [{ representante_id: 1, ativo: true }],
            },
          ],
        });
      });

      const req = new Request(
        'http://localhost/api/comercial/vendedores?representante_id=1'
      );
      const res = await getVendedores(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.vendedores).toHaveLength(1);
      expect(data.vendedores[0].nome).toBe('Vendedor Teste');
    });
  });

  describe('POST /api/comercial/vendedores', () => {
    it('deve criar novo vendedor e retornar 201', async () => {
      requireRole.mockResolvedValue({ cpf: '12345678901', role: 'comercial' });
      query.mockImplementation((q) => {
        // checkCpfUnicoSistema — representantes (cpf, cpf_responsavel_pj) → vazio = disponível
        if (
          q.includes('WHERE cpf = $1') &&
          q.includes('FROM representantes')
        )
          return Promise.resolve({ rows: [] });
        if (q.includes('cpf_responsavel_pj = $1'))
          return Promise.resolve({ rows: [] });
        // checkCpfUnicoSistema — leads → vazio
        if (q.includes('FROM representantes_cadastro_leads'))
          return Promise.resolve({ rows: [] });
        // checkCpfUnicoSistema — usuarios (vendedor/gestor/rh) → vazio
        if (
          q.includes("tipo_usuario IN ('vendedor', 'gestor', 'rh')")
        )
          return Promise.resolve({ rows: [] });
        if (q.includes('INSERT INTO usuarios'))
          return Promise.resolve({ rows: [{ id: 100 }] });
        if (
          q.includes('SELECT id FROM usuarios WHERE cpf = $1 AND ativo = true')
        )
          return Promise.resolve({ rows: [{ id: 50 }] });
        if (q.includes('SELECT id FROM representantes'))
          return Promise.resolve({ rows: [{ id: 1 }] });
        if (q.includes('INSERT INTO hierarquia_comercial'))
          return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      });

      const payload = {
        cpf: '00000000000',
        nome: 'Novo Vendedor',
        email: 'novo@vendedor.com',
        senha: 'senha123',
        representante_id: 1,
      };

      const req = new Request('http://localhost/api/comercial/vendedores', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await createVendedor(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.vendedor_id).toBe(100);
    });
  });
});
