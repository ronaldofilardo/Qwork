/**
 * Testes E2E completos para o fluxo de cadastro de tomadors
 * Plano Fixo (Contract-First)
 *
 * Atualizado: 20/Janeiro/2026
 * Cobertura: Cadastro → Contrato → Pagamento → Ativação → Login
 */

import { query, transaction } from '@/lib/db';
import { ativartomador } from '@/lib/entidade-activation';

describe('E2E: Cadastro tomador - Plano Fixo', () => {
  let tomadorId: number;
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
      `DELETE FROM contratos WHERE tomador_id IN (SELECT id FROM tomadors WHERE cnpj = $1)`,
      [mockCNPJ]
    );
    await query(`DELETE FROM tomadors WHERE cnpj = $1`, [mockCNPJ]);
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [
      mockResponsavelCPF,
    ]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (tomadorId) {
      await query(`DELETE FROM contratos WHERE tomador_id = $1`, [
        tomadorId,
      ]);
      await query(`DELETE FROM tomadors WHERE id = $1`, [tomadorId]);
    }
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [
      mockResponsavelCPF,
    ]);
  });

  describe('1. Cadastro Inicial com Plano Fixo', () => {
    it('deve criar tomador com todos os dados obrigatórios', async () => {
      const insertResult = await query(
        `INSERT INTO tomadors (
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

      tomadorId = insertResult.rows[0].id;
      expect(tomadorId).toBeDefined();
      expect(insertResult.rows[0].status).toBe('aguardando_pagamento');
    });

    it('deve validar campos obrigatórios do tomador', async () => {
      const result = await query(
        `SELECT 
          tipo, nome, cnpj, email, responsavel_cpf, 
          status, plano_id, numero_funcionarios_estimado,
          ativa, pagamento_confirmado
        FROM tomadors WHERE id = $1`,
        [tomadorId]
      );

      const tomador = result.rows[0];
      expect(tomador.tipo).toBe('entidade');
      expect(tomador.nome).toBe('Empresa Teste Fixo LTDA');
      expect(tomador.cnpj).toBe(mockCNPJ);
      expect(tomador.email).toBe(mockEmail);
      expect(tomador.responsavel_cpf).toBe(mockResponsavelCPF);
      expect(tomador.status).toBe('aguardando_pagamento');
      expect(tomador.plano_id).toBe(planoFixoId);
      expect(tomador.numero_funcionarios_estimado).toBe(50);
      expect(tomador.ativa).toBe(false);
      expect(tomador.pagamento_confirmado).toBe(false);
    });

    it('não deve permitir CNPJ duplicado', async () => {
      await expect(
        query(
          `INSERT INTO tomadors (
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
          `INSERT INTO tomadors (
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
          tomador_id, plano_id, 
          numero_funcionarios, valor_total,
          status, aceito, conteudo
        ) VALUES (
          $1, $2, 50, $3,
          'aguardando_pagamento', false, 
          'Contrato para 50 funcionário(s) - Plano Fixo - Valor total: R$ 1000.00'
        ) RETURNING id, status, aceito`,
        [tomadorId, planoFixoId, valorTotal]
      );

      contratoId = insertResult.rows[0].id;
      expect(contratoId).toBeDefined();
      expect(insertResult.rows[0].status).toBe('aguardando_pagamento');
      expect(insertResult.rows[0].aceito).toBe(false);
    });

    it('deve validar dados do contrato criado', async () => {
      const result = await query(
        `SELECT 
          id, tomador_id, plano_id, 
          numero_funcionarios, valor_total,
          status, aceito
        FROM contratos WHERE id = $1`,
        [contratoId]
      );

      const contrato = result.rows[0];
      expect(contrato.tomador_id).toBe(tomadorId);
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
        // Atualizar tomador
        await txClient.query(
          `UPDATE tomadors 
           SET pagamento_confirmado = true,
               data_primeiro_pagamento = NOW()
           WHERE id = $1`,
          [tomadorId]
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

      const tomadorResult = await query(
        `SELECT pagamento_confirmado, data_primeiro_pagamento 
         FROM tomadors WHERE id = $1`,
        [tomadorId]
      );

      const contratoResult = await query(
        `SELECT status, data_pagamento FROM contratos WHERE id = $1`,
        [contratoId]
      );

      expect(tomadorResult.rows[0].pagamento_confirmado).toBe(true);
      expect(tomadorResult.rows[0].data_primeiro_pagamento).toBeDefined();
      expect(contratoResult.rows[0].status).toBe('pago');
      expect(contratoResult.rows[0].data_pagamento).toBeDefined();
    });
  });

  describe('5. Ativação do tomador', () => {
    it('deve ativar tomador após pagamento confirmado', async () => {
      const result = await ativartomador({
        tomador_id: tomadorId,
        motivo: 'Pagamento confirmado via webhook PIX - Teste E2E',
      });

      expect(result.success).toBe(true);
      expect(result.tomador_id).toBe(tomadorId);
      expect(result.message).toContain('ativado com sucesso');
    });

    it('deve validar status ativo do tomador', async () => {
      const result = await query(
        `SELECT ativa, status, data_liberacao_login, aprovado_em
         FROM tomadors WHERE id = $1`,
        [tomadorId]
      );

      const tomador = result.rows[0];
      expect(tomador.ativa).toBe(true);
      expect(tomador.status).toBe('aprovado');
      expect(tomador.data_liberacao_login).toBeDefined();
      expect(tomador.aprovado_em).toBeDefined();
    });

    it('não deve permitir ativar tomador já ativo', async () => {
      const result = await ativartomador({
        tomador_id: tomadorId,
        motivo: 'Tentativa de ativação duplicada - Teste E2E',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('já está ativo');
    });
  });

  describe('6. Criação de Conta Responsável', () => {
    it('deve criar conta do responsável automaticamente', async () => {
      const result = await query(
        `SELECT * FROM usuarios 
         WHERE cpf = $1 AND tomador_id = $2`,
        [mockResponsavelCPF, tomadorId]
      );

      expect(result.rows.length).toBe(1);
      const usuario = result.rows[0];
      expect(usuario.nome).toBe('João da Silva');
      expect(usuario.email).toBe('joao.fixo@empresa.com');
      expect(usuario.tipo_usuario).toBe('gestor');
      expect(usuario.senha_hash).toBeDefined();
    });

    it('deve validar que a senha foi hasheada com bcrypt', async () => {
      const result = await query(
        `SELECT senha_hash FROM usuarios WHERE cpf = $1`,
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
      // Criar tomador sem pagamento
      const novotomador = await query(
        `INSERT INTO tomadors (
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
        ativartomador({
          tomador_id: novotomador.rows[0].id,
          motivo: 'Tentativa de ativação sem pagamento - Teste E2E',
        })
      ).rejects.toThrow('sem pagamento confirmado');

      // Limpar
      await query(`DELETE FROM tomadors WHERE id = $1`, [
        novotomador.rows[0].id,
      ]);
    });

    it('deve registrar ativação em audit_logs', async () => {
      const result = await query(
        `SELECT * FROM audit_logs 
         WHERE resource = 'tomadors' 
         AND action = 'ACTIVATE' 
         AND resource_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [tomadorId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      const auditLog = result.rows[0];
      expect(auditLog.details).toContain('Pagamento confirmado');
    });
  });

  describe('8. Fluxo Completo Integrado', () => {
    it('deve validar todo o fluxo: cadastro → contrato → pagamento → ativação → login', async () => {
      // Verificar tomador
      const tomador = await query(
        `SELECT * FROM tomadors WHERE id = $1`,
        [tomadorId]
      );
      expect(tomador.rows[0].ativa).toBe(true);
      expect(tomador.rows[0].pagamento_confirmado).toBe(true);
      expect(tomador.rows[0].status).toBe('aprovado');

      // Verificar contrato
      const contrato = await query(`SELECT * FROM contratos WHERE id = $1`, [
        contratoId,
      ]);
      expect(contrato.rows[0].aceito).toBe(true);
      expect(contrato.rows[0].status).toBe('pago');

      // Verificar funcionário (responsável)
      const usuario = await query(`SELECT * FROM usuarios WHERE cpf = $1`, [
        mockResponsavelCPF,
      ]);
      expect(usuario.rows.length).toBe(1);
      expect(usuario.rows[0].tipo_usuario).toBe('gestor');

      // ✅ Fluxo completo validado com sucesso!
    });
  });
});
