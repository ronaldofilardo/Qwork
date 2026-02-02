/**
 * Teste rápido: Fluxo completo plano personalizado
 * Contratante: AAA entidade (CNPJ 41633923000168, ID 69)
 */

import { query } from '@/lib/db';

describe('Fluxo Completo Plano Personalizado - AAA Entidade', () => {
  const CONTRATANTE_ID = 69;
  const CNPJ = '41633923000168';

  it('1. Estado inicial: aguardando_valor_admin', async () => {
    const result = await query(
      `SELECT c.id, c.nome, c.cnpj, c.status, c.ativa, 
              cp.status as contratacao_status
       FROM contratantes c
       LEFT JOIN contratacao_personalizada cp ON c.id = cp.contratante_id
       WHERE c.cnpj = $1`,
      [CNPJ]
    );

    expect(result.rows).toHaveLength(1);
    const contratante = result.rows[0];

    // \n=== ESTADO INICIAL ===

    expect(contratante.status).toBe('pendente');
    expect(contratante.ativa).toBe(false);
    expect(contratante.contratacao_status).toBe('aguardando_valor_admin');
  });

  it('2. Admin define valor e gera link', async () => {
    const VALOR_POR_FUNC = 25.0;
    const NUM_FUNCIONARIOS = 100;
    const VALOR_TOTAL = VALOR_POR_FUNC * NUM_FUNCIONARIOS;

    // Simular aprovação do admin
    await query(
      `UPDATE contratacao_personalizada 
       SET valor_por_funcionario = $1, 
           numero_funcionarios_estimado = $2, 
           valor_total_estimado = $3, 
           status = 'valor_definido', 
           atualizado_em = CURRENT_TIMESTAMP 
       WHERE contratante_id = $4`,
      [VALOR_POR_FUNC, NUM_FUNCIONARIOS, VALOR_TOTAL, CONTRATANTE_ID]
    );

    // Gerar token de pagamento
    const { randomBytes } = await import('crypto');
    const token = randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await query(
      `UPDATE contratacao_personalizada 
       SET payment_link_token = $1, 
           payment_link_expiracao = $2, 
           link_enviado_em = CURRENT_TIMESTAMP 
       WHERE contratante_id = $3`,
      [token, expiracao, CONTRATANTE_ID]
    );

    // Criar contrato
    await query(
      `INSERT INTO contratos (
        contratante_id, plano_id, numero_funcionarios, valor_total, 
        status, criado_em
      ) VALUES ($1, 2, $2, $3, 'aguardando_pagamento', CURRENT_TIMESTAMP)
      RETURNING id`,
      [CONTRATANTE_ID, NUM_FUNCIONARIOS, VALOR_TOTAL]
    );

    // Verificar resultado
    const result = await query(
      `SELECT cp.*, c.status as contratante_status
       FROM contratacao_personalizada cp
       JOIN contratantes c ON cp.contratante_id = c.id
       WHERE cp.contratante_id = $1`,
      [CONTRATANTE_ID]
    );

    const contratacao = result.rows[0];

    // \n=== APÓS DEFINIÇÃO DE VALOR ===

      `Valor por Funcionário: R$ ${contratacao.valor_por_funcionario}`
    );
      `Número de Funcionários: ${contratacao.numero_funcionarios_estimado}`
    );
      `Expira em: ${new Date(contratacao.payment_link_expiracao).toLocaleString('pt-BR')}`
    );

    expect(contratacao.status).toBe('valor_definido');
    expect(contratacao.valor_por_funcionario).toBe(String(VALOR_POR_FUNC));
    expect(contratacao.payment_link_token).toBeTruthy();
  });

  it('3. Verificar notificação gerada para gestor', async () => {
    const result = await query(
      `SELECT n.*, cp.id as contratacao_id
       FROM notificacoes n
       JOIN contratacao_personalizada cp ON n.contratacao_personalizada_id = cp.id
       WHERE cp.contratante_id = $1
         AND n.tipo = 'valor_definido'
       ORDER BY n.criado_em DESC
       LIMIT 1`,
      [CONTRATANTE_ID]
    );

    expect(result.rows.length).toBeGreaterThan(0);
    const notificacao = result.rows[0];

    // \n=== NOTIFICAÇÃO GERADA ===

    expect(notificacao.tipo).toBe('valor_definido');
    expect(notificacao.destinatario_tipo).toBe('gestor_entidade');
    expect(notificacao.botao_texto).toBe('Ver Contrato');
  });

  it('4. Verificar contrato criado', async () => {
    const result = await query(
      `SELECT * FROM contratos 
       WHERE contratante_id = $1 
       ORDER BY criado_em DESC 
       LIMIT 1`,
      [CONTRATANTE_ID]
    );

    expect(result.rows.length).toBeGreaterThan(0);
    const contrato = result.rows[0];

    // \n=== CONTRATO CRIADO ===

    expect(contrato.plano_id).toBe(2); // Plano personalizado
    expect(contrato.status).toBe('aguardando_pagamento');
    expect(contrato.aceito).toBe(false);
    expect(contrato.pagamento_confirmado).toBe(false);
  });
});
