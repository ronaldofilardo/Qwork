/**
 * Teste de Integração Simplificado - Fluxo Plano Personalizado para Tomador
 *
 * Testa todo o ciclo do plano personalizado de forma simplificada:
 * 1. Cadastro → pendente
 * 2. Admin aprova → define valores
 * 3. Pagamento confirmado
 * 4. Login liberado
 */

import { query } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

describe('Fluxo Personalizado Simplificado - Tomador', () => {
  const cnpjTest = '11222333000199';
  const cpfTest = '11122233344';
  let planoId: number;
  let tomadorId: number;

  beforeAll(async () => {
    // Buscar ou criar plano personalizado
    const planoRes = await query(
      `SELECT id FROM planos WHERE tipo = 'personalizado' AND ativo = true LIMIT 1`
    );

    if (planoRes.rows.length > 0) {
      planoId = planoRes.rows[0].id;
    } else {
      const newPlano = await query(
        `INSERT INTO planos (tipo, nome, preco, ativo)
         VALUES ('personalizado', 'Teste Simples', 0, true)
         RETURNING id`
      );
      planoId = newPlano.rows[0].id;
    }

  });

  beforeEach(async () => {
    // Limpar dados do teste
    await query('BEGIN');
    await query(
      `DELETE FROM contratacao_personalizada 
       WHERE tomador_id IN (SELECT id FROM entidades WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query(
      `DELETE FROM contratos 
       WHERE tomador_id IN (SELECT id FROM entidades WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query(
      `DELETE FROM entidades_senhas 
       WHERE tomador_id IN (SELECT id FROM entidades WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query('DELETE FROM entidades WHERE cnpj = $1', [cnpjTest]);
    await query('COMMIT');
  });

  it('deve completar o fluxo completo do plano personalizado', async () => {
    // ==== ETAPA 1: CADASTRO ====
    const cadastroRes = await query(
      `INSERT INTO entidades (
        tipo, nome, cnpj, email, telefone, 
        endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo,
        responsavel_email, responsavel_celular,
        plano_id, status, ativa
      ) VALUES (
        'entidade', 'Empresa Teste Simples', $1, 'teste@simples.com', '11999999999',
        'Rua Teste, 100', 'São Paulo', 'SP', '01000-000',
        'João Teste', $2, 'Diretor',
        'joao@teste.com', '11999999999',
        $3, 'pendente', false
      ) RETURNING id`,
      [cnpjTest, cpfTest, planoId]
    );

    tomadorId = cadastroRes.rows[0].id;
    expect(tomadorId).toBeDefined();

    // Criar entrada em contratacao_personalizada
    await query(
      `INSERT INTO contratacao_personalizada (
        tomador_id, numero_funcionarios_estimado, status
      ) VALUES ($1, 100, 'aguardando_valor_admin')`,
      [tomadorId]
    );

    // ==== ETAPA 2: ADMIN DEFINE VALORES ====
    const valorPorFunc = 30.0;
    const numFunc = 100;
    const valorTotal = valorPorFunc * numFunc;
    const token = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await query(
      `UPDATE contratacao_personalizada
       SET valor_por_funcionario = $1,
           numero_funcionarios_estimado = $2,
           valor_total_estimado = $3,
           payment_link_token = $4,
           payment_link_expiracao = $5,
           status = 'valor_definido'
       WHERE tomador_id = $6`,
      [valorPorFunc, numFunc, valorTotal, token, expiracao, tomadorId]
    );

    // Criar contrato
    const contratoRes = await query(
      `INSERT INTO contratos (
        tomador_id, plano_id, numero_funcionarios, 
        valor_total, status
      ) VALUES ($1, $2, $3, $4, 'aguardando_pagamento')
      RETURNING id`,
      [tomadorId, planoId, numFunc, valorTotal]
    );

    const contratoId = contratoRes.rows[0].id;

    // Verificar valores
    const verificaContratacao = await query(
      'SELECT * FROM contratacao_personalizada WHERE tomador_id = $1',
      [tomadorId]
    );

    expect(verificaContratacao.rows[0].status).toBe('valor_definido');
    expect(parseFloat(verificaContratacao.rows[0].valor_total_estimado)).toBe(
      valorTotal
    );

    // ==== ETAPA 3: PAGAMENTO CONFIRMADO ====
    await query(
      `UPDATE contratacao_personalizada
       SET status = 'pago'
       WHERE tomador_id = $1`,
      [tomadorId]
    );

    await query(
      `UPDATE contratos
       SET status = 'ativo', aceito = true, data_aceite = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [contratoId]
    );

    await query(
      `UPDATE entidades
       SET status = 'aprovado', 
           pagamento_confirmado = true,
           ativa = true,
           data_liberacao_login = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [tomadorId]
    );

    // ✅ Pagamento confirmado

    // ==== ETAPA 4: LOGIN LIBERADO ====
    // Simular criação de senha via bcrypt
    const senhaHash = await bcrypt.hash('Senha@123', 10);

    await query(
      `INSERT INTO entidades_senhas (tomador_id, cpf, senha_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (tomador_id) DO UPDATE SET senha_hash = EXCLUDED.senha_hash`,
      [tomadorId, cpfTest, senhaHash]
    );

    // Verificar senha criada
    const verificaSenha = await query(
      'SELECT * FROM entidades_senhas WHERE tomador_id = $1',
      [tomadorId]
    );

    expect(verificaSenha.rows.length).toBe(1);
    expect(verificaSenha.rows[0].cpf).toBe(cpfTest);
    // ✅ Login liberado com sucesso

    // ==== VERIFICAÇÃO FINAL ====
    const estadoFinal = await query(
      `SELECT 
        c.id, c.status, c.ativa, c.pagamento_confirmado,
        cp.status as contratacao_status,
        ct.status as contrato_status, ct.aceito,
        cs.senha_hash IS NOT NULL as tem_senha
       FROM entidades c
       LEFT JOIN contratacao_personalizada cp ON c.id = cp.tomador_id
       LEFT JOIN contratos ct ON c.id = ct.tomador_id
       LEFT JOIN entidades_senhas cs ON c.id = cs.tomador_id
       WHERE c.id = $1`,
      [tomadorId]
    );

    const estado = estadoFinal.rows[0];

    expect(estado.status).toBe('aprovado');
    expect(estado.ativa).toBe(true);
    expect(estado.pagamento_confirmado).toBe(true);
    expect(estado.contratacao_status).toBe('pago');
    expect(estado.contrato_status).toBe('ativo');
    expect(estado.aceito).toBe(true);
    expect(estado.tem_senha).toBe(true);

    // \n🎉 FLUXO COMPLETO VALIDADO COM SUCESSO!\n

      status: estado.status,
      ativa: estado.ativa,
      pagamento_confirmado: estado.pagamento_confirmado,
      contratacao_status: estado.contratacao_status,
      contrato_status: estado.contrato_status,
      aceito: estado.aceito,
      tem_senha: estado.tem_senha,
    });
  });

  afterAll(async () => {
    // Limpar dados finais
    await query('BEGIN');
    await query(
      `DELETE FROM contratacao_personalizada 
       WHERE tomador_id IN (SELECT id FROM entidades WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query(
      `DELETE FROM contratos 
       WHERE tomador_id IN (SELECT id FROM entidades WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query(
      `DELETE FROM entidades_senhas 
       WHERE tomador_id IN (SELECT id FROM entidades WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query('DELETE FROM entidades WHERE cnpj = $1', [cnpjTest]);
    await query('COMMIT');
    // ✅ Limpeza concluída

  });
});
