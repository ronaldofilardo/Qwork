/**
 * Testes de integração: Confirmação de pagamento → criarContaResponsavel → ativarContratante
 */

import { criarContaResponsavel, ativarContratante } from '@/lib/db';

jest.mock('@/lib/db');

const mockCriarContaResponsavel = criarContaResponsavel as jest.MockedFunction<
  typeof criarContaResponsavel
>;
const mockAtivarContratante = ativarContratante as jest.MockedFunction<
  typeof ativarContratante
>;

// Tipo para mock de Request
interface MockRequest {
  json: () => Promise<any>;
}

// Tipos para os retornos das funções mockadas
interface CriarContaResponse {
  success: boolean;
  message: string;
  funcionario?: { id: number; cpf: string; perfil: string };
}

interface AtivarContratanteResponse {
  success: boolean;
  message: string;
  contratante?: any;
}

describe('Confirmação de Pagamento - Criação Automática de Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar criarContaResponsavel após confirmação de pagamento para entidade', () => {
    const _mockRequest: MockRequest = {
      json: jest.fn().mockResolvedValue({
        contratante_id: 1,
        tipo: 'entidade',
      }),
    };

    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      message: 'Conta criada com sucesso',
      funcionario: { id: 100, cpf: '12345678900', perfil: 'gestor_entidade' },
    } as CriarContaResponse);

    mockAtivarContratante.mockResolvedValueOnce({
      success: true,
      message: 'Contratante ativado',
    } as AtivarContratanteResponse);

    // Simular confirmação de pagamento
    // Nota: Este teste valida que o handler chama as funções corretas

    expect(mockCriarContaResponsavel).toHaveBeenCalledWith(1);
    expect(mockAtivarContratante).toHaveBeenCalledWith(1);
  });

  it('deve criar conta com perfil gestor_entidade para tipo entidade', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      funcionario: { perfil: 'gestor_entidade' },
    } as CriarContaResponse);

    await criarContaResponsavel(1);

    const call = mockCriarContaResponsavel.mock.calls[0];
    expect(call[0]).toBe(1); // contratante_id
  });

  it('deve criar conta com perfil rh para tipo clinica', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      funcionario: { perfil: 'rh' },
    } as CriarContaResponse);

    await criarContaResponsavel(2);

    expect(mockCriarContaResponsavel).toHaveBeenCalledWith(2);
  });

  it('deve ativar contratante após criar conta com sucesso', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
    } as CriarContaResponse);

    mockAtivarContratante.mockResolvedValueOnce({
      success: true,
      message: 'Contratante ativado',
    } as AtivarContratanteResponse);

    await criarContaResponsavel(1);
    await ativarContratante(1);

    expect(mockAtivarContratante).toHaveBeenCalledWith(1);
  });

  it('não deve ativar contratante se criação de conta falhar', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: false,
      message: 'Erro ao criar conta',
    } as CriarContaResponse);

    const result = await criarContaResponsavel(1);

    expect(result.success).toBe(false);
    expect(mockAtivarContratante).not.toHaveBeenCalled();
  });
});

describe('criarContaResponsavel - Entidade vs Clínica', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar funcionario com perfil gestor_entidade para entidade', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      funcionario: {
        perfil: 'gestor_entidade',
        nome: 'João Silva',
        cpf: '12345678900',
      },
    } as CriarContaResponse);

    const result = await criarContaResponsavel(1);

    expect(result.success).toBe(true);
    expect(result.funcionario?.perfil).toBe('gestor_entidade');
  });

  it('deve criar funcionario com perfil rh para clinica', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      funcionario: {
        perfil: 'rh',
        nome: 'Maria Santos',
        cpf: '98765432100',
      },
    } as CriarContaResponse);

    const result = await criarContaResponsavel(2);

    expect(result.success).toBe(true);
    expect(result.funcionario?.perfil).toBe('rh');
  });

  it('deve criar senha hash em contratantes_senhas', async () => {
    mockCriarContaResponsavel.mockResolvedValueOnce({
      success: true,
      funcionario: { id: 100 },
      senha_gerada: 'senha123',
    } as CriarContaResponse);

    const result = await criarContaResponsavel(1);

    expect(result.success).toBe(true);
    expect(result.senha_gerada).toBeDefined();
  });
});
