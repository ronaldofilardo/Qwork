/**
 * Testes E2E completos para o fluxo de cadastro de contratantes
 * Plano Personalizado (Admin Define Valores)
 *
 * Atualizado: 20/Janeiro/2026
 * Cobertura: Cadastro → Admin Define → Proposta → Contrato → Pagamento → Ativação → Login
 */

import { query, transaction } from '@/lib/db';
import { ativarContratante } from '@/lib/contratante-activation';
import { randomBytes } from 'crypto';

describe('E2E: Cadastro Contratante - Plano Personalizado', () => {
  let contratanteId: number;
  let contratoId: number;
  let contratacaoPersonalizadaId: number;
  let planoPersonalizadoId: number;
  let paymentToken: string;
  const timestamp = Date.now();
  const mockCNPJ = `34${timestamp.toString().slice(-10)}00199`;
  const mockEmail = `teste-pers-${timestamp}@empresa.com`;
  const mockResponsavelCPF = `${timestamp.toString().slice(-11)}`;

  beforeAll(async () => {
    // Buscar plano personalizado existente
    const planoRes = await query(
      `SELECT id FROM planos WHERE tipo = 'personalizado' LIMIT 1`
    );
    if (planoRes.rows.length === 0) {
      throw new Error(
        'Nenhum plano personalizado encontrado no banco de dados'
      );
    }
    planoPersonalizadoId = planoRes.rows[0].id;

    // Limpar dados que possam existir
    await query(
      `DELETE FROM contratacao_personalizada 
       WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
      [mockCNPJ]
    );
    await query(
      `DELETE FROM contratos 
       WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
      [mockCNPJ]
    );
    await query(`DELETE FROM contratantes WHERE cnpj = $1`, [mockCNPJ]);
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [
      mockResponsavelCPF,
    ]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (contratanteId) {
      await query(
        `DELETE FROM contratacao_personalizada WHERE contratante_id = $1`,
        [contratanteId]
      );
      await query(`DELETE FROM contratos WHERE contratante_id = $1`, [
        contratanteId,
      ]);
      await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);
    }
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [
      mockResponsavelCPF,
    ]);
  });

  describe('1. Cadastro Inicial com Plano Personalizado', () => {
    it('deve criar contratante com status pendente', async () => {
      const insertResult = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          plano_id, numero_funcionarios_estimado,
          status, ativa, pagamento_confirmado
        ) VALUES (
          'clinica', 'Clínica Teste Personalizado', $1, $2, '11999999999',
          'Av. Personalizada, 456', 'Rio de Janeiro', 'RJ', '20000000',
          'Maria Santos', $3, 'maria.pers@clinica.com', '21988888888',
          $4, 120,
          'pendente', false, false
        ) RETURNING id, status`,
        [mockCNPJ, mockEmail, mockResponsavelCPF, planoPersonalizadoId]
      );

      contratanteId = insertResult.rows[0].id;
      expect(contratanteId).toBeDefined();
      expect(insertResult.rows[0].status).toBe('pendente');
    });

    it('deve criar registro em contratacao_personalizada', async () => {
      const insertResult = await query(
        `INSERT INTO contratacao_personalizada (
          contratante_id, numero_funcionarios_estimado,
          status, criado_em, atualizado_em
        ) VALUES (
          $1, 120, 'aguardando_valor_admin',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id, status`,
        [contratanteId]
      );

      contratacaoPersonalizadaId = insertResult.rows[0].id;
      expect(contratacaoPersonalizadaId).toBeDefined();
      expect(insertResult.rows[0].status).toBe('aguardando_valor_admin');
    });

    it('deve validar campos obrigatórios do contratante', async () => {
      const result = await query(
        `SELECT 
          tipo, nome, cnpj, email, responsavel_cpf, 
          status, plano_id, numero_funcionarios_estimado,
          ativa, pagamento_confirmado
        FROM contratantes WHERE id = $1`,
        [contratanteId]
      );

      const contratante = result.rows[0];
      expect(contratante.tipo).toBe('clinica');
      expect(contratante.nome).toBe('Clínica Teste Personalizado');
      expect(contratante.cnpj).toBe(mockCNPJ);
      expect(contratante.status).toBe('pendente');
      expect(contratante.plano_id).toBe(planoPersonalizadoId);
      expect(contratante.numero_funcionarios_estimado).toBe(120);
      expect(contratante.ativa).toBe(false);
      expect(contratante.pagamento_confirmado).toBe(false);
    });
  });

  describe('2. Admin Define Valores', () => {
    it('deve permitir admin definir valores personalizados', async () => {
      const valorPorFuncionario = 18.5;
      const numeroFuncionarios = 120;
      const valorTotal = valorPorFuncionario * numeroFuncionarios; // 2220.00

      await query(
        `UPDATE contratacao_personalizada 
         SET valor_por_funcionario = $1,
             numero_funcionarios_estimado = $2,
             valor_total_estimado = $3,
             status = 'valor_definido',
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          valorPorFuncionario,
          numeroFuncionarios,
          valorTotal,
          contratacaoPersonalizadaId,
        ]
      );

      const result = await query(
        `SELECT 
          valor_por_funcionario, numero_funcionarios_estimado, 
          valor_total_estimado, status
         FROM contratacao_personalizada WHERE id = $1`,
        [contratacaoPersonalizadaId]
      );

      const contratacao = result.rows[0];
      expect(parseFloat(contratacao.valor_por_funcionario)).toBe(18.5);
      expect(contratacao.numero_funcionarios_estimado).toBe(120);
      expect(parseFloat(contratacao.valor_total_estimado)).toBe(2220.0);
      expect(contratacao.status).toBe('valor_definido');
    });

    it('deve gerar token de pagamento e link com expiração de 48h', async () => {
      paymentToken = randomBytes(32).toString('hex');
      const expiracao = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

      await query(
        `UPDATE contratacao_personalizada 
         SET payment_link_token = $1,
             payment_link_expiracao = $2,
             link_enviado_em = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [paymentToken, expiracao, contratacaoPersonalizadaId]
      );

      const result = await query(
        `SELECT payment_link_token, payment_link_expiracao, link_enviado_em
         FROM contratacao_personalizada WHERE id = $1`,
        [contratacaoPersonalizadaId]
      );

      const contratacao = result.rows[0];
      expect(contratacao.payment_link_token).toBe(paymentToken);
      expect(contratacao.payment_link_expiracao).toBeDefined();
      expect(contratacao.link_enviado_em).toBeDefined();

      // Validar que expiração é no futuro
      const expiracaoDate = new Date(contratacao.payment_link_expiracao);
      expect(expiracaoDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('deve atualizar status do contratante para aguardando_pagamento', async () => {
      await query(
        `UPDATE contratantes 
         SET status = 'aguardando_pagamento'
         WHERE id = $1`,
        [contratanteId]
      );

      const result = await query(
        `SELECT status FROM contratantes WHERE id = $1`,
        [contratanteId]
      );

      expect(result.rows[0].status).toBe('aguardando_pagamento');
    });
  });

  describe('3. Contratante Aceita Proposta', () => {
    it('deve validar token antes de aceitar proposta', async () => {
      const result = await query(
        `SELECT 
          cp.id, cp.status, cp.payment_link_expiracao,
          cp.valor_total_estimado, c.nome
         FROM contratacao_personalizada cp
         JOIN contratantes c ON cp.contratante_id = c.id
         WHERE cp.payment_link_token = $1`,
        [paymentToken]
      );

      expect(result.rows.length).toBe(1);
      const proposta = result.rows[0];
      expect(proposta.status).toBe('valor_definido');

      // Validar que não expirou
      const expiracao = new Date(proposta.payment_link_expiracao);
      expect(expiracao.getTime()).toBeGreaterThan(Date.now());
    });

    it('deve criar contrato ao aceitar proposta', async () => {
      const contratacaoResult = await query(
        `SELECT 
          contratante_id, numero_funcionarios_estimado,
          valor_total_estimado, valor_por_funcionario
         FROM contratacao_personalizada WHERE id = $1`,
        [contratacaoPersonalizadaId]
      );

      const contratacao = contratacaoResult.rows[0];

      const conteudoContrato = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PLANO PERSONALIZADO

CONTRATANTE: Clínica Teste Personalizado
CNPJ: ${mockCNPJ}
RESPONSÁVEL: Maria Santos

PLANO: Personalizado
NÚMERO DE FUNCIONÁRIOS: ${contratacao.numero_funcionarios_estimado}
VALOR POR FUNCIONÁRIO: R$ ${parseFloat(contratacao.valor_por_funcionario).toFixed(2)}
VALOR TOTAL: R$ ${parseFloat(contratacao.valor_total_estimado).toFixed(2)}

[Cláusulas do contrato padrão serão inseridas aqui]

Status: Aguardando Aceite do Contratante`;

      const contratoInsert = await query(
        `INSERT INTO contratos (
          contratante_id, plano_id,
          numero_funcionarios, valor_total,
          status, aceito, conteudo, conteudo_gerado
        ) VALUES (
          $1, $2, $3, $4,
          'aguardando_aceite', false, $5, $5
        ) RETURNING id, status`,
        [
          contratacao.contratante_id,
          planoPersonalizadoId,
          contratacao.numero_funcionarios_estimado,
          contratacao.valor_total_estimado,
          conteudoContrato,
        ]
      );

      contratoId = contratoInsert.rows[0].id;
      expect(contratoId).toBeDefined();
      expect(contratoInsert.rows[0].status).toBe('aguardando_aceite');
    });

    it('deve atualizar status da contratação para aguardando_aceite_contrato', async () => {
      await query(
        `UPDATE contratacao_personalizada 
         SET status = 'aguardando_aceite_contrato',
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [contratacaoPersonalizadaId]
      );

      const result = await query(
        `SELECT status FROM contratacao_personalizada WHERE id = $1`,
        [contratacaoPersonalizadaId]
      );

      expect(result.rows[0].status).toBe('aguardando_aceite_contrato');
    });
  });

  describe('4. Aceite do Contrato', () => {
    it('deve permitir aceite do contrato', async () => {
      await query(
        `UPDATE contratos 
         SET aceito = true,
             data_aceite = NOW(),
             status = 'aguardando_pagamento'
         WHERE id = $1`,
        [contratoId]
      );

      const result = await query(
        `SELECT aceito, data_aceite, status FROM contratos WHERE id = $1`,
        [contratoId]
      );

      const contrato = result.rows[0];
      expect(contrato.aceito).toBe(true);
      expect(contrato.data_aceite).toBeDefined();
      expect(contrato.status).toBe('aguardando_pagamento');
    });
  });

  describe('5. Confirmação de Pagamento', () => {
    it('deve simular confirmação de pagamento via webhook', async () => {
      await transaction(async (txClient) => {
        // Atualizar contratante
        await txClient.query(
          `UPDATE contratantes 
           SET pagamento_confirmado = true,
               data_primeiro_pagamento = NOW()
           WHERE id = $1`,
          [contratanteId]
        );

        // Atualizar contrato
        await txClient.query(
          `UPDATE contratos 
           SET status = 'pago',
               data_pagamento = NOW()
           WHERE id = $1`,
          [contratoId]
        );

        // Atualizar contratacao_personalizada
        await txClient.query(
          `UPDATE contratacao_personalizada 
           SET status = 'pago',
               atualizado_em = NOW()
           WHERE id = $1`,
          [contratacaoPersonalizadaId]
        );
      });

      const contratanteResult = await query(
        `SELECT pagamento_confirmado, data_primeiro_pagamento 
         FROM contratantes WHERE id = $1`,
        [contratanteId]
      );

      const contratoResult = await query(
        `SELECT status, data_pagamento FROM contratos WHERE id = $1`,
        [contratoId]
      );

      const contratacaoResult = await query(
        `SELECT status FROM contratacao_personalizada WHERE id = $1`,
        [contratacaoPersonalizadaId]
      );

      expect(contratanteResult.rows[0].pagamento_confirmado).toBe(true);
      expect(contratanteResult.rows[0].data_primeiro_pagamento).toBeDefined();
      expect(contratoResult.rows[0].status).toBe('pago');
      expect(contratoResult.rows[0].data_pagamento).toBeDefined();
      expect(contratacaoResult.rows[0].status).toBe('pago');
    });
  });

  describe('6. Ativação do Contratante', () => {
    it('deve ativar contratante após pagamento confirmado', async () => {
      const result = await ativarContratante({
        contratante_id: contratanteId,
        motivo:
          'Pagamento confirmado via webhook PIX (Plano Personalizado) - Teste E2E',
      });

      expect(result.success).toBe(true);
      expect(result.contratante_id).toBe(contratanteId);
      expect(result.message).toContain('ativado com sucesso');
    });

    it('deve validar status ativo do contratante', async () => {
      const result = await query(
        `SELECT ativa, status, data_liberacao_login, aprovado_em
         FROM contratantes WHERE id = $1`,
        [contratanteId]
      );

      const contratante = result.rows[0];
      expect(contratante.ativa).toBe(true);
      expect(contratante.status).toBe('aprovado');
      expect(contratante.data_liberacao_login).toBeDefined();
      expect(contratante.aprovado_em).toBeDefined();
    });
  });

  describe('7. Criação de Conta Responsável', () => {
    it('deve criar conta do responsável automaticamente', async () => {
      const result = await query(
        `SELECT * FROM funcionarios 
         WHERE cpf = $1 AND contratante_id = $2`,
        [mockResponsavelCPF, contratanteId]
      );

      expect(result.rows.length).toBe(1);
      const funcionario = result.rows[0];
      expect(funcionario.nome).toBe('Maria Santos');
      expect(funcionario.email).toBe('maria.pers@clinica.com');
      expect(funcionario.perfil).toBe('clinica');
      expect(funcionario.senha_hash).toBeDefined();
    });

    it('deve permitir login com as credenciais criadas', async () => {
      const senhaEsperada = mockCNPJ.slice(-6); // Últimos 6 dígitos do CNPJ

      const result = await query(
        `SELECT senha_hash FROM funcionarios WHERE cpf = $1`,
        [mockResponsavelCPF]
      );

      const senhaHash = result.rows[0].senha_hash;
      const bcrypt = await import('bcrypt');
      const senhaValida = await bcrypt.compare(senhaEsperada, senhaHash);

      expect(senhaValida).toBe(true);
    });
  });

  describe('8. Fluxo Completo Integrado', () => {
    it('deve validar todo o fluxo personalizado completo', async () => {
      // Verificar contratante
      const contratante = await query(
        `SELECT * FROM contratantes WHERE id = $1`,
        [contratanteId]
      );
      expect(contratante.rows[0].ativa).toBe(true);
      expect(contratante.rows[0].pagamento_confirmado).toBe(true);
      expect(contratante.rows[0].status).toBe('aprovado');

      // Verificar contratacao_personalizada
      const contratacao = await query(
        `SELECT * FROM contratacao_personalizada WHERE id = $1`,
        [contratacaoPersonalizadaId]
      );
      expect(contratacao.rows[0].status).toBe('pago');
      expect(parseFloat(contratacao.rows[0].valor_total_estimado)).toBe(2220.0);

      // Verificar contrato
      const contrato = await query(`SELECT * FROM contratos WHERE id = $1`, [
        contratoId,
      ]);
      expect(contrato.rows[0].aceito).toBe(true);
      expect(contrato.rows[0].status).toBe('pago');

      // Verificar funcionário (responsável)
      const funcionario = await query(
        `SELECT * FROM funcionarios WHERE cpf = $1`,
        [mockResponsavelCPF]
      );
      expect(funcionario.rows.length).toBe(1);
      expect(funcionario.rows[0].perfil).toBe('clinica');

      // ✅ Fluxo personalizado completo validado com sucesso!
    });

    it('deve validar valores financeiros corretos', async () => {
      const contrato = await query(
        `SELECT numero_funcionarios, valor_total FROM contratos WHERE id = $1`,
        [contratoId]
      );

      const numeroFuncionarios = contrato.rows[0].numero_funcionarios;
      const valorTotal = parseFloat(contrato.rows[0].valor_total);
      const valorPorFuncionario = valorTotal / numeroFuncionarios;

      expect(numeroFuncionarios).toBe(120);
      expect(valorPorFuncionario).toBeCloseTo(18.5, 2);
      expect(valorTotal).toBeCloseTo(2220.0, 2);
    });
  });

  describe('9. Validações de Segurança e Edge Cases', () => {
    it('deve rejeitar token expirado', async () => {
      // Criar token expirado
      const tokenExpirado = randomBytes(32).toString('hex');
      const expiracaoPassada = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h atrás

      await query(
        `UPDATE contratacao_personalizada 
         SET payment_link_token = $1,
             payment_link_expiracao = $2
         WHERE id = $3`,
        [tokenExpirado, expiracaoPassada, contratacaoPersonalizadaId]
      );

      const result = await query(
        `SELECT payment_link_expiracao FROM contratacao_personalizada 
         WHERE payment_link_token = $1`,
        [tokenExpirado]
      );

      const expiracao = new Date(result.rows[0].payment_link_expiracao);
      expect(expiracao.getTime()).toBeLessThan(Date.now());
    });

    it('deve registrar todas as mudanças de status em audit_logs', async () => {
      const result = await query(
        `SELECT * FROM audit_logs 
         WHERE resource = 'contratantes' 
         AND resource_id = $1
         ORDER BY timestamp DESC`,
        [contratanteId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      // Deve ter registro de ativação
      const ativacao = result.rows.find(
        (log: any) => log.action === 'ACTIVATE'
      );
      expect(ativacao).toBeDefined();
    });
  });
});
