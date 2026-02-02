/**
 * Teste de Integração: Correção de Autenticação
 *
 * Este teste verifica se a autenticação está funcionando corretamente
 * após correção do hash da senha do usuário admin.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Correção de Autenticação', () => {
  const ADMIN_CPF = '00000000000';
  const ADMIN_SENHA = '123456';
  const ADMIN_PERFIL = 'admin';

  describe('Hash da Senha Admin', () => {
    it('deve ter o hash correto da senha 123456 no banco', async () => {
      const result = await query(
        'SELECT cpf, nome, senha_hash, perfil, ativo FROM funcionarios WHERE cpf = $1',
        [ADMIN_CPF]
      );

      expect(result.rows).toHaveLength(1);
      const admin = result.rows[0];

      expect(admin.cpf).toBe(ADMIN_CPF);
      expect(admin.nome).toBe('Admin');
      expect(admin.perfil).toBe(ADMIN_PERFIL);
      expect(admin.ativo).toBe(true);

      // Verificar se o hash corresponde à senha 123456
      const senhaCorreta = await bcrypt.compare(ADMIN_SENHA, admin.senha_hash);
      expect(senhaCorreta).toBe(true);

      // [TEST] Hash da senha admin verificado com sucesso

    });

    it('deve rejeitar senha incorreta', async () => {
      const result = await query(
        'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
        [ADMIN_CPF]
      );

      const admin = result.rows[0];
      const senhaIncorreta = await bcrypt.compare(
        'senha_errada',
        admin.senha_hash
      );
      expect(senhaIncorreta).toBe(false);

      // [TEST] Senha incorreta rejeitada corretamente

    });
  });

  describe('Validação de Senha', () => {
    it('deve validar senha usando bcrypt.compare', async () => {
      // Simular o processo de validação como no código de produção
      const result = await query(
        'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
        [ADMIN_CPF]
      );

      const senhaHash = result.rows[0].senha_hash;

      // Testar validação direta
      const senhaValida = await bcrypt.compare(ADMIN_SENHA, senhaHash);
      expect(senhaValida).toBe(true);

      // Testar validação com senha errada
      const senhaInvalida = await bcrypt.compare('senha_errada', senhaHash);
      expect(senhaInvalida).toBe(false);

      // [TEST] Validação de senha bcrypt funcionando corretamente

    });

    it('deve funcionar com diferentes formatos de entrada', async () => {
      const result = await query(
        'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
        [ADMIN_CPF]
      );

      const senhaHash = result.rows[0].senha_hash;

      // Testar com senha com espaços (trim)
      const senhaComEspacos = `  ${ADMIN_SENHA}  `;
      const senhaTrimValida = await bcrypt.compare(
        senhaComEspacos.trim(),
        senhaHash
      );
      expect(senhaTrimValida).toBe(true);

        '[TEST] Validação de senha com trim funcionando corretamente'
      );
    });
  });

  describe('Integridade do Usuário Admin', () => {
    it('deve ter todos os campos obrigatórios preenchidos', async () => {
      const result = await query(
        `SELECT cpf, nome, email, perfil, ativo, criado_em, atualizado_em
         FROM funcionarios WHERE cpf = $1`,
        [ADMIN_CPF]
      );

      const admin = result.rows[0];

      expect(admin.cpf).toBeTruthy();
      expect(admin.nome).toBeTruthy();
      expect(admin.email).toBeTruthy();
      expect(admin.perfil).toBe(ADMIN_PERFIL);
      expect(admin.ativo).toBe(true);
      expect(admin.criado_em).toBeTruthy();
      expect(admin.atualizado_em).toBeTruthy();

      // [TEST] Integridade do usuário admin verificada

    });

    it('deve ser o único usuário com perfil admin', async () => {
      const result = await query(
        'SELECT COUNT(*) as total_admins FROM funcionarios WHERE perfil = $1',
        [ADMIN_PERFIL]
      );

      expect(parseInt(result.rows[0].total_admins)).toBe(1);

      // [TEST] Verificado que há apenas um usuário admin

    });
  });
});
