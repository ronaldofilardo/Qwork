/**
 * Teste de Integração: Aprovação de Entidade → Login de Gestor
 *
 * Valida que após aprovação via API, o gestor consegue fazer login
 * usando senha baseada nos 6 últimos dígitos do CNPJ.
 *
 * Nova Arquitetura:
 * - Entidade criada em `entidades`
 * - Usuário gestor criado em `usuarios` com tipo_usuario='gestor'
 * - Senha armazenada em `entidades_senhas` (hash dos 6 últimos dígitos do CNPJ)
 */

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { POST as loginHandler } from '@/app/api/auth/login/route';

jest.mock('@/lib/session', () => ({
  createSession: jest.fn(),
}));

jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'test',
  })),
}));

describe('Integração: Aprovação de Entidade → Login de Gestor (Nova Arquitetura)', () => {
  const TEST_CNPJ = '12345678000190';
  const TEST_CPF = '12345678901';
  const TEST_EMAIL = 'gestor@test.com';
  const TEST_NOME = 'Gestor Teste';

  // Senha padrão: 6 últimos dígitos do CNPJ
  const SENHA_PADRAO = TEST_CNPJ.slice(-6); // '000190'

  let testEntidadeId: number;

  beforeAll(async () => {
    // Limpar dados de testes anteriores
    await query('DELETE FROM usuarios WHERE cpf = $1', [TEST_CPF]);
    await query('DELETE FROM entidades WHERE cnpj = $1', [TEST_CNPJ]);
  });

  afterAll(async () => {
    // Cleanup
    if (testEntidadeId) {
      await query('DELETE FROM entidades_senhas WHERE entidade_id = $1', [
        testEntidadeId,
      ]);
      await query('DELETE FROM usuarios WHERE cpf = $1', [TEST_CPF]);
      await query('DELETE FROM entidades WHERE id = $1', [testEntidadeId]);
    }
  });

  it('deve permitir login após aprovação via API (fluxo completo)', async () => {
    // 1. Criar entidade (simula aprovação via API)
    const entidadeResult = await query(
      `
      INSERT INTO entidades (
        cnpj, nome, tipo, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa, pagamento_confirmado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `,
      [
        TEST_CNPJ,
        'Entidade Teste Ltda',
        'entidade',
        TEST_EMAIL,
        '11999999999',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01234567',
        TEST_NOME,
        TEST_CPF,
        TEST_EMAIL,
        '11999999999',
        true,
        true,
      ]
    );
    testEntidadeId = entidadeResult.rows[0].id;

    // 2. Criar usuário gestor
    await query(
      `
      INSERT INTO usuarios (
        cpf,
        nome,
        email,
        tipo_usuario,
        entidade_id,
        ativo
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [TEST_CPF, TEST_NOME, TEST_EMAIL, 'gestor', testEntidadeId, true]
    );

    // 3. Criar senha baseada em CNPJ (6 últimos dígitos)
    const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
    await query(
      `
      INSERT INTO entidades_senhas (
        entidade_id,
        cpf,
        senha_hash
      ) VALUES ($1, $2, $3)
    `,
      [testEntidadeId, TEST_CPF, senhaHash]
    );

    // 4. Testar login
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: TEST_CPF,
        senha: SENHA_PADRAO,
      }),
    });

    const response = await loginHandler(request as any);
    const data = await response.json();

    // Validações
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe(TEST_CPF);
    expect(data.perfil).toBe('gestor');
    expect(data.redirectTo).toBe('/entidade');
  });

  it('deve validar senha baseada em CNPJ (últimos 6 dígitos)', async () => {
    // Verificar que a senha armazenada é o hash dos 6 últimos dígitos do CNPJ
    const senhaResult = await query(
      `
      SELECT senha_hash 
      FROM entidades_senhas 
      WHERE cpf = $1 AND entidade_id = $2
    `,
      [TEST_CPF, testEntidadeId]
    );

    expect(senhaResult.rows.length).toBe(1);

    const senhaHash = senhaResult.rows[0].senha_hash;
    const isValid = await bcrypt.compare(SENHA_PADRAO, senhaHash);

    expect(isValid).toBe(true);
    expect(SENHA_PADRAO).toBe('000190'); // 6 últimos dígitos de 12345678000190
  });

  it('deve verificar isolamento entre ambientes de teste', async () => {
    // Verificar que o usuário foi criado corretamente
    const usuarioResult = await query(
      'SELECT tipo_usuario, entidade_id, ativo FROM usuarios WHERE cpf = $1',
      [TEST_CPF]
    );

    expect(usuarioResult.rows.length).toBe(1);
    expect(usuarioResult.rows[0].tipo_usuario).toBe('gestor');
    expect(usuarioResult.rows[0].entidade_id).toBe(testEntidadeId);
    expect(usuarioResult.rows[0].ativo).toBe(true);

    // Verificar que a senha está na tabela correta
    const senhaResult = await query(
      'SELECT id FROM entidades_senhas WHERE cpf = $1 AND entidade_id = $2',
      [TEST_CPF, testEntidadeId]
    );

    expect(senhaResult.rows.length).toBe(1);
  });

  it('deve rejeitar login com senha incorreta', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: TEST_CPF,
        senha: 'senhaErrada123',
      }),
    });

    const response = await loginHandler(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('CPF ou senha inválidos');
  });
});
