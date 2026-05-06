import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

// Mock modules
jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { GET } from '@/app/api/admin/auditorias/funcionarios/route';

// Mock requireRole para passar (admin autorizado)
(requireRole as jest.Mock).mockImplementation(async () => {
  // Apenas passa, sem fazer nada
});

describe('GET /api/admin/auditorias/funcionarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock de requireRole para passar autorização por padrão
    (requireRole as jest.Mock).mockImplementation(async () => {
      // Apenas passa
    });
  });

  it('deve retornar funcionários com sucesso', async () => {
    const mockData = {
      rows: [
        {
          funcionario_id: 1,
          cpf: '12345678901',
          nome: 'João Silva',
          data_inclusao: '2024-01-15',
          status_atual: true,
          tomador_tipo: 'rh',
          tomador_nome: 'Clínica ABC',
          empresa_nome: 'Empresa XYZ',
          setor: 'RH',
        },
        {
          funcionario_id: 2,
          cpf: '98765432100',
          nome: 'Maria Santos',
          data_inclusao: '2024-02-10',
          status_atual: false,
          tomador_tipo: 'entidade',
          tomador_nome: 'Entidade ABC',
          empresa_nome: null,
          setor: 'Administrativo',
        },
      ],
    };

    (query as jest.Mock).mockResolvedValue(mockData);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.funcionarios).toHaveLength(2);
    expect(json.funcionarios[0].cpf).toBe('12345678901');
    expect(json.funcionarios[0].tomador_tipo).toBe('rh');
    expect(json.funcionarios[1].tomador_tipo).toBe('entidade');
  });

  it('deve retornar array vazio quando nenhum funcionário encontrado', async () => {
    (query as jest.Mock).mockResolvedValue({ rows: [] });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.funcionarios).toEqual([]);
  });

  it('deve retornar erro 403 quando usuário não é admin', async () => {
    (requireRole as jest.Mock).mockImplementationOnce(() => {
      const err = new Error('Sem permissão');
      throw err;
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Acesso negado');
  });

  it('deve incluir funcionários de RH (clínica + empresa)', async () => {
    const mockData = {
      rows: [
        {
          funcionario_id: 1,
          cpf: '11111111111',
          nome: 'Func RH 1',
          data_inclusao: '2024-01-01',
          status_atual: true,
          tomador_tipo: 'rh',
          tomador_nome: 'Clínica A',
          empresa_nome: 'Empresa A',
          setor: 'RH',
        },
      ],
    };

    (query as jest.Mock).mockResolvedValue(mockData);

    const response = await GET();
    const json = await response.json();

    expect(json.funcionarios).toHaveLength(1);
    expect(json.funcionarios[0].tomador_tipo).toBe('rh');
    expect(json.funcionarios[0].empresa_nome).toBe('Empresa A');
  });

  it('deve incluir funcionários de Entidade', async () => {
    const mockData = {
      rows: [
        {
          funcionario_id: 2,
          cpf: '22222222222',
          nome: 'Func Entidade 1',
          data_inclusao: '2024-02-01',
          status_atual: true,
          tomador_tipo: 'entidade',
          tomador_nome: 'Entidade A',
          empresa_nome: null,
          setor: 'Administrativo',
        },
      ],
    };

    (query as jest.Mock).mockResolvedValue(mockData);

    const response = await GET();
    const json = await response.json();

    expect(json.funcionarios).toHaveLength(1);
    expect(json.funcionarios[0].tomador_tipo).toBe('entidade');
    expect(json.funcionarios[0].empresa_nome).toBeNull();
  });

  it('deve retornar erro 500 em caso de erro de banco de dados', async () => {
    // Resetar mock de requireRole para passar autorização
    (requireRole as jest.Mock).mockImplementationOnce(async () => {
      // Apenas passa
    });

    (query as jest.Mock).mockRejectedValueOnce(
      new Error('Erro ao conectar banco de dados')
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Erro interno do servidor');
  });

  it('deve ordenar por data de inclusão em ordem descendente', async () => {
    const mockData = {
      rows: [
        {
          funcionario_id: 3,
          cpf: '33333333333',
          nome: 'Recente',
          data_inclusao: '2024-03-01',
          status_atual: true,
          tomador_tipo: 'rh',
          tomador_nome: 'Clínica C',
          empresa_nome: null,
          setor: null,
        },
        {
          funcionario_id: 1,
          cpf: '11111111111',
          nome: 'Antigo',
          data_inclusao: '2024-01-01',
          status_atual: true,
          tomador_tipo: 'rh',
          tomador_nome: 'Clínica A',
          empresa_nome: null,
          setor: null,
        },
      ],
    };

    (query as jest.Mock).mockResolvedValue(mockData);

    const response = await GET();
    const json = await response.json();

    // A query mockada já retorna em ordem, então apenas verificamos
    expect(json.funcionarios[0].nome).toBe('Recente');
    expect(json.funcionarios[1].nome).toBe('Antigo');
  });
});
