import { GET } from '@/app/api/rh/pendencias/route';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<any>;

describe('/api/rh/pendencias - admin blocked', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve retornar 403 para admin', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '00000000000',
      nome: 'Admin Teste',
      perfil: 'admin',
    });

    const request = new Request(
      'http://localhost:3000/api/rh/pendencias?empresa_id=1'
    );
    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });
});
