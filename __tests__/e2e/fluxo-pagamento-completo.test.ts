/**
 * Testes E2E: Fluxo Completo de Pagamento e Ativação
 *
 * Valida a máquina de estados de pagamento para planos fixos e personalizados
 * Garante que nenhum contratante seja ativado sem pagamento confirmado
 */

import { query, ativarContratante } from '@/lib/db';

describe('Fluxo de Pagamento - Plano Fixo', () => {
  let contratanteId: number;
  let planoId: number;
  let contratoId: number;

  beforeAll(async () => {
    // Criar plano fixo para testes
    const planoResult = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo)
       VALUES ('fixo', 'Plano Teste Bronze', 100, true)
       RETURNING id`,
      []
    );
    planoId = planoResult.rows[0].id;
  });

  beforeEach(async () => {
    const cnpj = `123456${Math.floor(Math.random() * 900000) + 100000}000199`;
    const result = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular,
        numero_funcionarios_estimado, plano_id, status, ativa, pagamento_confirmado
      ) VALUES (
        'clinica', 'Clínica Teste', $1, 'clinica@teste.com', 
        '11999999999', 'Rua Teste, 123', 'São Paulo', 'SP', '01234567',
        '12345678901', 'João Silva', 'joao@teste.com', '11988888888',
        25, $2, 'pendente', false, false
      ) RETURNING id`,
      [cnpj, planoId]
    );
    contratanteId = result.rows[0].id;
  });

  afterEach(async () => {
    // Limpar dados de teste
    if (contratoId) {
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
    }
    if (contratanteId) {
      await query(
        'DELETE FROM tokens_retomada_pagamento WHERE contratante_id = $1',
        [contratanteId]
      );
      await query('DELETE FROM pagamentos WHERE contratante_id = $1', [
        contratanteId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  afterAll(async () => {
    // Limpar plano de teste
    if (planoId) {
      await query('DELETE FROM planos WHERE id = $1', [planoId]);
    }
  });

  test('Caso 1: Geração de link NÃO deve ativar contratante', async () => {
    // Simular geração de link de pagamento
    await query(
      `UPDATE contratantes 
       SET status = 'aguardando_pagamento', ativa = false, pagamento_confirmado = false
       WHERE id = $1`,
      [contratanteId]
    );

    // Criar contrato em estado pendente
    const contratoResult = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, conteudo)
       VALUES ($1, $2, 25, 2500, 'aguardando_pagamento', 'Contrato de teste gerado automaticamente')
       RETURNING id`,
      [contratanteId, planoId]
    );
    contratoId = contratoResult.rows[0].id;

    // Verificar que contratante NÃO está ativo
    const verificacao = await query(
      'SELECT ativa, pagamento_confirmado, status FROM contratantes WHERE id = $1',
      [contratanteId]
    );

    expect(verificacao.rows[0].ativa).toBe(false);
    expect(verificacao.rows[0].pagamento_confirmado).toBe(false);
    expect(verificacao.rows[0].status).toBe('aguardando_pagamento');
  });

  test('Caso 2: Pagamento confirmado deve ativar automaticamente (trigger)', async () => {
    // Simular pagamento - o trigger deve ativar automaticamente
    await query(
      `UPDATE contratantes 
       SET pagamento_confirmado = true, status = 'aprovado'
       WHERE id = $1`,
      [contratanteId]
    );

    // Verificar que o trigger ativou automaticamente
    const verificacao = await query(
      'SELECT ativa, pagamento_confirmado FROM contratantes WHERE id = $1',
      [contratanteId]
    );

    expect(verificacao.rows[0].ativa).toBe(true);
    expect(verificacao.rows[0].pagamento_confirmado).toBe(true);
  });

  test('Caso 3: Tentativa de ativar sem pagamento deve falhar', async () => {
    // Garantir que pagamento NÃO está confirmado
    await query(
      `UPDATE contratantes 
       SET pagamento_confirmado = false, status = 'pendente', ativa = false
       WHERE id = $1`,
      [contratanteId]
    );

    // Tentar ativar deve retornar erro
    const resultado = await ativarContratante(contratanteId);

    expect(resultado.success).toBe(false);
    expect(resultado.message).toContain('Pagamento não confirmado');

    // Verificar que contratante continua inativo
    const verificacao = await query(
      'SELECT ativa FROM contratantes WHERE id = $1',
      [contratanteId]
    );

    expect(verificacao.rows[0].ativa).toBe(false);
  });

  test('Caso 4: Constraint do banco deve bloquear UPDATE direto', async () => {
    // Garantir pagamento não confirmado
    await query(
      `UPDATE contratantes 
       SET pagamento_confirmado = false, ativa = false
       WHERE id = $1`,
      [contratanteId]
    );

    // Tentar UPDATE direto deve falhar por constraint
    await expect(
      query('UPDATE contratantes SET ativa = true WHERE id = $1', [
        contratanteId,
      ])
    ).rejects.toThrow();
  });
});

describe('Fluxo de Pagamento - Plano Personalizado', () => {
  let contratanteId: number;
  let planoId: number;
  let contratoId: number;

  beforeAll(async () => {
    // Criar plano personalizado
    const planoResult = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo)
       VALUES ('personalizado', 'Plano Personalizado Teste', 0, true)
       ON CONFLICT (nome) DO UPDATE SET preco = 0
       RETURNING id`,
      []
    );
    planoId = planoResult.rows[0].id;
  });

  beforeEach(async () => {
    const cnpj = `987654${Math.floor(Math.random() * 900000) + 100000}000188`;
    // Criar contratante
    const result = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular,
        numero_funcionarios_estimado, plano_id, status, ativa, pagamento_confirmado
      ) VALUES (
        'entidade', 'Entidade Teste', $1, 'entidade@teste.com',
        '11977777777', 'Rua Entidade, 456', 'Rio de Janeiro', 'RJ', '22222222',
        '98765432109', 'Maria Santos', 'maria@teste.com', '11966666666',
        50, $2, 'pendente', false, false
      ) RETURNING id`,
      [cnpj, planoId]
    );
    contratanteId = result.rows[0].id;
  });

  afterEach(async () => {
    if (contratoId) {
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
    }
    if (contratanteId) {
      await query(
        'DELETE FROM tokens_retomada_pagamento WHERE contratante_id = $1',
        [contratanteId]
      );
      await query('DELETE FROM pagamentos WHERE contratante_id = $1', [
        contratanteId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  afterAll(async () => {
    if (planoId) {
      await query('DELETE FROM planos WHERE id = $1', [planoId]);
    }
  });

  test('Caso 1: Admin define valor e gera link - NÃO deve ativar', async () => {
    // Simular admin definindo valor personalizado
    const contratoResult = await query(
      `INSERT INTO contratos (
        contratante_id, plano_id, numero_funcionarios, 
        valor_total, valor_personalizado, status, conteudo
      ) VALUES ($1, $2, 50, 10000, 200, 'aguardando_pagamento', 'Contrato personalizado de teste')
      RETURNING id`,
      [contratanteId, planoId]
    );
    contratoId = contratoResult.rows[0].id;

    await query(
      `UPDATE contratantes 
       SET status = 'aguardando_pagamento', ativa = false, pagamento_confirmado = false
       WHERE id = $1`,
      [contratanteId]
    );

    // Verificar que NÃO está ativo
    const verificacao = await query(
      'SELECT ativa, pagamento_confirmado, status FROM contratantes WHERE id = $1',
      [contratanteId]
    );

    expect(verificacao.rows[0].ativa).toBe(false);
    expect(verificacao.rows[0].pagamento_confirmado).toBe(false);
    expect(verificacao.rows[0].status).toBe('aguardando_pagamento');
  });

  test('Caso 2: Pagamento confirmado deve ativar automaticamente (trigger)', async () => {
    await query(
      `UPDATE contratantes 
       SET pagamento_confirmado = true, status = 'aprovado'
       WHERE id = $1`,
      [contratanteId]
    );

    // Verificar que o trigger ativou automaticamente
    const verificacao = await query(
      'SELECT ativa, pagamento_confirmado FROM contratantes WHERE id = $1',
      [contratanteId]
    );

    expect(verificacao.rows[0].ativa).toBe(true);
    expect(verificacao.rows[0].pagamento_confirmado).toBe(true);
  });
});

describe('Tokens de Retomada de Pagamento', () => {
  let contratanteId: number;
  let planoId: number;
  let token: string;

  beforeAll(async () => {
    const planoResult = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo)
       VALUES ('fixo', 'Plano Token Teste', 150, true)
       ON CONFLICT (nome) DO UPDATE SET preco = 150
       RETURNING id`,
      []
    );
    planoId = planoResult.rows[0].id;
  });

  beforeEach(async () => {
    const cnpj = `111222${Math.floor(Math.random() * 900000) + 100000}000144`;
    const email = `token${Math.floor(Math.random() * 10000)}@teste.com`;
    const result = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular,
        numero_funcionarios_estimado, plano_id, status, ativa, pagamento_confirmado
      ) VALUES (
        'clinica', 'Clínica Token', $1, $2,
        '11977777777', 'Rua Token, 456', 'Rio de Janeiro', 'RJ', '22222222',
        '11122233344', 'Pedro Oliveira', 'pedro@teste.com', '11966666666',
        30, $3, 'aguardando_pagamento', false, false
      ) RETURNING id`,
      [cnpj, email, planoId]
    );
    contratanteId = result.rows[0].id;
  });

  afterEach(async () => {
    if (token) {
      await query('DELETE FROM tokens_retomada_pagamento WHERE token = $1', [
        token,
      ]);
    }
    if (contratanteId) {
      await query(
        'DELETE FROM tokens_retomada_pagamento WHERE contratante_id = $1',
        [contratanteId]
      );
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  afterAll(async () => {
    if (planoId) {
      // Primeiro remover referências
      await query(
        'UPDATE contratantes SET plano_id = NULL WHERE plano_id = $1',
        [planoId]
      );
      await query('DELETE FROM planos WHERE id = $1', [planoId]);
    }
  });

  test('Caso 1: Token válido deve ser aceito', async () => {
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 48);

    token = 'token_teste_valido_' + Date.now();

    // Inserir token
    await query(
      `INSERT INTO tokens_retomada_pagamento (
        token, contratante_id, plano_id, tipo_plano, numero_funcionarios,
        valor_total, expiracao, usado
      ) VALUES ($1, $2, $3, 'fixo', 30, 4500, $4, false)`,
      [token, contratanteId, planoId, expiracao]
    );

    // Validar token
    const validacao = await query(
      'SELECT * FROM fn_validar_token_pagamento($1)',
      [token]
    );

    const resultado = validacao.rows[0];
    expect(resultado.valido).toBe(true);
    expect(resultado.contratante_id).toBe(contratanteId);
  });

  test('Caso 2: Token usado deve ser rejeitado', async () => {
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 48);

    token = 'token_teste_usado_' + Date.now();

    await query(
      `INSERT INTO tokens_retomada_pagamento (
        token, contratante_id, plano_id, tipo_plano, numero_funcionarios,
        valor_total, expiracao, usado
      ) VALUES ($1, $2, $3, 'fixo', 30, 4500, $4, true)`,
      [token, contratanteId, planoId, expiracao]
    );

    const validacao = await query(
      'SELECT * FROM fn_validar_token_pagamento($1)',
      [token]
    );

    const resultado = validacao.rows[0];
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toMatch(/utilizado/); // Mais flexível para encoding
  });

  test('Caso 3: Token expirado deve ser rejeitado', async () => {
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() - 1); // Expirado há 1 hora

    token = 'token_teste_expirado_' + Date.now();

    await query(
      `INSERT INTO tokens_retomada_pagamento (
        token, contratante_id, plano_id, tipo_plano, numero_funcionarios,
        valor_total, expiracao, usado
      ) VALUES ($1, $2, $3, 'fixo', 30, 4500, $4, false)`,
      [token, contratanteId, planoId, expiracao]
    );

    const validacao = await query(
      'SELECT * FROM fn_validar_token_pagamento($1)',
      [token]
    );

    const resultado = validacao.rows[0];
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toMatch(/expirado/); // Mais flexível para encoding
  });
});

describe('Sistema de Reconciliação', () => {
  let contratanteId: number;

  beforeEach(async () => {
    // Desabilitar triggers para permitir dados inconsistentes nos testes
    await query(
      'ALTER TABLE contratantes DISABLE TRIGGER tr_contratantes_sync_status_ativa'
    );
    await query(
      'ALTER TABLE contratantes DISABLE TRIGGER trg_validar_ativacao_contratante'
    );

    const cnpj = `555666${Math.floor(Math.random() * 900000) + 100000}000188`;
    const email = `inconsistente${Math.floor(Math.random() * 10000)}@teste.com`;
    const result = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular,
        status, ativa, pagamento_confirmado
      ) VALUES (
        'clinica', 'Clínica Inconsistente', $1, $2,
        '11955555555', 'Rua Inconsistente, 789', 'Belo Horizonte', 'MG', '33333333',
        '55566677788', 'Ana Costa', 'ana@teste.com', '11944444444',
        'aprovado', false, false
      ) RETURNING id`,
      [cnpj, email]
    );
    contratanteId = result.rows[0].id;

    // Reabilitar triggers após inserção
    await query(
      'ALTER TABLE contratantes ENABLE TRIGGER tr_contratantes_sync_status_ativa'
    );
    await query(
      'ALTER TABLE contratantes ENABLE TRIGGER trg_validar_ativacao_contratante'
    );
  });

  afterEach(async () => {
    if (contratanteId) {
      await query('DELETE FROM alertas_integridade WHERE recurso_id = $1', [
        contratanteId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  test('Deve detectar contratante ativo sem pagamento', async () => {
    // Verificar estado inicial (deve estar inativo)
    const inicial = await query(
      'SELECT ativa, pagamento_confirmado FROM contratantes WHERE id = $1',
      [contratanteId]
    );
    expect(inicial.rows[0].ativa).toBe(false);
    expect(inicial.rows[0].pagamento_confirmado).toBe(false);

    // Tentar criar inconsistência deve falhar devido ao trigger de integridade
    await expect(
      query('UPDATE contratantes SET ativa = true WHERE id = $1', [
        contratanteId,
      ])
    ).rejects.toThrow(); // trigger impede ativação sem condições (integrity rule)

    // Verificar que continua inativo
    const verificacao = await query(
      'SELECT ativa, pagamento_confirmado FROM contratantes WHERE id = $1',
      [contratanteId]
    );
    expect(verificacao.rows[0].ativa).toBe(false);
    expect(verificacao.rows[0].pagamento_confirmado).toBe(false);
  });

  test('Deve corrigir automaticamente inconsistências', async () => {
    // Para este teste, assumimos que pode haver inconsistências pré-existentes
    // A função de correção deve lidar com elas

    // Executar função de correção
    const correcao = await query(
      'SELECT * FROM fn_corrigir_inconsistencias_contratantes()'
    );

    // Verificar se não há mais inconsistências ativas
    const inconsistencias = await query(
      'SELECT COUNT(*) as count FROM contratantes WHERE ativa = true AND pagamento_confirmado = false'
    );

    expect(parseInt(inconsistencias.rows[0].count)).toBe(0);

    // Verificar que alertas foram criados se houve correções
    if (correcao.rows.length > 0) {
      const alertas = await query(
        `SELECT COUNT(*) as count FROM alertas_integridade 
         WHERE tipo = 'correcao_automatica_inconsistencia'`
      );
      expect(parseInt(alertas.rows[0].count)).toBeGreaterThan(0);
    }
  });
});
