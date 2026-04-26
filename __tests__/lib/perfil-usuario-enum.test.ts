/**
 * Testes para a adição de REPRESENTANTE ao enum PerfilUsuario.
 * Garante que o perfil 'representante' é aceito pelo validador de tipos
 * e que o valor do enum está correto para uso no RLS context.
 */

import { PerfilUsuario, TypeValidators } from '@/lib/types/enums';

describe('PerfilUsuario.REPRESENTANTE', () => {
  it('PerfilUsuario.REPRESENTANTE existe com valor string correto', () => {
    expect(PerfilUsuario.REPRESENTANTE).toBe('representante');
  });

  it('TypeValidators.isPerfil aceita "representante"', () => {
    expect(TypeValidators.isPerfil('representante')).toBe(true);
  });

  it('TypeValidators.isPerfil aceita todos os perfis conhecidos', () => {
    const perfilsEsperados = [
      'funcionario',
      'rh',
      'admin',
      'emissor',
      'gestor',
      'representante',
    ];
    perfilsEsperados.forEach((perfil) => {
      expect(TypeValidators.isPerfil(perfil)).toBe(true);
    });
  });

  it('TypeValidators.isPerfil rejeita valor inválido', () => {
    expect(TypeValidators.isPerfil('hacker')).toBe(false);
    expect(TypeValidators.isPerfil('')).toBe(false);
    expect(TypeValidators.isPerfil('REPRESENTANTE')).toBe(false); // casing importa
  });

  it('PerfilUsuario enum contém REPRESENTANTE', () => {
    expect(Object.values(PerfilUsuario)).toContain('representante');
  });
});
