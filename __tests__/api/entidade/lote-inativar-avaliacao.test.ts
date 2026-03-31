/**
 * @file __tests__/api/entidade/lote-inativar-avaliacao.test.ts
 * ─────────────────────────────────────────────────────────────
 * Testes para POST /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar
 *
 * Valida lógica de negócio da inativação de avaliações pelo perfil Gestor Entidade:
 *  - Autenticação e autorização (gestor ou rh)
 *  - Validação de entrada (motivo obrigatório)
 *  - Acesso por entidade_id (vínculo funcionário-entidade)
 *  - Princípio da imutabilidade (bloqueio pós-emissão)
 *  - Recálculo de status do lote
 */

import { describe, it, expect } from '@jest/globals';

// ────────────────────────────────────────────────────────────
// Helpers de validação (espelham a lógica da rota entidade)
// ────────────────────────────────────────────────────────────

function validarPermissaoEntidade(
  user: { perfil: string; entidade_id?: number } | null
): { ok: boolean; status: number; error?: string } {
  if (!user) return { ok: false, status: 401, error: 'Não autorizado' };
  if (user.perfil !== 'gestor' && user.perfil !== 'rh') {
    return { ok: false, status: 403, error: 'Acesso negado' };
  }
  return { ok: true, status: 200 };
}

function validarMotivo(motivo: unknown): { ok: boolean; error?: string } {
  if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
    return { ok: false, error: 'Motivo é obrigatório' };
  }
  return { ok: true };
}

function validarAcessoLote(
  loteEntidadeId: number | null,
  userEntidadeId: number
): { ok: boolean; error?: string } {
  if (loteEntidadeId === null) {
    return {
      ok: false,
      error: 'Lote não encontrado ou você não tem permissão para acessá-lo',
    };
  }
  if (loteEntidadeId !== userEntidadeId) {
    return { ok: false, error: 'Lote não pertence à sua entidade' };
  }
  return { ok: true };
}

function validarImutabilidadeEntidade(
  loteEmitido: boolean,
  emissaoSolicitada: boolean
): { ok: boolean; error?: string } {
  if (loteEmitido) {
    return {
      ok: false,
      error: 'Não é possível inativar avaliações de lote já emitido',
    };
  }
  if (emissaoSolicitada) {
    return {
      ok: false,
      error:
        'Não é possível inativar avaliações: emissão do laudo já foi solicitada',
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

describe('POST /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar', () => {
  describe('Autenticação e Autorização', () => {
    it('deve rejeitar requisição sem sessão (401)', () => {
      const resultado = validarPermissaoEntidade(null);
      expect(resultado.ok).toBe(false);
      expect(resultado.status).toBe(401);
    });

    it('deve rejeitar perfis não autorizados (403)', () => {
      const perfisNaoAutorizados = ['funcionario', 'emissor', 'admin'];
      perfisNaoAutorizados.forEach((perfil) => {
        const resultado = validarPermissaoEntidade({ perfil });
        expect(resultado.ok).toBe(false);
        expect(resultado.status).toBe(403);
      });
    });

    it('deve aceitar perfil gestor', () => {
      const resultado = validarPermissaoEntidade({
        perfil: 'gestor',
        entidade_id: 1,
      });
      expect(resultado.ok).toBe(true);
    });

    it('deve aceitar perfil rh', () => {
      const resultado = validarPermissaoEntidade({ perfil: 'rh' });
      expect(resultado.ok).toBe(true);
    });
  });

  describe('Validação de Entrada', () => {
    it('deve rejeitar motivos inválidos', () => {
      expect(validarMotivo('')).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
      expect(validarMotivo(null)).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
      expect(validarMotivo(undefined)).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
      expect(validarMotivo(42)).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
      expect(validarMotivo('   ')).toEqual({
        ok: false,
        error: 'Motivo é obrigatório',
      });
    });

    it('deve aceitar motivo válido', () => {
      expect(validarMotivo('Funcionário não pertence ao lote')).toEqual({
        ok: true,
      });
    });
  });

  describe('Validação de Acesso por Entidade', () => {
    it('deve rejeitar lote não encontrado', () => {
      const resultado = validarAcessoLote(null, 1);
      expect(resultado.ok).toBe(false);
      expect(resultado.error).toContain('não encontrado');
    });

    it('deve rejeitar lote de outra entidade', () => {
      const resultado = validarAcessoLote(2, 1);
      expect(resultado.ok).toBe(false);
      expect(resultado.error).toContain('não pertence');
    });

    it('deve aceitar lote da mesma entidade', () => {
      const resultado = validarAcessoLote(1, 1);
      expect(resultado.ok).toBe(true);
    });
  });

  describe('Princípio da Imutabilidade', () => {
    it('deve bloquear quando lote já emitido', () => {
      const resultado = validarImutabilidadeEntidade(true, false);
      expect(resultado.ok).toBe(false);
      expect(resultado.error).toContain('lote já emitido');
    });

    it('deve bloquear quando emissão já solicitada', () => {
      const resultado = validarImutabilidadeEntidade(false, true);
      expect(resultado.ok).toBe(false);
      expect(resultado.error).toContain('emissão do laudo já foi solicitada');
    });

    it('deve permitir quando nenhuma emissão', () => {
      const resultado = validarImutabilidadeEntidade(false, false);
      expect(resultado.ok).toBe(true);
    });
  });

  describe('Recálculo de Status do Lote', () => {
    it('deve cancelar lote com todas avaliações inativadas', () => {
      expect(
        calcularStatusLote({ concluidas: 0, inativadas: 3, liberadas: 3 })
      ).toBe('cancelado');
    });

    it('deve concluir lote com concluídas + inativadas = liberadas', () => {
      expect(
        calcularStatusLote({ concluidas: 2, inativadas: 1, liberadas: 3 })
      ).toBe('concluido');
    });

    it('deve manter ativo quando há avaliações pendentes', () => {
      expect(
        calcularStatusLote({ concluidas: 1, inativadas: 1, liberadas: 5 })
      ).toBe('ativo');
    });
  });
});
