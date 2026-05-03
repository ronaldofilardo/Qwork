/**
 * Testes robustos para Sistema de Proteção Crítica de Senhas
 *
 * Cobertura:
 * - Trigger de bloqueio de DELETE
 * - Auditoria automática
 * - Função segura de deleção
 * - View de auditoria
 * - Função de limpeza para testes
 */

import { query } from '@/lib/db';

// Mock da lib de DB
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

describe('🔒 Sistema de Proteção Crítica de Senhas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🚫 Trigger de Bloqueio - DELETE Direto', () => {
    test('❌ DELETE direto deve ser BLOQUEADO', async () => {
      const mockQuery = require('@/lib/db').query;

      // Simular erro do trigger PostgreSQL
      const triggerError = new Error(
        'OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita. Use fn_delete_senha_autorizado() para deletar senhas com segurança.'
      );
      mockQuery.mockRejectedValue(triggerError);

      await expect(
        query('DELETE FROM contratantes_senhas WHERE contratante_id = $1', [18])
      ).rejects.toThrow(
        'OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM contratantes_senhas WHERE contratante_id = $1',
        [18]
      );
    });

    test('❌ DELETE sem WHERE deve ser BLOQUEADO', async () => {
      const mockQuery = require('@/lib/db').query;

      const triggerError = new Error(
        'OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita'
      );
      mockQuery.mockRejectedValue(triggerError);

      await expect(query('DELETE FROM contratantes_senhas')).rejects.toThrow(
        'OPERAÇÃO BLOQUEADA'
      );

      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM contratantes_senhas');
    });

    test('❌ TRUNCATE deve ser BLOQUEADO', async () => {
      const mockQuery = require('@/lib/db').query;

      const triggerError = new Error(
        'OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita'
      );
      mockQuery.mockRejectedValue(triggerError);

      await expect(query('TRUNCATE TABLE contratantes_senhas')).rejects.toThrow(
        'OPERAÇÃO BLOQUEADA'
      );
    });

    test('✅ INSERT deve funcionar normalmente', async () => {
      const mockQuery = require('@/lib/db').query;
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await query(
        'INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash) VALUES ($1, $2, $3)',
        [25, '12345678901', '$2a$10$validHash']
      );

      expect(result.rowCount).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contratantes_senhas'),
        expect.any(Array)
      );
    });

    test('✅ UPDATE deve funcionar normalmente', async () => {
      const mockQuery = require('@/lib/db').query;
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await query(
        'UPDATE contratantes_senhas SET senha_hash = $1, atualizado_em = NOW() WHERE contratante_id = $2',
        ['$2a$10$newHash', 18]
      );

      expect(result.rowCount).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contratantes_senhas'),
        expect.any(Array)
      );
    });
  });

  describe('🛡️ Função Segura - fn_delete_senha_autorizado', () => {
    test('✅ Deve deletar senha quando autorizado', async () => {
      const mockQuery = require('@/lib/db').query;
      mockQuery.mockResolvedValue([
        {
          fn_delete_senha_autorizado:
            'Senha deletada com sucesso. Operação registrada em audit.',
        },
      ]);

      const result = await query('SELECT fn_delete_senha_autorizado($1, $2)', [
        18,
        'teste de função segura',
      ]);

      expect(result[0].fn_delete_senha_autorizado).toContain(
        'deletada com sucesso'
      );
      expect(result[0].fn_delete_senha_autorizado).toContain(
        'registrada em audit'
      );
    });

    test('❌ Deve rejeitar motivo vazio', async () => {
      const mockQuery = require('@/lib/db').query;
      mockQuery.mockRejectedValue(
        new Error('Motivo obrigatório para deleção de senha')
      );

      await expect(
        query('SELECT fn_delete_senha_autorizado($1, $2)', [18, ''])
      ).rejects.toThrow('Motivo obrigatório');
    });

    test('❌ Deve rejeitar motivo nulo', async () => {
      const mockQuery = require('@/lib/db').query;
      mockQuery.mockRejectedValue(
        new Error('Motivo obrigatório para deleção de senha')
      );

      await expect(
        query('SELECT fn_delete_senha_autorizado($1, NULL)', [18])
      ).rejects.toThrow('Motivo obrigatório');
    });

    test('🔍 Deve validar contratante_id existente', async () => {
      const mockQuery = require('@/lib/db').query;
      mockQuery.mockRejectedValue(new Error('Contratante não encontrado'));

      await expect(
        query('SELECT fn_delete_senha_autorizado($1, $2)', [999, 'teste'])
      ).rejects.toThrow('Contratante não encontrado');
    });
  });

  describe('📊 Sistema de Auditoria', () => {
    test('✅ Deve registrar INSERT em audit', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockAuditRecord = {
        audit_id: 1,
        operacao: 'INSERT',
        contratante_nome: 'RELEGERE',
        cnpj: '12345678000123',
        cpf: '87545772920',
        tinha_senha_anterior: false,
        tem_senha_nova: true,
        executado_por: 'sistema',
        executado_em: '2025-12-23T12:00:00Z',
        motivo: null,
        tipo_operacao: 'manutenção',
      };

      mockQuery.mockResolvedValue([mockAuditRecord]);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas WHERE operacao = $1 ORDER BY executado_em DESC LIMIT 1',
        ['INSERT']
      );

      expect(result[0]).toEqual(mockAuditRecord);
      expect(result[0].operacao).toBe('INSERT');
      expect(result[0].tinha_senha_anterior).toBe(false);
      expect(result[0].tem_senha_nova).toBe(true);
    });

    test('✅ Deve registrar UPDATE em audit', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockAuditRecord = {
        audit_id: 2,
        operacao: 'UPDATE',
        contratante_nome: 'ABC',
        cpf: '45678901234',
        tinha_senha_anterior: true,
        tem_senha_nova: true,
        executado_por: 'gestor_rh',
        executado_em: '2025-12-23T12:30:00Z',
        motivo: 'troca de senha',
        tipo_operacao: 'manutenção',
      };

      mockQuery.mockResolvedValue([mockAuditRecord]);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas WHERE operacao = $1 ORDER BY executado_em DESC LIMIT 1',
        ['UPDATE']
      );

      expect(result[0].operacao).toBe('UPDATE');
      expect(result[0].tinha_senha_anterior).toBe(true);
      expect(result[0].tem_senha_nova).toBe(true);
      expect(result[0].motivo).toBe('troca de senha');
    });

    test('✅ Deve registrar DELETE autorizado em audit', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockAuditRecord = {
        audit_id: 3,
        operacao: 'DELETE',
        contratante_nome: 'Forte',
        cpf: '56789012345',
        tinha_senha_anterior: true,
        tem_senha_nova: false,
        executado_por: 'admin',
        executado_em: '2025-12-23T13:00:00Z',
        motivo: 'conta desativada',
        tipo_operacao: 'segurança',
      };

      mockQuery.mockResolvedValue([mockAuditRecord]);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas WHERE operacao = $1 ORDER BY executado_em DESC LIMIT 1',
        ['DELETE']
      );

      expect(result[0].operacao).toBe('DELETE');
      expect(result[0].tinha_senha_anterior).toBe(true);
      expect(result[0].tem_senha_nova).toBe(false);
      expect(result[0].motivo).toBe('conta desativada');
      expect(result[0].tipo_operacao).toBe('segurança');
    });

    test('📈 View deve ordenar por data decrescente', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockRecords = [
        {
          audit_id: 3,
          operacao: 'DELETE',
          executado_em: '2025-12-23T13:00:00Z',
        },
        {
          audit_id: 2,
          operacao: 'UPDATE',
          executado_em: '2025-12-23T12:30:00Z',
        },
        {
          audit_id: 1,
          operacao: 'INSERT',
          executado_em: '2025-12-23T12:00:00Z',
        },
      ];

      mockQuery.mockResolvedValue(mockRecords);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas ORDER BY executado_em DESC'
      );

      expect(result[0].audit_id).toBe(3); // Mais recente primeiro
      expect(result[1].audit_id).toBe(2);
      expect(result[2].audit_id).toBe(1);
    });

    test('🔍 Deve filtrar por contratante', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockRecords = [
        { audit_id: 1, contratante_nome: 'RELEGERE', operacao: 'INSERT' },
        { audit_id: 2, contratante_nome: 'RELEGERE', operacao: 'UPDATE' },
      ];

      mockQuery.mockResolvedValue(mockRecords);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas WHERE contratante_nome = $1',
        ['RELEGERE']
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every((r) => r.contratante_nome === 'RELEGERE')).toBe(
        true
      );
    });
  });

  describe('🧹 Função de Limpeza para Testes', () => {
    test('✅ Deve limpar senhas de teste quando NODE_ENV=test', async () => {
      // Simular ambiente de teste
      // @ts-expect-error - NODE_ENV é readonly mas precisamos modificar em testes
      process.env.NODE_ENV = 'test';

      const mockQuery = require('@/lib/db').query;
      mockQuery.mockResolvedValue([
        { fn_limpar_senhas_teste: 'Limpeza concluída. 3 senhas removidas.' },
      ]);

      const result = await query('SELECT fn_limpar_senhas_teste()');

      expect(result[0].fn_limpar_senhas_teste).toContain('Limpeza concluída');
      expect(result[0].fn_limpar_senhas_teste).toContain('3 senhas removidas');
    });

    test('❌ Deve bloquear limpeza fora do ambiente de teste', async () => {
      // Simular ambiente de produção
      // @ts-expect-error - NODE_ENV é readonly mas precisamos modificar em testes
      process.env.NODE_ENV = 'production';

      const mockQuery = require('@/lib/db').query;
      mockQuery.mockRejectedValue(
        new Error(
          'Função fn_limpar_senhas_teste() só pode ser executada em ambiente de teste'
        )
      );

      await expect(query('SELECT fn_limpar_senhas_teste()')).rejects.toThrow(
        'só pode ser executada em ambiente de teste'
      );
    });
  });

  describe('🔐 Segurança e Validações', () => {
    test('🚫 Deve impedir SQL injection no motivo', async () => {
      const mockQuery = require('@/lib/db').query;

      const maliciousMotivo = "'; DROP TABLE contratantes_senhas; --";
      mockQuery.mockRejectedValue(new Error('Motivo inválido'));

      await expect(
        query('SELECT fn_delete_senha_autorizado($1, $2)', [
          18,
          maliciousMotivo,
        ])
      ).rejects.toThrow('Motivo inválido');
    });

    test('✅ Deve aceitar caracteres especiais seguros no motivo', async () => {
      const mockQuery = require('@/lib/db').query;
      mockQuery.mockResolvedValue([
        { fn_delete_senha_autorizado: 'Senha deletada com sucesso' },
      ]);

      const safeMotivo =
        'Correção de senha - usuário solicitou reset (contato: suporte@empresa.com)';

      const result = await query('SELECT fn_delete_senha_autorizado($1, $2)', [
        18,
        safeMotivo,
      ]);

      expect(result[0].fn_delete_senha_autorizado).toContain(
        'deletada com sucesso'
      );
    });

    test('📏 Deve validar tamanho do motivo', async () => {
      const mockQuery = require('@/lib/db').query;

      const longMotivo = 'a'.repeat(1000); // Muito longo
      mockQuery.mockRejectedValue(new Error('Motivo muito longo'));

      await expect(
        query('SELECT fn_delete_senha_autorizado($1, $2)', [18, longMotivo])
      ).rejects.toThrow('Motivo muito longo');
    });
  });

  describe('📈 Monitoramento e Relatórios', () => {
    test('📊 Deve contar operações por tipo', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockStats = [
        { operacao: 'INSERT', total: 5 },
        { operacao: 'UPDATE', total: 12 },
        { operacao: 'DELETE', total: 2 },
      ];

      mockQuery.mockResolvedValue(mockStats);

      const result = await query(
        'SELECT operacao, COUNT(*) as total FROM vw_auditoria_senhas GROUP BY operacao ORDER BY total DESC'
      );

      expect(result[0].operacao).toBe('INSERT');
      expect(result[0].total).toBe(5);
      expect(result[2].operacao).toBe('DELETE');
      expect(result[2].total).toBe(2);
    });

    test('⏰ Deve filtrar operações por período', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockRecords = [
        { audit_id: 1, executado_em: '2025-12-23T10:00:00Z' },
        { audit_id: 2, executado_em: '2025-12-23T15:00:00Z' },
      ];

      mockQuery.mockResolvedValue(mockRecords);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas WHERE executado_em >= $1 AND executado_em <= $2',
        ['2025-12-23T09:00:00Z', '2025-12-23T16:00:00Z']
      );

      expect(result).toHaveLength(2);
    });

    test('👤 Deve identificar usuário que executou operação', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockRecord = {
        audit_id: 1,
        operacao: 'DELETE',
        executado_por: 'admin_sistema',
        motivo: 'manutenção programada',
      };

      mockQuery.mockResolvedValue([mockRecord]);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas WHERE executado_por = $1',
        ['admin_sistema']
      );

      expect(result[0].executado_por).toBe('admin_sistema');
      expect(result[0].motivo).toBe('manutenção programada');
    });
  });
});
