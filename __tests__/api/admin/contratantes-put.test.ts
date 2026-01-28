import { query } from '@/lib/db';

describe('API PUT /api/admin/contratantes (definir plano personalizado)', () => {
  let contratanteId: number;
  let contratoId: number | null = null;

  beforeAll(async () => {
    // Garantir que plano personalizado existe (usar nome único para evitar conflito)
    const existingPlano = await query(
      "SELECT id FROM planos WHERE nome = 'Plano Personalizado Teste'",
      []
    );

    if (existingPlano.rows.length === 0) {
      await query(
        `INSERT INTO planos (tipo, nome, descricao, preco, ativo)
         VALUES ('personalizado', 'Plano Personalizado Teste', 'Plano com valores customizados', 0, true)`,
        []
      );
    }

    // Criar contratante pendente sem plano
    const res = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        status
      ) VALUES (
        'clinica', 'Clinica Teste Plano', '12345000123450', 'teste@clinica.com', '11999999999', 'Rua Teste, 1', 'Cidade', 'ST', '12345000', 'Resp', '12345678900', 'resp@teste.com', '11988888888', 'pendente'
      ) RETURNING id`,
      []
    );

    contratanteId = res.rows[0].id;
  });

  afterAll(async () => {
    if (contratoId) {
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
    }
    if (contratanteId) {
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  it('deve criar contrato não aceito e retornar contrato_id', async () => {
    // Mock session para admin
    jest.doMock('@/lib/session', () => ({
      getSession: () => ({ cpf: '000', nome: 'Admin', perfil: 'admin' }),
    }));

    const { PUT } = await import('@/app/api/admin/contratantes/route');

    const request = new Request(
      'http://localhost:3000/api/admin/contratantes',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contratanteId,
          plano_personalizado_valor: 42.5,
          numero_funcionarios_estimado: 5,
        }),
      }
    );

    const response = await PUT(request as any);

    if (response.status !== 200) {
      const err = await response.json();
      console.error('PUT response error:', err);
    }

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.contrato_id).toBeDefined();
    contratoId = data.contrato_id;

    // Verificar contrato no banco
    const contrato = await query(
      'SELECT id, aceito FROM contratos WHERE id = $1',
      [contratoId]
    );
    expect(contrato.rows[0]).toBeDefined();
    expect(contrato.rows[0].aceito).toBe(false);
  });
});
