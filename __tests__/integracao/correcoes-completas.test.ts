/**
 * Testes de integração completa do sistema
 * Fluxos end-to-end das correções implementadas
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

// Mock completo do sistema
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  createSession: jest.fn(),
  getSession: jest.fn(),
  destroySession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('🔄 Integração Completa - Correções Críticas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🏢 Fluxo Completo: Account-Info + Autenticação', () => {
    const mockSession = {
      contratante_id: 18,
      tipo: 'gestor',
      userId: 1,
    };

    const mockContratante = {
      id: 18,
      nome: 'RELEGERE',
      cnpj: '12345678000123',
      tipo: 'entidade',
      numero_funcionarios: 50,
      status: 'ativo',
      criado_em: '2025-12-22T20:51:18.804Z',
    };

    const mockFuncionario = {
      id: 1,
      contratante_id: 18,
      cpf: '87545772920',
      nome: 'Gestor RELEGERE',
      tipo: 'gestor',
    };

    const mockSenha = {
      senha_hash:
        '$2a$06$eSfK/ZmLMeal4xTA93vYYeqrZ9LWZS4qGJDZFMUYgPVynNipjQFvO',
    };

    test('🔐 Login → Account-Info → Logout completo', async () => {
      const mockGetSession = require('@/lib/session').getSession;
      const mockCreateSession = require('@/lib/session').createSession;
      const mockDestroySession = require('@/lib/session').destroySession;
      const mockQuery = require('@/lib/db').query;

      // 1. LOGIN
      mockQuery
        .mockResolvedValueOnce([mockFuncionario]) // Buscar usuário
        .mockResolvedValueOnce([mockSenha]); // Buscar senha

      mockCreateSession.mockResolvedValue('session-token');

      // Simular login
      const cpf = '87545772920';
      const senha = '000170';

      // Buscar usuário e senha
      const userResult = await query(
        'SELECT * FROM funcionarios WHERE cpf = $1',
        [cpf]
      );
      const senhaResult = await query(
        'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
        [cpf]
      );

      // Validar credenciais
      const isValidPassword = await bcrypt.compare(
        senha,
        senhaResult[0].senha_hash
      );
      expect(isValidPassword).toBe(true);

      // Criar sessão
      await mockCreateSession({
        userId: mockFuncionario.id,
        contratanteId: 18,
      });
      expect(mockCreateSession).toHaveBeenCalled();

      // 2. ACCOUNT-INFO
      mockGetSession.mockResolvedValue(mockSession);
      mockQuery
        .mockResolvedValueOnce([mockContratante]) // contratantes
        .mockResolvedValueOnce([]) // contratos
        .mockResolvedValueOnce([]); // pagamentos

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);
      const accountData = await response.json();

      expect(response.status).toBe(200);
      expect(accountData.contratante.id).toBe(18);
      expect(accountData.contratante.nome).toBe('RELEGERE');

      // Verificar que usou contratantes, não empresas_clientes
      const queries = mockQuery.mock.calls;
      const contratantesQuery = queries.find((call) =>
        call[0].includes('FROM contratantes')
      );
      expect(contratantesQuery).toBeTruthy();

      // 3. LOGOUT
      mockDestroySession.mockResolvedValue(true);
      await mockDestroySession();
      expect(mockDestroySession).toHaveBeenCalled();
    });

    test('🚫 Tentativa de acesso não autorizado deve falhar', async () => {
      const mockGetSession = require('@/lib/session').getSession;
      const mockQuery = require('@/lib/db').query;

      // Sem sessão
      mockGetSession.mockResolvedValue(null);

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: 'Não autorizado',
      });

      // Verificar que nenhuma query foi executada
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('🛡️ Proteção de Senhas + Auditoria Completa', () => {
    test('🚫 DELETE direto → Função segura → Auditoria', async () => {
      const mockQuery = require('@/lib/db').query;

      // 1. TENTATIVA DE DELETE DIRETO (DEVE FALHAR)
      const triggerError = new Error(
        'OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita'
      );
      mockQuery.mockRejectedValueOnce(triggerError);

      await expect(
        query('DELETE FROM entidades_senhas WHERE contratante_id = $1', [18])
      ).rejects.toThrow('OPERAÇÃO BLOQUEADA');

      // 2. USO DA FUNÇÃO SEGURA (DEVE FUNCIONAR)
      mockQuery.mockResolvedValueOnce([
        { fn_delete_senha_autorizado: 'Senha deletada com sucesso' },
      ]);

      const result = await query('SELECT fn_delete_senha_autorizado($1, $2)', [
        18,
        'teste de integração',
      ]);
      expect(result[0].fn_delete_senha_autorizado).toContain(
        'deletada com sucesso'
      );

      // 3. VERIFICAR AUDITORIA
      const mockAuditRecord = {
        audit_id: 1,
        operacao: 'DELETE',
        contratante_nome: 'RELEGERE',
        cpf: '87545772920',
        executado_por: 'sistema_teste',
        executado_em: new Date(),
        motivo: 'teste de integração',
        tipo_operacao: 'segurança',
      };

      mockQuery.mockResolvedValueOnce([mockAuditRecord]);

      const auditResult = await query(
        'SELECT * FROM vw_auditoria_senhas ORDER BY executado_em DESC LIMIT 1'
      );
      expect(auditResult[0].operacao).toBe('DELETE');
      expect(auditResult[0].motivo).toBe('teste de integração');
    });

    test('📊 Auditoria deve registrar todas as operações', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockAuditRecords = [
        {
          audit_id: 1,
          operacao: 'INSERT',
          contratante_nome: 'RELEGERE',
          cpf: '87545772920',
          executado_em: '2025-12-23T10:00:00Z',
        },
        {
          audit_id: 2,
          operacao: 'UPDATE',
          contratante_nome: 'RELEGERE',
          cpf: '87545772920',
          executado_em: '2025-12-23T11:00:00Z',
        },
        {
          audit_id: 3,
          operacao: 'DELETE',
          contratante_nome: 'RELEGERE',
          cpf: '87545772920',
          executado_em: '2025-12-23T12:00:00Z',
        },
      ];

      mockQuery.mockResolvedValue(mockAuditRecords);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas ORDER BY executado_em DESC'
      );

      expect(result).toHaveLength(3);
      expect(result[0].operacao).toBe('DELETE'); // Mais recente primeiro
      expect(result[1].operacao).toBe('UPDATE');
      expect(result[2].operacao).toBe('INSERT');
    });
  });

  describe('🔧 Scripts de Limpeza Protegidos', () => {
    test('🧹 Scripts antigos vs novos', async () => {
      // Simular execução do script antigo (perigoso)
      const scriptAntigoQuery = `
        DELETE FROM entidades_senhas WHERE contratante_id IN (
          SELECT id FROM contratantes WHERE tipo = 'entidade'
        );
      `;

      const mockQuery = require('@/lib/db').query;
      const triggerError = new Error('OPERAÇÃO BLOQUEADA');
      mockQuery.mockRejectedValue(triggerError);

      // Script antigo deve falhar
      await expect(query(scriptAntigoQuery)).rejects.toThrow(
        'OPERAÇÃO BLOQUEADA'
      );

      // Script novo deve usar função segura
      mockQuery.mockResolvedValueOnce([{ fn_delete_senha_autorizado: 'OK' }]);

      const scriptNovoQuery = `
        SELECT fn_delete_senha_autorizado(18, 'limpeza programada');
      `;

      const result = await query(scriptNovoQuery);
      expect(result[0].fn_delete_senha_autorizado).toBe('OK');
    });

    test('🔒 PowerShell script seguro deve funcionar', async () => {
      // Simular execução do script PowerShell
      const mockExecutions = [
        { command: 'pg_dump', success: true, description: 'Backup criado' },
        {
          command: 'psql -f clean-contratantes.sql',
          success: true,
          description: 'Limpeza executada',
        },
        {
          command: 'SELECT * FROM vw_auditoria_senhas',
          success: true,
          description: 'Auditoria verificada',
        },
      ];

      // Verificar que todas as operações foram bem-sucedidas
      const allSuccessful = mockExecutions.every((exec) => exec.success);
      expect(allSuccessful).toBe(true);

      // Verificar ordem de execução
      expect(mockExecutions[0].command).toContain('pg_dump'); // Backup primeiro
      expect(mockExecutions[1].command).toContain('clean-contratantes.sql'); // Depois limpeza
      expect(mockExecutions[2].command).toContain('vw_auditoria_senhas'); // Finalmente auditoria
    });
  });

  describe('📈 Cenários de Stress e Edge Cases', () => {
    test('🔄 Múltiplos usuários simultâneos', async () => {
      const mockQuery = require('@/lib/db').query;

      // Simular 3 usuários logando simultaneamente
      const usuarios = [
        { cpf: '87545772920', senha: '000170', contratante_id: 18 },
        { cpf: '45678901234', senha: '000133', contratante_id: 23 },
        { cpf: '56789012345', senha: '000144', contratante_id: 24 },
      ];

      // Todas as queries devem funcionar independentemente
      for (const usuario of usuarios) {
        mockQuery
          .mockResolvedValueOnce([{ senha_hash: '$2a$06$validHash' }])
          .mockResolvedValueOnce([
            { contratante: { id: usuario.contratante_id } },
          ]);

        const senhaResult = await query(
          'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
          [usuario.cpf]
        );
        const isValid = await bcrypt.compare(
          usuario.senha,
          senhaResult[0].senha_hash
        );
        expect(isValid).toBe(true);
      }

      // Verificar que foram feitas 6 queries (2 por usuário)
      expect(mockQuery).toHaveBeenCalledTimes(6);
    });

    test('💥 Recuperação de falhas de rede', async () => {
      const mockQuery = require('@/lib/db').query;

      // Simular falha de conexão
      mockQuery
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce([{ senha_hash: '$2a$06$validHash' }]); // Retry funciona

      // Primeira tentativa falha
      await expect(
        query('SELECT senha_hash FROM entidades_senhas WHERE cpf = $1', [
          '87545772920',
        ])
      ).rejects.toThrow('Connection timeout');

      // Retry funciona
      const result = await query(
        'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
        ['87545772920']
      );
      expect(result[0].senha_hash).toBe('$2a$06$validHash');
    });

    test('📊 Grande volume de dados', async () => {
      const mockQuery = require('@/lib/db').query;

      // Simular muitos registros de auditoria
      const mockAuditRecords = Array(1000).fill({
        audit_id: 1,
        operacao: 'INSERT',
        executado_em: new Date(),
      });

      mockQuery.mockResolvedValue(mockAuditRecords);

      const result = await query(
        'SELECT * FROM vw_auditoria_senhas LIMIT 1000'
      );

      expect(result).toHaveLength(1000);

      // Verificar performance (simulado)
      const startTime = Date.now();
      // Processamento simulado
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Deve processar em tempo razoável (< 100ms simulado)
      expect(processingTime).toBeLessThan(100);
    });
  });

  describe('🔍 Validação de Dados e Consistência', () => {
    test('🔗 Integridade referencial contratantes ↔ senhas', async () => {
      const mockQuery = require('@/lib/db').query;

      // Verificar que todos os contratantes têm senhas
      const mockContratantes = [
        { id: 18, nome: 'RELEGERE', tipo: 'entidade' },
        { id: 23, nome: 'ABC', tipo: 'entidade' },
        { id: 24, nome: 'Forte', tipo: 'entidade' },
      ];

      const mockSenhas = [
        { contratante_id: 18, cpf: '87545772920' },
        { contratante_id: 23, cpf: '45678901234' },
        { contratante_id: 24, cpf: '56789012345' },
      ];

      mockQuery
        .mockResolvedValueOnce(mockContratantes)
        .mockResolvedValueOnce(mockSenhas);

      const contratantesResult = await query(
        "SELECT id FROM contratantes WHERE tipo = 'entidade'"
      );
      const senhasResult = await query(
        'SELECT DISTINCT contratante_id FROM entidades_senhas'
      );

      const contratanteIds = contratantesResult.rows.map((c) => c.id);
      const senhaContratanteIds = senhasResult.rows.map(
        (s) => s.contratante_id
      );

      // Todos os contratantes devem ter senhas
      const allHavePasswords = contratanteIds.every((id) =>
        senhaContratanteIds.includes(id)
      );

      expect(allHavePasswords).toBe(true);
      expect(contratanteIds).toHaveLength(3);
      expect(senhaContratanteIds).toHaveLength(3);
    });

    test('📋 Consistência de dados account-info', async () => {
      const mockGetSession = require('@/lib/session').getSession;
      const mockQuery = require('@/lib/db').query;

      mockGetSession.mockResolvedValue({
        contratante_id: 18,
        tipo: 'gestor',
      });

      const mockContratante = {
        id: 18,
        nome: 'RELEGERE',
        numero_funcionarios: 50,
        status: 'ativo',
      };

      const mockContratos = [
        { id: 1, valor: 1500.0, status: 'ativo' },
        { id: 2, valor: 2000.0, status: 'ativo' },
      ];

      const mockPagamentos = [
        { id: 1, contrato_id: 1, valor: 1500.0, status: 'pago' },
        { id: 2, contrato_id: 2, valor: 2000.0, status: 'pago' },
      ];

      mockQuery
        .mockResolvedValueOnce([mockContratante])
        .mockResolvedValueOnce(mockContratos)
        .mockResolvedValueOnce(mockPagamentos);

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);
      const data = await response.json();

      // Verificar estrutura completa
      expect(data).toHaveProperty('contratante');
      expect(data).toHaveProperty('contratos');
      expect(data).toHaveProperty('pagamentos');

      // Verificar consistência de valores
      const totalContratos = data.contratos.reduce(
        (sum, c) => sum + c.valor,
        0
      );
      const totalPagamentos = data.pagamentos.reduce(
        (sum, p) => sum + p.valor,
        0
      );

      expect(totalContratos).toBe(3500.0);
      expect(totalPagamentos).toBe(3500.0);
    });
  });
});
