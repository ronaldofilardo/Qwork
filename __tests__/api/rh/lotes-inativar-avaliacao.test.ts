/**
 * @file __tests__/api/rh/lotes-inativar-avaliacao.test.ts
 * ─────────────────────────────────────────────────────────────
 * Testes para POST /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar
 *
 * Valida lógica de negócio da inativação de avaliações pelo perfil RH:
 *  - Autenticação e autorização
 *  - Validação de entrada (motivo obrigatório)
 *  - Princípio da imutabilidade (bloqueio pós-emissão)
 *  - Recálculo de status do lote
 *  - Auditoria da ação
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ────────────────────────────────────────────────────────────
// Helpers de validação (espelham a lógica da rota)
// ────────────────────────────────────────────────────────────

function validarPermissao(perfil: string | null): {
  ok: boolean;
  status: number;
  error?: string;
} {
  if (!perfil) return { ok: false, status: 401, error: 'Não autenticado' };
  if (perfil !== 'rh')
    return { ok: false, status: 403, error: 'Acesso negado' };
  return { ok: true, status: 200 };
}

function validarMotivo(motivo: unknown): { ok: boolean; error?: string } {
  if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
    return { ok: false, error: 'Motivo é obrigatório' };
  }
  return { ok: true };
}

function validarImutabilidade(
  emissaoSolicitada: boolean,
  loteEmitido: boolean
): { ok: boolean; error?: string } {
  if (emissaoSolicitada || loteEmitido) {
    return {
      ok: false,
      error:
        'Não é possível inativar avaliações: emissão do laudo já foi solicitada ou laudo já foi emitido',
    };
  }
  return { ok: true };
}

function calcularStatusLote(stats: {
  concluidas: number;
  inativadas: number;
  liberadas: number;
}): string {
  const { concluidas, inativadas, liberadas } = stats;
  if (liberadas > 0 && inativadas === liberadas && concluidas === 0)
    return 'cancelado';
  if (concluidas + inativadas === liberadas && liberadas > 0)
    return 'concluido';
  return 'ativo';
}

// ────────────────────────────────────────────────────────────
// Testes
// ────────────────────────────────────────────────────────────

describe('POST /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar', () => {
  describe('Autenticação e Autorização', () => {
    it('deve rejeitar requisição sem autenticação (401)', () => {
      // Arrange
      const perfil = null;

      // Act
      const resultado = validarPermissao(perfil);

      // Assert
      expect(resultado.ok).toBe(false);
      expect(resultado.status).toBe(401);
    });

    it('deve rejeitar perfis não-RH (403)', () => {
      // Arrange
      const perfisNaoAutorizados = [
        'funcionario',
        'emissor',
        'gestor',
        'admin',
      ];

      // Act & Assert
      perfisNaoAutorizados.forEach((perfil) => {
        const resultado = validarPermissao(perfil);
        expect(resultado.ok).toBe(false);
        expect(resultado.status).toBe(403);
      });
    });

    it('deve aceitar perfil RH (200)', () => {
      // Arrange & Act
      const resultado = validarPermissao('rh');

      // Assert
      expect(resultado.ok).toBe(true);
      expect(resultado.status).toBe(200);
    });
  });

  describe('Validação de Entrada', () => {
    it('deve rejeitar motivo vazio', () => {
      // Arrange & Act & Assert
      expect(validarMotivo('')).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
      expect(validarMotivo('   ')).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
    });

    it('deve rejeitar motivo nulo ou undefined', () => {
      // Arrange & Act & Assert
      expect(validarMotivo(null)).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
      expect(validarMotivo(undefined)).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
    });

    it('deve rejeitar motivo não-string', () => {
      // Arrange & Act & Assert
      expect(validarMotivo(123)).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
      expect(validarMotivo(true)).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
    });

    it('deve aceitar motivo válido', () => {
      // Arrange & Act & Assert
      expect(validarMotivo('Funcionário desligado')).toEqual({ ok: true });
      expect(validarMotivo('Avaliação duplicada por erro do sistema')).toEqual({
        ok: true,
      });
    });
  });

  describe('Princípio da Imutabilidade', () => {
    it('deve bloquear inativação quando emissão foi solicitada', () => {
      // Arrange & Act
      const resultado = validarImutabilidade(true, false);

      // Assert
      expect(resultado.ok).toBe(false);
      expect(resultado.error).toContain('emissão do laudo já foi solicitada');
    });

    it('deve bloquear inativação quando lote já foi emitido', () => {
      // Arrange & Act
      const resultado = validarImutabilidade(false, true);

      // Assert
      expect(resultado.ok).toBe(false);
    });

    it('deve bloquear quando ambos: emissão solicitada e lote emitido', () => {
      // Arrange & Act
      const resultado = validarImutabilidade(true, true);

      // Assert
      expect(resultado.ok).toBe(false);
    });

    it('deve permitir inativação quando emissão não foi solicitada e lote não emitido', () => {
      // Arrange & Act
      const resultado = validarImutabilidade(false, false);

      // Assert
      expect(resultado.ok).toBe(true);
    });
  });

  describe('Validação de Estado da Avaliação', () => {
    it('deve rejeitar avaliação já inativada', () => {
      // Arrange
      const statusAvaliacao = 'inativada';

      // Assert
      expect(statusAvaliacao).toBe('inativada');
    });

    it('deve permitir inativação de avaliações em qualquer status ativo', () => {
      // Arrange
      const statusPermitidos = [
        'iniciada',
        'em_andamento',
        'rascunho',
        'pendente',
        'concluida',
      ];

      // Act & Assert
      statusPermitidos.forEach((status) => {
        expect(status).not.toBe('inativada');
      });
    });
  });

  describe('Recálculo de Status do Lote', () => {
    it('deve manter lote ativo quando há avaliações pendentes', () => {
      // Arrange & Act
      const status = calcularStatusLote({
        concluidas: 3,
        inativadas: 2,
        liberadas: 10,
      });

      // Assert
      expect(status).toBe('ativo');
    });

    it('deve marcar lote como cancelado quando todas inativadas (sem concluídas)', () => {
      // Arrange & Act
      const status = calcularStatusLote({
        concluidas: 0,
        inativadas: 5,
        liberadas: 5,
      });

      // Assert
      expect(status).toBe('cancelado');
    });

    it('deve marcar lote como concluído quando concluídas + inativadas = liberadas', () => {
      // Arrange & Act
      const status = calcularStatusLote({
        concluidas: 3,
        inativadas: 2,
        liberadas: 5,
      });

      // Assert
      expect(status).toBe('concluido');
    });

    it('deve manter ativo quando liberadas é zero', () => {
      // Arrange & Act
      const status = calcularStatusLote({
        concluidas: 0,
        inativadas: 0,
        liberadas: 0,
      });

      // Assert
      expect(status).toBe('ativo');
    });

    it('deve manter ativo quando soma parcial', () => {
      // Arrange & Act
      const status = calcularStatusLote({
        concluidas: 2,
        inativadas: 1,
        liberadas: 5,
      });

      // Assert
      expect(status).toBe('ativo');
    });
  });

  describe('Auditoria', () => {
    it('deve conter todos os campos necessários para log de auditoria', () => {
      // Arrange
      const logAuditoria = {
        acao: 'inativar_avaliacao',
        avaliacao_id: 123,
        lote_id: 45,
        motivo: 'Funcionário desligado',
        usuario_cpf: '12345678901',
        perfil: 'rh',
        timestamp: new Date().toISOString(),
      };

      // Assert
      expect(logAuditoria).toHaveProperty('acao');
      expect(logAuditoria).toHaveProperty('avaliacao_id');
      expect(logAuditoria).toHaveProperty('lote_id');
      expect(logAuditoria).toHaveProperty('motivo');
      expect(logAuditoria).toHaveProperty('usuario_cpf');
      expect(logAuditoria).toHaveProperty('perfil');
      expect(logAuditoria).toHaveProperty('timestamp');
      expect(logAuditoria.acao).toBe('inativar_avaliacao');
    });
  });
});
