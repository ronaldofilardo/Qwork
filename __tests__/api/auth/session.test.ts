import { GET } from '@/app/api/auth/session/route';
import { getSession } from '@/lib/session';

// Mock das dependências
jest.mock('@/lib/session');

const mockGetSession = getSession as jest.MockedFunction<any>;

describe('/api/auth/session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar sessão quando usuário está autenticado', async () => {
    const mockSession = {
      cpf: '22222222222',
      nome: 'João Operacional Silva',
      perfil: 'funcionario',
      nivelCargo: 'operacional',
    };

    mockGetSession.mockResolvedValue(mockSession);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockSession);
  });

  it('deve retornar erro 401 quando usuário não está autenticado', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Não autenticado');
  });

  it('deve retornar erro 500 em caso de erro interno', async () => {
    mockGetSession.mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro interno');
  });
});
