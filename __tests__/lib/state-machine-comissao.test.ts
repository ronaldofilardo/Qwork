/**
 * @file __tests__/lib/state-machine-comissao.test.ts
 * Testes unitários para lib/state-machine/comissao-state.ts
 */

import {
  canTransitionComissao,
  getNextValidComissaoStates,
  validateComissaoTransition,
  type ComissaoTransitionContext,
} from '@/lib/state-machine/comissao-state';
import type { StatusComissao } from '@/lib/types/comissionamento';

const CTX_ADMIN: ComissaoTransitionContext = { admin_cpf: '12345678901' };
const CTX_ADMIN_COM_MOTIVO: ComissaoTransitionContext = {
  admin_cpf: '12345678901',
  motivo: 'Justificativa de teste',
};

describe('canTransitionComissao', () => {
  describe('transições válidas de retida', () => {
    it('deve permitir retida → congelada_aguardando_admin com admin_cpf', () => {
      expect(
        canTransitionComissao('retida', 'congelada_aguardando_admin', CTX_ADMIN)
      ).toBe(true);
    });

    it('deve permitir retida → liberada com admin_cpf', () => {
      expect(canTransitionComissao('retida', 'liberada', CTX_ADMIN)).toBe(true);
    });

    it('deve permitir retida → cancelada com admin_cpf e motivo', () => {
      expect(
        canTransitionComissao('retida', 'cancelada', CTX_ADMIN_COM_MOTIVO)
      ).toBe(true);
    });
  });

  describe('transições inválidas de retida', () => {
    it('deve rejeitar retida → congelada_aguardando_admin sem admin_cpf', () => {
      expect(
        canTransitionComissao('retida', 'congelada_aguardando_admin', {})
      ).toBe(false);
    });

    it('deve rejeitar retida → cancelada sem motivo', () => {
      expect(canTransitionComissao('retida', 'cancelada', CTX_ADMIN)).toBe(
        false
      );
    });

    it('deve rejeitar retida → paga (transição inexistente)', () => {
      expect(canTransitionComissao('retida', 'paga', CTX_ADMIN_COM_MOTIVO)).toBe(
        false
      );
    });
  });

  describe('transições válidas de congelada_aguardando_admin', () => {
    it('deve permitir congelada_aguardando_admin → retida com admin_cpf', () => {
      expect(
        canTransitionComissao('congelada_aguardando_admin', 'retida', CTX_ADMIN)
      ).toBe(true);
    });

    it('deve permitir congelada_aguardando_admin → liberada com admin_cpf', () => {
      expect(
        canTransitionComissao(
          'congelada_aguardando_admin',
          'liberada',
          CTX_ADMIN
        )
      ).toBe(true);
    });

    it('deve permitir congelada_aguardando_admin → cancelada com admin_cpf e motivo', () => {
      expect(
        canTransitionComissao(
          'congelada_aguardando_admin',
          'cancelada',
          CTX_ADMIN_COM_MOTIVO
        )
      ).toBe(true);
    });
  });

  describe('transições válidas de liberada', () => {
    it('deve permitir liberada → paga com admin_cpf', () => {
      expect(canTransitionComissao('liberada', 'paga', CTX_ADMIN)).toBe(true);
    });

    it('deve permitir liberada → congelada_aguardando_admin com admin_cpf e motivo', () => {
      expect(
        canTransitionComissao(
          'liberada',
          'congelada_aguardando_admin',
          CTX_ADMIN_COM_MOTIVO
        )
      ).toBe(true);
    });

    it('deve permitir liberada → cancelada com admin_cpf e motivo', () => {
      expect(
        canTransitionComissao('liberada', 'cancelada', CTX_ADMIN_COM_MOTIVO)
      ).toBe(true);
    });
  });

  describe('estados finais', () => {
    it('deve rejeitar qualquer transição de paga', () => {
      const todosEstados: StatusComissao[] = [
        'retida',
        'congelada_aguardando_admin',
        'liberada',
        'paga',
        'cancelada',
      ];
      todosEstados.forEach((estado) => {
        expect(
          canTransitionComissao('paga', estado, CTX_ADMIN_COM_MOTIVO)
        ).toBe(false);
      });
    });

    it('deve rejeitar qualquer transição de cancelada', () => {
      const todosEstados: StatusComissao[] = [
        'retida',
        'congelada_aguardando_admin',
        'liberada',
        'paga',
        'cancelada',
      ];
      todosEstados.forEach((estado) => {
        expect(
          canTransitionComissao('cancelada', estado, CTX_ADMIN_COM_MOTIVO)
        ).toBe(false);
      });
    });
  });

  describe('contexto undefined/vazio', () => {
    it('deve rejeitar transição sem contexto', () => {
      expect(canTransitionComissao('retida', 'liberada')).toBe(false);
    });

    it('deve rejeitar transição com contexto vazio', () => {
      expect(canTransitionComissao('retida', 'liberada', {})).toBe(false);
    });
  });
});

describe('getNextValidComissaoStates', () => {
  it('deve retornar estados válidos de retida', () => {
    const validos = getNextValidComissaoStates('retida');
    expect(validos).toEqual(
      expect.arrayContaining([
        'congelada_aguardando_admin',
        'liberada',
        'cancelada',
      ])
    );
    expect(validos).toHaveLength(3);
  });

  it('deve retornar estados válidos de congelada_aguardando_admin', () => {
    const validos = getNextValidComissaoStates('congelada_aguardando_admin');
    expect(validos).toEqual(
      expect.arrayContaining(['retida', 'liberada', 'cancelada'])
    );
    expect(validos).toHaveLength(3);
  });

  it('deve retornar estados válidos de liberada', () => {
    const validos = getNextValidComissaoStates('liberada');
    expect(validos).toEqual(
      expect.arrayContaining(['paga', 'congelada_aguardando_admin', 'cancelada'])
    );
    expect(validos).toHaveLength(3);
  });

  it('deve retornar array vazio para paga (estado final)', () => {
    expect(getNextValidComissaoStates('paga')).toHaveLength(0);
  });

  it('deve retornar array vazio para cancelada (estado final)', () => {
    expect(getNextValidComissaoStates('cancelada')).toHaveLength(0);
  });
});

describe('validateComissaoTransition', () => {
  describe('transição válida', () => {
    it('deve retornar valido: true para transição permitida', () => {
      const resultado = validateComissaoTransition(
        'retida',
        'liberada',
        CTX_ADMIN
      );
      expect(resultado.valido).toBe(true);
      expect(resultado.erro).toBeUndefined();
    });
  });

  describe('estado final', () => {
    it('deve retornar valido: false com mensagem ao tentar sair de paga', () => {
      const resultado = validateComissaoTransition(
        'paga',
        'retida',
        CTX_ADMIN
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('paga');
      expect(resultado.erro).toContain('estado final');
    });

    it('deve retornar valido: false com mensagem ao tentar sair de cancelada', () => {
      const resultado = validateComissaoTransition(
        'cancelada',
        'retida',
        CTX_ADMIN
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('cancelada');
      expect(resultado.erro).toContain('estado final');
    });
  });

  describe('transição inválida (guard falhou)', () => {
    it('deve retornar valido: false com estados válidos na mensagem de erro', () => {
      const resultado = validateComissaoTransition(
        'retida',
        'cancelada',
        CTX_ADMIN // sem motivo
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toBeTruthy();
    });
  });
});
