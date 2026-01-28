import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/novos-cadastros/route';
import { query } from '@/lib/db';

// Mock do getSession
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(() => ({
    cpf: '12345678900',
    nome: 'Admin Teste',
    perfil: 'admin',
  })),
}));

// Mock do extractRequestInfo
jest.mock('@/lib/audit', () => ({
  extractRequestInfo: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'Jest Test',
  })),
  logAudit: jest.fn(),
}));

describe('POST /api/admin/novos-cadastros - Correção Conteudo Contrato', () => {
  beforeEach(async () => {
    // Limpar dados de teste
    const testCnpjs = ['33333333000133', '44444444000144', '55555555000155'];

    for (const cnpj of testCnpjs) {
      await query(
        'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
        [cnpj]
      );
      await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpj]);
    }
  });

  it('deve salvar contrato na coluna conteudo (não conteudo_gerado)', async () => {
    // Criar contratante de teste
    const contratanteResult = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        status, plano_id, numero_funcionarios_estimado
      ) VALUES (
        'entidade', 'Empresa Correção Conteudo', '33333333000133',
        'correcao@teste.com', '11999999999', 'Rua Correção, 123',
        'São Paulo', 'SP', '01234567',
        'João Silva', '12345678901', 'joao@teste.com', '11988888888',
        'pendente', 3, 50
      ) RETURNING id`,
      []
    );

    const contratanteId = contratanteResult.rows[0].id;

    // Simular request de aprovação personalizado
    const request = new NextRequest(
      'http://localhost:3000/api/admin/novos-cadastros',
      {
        method: 'POST',
        body: JSON.stringify({
          id: contratanteId,
          acao: 'aprovar_personalizado',
          valor_por_funcionario: 15.75,
        }),
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar se contrato foi criado corretamente
    const contratoResult = await query(
      'SELECT * FROM contratos WHERE id = $1',
      [data.contratante.contratacao_id]
    );

    expect(contratoResult.rows.length).toBe(1);
    const contrato = contratoResult.rows[0];

    // Verificar que conteudo está preenchido (correção aplicada)
    expect(contrato.conteudo).toBeDefined();
    expect(contrato.conteudo).not.toBeNull();
    expect(contrato.conteudo.length).toBeGreaterThan(0);
    expect(contrato.conteudo).toContain(
      'Valor unitário anual por funcionário: R$ 15,75'
    );
    expect(contrato.conteudo).toContain('Valor total anual: R$ 787,50'); // 50 * 15.75

    // Verificar que numero_funcionarios e valor_total foram salvos
    expect(contrato.numero_funcionarios).toBe(50);
    expect(parseFloat(contrato.valor_total)).toBe(787.5); // 50 * 15.75

    // Verificar que conteudo_gerado pode estar vazio ou null (não usado mais)
    // expect(contrato.conteudo_gerado).toBeNull(); // Opcional - depende se a coluna ainda existe
  });

  it('deve salvar numero_funcionarios e valor_total corretamente', async () => {
    // Criar contratante de teste com número diferente de funcionários
    const contratanteResult = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        status, plano_id, numero_funcionarios_estimado
      ) VALUES (
        'clinica', 'Clínica Valores Teste', '44444444000144',
        'valores2@teste.com', '11888888888', 'Av Valores, 456',
        'Rio de Janeiro', 'RJ', '23456789',
        'Maria Santos', '98765432101', 'maria@teste.com', '11777777777',
        'pendente', 3, 25
      ) RETURNING id`,
      []
    );

    const contratanteId = contratanteResult.rows[0].id;

    const request = new NextRequest(
      'http://localhost:3000/api/admin/novos-cadastros',
      {
        method: 'POST',
        body: JSON.stringify({
          id: contratanteId,
          acao: 'aprovar_personalizado',
          valor_por_funcionario: 33.0,
          numero_funcionarios: 30, // Sobrescrever o estimado
        }),
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verificar campos calculados
    const contratoResult = await query(
      'SELECT numero_funcionarios, valor_total, valor_personalizado FROM contratos WHERE id = $1',
      [data.contratante.contrato_id]
    );

    const contrato = contratoResult.rows[0];
    expect(contrato.numero_funcionarios).toBe(30); // Usado o valor do body
    expect(parseFloat(contrato.valor_total)).toBe(990.0); // 30 * 33.0
    expect(parseFloat(contrato.valor_personalizado)).toBe(33.0);
  });

  it('deve funcionar com numero_funcionarios fornecido no body', async () => {
    // Criar contratante sem numero_funcionarios_estimado
    const contratanteResult = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        status, plano_id
      ) VALUES (
        'entidade', 'Empresa Sem Estimativa', '55555555000155',
        'semestimativa2@teste.com', '11666666666', 'Rua Sem Estimativa, 789',
        'Belo Horizonte', 'MG', '34567890',
        'Pedro Costa', '11111111101', 'pedro@teste.com', '11555555555',
        'pendente', 3
      ) RETURNING id`,
      []
    );

    const contratanteId = contratanteResult.rows[0].id;

    const request = new NextRequest(
      'http://localhost:3000/api/admin/novos-cadastros',
      {
        method: 'POST',
        body: JSON.stringify({
          id: contratanteId,
          acao: 'aprovar_personalizado',
          valor_por_funcionario: 20.0,
          numero_funcionarios: 40, // Fornecer no body
        }),
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verificar que funcionou mesmo sem estimativa inicial
    const contratoResult = await query(
      'SELECT numero_funcionarios, valor_total, conteudo FROM contratos WHERE id = $1',
      [data.contratante.contrato_id]
    );

    const contrato = contratoResult.rows[0];
    expect(contrato.numero_funcionarios).toBe(40);
    expect(parseFloat(contrato.valor_total)).toBe(800.0); // 40 * 20.0
    expect(contrato.conteudo).toBeDefined();
    expect(contrato.conteudo).toContain('Número de funcionários: 40');
    expect(contrato.conteudo).toContain('Valor total anual: R$ 800,00');
  });
});
