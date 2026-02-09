/**
 * Testes de Integração: Isolamento RLS entre RH e Gestores de Entidade
 *
 * Valida que:
 * - RH só pode gerir funcionários de SUA clínica
 * - Gestor de Entidade só pode gerir funcionários de SUA entidade
 * - Não há vazamento de dados entre clínicas e entidades
 */

import { query } from '@/lib/db';
import { Pool } from 'pg';

// Helper: executa um bloco com SET ROLE + SET LOCAL session vars (RLS) numa conexão dedicada
async function runAsRole(
  role: string,
  sessionVars: Partial<Record<string, any>>,
  fn: (client: any) => Promise<any>
) {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET ROLE ${role}`);
    if (sessionVars.cpf)
      await client.query(
        "SELECT set_config('app.current_user_cpf', $1, true)",
        [sessionVars.cpf]
      );
    if (sessionVars.perfil)
      await client.query(
        "SELECT set_config('app.current_user_perfil', $1, true)",
        [sessionVars.perfil]
      );
    if (sessionVars.clinica_id !== undefined)
      await client.query(
        "SELECT set_config('app.current_user_clinica_id', $1, true)",
        [String(sessionVars.clinica_id)]
      );
    if (sessionVars.entidade_id !== undefined)
      await client.query(
        "SELECT set_config('app.current_user_entidade_id', $1, true)",
        [String(sessionVars.entidade_id)]
      );
    const res = await fn(client);
    await client.query('ROLLBACK');
    return res;
  } finally {
    client.release();
    await pool.end();
  }
}

describe('Isolamento RLS: RH e Gestores de Entidade', () => {
  let clinicaId1: number;
  let clinicaId2: number;
  let entidadeId1: number;
  let entidadeId2: number;
  let rhCpf1: string;
  let rhCpf2: string;
  let gestorCpf1: string;
  let gestorCpf2: string;
  let funcClinicaCpf1: string;
  let funcClinicaCpf2: string;
  let funcEntidadeCpf1: string;
  let funcEntidadeCpf2: string;

  beforeAll(async () => {
    // Limpar dados residuais primeiro
    await query(`DELETE FROM funcionarios WHERE cpf LIKE '999%'`);
    await query(
      `DELETE FROM entidades WHERE cnpj IN ('11111111000111', '22222222000222', '33333333000133', '44444444000144')`
    );
    await query(
      `DELETE FROM clinicas WHERE cnpj IN ('11111111000111', '22222222000222')`
    );

    // Garantir roles de teste para validação RLS (usadas com SET ROLE em sessões dedicadas)
    await query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_rh') THEN
        CREATE ROLE test_rh;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_gestor') THEN
        CREATE ROLE test_gestor;
      END IF;
    END$$;`);

    // Conceder privilégios básicos (SELECT/INSERT/UPDATE/DELETE) para roles de teste
    await query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON funcionarios TO test_rh;`
    );
    await query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON funcionarios TO test_gestor;`
    );

    // Conceder SELECT em tabelas relacionadas que podem ser acessadas por funções/triggers durante o SELECT
    await query(`GRANT SELECT ON empresas_clientes TO test_rh;`);
    await query(`GRANT SELECT ON empresas_clientes TO test_gestor;`);

    // Criar 2 clínicas
    const clinica1 = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1, $2, $3) RETURNING id`,
      ['Clínica Teste 1', '11111111000111', true]
    );
    clinicaId1 = clinica1.rows[0].id;

    const clinica2 = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1, $2, $3) RETURNING id`,
      ['Clínica Teste 2', '22222222000222', true]
    );
    clinicaId2 = clinica2.rows[0].id;

    // Criar 2 entidades independentes
    const tomador1 = await query(
      `INSERT INTO entidades (nome, tipo, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, pagamento_confirmado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [
        'Entidade Teste 1',
        'entidade',
        'Gestor Entidade 1',
        '33333333301',
        'responsavel1@teste.com',
        '11999999999',
        '33333333000133',
        'gestor1@teste.com',
        '1111111111',
        'Rua Teste 1',
        'São Paulo',
        'SP',
        '01000000',
        true,
        true,
      ]
    );
    entidadeId1 = tomador1.rows[0].id;

    const tomador2 = await query(
      `INSERT INTO entidades (nome, tipo, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, pagamento_confirmado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [
        'Entidade Teste 2',
        'entidade',
        'Gestor Entidade 2',
        '44444444402',
        'responsavel2@teste.com',
        '11988888888',
        '44444444000144',
        'gestor2@teste.com',
        '2222222222',
        'Rua Teste 2',
        'São Paulo',
        'SP',
        '02000000',
        true,
        true,
      ]
    );
    entidadeId2 = tomador2.rows[0].id;

    // Criar RHs (um para cada clínica)
    rhCpf1 = '11111111101';
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, ativo, nivel_cargo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [rhCpf1, 'RH Clínica 1', 'rh', '$2a$10$test', clinicaId1, true, 'gestao']
    );

    rhCpf2 = '22222222202';
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, ativo, nivel_cargo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [rhCpf2, 'RH Clínica 2', 'rh', '$2a$10$test', clinicaId2, true, 'gestao']
    );

    // Criar Gestores de Entidade (um para cada entidade)
    gestorCpf1 = '33333333301';
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, entidade_id, ativo, nivel_cargo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        gestorCpf1,
        'Gestor Entidade 1',
        'gestor',
        '$2a$10$test',
        entidadeId1,
        true,
        'gestao',
      ]
    );

    gestorCpf2 = '44444444402';
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, entidade_id, ativo, nivel_cargo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        gestorCpf2,
        'Gestor Entidade 2',
        'gestor',
        '$2a$10$test',
        entidadeId2,
        true,
        'gestao',
      ]
    );

    // Criar funcionários de clínica
    funcClinicaCpf1 = '55555555501';
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, ativo, nivel_cargo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        funcClinicaCpf1,
        'Funcionário Clínica 1',
        'funcionario',
        '$2a$10$test',
        clinicaId1,
        true,
        'operacional',
      ]
    );

    funcClinicaCpf2 = '66666666602';
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, ativo, nivel_cargo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        funcClinicaCpf2,
        'Funcionário Clínica 2',
        'funcionario',
        '$2a$10$test',
        clinicaId2,
        true,
        'operacional',
      ]
    );

    // Criar funcionários de entidade
    funcEntidadeCpf1 = '77777777701';
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, entidade_id, ativo, nivel_cargo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        funcEntidadeCpf1,
        'Funcionário Entidade 1',
        'funcionario',
        '$2a$10$test',
        entidadeId1,
        true,
        'operacional',
      ]
    );

    funcEntidadeCpf2 = '88888888802';
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, entidade_id, ativo, nivel_cargo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        funcEntidadeCpf2,
        'Funcionário Entidade 2',
        'funcionario',
        '$2a$10$test',
        entidadeId2,
        true,
        'operacional',
      ]
    );
  });

  afterAll(async () => {
    // Cleanup
    await query(
      `DELETE FROM funcionarios WHERE cpf IN ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        rhCpf1,
        rhCpf2,
        gestorCpf1,
        gestorCpf2,
        funcClinicaCpf1,
        funcClinicaCpf2,
        funcEntidadeCpf1,
        funcEntidadeCpf2,
      ]
    );
    await query(`DELETE FROM entidades WHERE id IN ($1, $2)`, [
      entidadeId1,
      entidadeId2,
    ]);
    await query(`DELETE FROM clinicas WHERE id IN ($1, $2)`, [
      clinicaId1,
      clinicaId2,
    ]);
  });

  describe('RH: Isolamento por clínica', () => {
    it('RH1 deve ver funcionários da clínica 1', async () => {
      const result = await runAsRole(
        'test_rh',
        { cpf: rhCpf1, perfil: 'rh', clinica_id: clinicaId1 },
        async (client) => {
          return await client.query(
            `SELECT cpf, nome FROM funcionarios WHERE perfil = 'funcionario' AND clinica_id = $1`,
            [clinicaId1]
          );
        }
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].cpf).toBe(funcClinicaCpf1);
    });

    it('RH1 NÃO deve ver funcionários da clínica 2', async () => {
      const result = await runAsRole(
        'test_rh',
        { cpf: rhCpf1, perfil: 'rh', clinica_id: clinicaId1 },
        async (client) => {
          return await client.query(
            `SELECT cpf, nome FROM funcionarios WHERE perfil = 'funcionario' AND clinica_id = $1`,
            [clinicaId2]
          );
        }
      );

      expect(result.rows.length).toBe(0);
    });

    it('RH1 NÃO deve ver funcionários de entidades', async () => {
      const result = await runAsRole(
        'test_rh',
        { cpf: rhCpf1, perfil: 'rh', clinica_id: clinicaId1 },
        async (client) => {
          return await client.query(
            `SELECT cpf, nome FROM funcionarios WHERE perfil = 'funcionario' AND entidade_id IS NOT NULL`
          );
        }
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Gestor de Entidade: Isolamento por tomador', () => {
    it('Gestor1 deve ver funcionários da entidade 1', async () => {
      const result = await runAsRole(
        'test_gestor',
        {
          cpf: gestorCpf1,
          perfil: 'gestor',
          entidade_id: entidadeId1,
        },
        async (client) => {
          return await client.query(
            `SELECT cpf, nome FROM funcionarios WHERE perfil = 'funcionario' AND entidade_id = $1`,
            [entidadeId1]
          );
        }
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].cpf).toBe(funcEntidadeCpf1);
    });

    it('Gestor1 NÃO deve ver funcionários da entidade 2', async () => {
      const result = await runAsRole(
        'test_gestor',
        {
          cpf: gestorCpf1,
          perfil: 'gestor',
          entidade_id: entidadeId1,
        },
        async (client) => {
          return await client.query(
            `SELECT cpf, nome FROM funcionarios WHERE perfil = 'funcionario' AND entidade_id = $1`,
            [entidadeId2]
          );
        }
      );

      expect(result.rows.length).toBe(0);
    });

    it('Gestor1 NÃO deve ver funcionários de clínicas', async () => {
      const result = await runAsRole(
        'test_gestor',
        {
          cpf: gestorCpf1,
          perfil: 'gestor',
          entidade_id: entidadeId1,
        },
        async (client) => {
          return await client.query(
            `SELECT cpf, nome FROM funcionarios WHERE perfil = 'funcionario' AND clinica_id IS NOT NULL`
          );
        }
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Isolamento cruzado: RH vs Gestor', () => {
    it('RH NÃO deve conseguir inserir funcionário em entidade', async () => {
      await expect(
        runAsRole(
          'test_rh',
          { cpf: rhCpf1, perfil: 'rh', clinica_id: clinicaId1 },
          async (client) => {
            return await client.query(
              `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, entidade_id, ativo, nivel_cargo) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                '99999999901',
                'Teste Inválido',
                'funcionario',
                '$2a$10$test',
                entidadeId1,
                true,
                'operacional',
              ]
            );
          }
        )
      ).rejects.toThrow();
    });

    it('Gestor NÃO deve conseguir inserir funcionário em clínica', async () => {
      await expect(
        runAsRole(
          'test_gestor',
          {
            cpf: gestorCpf1,
            perfil: 'gestor',
            entidade_id: entidadeId1,
          },
          async (client) => {
            return await client.query(
              `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, ativo, nivel_cargo) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                '99999999902',
                'Teste Inválido 2',
                'funcionario',
                '$2a$10$test',
                clinicaId1,
                true,
                'operacional',
              ]
            );
          }
        )
      ).rejects.toThrow();
    });
  });
});
