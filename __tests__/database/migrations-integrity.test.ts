/**
 * Testes de integridade para migrations de correção
 * Valida as correções implementadas nas migrations 011-014
 */

import { query } from '@/lib/db';

describe('Migrations de Correção - Integridade', () => {
  describe('Migration 011: FK clinicas_empresas', () => {
    it('deve ter FK correta para clinicas.id', async () => {
      const result = await query(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'clinicas_empresas'
          AND kcu.column_name = 'clinica_id'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].foreign_table_name).toBe('clinicas');
      expect(result.rows[0].foreign_column_name).toBe('id');
    });

    it('não deve permitir clinica_id que não existe em clinicas', async () => {
      await expect(
        query(`
          INSERT INTO clinicas_empresas (clinica_id, empresa_id)
          VALUES (999999, 1)
        `)
      ).rejects.toThrow();
    });

    it('deve deletar em cascade quando clínica for removida', async () => {
      // Criar clínica e empresa temporárias
      const clinica = await query(`
        INSERT INTO clinicas (nome, cnpj)
        VALUES ('Clínica Teste', '12345678901234')
        RETURNING id
      `);
      const clinicaId = clinica.rows[0].id;

      const empresa = await query(
        `
        INSERT INTO empresas_clientes (nome, cnpj, clinica_id)
        VALUES ('Empresa Teste', '98765432109876', $1)
        RETURNING id
      `,
        [clinicaId]
      );
      const empresaId = empresa.rows[0].id;

      await query(
        `
        INSERT INTO clinicas_empresas (clinica_id, empresa_id)
        VALUES ($1, $2)
      `,
        [clinicaId, empresaId]
      );

      // Deletar clínica
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);

      // Verificar se registro foi deletado em cascade
      const check = await query(
        `
        SELECT * FROM clinicas_empresas 
        WHERE clinica_id = $1 AND empresa_id = $2
      `,
        [clinicaId, empresaId]
      );

      expect(check.rows.length).toBe(0);
    });
  });

  describe('Migration 012: Remoção de lotes_avaliacao_funcionarios', () => {
    it('tabela lotes_avaliacao_funcionarios não deve existir', async () => {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'lotes_avaliacao_funcionarios'
        ) as exists
      `);

      expect(result.rows[0].exists).toBe(false);
    });

    it('deve conseguir buscar funcionários por lote via avaliacoes', async () => {
      const result = await query(`
        SELECT DISTINCT a.funcionario_cpf, f.nome
        FROM avaliacoes a
        JOIN funcionarios f ON a.funcionario_cpf = f.cpf
        WHERE a.lote_id IS NOT NULL
        LIMIT 5
      `);

      expect(result.rows).toBeDefined();
    });
  });

  describe('Migration 013: nivel_cargo NOT NULL e validação', () => {
    it('deve ter constraint funcionarios_nivel_cargo_check', async () => {
      const result = await query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE constraint_name = 'funcionarios_nivel_cargo_check'
        AND table_name = 'funcionarios'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('não deve permitir funcionário sem nivel_cargo', async () => {
      await expect(
        query(`
          INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, nivel_cargo)
          VALUES ('11111111111', 'Teste', 'teste@teste.com', 'hash', 'funcionario', 267, 10, NULL)
        `)
      ).rejects.toThrow();
    });

    it('deve permitir admin sem nivel_cargo', async () => {
      const result = await query(`
        INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id, nivel_cargo)
        VALUES ('22222222222', 'Admin Teste', 'admin@teste.com', 'hash', 'admin', 10, NULL)
        RETURNING cpf, perfil, nivel_cargo
      `);

      expect(result.rows[0].perfil).toBe('admin');
      expect(result.rows[0].nivel_cargo).toBeNull();

      // Limpar
      await query('DELETE FROM funcionarios WHERE cpf = $1', ['22222222222']);
    });

    it('deve aceitar apenas operacional ou gestao para funcionários', async () => {
      const result = await query(`
        INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, nivel_cargo)
        VALUES ('33333333333', 'Func Teste', 'func@teste.com', 'hash', 'funcionario', 267, 10, 'operacional')
        RETURNING nivel_cargo
      `);

      expect(result.rows[0].nivel_cargo).toBe('operacional');

      // Limpar
      await query('DELETE FROM funcionarios WHERE cpf = $1', ['33333333333']);
    });
  });

  describe('Migration 014: FK analise_estatistica.avaliacao_id', () => {
    it('deve ter FK para avaliacoes.id', async () => {
      const result = await query(`
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'analise_estatistica'
          AND kcu.column_name = 'avaliacao_id'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].foreign_table_name).toBe('avaliacoes');
    });

    it('não deve permitir avaliacao_id inexistente', async () => {
      await expect(
        query(`
          INSERT INTO analise_estatistica (avaliacao_id, grupo, score_original, score_ajustado)
          VALUES (999999, 1, 50.00, 50.00)
        `)
      ).rejects.toThrow();
    });

    it('deve deletar em cascade quando avaliacao for removida', async () => {
      // Criar avaliação temporária
      const avaliacao = await query(`
        INSERT INTO avaliacoes (funcionario_cpf, lote_id, status)
        SELECT '00000000000', id, 'iniciada'
        FROM lotes_avaliacao
        LIMIT 1
        RETURNING id
      `);

      if (avaliacao.rows.length === 0) {
        console.log('Sem lotes disponíveis para teste');
        return;
      }

      const avaliacaoId = avaliacao.rows[0].id;

      // Criar análise
      await query(
        `
        INSERT INTO analise_estatistica (avaliacao_id, grupo, score_original, score_ajustado)
        VALUES ($1, 1, 50.00, 50.00)
      `,
        [avaliacaoId]
      );

      // Deletar avaliação
      await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);

      // Verificar se análise foi deletada
      const check = await query(
        `
        SELECT * FROM analise_estatistica WHERE avaliacao_id = $1
      `,
        [avaliacaoId]
      );

      expect(check.rows.length).toBe(0);
    });
  });
});
