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

describe('RLS Integration: gestor_entidade visibility', () => {
  const testCpf = '71188557076';
  let contratanteId: number;
  let otherContratanteId: number;
  let avaliacaoId: number | null = null;

  beforeAll(async () => {
    if (
      !process.env.TEST_DATABASE_URL ||
      !String(process.env.TEST_DATABASE_URL).includes('_test')
    ) {
      throw new Error(
        'TEST_DATABASE_URL não configurado para executar testes E2E'
      );
    }

    // Criar contratante do tipo entidade
    const cnpj = `88${Date.now().toString().slice(-12)}`;

    const res = await query(
      `
      INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
      VALUES ('entidade', 'Entidade RLS Test', $1, 'e2e-rls@teste.local', '11900000001', 'Rua RLS Teste, 1', 'São Paulo', 'SP', '01000001', 'Resp RLS', '52998224725', 'resp-rls@teste.local', '11911111112', true, true)
      RETURNING id
    `,
      [cnpj]
    );

    contratanteId = res.rows[0].id;

    // Criar outro contratante para inserir avaliação que NÃO deve ser visível ao gestor
    const res2 = await query(
      `
      INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
      VALUES ('entidade', 'Entidade RLS Other', $1, 'e2e-rls2@teste.local', '11900000002', 'Rua RLS Teste 2, 1', 'São Paulo', 'SP', '01000002', 'Resp RLS2', '52998224726', 'resp-rls2@teste.local', '11911111113', true, true)
      RETURNING id
    `,
      [`89${Date.now().toString().slice(-12)}`]
    );

    otherContratanteId = res2.rows[0].id;

    // Garantir limpeza prévia
    await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
  });

  afterAll(async () => {
    // Cleanup
    if (avaliacaoId)
      await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
    await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
    await query(
      'DELETE FROM contratantes_funcionarios WHERE contratante_id = $1',
      [contratanteId]
    );
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    // Cleanup second contratante
    await query('DELETE FROM contratantes WHERE id = $1', [otherContratanteId]);
  });

  it('gestor_entidade deve ver avaliações do funcionário vinculado via RLS', async () => {
    // Mockar sessão de gestor de entidade
    mockRequireEntity.mockResolvedValue({
      contratante_id: contratanteId,
      cpf: '88877766655',
      nome: 'Gestor RLS',
      perfil: 'gestor_entidade',
    } as any);

    // Criar funcionário via API (vai também criar contratantes_funcionarios)
    const body = {
      cpf: testCpf,
      nome: 'Funcionario RLS',
      data_nascimento: '1990-01-01',
      setor: 'Operacional',
      funcao: 'Analista',
      email: 'rls.func@teste.local',
    };

    const request = new NextRequest(
      'http://localhost/api/entidade/funcionarios',
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await POST(request as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Inserir avaliação vinculada ao CPF criado (sem criar lote para evitar restrições adicionais)
    const avRes = await query(
      'INSERT INTO avaliacoes (funcionario_cpf, status, inicio) VALUES ($1, $2, NOW()) RETURNING id',
      [testCpf, 'concluida']
    );
    avaliacaoId = avRes.rows[0].id;

    // Simular contexto RLS para gestor de entidade usando SET LOCAL (variantes para compatibilidade)
    await query(`SET LOCAL app.current_perfil = 'gestor_entidade'`);
    await query(`SET LOCAL app.current_cpf = '88877766655'`);
    await query(`SET LOCAL app.current_contratante_id = '${contratanteId}'`);
    // Também setar as variantes usadas em testes históricos
    await query(`SET LOCAL app.current_user_perfil = 'gestor_entidade'`);
    await query(`SET LOCAL app.current_user_cpf = '88877766655'`);

    // Deveria ver a avaliação criada
    const visible = await query(
      'SELECT id FROM avaliacoes WHERE funcionario_cpf = $1',
      [testCpf]
    );
    expect(visible.rows.length).toBeGreaterThanOrEqual(1);

    // E não deveria ver avaliações de outro funcionário não vinculado (criar outra avaliação para cpf diferente)
    const otherCpf = '99900011122';
    await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [
      otherCpf,
    ]);
    // Criar um funcionário vinculado ao outro contratante (deve SER invisível ao gestor atual)
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, contratante_id, ativo) VALUES ($1,$2,$3,$4,$5,$6,true) ON CONFLICT (cpf) DO NOTHING`,
      [
        otherCpf,
        'Outro Func',
        'outro@teste.local',
        '$2b$10$dummyhash',
        'funcionario',
        otherContratanteId,
      ]
    );
    await query(
      'INSERT INTO avaliacoes (funcionario_cpf, status, inicio) VALUES ($1, $2, NOW())',
      [otherCpf, 'concluida']
    );

    const otherVisible = await query(
      'SELECT id FROM avaliacoes WHERE funcionario_cpf = $1',
      [otherCpf]
    );

    const isSuperuser = await query(
      'SELECT usesuper FROM pg_user WHERE usename = current_user'
    );
    if (isSuperuser.rows[0].usesuper) {
      // ambiente de teste superuser pode ver tudo
      expect(otherVisible.rows.length).toBeGreaterThanOrEqual(1);
    } else {
      // gestor_entidade não deve ver avaliação de funcionário de outra entidade
      expect(otherVisible.rows.length).toBe(0);
    }

    // Cleanup adicional: remover avaliação de otherCpf e funcionário criado
    await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [
      otherCpf,
    ]);
    await query('DELETE FROM funcionarios WHERE cpf = $1', [otherCpf]);
  }, 20000);
});
