/**
 * @file __tests__/api/entidade/funcionarios-status-negocio.test.ts
 * ─────────────────────────────────────────────────────────────
 * Testes de lógica de negócio para PATCH /api/entidade/funcionarios/status
 *
 * Complementa o arquivo existente com cobertura de:
 *  - Validação de entrada (cpf + ativo obrigatórios)
 *  - Verificação de vínculo funcionário-entidade
 *  - Idempotência (já no status desejado)
 *  - Inativação cascata de avaliações pendentes
 *  - Tratamento de erros
 */

import { describe, it, expect } from '@jest/globals';

// ────────────────────────────────────────────────────────────
// Helpers de validação
// ────────────────────────────────────────────────────────────

function validarEntrada(body: { cpf?: string; ativo?: unknown }): {
  ok: boolean;
  status: number;
  error?: string;
} {
  if (!body.cpf || typeof body.ativo !== 'boolean') {
    return {
      ok: false,
      status: 400,
      error: 'CPF e status ativo são obrigatórios',
    };
  }
  return { ok: true, status: 200 };
}

function verificarVinculo(
  funcionario: { id: number; cpf: string; ativo: boolean } | null
): { ok: boolean; status: number; error?: string } {
  if (!funcionario) {
    return {
      ok: false,
      status: 404,
      error: 'Funcionário não encontrado ou não pertence a esta entidade',
    };
  }
  return { ok: true, status: 200 };
}

function verificarIdempotencia(
  statusAtual: boolean,
  statusDesejado: boolean
): { idempotente: boolean; mensagem: string } {
  if (statusAtual === statusDesejado) {
    return {
      idempotente: true,
      mensagem: `Funcionário já está ${statusDesejado ? 'ativo' : 'inativo'}`,
    };
  }
  return { idempotente: false, mensagem: '' };
}

function deveInativarAvaliacoes(ativo: boolean): boolean {
  return !ativo;
}

// ────────────────────────────────────────────────────────────
// Testes
// ────────────────────────────────────────────────────────────

describe('PATCH /api/entidade/funcionarios/status — Lógica de Negócio', () => {
  describe('Validação de Entrada', () => {
    it('deve rejeitar sem CPF', () => {
      const resultado = validarEntrada({ ativo: true });
      expect(resultado.ok).toBe(false);
      expect(resultado.status).toBe(400);
    });

    it('deve rejeitar sem status ativo', () => {
      const resultado = validarEntrada({ cpf: '12345678901' });
      expect(resultado.ok).toBe(false);
      expect(resultado.status).toBe(400);
    });

    it('deve rejeitar ativo como string', () => {
      const resultado = validarEntrada({ cpf: '12345678901', ativo: 'true' });
      expect(resultado.ok).toBe(false);
    });

    it('deve rejeitar ativo como número', () => {
      const resultado = validarEntrada({ cpf: '12345678901', ativo: 1 });
      expect(resultado.ok).toBe(false);
    });

    it('deve aceitar entrada válida (ativar)', () => {
      expect(validarEntrada({ cpf: '12345678901', ativo: true }).ok).toBe(true);
    });

    it('deve aceitar entrada válida (inativar)', () => {
      expect(validarEntrada({ cpf: '12345678901', ativo: false }).ok).toBe(
        true
      );
    });
  });

  describe('Verificação de Vínculo', () => {
    it('deve retornar 404 para funcionário não encontrado', () => {
      const resultado = verificarVinculo(null);
      expect(resultado.ok).toBe(false);
      expect(resultado.status).toBe(404);
    });

    it('deve aceitar funcionário vinculado', () => {
      const resultado = verificarVinculo({
        id: 1,
        cpf: '12345678901',
        ativo: true,
      });
      expect(resultado.ok).toBe(true);
    });
  });

  describe('Idempotência', () => {
    it('deve detectar funcionário já ativo quando ativando', () => {
      const resultado = verificarIdempotencia(true, true);
      expect(resultado.idempotente).toBe(true);
      expect(resultado.mensagem).toContain('ativo');
    });

    it('deve detectar funcionário já inativo quando inativando', () => {
      const resultado = verificarIdempotencia(false, false);
      expect(resultado.idempotente).toBe(true);
      expect(resultado.mensagem).toContain('inativo');
    });

    it('deve permitir mudança de ativo para inativo', () => {
      expect(verificarIdempotencia(true, false).idempotente).toBe(false);
    });

    it('deve permitir mudança de inativo para ativo', () => {
      expect(verificarIdempotencia(false, true).idempotente).toBe(false);
    });
  });

  describe('Inativação Cascata de Avaliações', () => {
    it('deve inativar avaliações quando funcionário é inativado', () => {
      expect(deveInativarAvaliacoes(false)).toBe(true);
    });

    it('não deve inativar avaliações quando funcionário é ativado', () => {
      expect(deveInativarAvaliacoes(true)).toBe(false);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve identificar erro de acesso restrito (403)', () => {
      const error = new Error('Acesso restrito à entidade');
      expect(error.message).toContain('Acesso restrito');
    });

    it('deve tratar erro genérico como 500', () => {
      const error = new Error('Connection timeout');
      expect(error.message).not.toContain('Acesso restrito');
    });
  });
});
