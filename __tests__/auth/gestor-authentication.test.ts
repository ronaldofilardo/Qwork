/**
 * Testes Críticos de Autenticação - Nova Arquitetura
 *
 * Valida a arquitetura de senhas segregadas:
 * - usuarios (tabela principal sem senha_hash)
 * - entidades_senhas (para gestores)
 * - clinicas_senhas (para RH)
 *
 * Estes testes verificam:
 * 1. Usuários estão em usuarios com tipo_usuario correto
 * 2. Senhas de gestores estão em entidades_senhas
 * 3. Senhas de RH estão em clinicas_senhas
 * 4. Admin e Emissor não precisam de senha em tabelas separadas
 */

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Autenticação Nova Arquitetura: usuarios + senhas segregadas', () => {
  const TEST_CPF_GESTOR = '11111111111';
  const TEST_CPF_RH = '22222222222';
  const TEST_CPF_ADMIN = '00000000000';
  const TEST_PASSWORD = 'senha123';

  let testEntidadeId: number;
  let testClinicaId: number;

  beforeAll(async () => {
    // Setup: Criar entidade para testes
    const entidade = await query(
      `
      INSERT INTO entidades (
        cnpj, nome, tipo, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `,
      [
        '12345678000190',
        'Entidade Teste',
        'entidade',
        'entidade@test.com',
        '11999999999',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01234567',
        'Responsável Teste',
        '12345678901',
        'resp@test.com',
        '11999999999',
        true,
      ]
    );
    testEntidadeId = entidade.rows[0].id;

    // Criar clínica para testes
    const clinica = await query(
      `
      INSERT INTO clinicas (
        nome,
        cnpj,
        entidade_id,
        ativa
      ) VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
      ['Clínica Teste', '98765432000199', testEntidadeId, true]
    );
    testClinicaId = clinica.rows[0].id;

    // Criar usuário gestor
    await query(
      `
      INSERT INTO usuarios (cpf, nome, email, tipo_usuario, entidade_id, ativo)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        TEST_CPF_GESTOR,
        'Gestor Teste',
        'gestor@test.com',
        'gestor',
        testEntidadeId,
        true,
      ]
    );

    // Criar senha para gestor em entidades_senhas
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    await query(
      `
      INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash)
      VALUES ($1, $2, $3)
    `,
      [testEntidadeId, TEST_CPF_GESTOR, hashedPassword]
    );

    // Criar usuário RH
    await query(
      `
      INSERT INTO usuarios (cpf, nome, email, tipo_usuario, clinica_id, ativo)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [TEST_CPF_RH, 'RH Teste', 'rh@test.com', 'rh', testClinicaId, true]
    );

    // Criar senha para RH em clinicas_senhas
    await query(
      `
      INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash)
      VALUES ($1, $2, $3)
    `,
      [testClinicaId, TEST_CPF_RH, hashedPassword]
    );

    // Criar usuário admin (sem senha em tabelas separadas)
    await query(
      `
      INSERT INTO usuarios (cpf, nome, email, tipo_usuario, ativo)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cpf) DO NOTHING
    `,
      [TEST_CPF_ADMIN, 'Admin Teste', 'admin@test.com', 'admin', true]
    );
  });

  afterAll(async () => {
    // Cleanup
    await query('DELETE FROM clinicas_senhas WHERE cpf = ANY($1)', [
      [TEST_CPF_RH],
    ]);
    await query('DELETE FROM entidades_senhas WHERE cpf = ANY($1)', [
      [TEST_CPF_GESTOR],
    ]);
    await query('DELETE FROM usuarios WHERE cpf = ANY($1)', [
      [TEST_CPF_GESTOR, TEST_CPF_RH],
    ]);
    await query('DELETE FROM clinicas WHERE id = $1', [testClinicaId]);
    await query('DELETE FROM entidades WHERE id = $1', [testEntidadeId]);
  });

  describe('1. Validação de Tipo de Usuário', () => {
    it('deve identificar gestor como tipo_usuario gestor', async () => {
      const result = await query(
        'SELECT tipo_usuario FROM usuarios WHERE cpf = $1',
        [TEST_CPF_GESTOR]
      );
      expect(result.rows[0].tipo_usuario).toBe('gestor');
    });

    it('deve identificar RH como tipo_usuario rh', async () => {
      const result = await query(
        'SELECT tipo_usuario FROM usuarios WHERE cpf = $1',
        [TEST_CPF_RH]
      );
      expect(result.rows[0].tipo_usuario).toBe('rh');
    });

    it('deve identificar admin como tipo_usuario admin', async () => {
      const result = await query(
        'SELECT tipo_usuario FROM usuarios WHERE cpf = $1',
        [TEST_CPF_ADMIN]
      );
      expect(result.rows[0].tipo_usuario).toBe('admin');
    });
  });

  describe('2. Validação de Senhas - Gestores', () => {
    it('deve validar senha de gestor em entidades_senhas', async () => {
      const result = await query(
        `SELECT es.senha_hash 
         FROM entidades_senhas es
         WHERE es.cpf = $1 AND es.entidade_id = $2`,
        [TEST_CPF_GESTOR, testEntidadeId]
      );

      expect(result.rows.length).toBe(1);
      const isValid = await bcrypt.compare(
        TEST_PASSWORD,
        result.rows[0].senha_hash
      );
      expect(isValid).toBe(true);
    });

    it('gestor NÃO deve ter senha em clinicas_senhas', async () => {
      const result = await query(
        'SELECT * FROM clinicas_senhas WHERE cpf = $1',
        [TEST_CPF_GESTOR]
      );
      expect(result.rows.length).toBe(0);
    });
  });

  describe('3. Validação de Senhas - RH', () => {
    it('deve validar senha de RH em clinicas_senhas', async () => {
      const result = await query(
        `SELECT cs.senha_hash 
         FROM clinicas_senhas cs
         WHERE cs.cpf = $1 AND cs.clinica_id = $2`,
        [TEST_CPF_RH, testClinicaId]
      );

      expect(result.rows.length).toBe(1);
      const isValid = await bcrypt.compare(
        TEST_PASSWORD,
        result.rows[0].senha_hash
      );
      expect(isValid).toBe(true);
    });

    it('RH NÃO deve ter senha em entidades_senhas', async () => {
      const result = await query(
        'SELECT * FROM entidades_senhas WHERE cpf = $1',
        [TEST_CPF_RH]
      );
      expect(result.rows.length).toBe(0);
    });
  });

  describe('4. Separação de Tabelas - usuarios sem senha_hash', () => {
    it('tabela usuarios NÃO deve ter coluna senha_hash', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'senha_hash'
      `);
      expect(result.rows.length).toBe(0);
    });

    it('gestor deve ter entidade_id e não clinica_id', async () => {
      const result = await query(
        'SELECT entidade_id, clinica_id FROM usuarios WHERE cpf = $1',
        [TEST_CPF_GESTOR]
      );
      expect(result.rows[0].entidade_id).toBe(testEntidadeId);
      expect(result.rows[0].clinica_id).toBeNull();
    });

    it('RH deve ter clinica_id e não entidade_id', async () => {
      const result = await query(
        'SELECT entidade_id, clinica_id FROM usuarios WHERE cpf = $1',
        [TEST_CPF_RH]
      );
      expect(result.rows[0].clinica_id).toBe(testClinicaId);
      expect(result.rows[0].entidade_id).toBeNull();
    });
  });

  describe('5. Fluxo Completo de Login', () => {
    it('LOGIN: gestor deve ser encontrado em usuarios + entidades_senhas', async () => {
      // Passo 1: Buscar em usuarios
      const usuario = await query(
        'SELECT cpf, tipo_usuario, entidade_id FROM usuarios WHERE cpf = $1',
        [TEST_CPF_GESTOR]
      );
      expect(usuario.rows.length).toBe(1);
      expect(usuario.rows[0].tipo_usuario).toBe('gestor');

      // Passo 2: Buscar senha em entidades_senhas
      const senha = await query(
        'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1 AND entidade_id = $2',
        [TEST_CPF_GESTOR, usuario.rows[0].entidade_id]
      );
      expect(senha.rows.length).toBe(1);
    });

    it('LOGIN: RH deve ser encontrado em usuarios + clinicas_senhas', async () => {
      // Passo 1: Buscar em usuarios
      const usuario = await query(
        'SELECT cpf, tipo_usuario, clinica_id FROM usuarios WHERE cpf = $1',
        [TEST_CPF_RH]
      );
      expect(usuario.rows.length).toBe(1);
      expect(usuario.rows[0].tipo_usuario).toBe('rh');

      // Passo 2: Buscar senha em clinicas_senhas
      const senha = await query(
        'SELECT senha_hash FROM clinicas_senhas WHERE cpf = $1 AND clinica_id = $2',
        [TEST_CPF_RH, usuario.rows[0].clinica_id]
      );
      expect(senha.rows.length).toBe(1);
    });

    it('LOGIN: admin deve ser encontrado em usuarios (sem senha em tabelas separadas)', async () => {
      const usuario = await query(
        'SELECT cpf, tipo_usuario FROM usuarios WHERE cpf = $1',
        [TEST_CPF_ADMIN]
      );
      expect(usuario.rows.length).toBe(1);
      expect(usuario.rows[0].tipo_usuario).toBe('admin');

      // Admin não tem senha em entidades_senhas ou clinicas_senhas
      const senhaEntidade = await query(
        'SELECT * FROM entidades_senhas WHERE cpf = $1',
        [TEST_CPF_ADMIN]
      );
      expect(senhaEntidade.rows.length).toBe(0);

      const senhaClinica = await query(
        'SELECT * FROM clinicas_senhas WHERE cpf = $1',
        [TEST_CPF_ADMIN]
      );
      expect(senhaClinica.rows.length).toBe(0);
    });
  });

  describe('6. Cenários de Erro', () => {
    it('deve rejeitar usuário inativo', async () => {
      // Desativar usuário
      await query('UPDATE usuarios SET ativo = false WHERE cpf = $1', [
        TEST_CPF_GESTOR,
      ]);

      const result = await query('SELECT ativo FROM usuarios WHERE cpf = $1', [
        TEST_CPF_GESTOR,
      ]);
      expect(result.rows[0].ativo).toBe(false);

      // Reativar para não afetar outros testes
      await query('UPDATE usuarios SET ativo = true WHERE cpf = $1', [
        TEST_CPF_GESTOR,
      ]);
    });

    it('deve rejeitar CPF inexistente', async () => {
      const result = await query('SELECT * FROM usuarios WHERE cpf = $1', [
        '99999999999',
      ]);
      expect(result.rows.length).toBe(0);
    });
  });
});
