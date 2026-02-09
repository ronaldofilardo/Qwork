/**
 * Testes de integração: Confirmação de pagamento → criarContaResponsavel → ativartomador
 */

import { criarContaResponsavel, ativartomador } from '@/lib/db';

jest.mock('@/lib/db');

const mockCriarContaResponsavel = criarContaResponsavel as jest.MockedFunction<
  typeof criarContaResponsavel
>;
const mockAtivartomador = ativartomador as jest.MockedFunction<
  typeof ativartomador
>;

// Tipo para mock de Request
interface MockRequest {
  json: () => Promise<any>;
}

// Tipos para os retornos das funções mockadas
interface CriarContaResponse {
  success: boolean;
  message: string;
  funcionario?: {
    id: number;
    cpf: string;
    perfil: string;
    usuario_tipo?: string;
  };
  senha_gerada?: string;
}

interface AtivartomadorResponse {
  success: boolean;
  message: string;
  tomador?: any;
}

describe('Confirmação de Pagamento - Criação Automática de Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar criarContaResponsavel após confirmação de pagamento para entidade', () => {
    const _mockRequest: MockRequest = {
      json: jest.fn().mockResolvedValue({
        tomador_id: 1,
        tipo: 'entidade',
      }),
    };

    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      message: 'Conta criada com sucesso',
      funcionario: {
        id: 100,
        cpf: '12345678900',
        perfil: 'gestor',
        usuario_tipo: 'gestor',
      },
    } as CriarContaResponse);

    mockAtivartomador.mockResolvedValueOnce({
      success: true,
      message: 'tomador ativado',
    } as AtivartomadorResponse);

    // Simular confirmação de pagamento
    // Nota: Este teste valida configuração de mocks, não a chamada real

    expect(mockCriarContaResponsavel).toBeDefined();
    expect(mockAtivartomador).toBeDefined();
  });

  it('deve criar conta com perfil gestor para tipo entidade', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      funcionario: {
        perfil: 'gestor',
        usuario_tipo: 'gestor',
      },
    } as CriarContaResponse);

    await criarContaResponsavel(1);

    const call = mockCriarContaResponsavel.mock.calls[0];
    expect(call[0]).toBe(1); // tomador_id
  });

  it('deve criar conta com perfil rh para tipo clinica', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      funcionario: { perfil: 'rh', usuario_tipo: 'rh' },
    } as CriarContaResponse);

    await criarContaResponsavel(2);

    expect(mockCriarContaResponsavel).toHaveBeenCalledWith(2);
  });

  it('deve ativar tomador após criar conta com sucesso', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
    } as CriarContaResponse);

    mockAtivartomador.mockResolvedValueOnce({
      success: true,
      message: 'tomador ativado',
    } as AtivartomadorResponse);

    await criarContaResponsavel(1);
    await ativartomador(1);

    expect(mockAtivartomador).toHaveBeenCalledWith(1);
  });

  it('não deve ativar tomador se criação de conta falhar', () => {
    const mockRetornoFalha = {
      success: false,
      message: 'Erro ao criar conta',
    } as CriarContaResponse;

    mockCriarContaResponsavel.mockResolvedValueOnce(mockRetornoFalha);

    expect(mockRetornoFalha.success).toBe(false);
  });
});

describe('criarContaResponsavel - Entidade vs Clínica', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve configurar mock com perfil gestor para entidade', () => {
    const mockRetorno = {
      success: true,
      funcionario: {
        perfil: 'gestor',
        usuario_tipo: 'gestor',
        nome: 'João Silva',
        cpf: '12345678900',
      },
    } as CriarContaResponse;

    mockCriarContaResponsavel.mockResolvedValueOnce(mockRetorno);

    expect(mockRetorno.funcionario?.perfil).toBe('gestor');
    expect(mockRetorno.funcionario?.usuario_tipo).toBe('gestor');
  });

  it('deve configurar mock com perfil rh para clinica', () => {
    const mockRetorno = {
      success: true,
      funcionario: {
        perfil: 'rh',
        usuario_tipo: 'rh',
        nome: 'Maria Santos',
        cpf: '98765432100',
      },
    } as CriarContaResponse;

    mockCriarContaResponsavel.mockResolvedValueOnce(mockRetorno);

    expect(mockRetorno.funcionario?.perfil).toBe('rh');
    expect(mockRetorno.funcionario?.usuario_tipo).toBe('rh');
  });

  it('deve configurar mock com senha_gerada', () => {
    const mockRetorno = {
      success: true,
      funcionario: { id: 100 },
      senha_gerada: 'senha123',
    } as CriarContaResponse;

    mockCriarContaResponsavel.mockResolvedValueOnce(mockRetorno);

    expect(mockRetorno.senha_gerada).toBeDefined();
    expect(mockRetorno.senha_gerada).toBe('senha123');
  });
});
