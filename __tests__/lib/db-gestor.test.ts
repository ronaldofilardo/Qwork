/**
 * @file __tests__/lib/db-gestor.test.ts
 * Testes para lib/db-gestor.ts — Funções de Gestor (RH/Entidade)
 *
 * Valida:
 *  - isGestor, isGestorEntidade, isGestorRH (puras)
 *  - queryAsGestor requer sessão autenticada
 *  - queryAsGestorEntidade requer perfil gestor + entidade_id
 *  - queryAsGestorRH requer perfil rh
 *  - logGestorAction registra auditoria
 *  - validateGestorEmpresaAccess valida acesso
 */

import {
  isGestor,
  isGestorEntidade,
  isGestorRH,
  queryAsGestor,
  queryAsGestorEntidade,
  queryAsGestorRH,
  logGestorAction,
  validateGestorEmpresaAccess,
} from '@/lib/db-gestor';

// Mock de db.query
const mockQuery = jest.fn();
jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// Mock de session
const mockGetSession = jest.fn();
jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

jest.mock('@/lib/types/enums', () => ({
  PerfilUsuarioType: {},
}));

describe('db-gestor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // isGestor
  // ==========================================================================
  describe('isGestor', () => {
    it('deve retornar true para perfil "rh"', () => {
      expect(isGestor('rh')).toBe(true);
    });

    it('deve retornar true para perfil "gestor"', () => {
      expect(isGestor('gestor')).toBe(true);
    });

    it('deve retornar false para perfil "funcionario"', () => {
      expect(isGestor('funcionario' as any)).toBe(false);
    });

    it('deve retornar false para perfil "emissor"', () => {
      expect(isGestor('emissor' as any)).toBe(false);
    });

    it('deve retornar false para perfil "admin"', () => {
      expect(isGestor('admin' as any)).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(isGestor(undefined)).toBe(false);
    });
  });

  // ==========================================================================
  // isGestorEntidade
  // ==========================================================================
  describe('isGestorEntidade', () => {
    it('deve retornar true para "gestor"', () => {
      expect(isGestorEntidade('gestor')).toBe(true);
    });

    it('deve retornar false para "rh"', () => {
      expect(isGestorEntidade('rh')).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(isGestorEntidade(undefined)).toBe(false);
    });
  });

  // ==========================================================================
  // isGestorRH
  // ==========================================================================
  describe('isGestorRH', () => {
    it('deve retornar true para "rh"', () => {
      expect(isGestorRH('rh')).toBe(true);
    });

    it('deve retornar false para "gestor"', () => {
      expect(isGestorRH('gestor')).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(isGestorRH(undefined)).toBe(false);
    });
  });

  // ==========================================================================
  // queryAsGestor
  // ==========================================================================
  describe('queryAsGestor', () => {
    it('deve lançar erro sem sessão', async () => {
      mockGetSession.mockReturnValue(null);
      await expect(queryAsGestor('SELECT 1')).rejects.toThrow(
        'SEGURANÇA: queryAsGestor requer sessão autenticada'
      );
    });

    it('deve lançar erro para perfil não-gestor', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'funcionario',
      });
      await expect(queryAsGestor('SELECT 1')).rejects.toThrow(
        /exclusivo para gestores/
      );
    });

    it('deve executar query para gestor válido', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'gestor',
        entidade_id: 1,
        tomador_id: 1,
      });
      // validateGestorContext mock - retorna gestor válido
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678900', entidade_id: 1, ativa: true }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

      const result = await queryAsGestor(
        'SELECT * FROM empresas WHERE id = $1',
        [1]
      );
      expect(result.rows).toHaveLength(1);
    });

    it('deve lançar erro se gestor não encontrado em entidades', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'gestor',
      });
      // validateGestorContext - retorna vazio
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(queryAsGestor('SELECT 1')).rejects.toThrow(
        /não encontrado ou inativo/
      );
    });

    it('deve funcionar para perfil rh', async () => {
      mockGetSession.mockReturnValue({
        cpf: '98765432100',
        perfil: 'rh',
        clinica_id: 5,
      });
      // validateGestorContext para RH
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '98765432100', clinica_id: 5, ativa: true }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await queryAsGestor('SELECT 1');
      expect(result).toBeTruthy();
    });
  });

  // ==========================================================================
  // queryAsGestorEntidade
  // ==========================================================================
  describe('queryAsGestorEntidade', () => {
    it('deve lançar erro sem sessão', async () => {
      mockGetSession.mockReturnValue(null);
      await expect(queryAsGestorEntidade('SELECT 1')).rejects.toThrow(
        /exclusivo para gestor/
      );
    });

    it('deve lançar erro para perfil rh', async () => {
      mockGetSession.mockReturnValue({ cpf: '12345678900', perfil: 'rh' });
      await expect(queryAsGestorEntidade('SELECT 1')).rejects.toThrow(
        /exclusivo para gestor/
      );
    });

    it('deve lançar erro sem entidade_id', async () => {
      mockGetSession.mockReturnValue({ cpf: '12345678900', perfil: 'gestor' });
      await expect(queryAsGestorEntidade('SELECT 1')).rejects.toThrow(
        /sem entidade_id/
      );
    });

    it('deve delegar para queryAsGestor com perfil gestor + entidade_id', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'gestor',
        entidade_id: 1,
        tomador_id: 1,
      });
      mockQuery
        .mockResolvedValueOnce({ rows: [{ cpf: '12345678900' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ count: 5 }], rowCount: 1 });

      const result = await queryAsGestorEntidade(
        'SELECT count(*) FROM funcionarios'
      );
      expect(result.rows).toHaveLength(1);
    });
  });

  // ==========================================================================
  // queryAsGestorRH
  // ==========================================================================
  describe('queryAsGestorRH', () => {
    it('deve lançar erro sem sessão', async () => {
      mockGetSession.mockReturnValue(null);
      await expect(queryAsGestorRH('SELECT 1')).rejects.toThrow(
        /exclusivo para perfil rh/
      );
    });

    it('deve lançar erro para perfil gestor', async () => {
      mockGetSession.mockReturnValue({ cpf: '12345678900', perfil: 'gestor' });
      await expect(queryAsGestorRH('SELECT 1')).rejects.toThrow(
        /exclusivo para perfil rh/
      );
    });

    it('deve funcionar com perfil rh + clinica_id', async () => {
      mockGetSession.mockReturnValue({
        cpf: '98765432100',
        perfil: 'rh',
        clinica_id: 5,
      });
      mockQuery
        .mockResolvedValueOnce({ rows: [{ cpf: '98765432100' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 });

      const result = await queryAsGestorRH('SELECT * FROM lotes_avaliacao');
      expect(result).toBeTruthy();
    });
  });

  // ==========================================================================
  // logGestorAction
  // ==========================================================================
  describe('logGestorAction', () => {
    it('deve ignorar se não for gestor', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'funcionario',
      });
      await logGestorAction('criar_lote', 'lotes_avaliacao', 1, {});
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('deve ignorar sem sessão', async () => {
      mockGetSession.mockReturnValue(null);
      await logGestorAction('editar_empresa', 'empresas', 5, {});
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('deve inserir log de auditoria para gestor válido', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'gestor',
        tomador_id: 1,
        clinica_id: null,
      });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await logGestorAction(
        'criar_lote',
        'lotes_avaliacao',
        10,
        { titulo: 'Lote A' },
        '192.168.1.1'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          '12345678900',
          'criar_lote',
          'lotes_avaliacao',
          '10',
        ])
      );
    });

    it('não deve propagar erro de auditoria', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'rh',
        clinica_id: 5,
      });
      mockQuery.mockRejectedValueOnce(new Error('DB down'));

      // Não deve lançar erro
      await expect(
        logGestorAction('acao', 'recurso', 1, {})
      ).resolves.toBeUndefined();
    });
  });

  // ==========================================================================
  // validateGestorEmpresaAccess
  // ==========================================================================
  describe('validateGestorEmpresaAccess', () => {
    it('deve lançar erro sem sessão', async () => {
      mockGetSession.mockReturnValue(null);
      await expect(validateGestorEmpresaAccess(1)).rejects.toThrow(
        /restrito a gestores/
      );
    });

    it('deve lançar erro para perfil não-gestor', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'funcionario',
      });
      await expect(validateGestorEmpresaAccess(1)).rejects.toThrow(
        /restrito a gestores/
      );
    });

    it('deve lançar erro para gestor entidade sem tomador_id', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'gestor',
        tomador_id: undefined,
      });
      await expect(validateGestorEmpresaAccess(1)).rejects.toThrow(
        /sem tomador_id/
      );
    });

    it('deve retornar true se empresa pertence ao tomador', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678900',
        perfil: 'gestor',
        tomador_id: 10,
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

      const result = await validateGestorEmpresaAccess(1);
      expect(result).toBe(true);
    });
  });
});
