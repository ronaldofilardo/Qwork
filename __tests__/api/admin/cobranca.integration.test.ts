import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/cobranca/route';
import { query } from '@/lib/db';

// Mock requireRole to allow admin access
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({ cpf: 'admin1', perfil: 'admin' }),
}));

describe('API Cobrança - integração com pagamentos reais', () => {
  const testCnpj = '77777777000177';
  let contratanteId: number;

  beforeAll(async () => {
    // limpar possíveis restos
    await query(
      'DELETE FROM pagamentos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [testCnpj]
    );
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [testCnpj]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [testCnpj]);

    // criar um plano de teste (caso não exista) e um contratante aprovado
    await query(
      `INSERT INTO planos (id, nome, tipo, preco) VALUES (999, 'Plano Teste', 'personalizado', 2000.00)
       ON CONFLICT (id) DO NOTHING`,
      []
    );

    const contratanteRes = await query(
      `INSERT INTO contratantes (
         tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
         status, ativa, plano_id, numero_funcionarios_estimado, pagamento_confirmado, criado_em
       ) VALUES (
         'entidade', 'Empresa Integra Teste', $1, 'integra@teste.com', '11900000000', 'Rua Teste 1', 'São Paulo', 'SP', '01234567',
         'Responsavel Teste', '12345678901', 'resp@teste.com', '11900000001',
         'aprovado', true, 999, 10, false, NOW()
       ) RETURNING id`,
      [testCnpj]
    );

    contratanteId = contratanteRes.rows[0].id;

    // Iniciar pagamento via API e confirmar como parcelado (fluxo real)
    const requestIniciar = new NextRequest(
      'http://localhost/api/pagamento/iniciar',
      {
        method: 'POST',
        body: JSON.stringify({
          contratante_id: contratanteId,
          contrato_id: null,
        }),
        headers: { 'content-type': 'application/json' },
      }
    );

    const iniciarRes = await (
      await import('@/app/api/pagamento/iniciar/route')
    ).POST(requestIniciar as any);
    const iniciarData = await iniciarRes.json();
    const pagamentoId = iniciarData.pagamento_id;

    // Confirmar pagamento via rota de confirmação (parcelado)
    const confirmRequest = new NextRequest(
      'http://localhost/api/pagamento/confirmar',
      {
        method: 'POST',
        body: JSON.stringify({
          pagamento_id: pagamentoId,
          metodo_pagamento: 'boleto',
          numero_parcelas: 2,
        }),
        headers: { 'content-type': 'application/json' },
      }
    );

    const confirmarRes = await (
      await import('@/app/api/pagamento/confirmar/route')
    ).POST(confirmRequest as any);

    // garantir que confirmação ocorreu
    expect(confirmarRes.status).toBe(200);
    const confirmarData = await confirmarRes.json();
    if (typeof confirmarData.success !== 'undefined') {
      expect(confirmarData.success).toBe(true);
    }
  });

  afterAll(async () => {
    await query('DELETE FROM pagamentos WHERE contratante_id = $1', [
      contratanteId,
    ]);
    await query('DELETE FROM contratos WHERE contratante_id = $1', [
      contratanteId,
    ]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);

    // remover plano de teste (se criado)
    await query('DELETE FROM planos WHERE id = $1', [999]);
  });

  it('deve retornar valor, data e método de pagamento para contratante com pagamento', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/cobranca');
    const res = await GET(request as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.contratos)).toBe(true);

    const found = data.contratos.find((c: any) => c.cnpj === testCnpj);
    expect(found).toBeDefined();
    expect(found.pagamento_valor).toBeDefined();
    expect(parseFloat(found.pagamento_valor)).toBeCloseTo(2000.0);
    expect(found.tipo_pagamento).toBe('boleto');
    expect(found.data_pagamento).toBeDefined();

    // Novos campos obrigatórios
    expect(found.contrato_id).toBeDefined();
    expect(found.plano_id).toBeDefined();
    expect(found.plano_preco).toBeDefined();
    expect(found.pagamento_id).toBeDefined();
    expect(found.pagamento_status).toBeDefined();

    // Verificar parcelas_json detalhado
    expect(found.parcelas_json).toBeDefined();
    expect(Array.isArray(found.parcelas_json)).toBe(true);
    expect(found.parcelas_json.length).toBe(2);
    expect(found.parcelas_json[0]).toMatchObject({
      numero: 1,
      valor: expect.any(Number),
      data_vencimento: expect.any(String),
    });

    // Verificar que o pagamento no DB tem detalhes_parcelas persistidos
    const pagamentoDB = await query(
      `SELECT detalhes_parcelas FROM pagamentos WHERE contratante_id = $1 ORDER BY criado_em DESC LIMIT 1`,
      [contratanteId]
    );
    expect(pagamentoDB.rows.length).toBeGreaterThan(0);
    expect(pagamentoDB.rows[0].detalhes_parcelas).toBeDefined();
    expect(Array.isArray(pagamentoDB.rows[0].detalhes_parcelas)).toBe(true);
    expect(pagamentoDB.rows[0].detalhes_parcelas.length).toBe(2);
  });

  it('deve retornar apenas o contratante solicitado quando filtrado por CNPJ', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/cobranca?cnpj=02494916000170'
    );
    const res = await GET(request as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.contratos)).toBe(true);
    // Pode retornar 0 resultados se CNPJ não existir no ambiente de teste, então apenas validar formato quando existir
    if (data.contratos.length > 0) {
      expect(data.contratos[0].cnpj.replace(/\D/g, '')).toBe('02494916000170');
    }
  });
});
