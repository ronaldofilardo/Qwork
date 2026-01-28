/**
 * Testes para utilitários de CPF - Conformidade LGPD
 */

import {
  validarCPF,
  mascararCPF,
  mascararCPFParaLog,
  formatarCPF,
  limparCPF,
  validarELimparCPF,
  gerarIdentificadorAnonimo,
  prepararLogAuditoria,
  validarEmail,
  sanitizarNome,
} from '@/lib/cpf-utils';

describe('CPF Utils - LGPD Compliance', () => {
  describe('validarCPF', () => {
    it('deve validar CPF válido', () => {
      expect(validarCPF('123.456.789-09')).toBe(true);
      expect(validarCPF('12345678909')).toBe(true);
      expect(validarCPF('529.982.247-25')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validarCPF('123.456.789-00')).toBe(false);
      expect(validarCPF('11111111111')).toBe(false);
      expect(validarCPF('123')).toBe(false);
      expect(validarCPF('')).toBe(false);
      expect(validarCPF('abc')).toBe(false);
    });

    it('deve rejeitar CPFs conhecidos como inválidos', () => {
      const cpfsInvalidos = [
        '00000000000',
        '11111111111',
        '22222222222',
        '33333333333',
        '44444444444',
        '55555555555',
        '66666666666',
        '77777777777',
        '88888888888',
        '99999999999',
      ];

      cpfsInvalidos.forEach((cpf) => {
        expect(validarCPF(cpf)).toBe(false);
      });
    });
  });

  describe('mascararCPF', () => {
    it('deve mascarar CPF corretamente', () => {
      expect(mascararCPF('12345678909')).toBe('***.***.*89-09');
      expect(mascararCPF('123.456.789-09')).toBe('***.***.*89-09');
    });

    it('deve retornar máscara padrão para CPF inválido', () => {
      expect(mascararCPF('123')).toBe('***.***.***-**');
      expect(mascararCPF('')).toBe('***.***.***-**');
    });
  });

  describe('mascararCPFParaLog', () => {
    it('deve mascarar CPF para logs', () => {
      expect(mascararCPFParaLog('12345678909')).toBe('*******8909');
      expect(mascararCPFParaLog('123.456.789-09')).toBe('*******8909');
    });

    it('deve retornar máscara padrão para CPF inválido', () => {
      expect(mascararCPFParaLog('123')).toBe('*******0000');
      expect(mascararCPFParaLog('')).toBe('*******0000');
    });
  });

  describe('formatarCPF', () => {
    it('deve formatar CPF corretamente', () => {
      expect(formatarCPF('12345678909')).toBe('123.456.789-09');
    });

    it('deve retornar CPF original se inválido', () => {
      expect(formatarCPF('123')).toBe('123');
      expect(formatarCPF('')).toBe('');
    });
  });

  describe('limparCPF', () => {
    it('deve remover formatação do CPF', () => {
      expect(limparCPF('123.456.789-09')).toBe('12345678909');
      expect(limparCPF('123 456 789 09')).toBe('12345678909');
      expect(limparCPF('')).toBe('');
    });
  });

  describe('validarELimparCPF', () => {
    it('deve validar e limpar CPF válido', () => {
      expect(validarELimparCPF('123.456.789-09')).toBe('12345678909');
      expect(validarELimparCPF('12345678909')).toBe('12345678909');
    });

    it('deve retornar null para CPF inválido', () => {
      expect(validarELimparCPF('123.456.789-00')).toBe(null);
      expect(validarELimparCPF('11111111111')).toBe(null);
      expect(validarELimparCPF('')).toBe(null);
    });
  });

  describe('gerarIdentificadorAnonimo', () => {
    it('deve gerar identificador anônimo', () => {
      const id1 = gerarIdentificadorAnonimo('12345678909');
      const id2 = gerarIdentificadorAnonimo('12345678909');
      const id3 = gerarIdentificadorAnonimo('52998224725');

      expect(id1).toMatch(/^ANON\d{8}$/);
      expect(id2).toBe(id1); // Mesmo CPF deve gerar mesmo ID
      expect(id3).not.toBe(id1); // CPF diferente deve gerar ID diferente
    });

    it('deve retornar padrão para CPF vazio', () => {
      expect(gerarIdentificadorAnonimo('')).toBe('ANON0000');
    });
  });

  describe('prepararLogAuditoria', () => {
    it('deve preparar dados para auditoria', () => {
      const log = prepararLogAuditoria(
        '12345678909',
        'acesso_dados',
        '192.168.1.1',
        'consentimento'
      );

      expect(log.cpf_mascarado).toBe('*******8909');
      expect(log.acao).toBe('acesso_dados');
      expect(log.ip_origem).toBe('192.168.1.1');
      expect(log.base_legal).toBe('consentimento');
      expect(log.data_acesso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('validarEmail', () => {
    it('deve validar email válido', () => {
      expect(validarEmail('teste@example.com')).toBe(true);
      expect(validarEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      expect(validarEmail('')).toBe(false);
      expect(validarEmail('invalid-email')).toBe(false);
      expect(validarEmail('test@')).toBe(false);
      expect(validarEmail('@example.com')).toBe(false);
    });

    it('deve rejeitar email muito longo', () => {
      const longEmail = 'a'.repeat(90) + '@example.com';
      expect(validarEmail(longEmail)).toBe(false);
    });
  });

  describe('sanitizarNome', () => {
    it('deve sanitizar nome corretamente', () => {
      expect(sanitizarNome('João Silva')).toBe('João Silva');
      expect(sanitizarNome('  Maria Santos  ')).toBe('Maria Santos');
    });

    it('deve remover caracteres perigosos', () => {
      expect(sanitizarNome('João <script>')).toBe('João script');
      expect(sanitizarNome('Maria > Silva')).toBe('Maria  Silva');
    });

    it('deve limitar tamanho', () => {
      const longName = 'A'.repeat(150);
      expect(sanitizarNome(longName)).toHaveLength(100);
    });

    it('deve retornar vazio para entrada vazia', () => {
      expect(sanitizarNome('')).toBe('');
    });
  });
});
