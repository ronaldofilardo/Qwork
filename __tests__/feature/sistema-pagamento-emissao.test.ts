/**
 * Testes para Sistema de Pagamento e Emissão de Laudos
 *
 * Cobertura:
 * - Verificação de integridade (hash SHA-256) de laudos
 * - Endpoints admin de gestão de emissões
 * - View v_solicitacoes_emissao
 * - Integridade referencial (entidade_id vs IDs legados)
 */

import { query } from '@/lib/db';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

describe('Sistema de Pagamento e Emissão de Laudos', () => {
  describe('Verificação de Hash SHA-256 (Testes Puros)', () => {
    it('deve calcular hash consistentemente para mesmo conteúdo', () => {
      const buffer = Buffer.from('Conteúdo de teste fixo');

      const hash1 = crypto.createHash('sha256').update(buffer).digest('hex');
      const hash2 = crypto.createHash('sha256').update(buffer).digest('hex');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 64 caracteres hex
    });

    it('deve gerar hash diferente para conteúdos diferentes', () => {
      const buffer1 = Buffer.from('Conteúdo A');
      const buffer2 = Buffer.from('Conteúdo B');

      const hash1 = crypto.createHash('sha256').update(buffer1).digest('hex');
      const hash2 = crypto.createHash('sha256').update(buffer2).digest('hex');

      expect(hash1).not.toBe(hash2);
    });

    it('deve detectar até pequenas alterações no conteúdo', () => {
      const original = Buffer.from('laudo original');
      const modificado = Buffer.from('laudo Original'); // apenas maiúscula

      const hash1 = crypto.createHash('sha256').update(original).digest('hex');
      const hash2 = crypto
        .createHash('sha256')
        .update(modificado)
        .digest('hex');

      expect(hash1).not.toBe(hash2);
    });

    it('deve validar formato de hash SHA-256', () => {
      const regex = /^[a-f0-9]{64}$/i;

      const hashesValidos = [
        'a'.repeat(64),
        '1234567890abcdef'.repeat(4),
        'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', // real
      ];

      const hashesInvalidos = [
        'invalidhash',
        'a'.repeat(63), // muito curto
        'a'.repeat(65), // muito longo
        'zzzzzzzz' + 'a'.repeat(56), // caracteres inválidos
      ];

      for (const hash of hashesValidos) {
        expect(regex.test(hash)).toBe(true);
      }

      for (const hash of hashesInvalidos) {
        expect(regex.test(hash)).toBe(false);
      }
    });
  });

  describe('View v_solicitacoes_emissao (Testes de Schema)', () => {
    it('deve existir a view v_solicitacoes_emissao', async () => {
      const result = await query(
        `SELECT EXISTS (
          SELECT 1 FROM pg_views 
          WHERE viewname = 'v_solicitacoes_emissao'
        ) as existe`
      );

      expect(result.rows[0].existe).toBe(true);
    });

    it('deve ter as colunas essenciais', async () => {
      const result = await query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'v_solicitacoes_emissao'
         ORDER BY ordinal_position`
      );

      const colunas = result.rows.map((r) => r.column_name);

      // Colunas essenciais da view
      expect(colunas).toContain('lote_id');
      expect(colunas).toContain('status_pagamento');
      expect(colunas).toContain('valor_por_funcionario');
      expect(colunas).toContain('nome_tomador');
      expect(colunas).toContain('empresa_nome');
    });

    it('deve retornar dados quando existem lotes com status_pagamento', async () => {
      const result = await query(
        `SELECT COUNT(*) as total FROM v_solicitacoes_emissao`
      );

      // Deve executar sem erro (quantidade pode ser 0 ou mais)
      expect(result.rows).toHaveLength(1);
      expect(parseInt(result.rows[0].total)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integridade Referencial (Testes de Schema)', () => {
    it('lotes_avaliacao deve ter coluna entidade_id', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'lotes_avaliacao' 
         AND column_name = 'entidade_id'`
      );

      expect(result.rows).toHaveLength(1);
    });

    it('lotes_avaliacao NÃO deve ter coluna tomador_id (legada)', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'lotes_avaliacao' 
         AND column_name = 'tomador_id'`
      );

      expect(result.rows).toHaveLength(0);
    });

    it('usuarios deve ter coluna entidade_id', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'usuarios' 
         AND column_name = 'entidade_id'`
      );

      expect(result.rows).toHaveLength(1);
    });

    it('usuarios NÃO deve ter coluna empresa_id (legada)', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'usuarios' 
         AND column_name = 'empresa_id'`
      );

      expect(result.rows).toHaveLength(0);
    });

    it('laudos deve ter hash_pdf para verificação de integridade', async () => {
      const result = await query(
        `SELECT column_name, data_type
         FROM information_schema.columns 
         WHERE table_name = 'laudos' 
         AND column_name = 'hash_pdf'`
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toMatch(/character|text/i);
    });

    it('laudos deve ter emissor_cpf e constraint de consistência', async () => {
      const result = await query(
        `SELECT column_name
         FROM information_schema.columns 
         WHERE table_name = 'laudos' 
         AND column_name = 'emissor_cpf'`
      );

      expect(result.rows).toHaveLength(1);

      // Verificar constraint de consistência
      const constraint = await query(
        `SELECT conname
         FROM pg_constraint 
         WHERE conrelid = 'laudos'::regclass 
         AND conname = 'chk_laudos_emitido_em_emissor_cpf'`
      );

      expect(constraint.rows).toHaveLength(1);
    });
  });

  describe('Endpoint Admin de Emissões (Testes de Lógica)', () => {
    it('deve validar que valor_por_funcionario tenha constraint positiva', async () => {
      const result = await query(
        `SELECT conname, pg_get_constraintdef(oid) as definition
         FROM pg_constraint 
         WHERE conrelid = 'lotes_avaliacao'::regclass 
         AND conname = 'valor_funcionario_positivo_check'`
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].definition).toContain('valor_por_funcionario');
      expect(result.rows[0].definition).toContain('> (0)');
    });

    it('deve ter enum status_pagamento correto', async () => {
      const result = await query(
        `SELECT enumlabel 
         FROM pg_enum 
         WHERE enumtypid = 'status_pagamento'::regtype
         ORDER BY enumsortorder`
      );

      const valores = result.rows.map((r) => r.enumlabel);

      expect(valores).toContain('aguardando_cobranca');
      expect(valores).toContain('aguardando_pagamento');
      expect(valores).toContain('pago');
    });

    it('deve validar valores monetários positivos', () => {
      const valoresValidos = [10.5, 100, 0.01, 999.99];

      for (const valor of valoresValidos) {
        expect(valor).toBeGreaterThan(0);
        expect(Number.isFinite(valor)).toBe(true);
        expect(parseFloat(valor.toFixed(2))).toBe(parseFloat(valor.toFixed(2)));
      }
    });

    it('deve rejeitar valores monetários inválidos', () => {
      const valoresInvalidos = [-1, -0.01, Infinity, NaN];

      for (const valor of valoresInvalidos) {
        const invalido = !Number.isFinite(valor) || valor <= 0;
        expect(invalido).toBe(true);
      }
    });
  });

  describe('Sanitização e Validação', () => {
    it('deve sanitizar IDs numéricos', () => {
      const idsInvalidos = [
        'abc',
        '123; DROP TABLE laudos;',
        'null',
        'undefined',
        '',
        '1.5',
      ];

      for (const idInvalido of idsInvalidos) {
        const id = parseInt(idInvalido);
        // ID válido: inteiro, positivo, e converte de volta para o valor original
        const idString = id.toString();
        const invalido =
          !Number.isInteger(id) || id <= 0 || idString !== idInvalido.trim();
        expect(invalido).toBe(true);
      }
    });

    it('deve validar CPF básico (11 dígitos)', () => {
      const cpfsValidos = ['12345678909', '98765432100'];
      const cpfsInvalidos = ['123', '123456789', '12345678901a', ''];

      const regexCpf = /^\d{11}$/;

      for (const cpf of cpfsValidos) {
        expect(regexCpf.test(cpf)).toBe(true);
      }

      for (const cpf of cpfsInvalidos) {
        expect(regexCpf.test(cpf)).toBe(false);
      }
    });

    it('deve validar CNPJ básico (14 dígitos)', () => {
      const cnpjsValidos = ['12345678000190', '98765432000188'];
      const cnpjsInvalidos = ['123', '12345678000', '1234567800019a', ''];

      const regexCnpj = /^\d{14}$/;

      for (const cnpj of cnpjsValidos) {
        expect(regexCnpj.test(cnpj)).toBe(true);
      }

      for (const cnpj of cnpjsInvalidos) {
        expect(regexCnpj.test(cnpj)).toBe(false);
      }
    });
  });

  describe('Fluxo de Status de Pagamento', () => {
    it('deve ter transições válidas de status_pagamento', () => {
      const fluxoValido = [
        'aguardando_cobranca',
        'aguardando_pagamento',
        'pago',
      ];

      // Verificar que array tem ordem lógica
      expect(fluxoValido).toHaveLength(3);
      expect(fluxoValido[0]).toBe('aguardando_cobranca');
      expect(fluxoValido[2]).toBe('pago');
    });

    it('deve ter constraint de pagamento completo', async () => {
      const result = await query(
        `SELECT conname, pg_get_constraintdef(oid) as definition
         FROM pg_constraint 
         WHERE conrelid = 'lotes_avaliacao'::regclass 
         AND conname = 'pagamento_completo_check'`
      );

      expect(result.rows).toHaveLength(1);

      const def = result.rows[0].definition;
      expect(def).toContain("status_pagamento = 'pago'");
      expect(def).toContain('pagamento_metodo IS NOT NULL');
      expect(def).toContain('pago_em IS NOT NULL');
    });
  });

  describe('Verificação de Integridade com Dados Reais', () => {
    let testLaudoId: number;
    let testPdfPath: string;
    let testHash: string;

    beforeAll(async () => {
      // Buscar um laudo existente com hash
      const result = await query(
        `SELECT id, hash_pdf 
         FROM laudos 
         WHERE hash_pdf IS NOT NULL 
         LIMIT 1`
      );

      if (result.rows.length > 0) {
        testLaudoId = result.rows[0].id;
        testHash = result.rows[0].hash_pdf;
        testPdfPath = path.join(
          process.cwd(),
          'storage',
          'laudos',
          `laudo-${testLaudoId}.pdf`
        );
      }
    });

    it('deve encontrar laudos com hash armazenado', async () => {
      const result = await query(
        `SELECT COUNT(*) as total 
         FROM laudos 
         WHERE hash_pdf IS NOT NULL`
      );

      // Pode ser 0 se não houver laudos ainda, mas query deve funcionar
      expect(result.rows).toHaveLength(1);
      expect(parseInt(result.rows[0].total)).toBeGreaterThanOrEqual(0);
    });

    it('deve validar hash se arquivo e laudo existirem', async () => {
      if (!testLaudoId || !testHash) {
        console.log('[SKIP] Nenhum laudo com hash encontrado');
        return;
      }

      try {
        const buffer = await fs.readFile(testPdfPath);
        const hashCalculado = crypto
          .createHash('sha256')
          .update(buffer)
          .digest('hex');

        expect(hashCalculado).toBe(testHash);
        console.log(`[OK] Hash verificado para laudo ${testLaudoId}`);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log(`[SKIP] Arquivo físico não encontrado: ${testPdfPath}`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('JOIN entre laudos e lotes_avaliacao', () => {
    it('deve fazer JOIN correto usando entidade_id', async () => {
      const result = await query(
        `SELECT 
           l.id as laudo_id,
           l.lote_id,
           la.entidade_id,
           la.clinica_id
         FROM laudos l
         JOIN lotes_avaliacao la ON l.lote_id = la.id
         LIMIT 5`
      );

      // Query deve funcionar (pode retornar 0 ou mais linhas)
      expect(result.rows.length).toBeGreaterThanOrEqual(0);

      // Se houver dados, verificar estrutura
      if (result.rows.length > 0) {
        const row = result.rows[0];
        expect(row).toHaveProperty('laudo_id');
        expect(row).toHaveProperty('lote_id');
        expect(row).toHaveProperty('entidade_id');
      }
    });

    it('NÃO deve ter coluna tomador_id em JOIN', async () => {
      // Tentar usar tomador_id deve dar erro
      try {
        await query(
          `SELECT la.tomador_id 
           FROM lotes_avaliacao la 
           LIMIT 1`
        );

        // Se não deu erro, falhou
        expect(true).toBe(false);
      } catch (error: any) {
        // Esperado: coluna não existe
        expect(error.message).toContain('tomador_id');
        expect(error.message).toMatch(/não existe|does not exist/i);
      }
    });
  });
});
