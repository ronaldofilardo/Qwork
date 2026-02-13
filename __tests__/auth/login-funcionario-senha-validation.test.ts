/**
 * Testes de validação de senha para login de funcionários
 * Verifica comportamento de senhaHash null, vazio, ou com hash incorreto
 */

import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

describe('Login Funcionário - Validação de SenhaHash', () => {
  describe('Comportamento do bcrypt.compare com valores inválidos', () => {
    const senhaEsperada = gerarSenhaDeNascimento('01/01/2011'); // "01012011"

    it('deve lançar erro quando senhaHash é null', async () => {
      await expect(
        bcrypt.compare(senhaEsperada, null as any)
      ).rejects.toThrow();
    });

    it('deve lançar erro quando senhaHash é undefined', async () => {
      await expect(
        bcrypt.compare(senhaEsperada, undefined as any)
      ).rejects.toThrow();
    });

    it('deve retornar false quando senhaHash é string vazia', async () => {
      const result = await bcrypt.compare(senhaEsperada, '');
      expect(result).toBe(false);
    });

    it('deve retornar false quando senhaHash é formato inválido', async () => {
      const result = await bcrypt.compare(senhaEsperada, 'invalid-hash-format');
      expect(result).toBe(false);
    });
  });

  describe('Validação de data de nascimento por bcrypt', () => {
    let hashCorreto: string;
    const dataNascimento = '01/01/2011';
    const senhaCorreta = gerarSenhaDeNascimento(dataNascimento); // "01012011"

    beforeAll(async () => {
      // Gerar hash como seria armazenado no banco para um funcionário
      hashCorreto = await bcrypt.hash(senhaCorreta, 10);
    });

    it('deve validar com sucesso quando data de nascimento está correta', async () => {
      const senhaEsperada = gerarSenhaDeNascimento(dataNascimento);
      const result = await bcrypt.compare(senhaEsperada, hashCorreto);
      expect(result).toBe(true);
    });

    it('deve falhar quando data de nascimento está incorreta', async () => {
      const senhaErrada = gerarSenhaDeNascimento('02/01/2011'); // "02012011"
      const result = await bcrypt.compare(senhaErrada, hashCorreto);
      expect(result).toBe(false);
    });

    it('deve falhar quando data está em formato diferente mas valor diferente', async () => {
      const senhaErrada = gerarSenhaDeNascimento('01/01/2012'); // "01012012"
      const result = await bcrypt.compare(senhaErrada, hashCorreto);
      expect(result).toBe(false);
    });

    it('deve validar mesmo quando formato de entrada é diferente mas representa mesma data', async () => {
      const formatos = [
        '01/01/2011',
        '01012011',
        '2011-01-01',
        '010111', // DDMMYY
      ];

      for (const formato of formatos) {
        const senhaEsperada = gerarSenhaDeNascimento(formato);
        const result = await bcrypt.compare(senhaEsperada, hashCorreto);
        expect(result).toBe(true);
      }
    });
  });

  describe('Cenários de problema em produção', () => {
    it('deve detectar se hash é de string vazia (problema potencial em PROD)', async () => {
      // Se em PROD o senhaHash for hash de string vazia, qualquer senha seria aceita?
      const hashDeStringVazia = await bcrypt.hash('', 10);

      const senha1 = gerarSenhaDeNascimento('01/01/2011');
      const senha2 = gerarSenhaDeNascimento('02/01/2011');
      const senha3 = '';

      const result1 = await bcrypt.compare(senha1, hashDeStringVazia);
      const result2 = await bcrypt.compare(senha2, hashDeStringVazia);
      const result3 = await bcrypt.compare(senha3, hashDeStringVazia);

      // Somente string vazia deve passar
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(true);
    });

    it('deve detectar se função gerarSenhaDeNascimento tem comportamento consistente', () => {
      const inputs = ['01/01/2011', '01/02/2011', '01/03/2011', '02/01/2011'];

      const outputs = inputs.map(gerarSenhaDeNascimento);

      // Todas devem ser diferentes
      const uniqueOutputs = new Set(outputs);
      expect(uniqueOutputs.size).toBe(inputs.length);

      // Verificar formatos esperados
      expect(outputs[0]).toBe('01012011');
      expect(outputs[1]).toBe('01022011');
      expect(outputs[2]).toBe('01032011');
      expect(outputs[3]).toBe('02012011');
    });

    it('deve verificar se bcrypt.compare é determinístico', async () => {
      const senha = '01012011';
      const hash = await bcrypt.hash(senha, 10);

      // Comparar múltiplas vezes deve sempre retornar o mesmo resultado
      const results = await Promise.all([
        bcrypt.compare(senha, hash),
        bcrypt.compare(senha, hash),
        bcrypt.compare(senha, hash),
        bcrypt.compare('01022011', hash),
        bcrypt.compare('01022011', hash),
      ]);

      expect(results[0]).toBe(true);
      expect(results[1]).toBe(true);
      expect(results[2]).toBe(true);
      expect(results[3]).toBe(false);
      expect(results[4]).toBe(false);
    });
  });

  describe('Simulação de fluxo de login', () => {
    it('deve simular cenário completo de login com data correta', async () => {
      // 1. Funcionário é cadastrado com data 01/01/2011
      const dataNascimentoCadastro = '01/01/2011';
      const senhaInicial = gerarSenhaDeNascimento(dataNascimentoCadastro);
      const senhaHashDB = await bcrypt.hash(senhaInicial, 10);

      // 2. Funcionário tenta fazer login com data 01/01/2011
      const dataNascimentoLogin = '01/01/2011';
      const senhaEsperada = gerarSenhaDeNascimento(dataNascimentoLogin);

      // 3. Validação
      const senhaValida = await bcrypt.compare(senhaEsperada, senhaHashDB);

      expect(senhaValida).toBe(true);
    });

    it('deve simular cenário de login com data incorreta', async () => {
      // 1. Funcionário é cadastrado com data 01/01/2011
      const dataNascimentoCadastro = '01/01/2011';
      const senhaInicial = gerarSenhaDeNascimento(dataNascimentoCadastro);
      const senhaHashDB = await bcrypt.hash(senhaInicial, 10);

      // 2. Funcionário tenta fazer login com data ERRADA 02/01/2011
      const dataNascimentoLogin = '02/01/2011';
      const senhaEsperada = gerarSenhaDeNascimento(dataNascimentoLogin);

      // 3. Validação deve falhar
      const senhaValida = await bcrypt.compare(senhaEsperada, senhaHashDB);

      expect(senhaValida).toBe(false);
    });

    it('deve simular cenário de login com formato diferente mas data correta', async () => {
      // 1. Funcionário é cadastrado com data 01/01/2011
      const dataNascimentoCadastro = '01/01/2011';
      const senhaInicial = gerarSenhaDeNascimento(dataNascimentoCadastro);
      const senhaHashDB = await bcrypt.hash(senhaInicial, 10);

      // 2. Funcionário tenta fazer login com formato DDMMYYYY
      const dataNascimentoLogin = '01012011';
      const senhaEsperada = gerarSenhaDeNascimento(dataNascimentoLogin);

      // 3. Validação deve passar (mesma data, formato diferente)
      const senhaValida = await bcrypt.compare(senhaEsperada, senhaHashDB);

      expect(senhaValida).toBe(true);
    });
  });
});
