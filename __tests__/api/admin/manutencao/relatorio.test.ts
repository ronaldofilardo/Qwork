/**
 * @fileoverview Testes da API admin GET /api/admin/manutencao/relatorio
 * @description Verifica autenticação, filtros e retorno do relatório de manutenção
 */

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/manutencao-taxa', () => ({
  buscarEntidadesPendentesManutencao: jest.fn(),
  buscarEmpresasPendentesManutencao: jest.fn(),
}));

import { GET } from '@/app/api/admin/manutencao/relatorio/route';
import { getSession } from '@/lib/session';
import {
  buscarEntidadesPendentesManutencao,
  buscarEmpresasPendentesManutencao,
} from '@/lib/manutencao-taxa';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockBuscarEntidades =
  buscarEntidadesPendentesManutencao as jest.MockedFunction<
    typeof buscarEntidadesPendentesManutencao
  >;
const mockBuscarEmpresas =
  buscarEmpresasPendentesManutencao as jest.MockedFunction<
    typeof buscarEmpresasPendentesManutencao
  >;

describe('GET /api/admin/manutencao/relatorio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 quando não autenticado', async () => {
    mockGetSession.mockReturnValue(null);

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('deve retornar 403 para perfil não autorizado (rh)', async () => {
    mockGetSession.mockReturnValue({
      cpf: '00000000000',
      nome: 'RH',
      perfil: 'rh',
    } as any);

    const response = await GET();
    expect(response.status).toBe(403);
  });

  it('deve retornar relatório para suporte', async () => {
    mockGetSession.mockReturnValue({
      cpf: '00000000000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);

    const entidade = {
      tipo: 'entidade' as const,
      id: 1,
      clinica_id: null,
      clinica_nome: null,
      nome: 'Entidade A',
      cnpj: '00.000.000/0001-00',
      limite_cobranca: '2026-01-01',
      dias_vencidos: 10,
      valor: 250,
    };
    const empresa = {
      tipo: 'empresa_clinica' as const,
      id: 2,
      clinica_id: 5,
      clinica_nome: 'Clínica X',
      nome: 'Empresa B',
      cnpj: '11.111.111/0001-11',
      limite_cobranca: '2026-02-01',
      dias_vencidos: 5,
      valor: 250,
    };

    mockBuscarEntidades.mockResolvedValue([entidade]);
    mockBuscarEmpresas.mockResolvedValue([empresa]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entidades).toHaveLength(1);
    expect(data.empresas).toHaveLength(1);
    expect(data.total).toBe(2);
    expect(data.entidades[0].nome).toBe('Entidade A');
    expect(data.empresas[0].clinica_nome).toBe('Clínica X');
  });

  it('deve retornar relatório para admin', async () => {
    mockGetSession.mockReturnValue({
      cpf: '00000000000',
      nome: 'Admin',
      perfil: 'admin',
    } as any);

    mockBuscarEntidades.mockResolvedValue([]);
    mockBuscarEmpresas.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(0);
  });

  it('deve retornar 500 em caso de erro interno', async () => {
    mockGetSession.mockReturnValue({
      cpf: '00000000000',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);

    mockBuscarEntidades.mockRejectedValue(new Error('DB error'));

    const response = await GET();
    expect(response.status).toBe(500);
  });
});
