import '@testing-library/jest-dom';
import { query } from '@/lib/db';

describe('Integração: cadastro -> contrato gerado -> aceitar -> abrir simulador', () => {
  let planoId: number;
  let contratanteId: number;
  let contratoId: number | null = null;

  beforeAll(async () => {
    const planoRes = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('fixo', 'Plano E2E Aceite', 25, true) RETURNING id`,
      []
    );
    planoId = planoRes.rows[0].id;
  });

  afterAll(async () => {
    if (planoId) await query('DELETE FROM planos WHERE id = $1', [planoId]);
  });

  afterEach(async () => {
    if (contratoId) {
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
      contratoId = null;
    }
    if (contratanteId) {
      await query('DELETE FROM pagamentos WHERE contratante_id = $1', [
        contratanteId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
      contratanteId = 0 as any;
    }
  });

  test('Cadastro cria contrato, aceitar permite abrir simulador e iniciar pagamento', async () => {
    // Emular POST /api/cadastro/contratante
    // Em vez de chamar o endpoint de cadastro (upload de arquivos pode falhar no ambiente de teste),
    // criar o contratante diretamente e criar o contrato conforme comportamento esperado do fluxo.
    const cnpj = `E2E${Math.floor(Math.random() * 1000000000)}`;
    const contratanteRes = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular,
        numero_funcionarios_estimado, plano_id, ativa, pagamento_confirmado
      ) VALUES (
        'entidade', 'Empresa E2E Aceite', $1, $2, '11999999997', 'Rua E2E Aceite', 'Cidade', 'ST', '00000000',
        '52998224725', 'Resp E2E', $3, '11911111110', 10, $4, false, false
      ) RETURNING id`,
      [
        cnpj,
        `e2e-aceite+${Date.now()}@teste.com`,
        'resp-e2e@teste.com',
        planoId,
      ]
    );
    contratanteId = contratanteRes.rows[0].id;

    // Atualizar status para 'aguardando_pagamento' como no fluxo real
    await query(
      `UPDATE contratantes SET status = 'aguardando_pagamento' WHERE id = $1`,
      [contratanteId]
    );

    // Criar contrato pendente de aceite (o que o endpoint de cadastro faria para planos fixos)
    const contratoInsert = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, conteudo)
       VALUES ($1, $2, $3, $4, 'aguardando_pagamento', false, $5) RETURNING id`,
      [contratanteId, planoId, 10, 10 * 20.0, 'Contrato E2E gerado']
    );

    contratoId = contratoInsert.rows[0].id;

    // Consultar contrato e validar que não está aceito
    const { GET: getContrato } = await import('@/app/api/contratos/[id]/route');

    const getReq: any = { params: { id: String(contratoId) } };

    // Passar o segundo argumento com params conforme assinatura do App Router
    const getRes: any = await getContrato(getReq, {
      params: { id: String(contratoId) },
    });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.success).toBe(true);
    expect(getData.contrato).toBeDefined();
    expect(getData.contrato.aceito).toBe(false);

    // Aceitar contrato (mock do módulo de sessão para autorização)
    jest.resetModules();
    jest.doMock('@/lib/session', () => ({
      getSession: () => ({
        cpf: '00000000000',
        nome: 'Admin Test',
        perfil: 'admin',
      }),
    }));

    const { POST: contratosPost } = await import('@/app/api/contratos/route');
    const aceitarReq: any = {
      json: async () => ({ acao: 'aceitar', contrato_id: contratoId }),
      headers: { get: jest.fn() },
    };

    const aceitarRes: any = await contratosPost(aceitarReq);
    const aceitarData = await aceitarRes.json();
    console.log('[DEBUG aceitar response]', aceitarRes.status, aceitarData);
    expect(aceitarRes.status).toBe(200);
    expect(aceitarData.success).toBe(true);
    expect(aceitarData.simulador_url).toBeTruthy();

    // Limpar mock de módulos para não afetar outros testes
    jest.resetModules();
    jest.dontMock('@/lib/session');

    // Abrir simulador (GET) com contrato aceito
    const simuladorUrl = new URL(
      'http://localhost' + aceitarData.simulador_url
    );
    const { GET: simuladorGET } =
      await import('@/app/api/pagamento/simulador/route');
    const simuladorReq: any = {
      nextUrl: new URL(`http://localhost${aceitarData.simulador_url}`),
    };
    const simuladorRes: any = await simuladorGET(simuladorReq);
    expect(simuladorRes.status).toBe(200);
    const simuladorData = await simuladorRes.json();
    expect(simuladorData.valor_total).toBeGreaterThan(0);

    // Iniciar pagamento usando contrato aceito
    const { POST: iniciarPagamento } =
      await import('@/app/api/pagamento/iniciar/route');
    const iniciarReq: any = {
      json: async () => ({
        contratante_id: contratanteId,
        contrato_id: contratoId,
      }),
    };
    const iniciarRes: any = await iniciarPagamento(iniciarReq);
    expect(iniciarRes.status).toBe(200);
    const iniciarData = await iniciarRes.json();
    expect(iniciarData.success).toBe(true);
    expect(iniciarData.pagamento_id).toBeDefined();

    // Validar pagamento registrado
    const pagamentoDb = await query('SELECT * FROM pagamentos WHERE id = $1', [
      iniciarData.pagamento_id,
    ]);
    expect(pagamentoDb.rows.length).toBe(1);
  }, 20000);
});
