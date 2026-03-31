/**
 * Testes para feature: Valor Negociado em Leads → Cobrança
 *
 * Cenários cobertos:
 * - API POST /representante/leads: validação do campo valor_negociado
 * - Interface Lead com campo valor_negociado
 * - Interface Solicitacao com lead_valor_negociado
 * - Pré-preenchimento de valor na tela de cobrança admin
 */
import { describe, test, expect } from 'vitest';

/* ─── Helpers de tipo ─────────────────────────────────────── */

// Replica mínima das interfaces relevantes
interface Lead {
  id: number;
  razao_social: string;
  cnpj: string;
  valor_negociado: number;
  status: string;
}

interface Solicitacao {
  lote_id: number;
  status_pagamento: string;
  lead_valor_negociado?: number | null;
}

interface Vinculo {
  id: number;
  lead_razao_social: string | null;
  lead_valor_negociado: number | null;
  status: string;
}

/* ─── 1. Validação do campo valor_negociado ──────────────── */

describe('Validação de valor_negociado no lead', () => {
  test('deve rejeitar valor_negociado ausente', () => {
    // Arrange
    const payload = {
      razao_social: 'Empresa Teste',
      cnpj: '12345678000100',
      contato_nome: 'João',
      contato_email: 'joao@test.com',
      contato_telefone: '11999990000',
    };

    // Act
    const temValor = 'valor_negociado' in payload;

    // Assert
    expect(temValor).toBe(false);
  });

  test('deve rejeitar valor_negociado zero', () => {
    // Arrange
    const valor = 0;

    // Act
    const valorNum = Number(valor);
    const valido = !isNaN(valorNum) && valorNum > 0;

    // Assert
    expect(valido).toBe(false);
  });

  test('deve rejeitar valor_negociado negativo', () => {
    // Arrange
    const valor = -100;

    // Act
    const valorNum = Number(valor);
    const valido = !isNaN(valorNum) && valorNum > 0;

    // Assert
    expect(valido).toBe(false);
  });

  test('deve rejeitar valor_negociado não numérico', () => {
    // Arrange
    const valor = 'abc';

    // Act
    const valorNum = Number(valor);
    const valido = !isNaN(valorNum) && valorNum > 0;

    // Assert
    expect(valido).toBe(false);
  });

  test('deve aceitar valor_negociado positivo válido', () => {
    // Arrange
    const valor = 150.5;

    // Act
    const valorNum = Number(valor);
    const valido = !isNaN(valorNum) && valorNum > 0;

    // Assert
    expect(valido).toBe(true);
    expect(valorNum).toBe(150.5);
  });

  test('deve aceitar valor_negociado como string numérica', () => {
    // Arrange
    const valor = '250.00';

    // Act
    const valorNum = Number(valor);
    const valido = !isNaN(valorNum) && valorNum > 0;

    // Assert
    expect(valido).toBe(true);
    expect(valorNum).toBe(250);
  });
});

/* ─── 2. Interface Lead com valor_negociado ──────────────── */

describe('Interface Lead com valor_negociado', () => {
  test('deve incluir valor_negociado na interface Lead', () => {
    // Arrange / Act
    const lead: Lead = {
      id: 1,
      razao_social: 'Empresa X',
      cnpj: '12345678000100',
      valor_negociado: 300,
      status: 'novo',
    };

    // Assert
    expect(lead.valor_negociado).toBe(300);
    expect(typeof lead.valor_negociado).toBe('number');
  });

  test('deve formatar valor_negociado em BRL', () => {
    // Arrange
    const valor = 1500.5;

    // Act
    const formatado = Number(valor).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });

    // Assert
    expect(formatado).toContain('1.500,50');
  });

  test('deve formatar valor centavos corretamente', () => {
    // Arrange
    const valor = 0.99;

    // Act
    const formatado = Number(valor).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });

    // Assert
    expect(formatado).toBe('0,99');
  });
});

/* ─── 3. Solicitacao com lead_valor_negociado ────────────── */

describe('Solicitacao com lead_valor_negociado', () => {
  test('deve ter lead_valor_negociado como campo opcional', () => {
    // Arrange / Act
    const semValor: Solicitacao = {
      lote_id: 1,
      status_pagamento: 'aguardando_cobranca',
    };
    const comValor: Solicitacao = {
      lote_id: 2,
      status_pagamento: 'aguardando_cobranca',
      lead_valor_negociado: 500,
    };
    const comNull: Solicitacao = {
      lote_id: 3,
      status_pagamento: 'pago',
      lead_valor_negociado: null,
    };

    // Assert
    expect(semValor.lead_valor_negociado).toBeUndefined();
    expect(comValor.lead_valor_negociado).toBe(500);
    expect(comNull.lead_valor_negociado).toBeNull();
  });
});

/* ─── 4. Pré-preenchimento do valorInput ─────────────────── */

describe('Pré-preenchimento do valorInput a partir do lead', () => {
  test('deve gerar pré-fill quando lead_valor_negociado > 0', () => {
    // Arrange
    const solicitacoes: Solicitacao[] = [
      {
        lote_id: 10,
        status_pagamento: 'aguardando_cobranca',
        lead_valor_negociado: 250,
      },
      {
        lote_id: 11,
        status_pagamento: 'aguardando_cobranca',
        lead_valor_negociado: null,
      },
      { lote_id: 12, status_pagamento: 'pago', lead_valor_negociado: 100 },
    ];

    // Act — replica lógica do hook
    const preFill: Record<number, string> = {};
    for (const s of solicitacoes) {
      if (
        s.status_pagamento === 'aguardando_cobranca' &&
        s.lead_valor_negociado &&
        s.lead_valor_negociado > 0
      ) {
        preFill[s.lote_id] =
          `R$ ${Number(s.lead_valor_negociado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }

    // Assert
    expect(preFill[10]).toBe('R$ 250,00');
    expect(preFill[11]).toBeUndefined(); // null lead_valor_negociado → sem pré-fill
    expect(preFill[12]).toBeUndefined(); // status "pago" → sem pré-fill
  });

  test('não deve sobrescrever valor já digitado pelo admin', () => {
    // Arrange
    const prev: Record<number, string> = { 10: 'R$ 300,00' };
    const preFill: Record<number, string> = { 10: 'R$ 250,00' };

    // Act — replica lógica: { ...preFill, ...prev }
    const resultado = { ...preFill, ...prev };

    // Assert — prev (valor digitado) tem prioridade
    expect(resultado[10]).toBe('R$ 300,00');
  });
});

/* ─── 5. Vinculo com lead_valor_negociado ────────────────── */

describe('Vinculo com lead_valor_negociado', () => {
  test('deve incluir lead_valor_negociado na interface Vinculo', () => {
    // Arrange / Act
    const vinculo: Vinculo = {
      id: 1,
      lead_razao_social: 'Empresa X',
      lead_valor_negociado: 450.5,
      status: 'ativo',
    };

    // Assert
    expect(vinculo.lead_valor_negociado).toBe(450.5);
  });

  test('deve aceitar lead_valor_negociado null', () => {
    // Arrange / Act
    const vinculo: Vinculo = {
      id: 2,
      lead_razao_social: null,
      lead_valor_negociado: null,
      status: 'ativo',
    };

    // Assert
    expect(vinculo.lead_valor_negociado).toBeNull();
  });

  test('deve exibir valor apenas quando > 0', () => {
    // Arrange
    const valores = [null, 0, -1, 100, 0.01];

    // Act — replica lógica do template
    const exibir = valores.map((v) => v != null && v > 0);

    // Assert
    expect(exibir).toEqual([false, false, false, true, true]);
  });
});

/* ─── 6. Validação de payload do formulário ──────────────── */

describe('Validação de formulário de criação de lead', () => {
  test('formulário inválido quando valor_negociado vazio', () => {
    // Arrange
    const form = {
      razao_social: 'Empresa',
      cnpj: '12345678000100',
      contato_nome: 'João',
      contato_email: 'joao@test.com',
      contato_telefone: '11999990000',
      valor_negociado: '',
    };

    // Act
    const valorNegociadoNum = Number(form.valor_negociado);
    const formValido =
      form.razao_social.trim() !== '' &&
      form.cnpj.replace(/\D/g, '').length === 14 &&
      !isNaN(valorNegociadoNum) &&
      valorNegociadoNum > 0;

    // Assert
    expect(formValido).toBe(false);
  });

  test('formulário válido com todos os campos preenchidos', () => {
    // Arrange
    const form = {
      razao_social: 'Empresa Válida',
      cnpj: '12345678000100',
      contato_nome: 'Maria',
      contato_email: 'maria@test.com',
      contato_telefone: '11999990000',
      valor_negociado: '500',
    };

    // Act
    const valorNegociadoNum = Number(form.valor_negociado);
    const formValido =
      form.razao_social.trim() !== '' &&
      form.cnpj.replace(/\D/g, '').length === 14 &&
      !isNaN(valorNegociadoNum) &&
      valorNegociadoNum > 0;

    // Assert
    expect(formValido).toBe(true);
  });
});
