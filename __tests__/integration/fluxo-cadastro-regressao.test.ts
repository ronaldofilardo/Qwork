/*
 * Suite de regressão: Fluxo completo de cadastro -> pagamento -> ativação -> login
 * Objetivo: testes determinísticos, isolados e rápidos para evitar regressões no fluxo principal.
 *
 * Este arquivo implementa dois cenários principais:
 * - plano fixo (pagamento à vista)
 * - pagamento parcelado (numero_parcelas > 1) com notificações para parcelas futuras
 *
 * Observações:
 * - Usa chamadas diretas aos handlers (evita necessidade de servidor HTTP)
 * - Limpeza explícita no final de cada teste para manter o ambiente de testes limpo
 */

import { query, closePool } from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Fluxo Cadastro - Suite de Regressão', () => {
  const ts = Date.now();
  const cnpjBase = String(ts).slice(-11) + '0001'; // cria CNPJ único por execução (não válido, mas suficiente p/ teste)
  const cnpjFixo = `9${cnpjBase}90`.slice(0, 14); // garantir tamanho
  const cpfResp = `${String(ts).slice(-11, -1)}0`;
  let contratanteId: number | null = null;
  let contratoId: number | null = null;
  let pagamentoId: number | null = null;

  afterEach(async () => {
    // Limpeza conservadora: apaga registros criados durante o teste
    try {
      if (pagamentoId)
        await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
      if (contratoId)
        await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
      if (contratanteId)
        await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [cpfResp]);
      await query('DELETE FROM notificacoes WHERE destinatario_cpf = $1', [
        cpfResp,
      ]);
    } catch (err) {
      // Não falhar na limpeza para não mascarar falhas de teste
      // eslint-disable-next-line no-console
      console.warn('Limpeza pós-teste incompleta:', err);
    }

    contratanteId = null;
    contratoId = null;
    pagamentoId = null;
  });

  // Fechar pool do DB ao final da suite para evitar handles abertos que impedem o Jest de sair
  afterAll(async () => {
    try {
      await closePool();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Falha ao fechar pool de conexão:', err);
    }
  });

  test('Plano fixo: cria contratante, confirma pagamento e permite login do gestor', async () => {
    // Inserir contratante com plano fixo
    const plano = await query(
      "SELECT id FROM planos WHERE tipo = 'fixo' AND ativo = true LIMIT 1"
    );
    expect(plano.rows.length).toBeGreaterThan(0);
    const planoId = plano.rows[0].id;

    const res = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, 
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        endereco, cidade, estado, cep,
        status, ativa, plano_id, plano_tipo, numero_funcionarios_estimado
      ) VALUES (
        'entidade', $1, $2, $3, '(11) 90000-0000',
        'Resp Regressao', $4, 'resp-regressao@example.com', '(11) 90000-0001',
        'Rua Regressao', 'Cidade', 'SP', '00000-000',
        'aguardando_pagamento', false, $5, 'fixo', 10
      ) RETURNING id`,
      [
        'Empresa Regressao Fixo',
        cnpjFixo,
        `regressao-${ts}@example.com`,
        cpfResp,
        planoId,
      ]
    );

    contratanteId = res.rows[0].id;
    expect(contratanteId).toBeGreaterThan(0);

    // Criar e aceitar contrato
    const contratoRes = await query(
      `INSERT INTO contratos (contratante_id, plano_id, aceito, hash_contrato, criado_em)
       SELECT $1, plano_id, true, md5(random()::text), CURRENT_TIMESTAMP
       FROM contratantes WHERE id = $1
       RETURNING id`,
      [contratanteId]
    );

    contratoId = contratoRes.rows[0].id;
    expect(contratoId).toBeGreaterThan(0);

    // Inicializar pagamento
    const pagamentoRes = await query(
      `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, numero_parcelas, criado_em)
       VALUES ($1, $2, 1500.00, 'pendente', 'boleto', 1, CURRENT_TIMESTAMP)
       RETURNING id`,
      [contratanteId, contratoId]
    );

    pagamentoId = pagamentoRes.rows[0].id;
    expect(pagamentoId).toBeGreaterThan(0);

    // Confirmar pagamento usando o handler (mesma abordagem do teste de integração original)
    const { POST: confirmarPagamento } =
      await import('@/app/api/pagamento/confirmar/route');
    const mockRequest = new Request(
      'http://localhost/api/pagamento/confirmar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagamento_id: pagamentoId,
          metodo_pagamento: 'boleto',
          numero_parcelas: 1,
        }),
      }
    );

    const resp = await confirmarPagamento(mockRequest as any);
    // Logar resposta completa para debugging quando necessário
    let respJson: any = null;
    try {
      respJson = await resp.json();
    } catch (e) {
      // ignora se não houver JSON
    }
    // Mostrar status e corpo para investigação
    // eslint-disable-next-line no-console
    console.log(
      'DEBUG: confirmarPagamento status=',
      resp.status,
      'body=',
      respJson
    );
    expect(resp.status).toBe(200);

    // Verificações pós-pagamento
    const pagamentoCheck = await query(
      'SELECT status FROM pagamentos WHERE id = $1',
      [pagamentoId]
    );
    expect(pagamentoCheck.rows[0].status).toBe('pago');

    const contratanteCheck = await query(
      'SELECT status, ativa, pagamento_confirmado, aprovado_em FROM contratantes WHERE id = $1',
      [contratanteId]
    );
    expect(contratanteCheck.rows[0].status).toBe('aprovado');
    expect(contratanteCheck.rows[0].ativa).toBe(true);
    expect(contratanteCheck.rows[0].pagamento_confirmado).toBe(true);

    // Conta do gestor criada com senha = ultimos 6 do CNPJ (texto plano até primeiro login)
    const func = await query(
      'SELECT cpf, nome, perfil, ativo, senha_hash FROM funcionarios WHERE cpf = $1',
      [cpfResp]
    );

    expect(func.rows.length).toBe(1);
    expect(func.rows[0].ativo).toBe(true);
    expect(['gestor_entidade', 'emissor']).toContain(func.rows[0].perfil);

    const senhaEsperada = String(cnpjFixo).replace(/[./-]/g, '').slice(-6);
    expect(func.rows[0].senha_hash).toBe(senhaEsperada);

    // Simular primeiro login e validação de troca para bcrypt
    const { POST: loginHandler } = await import('@/app/api/auth/login/route');
    const loginRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cpfResp, senha: senhaEsperada }),
    });

    const loginResp = await loginHandler(loginRequest as any);
    expect(loginResp.status).toBe(200);

    const funcAfter = await query(
      'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
      [cpfResp]
    );
    const hash = funcAfter.rows[0].senha_hash;
    expect(hash).not.toBe(senhaEsperada);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
    const valid = await bcrypt.compare(senhaEsperada, hash);
    expect(valid).toBe(true);
  }, 20000);

  test('Pagamento parcelado: deve criar notificações para parcelas futuras', async () => {
    // Reusar um plano ativo (fixo ou outro) apenas para garantir plano_id válido
    const plano = await query(
      'SELECT id FROM planos WHERE ativo = true LIMIT 1'
    );
    expect(plano.rows.length).toBeGreaterThan(0);
    const planoId = plano.rows[0].id;

    const cnpjParcelado = cnpjFixo.slice(0, -2) + '55';

    const insert = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, 
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        endereco, cidade, estado, cep,
        status, ativa, plano_id, plano_tipo, numero_funcionarios_estimado
      ) VALUES (
        'entidade', $1, $2, $3, '(11) 90000-0000',
        'Resp Parcelado', $4, 'resp-parc@example.com', '(11) 90000-0002',
        'Rua Regressao', 'Cidade', 'SP', '00000-000',
        'aguardando_pagamento', false, $5, 'fixo', 8
      ) RETURNING id`,
      [
        'Empresa Regressao Parc',
        cnpjParcelado,
        `regressao-parc-${ts}@example.com`,
        `${Number(cpfResp) + 1}`,
        planoId,
      ]
    );

    contratanteId = insert.rows[0].id;
    expect(contratanteId).toBeGreaterThan(0);

    // Criar contrato
    const contratoRes = await query(
      `INSERT INTO contratos (contratante_id, plano_id, aceito, hash_contrato, criado_em)
       SELECT $1, plano_id, true, md5(random()::text), CURRENT_TIMESTAMP
       FROM contratantes WHERE id = $1
       RETURNING id`,
      [contratanteId]
    );

    contratoId = contratoRes.rows[0].id;

    // Inicializar pagamento com 3 parcelas
    const pagamentoRes = await query(
      `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, numero_parcelas, criado_em)
       VALUES ($1, $2, 3000.00, 'pendente', 'boleto', 3, CURRENT_TIMESTAMP)
       RETURNING id`,
      [contratanteId, contratoId]
    );

    pagamentoId = pagamentoRes.rows[0].id;

    // Confirmar pagamento
    const { POST: confirmarPagamento } =
      await import('@/app/api/pagamento/confirmar/route');
    const mockRequest = new Request(
      'http://localhost/api/pagamento/confirmar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagamento_id: pagamentoId,
          metodo_pagamento: 'boleto',
          numero_parcelas: 3,
        }),
      }
    );

    const resp = await confirmarPagamento(mockRequest as any);
    expect(resp.status).toBe(200);

    // Procurar notificações para parcelas futuras (deve haver pelo menos 2 notificações/pedidos de parcela)
    const parcelsNotifs = await query(
      `SELECT * FROM notificacoes WHERE destinatario_tipo = 'contratante' AND tipo = 'parcela_pendente' AND destinatario_cpf IS NOT NULL`
    );

    // Deve encontrar notificações associadas ao contratante atual
    const found = parcelsNotifs.rows.some((r: any) => {
      const ctx =
        typeof r.dados_contexto === 'string'
          ? JSON.parse(r.dados_contexto)
          : r.dados_contexto;
      return ctx && ctx.contratante_id === contratanteId;
    });

    expect(found).toBe(true);
  }, 20000);
});
