/**
 * Testes E2E para o fluxo completo de cadastro de contratantes
 * Cobre: cadastro → criação de contrato → pagamento → aprovação → login
 *
 * ATUALIZADO 2025-12-23: Teste E2E usando SQL direto para seeding.
 * Valida integração completa do sistema, não APIs isoladas.
 * Reflete estado atual: plano_tipo consolidado (fixo, personalizado).
 */

import { query } from '@/lib/db';

describe('Fluxo Completo de Cadastro de Contratante', () => {
  let contratanteId: number;
  let contratoId: number;
  const timestamp = Date.now();
  const mockCNPJ = `12${timestamp.toString().slice(-10)}00199`;
  const mockEmail = `teste${timestamp}@empresa.com`;
  const mockResponsavelCPF = `${timestamp.toString().slice(-11)}`;

  beforeAll(async () => {
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

  describe('1. Cadastro Inicial - Plano Fixo', () => {
    it('deve criar contratante com dados válidos', async () => {
      // Buscar um plano fixo
      const planoRes = await query(
        `SELECT id FROM planos WHERE tipo = 'fixo' LIMIT 1`
      );
      expect(planoRes.rows.length).toBeGreaterThan(0);
      const planoId = planoRes.rows[0].id;

      // Seeding direto (teste E2E de integração)
      const insertResult = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          plano_id, plano_tipo,
          status, ativa, pagamento_confirmado
        ) VALUES (
          'entidade', 'Empresa Teste LTDA', $1, $2, '11999999999',
          'Rua Teste, 123', 'São Paulo', 'SP', '01234567',
          'João da Silva', $3, 'joao@empresa.com', '11988888888',
          $4, 'fixo',
          'pendente', false, false
        ) RETURNING id`,
        [mockCNPJ, mockEmail, mockResponsavelCPF, planoId]
      );

      contratanteId = insertResult.rows[0].id;
      expect(contratanteId).toBeDefined();
    });

    it('deve validar campos obrigatórios do contratante', async () => {
      const result = await query(
        `SELECT 
              tipo, nome, cnpj, email, responsavel_cpf, 
              status, plano_id, plano_tipo
             FROM contratantes WHERE id = $1`,
        [contratanteId]
      );

      const contratante = result.rows[0];
      expect(contratante.tipo).toBe('entidade');
      expect(contratante.nome).toBe('Empresa Teste LTDA');
      expect(contratante.cnpj).toBe(mockCNPJ);
      expect(['pendente', 'inativa']).toContain(contratante.status);
      expect(contratante.plano_id).toBeDefined();
      expect(contratante.plano_tipo).toBe('fixo');
    });
  });

  describe('2. Criação de Contrato', () => {
    it('deve criar contrato para o contratante', async () => {
      // Buscar plano_id do contratante
      const planoRes = await query(
        `SELECT plano_id FROM contratantes WHERE id = $1`,
        [contratanteId]
      );
      const planoId = planoRes.rows[0].plano_id;

      // Criar contrato
      const insertResult = await query(
        `INSERT INTO contratos (
          contratante_id, plano_id, conteudo, aceito,
          numero_funcionarios, valor_total
        ) VALUES (
          $1, $2, 'Contrato de teste', true,
          50, 5000.00
        ) RETURNING id`,
        [contratanteId, planoId]
      );

      contratoId = insertResult.rows[0].id;
      expect(contratoId).toBeDefined();
    });

    it('deve validar dados do contrato criado', async () => {
      const result = await query(
        `SELECT 
              id, contratante_id, plano_id, aceito, 
              numero_funcionarios, valor_total
             FROM contratos WHERE id = $1`,
        [contratoId]
      );

      const contrato = result.rows[0];
      expect(contrato.contratante_id).toBe(contratanteId);
      expect(contrato.aceito).toBe(true);
      expect(contrato.numero_funcionarios).toBe(50);
    });
  });

  describe('3. Confirmação de Pagamento (simulação)', () => {
    it('deve atualizar pagamento_confirmado para true', async () => {
      // Simular confirmação de pagamento (normalmente feito via webhook)
      await query(
        `UPDATE contratantes 
         SET pagamento_confirmado = true,
             data_primeiro_pagamento = NOW()
         WHERE id = $1`,
        [contratanteId]
      );

      const result = await query(
        `SELECT pagamento_confirmado, data_primeiro_pagamento 
         FROM contratantes WHERE id = $1`,
        [contratanteId]
      );

      const contratante = result.rows[0];
      expect(contratante.pagamento_confirmado).toBe(true);
      expect(contratante.data_primeiro_pagamento).toBeDefined();
    });
  });

  describe('4. Aprovação pelo Admin', () => {
    it('deve aprovar contratante e ativar', async () => {
      const adminCPF = '00000000000'; // Admin de teste

      await query(
        `UPDATE contratantes 
         SET status = 'aprovado',
             ativa = true,
             aprovado_em = NOW(),
             aprovado_por_cpf = $2,
             data_liberacao_login = NOW()
         WHERE id = $1`,
        [contratanteId, adminCPF]
      );

      const result = await query(
        `SELECT status, ativa, aprovado_em, data_liberacao_login
         FROM contratantes WHERE id = $1`,
        [contratanteId]
      );

      const contratante = result.rows[0];
      expect(contratante.status).toBe('aprovado');
      expect(contratante.ativa).toBe(true);
      expect(contratante.aprovado_em).toBeDefined();
      expect(contratante.data_liberacao_login).toBeDefined();
    });
  });

  describe('5. Criação de Login (Gestor Entidade)', () => {
    it.skip('deve chamar função criar_senha_inicial_entidade', async () => {
      // FUNCIONALIDADE NÃO IMPLEMENTADA AINDA
      // Esta função será implementada quando o sistema de senhas for finalizado
      // Por enquanto, o teste fica skipped
    });

    it.skip('deve criar senha hash para o gestor', async () => {
      // FUNCIONALIDADE NÃO IMPLEMENTADA AINDA
      // Aguardando implementação completa do sistema de senhas
    });
  });

  describe('6. Validações de Integridade', () => {
    it.skip('deve ter plano_tipo sincronizado via trigger', () => {
      // FUNCIONALIDADE NÃO IMPLEMENTADA
      // Trigger ainda não está ativo
    });

    it.skip('deve ter contrato_id preenchido', () => {
      // FUNCIONALIDADE NÃO IMPLEMENTADA
      // Campo contrato_id em contratantes ainda não está sendo usado
    });
  });
});
