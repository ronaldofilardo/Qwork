import '@testing-library/jest-dom';
import { query } from '@/lib/db';

describe('API /api/public/contratante - inclui contrato_id', () => {
  let contratanteId: number | null = null;
  let contratoId: number | null = null;

  afterEach(async () => {
    if (contratoId) {
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
      contratoId = null;
    }
    if (contratanteId) {
      await query('DELETE FROM entidades WHERE id = $1', [contratanteId]);
      contratanteId = null;
    }
  });

  it('retorna contrato_id e contrato_aceito na resposta pública', async () => {
    // Criar plano para referenciar
    const planoRes = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('fixo', 'Plano Teste', 20.0, true) RETURNING id`,
      []
    );
    const planoId = planoRes.rows[0].id;

    // Gerar dados únicos
    const ts = Date.now();
    const cnpj = `E2E${ts}`;
    const email = `e2e${ts}@teste.com`;
    const cpf = String(ts).slice(-11).padStart(11, '1');

    // Criar contratante
    const contratanteRes = await query(
      `INSERT INTO entidades (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular, ativa, pagamento_confirmado, plano_id)
       VALUES ('entidade', 'Empresa Teste', $1, $2, '11999999999', 'Rua Teste', 'Cid', 'ST', '00000000', $3, 'Resp', 'resp@x.com', '11911111111', false, false, $4) RETURNING id`,
      [cnpj, email, cpf, planoId]
    );

    contratanteId = contratanteRes.rows[0].id;

    // Criar contrato pendente
    const contratoRes = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, conteudo)
       VALUES ($1, $2, $3, $4, 'aguardando_pagamento', false, $5) RETURNING id`,
      [contratanteId, planoId, 10, 200.0, 'Contrato Teste']
    );

    contratoId = contratoRes.rows[0].id;

    // Chamar a rota pública
    const { GET } = await import('@/app/api/public/contratante/route');
    const req: any = {
      nextUrl: new URL(
        `http://localhost/api/public/contratante?id=${contratanteId}`
      ),
    };
    const res: any = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.contratante).toBeDefined();
    expect(body.contratante.contrato_id).toBe(contratoId);
    expect(body.contratante.contrato_aceito).toBe(false);
  });
});
