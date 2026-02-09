/**
 * Testes de Integração: Endpoints Críticos de Cadastro
 *
 * OBJETIVO: Garantir que APIs de cadastro não regressem
 *
 * Endpoints cobertos:
 * - POST /api/admin/cadastro/clinica
 * - POST /api/admin/cadastro/entidade
 * - POST /api/auth/set-password
 * - POST /api/auth/validate-token
 *
 * Atualizado: 04/Fevereiro/2026
 */

import { query } from '@/lib/db';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

jest.setTimeout(30000);

describe('API Integration: Endpoints Críticos de Cadastro', () => {
  const timestamp = Date.now();
  let testCNPJ: string;
  let testCPF: string;
  let testEmail: string;
  let tomadorId: number;

  beforeAll(async () => {
    testCNPJ = `12${timestamp.toString().slice(-10)}00199`;
    testCPF = `${timestamp.toString().slice(-11)}`;
    testEmail = `test-api-${timestamp}@test.com`;

    // Limpar dados anteriores
    await query(`DELETE FROM entidades WHERE cnpj = $1`, [testCNPJ]);
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [testCPF]);
  });

  afterAll(async () => {
    // Cleanup
    if (tomadorId) {
      await query(`DELETE FROM contratos WHERE tomador_id = $1`, [
        tomadorId,
      ]);
      await query(`DELETE FROM entidades WHERE id = $1`, [tomadorId]);
    }
    await query(`DELETE FROM entidades_senhas WHERE cpf = $1`, [testCPF]);
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [testCPF]);
  });

  describe('POST /api/admin/cadastro/clinica', () => {
    it('deve cadastrar nova clinica com dados completos', async () => {
      const payload = {
        tipo: 'clinica',
        nome: `Clinica Teste API ${timestamp}`,
        cnpj: testCNPJ,
        email: testEmail,
        telefone: '11999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234567',
        responsavel_nome: 'Gestor API Test',
        responsavel_cpf: testCPF,
        responsavel_email: testEmail,
        responsavel_celular: '11988888888',
      };

      const response = await fetch(
        'http://localhost:3000/api/admin/cadastro/clinica',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Mock admin session via header
            'x-test-admin': 'true',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.tomador).toBeDefined();
      expect(data.tomador.cnpj).toBe(testCNPJ);
      expect(data.tomador.email).toBe(testEmail);

      tomadorId = data.tomador.id;
    });

    it('deve criar registro em banco com status correto', async () => {
      const result = await query(`SELECT * FROM entidades WHERE cnpj = $1`, [
        testCNPJ,
      ]);

      expect(result.rows.length).toBe(1);
      const tomador = result.rows[0];

      expect(tomador.tipo).toBe('clinica');
      expect(tomador.nome).toContain('Clinica Teste API');
      expect(tomador.status).toBe('aguardando_pagamento');
      expect(tomador.ativa).toBe(false);
      expect(tomador.pagamento_confirmado).toBe(false);
      expect(tomador.responsavel_cpf).toBe(testCPF);
    });

    it('não deve permitir cadastro duplicado com mesmo CNPJ', async () => {
      const payload = {
        tipo: 'clinica',
        nome: 'Clinica Duplicada',
        cnpj: testCNPJ, // Mesmo CNPJ
        email: `outro-${testEmail}`,
        telefone: '11999999999',
        responsavel_nome: 'Outro Gestor',
        responsavel_cpf: `99${testCPF.slice(2)}`,
        responsavel_email: `outro-${testEmail}`,
        responsavel_celular: '11977777777',
        endereco: 'Rua X',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234567',
      };

      const response = await fetch(
        'http://localhost:3000/api/admin/cadastro/clinica',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-admin': 'true',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/já.*cadastrad/i);
    });

    it('deve validar campos obrigatórios', async () => {
      const payloadInvalido = {
        tipo: 'clinica',
        nome: 'Clinica Sem Dados',
        // Faltando cnpj, email, cpf, etc
      };

      const response = await fetch(
        'http://localhost:3000/api/admin/cadastro/clinica',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-admin': 'true',
          },
          body: JSON.stringify(payloadInvalido),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/auth/validate-token', () => {
    let tokenAtivacao: string;

    beforeAll(async () => {
      // Gerar token de ativação
      tokenAtivacao = `test-token-${timestamp}-${Math.random().toString(36)}`;

      await query(
        `INSERT INTO entidades_senhas (cpf, tomador_id, token_ativacao, token_expira_em)
         VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
        [testCPF, tomadorId, tokenAtivacao]
      );
    });

    it('deve validar token ativo e não expirado', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/validate-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenAtivacao }),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.cpf).toBe(testCPF);
      expect(data.email).toBe(testEmail);
    });

    it('deve rejeitar token inválido', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/validate-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'token-invalido-123' }),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('deve rejeitar token expirado', async () => {
      const tokenExpirado = `expired-${timestamp}`;

      await query(
        `INSERT INTO entidades_senhas (cpf, tomador_id, token_ativacao, token_expira_em)
         VALUES ($1, $2, $3, NOW() - INTERVAL '1 hour')`,
        [`99${testCPF.slice(2)}`, tomadorId, tokenExpirado]
      );

      const response = await fetch(
        'http://localhost:3000/api/auth/validate-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenExpirado }),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toMatch(/expirad/i);

      // Cleanup
      await query(`DELETE FROM entidades_senhas WHERE token_ativacao = $1`, [
        tokenExpirado,
      ]);
    });
  });

  describe('POST /api/auth/set-password', () => {
    let tokenAtivacao: string;

    beforeAll(async () => {
      // Gerar novo token para teste de senha
      tokenAtivacao = `pwd-token-${timestamp}-${Math.random().toString(36)}`;

      await query(
        `UPDATE entidades_senhas 
         SET token_ativacao = $1, token_expira_em = NOW() + INTERVAL '24 hours'
         WHERE cpf = $2`,
        [tokenAtivacao, testCPF]
      );
    });

    it('deve definir senha inicial com token válido', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/set-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tokenAtivacao,
            senha: 'Teste@123456',
          }),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toMatch(/senha.*definida/i);
    });

    it('deve salvar hash bcrypt no banco', async () => {
      const result = await query(
        `SELECT senha_hash FROM entidades_senhas WHERE cpf = $1`,
        [testCPF]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].senha_hash).toMatch(/^\$2[aby]\$/); // bcrypt pattern
      expect(result.rows[0].senha_hash).not.toBe('Teste@123456'); // Não deve estar em plain text
    });

    it('deve ativar tomador após definir senha', async () => {
      const result = await query(
        `SELECT ativa, status FROM entidades WHERE id = $1`,
        [tomadorId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].ativa).toBe(true);
      expect(result.rows[0].status).toBe('ativo');
    });

    it('deve validar força de senha', async () => {
      const novoToken = `weak-pwd-${timestamp}`;

      await query(
        `UPDATE entidades_senhas 
         SET token_ativacao = $1, token_expira_em = NOW() + INTERVAL '24 hours'
         WHERE cpf = $2`,
        [novoToken, testCPF]
      );

      const response = await fetch(
        'http://localhost:3000/api/auth/set-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: novoToken,
            senha: '123', // Senha fraca
          }),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/senha.*fraca|senha.*curta/i);
    });

    it('não deve permitir redefinir senha com mesmo token', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/set-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tokenAtivacao, // Token já usado
            senha: 'NovaSenh@789',
          }),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/token.*inválid|token.*expirad/i);
    });
  });

  describe('Fluxo Completo: Cadastro → Token → Senha → Ativação', () => {
    it('deve completar fluxo end-to-end sem erros', async () => {
      const novoCNPJ = `77${Date.now().toString().slice(-10)}00188`;
      const novoCPF = `77${Date.now().toString().slice(-9)}`;
      const novoEmail = `e2e-${Date.now()}@test.com`;

      // 1. Cadastrar
      const cadastroRes = await fetch(
        'http://localhost:3000/api/admin/cadastro/clinica',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-admin': 'true',
          },
          body: JSON.stringify({
            tipo: 'clinica',
            nome: 'Clinica E2E Flow',
            cnpj: novoCNPJ,
            email: novoEmail,
            telefone: '11999999999',
            responsavel_nome: 'E2E Gestor',
            responsavel_cpf: novoCPF,
            responsavel_email: novoEmail,
            responsavel_celular: '11988888888',
            endereco: 'Rua E2E',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234567',
          }),
        }
      );

      expect(cadastroRes.status).toBe(201);
      const cadastroData = await cadastroRes.json();
      const novotomadorId = cadastroData.tomador.id;

      // 2. Gerar token
      const novoToken = `e2e-flow-${Date.now()}`;
      await query(
        `INSERT INTO entidades_senhas (cpf, tomador_id, token_ativacao, token_expira_em)
         VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
        [novoCPF, novotomadorId, novoToken]
      );

      // 3. Validar token
      const tokenRes = await fetch(
        'http://localhost:3000/api/auth/validate-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: novoToken }),
        }
      );

      expect(tokenRes.status).toBe(200);
      const tokenData = await tokenRes.json();
      expect(tokenData.valid).toBe(true);

      // 4. Definir senha
      const senhaRes = await fetch(
        'http://localhost:3000/api/auth/set-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: novoToken,
            senha: 'E2EFlow@123',
          }),
        }
      );

      expect(senhaRes.status).toBe(200);
      const senhaData = await senhaRes.json();
      expect(senhaData.success).toBe(true);

      // 5. Verificar ativação
      const tomadorRes = await query(
        `SELECT ativa, status FROM entidades WHERE id = $1`,
        [novotomadorId]
      );

      expect(tomadorRes.rows[0].ativa).toBe(true);
      expect(tomadorRes.rows[0].status).toBe('ativo');

      // Cleanup
      await query(`DELETE FROM contratos WHERE tomador_id = $1`, [
        novotomadorId,
      ]);
      await query(`DELETE FROM entidades WHERE id = $1`, [
        novotomadorId,
      ]);
      await query(`DELETE FROM entidades_senhas WHERE cpf = $1`, [novoCPF]);
    });
  });
});
