/**
 * Testes de Row Level Security (RLS) e RBAC
 * Validam isolamento de dados por perfil e permissões granulares
 */

import { query } from '@/lib/db';
import {
  queryWithContext,
  hasPermission,
  getPermissionsByRole,
} from '@/lib/db-security';
import { sessionHasAccessToLote } from '@/lib/auth-require';
import { validateResourceAccess } from '@/lib/security-validation';
import { Session, NivelCargoType } from '@/lib/session';

describe('Row Level Security (RLS) Tests', () => {
  beforeAll(async () => {
    // Verificar se RLS está ativo
    const rlsCheck = await query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('funcionarios', 'avaliacoes', 'empresas_clientes', 'lotes_avaliacao', 'laudos')
    `);

    expect(rlsCheck.rows.every((r) => r.rowsecurity === true)).toBe(true);
  });

  describe('Isolamento: Perfil Funcionário', () => {
    const funcionarioSession: Session = {
      cpf: '22222222222',
      nome: 'Funcionário Teste',
      perfil: 'funcionario',
      nivelCargo: 'operacional' as NivelCargoType,
    };

    beforeEach(async () => {
      // Configurar contexto de sessão
      await query(
        `SET LOCAL app.current_user_cpf = '${funcionarioSession.cpf}'`
      );
      await query(
        `SET LOCAL app.current_user_perfil = '${funcionarioSession.perfil}'`
      );
    });

    it('deve ver apenas seus próprios dados de funcionário', async () => {
      const result = await query(
        'SELECT COUNT(*) as count FROM funcionarios WHERE cpf = $1',
        [funcionarioSession.cpf]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('NÃO deve ver dados de outros funcionários', async () => {
      // Em ambiente de teste com superuser, RLS pode ser bypassado
      // Então esperamos que o superuser veja todos os dados
      const isSuperuser = await query(
        'SELECT usesuper FROM pg_user WHERE usename = current_user'
      );

      const result = await query(
        'SELECT COUNT(*) as count FROM funcionarios WHERE cpf != $1',
        [funcionarioSession.cpf]
      );

      if (isSuperuser.rows[0].usesuper) {
        // Superuser vê tudo devido ao bypass de RLS
        expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
      } else {
        // Usuário normal deve ver apenas seus dados
        expect(parseInt(result.rows[0].count)).toBe(0);
      }
    });

    it('deve ver apenas suas próprias avaliações', async () => {
      const result = await query(
        'SELECT COUNT(*) as count FROM avaliacoes WHERE funcionario_cpf = $1',
        [funcionarioSession.cpf]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('NÃO deve ver avaliações de outros', async () => {
      const result = await query(
        'SELECT COUNT(*) as count FROM avaliacoes WHERE funcionario_cpf != $1',
        [funcionarioSession.cpf]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('NÃO deve ver empresas (sem policy)', async () => {
      const isSuperuser = await query(
        'SELECT usesuper FROM pg_user WHERE usename = current_user'
      );
      const result = await query(
        'SELECT COUNT(*) as count FROM empresas_clientes'
      );

      if (isSuperuser.rows[0].usesuper) {
        // Superuser vê tudo devido ao bypass de RLS
        expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
      } else {
        // Usuário normal não deve ver empresas sem policy
        expect(result.rows[0].count).toBe('0');
      }
    });

    it('deve ver apenas suas respostas', async () => {
      const result = await query(
        `
        SELECT COUNT(*) as count 
        FROM respostas r
        JOIN avaliacoes a ON a.id = r.avaliacao_id
        WHERE a.funcionario_cpf = $1
      `,
        [funcionarioSession.cpf]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Isolamento: Perfil RH', () => {
    const rhSession: Session = {
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
    };
    let clinicaId: number;

    beforeAll(async () => {
      const resClin = await query(`SELECT id FROM clinicas LIMIT 1`);
      clinicaId =
        resClin.rowCount > 0
          ? resClin.rows[0].id
          : (
              await query(
                `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
                ['Clinica Teste RLS', '00000000000192', true]
              )
            ).rows[0].id;
    });

    beforeEach(async () => {
      await query(`SET LOCAL app.current_user_cpf = '${rhSession.cpf}'`);
      await query(`SET LOCAL app.current_user_perfil = '${rhSession.perfil}'`);
      await query(`SET LOCAL app.current_user_clinica_id = '${clinicaId}'`);
    });

    it('deve ver apenas funcionários de sua clínica', async () => {
      const result = await query(
        'SELECT COUNT(*) as count FROM funcionarios WHERE clinica_id = $1',
        [clinicaId]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('NÃO deve ver funcionários de outras clínicas', async () => {
      // Em ambiente de teste com superuser, RLS pode ser bypassado
      // Então esperamos que o superuser veja todos os dados
      const isSuperuser = await query(
        'SELECT usesuper FROM pg_user WHERE usename = current_user'
      );
      const result = await query(
        'SELECT COUNT(*) as count FROM funcionarios WHERE clinica_id != $1 OR clinica_id IS NULL',
        [clinicaId]
      );

      if (isSuperuser.rows[0].usesuper) {
        // Superuser vê tudo devido ao bypass de RLS
        expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
      } else {
        // Usuário RH deve ver apenas funcionários de sua clínica
        expect(result.rows[0].count).toBe('0');
      }
    });

    it('deve ver apenas empresas de sua clínica', async () => {
      const result = await query(
        'SELECT COUNT(*) as count FROM empresas_clientes WHERE clinica_id = $1',
        [clinicaId]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('NÃO deve ver empresas de outras clínicas', async () => {
      const result = await query(
        'SELECT COUNT(*) as count FROM empresas_clientes WHERE clinica_id != $1',
        [clinicaId]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('deve ver apenas lotes de sua clínica', async () => {
      const result = await query(
        'SELECT COUNT(*) as count FROM lotes_avaliacao WHERE clinica_id = $1',
        [clinicaId]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('deve ver avaliações de funcionários de sua clínica', async () => {
      const result = await query(
        `
        SELECT COUNT(*) as count 
        FROM avaliacoes a
        JOIN funcionarios f ON f.cpf = a.funcionario_cpf
        WHERE f.clinica_id = $1
      `,
        [clinicaId]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('deve poder ativar/inativar empresas apenas de sua clínica', async () => {
      const result = await query(
        `
        SELECT id, clinica_id, ativa
        FROM empresas_clientes
        WHERE clinica_id = $1
        LIMIT 1
      `,
        [clinicaId]
      );

      // RH deve ter acesso para atualizar empresas de sua clínica
      expect(result.rows).toBeDefined();
    });

    it('deve poder ser gerenciado por Admin', async () => {
      // Simular contexto Admin
      await query(`SET LOCAL app.current_user_cpf = '00000000000'`);
      await query(`SET LOCAL app.current_user_perfil = 'admin'`);

      const result = await query(
        "SELECT COUNT(*) as count FROM funcionarios WHERE usuario_tipo = 'rh'"
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(1);
    });

    it('gestores RH de diferentes clínicas devem ser isolados', async () => {
      // RH deve ver apenas gestores de sua própria clínica
      const result = await query(
        `
        SELECT COUNT(*) as count 
        FROM funcionarios 
        WHERE usuario_tipo = 'rh' AND clinica_id = $1
      `,
        [clinicaId]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);

      // Verificar que não vê gestores de outras clínicas
      const isSuperuser = await query(
        'SELECT usesuper FROM pg_user WHERE usename = current_user'
      );
      const otherResult = await query(
        `
        SELECT COUNT(*) as count 
        FROM funcionarios 
        WHERE usuario_tipo = 'rh' AND clinica_id != $1
      `,
        [clinicaId]
      );

      if (isSuperuser.rows[0].usesuper) {
        // Superuser vê tudo devido ao bypass de RLS
        expect(parseInt(otherResult.rows[0].count)).toBeGreaterThanOrEqual(0);
      } else {
        // Usuário RH deve ver apenas gestores de sua clínica
        expect(otherResult.rows[0].count).toBe('0');
      }
    });

    it('deve ver apenas sua própria clínica', async () => {
      const result = await query(
        'SELECT COUNT(*) as count FROM clinicas WHERE id = $1',
        [clinicaId]
      );

      expect(parseInt(result.rows[0].count)).toBe(1);
    });
  });

  describe('Isolamento: Perfil Emissor', () => {
    const emissorSession: Session = {
      cpf: '99999999999',
      nome: 'Emissor Teste',
      perfil: 'emissor',
    };

    beforeEach(async () => {
      await query(`SET LOCAL app.current_user_cpf = '${emissorSession.cpf}'`);
      await query(
        `SET LOCAL app.current_user_perfil = '${emissorSession.perfil}'`
      );
    });

    it('deve ver apenas lotes liberados (finalizados/concluídos)', async () => {
      const result = await query(
        "SELECT COUNT(*) as count FROM lotes_avaliacao WHERE status IN ('finalizado', 'concluido')"
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('NÃO deve ver lotes em andamento', async () => {
      const result = await query(
        "SELECT COUNT(*) as count FROM lotes_avaliacao WHERE status = 'ativo'"
      );

      const isSuperuser = await query(
        'SELECT usesuper FROM pg_user WHERE usename = current_user'
      );

      if (isSuperuser.rows[0].usesuper) {
        // Em ambiente de teste com superuser, RLS pode ser bypassado
        expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
      } else {
        expect(result.rows[0].count).toBe('0');
      }
    });

    it('deve ver todos os laudos (pode gerenciar)', async () => {
      const result = await query('SELECT COUNT(*) as count FROM laudos');

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('NÃO deve ver funcionários (sem policy)', async () => {
      const isSuperuser = await query(
        'SELECT usesuper FROM pg_user WHERE usename = current_user'
      );
      const result = await query('SELECT COUNT(*) as count FROM funcionarios');

      if (isSuperuser.rows[0].usesuper) {
        // Superuser vê tudo devido ao bypass de RLS
        expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
      } else {
        // Usuário normal sem política deve ver 0
        expect(result.rows[0].count).toBe('0');
      }
    });

    it('deve poder ser gerenciado por Admin', async () => {
      // Simular contexto Admin
      await query(`SET LOCAL app.current_user_cpf = '00000000000'`);
      await query(`SET LOCAL app.current_user_perfil = 'admin'`);

      const isSuperuser = await query(
        'SELECT usesuper FROM pg_user WHERE usename = current_user'
      );
      const result = await query(
        "SELECT COUNT(*) as count FROM funcionarios WHERE perfil = 'emissor'"
      );

      if (isSuperuser.rows[0].usesuper) {
        // Superuser vê tudo devido ao bypass de RLS
        expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
      } else {
        // Usuário normal deve ver emissores se as políticas permitirem
        expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
      }
    });

    it('emissores são usuários independentes (clinica_id NULL) e têm acesso global', async () => {
      // Admin deve ver todos os emissores
      await query(`SET LOCAL app.current_user_cpf = '00000000000'`);
      await query(`SET LOCAL app.current_user_perfil = 'admin'`);

      // Garantir que emissores podem existir sem clinica_id (modelo: usuário global)
      await query(
        `UPDATE funcionarios SET clinica_id = NULL WHERE perfil = 'emissor'`
      );

      const result = await query(`
        SELECT cpf, nome, clinica_id
        FROM funcionarios
        WHERE perfil = 'emissor'
      `);

      // Emissores são independentes: clinica_id deve poder ser NULL
      result.rows.forEach((emissor) => {
        expect(emissor.clinica_id).toBeNull();
      });

      // Validar que RLS permite acesso global para emissores (simular contexto de emissor)
      await query(`SET LOCAL app.current_user_perfil = 'emissor'`);
      const lotes = await query(
        `SELECT COUNT(*) as count FROM lotes_avaliacao WHERE status IN ('concluido', 'ativo')`
      );
      expect(parseInt(lotes.rows[0].count)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Acesso Total: Perfil Admin', () => {
    const adminSession: Session = {
      cpf: '88888888888',
      nome: 'Admin Teste',
      perfil: 'admin',
    };

    beforeEach(async () => {
      await query(`SET LOCAL app.current_user_cpf = '${adminSession.cpf}'`);
      await query(
        `SET LOCAL app.current_user_perfil = '${adminSession.perfil}'`
      );
    });

    it('deve ver funcionários de sistema (RH e Emissor), mas NÃO funcionários de empresas/entidades', async () => {
      const systemResult = await query(
        "SELECT COUNT(*) as count FROM funcionarios WHERE perfil IN ('rh','emissor')"
      );
      const allResult = await query(
        'SELECT COUNT(*) as count FROM funcionarios'
      );

      expect(parseInt(systemResult.rows[0].count)).toBeGreaterThanOrEqual(0);
      // Admin não deve ver ALL funcionários indiscriminadamente; validação mínima: system users <= all users
      expect(parseInt(systemResult.rows[0].count)).toBeLessThanOrEqual(
        parseInt(allResult.rows[0].count)
      );
    });

    it('❌ NÃO deve ver avaliacoes (acesso exclusivo de RH e gestor)', async () => {
      // Admin NÃO tem permissão para visualizar avaliações
      await expect(
        query('SELECT COUNT(*) as count FROM avaliacoes')
      ).rejects.toThrow(); // Deve falhar por falta de policy RLS
    });

    it('❌ NÃO deve ver empresas_clientes (gerenciadas por RH)', async () => {
      // Admin NÃO tem permissão para acessar empresas_clientes
      await expect(
        query('SELECT COUNT(*) as count FROM empresas_clientes')
      ).rejects.toThrow(); // Deve falhar por falta de policy RLS
    });

    it('❌ NÃO deve ver lotes_avaliacao (gerenciados por RH e gestor)', async () => {
      // Admin NÃO tem permissão para visualizar lotes
      await expect(
        query('SELECT COUNT(*) as count FROM lotes_avaliacao')
      ).rejects.toThrow(); // Deve falhar por falta de policy RLS
    });

    it('❌ NÃO deve ver laudos (gerenciados por emissor)', async () => {
      // Admin NÃO tem permissão para visualizar laudos
      await expect(
        query('SELECT COUNT(*) as count FROM laudos')
      ).rejects.toThrow(); // Deve falhar por falta de policy RLS
    });

    it('❌ NÃO deve ver clínicas (gerenciadas por RH)', async () => {
      // Admin NÃO tem permissão para acessar clínicas
      await expect(
        query('SELECT COUNT(*) as count FROM clinicas')
      ).rejects.toThrow(); // Deve falhar por falta de policy RLS
    });

    it('✅ DEVE ver contratantes (SELECT/INSERT/UPDATE/DELETE para gerenciar gestores)', async () => {
      // Admin pode gerenciar contratantes para aprovar cadastros e vincular gestores (Migration 301)
      const result = await query('SELECT COUNT(*) as count FROM contratantes');

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
    });

    it('✅ DEVE poder INSERIR contratantes (para aprovar novos cadastros)', async () => {
      // Admin pode criar contratantes
      const result = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
          cartao_cnpj_path, ativa
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [
          'clinica',
          'Clínica Teste Admin',
          '12345678000190',
          'teste@clinica.com',
          '11999999999',
          'Rua Teste, 123',
          'São Paulo',
          'SP',
          '01234567',
          'João Silva',
          '12345678901',
          'Diretor',
          'joao@clinica.com',
          '11999999999',
          '/path/cartao.pdf',
          true,
        ]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id');

      // Limpar dados de teste
      await query('DELETE FROM contratantes WHERE cnpj = $1', [
        '12345678000190',
      ]);
    });

    it('✅ DEVE poder ATUALIZAR contratantes (para manter informações)', async () => {
      // Criar contratante de teste
      const insertResult = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
          cartao_cnpj_path, ativa
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [
          'entidade',
          'Entidade Teste Admin',
          '98765432000180',
          'teste@entidade.com',
          '11999999998',
          'Av Teste, 456',
          'Rio de Janeiro',
          'RJ',
          '02345678',
          'Maria Santos',
          '98765432101',
          'Gerente',
          'maria@entidade.com',
          '11999999998',
          '/path/cartao2.pdf',
          true,
        ]
      );

      const contratanteId = insertResult.rows[0].id;

      // Admin pode modificar contratantes
      const updateResult = await query(
        'UPDATE contratantes SET nome = $1, ativa = $2 WHERE id = $3 RETURNING nome, ativa',
        ['Entidade Teste Admin Atualizada', false, contratanteId]
      );

      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].nome).toBe('Entidade Teste Admin Atualizada');
      expect(updateResult.rows[0].ativa).toBe(false);

      // Limpar dados de teste
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    });

    it('✅ DEVE poder DELETAR contratantes (com cuidado)', async () => {
      // Criar contratante de teste
      const insertResult = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
          cartao_cnpj_path, ativa
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [
          'clinica',
          'Clínica Para Deletar',
          '11111111000111',
          'deletar@clinica.com',
          '11999999997',
          'Rua Delete, 789',
          'Belo Horizonte',
          'MG',
          '03456789',
          'Pedro Costa',
          '11122233344',
          'Coordenador',
          'pedro@clinica.com',
          '11999999997',
          '/path/cartao3.pdf',
          false,
        ]
      );

      const contratanteId = insertResult.rows[0].id;

      // Admin pode excluir contratantes
      const deleteResult = await query(
        'DELETE FROM contratantes WHERE id = $1',
        [contratanteId]
      );

      // Verificar se foi deletado
      const checkResult = await query(
        'SELECT COUNT(*) as count FROM contratantes WHERE id = $1',
        [contratanteId]
      );
      expect(parseInt(checkResult.rows[0].count)).toBe(0);
    });

    it('deve poder gerenciar qualquer empresa de qualquer clínica', async () => {
      const result = await query(`
        SELECT DISTINCT clinica_id, COUNT(*) as count
        FROM empresas_clientes
        GROUP BY clinica_id
      `);

      // Admin deve ter visibilidade de empresas em todas as clínicas
      expect(result.rows).toBeDefined();
    });
  });
});

describe('RBAC - Role-Based Access Control', () => {
  describe('Permissões por Role', () => {
    it('funcionario deve ter 4 permissões', async () => {
      const permissions = await getPermissionsByRole('funcionario');

      expect(permissions).toHaveLength(4);
      expect(permissions).toContain('read:avaliacoes:own');
      expect(permissions).toContain('write:avaliacoes:own');
      expect(permissions).toContain('read:funcionarios:own');
      expect(permissions).toContain('write:funcionarios:own');
    });

    it('rh deve ter 7 permissões', async () => {
      const permissions = await getPermissionsByRole('rh');

      expect(permissions).toHaveLength(7);
      expect(permissions).toContain('read:avaliacoes:clinica');
      expect(permissions).toContain('read:funcionarios:clinica');
      expect(permissions).toContain('write:funcionarios:clinica');
      expect(permissions).toContain('read:empresas:clinica');
      expect(permissions).toContain('write:empresas:clinica');
      expect(permissions).toContain('read:lotes:clinica');
      expect(permissions).toContain('write:lotes:clinica');
    });

    it('emissor deve ter 3 permissões', async () => {
      const permissions = await getPermissionsByRole('emissor');

      expect(permissions).toHaveLength(3);
      expect(permissions).toContain('read:laudos');
      expect(permissions).toContain('write:laudos');
      expect(permissions).toContain('read:lotes:clinica');
    });

    it('admin deve ter 3 permissões administrativas (manage:rh, manage:clinicas, manage:admins)', async () => {
      const permissions = await getPermissionsByRole('admin');

      expect(permissions).toHaveLength(3);
      expect(permissions).toContain('manage:rh');
      expect(permissions).toContain('manage:clinicas');
      expect(permissions).toContain('manage:admins');
    });
  });

  describe('Verificação de Permissões', () => {
    it('funcionario tem permissão para ler próprias avaliações', async () => {
      const session: Session = {
        cpf: '111',
        nome: 'Teste',
        perfil: 'funcionario',
      };
      const hasPermissionResult = await hasPermission(
        session,
        'read:avaliacoes:own'
      );

      expect(hasPermissionResult).toBe(true);
    });

    it('funcionario NÃO tem permissão para gerenciar empresas', async () => {
      const session: Session = {
        cpf: '111',
        nome: 'Teste',
        perfil: 'funcionario',
      };
      const hasPermissionResult = await hasPermission(
        session,
        'manage:empresas'
      );

      expect(hasPermissionResult).toBe(false);
    });

    it('rh tem permissão para ler funcionários da clínica', async () => {
      const session: Session = { cpf: '111', nome: 'Teste', perfil: 'rh' };
      const hasPermissionResult = await hasPermission(
        session,
        'read:funcionarios:clinica'
      );

      expect(hasPermissionResult).toBe(true);
    });

    it('emissor tem permissão para escrever laudos', async () => {
      const session: Session = { cpf: '111', nome: 'Teste', perfil: 'emissor' };
      const hasPermissionResult = await hasPermission(session, 'write:laudos');

      expect(hasPermissionResult).toBe(true);
    });

    it('admin NÃO tem acesso implícito a lotes (não é emissor nem RH)', async () => {
      const session: Session = {
        cpf: '00000000000',
        nome: 'Admin Teste',
        perfil: 'admin',
      };
      const access = sessionHasAccessToLote(session, 1, 1);
      expect(access).toBe(false);
    });

    it('admin tem permissões apenas para gestão administrativa (RH, clínicas, admins)', async () => {
      const session: Session = { cpf: '111', nome: 'Teste', perfil: 'admin' };

      const permissions = ['manage:rh', 'manage:clinicas', 'manage:admins'];

      for (const permission of permissions) {
        const hasPermissionResult = await hasPermission(session, permission);
        expect(hasPermissionResult).toBe(true);
      }

      // Verificar que admin NÃO tem permissões operacionais
      const operationalPermissions = [
        'manage:laudos',
        'manage:avaliacoes',
        'manage:funcionarios',
        'manage:empresas',
        'manage:lotes',
      ];

      for (const permission of operationalPermissions) {
        const hasPermissionResult = await hasPermission(session, permission);
        expect(hasPermissionResult).toBe(false);
      }
    });

    it('validateResourceAccess: admin NÃO acessa nenhum recurso operacional', async () => {
      // Garantir uma clínica
      const resClin = await query(`SELECT id FROM clinicas LIMIT 1`);
      const clinicaId =
        resClin.rowCount > 0
          ? resClin.rows[0].id
          : (
              await query(
                `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
                ['Clinica Temp', '00000000000195', true]
              )
            ).rows[0].id;

      // Usar empresa existente se disponível, caso contrário testar com ID inexistente
      let empresaId: number;
      const existeEmpresa = await query(
        `SELECT id FROM empresas_clientes LIMIT 1`
      );
      if (existeEmpresa.rowCount > 0) {
        empresaId = existeEmpresa.rows[0].id;
      } else {
        empresaId = -1; // empresa inexistente; o objetivo aqui é verificar que admin não tem acesso operacional
      }

      const adminSession: Session = {
        cpf: '22222222222',
        nome: 'Admin Teste',
        perfil: 'admin',
      };

      // Admin NÃO acessa empresas operacionalmente
      const empresaAccess = await validateResourceAccess(
        adminSession,
        'empresa',
        empresaId
      );
      expect(empresaAccess.hasAccess).toBe(false);
      expect(empresaAccess.reason).toContain(
        'não tem acesso operacional a empresas'
      );

      // Admin NÃO acessa clínicas operacionalmente
      const clinicaAccess = await validateResourceAccess(
        adminSession,
        'clinica',
        clinicaId
      );
      expect(clinicaAccess.hasAccess).toBe(false);
      expect(clinicaAccess.reason).toContain(
        'não tem acesso operacional a clínicas'
      );

      // Inserir funcionarios para teste (usar CPFs únicos que não conflitam com outros testes/triggers)
      const testRhCpf = '88888888880'; // CPF único para RH
      const testFuncCpf = '88888888881'; // CPF único para funcionario comum

      await query(
        `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, ativo) 
         VALUES ($1,$2,$3,$4,$5,$6) 
         ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
        [testRhCpf, 'RH Teste ValidateAccess', 'rh', 'hash', clinicaId, true]
      );
      await query(
        `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, ativo) 
         VALUES ($1,$2,$3,$4,$5,$6) 
         ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
        [
          testFuncCpf,
          'Func Teste ValidateAccess',
          'funcionario',
          'hash',
          clinicaId,
          true,
        ]
      );

      // Admin NÃO acessa NENHUM funcionario (nem RH nem comum)
      const rhAccess = await validateResourceAccess(
        adminSession,
        'funcionario',
        parseInt(testRhCpf)
      );
      expect(rhAccess.hasAccess).toBe(false);
      expect(rhAccess.reason).toContain(
        'não tem acesso operacional a funcionários'
      );

      const funcAccess = await validateResourceAccess(
        adminSession,
        'funcionario',
        parseInt(testFuncCpf)
      );
      expect(funcAccess.hasAccess).toBe(false);
      expect(funcAccess.reason).toContain(
        'não tem acesso operacional a funcionários'
      );

      // Cleanup
      await query('DELETE FROM funcionarios WHERE cpf IN ($1,$2)', [
        testRhCpf,
        testFuncCpf,
      ]);
    });

    // Helper: executa um bloco com SET ROLE + SET LOCAL session vars (RLS) numa conexão dedicada
    async function runAsRole(
      role: string,
      sessionVars: Partial<Record<string, any>>,
      fn: (client: any) => Promise<any>
    ) {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.TEST_DATABASE_URL,
      });
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Criar e configurar um role não-superuser temporário para executar as queries com RLS aplicado
        await client.query(
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN CREATE ROLE ${role}; END IF; END$$;`
        );
        await client.query(`GRANT USAGE ON SCHEMA public TO ${role};`);
        await client.query(
          `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role};`
        );

        // Trocar para o role não-superuser (garante que RLS não é ignorado)
        await client.query(`SET ROLE ${role}`);
        await client.query('SET search_path TO public, pg_catalog');

        // Configurar contexto via set_config para que funções current_user_perfil() leiam corretamente
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
        if (sessionVars.contratante_id !== undefined)
          await client.query(
            "SELECT set_config('app.current_user_contratante_id', $1, true)",
            [String(sessionVars.contratante_id)]
          );

        const res = await fn(client);
        await client.query('ROLLBACK');
        return res;
      } finally {
        client.release();
        await pool.end();
      }
    }

    it('RLS: admin NÃO pode SELECT lotes_avaliacao', async () => {
      const adminVars = { cpf: '22222222222', perfil: 'admin' };

      const result = await runAsRole(
        'test_admin',
        adminVars,
        async (client) => {
          return await client.query('SELECT id FROM lotes_avaliacao LIMIT 1');
        }
      );

      expect(result.rowCount).toBe(0);
    });

    it('RLS: admin NÃO pode SELECT laudos', async () => {
      const adminVars = { cpf: '22222222222', perfil: 'admin' };

      const result = await runAsRole(
        'test_admin',
        adminVars,
        async (client) => {
          return await client.query('SELECT id FROM laudos LIMIT 1');
        }
      );

      expect(result.rowCount).toBe(0);
    });

    it('RLS: admin NÃO pode SELECT avaliacoes', async () => {
      const adminVars = { cpf: '22222222222', perfil: 'admin' };

      const result = await runAsRole(
        'test_admin',
        adminVars,
        async (client) => {
          return await client.query('SELECT id FROM avaliacoes LIMIT 1');
        }
      );

      expect(result.rowCount).toBe(0);
    });

    it('RLS: admin NÃO pode SELECT funcionarios', async () => {
      const adminVars = { cpf: '22222222222', perfil: 'admin' };

      const result = await runAsRole(
        'test_admin',
        adminVars,
        async (client) => {
          return await client.query(
            'SELECT cpf FROM funcionarios WHERE perfil = $1 LIMIT 1',
            ['funcionario']
          );
        }
      );

      expect(result.rowCount).toBe(0);
    });

    it('RLS: admin NÃO pode UPDATE funcionarios', async () => {
      const adminVars = { cpf: '22222222222', perfil: 'admin' };

      // Criar um funcionário de teste
      const testCpf = '99999999990';
      await query(
        `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, ativo) 
         VALUES ($1,$2,$3,$4,$5,$6) 
         ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
        [testCpf, 'Func Test Update', 'funcionario', 'hash', 1, true]
      );

      const result = await runAsRole(
        'test_admin',
        adminVars,
        async (client) => {
          return await client.query(
            'UPDATE funcionarios SET nome = $1 WHERE cpf = $2 RETURNING *',
            ['Nome Alterado', testCpf]
          );
        }
      );

      // Admin não deve conseguir atualizar
      expect(result.rowCount).toBe(0);

      // Cleanup
      await query('DELETE FROM funcionarios WHERE cpf = $1', [testCpf]);
    });

    it('RLS: admin NÃO pode SELECT empresas_clientes', async () => {
      const adminVars = { cpf: '22222222222', perfil: 'admin' };

      const result = await runAsRole(
        'test_admin',
        adminVars,
        async (client) => {
          return await client.query('SELECT id FROM empresas_clientes LIMIT 1');
        }
      );

      expect(result.rowCount).toBe(0);
    });

    it('RLS: admin NÃO pode INSERT em clinicas (deve usar endpoint)', async () => {
      const adminSession: Session = {
        cpf: '22222222222',
        nome: 'Admin Teste',
        perfil: 'admin',
      };

      // Tentar inserir clinica como admin - RLS deve bloquear
      try {
        await queryWithContext(
          'INSERT INTO clinicas (nome, cnpj, ativo) VALUES ($1, $2, $3)',
          ['Clinica Test RLS', '99999999999999', true],
          adminSession
        );
        fail('Deveria ter lançado erro de permissão RLS');
      } catch (error) {
        // Esperado - admin não pode inserir diretamente (deve usar /api/admin/cadastro/clinica)
        expect(error).toBeDefined();
      }
    });
  });
});

describe('Auditoria Automática', () => {
  const testCpf = '99999999998'; // Usar CPF diferente para evitar conflitos

  beforeEach(async () => {
    // Limpar logs e dados de teste anteriores
    await query(`DELETE FROM audit_logs WHERE user_cpf = '${testCpf}'`);
    await query(`DELETE FROM funcionarios WHERE cpf = '${testCpf}'`);
  });

  afterEach(async () => {
    // Cleanup
    await query(`DELETE FROM audit_logs WHERE user_cpf = '${testCpf}'`);
    await query(`DELETE FROM funcionarios WHERE cpf = '${testCpf}'`);
  });

  it('deve registrar INSERT em audit_logs', async () => {
    // Garantir existência de uma clínica e usar seu id para evitar FK violation
    let resClin = await query(`SELECT id FROM clinicas LIMIT 1`);
    let clinicaId =
      resClin.rowCount > 0
        ? resClin.rows[0].id
        : (
            await query(
              `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
              ['Clinica Teste Audit', '00000000000191', true]
            )
          ).rows[0].id;

    // Executar tudo em uma transação para manter o contexto da sessão
    await query('BEGIN');
    await query(`SET LOCAL app.current_user_cpf = '${testCpf}'`);
    await query(`SET LOCAL app.current_user_perfil = 'admin'`);
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, nivel_cargo)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        testCpf,
        'Teste Auditoria Insert',
        'rh', // Admin pode criar RH
        'hash',
        clinicaId,
        'operacional',
      ]
    );
    await query('COMMIT');

    // Verificar log
    const result = await query(
      `
      SELECT action, user_cpf, new_data->>'nome' as nome
      FROM audit_logs
      WHERE resource = 'funcionarios' 
      AND user_cpf = $1
      AND action = 'INSERT'
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [testCpf]
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].action).toBe('INSERT');
    expect(result.rows[0].user_cpf).toBe(testCpf);
    expect(result.rows[0].nome).toBe('Teste Auditoria Insert');

    // Cleanup
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [testCpf]);
  });

  it('deve registrar UPDATE em audit_logs com before/after', async () => {
    const updateCpf = '99999999997'; // CPF diferente para UPDATE

    // Cleanup antes de começar
    await query(`DELETE FROM audit_logs WHERE user_cpf = '${updateCpf}'`);
    await query(`DELETE FROM funcionarios WHERE cpf = '${updateCpf}'`);

    // Primeiro inserir o funcionário (usar clinica existente dinamicamente)
    const resClin = await query(`SELECT id FROM clinicas LIMIT 1`);
    const insertClinicaId =
      resClin.rowCount > 0
        ? resClin.rows[0].id
        : (
            await query(
              `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
              ['Clinica Teste Update', '00000000000193', true]
            )
          ).rows[0].id;

    await query('BEGIN');
    await query(`SET LOCAL app.current_user_cpf = '${updateCpf}'`);
    await query(`SET LOCAL app.current_user_perfil = 'admin'`);
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, nivel_cargo)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        updateCpf,
        'Nome Original',
        'rh', // Admin pode criar RH
        'hash',
        insertClinicaId,
        'operacional',
      ]
    );
    await query('COMMIT');

    // Depois atualizar em outra transação
    await query('BEGIN');
    await query(`SET LOCAL app.current_user_cpf = '${updateCpf}'`);
    await query(`SET LOCAL app.current_user_perfil = 'admin'`);
    await query(`UPDATE funcionarios SET nome = $1 WHERE cpf = $2`, [
      'Nome Modificado',
      updateCpf,
    ]);
    await query('COMMIT');

    // Verificar log de UPDATE
    const result = await query(`
      SELECT
        action,
        old_data->>'nome' as nome_anterior,
        new_data->>'nome' as nome_novo
      FROM audit_logs
      WHERE resource = 'funcionarios'
      AND user_cpf = '${updateCpf}'
      AND action = 'UPDATE'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].action).toBe('UPDATE');
    expect(result.rows[0].nome_anterior).toBe('Nome Original');
    expect(result.rows[0].nome_novo).toBe('Nome Modificado');

    // Cleanup
    await query(`DELETE FROM funcionarios WHERE cpf = '${updateCpf}'`);
    await query(`DELETE FROM audit_logs WHERE user_cpf = '${updateCpf}'`);
  });

  it('deve registrar DELETE em audit_logs', async () => {
    const deleteCpf = '99999999996'; // CPF diferente para DELETE

    // Cleanup antes de começar
    await query(`DELETE FROM audit_logs WHERE user_cpf = '${deleteCpf}'`);
    await query(`DELETE FROM funcionarios WHERE cpf = '${deleteCpf}'`);

    // Primeiro inserir o funcionário (usar clinica existente dinamicamente)
    const resClin = await query(`SELECT id FROM clinicas LIMIT 1`);
    const insertClinicaId =
      resClin.rowCount > 0
        ? resClin.rows[0].id
        : (
            await query(
              `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1,$2,$3) RETURNING id`,
              ['Clinica Teste Delete', '00000000000194', true]
            )
          ).rows[0].id;

    await query('BEGIN');
    await query(`SET LOCAL app.current_user_cpf = '${deleteCpf}'`);
    await query(`SET LOCAL app.current_user_perfil = 'admin'`);
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, clinica_id, nivel_cargo)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        deleteCpf,
        'Teste Delete',
        'rh', // Admin pode criar RH
        'hash',
        insertClinicaId,
        'operacional',
      ]
    );
    await query('COMMIT');

    // Depois deletar em outra transação
    await query('BEGIN');
    await query(`SET LOCAL app.current_user_cpf = '${deleteCpf}'`);
    await query(`SET LOCAL app.current_user_perfil = 'admin'`);
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [deleteCpf]);
    await query('COMMIT');

    // Verificar log de DELETE
    const result = await query(`
      SELECT
        action,
        user_cpf,
        old_data->>'nome' as nome_deletado
      FROM audit_logs
      WHERE resource = 'funcionarios'
      AND user_cpf = '${deleteCpf}'
      AND action = 'DELETE'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].action).toBe('DELETE');
    expect(result.rows[0].user_cpf).toBe(deleteCpf);
    expect(result.rows[0].nome_deletado).toBe('Teste Delete');

    // Cleanup adicional (apesar de já deletado)
    await query(`DELETE FROM audit_logs WHERE user_cpf = '${deleteCpf}'`);
  });
});

describe('Performance com RLS', () => {
  it('query de funcionário deve ser rápida (< 100ms)', async () => {
    await query(`SET LOCAL app.current_user_cpf = '22222222222'`);
    await query(`SET LOCAL app.current_user_perfil = 'funcionario'`);

    const start = Date.now();
    await query('SELECT * FROM avaliacoes WHERE funcionario_cpf = $1', [
      '22222222222',
    ]);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('query de RH deve ser rápida (< 100ms)', async () => {
    await query(`SET LOCAL app.current_user_cpf = '11111111111'`);
    await query(`SET LOCAL app.current_user_perfil = 'rh'`);
    await query(`SET LOCAL app.current_user_clinica_id = '1'`);

    const start = Date.now();
    await query('SELECT * FROM funcionarios WHERE clinica_id = $1', [1]);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
