/**
 * @file __tests__/lib/helpers/destinatario-tipo.test.ts
 * Testes unitários para lib/helpers/destinatario-tipo.ts
 * Cobertura: getDestinatarioTipo — mapeia perfil → DestinatarioTipo
 */

import { getDestinatarioTipo } from '@/lib/helpers/destinatario-tipo';
import type { Session } from '@/lib/session';

function makeSession(perfil: string): Session {
  return {
    cpf: '12345678901',
    nome: 'Teste',
    perfil,
  } as Session;
}

describe('getDestinatarioTipo', () => {
  it('deve retornar "admin" para perfil admin', () => {
    expect(getDestinatarioTipo(makeSession('admin'))).toBe('admin');
  });

  it('deve retornar "gestor" para perfil rh', () => {
    expect(getDestinatarioTipo(makeSession('rh'))).toBe('gestor');
  });

  it('deve retornar "funcionario" para perfil funcionario', () => {
    expect(getDestinatarioTipo(makeSession('funcionario'))).toBe('funcionario');
  });

  it('deve retornar "funcionario" para perfil emissor', () => {
    expect(getDestinatarioTipo(makeSession('emissor'))).toBe('funcionario');
  });

  it('deve retornar "funcionario" para perfil gestor', () => {
    expect(getDestinatarioTipo(makeSession('gestor'))).toBe('funcionario');
  });

  it('deve retornar "funcionario" para perfil vendedor', () => {
    expect(getDestinatarioTipo(makeSession('vendedor'))).toBe('funcionario');
  });

  it('deve retornar "funcionario" para perfil suporte', () => {
    expect(getDestinatarioTipo(makeSession('suporte'))).toBe('funcionario');
  });

  it('deve retornar "funcionario" para perfil desconhecido', () => {
    expect(getDestinatarioTipo(makeSession('qualquer-outro'))).toBe('funcionario');
  });
});
