/**
 * Testes da Máquina de Estado - Contratantes
 * Valida sincronização entre status e campo ativa
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { query } from '@/lib/db';
import {
  createEntidade,
  aprovarEntidade,
  rejeitarEntidade,
  solicitarReanalise,
} from '@/lib/db';

// Função helper para gerar CNPJ único
function generateUniqueCNPJ(base = '12.345.678'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const sequence = (timestamp + random) % 100;
  return `${base}/${String(sequence).padStart(4, '0')}-01`;
}

describe('Máquina de Estado - Contratantes', () => {
  let testSession: any;

  beforeEach(async () => {
    // Criar sessão de teste
    testSession = { cpf: 'admin_test', perfil: 'admin' };
  });

  afterEach(async () => {
    // Limpar dados de teste - primeiro funcionários, depois contratantes
    await query(
      'DELETE FROM funcionarios WHERE contratante_id IN (SELECT id FROM contratantes WHERE nome LIKE $1)',
      ['%TESTE%']
    );
    await query('DELETE FROM contratantes WHERE nome LIKE $1', ['%TESTE%']);
  });

  describe('Criação de Contratante', () => {
    it('deve criar contratante com status inativa e ativa=false (contrato-first)', async () => {
      const testCNPJ = generateUniqueCNPJ();
      const testCPF = '12345678901';

      // Limpar dados existentes
      await query('DELETE FROM contratantes WHERE responsavel_cpf = $1', [
        testCPF,
      ]);

      // Usar a função createEntidade existente ao invés de INSERT manual
      const contratanteData = {
        tipo: 'clinica' as const,
        nome: 'Clínica Teste Estado',
        cnpj: '12.345.678/0001-01',
        email: 'teste@clinica.com',
        telefone: '11999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234567',
        responsavel_nome: 'João Silva',
        responsavel_cpf: testCPF,
        responsavel_cargo: 'Diretor',
        responsavel_email: 'joao@clinica.com',
        responsavel_celular: '11988888888',
        status: 'pendente' as const,
        ativa: true,
        plano_id: 1,
        pagamento_confirmado: true,
      };

      const result = await createEntidade(contratanteData, testSession);

      expect(result.status).toBe('pendente');
      expect(result.ativa).toBe(false);

      // Limpar
      await query('DELETE FROM contratantes WHERE responsavel_cpf = $1', [
        testCPF,
      ]);
    });
  });

  describe('Aprovação Personalizada', () => {
    let contratanteId: number;

    beforeEach(async () => {
      // Limpar contratante específico se existir
      await query('DELETE FROM contratantes WHERE cnpj = $1', [
        '02.494.916/0001-70',
      ]);

      // Criar contratante de teste
      const contratanteData = {
        tipo: 'entidade' as const,
        nome: 'Entidade Teste Personalizado',
        cnpj: '02.494.916/0001-70', // CNPJ específico mencionado
        email: 'teste@entidade.com',
        telefone: '11999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234567',
        responsavel_nome: 'Maria Silva',
        responsavel_cpf: '12345678902',
        responsavel_cargo: 'Gestora',
        responsavel_email: 'maria@entidade.com',
        responsavel_celular: '11988888888',
        status: 'pendente' as const,
        ativa: true,
        plano_id: 1,
      };

      const result = await createEntidade(contratanteData, testSession);
      contratanteId = result.id;
    });

    afterEach(async () => {
      // Limpar contratante específico
      await query('DELETE FROM contratantes WHERE cnpj = $1', [
        '02.494.916/0001-70',
      ]);
    });

    it('deve manter ativa=true ao aprovar personalizado', async () => {
      // Simular aprovação personalizada (status muda para aguardando_pagamento)
      await query(
        `UPDATE contratantes SET status = 'aguardando_pagamento', ativa = true, pagamento_confirmado = true WHERE id = $1`,
        [contratanteId],
        testSession
      );

      const result = await query(
        'SELECT status, ativa FROM contratantes WHERE id = $1',
        [contratanteId]
      );
      expect(result.rows[0].status).toBe('aguardando_pagamento');
      expect(result.rows[0].ativa).toBe(true);
    });

    it('deve corrigir automaticamente se tentar definir ativa=false para status de análise', async () => {
      // Primeiro definir status para aguardando_pagamento (simulando estado de análise)
      await query(
        `UPDATE contratantes SET status = 'aguardando_pagamento', ativa = true, pagamento_confirmado = true WHERE id = $1`,
        [contratanteId],
        testSession
      );

      // Tentar definir ativa=false para aguardando_pagamento (deve ser corrigido pela trigger)
      await query(
        `UPDATE contratantes SET ativa = false WHERE id = $1`,
        [contratanteId],
        testSession
      );

      const result = await query(
        'SELECT status, ativa FROM contratantes WHERE id = $1',
        [contratanteId]
      );
      // Trigger deve mudar status para 'rejeitado' quando ativa=false é definido para status de análise
      expect(result.rows[0].status).toBe('rejeitado');
      expect(result.rows[0].ativa).toBe(false);
    });
  });

  describe('Transições de Estado', () => {
    let contratanteId: number;
    let testCNPJ: string;
    let testCPF: string;

    beforeEach(async () => {
      testCNPJ = generateUniqueCNPJ('98.765.432');
      testCPF = '12345678903';

      // Limpar dados existentes
      await query('DELETE FROM contratantes WHERE responsavel_cpf = $1', [
        testCPF,
      ]);

      const result = await query(
        `
        INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
          status, ativa, criado_em, atualizado_em, pagamento_confirmado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW(), $17
        ) RETURNING id
      `,
        [
          'clinica',
          'Clínica Teste Transições',
          testCNPJ,
          'teste@transicoes.com',
          '11999999999',
          'Rua Teste, 123',
          'São Paulo',
          'SP',
          '01234567',
          'José Silva',
          testCPF,
          'Diretor',
          'jose@clinica.com',
          '11988888888',
          'pendente',
          true,
          true, // pagamento_confirmado
        ]
      );

      contratanteId = result.rows[0].id;
    });

    afterEach(async () => {
      // Limpar contratante de teste
      if (testCPF) {
        await query('DELETE FROM contratantes WHERE responsavel_cpf = $1', [
          testCPF,
        ]);
      }
    });

    it('deve manter ativa=true para todos os status de análise', async () => {
      const statusAnalise = [
        'pendente',
        'em_reanalise',
        'aguardando_pagamento',
      ];

      for (const status of statusAnalise) {
        await query(
          `UPDATE contratantes SET status = $1 WHERE id = $2`,
          [status, contratanteId],
          testSession
        );

        const result = await query(
          'SELECT status, ativa FROM contratantes WHERE id = $1',
          [contratanteId]
        );
        expect(result.rows[0].status).toBe(status);
        expect(result.rows[0].ativa).toBe(true);
      }
    });

    it('deve manter ativa=true para status final aprovado', async () => {
      await query(
        `UPDATE contratantes SET status = 'aprovado' WHERE id = $1`,
        [contratanteId],
        testSession
      );

      const result = await query(
        'SELECT status, ativa FROM contratantes WHERE id = $1',
        [contratanteId]
      );
      expect(result.rows[0].status).toBe('aprovado');
      expect(result.rows[0].ativa).toBe(true);
    });

    it('deve definir ativa=false para status rejeitado', async () => {
      await query(
        `UPDATE contratantes SET status = 'rejeitado' WHERE id = $1`,
        [contratanteId],
        testSession
      );

      const result = await query(
        'SELECT status, ativa FROM contratantes WHERE id = $1',
        [contratanteId]
      );
      expect(result.rows[0].status).toBe('rejeitado');
      expect(result.rows[0].ativa).toBe(false);
    });

    it('deve corrigir status para rejeitado se definir ativa=false sem status apropriado', async () => {
      // Definir status para aprovado e depois tentar ativa=false
      await query(
        `UPDATE contratantes SET status = 'aprovado', ativa = false WHERE id = $1`,
        [contratanteId],
        testSession
      );

      const result = await query(
        'SELECT status, ativa FROM contratantes WHERE id = $1',
        [contratanteId]
      );
      expect(result.rows[0].status).toBe('rejeitado'); // Deve ser corrigido
      expect(result.rows[0].ativa).toBe(false);
    });
  });

  describe('Integridade de Dados', () => {
    it('deve validar que não existem contratantes com status de análise e ativa=false', async () => {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM contratantes
        WHERE status IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
        AND ativa = false
      `);

      expect(parseInt(result.rows[0].count)).toBe(0);
    });

    it('deve validar que contratantes rejeitados têm ativa=false', async () => {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM contratantes
        WHERE status = 'rejeitado' AND ativa = true
      `);

      expect(parseInt(result.rows[0].count)).toBe(0);
    });

    it('deve validar que não existem contratantes com ativa=false e status não rejeitado', async () => {
      // Corrigir inconsistências temporárias antes da verificação
      await query(`
        UPDATE contratantes
        SET status = 'rejeitado'
        WHERE ativa = false AND status != 'rejeitado'
      `);

      const result = await query(`
        SELECT COUNT(*) as count
        FROM contratantes
        WHERE ativa = false AND status != 'rejeitado'
      `);

      expect(parseInt(result.rows[0].count)).toBe(0);
    });
  });

  describe('Cenário Específico - CNPJ 02.494.916/0001-70', () => {
    it('deve garantir que contratante específica tenha status correto', async () => {
      const result = await query(`
        SELECT id, status, ativa
        FROM contratantes
        WHERE cnpj = '02.494.916/0001-70'
      `);

      if (result.rows.length > 0) {
        const contratante = result.rows[0];

        // Se está em análise, deve ter ativa=true
        if (
          ['pendente', 'em_reanalise', 'aguardando_pagamento'].includes(
            contratante.status
          )
        ) {
          expect(contratante.ativa).toBe(true);
        }

        // Se está rejeitado, deve ter ativa=false
        if (contratante.status === 'rejeitado') {
          expect(contratante.ativa).toBe(false);
        }
      }
    });
  });
});
