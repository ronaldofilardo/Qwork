/**
 * @file __tests__/lib/validators-representante.test.ts
 * Testes unitários para lib/validators/representante.ts
 *
 * Mockeia @/lib/db para evitar dependências de banco de dados.
 */

// Mock de @/lib/db ANTES de importar o módulo
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { query } from '@/lib/db';
import {
  checkEmailDuplicate,
  checkCpfDuplicate,
  checkCnpjDuplicate,
  checkRepresentanteDuplicates,
} from '@/lib/validators/representante';

const mockQuery = query as jest.MockedFunction<typeof query>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('checkEmailDuplicate', () => {
  describe('quando email não existe', () => {
    it('deve retornar isDuplicate: false', async () => {
      // Arrange: sem resultado em representantes e leads
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkEmailDuplicate('novo@email.com');

      // Assert
      expect(resultado.isDuplicate).toBe(false);
      expect(resultado.field).toBeNull();
      expect(resultado.message).toBeNull();
    });
  });

  describe('quando email existe em representantes', () => {
    it('deve retornar isDuplicate: true com source: representante', async () => {
      // Arrange: encontrou em representantes
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkEmailDuplicate('existente@email.com');

      // Assert
      expect(resultado.isDuplicate).toBe(true);
      expect(resultado.field).toBe('email');
      expect(resultado.source).toBe('representante');
      expect(resultado.message).toBeTruthy();
    });
  });

  describe('quando email existe em leads ativos', () => {
    it('deve retornar isDuplicate: true com source: lead', async () => {
      // Arrange: não encontrou em representantes, mas encontrou em leads
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'abc-123' }], rowCount: 1 } as any);

      // Act
      const resultado = await checkEmailDuplicate('lead@email.com');

      // Assert
      expect(resultado.isDuplicate).toBe(true);
      expect(resultado.field).toBe('email');
      expect(resultado.source).toBe('lead');
      expect(resultado.message).toBeTruthy();
    });
  });
});

describe('checkCpfDuplicate', () => {
  describe('quando CPF não existe', () => {
    it('deve retornar isDuplicate: false', async () => {
      // Arrange
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkCpfDuplicate('12345678901');

      // Assert
      expect(resultado.isDuplicate).toBe(false);
    });
  });

  describe('quando CPF já está cadastrado em representantes', () => {
    it('deve retornar isDuplicate: true com field: cpf', async () => {
      // Arrange
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 5 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkCpfDuplicate('12345678901');

      // Assert
      expect(resultado.isDuplicate).toBe(true);
      expect(resultado.field).toBe('cpf');
      expect(resultado.source).toBe('representante');
    });
  });

  describe('quando CPF existe em lead ativo', () => {
    it('deve retornar isDuplicate: true com source: lead', async () => {
      // Arrange
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'lead-1' }], rowCount: 1 } as any);

      // Act
      const resultado = await checkCpfDuplicate('12345678901');

      // Assert
      expect(resultado.isDuplicate).toBe(true);
      expect(resultado.field).toBe('cpf');
      expect(resultado.source).toBe('lead');
    });
  });
});

describe('checkCnpjDuplicate', () => {
  describe('quando CNPJ não existe', () => {
    it('deve retornar isDuplicate: false', async () => {
      // Arrange
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkCnpjDuplicate('11222333000181');

      // Assert
      expect(resultado.isDuplicate).toBe(false);
    });
  });

  describe('quando CNPJ já está cadastrado como representante', () => {
    it('deve retornar isDuplicate: true com source: representante', async () => {
      // Arrange
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkCnpjDuplicate('11222333000181');

      // Assert
      expect(resultado.isDuplicate).toBe(true);
      expect(resultado.field).toBe('cnpj');
      expect(resultado.source).toBe('representante');
    });
  });

  describe('quando CNPJ possui cadastro em análise (lead)', () => {
    it('deve retornar isDuplicate: true com source: lead', async () => {
      // Arrange
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'lead-2' }], rowCount: 1 } as any);

      // Act
      const resultado = await checkCnpjDuplicate('11222333000181');

      // Assert
      expect(resultado.isDuplicate).toBe(true);
      expect(resultado.field).toBe('cnpj');
      expect(resultado.source).toBe('lead');
    });
  });
});

describe('checkRepresentanteDuplicates', () => {
  describe('sem duplicatas', () => {
    it('deve retornar isDuplicate: false quando email e CNPJ são únicos (PJ)', async () => {
      // Arrange: todas as 4 queries retornam vazio (email + cnpj, cada um com 2 checks)
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkRepresentanteDuplicates({
        email: 'novo@empresa.com',
        tipoPessoa: 'pj',
        cnpj: '11222333000181',
      });

      // Assert
      expect(resultado.isDuplicate).toBe(false);
    });

    it('deve retornar isDuplicate: false quando email e CPF são únicos (PF)', async () => {
      // Arrange
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkRepresentanteDuplicates({
        email: 'novo@pessoa.com',
        tipoPessoa: 'pf',
        cpf: '12345678901',
      });

      // Assert
      expect(resultado.isDuplicate).toBe(false);
    });
  });

  describe('email duplicado', () => {
    it('deve retornar isDuplicate: true no email antes de verificar CNPJ', async () => {
      // Arrange: email duplicado em representantes
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkRepresentanteDuplicates({
        email: 'duplicado@empresa.com',
        tipoPessoa: 'pj',
        cnpj: '11222333000181',
      });

      // Assert
      expect(resultado.isDuplicate).toBe(true);
      expect(resultado.field).toBe('email');
      // Deve ter parado no email — cnpj não foi verificado
      expect(mockQuery).toHaveBeenCalledTimes(2); // só as queries do email
    });
  });

  describe('CNPJ duplicado (PJ)', () => {
    it('deve retornar isDuplicate: true no CNPJ após email ser único', async () => {
      // Arrange: email ok, CNPJ duplicado em representantes
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email em representantes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email em leads
        .mockResolvedValueOnce({ rows: [{ id: 7 }], rowCount: 1 } as any) // cnpj em representantes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // cnpj em leads (não chega aqui)

      // Act
      const resultado = await checkRepresentanteDuplicates({
        email: 'unico@empresa.com',
        tipoPessoa: 'pj',
        cnpj: '11222333000181',
      });

      // Assert
      expect(resultado.isDuplicate).toBe(true);
      expect(resultado.field).toBe('cnpj');
    });
  });

  describe('sem cpf/cnpj fornecido', () => {
    it('deve verificar apenas email quando cpf não é fornecido (PF)', async () => {
      // Arrange: email único
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      // Act
      const resultado = await checkRepresentanteDuplicates({
        email: 'sem-cpf@pessoa.com',
        tipoPessoa: 'pf',
      });

      // Assert
      expect(resultado.isDuplicate).toBe(false);
      expect(mockQuery).toHaveBeenCalledTimes(2); // só as queries do email
    });
  });
});
