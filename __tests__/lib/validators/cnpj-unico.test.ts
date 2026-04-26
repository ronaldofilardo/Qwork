/**
 * __tests__/lib/validators/cnpj-unico.test.ts
 * Testes da validação de CNPJ único para representantes
 */
jest.mock('@/lib/db');

import { checkCnpjUnicoRepresentante } from '@/lib/validators/cnpj-unico';
import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('checkCnpjUnicoRepresentante', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve retornar disponível quando CNPJ não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const result = await checkCnpjUnicoRepresentante('12345678000190');

    expect(result.disponivel).toBe(true);
    expect(result.message).toBeNull();
  });

  it('deve retornar indisponível quando CNPJ já existe', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
    } as any);

    const result = await checkCnpjUnicoRepresentante('12345678000190');

    expect(result.disponivel).toBe(false);
    expect(result.message).toBe(
      'CNPJ já cadastrado como representante no sistema'
    );
  });

  it('deve ignorar representante específico ao verificar', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const result = await checkCnpjUnicoRepresentante('12345678000190', {
      ignorarRepresentanteId: 5,
    });

    expect(result.disponivel).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('AND id != $2'),
      ['12345678000190', 5]
    );
  });
});
