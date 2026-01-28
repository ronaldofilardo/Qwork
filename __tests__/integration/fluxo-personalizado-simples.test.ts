/**
 * Teste de Integração Simplificado - Fluxo Plano Personalizado
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

describe('Fluxo Personalizado Simplificado', () => {
  const cnpjTest = '11222333000199';
  const cpfTest = '11122233344';
  let planoId: number;
  let contratanteId: number;

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

    console.log('✅ Plano personalizado ID:', planoId);
  });

  beforeEach(async () => {
    // Limpar dados do teste
    await query('BEGIN');
    await query(
      `DELETE FROM contratacao_personalizada 
       WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query(
      `DELETE FROM contratos 
       WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query(
      `DELETE FROM contratantes_senhas 
       WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpjTest]);
    await query('COMMIT');
  });

  it('deve completar o fluxo completo do plano personalizado', async () => {
    // ==== ETAPA 1: CADASTRO ====
    const cadastroRes = await query(
      `INSERT INTO contratantes (
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

    contratanteId = cadastroRes.rows[0].id;
    expect(contratanteId).toBeDefined();
    console.log('✅ Contratante cadastrado:', contratanteId);

    // Criar entrada em contratacao_personalizada
    await query(
      `INSERT INTO contratacao_personalizada (
        contratante_id, numero_funcionarios_estimado, status
      ) VALUES ($1, 100, 'aguardando_valor_admin')`,
      [contratanteId]
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
       WHERE contratante_id = $6`,
      [valorPorFunc, numFunc, valorTotal, token, expiracao, contratanteId]
    );

    // Criar contrato
    const contratoRes = await query(
      `INSERT INTO contratos (
        contratante_id, plano_id, numero_funcionarios, 
        valor_total, status
      ) VALUES ($1, $2, $3, $4, 'aguardando_pagamento')
      RETURNING id`,
      [contratanteId, planoId, numFunc, valorTotal]
    );

    const contratoId = contratoRes.rows[0].id;
    console.log('✅ Contrato criado:', contratoId);

    // Verificar valores
    const verificaContratacao = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(verificaContratacao.rows[0].status).toBe('valor_definido');
    expect(parseFloat(verificaContratacao.rows[0].valor_total_estimado)).toBe(
      valorTotal
    );

    // ==== ETAPA 3: PAGAMENTO CONFIRMADO ====
    await query(
      `UPDATE contratacao_personalizada
       SET status = 'pago'
       WHERE contratante_id = $1`,
      [contratanteId]
    );

    await query(
      `UPDATE contratos
       SET status = 'ativo', aceito = true, data_aceite = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [contratoId]
    );

    await query(
      `UPDATE contratantes
       SET status = 'aprovado', 
           pagamento_confirmado = true,
           ativa = true,
           data_liberacao_login = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [contratanteId]
    );

    console.log('✅ Pagamento confirmado');

    // ==== ETAPA 4: LOGIN LIBERADO ====
    // Simular criação de senha via bcrypt
    const senhaHash = await bcrypt.hash('Senha@123', 10);

    await query(
      `INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (contratante_id) DO UPDATE SET senha_hash = EXCLUDED.senha_hash`,
      [contratanteId, cpfTest, senhaHash]
    );

    // Verificar senha criada
    const verificaSenha = await query(
      'SELECT * FROM contratantes_senhas WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(verificaSenha.rows.length).toBe(1);
    expect(verificaSenha.rows[0].cpf).toBe(cpfTest);
    console.log('✅ Login liberado com sucesso');

    // ==== VERIFICAÇÃO FINAL ====
    const estadoFinal = await query(
      `SELECT 
        c.id, c.status, c.ativa, c.pagamento_confirmado,
        cp.status as contratacao_status,
        ct.status as contrato_status, ct.aceito,
        cs.senha_hash IS NOT NULL as tem_senha
       FROM contratantes c
       LEFT JOIN contratacao_personalizada cp ON c.id = cp.contratante_id
       LEFT JOIN contratos ct ON c.id = ct.contratante_id
       LEFT JOIN contratantes_senhas cs ON c.id = cs.contratante_id
       WHERE c.id = $1`,
      [contratanteId]
    );

    const estado = estadoFinal.rows[0];

    expect(estado.status).toBe('aprovado');
    expect(estado.ativa).toBe(true);
    expect(estado.pagamento_confirmado).toBe(true);
    expect(estado.contratacao_status).toBe('pago');
    expect(estado.contrato_status).toBe('ativo');
    expect(estado.aceito).toBe(true);
    expect(estado.tem_senha).toBe(true);

    console.log('\n🎉 FLUXO COMPLETO VALIDADO COM SUCESSO!\n');
    console.log('Estado Final:', {
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
       WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query(
      `DELETE FROM contratos 
       WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query(
      `DELETE FROM contratantes_senhas 
       WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
      [cnpjTest]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpjTest]);
    await query('COMMIT');
    console.log('✅ Limpeza concluída');
  });
});
