/**
 * Testes para API /api/admin/funcionarios
 * - Acesso RH
 * - Filtro por empresa_id
 * - Listagem de funcionários
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/admin/funcionarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Acesso RH', () => {
    it('deve permitir acesso ao perfil RH', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // funcionários

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('funcionarios');
      expect(mockRequireRole).toHaveBeenCalledWith('rh');
    });

    it('deve permitir acesso ao perfil admin', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'Admin Teste',
        perfil: 'admin',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // admin lookup
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // funcionários

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('funcionarios');
    });

    it('deve permitir acesso ao perfil admin alternativo', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'Admin Alternativo',
        perfil: 'admin',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // admin lookup
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // funcionários

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('funcionarios');
    });

    it('deve negar acesso a outros perfis', async () => {
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao listar');
    });
  });

  describe('Filtro por empresa_id', () => {
    it('deve filtrar funcionários por empresa_id quando parâmetro é fornecido', async () => {
      const mockFuncionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'Produção',
          funcao: 'Operador',
          email: 'joao@empresa.com',
          matricula: 'MAT001',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '8x40',
          empresa_nome: 'Empresa Teste',
          ativo: true,
        },
      ];

      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: mockFuncionarios, rowCount: 1 }); // funcionários filtrados

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios?empresa_id=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.funcionarios).toHaveLength(1);
      expect(data.funcionarios[0].cpf).toBe('12345678901');
      expect(data.funcionarios[0].empresa_nome).toBe('Empresa Teste');

      // Verifica se a query incluiu o filtro de empresa
      expect(mockQuery.mock.calls[2][0]).toContain('AND f.empresa_id = $2');
      expect(mockQuery.mock.calls[2][1]).toEqual([1, '1']);
    });

    it('deve retornar todos os funcionários da clínica quando empresa_id não é fornecido', async () => {
      const mockFuncionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'Produção',
          funcao: 'Operador',
          email: 'joao@empresa.com',
          matricula: 'MAT001',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '8x40',
          empresa_nome: 'Empresa A',
          ativo: true,
        },
        {
          cpf: '98765432100',
          nome: 'Maria Santos',
          setor: 'RH',
          funcao: 'Gestora',
          email: 'maria@empresa.com',
          matricula: 'MAT002',
          nivel_cargo: 'gestao',
          turno: null,
          escala: null,
          empresa_nome: 'Empresa B',
          ativo: true,
        },
      ];

      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: mockFuncionarios, rowCount: 2 }); // todos funcionários

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.funcionarios).toHaveLength(2);

      // Verifica se a query NÃO incluiu filtro de empresa
      expect(mockQuery.mock.calls[1][0]).not.toContain('AND f.empresa_id = $2');
      expect(mockQuery.mock.calls[1][1]).toEqual([1]);
    });

    it('deve retornar lote_id e lote_codigo quando funcionário tem avaliação ativa', async () => {
      const mockFuncionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'Produção',
          funcao: 'Operador',
          email: 'joao@empresa.com',
          matricula: 'MAT001',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '8x40',
          empresa_nome: 'Empresa Teste',
          empresa_id: 1,
          ativo: true,
          avaliacao_id: 1,
          avaliacao_inicio: '2025-01-10',
          avaliacao_envio: null,
          avaliacao_status: 'em_andamento',
          lote_id: 5,
        },
      ];

      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockFuncionarios, rowCount: 1 });

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.funcionarios).toHaveLength(1);

      const funcionario = data.funcionarios[0];
      expect(funcionario.avaliacoes).toHaveLength(1);
      expect(funcionario.avaliacoes[0].id).toBe(1);
      expect(funcionario.avaliacoes[0].lote_id).toBe(5);

      // Verifica que a query faz LEFT JOIN com avaliacoes e lotes_avaliacao
      const queryCall = mockQuery.mock.calls[1];
      expect(queryCall[0]).toContain('LEFT JOIN avaliacoes a ON');
      expect(queryCall[0]).toContain('LEFT JOIN lotes_avaliacao la ON');
    });

    it('deve retornar array vazio de avaliações quando funcionário não tem avaliação', async () => {
      const mockFuncionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'Produção',
          funcao: 'Operador',
          email: 'joao@empresa.com',
          matricula: 'MAT001',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '8x40',
          empresa_nome: 'Empresa Teste',
          empresa_id: 1,
          ativo: true,
          avaliacao_id: null,
          avaliacao_inicio: null,
          avaliacao_envio: null,
          avaliacao_status: null,
          lote_id: null,
          lote_codigo: null,
        },
      ];

      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockFuncionarios, rowCount: 1 });

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const funcionario = data.funcionarios[0];
      expect(funcionario.avaliacoes).toHaveLength(0);
    });

    it('deve retornar lista vazia quando não há funcionários na empresa', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // nenhum funcionário

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios?empresa_id=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.funcionarios).toHaveLength(0);
    });
  });

  describe('Estrutura dos dados retornados', () => {
    it('deve retornar funcionários com todos os campos necessários', async () => {
      const mockFuncionario = {
        cpf: '12345678901',
        nome: 'João Silva',
        setor: 'Produção',
        funcao: 'Operador de Máquinas',
        email: 'joao@empresa.com',
        matricula: 'MAT001',
        nivel_cargo: 'operacional',
        turno: 'Manhã',
        escala: '8x40',
        empresa_nome: 'Indústria Metalúrgica',
        ativo: true,
      };

      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockFuncionario], rowCount: 1 });

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.funcionarios).toHaveLength(1);

      const func = data.funcionarios[0];
      expect(func).toHaveProperty('cpf');
      expect(func).toHaveProperty('nome');
      expect(func).toHaveProperty('setor');
      expect(func).toHaveProperty('funcao');
      expect(func).toHaveProperty('email');
      expect(func).toHaveProperty('matricula');
      expect(func).toHaveProperty('nivel_cargo');
      expect(func).toHaveProperty('turno');
      expect(func).toHaveProperty('escala');
      expect(func).toHaveProperty('empresa_nome');
      expect(func).toHaveProperty('ativo');
    });

    it('deve ordenar funcionários por nome', async () => {
      const mockFuncionarios = [
        { cpf: '22222222222', nome: 'Maria Santos', empresa_nome: 'Empresa A' },
        { cpf: '11111111111', nome: 'João Silva', empresa_nome: 'Empresa A' },
        { cpf: '33333333333', nome: 'Ana Costa', empresa_nome: 'Empresa A' },
      ];

      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockFuncionarios, rowCount: 3 });

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.funcionarios).toHaveLength(3);

      // Verifica ordenação por nome (dados mock estão nessa ordem)
      expect(data.funcionarios[0].nome).toBe('Maria Santos');
      expect(data.funcionarios[1].nome).toBe('João Silva');
      expect(data.funcionarios[2].nome).toBe('Ana Costa');

      // Verifica se ORDER BY nome foi incluído
      expect(mockQuery.mock.calls[1][0]).toContain('ORDER BY f.nome');
    });
  });

  describe('Tratamento de erros', () => {
    it('deve retornar erro 500 quando requireRole falha', async () => {
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao listar');
    });

    it('deve retornar erro 500 quando query falha', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery.mockRejectedValue(new Error('Erro de banco'));

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao listar');
    });

    it('deve retornar erro 404 quando RH não é encontrado', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'RH Inválido',
        perfil: 'rh',
      });

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // RH não encontrado

      const { GET } = await import('@/app/api/admin/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/admin/funcionarios'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Gestor RH não encontrado');
    });
  });
});
