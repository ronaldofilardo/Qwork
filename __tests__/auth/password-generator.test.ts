/**
 * Testes para gerador de senha baseado em data de nascimento
 */

import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

describe('gerarSenhaDeNascimento', () => {
  describe('Formato ISO (YYYY-MM-DD)', () => {
    it('deve gerar senha correta para data ISO', () => {
      const resultado = gerarSenhaDeNascimento('1974-10-24');
      expect(resultado).toBe('24101974');
    });

    it('deve gerar senha para data padrão de teste', () => {
      const resultado = gerarSenhaDeNascimento('1974-10-24');
      expect(resultado).toBe('24101974');
    });

    it('deve adicionar zero à esquerda em dia/mês se necessário', () => {
      const resultado = gerarSenhaDeNascimento('1985-04-05');
      expect(resultado).toBe('05041985');
    });

    it('deve aceitar anos recentes', () => {
      const resultado = gerarSenhaDeNascimento('2000-01-15');
      expect(resultado).toBe('15012000');
    });
  });

  describe('Formato BR (DD/MM/YYYY)', () => {
    it('deve gerar senha correta para data BR', () => {
      const resultado = gerarSenhaDeNascimento('24/10/1974');
      expect(resultado).toBe('24101974');
    });

    it('deve adicionar zero à esquerda em dia/mês se necessário', () => {
      const resultado = gerarSenhaDeNascimento('5/4/1985');
      expect(resultado).toBe('05041985');
    });

    it('deve aceitar formato com zeros à esquerda', () => {
      const resultado = gerarSenhaDeNascimento('05/04/1985');
      expect(resultado).toBe('05041985');
    });

    it('deve interpretar ano com 2 dígitos >= 31 como 19XX', () => {
      const resultado = gerarSenhaDeNascimento('24/10/74');
      expect(resultado).toBe('24101974');
    });

    it('deve interpretar ano com 2 dígitos <= 30 como 20XX', () => {
      const resultado = gerarSenhaDeNascimento('15/01/00');
      expect(resultado).toBe('15012000');
    });
  });

  describe('Validações', () => {
    it('deve rejeitar data vazia', () => {
      expect(() => gerarSenhaDeNascimento('')).toThrow(
        'Data de nascimento é obrigatória'
      );
    });

    it('deve rejeitar formato inválido', () => {
      expect(() => gerarSenhaDeNascimento('invalid-date')).toThrow(
        'Data de nascimento inválida'
      );
    });

    it('deve rejeitar dia inválido', () => {
      expect(() => gerarSenhaDeNascimento('1974-10-32')).toThrow(
        'Dia inválido na data de nascimento'
      );
    });

    it('deve rejeitar mês inválido', () => {
      expect(() => gerarSenhaDeNascimento('1974-13-24')).toThrow(
        'Mês inválido na data de nascimento'
      );
    });

    it('deve rejeitar ano muito antigo', () => {
      expect(() => gerarSenhaDeNascimento('1899-10-24')).toThrow(
        'Ano inválido na data de nascimento'
      );
    });

    it('deve rejeitar ano futuro', () => {
      const anoFuturo = new Date().getFullYear() + 1;
      expect(() => gerarSenhaDeNascimento(`${anoFuturo}-10-24`)).toThrow(
        'Ano inválido na data de nascimento'
      );
    });
  });

  describe('Casos de uso reais', () => {
    it('deve gerar senha para diversos funcionários', () => {
      const funcionarios = [
        { data: '1974-10-24', esperado: '24101974' },
        { data: '1985-04-15', esperado: '15041985' },
        { data: '1990-02-02', esperado: '02021990' },
        { data: '1978-12-31', esperado: '31121978' },
        { data: '2000-01-01', esperado: '01012000' },
      ];

      funcionarios.forEach(({ data, esperado }) => {
        expect(gerarSenhaDeNascimento(data)).toBe(esperado);
      });
    });

    it('deve ser idempotente', () => {
      const data = '1974-10-24';
      const senha1 = gerarSenhaDeNascimento(data);
      const senha2 = gerarSenhaDeNascimento(data);
      expect(senha1).toBe(senha2);
    });

    it('deve gerar sempre 8 dígitos', () => {
      const datas = ['1974-10-24', '1985-04-15', '2000-01-01', '1990-12-31'];

      datas.forEach((data) => {
        const senha = gerarSenhaDeNascimento(data);
        expect(senha).toHaveLength(8);
        expect(/^\d{8}$/.test(senha)).toBe(true);
      });
    });
  });
});
