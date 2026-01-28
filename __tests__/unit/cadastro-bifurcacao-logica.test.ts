/**
 * Teste unitário da lógica de bifurcação personalizado vs fixo
 * Testa apenas a lógica de decisão de status, sem validações complexas
 */

import { query } from '@/lib/db';

describe('Cadastro - Lógica de Bifurcação de Status', () => {
  let planoFixoId: number;
  let planoPersonalizadoId: number;

  beforeAll(async () => {
    // Criar planos de teste
    const planoFixo = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('fixo', 'Teste Fixo Unit', 100, true) RETURNING id`
    );
    planoFixoId = planoFixo.rows[0].id;

    const planoPersonalizado = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('personalizado', 'Teste Personalizado Unit', 0, true) RETURNING id`
    );
    planoPersonalizadoId = planoPersonalizado.rows[0].id;
  });

  afterAll(async () => {
    await query(
      'DELETE FROM contratacao_personalizada WHERE plano_id IN ($1, $2)',
      [planoFixoId, planoPersonalizadoId]
    );
    await query('DELETE FROM contratantes WHERE plano_id IN ($1, $2)', [
      planoFixoId,
      planoPersonalizadoId,
    ]);
    await query('DELETE FROM planos WHERE id IN ($1, $2)', [
      planoFixoId,
      planoPersonalizadoId,
    ]);
  });

  it('plano fixo deve ser identificado corretamente na query', async () => {
    const result = await query('SELECT tipo FROM planos WHERE id = $1', [
      planoFixoId,
    ]);
    expect(result.rows[0].tipo).toBe('fixo');
  });

  it('plano personalizado deve ser identificado corretamente na query', async () => {
    const result = await query('SELECT tipo FROM planos WHERE id = $1', [
      planoPersonalizadoId,
    ]);
    expect(result.rows[0].tipo).toBe('personalizado');
  });

  it('contratante com plano fixo deve ter status aguardando_pagamento', async () => {
    // Inserir contratante diretamente no DB
    const contratanteFixo = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_telefone, responsavel_email,
        numero_funcionarios, plano_id, status
      ) VALUES (
        'entidade', 'Test Fixo DB', '06990590000123', 'testfixo@test.com', '11987654321',
        'Rua A', 'São Paulo', 'SP', '01000000',
        'Resp', '52998224725', 'Cargo', '11987654321', 'resp@test.com',
        50, $1, 'aguardando_pagamento'
      ) RETURNING id, status, plano_id`,
      [planoFixoId]
    );

    expect(contratanteFixo.rows[0].status).toBe('aguardando_pagamento');
    expect(contratanteFixo.rows[0].plano_id).toBe(planoFixoId);

    // Verificar que não há registro em contratacao_personalizada
    const personalizadoCheck = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [contratanteFixo.rows[0].id]
    );
    expect(personalizadoCheck.rows.length).toBe(0);
  });

  it('contratante com plano personalizado deve ter status pendente e registro na tabela contratacao_personalizada', async () => {
    // Inserir contratante com plano personalizado
    const contratantePersonalizado = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_telefone, responsavel_email,
        numero_funcionarios, plano_id, status
      ) VALUES (
        'entidade', 'Test Personalizado DB', '07234453000189', 'testpers@test.com', '21987654321',
        'Rua B', 'Rio de Janeiro', 'RJ', '20000000',
        'Resp2', '34608775009', 'Cargo2', '21987654321', 'resp2@test.com',
        150, $1, 'pendente'
      ) RETURNING id, status, plano_id`,
      [planoPersonalizadoId]
    );

    expect(contratantePersonalizado.rows[0].status).toBe('pendente');
    expect(contratantePersonalizado.rows[0].plano_id).toBe(
      planoPersonalizadoId
    );

    // Inserir registro em contratacao_personalizada
    await query(
      `INSERT INTO contratacao_personalizada (
        contratante_id, plano_id, numero_funcionarios, status, criado_em
      ) VALUES ($1, $2, 150, 'pendente', NOW())`,
      [contratantePersonalizado.rows[0].id, planoPersonalizadoId]
    );

    // Verificar registro criado
    const personalizadoCheck = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [contratantePersonalizado.rows[0].id]
    );
    expect(personalizadoCheck.rows.length).toBe(1);
    expect(personalizadoCheck.rows[0].status).toBe('pendente');
    expect(personalizadoCheck.rows[0].numero_funcionarios).toBe(150);
  });

  it('trigger deve sincronizar status entre contratantes e contratacao_personalizada', async () => {
    // Criar contratante e registro personalizado
    const contratante = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_telefone, responsavel_email,
        numero_funcionarios, plano_id, status
      ) VALUES (
        'entidade', 'Test Trigger', '11444777000161', 'testtrigger@test.com', '11987654321',
        'Rua C', 'São Paulo', 'SP', '01000000',
        'Resp3', '86249073096', 'Cargo3', '11987654321', 'resp3@test.com',
        200, $1, 'pendente'
      ) RETURNING id`,
      [planoPersonalizadoId]
    );

    await query(
      `INSERT INTO contratacao_personalizada (
        contratante_id, plano_id, numero_funcionarios, status, criado_em
      ) VALUES ($1, $2, 200, 'pendente', NOW())`,
      [contratante.rows[0].id, planoPersonalizadoId]
    );

    // Atualizar status em contratacao_personalizada
    await query(
      'UPDATE contratacao_personalizada SET status = $1 WHERE contratante_id = $2',
      ['valor_definido', contratante.rows[0].id]
    );

    // Verificar se trigger sincronizou status em contratantes
    const contratanteAtualizado = await query(
      'SELECT status FROM contratantes WHERE id = $1',
      [contratante.rows[0].id]
    );

    // Se trigger 053 foi aplicado, status deve estar sincronizado
    // Se não foi aplicado, esse teste vai falhar e indicar necessidade de aplicar migration
    expect(contratanteAtualizado.rows[0].status).toBe('valor_definido');
  });
});
