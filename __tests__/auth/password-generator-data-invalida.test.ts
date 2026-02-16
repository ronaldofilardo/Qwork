/**
 * 🧪 TESTES COMPLETOS - Validação de Datas Impossíveis
 *
 * Esses testes devem ser ADICIONADOS ao arquivo:
 * __tests__/auth/password-generator.test.ts
 *
 * Eles validam que o gerador rejeita datas impossíveis.
 */

import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

describe('gerarSenhaDeNascimento - VALIDAÇÃO DE DATAS IMPOSSÍVEIS (CRÍTICO)', () => {
  describe('❌ Rejeitar Fevereiro com 31 dias', () => {
    it('deve rejeitar 31/02 em qualquer ano', () => {
      expect(() => gerarSenhaDeNascimento('31/02/1990')).toThrow();
      expect(() => gerarSenhaDeNascimento('31/02/2000')).toThrow();
      expect(() => gerarSenhaDeNascimento('31/02/1950')).toThrow();
      expect(() => gerarSenhaDeNascimento('31021990')).toThrow();
      expect(() => gerarSenhaDeNascimento('31022000')).toThrow();
    });

    it('deve rejeitar 30/02 em anos não-bissextos', () => {
      expect(() => gerarSenhaDeNascimento('30/02/1990')).toThrow();
      expect(() => gerarSenhaDeNascimento('30/02/1900')).toThrow();
      expect(() => gerarSenhaDeNascimento('30021990')).toThrow();
    });

    it('deve rejeitar 29/02 em anos não-bissextos', () => {
      // 1900 não é bissexto
      expect(() => gerarSenhaDeNascimento('29/02/1900')).toThrow();
      expect(() => gerarSenhaDeNascimento('1900-02-29')).toThrow();
      expect(() => gerarSenhaDeNascimento('29021900')).toThrow();

      // 2100 não é bissexto (múltiplo de 100 mas não de 400)
      expect(() => gerarSenhaDeNascimento('29/02/2100')).toThrow();

      // Outros anos não-bissextos
      expect(() => gerarSenhaDeNascimento('29/02/1991')).toThrow();
      expect(() => gerarSenhaDeNascimento('29/02/2001')).toThrow();
    });
  });

  describe('✅ Aceitar 29/02 em anos BISSEXTOS', () => {
    it('deve aceitar 29/02 em anos bissextos', () => {
      expect(() => gerarSenhaDeNascimento('29/02/2000')).not.toThrow();
      expect(gerarSenhaDeNascimento('29/02/2000')).toBe('29022000');

      expect(() => gerarSenhaDeNascimento('29/02/2004')).not.toThrow();
      expect(gerarSenhaDeNascimento('29/02/2004')).toBe('29022004');

      expect(() => gerarSenhaDeNascimento('29/02/1984')).not.toThrow();
      expect(gerarSenhaDeNascimento('1984-02-29')).toBe('29021984');

      expect(() => gerarSenhaDeNascimento('29021972')).not.toThrow();
      expect(gerarSenhaDeNascimento('29021972')).toBe('29021972');
    });
  });

  describe('❌ Rejeitar meses com máximo de 30 dias (31 dias)', () => {
    const mesesCom30Dias = [
      { num: '04', nome: 'Abril' },
      { num: '06', nome: 'Junho' },
      { num: '09', nome: 'Setembro' },
      { num: '11', nome: 'Novembro' },
    ];

    mesesCom30Dias.forEach(({ num, nome }) => {
      it(`deve rejeitar 31/${num} (${nome} tem 30 dias)`, () => {
        expect(() => gerarSenhaDeNascimento(`31/${num}/1990`)).toThrow();
        expect(() => gerarSenhaDeNascimento(`1990-${num}-31`)).toThrow();
        expect(() => gerarSenhaDeNascimento(`31${num}1990`)).toThrow();
      });
    });
  });

  describe('❌ Rejeitar dia 0 e valores inválidos', () => {
    it('deve rejeitar dia 0', () => {
      expect(() => gerarSenhaDeNascimento('00/01/1990')).toThrow();
      expect(() => gerarSenhaDeNascimento('1990-01-00')).toThrow();
      expect(() => gerarSenhaDeNascimento('00011990')).toThrow();
    });

    it('deve rejeitar dia 32 ou maior', () => {
      expect(() => gerarSenhaDeNascimento('32/01/1990')).toThrow();
      expect(() => gerarSenhaDeNascimento('1990-01-32')).toThrow();
      expect(() => gerarSenhaDeNascimento('32011990')).toThrow();
      expect(() => gerarSenhaDeNascimento('99/01/1990')).toThrow();
    });
  });

  describe('❌ Rejeitar mês 0 e mês > 12', () => {
    it('deve rejeitar mês 0', () => {
      expect(() => gerarSenhaDeNascimento('15/00/1990')).toThrow();
      expect(() => gerarSenhaDeNascimento('1990-00-15')).toThrow();
      expect(() => gerarSenhaDeNascimento('15001990')).toThrow();
    });

    it('deve rejeitar mês 13 e maiores', () => {
      expect(() => gerarSenhaDeNascimento('15/13/1990')).toThrow();
      expect(() => gerarSenhaDeNascimento('1990-13-15')).toThrow();
      expect(() => gerarSenhaDeNascimento('15131990')).toThrow();
      expect(() => gerarSenhaDeNascimento('15/99/1990')).toThrow();
    });
  });

  describe('✅ Aceitar datas válidas em todos os meses', () => {
    const diasValidosParaCadaMes = {
      '01': 31, // Janeiro
      '02': 28, // Fevereiro (não-bissexto)
      '03': 31, // Março
      '04': 30, // Abril
      '05': 31, // Maio
      '06': 30, // Junho
      '07': 31, // Julho
      '08': 31, // Agosto
      '09': 30, // Setembro
      '10': 31, // Outubro
      '11': 30, // Novembro
      '12': 31, // Dezembro
    };

    Object.entries(diasValidosParaCadaMes).forEach(([mes, maxDia]) => {
      it(`deve aceitar último dia válido do mês ${mes} (dia ${maxDia})`, () => {
        const data = `${String(maxDia).padStart(2, '0')}/${mes}/1990`;
        expect(() => gerarSenhaDeNascimento(data)).not.toThrow();
      });

      if (maxDia < 31) {
        it(`deve rejeitar dia 31 do mês ${mes}`, () => {
          const data = `31/${mes}/1990`;
          expect(() => gerarSenhaDeNascimento(data)).toThrow();
        });
      }
    });
  });

  describe('❌ Rejeitar ano 0 e anos inválidos', () => {
    it('deve rejeitar ano 0000', () => {
      expect(() => gerarSenhaDeNascimento('15/01/0000')).toThrow();
      expect(() => gerarSenhaDeNascimento('0000-01-15')).toThrow();
      expect(() => gerarSenhaDeNascimento('15010000')).toThrow();
    });

    it('deve rejeitar ano anterior a 1900', () => {
      expect(() => gerarSenhaDeNascimento('15/01/1899')).toThrow();
      expect(() => gerarSenhaDeNascimento('1899-01-15')).toThrow();
      expect(() => gerarSenhaDeNascimento('15011899')).toThrow();
    });

    it('deve rejeitar ano no futuro', () => {
      const proximoAno = new Date().getFullYear() + 1;
      expect(() => gerarSenhaDeNascimento(`15/01/${proximoAno}`)).toThrow();
    });
  });

  describe('🔍 Detecção de Formato - Ambiguidade', () => {
    it('deve interpretar corretamente YYYYMMDD vs DDMMYYYY', () => {
      // 20011223 começa com 2001 (ano válido) → assume YYYYMMDD
      // Resultado: 2001/12/23 → 23121990 ❌ NÃO! 23/12/2001!
      const senha1 = gerarSenhaDeNascimento('20011223');
      expect(senha1).toBe('23122001'); // YYYYMMDD interpretado corretamente

      // 23122001 começa com 2312 (ano > atual) → assume DDMMYYYY
      const senha2 = gerarSenhaDeNascimento('23122001');
      expect(senha2).toBe('23122001'); // DDMMYYYY interpretado corretamente
    });

    it('deve rejeitar formato 8 dígitos que seja ambíguo E inválido', () => {
      // 19900229 (data impossível)
      // Se for YYYYMMDD: 1990/02/29 - inválido (1990 não é bissexto)
      // Se for DDMMYYYY: 19/09/0229 - ano inválido
      expect(() => gerarSenhaDeNascimento('19900229')).toThrow();
    });
  });

  describe('📝 Casos de Uso Reais', () => {
    it('Cenário: Funcionário nascido em 15/03/1984', () => {
      expect(gerarSenhaDeNascimento('15/03/1984')).toBe('15031984');
      expect(gerarSenhaDeNascimento('1984-03-15')).toBe('15031984');
      expect(gerarSenhaDeNascimento('15031984')).toBe('15031984');
    });

    it('Cenário: Funcionário nascido em 29/02/2000 (bissexto)', () => {
      expect(gerarSenhaDeNascimento('29/02/2000')).toBe('29022000');
      expect(gerarSenhaDeNascimento('2000-02-29')).toBe('29022000');
      expect(gerarSenhaDeNascimento('29022000')).toBe('29022000');
    });

    it('Cenário: Tentativa de hack com 31/02/1990', () => {
      expect(() => gerarSenhaDeNascimento('31/02/1990')).toThrow();
      expect(() => gerarSenhaDeNascimento('31021990')).toThrow();
    });
  });

  describe('🔒 Segurança - Rejeição de Valores Malformados', () => {
    it('deve rejeitar valores não-numéricos', () => {
      expect(() => gerarSenhaDeNascimento('XX/XX/XXXX')).toThrow();
      expect(() => gerarSenhaDeNascimento('abc')).toThrow();
      expect(() => gerarSenhaDeNascimento('null')).toThrow();
    });

    it('deve rejeitar valores vazios ou undefined', () => {
      expect(() => gerarSenhaDeNascimento('')).toThrow();
      expect(() => gerarSenhaDeNascimento('   ')).toThrow();
    });

    it('deve rejeitar valores com comprimento incorreto (formato 8 dígitos)', () => {
      expect(() => gerarSenhaDeNascimento('1234567')).toThrow(); // 7 dígitos
      expect(() => gerarSenhaDeNascimento('123456789')).toThrow(); // 9 dígitos
      expect(() => gerarSenhaDeNascimento('12345')).toThrow(); // 5 dígitos
    });
  });
});
