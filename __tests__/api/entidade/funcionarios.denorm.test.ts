import { GET as _GET } from '@/app/api/entidade/funcionarios/route';
import * as sessionMod from '@/lib/session';

jest.mock('@/lib/session');

describe('GET /api/entidade/funcionarios (denormalized columns present)', () => {
  beforeAll(() => {
    (sessionMod.requireEntity as jest.MockedFunction<any>).mockResolvedValue({
      cpf: '99900011122',
      perfil: 'gestor_entidade',
      contratante_id: 46,
    });
  });

  test('deve retornar NextResponse sem erro (colunas denormalizadas presentes)', async () => {
    const { GET } = await import('@/app/api/entidade/funcionarios/route');

    const response = await GET();
    expect(response).toBeDefined();
    // Deve ser NextResponse com status numérico
    expect(typeof (response as any).status).toBe('number');
    // Se a query executou com sucesso, não deve conter erro 42703
    expect((response as any).status).not.toBe(500);
  }, 10000);
});
