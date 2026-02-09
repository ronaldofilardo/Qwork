import { GET, POST } from '@/app/api/rh/empresas/route';

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireClinica: jest.fn(),
}));

import { query } from '@/lib/db';
import { requireClinica } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireClinica = requireClinica as jest.MockedFunction<
  typeof requireClinica
>;

describe('/api/rh/empresas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ✅ Mock consistente seguindo política - sessão com clinica_id obrigatório
    mockRequireClinica.mockResolvedValue({
      clinica_id: 1,
    });
  });

  describe('GET - Listar empresas', () => {
    it('deve retornar empresas ativas da clínica ordenadas por nome', async () => {
      const mockEmpresas = [
        {
          id: 1,
          nome: 'Empresa A',
          cnpj: '12.345.678/0001-01',
          email: 'empresaA@teste.com',
          ativa: true,
          criado_em: '2025-01-01T00:00:00Z',
          telefone: '(11) 3000-0000',
          endereco: 'Rua A, 100',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          total_funcionarios: 5,
          total_avaliacoes: 2,
          avaliacoes_concluidas: 1,
        },
        {
          id: 2,
          nome: 'Empresa B',
          cnpj: '98.765.432/0001-02',
          email: 'empresaB@teste.com',
          ativa: true,
          criado_em: '2025-01-02T00:00:00Z',
          telefone: '(11) 3000-0001',
          endereco: 'Rua B, 200',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-568',
          total_funcionarios: 3,
          total_avaliacoes: 1,
          avaliacoes_concluidas: 0,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockEmpresas });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({
        id: 1,
        nome: 'Empresa A',
        cnpj: '12.345.678/0001-01',
        email: 'empresaA@teste.com',
        ativa: true,
        total_funcionarios: 5,
      });
      expect(data[1].nome).toBe('Empresa B');

      // Verifica se a query usa funcionarios_clinicas corretamente
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('funcionarios_clinicas'),
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('deve retornar erro 403 quando RH não tem clinica_id', async () => {
      // Mock sessão sem clinica_id - simular que requireClinica falha
      mockRequireClinica.mockRejectedValue(
        new Error('Clínica não identificada na sessão')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Clínica não identificada na sessão');
    });

    it('deve retornar erro 500 em caso de falha na query', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Erro de conexão'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao listar empresas');
    });
  });

  describe('POST - Criar empresa', () => {
    it('deve criar empresa com sucesso', async () => {
      const empresaData = {
        nome: 'Nova Empresa',
        cnpj: '11.222.333/0001-81', // CNPJ válido
        email: 'nova@empresa.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        representante_nome: 'João Silva',
        representante_fone: '(11) 98888-7777',
        representante_email: 'joao@empresa.com',
      };

      const mockResult = [
        {
          id: 3,
          nome: 'Nova Empresa',
          cnpj: '11.222.333/0001-81',
          email: 'nova@empresa.com',
          telefone: '(11) 99999-9999',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          ativa: true,
          criado_em: '2025-12-30T10:00:00Z',
        },
      ];

      // Mock da criação
      mockQuery.mockResolvedValueOnce({ rows: mockResult });

      const request = new Request('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(3);
      expect(data.nome).toBe('Nova Empresa');
    });

    it('deve retornar erro 400 para CNPJ inválido', async () => {
      const empresaData = {
        nome: 'Empresa Inválida',
        cnpj: '11111111111111', // CNPJ inválido
        email: 'invalida@teste.com',
      };

      const request = new Request('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('CNPJ inválido');
    });

    it('deve retornar erro 409 para CNPJ já cadastrado', async () => {
      const empresaData = {
        nome: 'Empresa Duplicada',
        cnpj: '11.222.333/0001-81', // Mesmo CNPJ válido do teste de sucesso
        email: 'duplicada@teste.com',
        representante_nome: 'João Silva',
        representante_fone: '(11) 98888-7777',
        representante_email: 'joao@empresa.com',
      };

      // Mock erro de constraint única
      const constraintError = new Error(
        'duplicate key value violates unique constraint "empresas_clientes_cnpj_key"'
      );
      constraintError.code = '23505';
      constraintError.constraint = 'empresas_clientes_cnpj_key';
      mockQuery.mockRejectedValueOnce(constraintError);

      const request = new Request('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect([400, 409]).toContain(response.status);
      expect(data.error).toBe('CNPJ já cadastrado no sistema');
    });

    it('deve validar campos obrigatórios', async () => {
      const empresaData = {
        nome: 'AB', // Nome muito curto
        cnpj: '12.345.678/0001-01',
      };

      const request = new Request('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nome deve ter no mínimo 3 caracteres');
    });
  });
});
