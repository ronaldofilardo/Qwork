/**
 * E2E Integration test: Criar funcionário em entidade (executa POST real e valida no DB)
 *
 * Observações:
 * - Usa a função real de DB (não faz mock de '@/lib/db') para validar o fluxo completo
 * - Mocka apenas `requireEntity` para forçar o perfil `gestor` com `contratante_id` criado no setup
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
  let contratanteId: number;

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

    // Criar contratante do tipo entidade (único e isolado)
    const cnpj = `99${Date.now().toString().slice(-12)}`;

    const res = await query(
      `
      INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
      VALUES ('entidade', 'Entidade E2E Test', $1, 'e2e@teste.local', '11900000000', 'Rua E2E Teste, 1', 'São Paulo', 'SP', '01000000', 'Resp E2E', '52998224725', 'resp@teste.local', '11911111111', true, true)
      RETURNING id
    `,
      [cnpj]
    );

    contratanteId = res.rows[0].id;

    // Garantir que CPF de teste não existe
    await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
  });

  it('deve criar funcionário via POST e persistir no banco', async () => {
    mockRequireEntity.mockResolvedValue({
      contratante_id: contratanteId,
      cpf: '99988877766',
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
      'SELECT cpf, nome, email, contratante_id FROM funcionarios WHERE cpf = $1',
      [testCpf]
    );
    expect(dbRes.rows.length).toBe(1);
    expect(dbRes.rows[0].contratante_id).toBe(contratanteId);
    expect(dbRes.rows[0].email).toBe(body.email);
  });
});
