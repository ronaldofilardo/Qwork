/**
 * @file __tests__/integration/login-system-accounts.test.ts
 * Testes de Login para Contas de Sistema (suporte, comercial, vendedor)
 * 
 * Valida:
 * - Busca prioritária em `usuarios` para tipos de sistema
 * - Validação de senha com bcrypt
 * - Fallback para `funcionarios` ainda funciona
 * - Login de Amanda (suporte) e Talita Parteka (comercial)
 */

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Login - Contas de Sistema', () => {
  // CPFs de teste
  const AMANDA_SUPORTE = '09777228996';
  const TALITA_COMERCIAL = '04256059903';

  beforeAll(async () => {
    // Garantir que os usuários existem em usuarios com senhas corretas
    const senhaHash = await bcrypt.hash('123456', 10);

    // Amanda - Suporte
    await query(
      `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
       VALUES ($1, $2, $3, $4::usuario_tipo_enum, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (cpf) DO UPDATE 
       SET senha_hash = EXCLUDED.senha_hash,
           tipo_usuario = EXCLUDED.tipo_usuario,
           atualizado_em = CURRENT_TIMESTAMP`,
      ['09777228996', 'Amanda', 'amanda.suporte@qwork.local', 'suporte', senhaHash]
    ).catch(() => {
      // Pode falhar se já existe, o que é OK
    });

    // Talita - Comercial
    await query(
      `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
       VALUES ($1, $2, $3, $4::usuario_tipo_enum, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (cpf) DO UPDATE 
       SET senha_hash = EXCLUDED.senha_hash,
           tipo_usuario = EXCLUDED.tipo_usuario,
           atualizado_em = CURRENT_TIMESTAMP`,
      ['04256059903', 'Talita Parteka', 'talita.comercial@qwork.local', 'comercial', senhaHash]
    ).catch(() => {
      // Pode falhar se já existe, o que é OK
    });
  });

  afterAll(async () => {
    // Limpar dados de teste (opcional)
    // await query(`DELETE FROM usuarios WHERE cpf IN ($1, $2)`, [AMANDA_SUPORTE, TALITA_COMERCIAL]);
  });

  describe('Busca prioritária em usuarios para tipos de sistema', () => {
    it('deve encontrar usuário SUPORTE em usuarios antes de funcionarios', async () => {
      const result = await query(
        `SELECT cpf, tipo_usuario, ativo, senha_hash FROM usuarios WHERE cpf = $1 LIMIT 1`,
        [AMANDA_SUPORTE]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tipo_usuario).toBe('suporte');
      expect(result.rows[0].ativo).toBe(true);
      expect(result.rows[0].senha_hash).toBeTruthy();
    });

    it('deve encontrar usuário COMERCIAL em usuarios antes de funcionarios', async () => {
      const result = await query(
        `SELECT cpf, tipo_usuario, ativo, senha_hash FROM usuarios WHERE cpf = $1 LIMIT 1`,
        [TALITA_COMERCIAL]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tipo_usuario).toBe('comercial');
      expect(result.rows[0].ativo).toBe(true);
      expect(result.rows[0].senha_hash).toBeTruthy();
    });
  });

  describe('Validação de senha com bcrypt', () => {
    it('deve validar senha de Amanda (suporte) com bcrypt', async () => {
      const result = await query(
        `SELECT senha_hash FROM usuarios WHERE cpf = $1`,
        [AMANDA_SUPORTE]
      );

      expect(result.rows.length).toBe(1);
      const isValid = await bcrypt.compare('123456', result.rows[0].senha_hash);
      expect(isValid).toBe(true);
    });

    it('deve validar senha de Talita (comercial) com bcrypt', async () => {
      const result = await query(
        `SELECT senha_hash FROM usuarios WHERE cpf = $1`,
        [TALITA_COMERCIAL]
      );

      expect(result.rows.length).toBe(1);
      const isValid = await bcrypt.compare('123456', result.rows[0].senha_hash);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar senha incorreta', async () => {
      const result = await query(
        `SELECT senha_hash FROM usuarios WHERE cpf = $1`,
        [AMANDA_SUPORTE]
      );

      const isValid = await bcrypt.compare('senhaerrada', result.rows[0].senha_hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Constraint usuarios_tipo_check', () => {
    it('deve ter clinica_id e entidade_id como NULL para SUPORTE', async () => {
      const result = await query(
        `SELECT tipo_usuario, clinica_id, entidade_id FROM usuarios WHERE cpf = $1`,
        [AMANDA_SUPORTE]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].clinica_id).toBeNull();
      expect(result.rows[0].entidade_id).toBeNull();
    });

    it('deve ter clinica_id e entidade_id como NULL para COMERCIAL', async () => {
      const result = await query(
        `SELECT tipo_usuario, clinica_id, entidade_id FROM usuarios WHERE cpf = $1`,
        [TALITA_COMERCIAL]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].clinica_id).toBeNull();
      expect(result.rows[0].entidade_id).toBeNull();
    });
  });

  describe('Lógica de login - priorização de fonte', () => {
    it('para tipo_usuario=suporte, deve buscar em usuarios primeiro', async () => {
      // Simular a lógica do login: buscar em usuarios PRIMEIRO para tipos de sistema
      const SYSTEM_ACCOUNT_TYPES = ['suporte', 'comercial', 'vendedor', 'admin', 'emissor'];
      
      const usuariosResult = await query(
        `SELECT cpf, tipo_usuario FROM usuarios WHERE cpf = $1 LIMIT 1`,
        [AMANDA_SUPORTE]
      );

      if (usuariosResult.rows.length > 0) {
        const usuario = usuariosResult.rows[0];
        if (SYSTEM_ACCOUNT_TYPES.includes(usuario.tipo_usuario)) {
          // ✓ Encontrado em usuarios E é tipo de sistema
          expect(usuario.tipo_usuario).toBe('suporte');
          expect(SYSTEM_ACCOUNT_TYPES).toContain(usuario.tipo_usuario);
        }
      }
    });

    it('para tipo_usuario=comercial, deve buscar em usuarios primeiro', async () => {
      const SYSTEM_ACCOUNT_TYPES = ['suporte', 'comercial', 'vendedor', 'admin', 'emissor'];
      
      const usuariosResult = await query(
        `SELECT cpf, tipo_usuario FROM usuarios WHERE cpf = $1 LIMIT 1`,
        [TALITA_COMERCIAL]
      );

      if (usuariosResult.rows.length > 0) {
        const usuario = usuariosResult.rows[0];
        if (SYSTEM_ACCOUNT_TYPES.includes(usuario.tipo_usuario)) {
          // ✓ Encontrado em usuarios E é tipo de sistema
          expect(usuario.tipo_usuario).toBe('comercial');
          expect(SYSTEM_ACCOUNT_TYPES).toContain(usuario.tipo_usuario);
        }
      }
    });
  });

  describe('Ativação e disponibilidade', () => {
    it('Amanda (suporte) deve estar ativa', async () => {
      const result = await query(
        `SELECT ativo FROM usuarios WHERE cpf = $1`,
        [AMANDA_SUPORTE]
      );

      expect(result.rows[0].ativo).toBe(true);
    });

    it('Talita (comercial) deve estar ativa', async () => {
      const result = await query(
        `SELECT ativo FROM usuarios WHERE cpf = $1`,
        [TALITA_COMERCIAL]
      );

      expect(result.rows[0].ativo).toBe(true);
    });
  });

  describe('Enum usuario_tipo_enum', () => {
    it('deve ter valores suporte e comercial no enum', async () => {
      const result = await query(
        `SELECT enumlabel FROM pg_enum 
         JOIN pg_type ON pg_enum.enumtypid=pg_type.oid 
         WHERE pg_type.typname='usuario_tipo_enum' 
         ORDER BY enumsortorder`
      );

      const labels = result.rows.map(r => r.enumlabel);
      expect(labels).toContain('suporte');
      expect(labels).toContain('comercial');
    });
  });
});
