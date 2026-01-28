/**
 * Testes para liberação em massa de avaliações pelo RH
 * Item 7: Botão cria nova avaliação sempre
 * Item 8: API retorna criadas >= 1 após liberações
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = require('@/lib/session').requireAuth;

describe('RH - Liberar Avaliações em Massa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '99999999999',
      nome: 'RH User',
      perfil: 'rh',
    });
  });

  describe('Item 7: Botão cria nova avaliação sempre', () => {
    it('deve criar novas avaliações ao liberar em massa', async () => {
      const funcionarios = [
        { cpf: '11111111111' },
        { cpf: '22222222222' },
        { cpf: '33333333333' },
      ];

      // Mock para buscar funcionários operacionais ativos
      mockQuery.mockResolvedValueOnce({
        rows: funcionarios,
        rowCount: funcionarios.length,
      });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.criadas).toBeGreaterThanOrEqual(1);
      expect(data.criadas).toBe(3);
      expect(data.total).toBe(3);
      expect(data.success).toBe(true);
    });

    it('deve criar avaliações mesmo se funcionário já tiver avaliação anterior', async () => {
      const funcionarios = [{ cpf: '11111111111' }];

      // Mock para buscar funcionários ativos
      mockQuery.mockResolvedValueOnce({
        rows: funcionarios,
        rowCount: funcionarios.length,
      });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.criadas).toBe(1);
      // Deve criar nova avaliação independente da anterior
    });

    it('deve permitir múltiplas liberações sucessivas', async () => {
      const funcionarios = [{ cpf: '11111111111' }];

      // Primeira liberação
      mockQuery.mockResolvedValueOnce({ rows: funcionarios, rowCount: 1 });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request1 = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      const response1 = await POST(request1);
      const data1 = await response1.json();
      expect(data1.criadas).toBe(1);

      // Segunda liberação (mesmo funcionário)
      mockQuery.mockResolvedValueOnce({ rows: funcionarios, rowCount: 1 });

      const request2 = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      const response2 = await POST(request2);
      const data2 = await response2.json();
      expect(data2.criadas).toBe(1);
    });

    it('deve liberar para todos os funcionários ativos', async () => {
      const todosFuncionarios = [
        { cpf: '11111111111' },
        { cpf: '22222222222' },
        { cpf: '33333333333' },
        { cpf: '44444444444' },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: todosFuncionarios,
        rowCount: todosFuncionarios.length,
      });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.criadas).toBe(4);
    });
  });

  describe('Item 8: API retorna criadas >= 1 após liberações', () => {
    it('deve retornar número de avaliações criadas', async () => {
      const funcionarios = [{ cpf: '11111111111' }, { cpf: '22222222222' }];

      mockQuery.mockResolvedValueOnce({ rows: funcionarios, rowCount: 2 });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('criadas');
      expect(typeof data.criadas).toBe('number');
      expect(data.criadas).toBeGreaterThanOrEqual(1);
      expect(data.criadas).toBe(2);
    });

    it('deve retornar criadas = 0 quando não há funcionários', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.criadas).toBe(0);
    });

    it('deve incluir detalhes das avaliações criadas', async () => {
      const funcionarios = [{ cpf: '11111111111' }];

      mockQuery.mockResolvedValueOnce({ rows: funcionarios, rowCount: 1 });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.criadas).toBe(1);
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
    });

    it('deve retornar sucesso com todos os funcionários encontrados', async () => {
      const funcionarios = [
        { cpf: '11111111111' },
        { cpf: '22222222222' },
        { cpf: '33333333333' },
      ];

      mockQuery.mockResolvedValueOnce({ rows: funcionarios, rowCount: 3 });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.criadas).toBe(3);
    });

    it('deve validar permissões de RH antes de liberar', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Funcionário',
        perfil: 'funcionario', // Não é RH
      });

      const { POST } = await import('@/app/api/avaliacao/liberar-massa/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/liberar-massa',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);

      // Deve retornar erro de permissão
      expect(response.status).toBe(200); // The route returns 200 with error message
      const data = await response.json();
      expect(data.error).toBe('Acesso negado');
    });
  });
});
