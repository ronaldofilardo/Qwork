/**
 * @file __tests__/api/vendedor/meu-representante.test.ts
 *
 * Testes para GET /api/vendedor/meu-representante
 * Retorna dados de comissionamento do representante vinculado ao vendedor logado,
 * usado pelo modal "Novo Lead" para exibir simulação de comissão.
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { GET } from '@/app/api/vendedor/meu-representante/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('GET /api/vendedor/meu-representante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 quando não autenticado', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/autorizado/i);
  });

  it('retorna 404 quando usuário não encontrado no banco', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // usuarios não encontrado

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('retorna { representante: null } quando sem vínculo ativo', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 108 }], rowCount: 1 } as any) // usuarios
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // hierarquia_comercial vazio

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representante).toBeNull();
  });

  it('retorna dados de comissionamento do representante vinculado', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 108 }], rowCount: 1 } as any) // usuarios
      .mockResolvedValueOnce({
        rows: [
          {
            percentual_comissao: 15,
            modelo_comissionamento: 'percentual',
            valor_custo_fixo_entidade: null,
            valor_custo_fixo_clinica: null,
          },
        ],
        rowCount: 1,
      } as any); // hierarquia + representantes

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representante).not.toBeNull();
    expect(data.representante.percentual_comissao).toBe(15);
    expect(data.representante.modelo_comissionamento).toBe('percentual');
  });

  it('retorna dados de custo fixo quando modelo é custo_fixo', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 108 }], rowCount: 1 } as any) // usuarios
      .mockResolvedValueOnce({
        rows: [
          {
            percentual_comissao: 0,
            modelo_comissionamento: 'custo_fixo',
            valor_custo_fixo_entidade: 12.0,
            valor_custo_fixo_clinica: 10.0,
          },
        ],
        rowCount: 1,
      } as any); // hierarquia + representantes

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representante.modelo_comissionamento).toBe('custo_fixo');
    expect(data.representante.valor_custo_fixo_entidade).toBe(12.0);
    expect(data.representante.valor_custo_fixo_clinica).toBe(10.0);
  });

  it('busca apenas vínculo ativo em hierarquia_comercial', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 108 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            percentual_comissao: 10,
            modelo_comissionamento: 'percentual',
            valor_custo_fixo_entidade: null,
            valor_custo_fixo_clinica: null,
          },
        ],
        rowCount: 1,
      } as any);

    await GET();

    // Verifica que a query filtra por ativo = true
    const hierQuery = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        /hierarquia_comercial/.test(sql) &&
        /ativo.*true/i.test(sql)
    );
    expect(hierQuery).toBeDefined();
    expect(hierQuery![1]).toContain(108); // vendedor_id
  });
});

// ===========================================================================
// Testes estruturais (inspeção de código-fonte)
// ===========================================================================

describe('GET /api/vendedor/meu-representante — estrutura', () => {
  const fs = require('fs');
  const path = require('path');
  const routePath = path.join(
    process.cwd(),
    'app/api/vendedor/meu-representante/route.ts'
  );

  describe('Validação de arquivo', () => {
    it('arquivo route.ts existe', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('exporta função GET', () => {
      const src = fs.readFileSync(routePath, 'utf-8');
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
    });
  });

  describe('Lógica de busca', () => {
    let src: string;
    beforeAll(() => {
      src = fs.readFileSync(routePath, 'utf-8');
    });

    it('busca usuario pelo CPF da sessão', () => {
      expect(src).toMatch(/WHERE\s+cpf\s*=\s*\$1/i);
      expect(src).toMatch(/session\.cpf/);
    });

    it('faz JOIN com hierarquia_comercial e representantes', () => {
      expect(src).toMatch(/hierarquia_comercial/i);
      expect(src).toMatch(/representantes/i);
      expect(src).toMatch(/vendedor_id/i);
      expect(src).toMatch(/ativo\s*=\s*true/i);
    });

    it('retorna dados de comissionamento do representante', () => {
      expect(src).toMatch(/percentual_comissao/);
      expect(src).toMatch(/modelo_comissionamento/);
      expect(src).toMatch(/valor_custo_fixo_entidade/);
      expect(src).toMatch(/valor_custo_fixo_clinica/);
    });
  });

  describe('Response structure', () => {
    let src: string;
    beforeAll(() => {
      src = fs.readFileSync(routePath, 'utf-8');
    });

    it('retorna objeto com representante property', () => {
      expect(src).toMatch(/representante/);
      expect(src).toMatch(/NextResponse\.json/);
    });

    it('retorna null se representante não encontrado', () => {
      expect(src).toMatch(/representante:\s*null/);
    });
  });

  describe('Segurança', () => {
    let src: string;
    beforeAll(() => {
      src = fs.readFileSync(routePath, 'utf-8');
    });

    it('tem dynamic = force-dynamic', () => {
      expect(src).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
    });

    it('limita resultado a 1 representante (LIMIT 1)', () => {
      expect(src).toMatch(/LIMIT\s+1/i);
    });

    it('filtra por ativo = true', () => {
      expect(src).toMatch(/ativo\s*=\s*true/i);
    });

    it('usa requireRole com perfil vendedor', () => {
      expect(src).toMatch(/requireRole\(\s*['"]vendedor['"]/);
    });
  });
});
