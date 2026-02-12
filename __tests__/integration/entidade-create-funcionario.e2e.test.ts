/**
 * E2E Integration test: Criar funcionário em entidade (executa POST real e valida no DB)
 *
 * Observações:
 * - Usa a função real de DB (não faz mock de '@/lib/db') para validar o fluxo completo
 * - Mocka apenas `requireEntity` para forçar o perfil `gestor` com `entidade_id` criado no setup
 * - Arquitetura segregada: usa tabela `funcionarios_entidades` para relacionamento
 */

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { POST } from '@/app/api/entidade/funcionarios/route';
import { requireEntity } from '@/lib/session';

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;

describe('E2E: criar funcionário na entidade (integração real DB)', () => {
  const testCpf = '71188557076'; // CPF válido usado para testes
  let entidadeId: number;
  let gestorCpf: string;

  beforeAll(async () => {
    // Garantir banco de teste
    if (
      !process.env.TEST_DATABASE_URL ||
      !String(process.env.TEST_DATABASE_URL).includes('_test')
    ) {
      throw new Error(
        'TEST_DATABASE_URL não configurado para executar testes E2E'
      );
    }

    // Criar entidade de teste
    const entidadeRes = await query(
      `
      INSERT INTO entidades (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa)
      VALUES ('entidade', 'Entidade E2E Test', $1, 'e2e@teste.local', '11900000000', 'Rua E2E Teste, 1', 'São Paulo', 'SP', '01000000', 'Resp E2E', '52998224725', 'resp@teste.local', '11911111111', true)
      RETURNING id
    `,
      ['99' + Date.now().toString().slice(-12)]
    );

    entidadeId = entidadeRes.rows[0].id;
    gestorCpf = '52998224725';

    // Criar gestor da entidade (senha de teste)
    const senhaHash =
      '$2a$10$sbCN3w9YWGdo8F64D48rA.PvmcJQBTzG8xLCU8ma4MBdg7zPcq85W'; // '123456' com bcrypt
    await query(
      `
      INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (entidade_id, cpf) DO UPDATE SET senha_hash = $3
    `,
      [entidadeId, gestorCpf, senhaHash]
    );

    // Garantir que CPF de teste não existe
    await query(
      'DELETE FROM funcionarios_entidades WHERE funcionario_id IN (SELECT id FROM funcionarios WHERE cpf = $1)',
      [testCpf]
    );
    await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query(
      'DELETE FROM funcionarios_entidades WHERE funcionario_id IN (SELECT id FROM funcionarios WHERE cpf = $1)',
      [testCpf]
    );
    await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
    await query(
      'DELETE FROM entidades_senhas WHERE entidade_id = $1 AND cpf = $2',
      [entidadeId, gestorCpf]
    );
    await query('DELETE FROM entidades WHERE id = $1', [entidadeId]);
  });

  it('deve criar funcionário via POST e persistir no banco com seguranç (contexto de auditoria)', async () => {
    mockRequireEntity.mockResolvedValue({
      entidade_id: entidadeId,
      cpf: gestorCpf,
      nome: 'E2E Gestor',
      perfil: 'gestor',
    } as any);

    const body = {
      cpf: testCpf,
      nome: 'Funcionario E2E',
      data_nascimento: '1990-05-05',
      setor: 'RH',
      funcao: 'Assistente',
      email: 'e2e.func@teste.local',
    };

    const request = new NextRequest(
      'http://localhost/api/entidade/funcionarios',
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar persistência no banco
    const dbRes = await query(
      'SELECT id, cpf, nome, email FROM funcionarios WHERE cpf = $1',
      [testCpf]
    );
    expect(dbRes.rows.length).toBe(1);
    expect(dbRes.rows[0].email).toBe(body.email);

    const funcionarioId = dbRes.rows[0].id;

    // Verificar relacionamento em funcionarios_entidades
    const relRes = await query(
      'SELECT funcionario_id, entidade_id, ativo FROM funcionarios_entidades WHERE funcionario_id = $1 AND entidade_id = $2',
      [funcionarioId, entidadeId]
    );
    expect(relRes.rows.length).toBe(1);
    expect(relRes.rows[0].ativo).toBe(true);
  });
});
