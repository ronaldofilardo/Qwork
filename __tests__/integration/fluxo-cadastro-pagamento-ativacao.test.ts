/**
 * Teste de integração: Fluxo completo de cadastro → contrato → pagamento → ativação
 *
 * Valida:
 * 1. Criação de cadastro com plano fixo
 * 2. Geração e aceite de contrato
 * 3. Inicialização de pagamento
 * 4. Confirmação de pagamento
 * 5. Criação automática de conta (funcionário) com senha = últimos 6 dígitos CNPJ
 * 6. Ativação do contratante (status aprovado, ativa=true)
 * 7. Geração de recibo
 * 8. Criação de notificações para parcelas (se parcelado)
 * 9. Login com credenciais geradas
 */

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Fluxo Cadastro → Pagamento → Ativação', () => {
  let contratanteId: number;
  let contratoId: number;
  let pagamentoId: number;
  const cnpjTeste = '12345678000190';
  const cpfResponsavel = '11122233344';
  const senhaEsperada = '000190'; // Últimos 6 dígitos do CNPJ

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    await query('DELETE FROM funcionarios WHERE cpf = $1', [cpfResponsavel]);
    await query('DELETE FROM notificacoes WHERE destinatario_cpf = $1', [
      cpfResponsavel,
    ]);
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpjTeste]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM funcionarios WHERE cpf = $1', [cpfResponsavel]);
    if (contratoId) {
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
    }
    if (contratanteId) {
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  test('1. Deve criar contratante com plano fixo e status aguardando_pagamento', async () => {
    const planoResult = await query(
      'SELECT id FROM planos WHERE tipo = $1 AND ativo = true LIMIT 1',
      ['fixo']
    );
    expect(planoResult.rows.length).toBeGreaterThan(0);
    const planoId = planoResult.rows[0].id;

    const result = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, 
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        endereco, cidade, estado, cep,
        status, ativa, plano_id, plano_tipo, numero_funcionarios_estimado
      ) VALUES (
        'entidade', 'Empresa Teste Integração', $1, 'teste@teste.com', '(11) 98765-4321',
        'Responsável Teste', $2, 'resp@teste.com', '(11) 91234-5678',
        'Rua Teste, 123', 'São Paulo', 'SP', '01234-567',
        'aguardando_pagamento', false, $3, 'fixo', 20
      ) RETURNING id`,
      [cnpjTeste, cpfResponsavel, planoId]
    );

    contratanteId = result.rows[0].id;
    expect(contratanteId).toBeGreaterThan(0);

    // Verificar status inicial
    const verificacao = await query(
      'SELECT status, ativa, pagamento_confirmado FROM contratantes WHERE id = $1',
      [contratanteId]
    );
    expect(verificacao.rows[0].status).toBe('aguardando_pagamento');
    expect(verificacao.rows[0].ativa).toBe(false);
    expect(verificacao.rows[0].pagamento_confirmado).toBe(false);
  });

  test('2. Deve criar e aceitar contrato', async () => {
    // Criar contrato
    const contratoResult = await query(
      `INSERT INTO contratos (contratante_id, plano_id, aceito, hash_contrato, criado_em)
       SELECT $1, plano_id, false, md5(random()::text), CURRENT_TIMESTAMP
       FROM contratantes WHERE id = $1
       RETURNING id`,
      [contratanteId]
    );

    contratoId = contratoResult.rows[0].id;
    expect(contratoId).toBeGreaterThan(0);

    // Aceitar contrato
    await query(
      `UPDATE contratos SET aceito = true, data_aceite = CURRENT_TIMESTAMP WHERE id = $1`,
      [contratoId]
    );

    const verificacao = await query(
      'SELECT aceito FROM contratos WHERE id = $1',
      [contratoId]
    );
    expect(verificacao.rows[0].aceito).toBe(true);
  });

  test('3. Deve inicializar pagamento', async () => {
    const pagamentoResult = await query(
      `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, numero_parcelas, criado_em)
       VALUES ($1, $2, 2000.00, 'pendente', 'boleto', 2, CURRENT_TIMESTAMP)
       RETURNING id`,
      [contratanteId, contratoId]
    );

    pagamentoId = pagamentoResult.rows[0].id;
    expect(pagamentoId).toBeGreaterThan(0);
  });

  test('4. Deve confirmar pagamento e criar conta automaticamente', async () => {
    console.log('DEBUG TEST: pagamentoId =', pagamentoId);
    console.log('DEBUG TEST: contratanteId =', contratanteId);

    // Simular confirmação de pagamento via handler de rota (evita necessidade de servidor HTTP na suíte)
    const { POST: confirmarPagamento } =
      await import('@/app/api/pagamento/confirmar/route');

    const requestBody = {
      pagamento_id: pagamentoId,
      metodo_pagamento: 'boleto',
      numero_parcelas: 2,
    };
    console.log('DEBUG TEST: request body =', JSON.stringify(requestBody));

    const mockRequest = new Request(
      'http://localhost/api/pagamento/confirmar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    const response = await confirmarPagamento(mockRequest as any);
    if (response.status !== 200) {
      try {
        const body = await response.json();
        console.log('DEBUG: confirmarPagamento response body:', body);
      } catch (e) {
        try {
          const text = await response.text();
          console.log('DEBUG: confirmarPagamento response text:', text);
        } catch (e) {
          console.log('DEBUG: confirmarPagamento response (no body)');
        }
      }
    }
    expect(response.status).toBe(200);

    // Verificar se pagamento foi atualizado
    const pagamentoVerif = await query(
      'SELECT status FROM pagamentos WHERE id = $1',
      [pagamentoId]
    );
    expect(pagamentoVerif.rows[0].status).toBe('pago');

    // Verificar se contratante foi ativado
    const contratanteVerif = await query(
      'SELECT status, ativa, pagamento_confirmado, aprovado_em FROM contratantes WHERE id = $1',
      [contratanteId]
    );
    expect(contratanteVerif.rows[0].status).toBe('aprovado');
    expect(contratanteVerif.rows[0].ativa).toBe(true);
    expect(contratanteVerif.rows[0].pagamento_confirmado).toBe(true);
    expect(contratanteVerif.rows[0].aprovado_em).not.toBeNull();

    // Verificar se conta foi criada
    const funcionarioVerif = await query(
      'SELECT cpf, nome, perfil, ativo, senha_hash FROM funcionarios WHERE cpf = $1',
      [cpfResponsavel]
    );
    expect(funcionarioVerif.rows.length).toBe(1);
    expect(funcionarioVerif.rows[0].ativo).toBe(true);
    expect(funcionarioVerif.rows[0].perfil).toBe('gestor_entidade');

    // Senha deve ser texto plano (será hasheada no primeiro login)
    expect(funcionarioVerif.rows[0].senha_hash).toBe(senhaEsperada);
  });

  test('5. Deve criar notificações para parcelas futuras', async () => {
    const notificacoesResult = await query(
      `SELECT * FROM notificacoes 
       WHERE destinatario_cpf = $1 
       AND tipo = 'parcela_pendente'
       ORDER BY criado_em`,
      [cpfResponsavel]
    );

    // Deve ter 1 notificação (parcela 2, pois parcela 1 já está paga)
    if (notificacoesResult.rows.length !== 1) {
      console.log(
        'DEBUG: notificacoesResult.rows:',
        JSON.stringify(notificacoesResult.rows, null, 2)
      );
    }
    expect(notificacoesResult.rows.length).toBe(1);

    const notif = notificacoesResult.rows[0];
    expect(notif.destinatario_cpf).toBe(cpfResponsavel);
    expect(notif.destinatario_tipo).toBe('contratante');
    // contratante_id está embutido em dados_contexto
    const dadosContexto =
      typeof notif.dados_contexto === 'string'
        ? JSON.parse(notif.dados_contexto)
        : notif.dados_contexto;
    expect(dadosContexto.contratante_id).toBe(contratanteId);
    // Deve existir pelo menos uma notificação com esse contrato (pode haver ruído de outras operações)
    console.log('DEBUG: contratanteId (test variable):', contratanteId);
    const found = notificacoesResult.rows.some((r) => {
      try {
        const ctx =
          typeof r.dados_contexto === 'string'
            ? JSON.parse(r.dados_contexto)
            : r.dados_contexto;
        return ctx && ctx.contratante_id === contratanteId;
      } catch {
        return false;
      }
    });
    if (!found) {
      console.log(
        'DEBUG: notificacoesResult rows (parsed dados_contexto):',
        notificacoesResult.rows.map((r) => {
          try {
            return JSON.parse(r.dados_contexto);
          } catch {
            return r.dados_contexto;
          }
        })
      );
    }
    expect(found).toBe(true);
  });

  test('6. Deve gerar recibo após confirmação de pagamento', async () => {
    // Gerar recibo sob demanda via API
    const { POST: gerarReciboPOST } =
      await import('@/app/api/recibo/gerar/route');
    const gerarReq: any = {
      json: async () => ({
        contrato_id: contratoId,
        pagamento_id: pagamentoId,
      }),
      headers: { get: jest.fn() },
    };
    const gerarRes: any = await gerarReciboPOST(gerarReq);
    expect(gerarRes.status).toBe(200);
    const gerarData = await gerarRes.json();
    expect(gerarData.success).toBe(true);

    const reciboResult = await query(
      `SELECT * FROM recibos WHERE contrato_id = $1 AND pagamento_id = $2`,
      [contratoId, pagamentoId]
    );

    expect(reciboResult.rows.length).toBeGreaterThan(0);
    const recibo = reciboResult.rows[0];
    expect(recibo.contratante_id).toBe(contratanteId);
    expect(recibo.numero_recibo).toMatch(/^REC-\d{4}-\d{5}$/); // Formato REC-AAAA-NNNNN (ex: REC-2026-00001)
  });

  test('7. Deve permitir login com senha = últimos 6 dígitos do CNPJ', async () => {
    // Primeiro login: sistema deve detectar texto plano e converter para bcrypt
    // Chamar handler de rota de login diretamente
    const { POST: loginHandler } = await import('@/app/api/auth/login/route');
    const loginRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cpfResponsavel, senha: senhaEsperada }),
    });
    const loginResponse = await loginHandler(loginRequest as any);
    expect(loginResponse.status).toBe(200);

    // Verificar se senha foi migrada para bcrypt
    const funcionarioVerif = await query(
      'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
      [cpfResponsavel]
    );

    const senhaHash = funcionarioVerif.rows[0].senha_hash;
    expect(senhaHash).not.toBe(senhaEsperada); // Não deve mais ser texto plano
    expect(senhaHash.startsWith('$2a$') || senhaHash.startsWith('$2b$')).toBe(
      true
    ); // Formato bcrypt

    // Validar que hash corresponde à senha
    const senhaValida = await bcrypt.compare(senhaEsperada, senhaHash);
    expect(senhaValida).toBe(true);
  });

  test('8. Deve falhar login com senha incorreta', async () => {
    const { POST: loginHandler } = await import('@/app/api/auth/login/route');
    const badLoginRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cpfResponsavel, senha: '999999' }),
    });
    const badLoginResponse = await loginHandler(badLoginRequest as any);
    expect(badLoginResponse.status).toBe(401);
  });
});
