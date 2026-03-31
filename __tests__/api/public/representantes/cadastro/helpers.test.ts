/**
 * @file __tests__/api/public/representantes/cadastro/helpers.test.ts
 * Testes: helpers de cadastro — validadores puros e validarArquivo
 */

import {
  validarCPF,
  validarCNPJ,
  validarEmail,
  sanitizarString,
  limparNumeros,
} from '@/app/api/public/representantes/cadastro/helpers';

// ── validarCPF ─────────────────────────────────────────────────────────────────

describe('validarCPF', () => {
  it('deve aceitar CPF válido sem formatação', () => {
    expect(validarCPF('52998224725')).toBe(true);
  });

  it('deve aceitar CPF válido com máscara', () => {
    expect(validarCPF('529.982.247-25')).toBe(true);
  });

  it('deve rejeitar CPF com dígitos todos iguais', () => {
    expect(validarCPF('11111111111')).toBe(false);
    expect(validarCPF('00000000000')).toBe(false);
    expect(validarCPF('99999999999')).toBe(false);
  });

  it('deve rejeitar CPF com menos de 11 dígitos', () => {
    expect(validarCPF('1234567890')).toBe(false);
  });

  it('deve rejeitar CPF com dígito verificador errado', () => {
    expect(validarCPF('52998224726')).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(validarCPF('')).toBe(false);
  });
});

// ── validarCNPJ ────────────────────────────────────────────────────────────────

describe('validarCNPJ', () => {
  it('deve aceitar CNPJ válido sem formatação', () => {
    expect(validarCNPJ('11222333000181')).toBe(true);
  });

  it('deve aceitar CNPJ válido com máscara', () => {
    expect(validarCNPJ('11.222.333/0001-81')).toBe(true);
  });

  it('deve rejeitar CNPJ com dígitos todos iguais', () => {
    expect(validarCNPJ('00000000000000')).toBe(false);
    expect(validarCNPJ('11111111111111')).toBe(false);
  });

  it('deve rejeitar CNPJ com menos de 14 dígitos', () => {
    expect(validarCNPJ('1234567890123')).toBe(false);
  });

  it('deve rejeitar CNPJ com dígito verificador errado', () => {
    expect(validarCNPJ('11222333000182')).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(validarCNPJ('')).toBe(false);
  });
});

// ── validarEmail ───────────────────────────────────────────────────────────────

describe('validarEmail', () => {
  it('deve aceitar email válido', () => {
    expect(validarEmail('usuario@exemplo.com')).toBe(true);
  });

  it('deve aceitar email com subdomínio', () => {
    expect(validarEmail('user@mail.empresa.com.br')).toBe(true);
  });

  it('deve rejeitar email sem @', () => {
    expect(validarEmail('usuarioexemplo.com')).toBe(false);
  });

  it('deve rejeitar email sem domínio', () => {
    expect(validarEmail('usuario@')).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(validarEmail('')).toBe(false);
  });

  it('deve rejeitar email com mais de 200 caracteres', () => {
    const longo = 'a'.repeat(190) + '@exemplo.com';
    expect(validarEmail(longo)).toBe(false);
  });

  it('deve rejeitar email com espaços', () => {
    expect(validarEmail('usuario @exemplo.com')).toBe(false);
  });
});

// ── sanitizarString ────────────────────────────────────────────────────────────

describe('sanitizarString', () => {
  it('deve remover espaços no início e fim', () => {
    expect(sanitizarString('  João Silva  ')).toBe('João Silva');
  });

  it('deve remover caracteres < e >', () => {
    expect(sanitizarString('<script>alert(1)</script>')).toBe(
      'scriptalert(1)/script'
    );
  });

  it('deve preservar texto normal sem modificação', () => {
    expect(sanitizarString('Nome Válido')).toBe('Nome Válido');
  });

  it('deve retornar string vazia se entrada for vazia', () => {
    expect(sanitizarString('')).toBe('');
  });
});

// ── limparNumeros ──────────────────────────────────────────────────────────────

describe('limparNumeros', () => {
  it('deve remover todos os não-dígitos de CPF formatado', () => {
    expect(limparNumeros('123.456.789-09')).toBe('12345678909');
  });

  it('deve remover todos os não-dígitos de CNPJ formatado', () => {
    expect(limparNumeros('12.345.678/0001-95')).toBe('12345678000195');
  });

  it('deve remover espaços e traços', () => {
    expect(limparNumeros('(11) 9 8765-4321')).toBe('11987654321');
  });

  it('deve retornar string vazia se não houver dígitos', () => {
    expect(limparNumeros('abc-xyz')).toBe('');
  });

  it('deve preservar string já limpa', () => {
    expect(limparNumeros('12345')).toBe('12345');
  });
});
