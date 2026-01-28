// Mocks
jest.mock('@/lib/db', () => ({
  getContratantesByTipo: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

import { GET } from '@/app/api/admin/contratantes/route';
import { getContratantesByTipo } from '@/lib/db';
import { getSession } from '@/lib/session';

const mockGetContratantesByTipo = getContratantesByTipo as jest.MockedFunction<
  typeof getContratantesByTipo
>;
const mockGetSession = getSession as jest.MockedFunction<any>;

describe('/api/admin/contratantes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('deve retornar lista de contratantes por tipo', async () => {
      const mockSession = {
        cpf: '12345678901',
        nome: 'Admin Teste',
        perfil: 'admin' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);
      mockGetContratantesByTipo.mockResolvedValue([
        {
          id: 1,
          tipo: 'clinica',
          nome: 'Clínica Saúde Total',
          cnpj: '12345678000123',
          email: 'contato@clinicasaudetotal.com.br',
          telefone: '(11) 99999-0001',
          endereco: 'Rua das Flores, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          responsavel_nome: 'Dr. João Silva',
          responsavel_cpf: '12345678901',
          responsavel_email: 'joao.silva@clinicasaudetotal.com.br',
          responsavel_celular: '(11) 99999-0002',
          status: 'aprovado',
          ativa: true,
          pagamento_confirmado: true,
          criado_em: new Date('2024-01-01T00:00:00.000Z'),
          atualizado_em: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          id: 2,
          tipo: 'clinica',
          nome: 'Centro Médico Bem Estar',
          cnpj: '98765432000198',
          email: 'contato@centromedico.com.br',
          telefone: '(11) 99999-0003',
          endereco: 'Av. Paulista, 456',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310-100',
          responsavel_nome: 'Dra. Maria Santos',
          responsavel_cpf: '98765432109',
          responsavel_email: 'maria.santos@centromedico.com.br',
          responsavel_celular: '(11) 99999-0004',
          status: 'aprovado',
          ativa: true,
          pagamento_confirmado: true,
          criado_em: new Date('2024-01-02T00:00:00.000Z'),
          atualizado_em: new Date('2024-01-02T00:00:00.000Z'),
        },
        {
          id: 3,
          tipo: 'entidade',
          nome: 'Empresa XYZ Ltda',
          cnpj: '45678912000145',
          email: 'rh@empresa-xyz.com.br',
          telefone: '(11) 99999-0005',
          endereco: 'Rua dos Negócios, 789',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '04567-890',
          responsavel_nome: 'Carlos Oliveira',
          responsavel_cpf: '45678912345',
          responsavel_email: 'carlos.oliveira@empresa-xyz.com.br',
          responsavel_celular: '(11) 99999-0006',
          status: 'aprovado',
          ativa: true,
          criado_em: new Date('2024-01-03T00:00:00.000Z'),
          atualizado_em: new Date('2024-01-03T00:00:00.000Z'),
        },
      ]);

      // Mock para simular request sem query params
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
      };

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.contratantes).toHaveLength(3);
      expect(data.contratantes[0].tipo).toBe('clinica');
      expect(data.contratantes[1].tipo).toBe('clinica');
      expect(data.contratantes[2].tipo).toBe('entidade');
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockGetContratantesByTipo).toHaveBeenCalledWith(
        undefined,
        mockSession
      );
    });

    it('deve filtrar por tipo quando especificado', async () => {
      const mockSession = {
        cpf: '12345678901',
        nome: 'Admin Teste',
        perfil: 'admin' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);
      mockGetContratantesByTipo.mockResolvedValue([
        {
          id: 1,
          tipo: 'clinica',
          nome: 'Clínica Saúde Total',
          cnpj: '12345678000123',
          status: 'aprovado',
          criado_em: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          id: 2,
          tipo: 'clinica',
          nome: 'Centro Médico Bem Estar',
          cnpj: '98765432000198',
          status: 'aprovado',
          criado_em: new Date('2024-01-02T00:00:00.000Z'),
        },
      ]);

      // Mock para simular query string tipo=clinica
      const mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams('tipo=clinica'),
        },
      };

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.contratantes).toHaveLength(2);
      expect(data.contratantes[0].tipo).toBe('clinica');
      expect(data.contratantes[1].tipo).toBe('clinica');
      expect(mockGetContratantesByTipo).toHaveBeenCalledWith(
        'clinica',
        mockSession
      );
    });

    it('deve retornar 403 se não for admin', async () => {
      mockGetSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso não autorizado');
    });
  });
});
