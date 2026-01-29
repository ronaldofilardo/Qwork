import { GET } from '@/app/api/rh/funcionarios/[cpf]/route';
import { getSession } from '@/lib/session';

jest.mock('@/lib/session');

const mockGetSession = getSession as jest.MockedFunction<any>;

describe('/api/rh/funcionarios/[cpf] - admin blocked', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve retornar 403 para admin', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '00000000000',
      nome: 'Admin Teste',
      perfil: 'admin',
    });

    const request = new Request(
      'http://localhost:3000/api/rh/funcionarios/12345678909'
    );
    // Context params promise for cpf
    const context = { params: Promise.resolve({ cpf: '12345678909' }) } as any;

    const response = await GET(request as any, context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Não autorizado');
  });
});
