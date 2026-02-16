/**
 * Testes para lib/db-admin-scripts.ts
 *
 * Valida que operações administrativas mantêm contexto de auditoria
 * e evitam erro "SECURITY: app.current_user_cpf not set"
 */

import { withAdminContext, atualizarSenhaAdmin } from '@/lib/db-admin-scripts';
import { query } from '@/lib/db';
import bcryptjs from 'bcryptjs';

// Mock da sessão
jest.mock('@/lib/session', () => ({
  getSession: jest.fn().mockReturnValue({
    cpf: '12345678909',
    perfil: 'admin',
  }),
}));

describe('lib/db-admin-scripts', () => {
  describe('withAdminContext', () => {
    it('deve configurar app.current_user_cpf dentro da transação', async () => {
      const testCpf = '00000000000';
      let contextoSetado = false;

      await withAdminContext(async (client) => {
        // Verificar que contexto foi setado
        const result = await client.query(
          "SELECT current_setting('app.current_user_cpf', true) as cpf"
        );
        contextoSetado = result.rows[0]?.cpf === testCpf;
        return contextoSetado;
      });

      expect(contextoSetado).toBe(true);
    });

    it('deve configurar app.current_user_perfil dentro da transação', async () => {
      const testPerfil = 'admin';
      let perfilSetado = false;

      await withAdminContext(async (client) => {
        const result = await client.query(
          "SELECT current_setting('app.current_user_perfil', true) as perfil"
        );
        perfilSetado = result.rows[0]?.perfil === testPerfil;
        return perfilSetado;
      });

      expect(perfilSetado).toBe(true);
    });

    it('deve permitir múltiplas queries na mesma transação', async () => {
      const resultados: number[] = [];

      await withAdminContext(async (client) => {
        // Query 1
        const r1 = await client.query('SELECT 1 as valor');
        resultados.push(r1.rows[0].valor);

        // Query 2
        const r2 = await client.query('SELECT 2 as valor');
        resultados.push(r2.rows[0].valor);

        return resultados;
      });

      expect(resultados).toEqual([1, 2]);
    });

    it('deve aceitar contexto customizado', async () => {
      const testCpf = '12345678901';
      const testPerfil = 'gestor';
      let contextoCustomizado = { cpf: '', perfil: '' };

      await withAdminContext(
        async (client) => {
          const cpfResult = await client.query(
            "SELECT current_setting('app.current_user_cpf', true) as cpf"
          );
          const perfilResult = await client.query(
            "SELECT current_setting('app.current_user_perfil', true) as perfil"
          );

          contextoCustomizado = {
            cpf: cpfResult.rows[0].cpf,
            perfil: perfilResult.rows[0].perfil,
          };
          return contextoCustomizado;
        },
        {
          cpf: testCpf,
          perfil: testPerfil,
          operation: 'Teste de contexto customizado',
        }
      );

      expect(contextoCustomizado.cpf).toBe(testCpf);
      expect(contextoCustomizado.perfil).toBe(testPerfil);
    });

    it('deve executar callback e retornar resultado', async () => {
      const resultado = await withAdminContext(
        async (client) => {
          const result = await client.query('SELECT 42 as numero');
          return result.rows[0].numero;
        },
        { operation: 'Teste de resultado' }
      );

      expect(resultado).toBe(42);
    });
  });

  describe('atualizarSenhaAdmin', () => {
    let testCpf: string;
    let initialHash: string;

    beforeAll(async () => {
      // Criar usuário de teste
      testCpf = '88888888888';
      initialHash = await bcryptjs.hash('senha123', 10);

      // Remover se já existe
      try {
        await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
      } catch {
        // Ignorar
      }

      // Criar novo
      await query(
        'INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, senha_hash, criado_em) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [
          testCpf,
          'Admin Test User',
          'admin.test@test.com',
          'funcionario',
          true,
          initialHash,
        ]
      );
    });

    afterAll(async () => {
      // Cleanup
      try {
        await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
      } catch {
        // Ignorar
      }
    });

    it('deve atualizar a senha com sucesso', async () => {
      const novoHash = await bcryptjs.hash('novaSenha456', 10);
      const resultado = await atualizarSenhaAdmin(
        testCpf,
        novoHash,
        'Teste unitário'
      );

      expect(resultado).toEqual({
        nome: 'Admin Test User',
        email: 'admin.test@test.com',
        perfil: 'funcionario',
      });

      // Verificar que senha foi atualizada no banco
      const usuarioAtualizado = await query(
        'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
        [testCpf]
      );

      expect(usuarioAtualizado.rows[0].senha_hash).toBe(novoHash);
    });

    it('deve lançar erro se usuário não existe', async () => {
      const hashFake = await bcryptjs.hash('fake', 10);

      await expect(
        atualizarSenhaAdmin('11111111111', hashFake, 'Teste erro')
      ).rejects.toThrow('não encontrado');
    });

    it('deve aceitar motivo da alteração', async () => {
      const novoHash = await bcryptjs.hash('outraSenha789', 10);
      const motivo = 'Teste com motivo específico';

      // Deve completar sem erro
      const resultado = await atualizarSenhaAdmin(testCpf, novoHash, motivo);

      expect(resultado.perfil).toBe('funcionario');

      // Verificar que senha foi atualizada
      const usuarioAtualizado = await query(
        'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
        [testCpf]
      );

      expect(usuarioAtualizado.rows[0].senha_hash).toBe(novoHash);
    });
  });
});
