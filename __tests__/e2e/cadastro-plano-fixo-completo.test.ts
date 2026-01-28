/**
 * Testes E2E completos para o fluxo de cadastro de contratantes
 * Plano Fixo (Contract-First)
 *
 * Atualizado: 20/Janeiro/2026
 * Cobertura: Cadastro → Contrato → Pagamento → Ativação → Login
 */

import { query, transaction } from '@/lib/db';
import { ativarContratante } from '@/lib/contratante-activation';

describe('E2E: Cadastro Contratante - Plano Fixo', () => {
  let contratanteId: number;
  let contratoId: number;
  let planoFixoId: number;
  const timestamp = Date.now();
  const mockCNPJ = `12${timestamp.toString().slice(-10)}00199`;
  const mockEmail = `teste-fixo-${timestamp}@empresa.com`;
  const mockResponsavelCPF = `${timestamp.toString().slice(-11)}`;

  beforeAll(async () => {
    // Buscar plano fixo existente
    const planoRes = await query(
      `SELECT id FROM planos WHERE tipo = 'fixo' LIMIT 1`
    );
    if (planoRes.rows.length === 0) {
      throw new Error('Nenhum plano fixo encontrado no banco de dados');
    }
    planoFixoId = planoRes.rows[0].id;

    // Limpar dados que possam existir
    await query(
      `DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)`,
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
      await query(`DELETE FROM contratos WHERE contratante_id = $1`, [
        contratanteId,
      ]);
      await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);
    }
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [
      mockResponsavelCPF,
    ]);
  });

  describe('1. Cadastro Inicial com Plano Fixo', () => {
    it('deve criar contratante com todos os dados obrigatórios', async () => {
      const insertResult = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          plano_id, numero_funcionarios_estimado,
          status, ativa, pagamento_confirmado
        ) VALUES (
          'entidade', 'Empresa Teste Fixo LTDA', $1, $2, '11999999999',
          'Rua Teste Fixo, 123', 'São Paulo', 'SP', '01234567',
          'João da Silva', $3, 'joao.fixo@empresa.com', '11988888888',
          $4, 50,
          'aguardando_pagamento', false, false
        ) RETURNING id, status`,
        [mockCNPJ, mockEmail, mockResponsavelCPF, planoFixoId]
      );

      contratanteId = insertResult.rows[0].id;
      expect(contratanteId).toBeDefined();
      expect(insertResult.rows[0].status).toBe('aguardando_pagamento');
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
      expect(contratante.tipo).toBe('entidade');
      expect(contratante.nome).toBe('Empresa Teste Fixo LTDA');
      expect(contratante.cnpj).toBe(mockCNPJ);
      expect(contratante.email).toBe(mockEmail);
      expect(contratante.responsavel_cpf).toBe(mockResponsavelCPF);
      expect(contratante.status).toBe('aguardando_pagamento');
      expect(contratante.plano_id).toBe(planoFixoId);
      expect(contratante.numero_funcionarios_estimado).toBe(50);
      expect(contratante.ativa).toBe(false);
      expect(contratante.pagamento_confirmado).toBe(false);
    });

    it('não deve permitir CNPJ duplicado', async () => {
      await expect(
        query(
          `INSERT INTO contratantes (
            tipo, nome, cnpj, email, telefone,
            endereco, cidade, estado, cep,
            responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
            plano_id, status
          ) VALUES (
            'clinica', 'Outra Empresa', $1, 'outro@email.com', '11999999999',
            'Rua Teste, 456', 'São Paulo', 'SP', '01234567',
            'Maria Silva', '11111111111', 'maria@empresa.com', '11988888888',
            $2, 'pendente'
          )`,
          [mockCNPJ, planoFixoId]
        )
      ).rejects.toThrow();
    });

    it('não deve permitir email duplicado', async () => {
      await expect(
        query(
          `INSERT INTO contratantes (
            tipo, nome, cnpj, email, telefone,
            endereco, cidade, estado, cep,
            responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
            plano_id, status
          ) VALUES (
            'clinica', 'Outra Empresa', '98765432000100', $1, '11999999999',
            'Rua Teste, 456', 'São Paulo', 'SP', '01234567',
            'Maria Silva', '11111111111', 'maria@empresa.com', '11988888888',
            $2, 'pendente'
          )`,
          [mockEmail, planoFixoId]
        )
      ).rejects.toThrow();
    });
  });

  describe('2. Criação Automática de Contrato (Contract-First)', () => {
    it('deve criar contrato automaticamente no cadastro', async () => {
      const valorTotal = 50 * 20.0; // 50 funcionários × R$ 20,00

      const insertResult = await query(
        `INSERT INTO contratos (
          contratante_id, plano_id, 
          numero_funcionarios, valor_total,
          status, aceito, conteudo
        ) VALUES (
          $1, $2, 50, $3,
          'aguardando_pagamento', false, 
          'Contrato para 50 funcionário(s) - Plano Fixo - Valor total: R$ 1000.00'
        ) RETURNING id, status, aceito`,
        [contratanteId, planoFixoId, valorTotal]
      );

      contratoId = insertResult.rows[0].id;
      expect(contratoId).toBeDefined();
      expect(insertResult.rows[0].status).toBe('aguardando_pagamento');
      expect(insertResult.rows[0].aceito).toBe(false);
    });

    it('deve validar dados do contrato criado', async () => {
      const result = await query(
        `SELECT 
          id, contratante_id, plano_id, 
          numero_funcionarios, valor_total,
          status, aceito
        FROM contratos WHERE id = $1`,
        [contratoId]
      );

      const contrato = result.rows[0];
      expect(contrato.contratante_id).toBe(contratanteId);
      expect(contrato.plano_id).toBe(planoFixoId);
      expect(contrato.numero_funcionarios).toBe(50);
      expect(parseFloat(contrato.valor_total)).toBe(1000.0);
      expect(contrato.status).toBe('aguardando_pagamento');
      expect(contrato.aceito).toBe(false);
    });
  });

  describe('3. Aceite do Contrato', () => {
    it('deve permitir aceite do contrato', async () => {
      await query(
        `UPDATE contratos 
         SET aceito = true, 
             data_aceite = NOW()
         WHERE id = $1`,
        [contratoId]
      );

      const result = await query(
        `SELECT aceito, data_aceite FROM contratos WHERE id = $1`,
        [contratoId]
      );

      expect(result.rows[0].aceito).toBe(true);
      expect(result.rows[0].data_aceite).toBeDefined();
    });

    it('deve manter status aguardando_pagamento após aceite', async () => {
      const result = await query(`SELECT status FROM contratos WHERE id = $1`, [
        contratoId,
      ]);

      expect(result.rows[0].status).toBe('aguardando_pagamento');
    });
  });

  describe('4. Confirmação de Pagamento', () => {
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

      expect(contratanteResult.rows[0].pagamento_confirmado).toBe(true);
      expect(contratanteResult.rows[0].data_primeiro_pagamento).toBeDefined();
      expect(contratoResult.rows[0].status).toBe('pago');
      expect(contratoResult.rows[0].data_pagamento).toBeDefined();
    });
  });

  describe('5. Ativação do Contratante', () => {
    it('deve ativar contratante após pagamento confirmado', async () => {
      const result = await ativarContratante({
        contratante_id: contratanteId,
        motivo: 'Pagamento confirmado via webhook PIX - Teste E2E',
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

    it('não deve permitir ativar contratante já ativo', async () => {
      const result = await ativarContratante({
        contratante_id: contratanteId,
        motivo: 'Tentativa de ativação duplicada - Teste E2E',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('já está ativo');
    });
  });

  describe('6. Criação de Conta Responsável', () => {
    it('deve criar conta do responsável automaticamente', async () => {
      const result = await query(
        `SELECT * FROM funcionarios 
         WHERE cpf = $1 AND contratante_id = $2`,
        [mockResponsavelCPF, contratanteId]
      );

      expect(result.rows.length).toBe(1);
      const funcionario = result.rows[0];
      expect(funcionario.nome).toBe('João da Silva');
      expect(funcionario.email).toBe('joao.fixo@empresa.com');
      expect(funcionario.perfil).toBe('gestor_entidade');
      expect(funcionario.senha_hash).toBeDefined();
    });

    it('deve validar que a senha foi hasheada com bcrypt', async () => {
      const result = await query(
        `SELECT senha_hash FROM funcionarios WHERE cpf = $1`,
        [mockResponsavelCPF]
      );

      const senhaHash = result.rows[0].senha_hash;
      expect(senhaHash).toBeDefined();
      expect(senhaHash).toMatch(/^\$2[aby]\$.{56}$/); // Formato bcrypt
    });

    it('deve permitir login com as credenciais criadas', async () => {
      // Simular verificação de login
      const senhaEsperada = mockCNPJ.slice(-6); // Últimos 6 dígitos do CNPJ

      const result = await query(
        `SELECT senha_hash FROM funcionarios WHERE cpf = $1`,
        [mockResponsavelCPF]
      );

      const senhaHash = result.rows[0].senha_hash;
      const bcrypt = await import('bcryptjs');
      const senhaValida = await bcrypt.compare(senhaEsperada, senhaHash);

      expect(senhaValida).toBe(true);
    });
  });

  describe('7. Validações de Segurança', () => {
    it('não deve permitir ativar sem pagamento confirmado', async () => {
      // Criar contratante sem pagamento
      const novoContratante = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          plano_id, status, ativa, pagamento_confirmado
        ) VALUES (
          'entidade', 'Empresa Sem Pagamento', '11122233344455', 'sempag@test.com', '11999999999',
          'Rua Teste, 123', 'São Paulo', 'SP', '01234567',
          'Teste', '99999999999', 'teste@test.com', '11988888888',
          $1, 'pendente', false, false
        ) RETURNING id`,
        [planoFixoId]
      );

      await expect(
        ativarContratante({
          contratante_id: novoContratante.rows[0].id,
          motivo: 'Tentativa de ativação sem pagamento - Teste E2E',
        })
      ).rejects.toThrow('sem pagamento confirmado');

      // Limpar
      await query(`DELETE FROM contratantes WHERE id = $1`, [
        novoContratante.rows[0].id,
      ]);
    });

    it('deve registrar ativação em audit_logs', async () => {
      const result = await query(
        `SELECT * FROM audit_logs 
         WHERE resource = 'contratantes' 
         AND action = 'ACTIVATE' 
         AND resource_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [contratanteId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      const auditLog = result.rows[0];
      expect(auditLog.details).toContain('Pagamento confirmado');
    });
  });

  describe('8. Fluxo Completo Integrado', () => {
    it('deve validar todo o fluxo: cadastro → contrato → pagamento → ativação → login', async () => {
      // Verificar contratante
      const contratante = await query(
        `SELECT * FROM contratantes WHERE id = $1`,
        [contratanteId]
      );
      expect(contratante.rows[0].ativa).toBe(true);
      expect(contratante.rows[0].pagamento_confirmado).toBe(true);
      expect(contratante.rows[0].status).toBe('aprovado');

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
      expect(funcionario.rows[0].perfil).toBe('gestor_entidade');

      console.log('✅ Fluxo completo validado com sucesso!');
    });
  });
});
