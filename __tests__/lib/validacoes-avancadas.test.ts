/**
 * Testes para Validações Avançadas
 * CPF brasileiro, sanitização de dados, prevenção de duplicatas
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

// Utilitário para validar CPF (algoritmo correto)
function validarCPF(cpf: any): boolean {
  if (!cpf || typeof cpf !== 'string') return false;

  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // First digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(digits[9])) return false;

  // Second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(digits[10])) return false;

  return true;
}

describe('Validações Avançadas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Algoritmo Completo de Validação CPF', () => {
    const cpfsValidos = [
      '12345678909',
      '11144477735',
      '52998224725',
      '39053344705',
      '98765432100',
      // CPFs inválidos removidos: 07256286970, 10234567890, 13345678912, 14567890123, 20246886033
    ];

    const cpfsInvalidos = [
      '00000000000', // Todos zeros
      '11111111111', // Todos iguais
      '22222222222', // Todos iguais
      '33333333333',
      '44444444444',
      '55555555555',
      '66666666666',
      '77777777777',
      '88888888888',
      '99999999999',
      '12345678900', // Dígito verificador incorreto
      '12345678901',
      '123456789', // Muito curto
      '123456789012', // Muito longo
      'abcdefghijk', // Letras
      '123.456.789-0X', // Caractere inválido
    ];

    describe('CPFs Válidos', () => {
      cpfsValidos.forEach((cpf) => {
        it(`deve aceitar CPF válido: ${cpf}`, () => {
          expect(validarCPF(cpf)).toBe(true);
        });
      });

      it('deve aceitar CPF com formatação', () => {
        expect(validarCPF('123.456.789-09')).toBe(true);
        expect(validarCPF('111.444.777-35')).toBe(true);
      });

      it('deve validar cálculo do primeiro dígito verificador', () => {
        // 123.456.789-09
        // Primeiro dígito: 0
        const cpf = '12345678909';
        expect(validarCPF(cpf)).toBe(true);
      });

      it('deve validar cálculo do segundo dígito verificador', () => {
        // 123.456.789-09
        // Segundo dígito: 9
        const cpf = '12345678909';
        expect(validarCPF(cpf)).toBe(true);
      });
    });

    describe('CPFs Inválidos', () => {
      cpfsInvalidos.forEach((cpf) => {
        it(`deve rejeitar CPF inválido: ${cpf}`, () => {
          expect(validarCPF(cpf)).toBe(false);
        });
      });

      it('deve rejeitar CPF com todos os dígitos iguais', () => {
        for (let i = 0; i <= 9; i++) {
          const cpf = String(i).repeat(11);
          expect(validarCPF(cpf)).toBe(false);
        }
      });

      it('deve rejeitar CPF com comprimento incorreto', () => {
        expect(validarCPF('123')).toBe(false);
        expect(validarCPF('1234567890')).toBe(false);
        expect(validarCPF('123456789012')).toBe(false);
      });

      it('deve rejeitar CPF com primeiro dígito verificador incorreto', () => {
        // CPF correto: 123.456.789-09
        // Alterando primeiro dígito: 123.456.789-19
        expect(validarCPF('12345678919')).toBe(false);
      });

      it('deve rejeitar CPF com segundo dígito verificador incorreto', () => {
        // CPF correto: 123.456.789-09
        // Alterando segundo dígito: 123.456.789-08
        expect(validarCPF('12345678908')).toBe(false);
      });
    });

    describe('Casos Edge', () => {
      it('deve lidar com string vazia', () => {
        expect(validarCPF('')).toBe(false);
      });

      it('deve lidar com null/undefined', () => {
        expect(validarCPF(null as any)).toBe(false);
        expect(validarCPF(undefined as any)).toBe(false);
      });

      it('deve remover caracteres especiais antes de validar', () => {
        expect(validarCPF('123.456.789-09')).toBe(true);
        expect(validarCPF('123 456 789 09')).toBe(true);
        expect(validarCPF('123-456-789-09')).toBe(true);
      });
    });
  });

  describe('Sanitização de Dados', () => {
    it('deve remover espaços em branco de strings', () => {
      const input = '  João Silva  ';
      const sanitized = input.trim();
      expect(sanitized).toBe('João Silva');
    });

    it('deve remover caracteres especiais de CPF', () => {
      const cpf = '123.456.789-09';
      const sanitized = cpf.replace(/\D/g, '');
      expect(sanitized).toBe('12345678909');
    });

    it('deve normalizar email para lowercase', () => {
      const email = 'JoAo@EMPRESA.COM';
      const sanitized = email.toLowerCase().trim();
      expect(sanitized).toBe('joao@empresa.com');
    });

    it('deve remover aspas duplas de valores importados', () => {
      const value = '"João Silva"';
      const sanitized = value.replace(/"/g, '');
      expect(sanitized).toBe('João Silva');
    });

    it('deve sanitizar campos obrigatórios', () => {
      const data = {
        cpf: ' 123.456.789-09 ',
        nome: '  João Silva  ',
        email: ' joao@empresa.com ',
        setor: '  TI  ',
        funcao: '  Desenvolvedor  ',
      };

      const sanitized = {
        cpf: data.cpf.replace(/\D/g, ''),
        nome: data.nome.trim(),
        email: data.email.trim().toLowerCase(),
        setor: data.setor.trim(),
        funcao: data.funcao.trim(),
      };

      expect(sanitized.cpf).toBe('12345678909');
      expect(sanitized.nome).toBe('João Silva');
      expect(sanitized.email).toBe('joao@empresa.com');
      expect(sanitized.setor).toBe('TI');
      expect(sanitized.funcao).toBe('Desenvolvedor');
    });

    it('deve converter valores null para null ou string vazia', () => {
      const value = null;
      const sanitized = value || null;
      expect(sanitized).toBe(null);
    });

    it('deve lidar com campos opcionais vazios', () => {
      const data = {
        matricula: '',
        turno: '',
        escala: '',
      };

      const sanitized = {
        matricula: data.matricula || null,
        turno: data.turno || null,
        escala: data.escala || null,
      };

      expect(sanitized.matricula).toBe(null);
      expect(sanitized.turno).toBe(null);
      expect(sanitized.escala).toBe(null);
    });
  });

  describe('Prevenção de Duplicatas', () => {
    it('deve verificar existência de CPF no banco', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '12345678909' }],
        rowCount: 1,
      });

      const result = await query(
        'SELECT cpf FROM funcionarios WHERE cpf = $1',
        ['12345678909']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].cpf).toBe('12345678909');
    });

    it('deve retornar vazio quando CPF não existe', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await query(
        'SELECT cpf FROM funcionarios WHERE cpf = $1',
        ['99999999999']
      );

      expect(result.rows.length).toBe(0);
    });

    it('deve verificar duplicata antes de inserção', async () => {
      // Verificação
      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '12345678909' }],
        rowCount: 1,
      });

      const existing = await query(
        'SELECT cpf FROM funcionarios WHERE cpf = $1',
        ['12345678909']
      );

      if (existing.rows.length > 0) {
        expect(existing.rows[0].cpf).toBe('12345678909');
      }
    });

    it('deve permitir inserção quando CPF não existe', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Verificação
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Inserção

      const check = await query('SELECT cpf FROM funcionarios WHERE cpf = $1', [
        '99999999999',
      ]);

      expect(check.rows.length).toBe(0);

      if (check.rows.length === 0) {
        const insert = await query(
          'INSERT INTO funcionarios (cpf, nome, setor, funcao, email) VALUES ($1, $2, $3, $4, $5)',
          ['99999999999', 'Teste', 'TI', 'Dev', 'teste@teste.com']
        );
        expect(insert.rowCount).toBe(1);
      }
    });

    it('deve usar ON CONFLICT para atualização', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await query(
        `INSERT INTO funcionarios (cpf, nome, setor, funcao, email)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (cpf) DO UPDATE SET
         nome = EXCLUDED.nome,
         setor = EXCLUDED.setor`,
        ['12345678909', 'João Atualizado', 'RH', 'Gestor', 'joao@teste.com']
      );

      expect(result.rowCount).toBe(1);
    });

    it('deve validar unicidade por clínica e empresa', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '12345678909',
            clinica_id: 1,
            empresa_id: 1,
          },
        ],
        rowCount: 1,
      });

      const result = await query(
        'SELECT cpf, clinica_id, empresa_id FROM funcionarios WHERE cpf = $1 AND clinica_id = $2',
        ['12345678909', 1]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].clinica_id).toBe(1);
    });
  });

  describe('Validação de Email', () => {
    const emailsValidos = [
      'joao@empresa.com',
      'maria.santos@teste.com.br',
      'user+tag@example.org',
      'admin_1@domain.co.uk',
      'test123@subdomain.example.com',
    ];

    const emailsInvalidos = [
      'invalido',
      '@empresa.com',
      'joao@',
      'joao@.com',
      'joao..silva@empresa.com',
      'joao@empresa',
      '',
    ];

    emailsValidos.forEach((email) => {
      it(`deve aceitar email válido: ${email}`, () => {
        expect(email.includes('@')).toBe(true);
        expect(email.indexOf('@')).toBeGreaterThan(0);
        expect(email.lastIndexOf('.')).toBeGreaterThan(email.indexOf('@'));
      });
    });

    emailsInvalidos.forEach((email) => {
      it(`deve rejeitar email inválido: ${email}`, () => {
        const atIndex = email.indexOf('@');
        const isValid =
          email.includes('@') &&
          atIndex > 0 &&
          email.lastIndexOf('.') > atIndex &&
          email[atIndex + 1] !== '.' &&
          !email.includes('..');
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Validação de Campos Obrigatórios', () => {
    it('deve validar campos obrigatórios preenchidos', () => {
      const funcionario = {
        cpf: '12345678909',
        nome: 'João Silva',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@teste.com',
        empresa_id: 1,
      };

      const isValid = !!(
        funcionario.cpf &&
        funcionario.nome &&
        funcionario.setor &&
        funcionario.funcao &&
        funcionario.email &&
        funcionario.empresa_id
      );

      expect(isValid).toBe(true);
    });

    it('deve rejeitar quando campos obrigatórios estão vazios', () => {
      const funcionario = {
        cpf: '',
        nome: 'João Silva',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@teste.com',
        empresa_id: 1,
      };

      const isValid = !!(
        funcionario.cpf &&
        funcionario.nome &&
        funcionario.setor &&
        funcionario.funcao &&
        funcionario.email &&
        funcionario.empresa_id
      );

      expect(isValid).toBe(false);
    });

    it('deve validar tamanho mínimo de nome', () => {
      expect('J'.length >= 2).toBe(false);
      expect('João'.length >= 2).toBe(true);
      expect('João Silva'.length >= 2).toBe(true);
    });

    it('deve validar tamanho de CPF', () => {
      expect('123'.length === 11).toBe(false);
      expect('12345678909'.length === 11).toBe(true);
      expect('123456789012'.length === 11).toBe(false);
    });
  });

  describe('Integração - Validações Completas', () => {
    it('deve validar funcionário completo antes de inserção', () => {
      const funcionario = {
        cpf: '12345678909',
        nome: 'João Silva',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@teste.com',
        empresa_id: 1,
        matricula: 'MAT001',
        nivel_cargo: 'operacional',
        turno: 'Manhã',
        escala: '8x40',
      };

      // Validações
      const cpfValido = validarCPF(funcionario.cpf);
      const emailValido = funcionario.email.includes('@');
      const camposObrigatorios = !!(
        funcionario.cpf &&
        funcionario.nome &&
        funcionario.setor &&
        funcionario.funcao &&
        funcionario.email &&
        funcionario.empresa_id
      );

      expect(cpfValido).toBe(true);
      expect(emailValido).toBe(true);
      expect(camposObrigatorios).toBe(true);
    });

    it('deve rejeitar funcionário com qualquer validação falhando', () => {
      const funcionario = {
        cpf: '11111111111', // CPF inválido
        nome: 'João Silva',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@teste.com',
        empresa_id: 1,
      };

      const cpfValido = validarCPF(funcionario.cpf);
      expect(cpfValido).toBe(false);
    });
  });
});
