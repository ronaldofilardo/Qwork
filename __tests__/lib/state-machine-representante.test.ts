/**
 * @file __tests__/lib/state-machine-representante.test.ts
 * Testes unitários para lib/state-machine/representante-state.ts
 */

import {
  canTransitionRepresentante,
  getNextValidRepresentanteStates,
  validateRepresentanteTransition,
  type RepresentanteTransitionContext,
} from '@/lib/state-machine/representante-state';
import type { StatusRepresentante } from '@/lib/types/comissionamento';

const CTX_ADMIN: RepresentanteTransitionContext = { admin_cpf: '12345678901' };
const CTX_ADMIN_COM_MOTIVO: RepresentanteTransitionContext = {
  admin_cpf: '12345678901',
  motivo: 'Justificativa de teste',
};
const CTX_ADMIN_COM_DOCS: RepresentanteTransitionContext = {
  admin_cpf: '12345678901',
  documentos_validados: true,
};

describe('canTransitionRepresentante', () => {
  describe('transições de ativo', () => {
    it('deve permitir ativo → apto_pendente sem contexto (rep submete docs)', () => {
      expect(canTransitionRepresentante('ativo', 'apto_pendente')).toBe(true);
    });

    it('deve permitir ativo → suspenso com admin_cpf e motivo', () => {
      expect(
        canTransitionRepresentante('ativo', 'suspenso', CTX_ADMIN_COM_MOTIVO)
      ).toBe(true);
    });

    it('deve permitir ativo → desativado com admin_cpf e motivo', () => {
      expect(
        canTransitionRepresentante('ativo', 'desativado', CTX_ADMIN_COM_MOTIVO)
      ).toBe(true);
    });

    it('deve rejeitar ativo → suspenso sem motivo', () => {
      expect(canTransitionRepresentante('ativo', 'suspenso', CTX_ADMIN)).toBe(
        false
      );
    });

    it('deve rejeitar ativo → rejeitado (transição inexistente)', () => {
      expect(
        canTransitionRepresentante('ativo', 'rejeitado', CTX_ADMIN_COM_MOTIVO)
      ).toBe(false);
    });
  });

  describe('transições de apto_pendente', () => {
    it('deve permitir apto_pendente → apto com admin_cpf e documentos_validados', () => {
      expect(
        canTransitionRepresentante('apto_pendente', 'apto', CTX_ADMIN_COM_DOCS)
      ).toBe(true);
    });

    it('deve rejeitar apto_pendente → apto sem documentos_validados', () => {
      expect(
        canTransitionRepresentante('apto_pendente', 'apto', CTX_ADMIN)
      ).toBe(false);
    });

    it('deve permitir apto_pendente → ativo com admin_cpf (docs rejeitados)', () => {
      expect(
        canTransitionRepresentante('apto_pendente', 'ativo', CTX_ADMIN)
      ).toBe(true);
    });

    it('deve permitir apto_pendente → rejeitado com admin_cpf e motivo', () => {
      expect(
        canTransitionRepresentante(
          'apto_pendente',
          'rejeitado',
          CTX_ADMIN_COM_MOTIVO
        )
      ).toBe(true);
    });

    it('deve rejeitar apto_pendente → rejeitado sem motivo', () => {
      expect(
        canTransitionRepresentante('apto_pendente', 'rejeitado', CTX_ADMIN)
      ).toBe(false);
    });

    it('deve permitir apto_pendente → suspenso com admin_cpf e motivo', () => {
      expect(
        canTransitionRepresentante(
          'apto_pendente',
          'suspenso',
          CTX_ADMIN_COM_MOTIVO
        )
      ).toBe(true);
    });
  });

  describe('transições de apto', () => {
    it('deve permitir apto → suspenso com admin_cpf e motivo', () => {
      expect(
        canTransitionRepresentante('apto', 'suspenso', CTX_ADMIN_COM_MOTIVO)
      ).toBe(true);
    });

    it('deve permitir apto → desativado com admin_cpf e motivo', () => {
      expect(
        canTransitionRepresentante('apto', 'desativado', CTX_ADMIN_COM_MOTIVO)
      ).toBe(true);
    });

    it('deve rejeitar apto → ativo (transição inexistente)', () => {
      expect(canTransitionRepresentante('apto', 'ativo', CTX_ADMIN)).toBe(
        false
      );
    });
  });

  describe('transições de aprovacao_comercial', () => {
    it('deve permitir aprovacao_comercial → ativo com admin_cpf', () => {
      expect(
        canTransitionRepresentante('aprovacao_comercial', 'ativo', CTX_ADMIN)
      ).toBe(true);
    });

    it('deve permitir aprovacao_comercial → rejeitado com admin_cpf e motivo', () => {
      expect(
        canTransitionRepresentante(
          'aprovacao_comercial',
          'rejeitado',
          CTX_ADMIN_COM_MOTIVO
        )
      ).toBe(true);
    });

    it('deve rejeitar aprovacao_comercial → ativo sem admin_cpf', () => {
      expect(canTransitionRepresentante('aprovacao_comercial', 'ativo')).toBe(
        false
      );
    });
  });

  describe('transições de aguardando_senha', () => {
    it('deve permitir aguardando_senha → ativo sem contexto', () => {
      expect(canTransitionRepresentante('aguardando_senha', 'ativo')).toBe(
        true
      );
    });
  });

  describe('transições de suspenso', () => {
    it('deve permitir suspenso → ativo com admin_cpf', () => {
      expect(canTransitionRepresentante('suspenso', 'ativo', CTX_ADMIN)).toBe(
        true
      );
    });

    it('deve permitir suspenso → apto com admin_cpf', () => {
      expect(canTransitionRepresentante('suspenso', 'apto', CTX_ADMIN)).toBe(
        true
      );
    });

    it('deve permitir suspenso → desativado com admin_cpf e motivo', () => {
      expect(
        canTransitionRepresentante('suspenso', 'desativado', CTX_ADMIN_COM_MOTIVO)
      ).toBe(true);
    });

    it('deve rejeitar suspenso → desativado sem motivo', () => {
      expect(
        canTransitionRepresentante('suspenso', 'desativado', CTX_ADMIN)
      ).toBe(false);
    });
  });

  describe('estados finais', () => {
    const estadosFinais: StatusRepresentante[] = [
      'desativado',
      'rejeitado',
      'expirado',
    ];
    const todosEstados: StatusRepresentante[] = [
      'ativo',
      'apto_pendente',
      'apto',
      'aprovacao_comercial',
      'aguardando_senha',
      'suspenso',
      'desativado',
      'rejeitado',
      'expirado',
    ];

    estadosFinais.forEach((estadoFinal) => {
      it(`deve rejeitar qualquer transição de ${estadoFinal}`, () => {
        todosEstados.forEach((proximo) => {
          expect(
            canTransitionRepresentante(estadoFinal, proximo, CTX_ADMIN_COM_MOTIVO)
          ).toBe(false);
        });
      });
    });
  });
});

describe('getNextValidRepresentanteStates', () => {
  it('deve retornar estados válidos de ativo', () => {
    const validos = getNextValidRepresentanteStates('ativo');
    expect(validos).toEqual(
      expect.arrayContaining(['apto_pendente', 'suspenso', 'desativado'])
    );
    expect(validos).toHaveLength(3);
  });

  it('deve retornar estados válidos de apto_pendente', () => {
    const validos = getNextValidRepresentanteStates('apto_pendente');
    expect(validos).toEqual(
      expect.arrayContaining(['apto', 'ativo', 'rejeitado', 'suspenso'])
    );
    expect(validos).toHaveLength(4);
  });

  it('deve retornar array vazio para desativado (estado final)', () => {
    expect(getNextValidRepresentanteStates('desativado')).toHaveLength(0);
  });

  it('deve retornar array vazio para rejeitado (estado final)', () => {
    expect(getNextValidRepresentanteStates('rejeitado')).toHaveLength(0);
  });

  it('deve retornar array vazio para expirado (estado final)', () => {
    expect(getNextValidRepresentanteStates('expirado')).toHaveLength(0);
  });
});

describe('validateRepresentanteTransition', () => {
  describe('transição válida', () => {
    it('deve retornar valido: true para transição permitida', () => {
      const resultado = validateRepresentanteTransition(
        'ativo',
        'suspenso',
        CTX_ADMIN_COM_MOTIVO
      );
      expect(resultado.valido).toBe(true);
      expect(resultado.erro).toBeUndefined();
    });
  });

  describe('estados finais', () => {
    it('deve retornar valido: false ao tentar sair de desativado', () => {
      const resultado = validateRepresentanteTransition(
        'desativado',
        'ativo',
        CTX_ADMIN
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('desativado');
      expect(resultado.erro).toContain('estado final');
    });

    it('deve retornar valido: false ao tentar sair de rejeitado', () => {
      const resultado = validateRepresentanteTransition(
        'rejeitado',
        'ativo',
        CTX_ADMIN
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('rejeitado');
      expect(resultado.erro).toContain('estado final');
    });

    it('deve retornar valido: false ao tentar sair de expirado', () => {
      const resultado = validateRepresentanteTransition(
        'expirado',
        'ativo',
        CTX_ADMIN
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('expirado');
      expect(resultado.erro).toContain('estado final');
    });
  });

  describe('transição inválida (guard falhou)', () => {
    it('deve retornar valido: false quando guard exige motivo e não foi fornecido', () => {
      const resultado = validateRepresentanteTransition(
        'ativo',
        'suspenso',
        CTX_ADMIN // sem motivo
      );
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toBeTruthy();
    });
  });
});
