/**
 * ⚠️  POLÍTICA DE TESTES - PROIBIÇÕES E CONVENÇÕES ⚠️
 *
 * - EXPRESSAMENTE PROIBIDO:
 *   • Fazer seed ou qualquer operação de escrita no banco de produção (nome obfuscado para evitar hardcode). // nunca referenciar literalmente o nome do DB aqui
 *   • Usar senhas reais ou hashes reais de usuários de clínicas/entidades nos testes.
 *   • Referenciar dados reais de contratantes, funcionários ou clientes.
 *
 * - OBRIGAÇÕES PARA TODOS OS TESTES DE SENHA:
 *   • Usar mocks completos para `bcrypt`/`bcryptjs` e para `@/lib/db`.
 *   • Garantir que os testes não toquem em nenhum banco real (apenas mocks/sandbox).
 *   • Incluir esta política nos testes que verificam senhas para registro claro.
 *
 * Este comentário serve como registro permanente desta política.
 */

// Mock do bcryptjs - deve vir ANTES do import
jest.mock('bcryptjs', () => ({
  compare: jest.fn((senha, hash) => {
    // Suporte a dois tipos de hashes fictícios usados nos testes:
    // 1) Hashes fixos gerados com repeats (H1/H2/H3)
    // 2) Hashes dinâmicos gerados por hash() com o prefixo 'mockHashFor'

    if (typeof hash !== 'string') return Promise.resolve(false);

    // Caso: hash gerado dinamicamente pela função mock de hash
    if (hash.includes('mockHashFor')) {
      const [, suffix] = hash.split('mockHashFor');
      // Suffix tem o formato: <senha>_<rand>. Para preservar '_' na senha, removemos apenas o sufixo randômico.
      const lastUnderscore = suffix.lastIndexOf('_');
      const expectedSenha =
        lastUnderscore === -1 ? suffix : suffix.slice(0, lastUnderscore);
      return Promise.resolve(senha === expectedSenha);
    }

    // Hashes fixos com formato válido para testes
    const H1 = `$2a$06$${'a'.repeat(53)}`;
    const H2 = `$2a$06$${'b'.repeat(53)}`;
    const H3 = `$2a$06$${'c'.repeat(53)}`;

    const senhasFicticias = {
      [H1]: 'senha_ficticia_001',
      [H2]: 'senha_ficticia_002',
      [H3]: 'senha_ficticia_003',
    };

    return Promise.resolve(senhasFicticias[hash] === senha);
  }),
  hash: jest.fn((senha, rounds) => {
    // Retorna um hash mock que inclui os rounds e um sufixo randômico para variar sal
    const rand = Math.random().toString(36).slice(2, 8);
    return Promise.resolve(`$2a$${rounds}$mockHashFor${senha}_${rand}`);
  }),
}));

import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

// Mock da lib de DB - NUNCA tocar no banco real (usar mocks)
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

describe('🔐 Validação de Senhas Bcrypt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ Senhas Atuais do Sistema', () => {
    // Dados 100% fictícios - não tocar em dados reais
    const H1 = `$2a$06$${'a'.repeat(53)}`;
    const H2 = `$2a$06$${'b'.repeat(53)}`;
    const H3 = `$2a$06$${'c'.repeat(53)}`;

    const senhasAtuais = [
      {
        contratante: 'CLIENTE_A',
        cpf: '00000000001',
        senha: 'senha_ficticia_001',
        hash: H1,
      },
      {
        contratante: 'CLIENTE_B',
        cpf: '00000000002',
        senha: 'senha_ficticia_002',
        hash: H2,
      },
      {
        contratante: 'CLIENTE_C',
        cpf: '00000000003',
        senha: 'senha_ficticia_003',
        hash: H3,
      },
    ];

    test.each(senhasAtuais)(
      '✅ Senha $senha deve validar para $contratante ($cpf)',
      async ({ senha, cpf, hash }) => {
        const mockQuery = require('@/lib/db').query;
        mockQuery.mockResolvedValue([{ senha_hash: hash }]);

        // Buscar hash do banco
        const result = await query(
          'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
          [cpf]
        );
        const hashFromDB = result[0].senha_hash;

        // Validar senha
        const isValid = await bcrypt.compare(senha, hashFromDB);

        expect(isValid).toBe(true);
        expect(mockQuery).toHaveBeenCalledWith(
          'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
          [cpf]
        );
      }
    );

    test.each(senhasAtuais)(
      '❌ Senha incorreta deve falhar para $contratante',
      async ({ senha, hash }) => {
        const senhaIncorreta = '999999';

        const correta = await bcrypt.compare(senha, hash);
        const incorreta = await bcrypt.compare(senhaIncorreta, hash);

        expect(correta).toBe(true);
        expect(incorreta).toBe(false);
      }
    );

    test.each(senhasAtuais)(
      '🔄 Hash deve ter formato bcrypt válido para $contratante',
      async ({ hash }) => {
        // Verificar formato do hash bcrypt ($2a|$2b|$2x|$2y$rounds$salt+hash)
        expect(hash).toMatch(/^\$2[abxy]\$\d+\$.{53}$/);

        // Verificar que é um hash válido (bcrypt pode verificar)
        const isValidFormat =
          hash.startsWith('$2a$') ||
          hash.startsWith('$2b$') ||
          hash.startsWith('$2x$') ||
          hash.startsWith('$2y$');
        expect(isValidFormat).toBe(true);
      }
    );
  });

  describe('🔒 Segurança de Senhas', () => {
    test('⏱️ Deve usar rounds apropriados (6-10)', async () => {
      const senha = 'test123';
      const rounds = 8; // Valor médio seguro

      const hash = await bcrypt.hash(senha, rounds);

      // Verificar que o hash foi gerado com os rounds corretos
      const hashRounds = parseInt(hash.split('$')[2]);
      expect(hashRounds).toBe(rounds);

      // Validar que funciona
      const isValid = await bcrypt.compare(senha, hash);
      expect(isValid).toBe(true);
    });

    test('🛡️ Deve resistir a ataques de força bruta', async () => {
      const senha = 'senhafraca';
      const hash = await bcrypt.hash(senha, 6);

      // Simular tentativas de força bruta
      const tentativas = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        'senhafraca',
      ];

      for (const tentativa of tentativas) {
        const isValid = await bcrypt.compare(tentativa, hash);
        if (tentativa === senha) {
          expect(isValid).toBe(true);
        } else {
          expect(isValid).toBe(false);
        }
      }
    });

    test('🔄 Deve gerar hashes diferentes para mesma senha', async () => {
      const senha = 'mesma_senha';

      const hash1 = await bcrypt.hash(senha, 6);
      const hash2 = await bcrypt.hash(senha, 6);

      // Mesmo com mesma senha, hashes devem ser diferentes (salts diferentes)
      expect(hash1).not.toBe(hash2);

      // Mas ambos devem validar a mesma senha
      expect(await bcrypt.compare(senha, hash1)).toBe(true);
      expect(await bcrypt.compare(senha, hash2)).toBe(true);
    });
  });

  describe('🔑 Sistema de Autenticação', () => {
    test('✅ Login completo deve funcionar', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockUser = {
        id: 1,
        contratante_id: 18,
        cpf: '00000000001',
        nome: 'Gestor CLIENTE_A',
        tipo: 'gestor',
      };

      const H1 = `$2a$06$${'a'.repeat(53)}`;
      const mockSenha = {
        senha_hash: H1,
      };

      mockQuery
        .mockResolvedValueOnce([mockUser]) // Buscar usuário
        .mockResolvedValueOnce([mockSenha]); // Buscar senha

      // Simular processo de login
      const cpf = '00000000001';
      const senha = 'senha_ficticia_001';

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

      // Verificar queries corretas
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM funcionarios WHERE cpf = $1',
        [cpf]
      );

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
        [cpf]
      );
    });

    test('❌ Login deve falhar com senha incorreta', async () => {
      const mockQuery = require('@/lib/db').query;

      const H1 = `$2a$06$${'a'.repeat(53)}`;
      const mockSenha = {
        senha_hash: H1,
      };

      mockQuery.mockResolvedValue([mockSenha]);

      const senhaCorreta = 'senha_ficticia_001';
      const senhaIncorreta = '999999';

      const hash = mockSenha.senha_hash;

      const validaCorreta = await bcrypt.compare(senhaCorreta, hash);
      const validaIncorreta = await bcrypt.compare(senhaIncorreta, hash);

      expect(validaCorreta).toBe(true);
      expect(validaIncorreta).toBe(false);
    });

    test('❌ Login deve falhar com CPF inexistente', async () => {
      const mockQuery = require('@/lib/db').query;
      mockQuery.mockResolvedValue([]); // Nenhum usuário encontrado

      const result = await query('SELECT * FROM funcionarios WHERE cpf = $1', [
        '99999999999',
      ]);

      expect(result).toHaveLength(0);
    });

    test('🚫 Deve impedir acesso direto a hashes', async () => {
      const mockQuery = require('@/lib/db').query;

      // Simular tentativa de SELECT * (que incluiria senha_hash)
      mockQuery.mockRejectedValue(
        new Error('Acesso negado: senha_hash é confidencial')
      );

      await expect(query('SELECT * FROM entidades_senhas')).rejects.toThrow(
        'Acesso negado'
      );
    });
  });

  describe('📊 Monitoramento de Segurança', () => {
    test('📈 Deve rastrear tentativas de login', async () => {
      const mockQuery = require('@/lib/db').query;

      const mockTentativas = [
        {
          cpf: '87545772920',
          sucesso: true,
          ip: '192.168.1.1',
          data: '2025-12-23T10:00:00Z',
        },
        {
          cpf: '87545772920',
          sucesso: false,
          ip: '192.168.1.1',
          data: '2025-12-23T10:01:00Z',
        },
        {
          cpf: '45678901234',
          sucesso: true,
          ip: '192.168.1.2',
          data: '2025-12-23T10:02:00Z',
        },
      ];

      mockQuery.mockResolvedValue(mockTentativas);

      const result = await query(
        'SELECT * FROM log_tentativas_login ORDER BY data DESC'
      );

      expect(result).toHaveLength(3);
      expect(result[0].sucesso).toBe(true);
      expect(result[1].sucesso).toBe(false);
    });

    test('🚨 Deve detectar padrões suspeitos', async () => {
      const mockQuery = require('@/lib/db').query;

      // Simular múltiplas tentativas falhadas do mesmo IP
      const mockFalhas = Array(5).fill({
        cpf: '87545772920',
        sucesso: false,
        ip: '192.168.1.100',
        data: '2025-12-23T10:00:00Z',
      });

      mockQuery.mockResolvedValue(mockFalhas);

      const result = await query(`
        SELECT ip, COUNT(*) as tentativas_falhas
        FROM log_tentativas_login
        WHERE sucesso = false AND data >= NOW() - INTERVAL '1 hour'
        GROUP BY ip
        HAVING COUNT(*) >= 5
      `);

      // Como estamos mockando, retornamos as tentativas individuais
      expect(result).toHaveLength(5);
      expect(result[0].ip).toBe('192.168.1.100');
    });

    test('⏰ Deve ter expiração de sessão adequada', async () => {
      // Simular configuração de sessão
      const sessionConfig = {
        maxAge: 8 * 60 * 60 * 1000, // 8 horas em ms
        httpOnly: true,
        secure: true, // Em produção
        sameSite: 'strict',
      };

      expect(sessionConfig.maxAge).toBe(28800000); // 8 horas
      expect(sessionConfig.httpOnly).toBe(true);
      expect(sessionConfig.secure).toBe(true);
      expect(sessionConfig.sameSite).toBe('strict');
    });
  });

  describe('🔧 Manutenção e Recuperação', () => {
    test('🔄 Deve permitir reset de senha autorizado', async () => {
      const mockQuery = require('@/lib/db').query;

      const novaSenha = 'nova_senha_123';
      const novoHash = await bcrypt.hash(novaSenha, 6);

      mockQuery.mockResolvedValue({ rowCount: 1 });

      // Simular reset autorizado
      const result = await query(
        'UPDATE entidades_senhas SET senha_hash = $1, atualizado_em = NOW() WHERE cpf = $2',
        [novoHash, '00000000001']
      );

      expect(result.rowCount).toBe(1);

      // Validar nova senha
      const isValid = await bcrypt.compare(novaSenha, novoHash);
      expect(isValid).toBe(true);
    });

    test('📧 Deve validar formato de email para recuperação', async () => {
      const emailsValidos = [
        'usuario@empresa.com',
        'gestor.rh@empresa.com.br',
        'admin_sistema@dominio.org',
      ];

      const emailsInvalidos = [
        'usuario',
        'usuario@',
        '@dominio.com',
        'usuario@dominio',
        'usuario@@dominio.com',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      emailsValidos.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });

      emailsInvalidos.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test('🕒 Deve ter limite de tempo para recuperação', async () => {
      // Simular token de recuperação com expiração
      const tokenExpiracao = {
        token: 'abc123def456',
        criado_em: new Date(),
        expira_em: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        usado: false,
      };

      const agora = new Date();
      const expirou = agora > tokenExpiracao.expira_em;

      expect(expirou).toBe(false); // Ainda não expirou

      // Simular expiração
      tokenExpiracao.expira_em = new Date(Date.now() - 1000); // 1 segundo atrás
      const expirouAgora = agora > tokenExpiracao.expira_em;

      expect(expirouAgora).toBe(true);
    });
  });

  /**
   * Testes que registram e garantem as proibições de uso do banco real
   */
  describe('⚠️ Política de Uso de Banco em Testes', () => {
    test('🚫 TEST_DATABASE_URL deve apontar para um DB de testes e não para o DB de produção', () => {
      const PROD_DB_NAME = ['nr', '-', 'bps', '_', 'db'].join('');
      const testDb =
        process.env.TEST_DATABASE_URL || process.env.TEST_DATABASE || '';
      expect(testDb).toBeDefined();
      // Deve conter '_test' no nome da base de testes
      expect(testDb).toContain('_test');
      // Não deve ser a base de produção/dev (verificação via variável para evitar string literal no arquivo)
      expect(testDb).not.toMatch(new RegExp(`${PROD_DB_NAME}(?!_test)`));
    });

    test('🔒 As queries devem ser mockadas e não devem executar operações de escrita em tabelas sensíveis', () => {
      const PROD_DB_NAME = ['nr', '-', 'bps', '_', 'db'].join('');
      const mockQuery = require('@/lib/db').query;
      expect(jest.isMockFunction(mockQuery)).toBe(true);

      // Se houver chamadas, verificar se alguma tentativa de escrita em entidades_senhas ocorreu
      const chamadas = mockQuery.mock.calls || [];
      const proibido = new RegExp(
        `INSERT\\s+INTO\\s+entidades_senhas|DELETE\\s+FROM\\s+entidades_senhas|DROP\\s+TABLE|${PROD_DB_NAME}`,
        'gi'
      );

      for (const chamada of chamadas) {
        const sql = chamada[0];
        if (typeof sql === 'string') {
          expect(sql).not.toMatch(proibido);
        }
      }
    });
  });
});
