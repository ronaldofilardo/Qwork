/**
 * Testes de Validação de Constraints e Integridade
 *
 * Valida que todas as constraints do banco estão funcionando corretamente:
 * - usuarios_gestor_check
 * - funcionarios_owner_check
 * - empresas_clientes.clinica_id NOT NULL
 * - Enums corretos (usuario_tipo_enum sem gestor)
 * - Foreign keys e índices
 */

import { query } from '@/lib/db';

describe('Validação de Constraints e Integridade do Banco', () => {
  describe('1. Constraint: usuarios_gestor_check', () => {
    it('deve existir constraint usuarios_gestor_check', async () => {
      const result = await query(
        `SELECT conname, contype, pg_get_constraintdef(oid) as definition
         FROM pg_constraint
         WHERE conname = 'usuarios_gestor_check'`
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].contype).toBe('c'); // CHECK constraint
    });

    it('deve permitir criar gestor COM entidade_id e SEM clinica_id', async () => {
      const timestamp = Date.now();

      // Criar entidade
      const tomador = await query(
        `INSERT INTO entidades (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          ativa, pagamento_confirmado, status
        ) VALUES (
          'entidade', $1, $2, $3, '1199999999', 'Rua', 'SP', 'SP', '01234567',
          'Resp', '11111111111', $4, '11988888888', true, true, 'ativa'
        ) RETURNING id`,
        [
          `Entidade Constraint ${timestamp}`,
          `${String(timestamp).slice(-8)}0001${String(timestamp % 100).padStart(2, '0')}`,
          `ent_constraint${timestamp}@teste.com`,
          `resp${timestamp}@teste.com`,
        ]
      );
      const tomadorId = tomador.rows[0].id;

      // Criar gestor válido
      const gestorCpf = `${String(timestamp).slice(-11)}`;
      const result = await query(
        `INSERT INTO usuarios (
          cpf, nome, email, senha_hash, tipo_usuario, entidade_id, ativo
        ) VALUES ($1, 'Gestor Valid', $2, 'hash', 'gestor', $3, true)
        RETURNING cpf, tipo_usuario, entidade_id, clinica_id`,
        [gestorCpf, `gestor${timestamp}@teste.com`, tomadorId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tipo_usuario).toBe('gestor');
      expect(result.rows[0].entidade_id).toBe(tomadorId);
      expect(result.rows[0].clinica_id).toBeNull();

      // Limpeza
      await query('DELETE FROM usuarios WHERE cpf = $1', [gestorCpf]);
      await query('DELETE FROM entidades WHERE id = $1', [tomadorId]);
    });

    it('deve FALHAR ao criar gestor SEM entidade_id', async () => {
      const timestamp = Date.now();
      const cpfInvalido = `${String(timestamp + 1).slice(-11)}`;

      await expect(
        query(
          `INSERT INTO usuarios (
            cpf, nome, email, senha_hash, tipo_usuario, ativo
          ) VALUES ($1, 'Gestor Inválido', $2, 'hash', 'gestor', true)`,
          [cpfInvalido, `invalido${timestamp}@teste.com`]
        )
      ).rejects.toThrow(/usuarios_gestor_check/i);
    });

    it('deve FALHAR ao criar gestor COM clinica_id', async () => {
      const timestamp = Date.now();
      const cpfInvalido = `${String(timestamp + 2).slice(-11)}`;

      await expect(
        query(
          `INSERT INTO usuarios (
            cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo
          ) VALUES ($1, 'Gestor Inválido', $2, 'hash', 'gestor', 1, true)`,
          [cpfInvalido, `invalido${timestamp}@teste.com`]
        )
      ).rejects.toThrow(/usuarios_gestor_check/i);
    });
  });

  describe('2. Constraint: funcionarios_owner_check', () => {
    it('deve existir constraint funcionarios_owner_check', async () => {
      const result = await query(
        `SELECT conname, contype, pg_get_constraintdef(oid) as definition
         FROM pg_constraint
         WHERE conname = 'funcionarios_owner_check'`
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].contype).toBe('c'); // CHECK constraint
    });

    it('deve permitir funcionário de entidade: tomador_id preenchido, clinica_id e empresa_id NULL', async () => {
      const timestamp = Date.now();

      // Criar entidade
      const tomador = await query(
        `INSERT INTO entidades (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          ativa, pagamento_confirmado, status
        ) VALUES (
          'entidade', $1, $2, $3, '1199999999', 'Rua', 'SP', 'SP', '01234567',
          'Resp', '11111111111', $4, '11988888888', true, true, 'ativa'
        ) RETURNING id`,
        [
          `Entidade Func ${timestamp}`,
          `${String(timestamp).slice(-8)}0002${String(timestamp % 100).padStart(2, '0')}`,
          `ent_func${timestamp}@teste.com`,
          `resp_func${timestamp}@teste.com`,
        ]
      );
      const tomadorId = tomador.rows[0].id;

      // Criar funcionário válido
      const funcCpf = `${String(timestamp + 100).slice(-11)}`;
      const result = await query(
        `INSERT INTO funcionarios (
          cpf, nome, email, senha_hash, perfil, tomador_id, ativo, nivel_cargo
        ) VALUES ($1, 'Func Entidade', $2, 'hash', 'funcionario', $3, true, 'operacional')
        RETURNING cpf, tomador_id, clinica_id, empresa_id`,
        [funcCpf, `func${timestamp}@teste.com`, tomadorId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tomador_id).toBe(tomadorId);
      expect(result.rows[0].clinica_id).toBeNull();
      expect(result.rows[0].empresa_id).toBeNull();

      // Limpeza
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcCpf]);
      await query('DELETE FROM entidades WHERE id = $1', [tomadorId]);
    });

    it('deve permitir funcionário de empresa: empresa_id E clinica_id preenchidos, tomador_id NULL', async () => {
      const timestamp = Date.now();

      // Criar clínica
      const tomador = await query(
        `INSERT INTO clinicas (
          nome, cnpj, email, ativa
        ) VALUES (
          $1, $2, $3, true
        ) RETURNING id`,
        [
          `Clínica Func ${timestamp}`,
          `${String(timestamp).slice(-8)}0003${String(timestamp % 100).padStart(2, '0')}`,
          `cli_func${timestamp}@teste.com`,
        ]
      );

      const clinicaId = tomador.rows[0].id;

      const empresa = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, email, telefone, endereco, clinica_id, ativa)
         VALUES ($1, $2, $3, '1188888888', 'Rua Empresa', $4, true) RETURNING id`,
        [
          `Empresa ${timestamp}`,
          `${String(timestamp).slice(-8)}0004${String(timestamp % 100).padStart(2, '0')}`,
          `emp${timestamp}@teste.com`,
          clinicaId,
        ]
      );
      const empresaId = empresa.rows[0].id;

      // Criar funcionário válido
      const funcCpf = `${String(timestamp + 200).slice(-11)}`;
      const result = await query(
        `INSERT INTO funcionarios (
          cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, ativo, nivel_cargo
        ) VALUES ($1, 'Func Empresa', $2, 'hash', 'funcionario', $3, $4, true, 'operacional')
        RETURNING cpf, tomador_id, clinica_id, empresa_id`,
        [funcCpf, `func_emp${timestamp}@teste.com`, empresaId, clinicaId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tomador_id).toBeNull();
      expect(result.rows[0].clinica_id).toBe(clinicaId);
      expect(result.rows[0].empresa_id).toBe(empresaId);

      // Limpeza
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcCpf]);
      await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    });

    it('deve FALHAR funcionário com tomador_id E clinica_id simultaneamente', async () => {
      const timestamp = Date.now();
      const cpfInvalido = `${String(timestamp + 300).slice(-11)}`;

      await expect(
        query(
          `INSERT INTO funcionarios (
            cpf, nome, email, senha_hash, perfil, tomador_id, clinica_id, ativo, nivel_cargo
          ) VALUES ($1, 'Inválido', $2, 'hash', 'funcionario', 1, 1, true, 'operacional')`,
          [cpfInvalido, `inv${timestamp}@teste.com`]
        )
      ).rejects.toThrow();
    });
  });

  describe('3. Empresas: clinica_id NOT NULL', () => {
    it('coluna clinica_id deve ser NOT NULL', async () => {
      const result = await query(
        `SELECT is_nullable
         FROM information_schema.columns
         WHERE table_name = 'empresas_clientes' AND column_name = 'clinica_id'`
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].is_nullable).toBe('NO');
    });

    it('deve FALHAR ao criar empresa SEM clinica_id', async () => {
      const timestamp = Date.now();

      await expect(
        query(
          `INSERT INTO empresas_clientes (
            nome, cnpj, email, telefone, endereco, ativa
          ) VALUES ($1, $2, $3, '1188888888', 'Rua', true)`,
          [
            `Empresa Inválida ${timestamp}`,
            `${String(timestamp).slice(-8)}9999${String(timestamp % 100).padStart(2, '0')}`,
            `emp_inv${timestamp}@teste.com`,
          ]
        )
      ).rejects.toThrow(/not-null|null value/i);
    });

    it('TODAS as empresas existentes devem ter clinica_id preenchido', async () => {
      const result = await query(
        `SELECT COUNT(*) as total_sem_clinica
         FROM empresas_clientes
         WHERE clinica_id IS NULL`
      );

      expect(parseInt(result.rows[0].total_sem_clinica)).toBe(0);
    });
  });

  describe('4. Enum usuario_tipo_enum', () => {
    it('deve conter valor "gestor"', async () => {
      const result = await query(
        `SELECT enumlabel FROM pg_enum
         WHERE enumtypid = 'usuario_tipo_enum'::regtype AND enumlabel = 'gestor'`
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].enumlabel).toBe('gestor');
    });

    it('NÃO deve conter valor "gestor"', async () => {
      const result = await query(
        `SELECT enumlabel FROM pg_enum
         WHERE enumtypid = 'usuario_tipo_enum'::regtype AND enumlabel = 'gestor'`
      );

      expect(result.rows.length).toBe(0);
    });

    it('deve conter todos os valores esperados', async () => {
      const result = await query(
        `SELECT enumlabel FROM pg_enum
         WHERE enumtypid = 'usuario_tipo_enum'::regtype
         ORDER BY enumlabel`
      );

      const labels = result.rows.map((r) => r.enumlabel);

      expect(labels).toContain('admin');
      expect(labels).toContain('emissor');
      expect(labels).toContain('funcionario_clinica');
      expect(labels).toContain('funcionario_entidade');
      expect(labels).toContain('gestor');
      expect(labels).toContain('rh');
      expect(labels).not.toContain('gestor');
    });
  });

  describe('5. Foreign Keys e Índices', () => {
    it('deve existir FK funcionarios → tomadors', async () => {
      const result = await query(
        `SELECT conname
         FROM pg_constraint
         WHERE conrelid = 'funcionarios'::regclass
         AND contype = 'f'
         AND conname LIKE '%tomador%'`
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('deve existir FK empresas_clientes → clinicas', async () => {
      const result = await query(
        `SELECT conname
         FROM pg_constraint
         WHERE conrelid = 'empresas_clientes'::regclass
         AND contype = 'f'
         AND conname LIKE '%clinica%'`
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('deve existir índice em funcionarios.tomador_id', async () => {
      const result = await query(
        `SELECT indexname
         FROM pg_indexes
         WHERE tablename = 'funcionarios'
         AND indexdef LIKE '%tomador_id%'`
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('deve existir índice em empresas_clientes.clinica_id', async () => {
      const result = await query(
        `SELECT indexname
         FROM pg_indexes
         WHERE tablename = 'empresas_clientes'
         AND indexdef LIKE '%clinica_id%'`
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('6. View gestores', () => {
    it('view gestores deve existir', async () => {
      const result = await query(
        `SELECT viewname FROM pg_views WHERE viewname = 'gestores'`
      );

      expect(result.rows.length).toBe(1);
    });

    it('view gestores deve retornar apenas RH e Gestor', async () => {
      const result = await query(
        `SELECT DISTINCT usuario_tipo FROM gestores ORDER BY usuario_tipo`
      );

      const tipos = result.rows.map((r) => r.usuario_tipo);

      expect(tipos).toContain('gestor');
      expect(tipos).toContain('rh');
      expect(tipos.length).toBe(2); // Apenas 2 tipos
    });

    it('gestores devem ter entidade_id OU clinica_id (nunca ambos)', async () => {
      const result = await query(
        `SELECT cpf, usuario_tipo, entidade_id, clinica_id
         FROM gestores
         WHERE (entidade_id IS NOT NULL AND clinica_id IS NOT NULL)`
      );

      expect(result.rows.length).toBe(0); // Nenhum gestor com ambos
    });
  });

  describe('7. Integridade Referencial', () => {
    it('todos os funcionários com tomador_id devem ter tomador existente', async () => {
      const result = await query(
        `SELECT COUNT(*) as orphans
         FROM funcionarios f
         LEFT JOIN tomadors c ON f.tomador_id = c.id
         WHERE f.tomador_id IS NOT NULL AND c.id IS NULL`
      );

      expect(parseInt(result.rows[0].orphans)).toBe(0);
    });

    it('todas as empresas devem ter clínica existente', async () => {
      const result = await query(
        `SELECT COUNT(*) as orphans
         FROM empresas_clientes e
         LEFT JOIN clinicas c ON e.clinica_id = c.id
         WHERE e.clinica_id IS NOT NULL AND c.id IS NULL`
      );

      expect(parseInt(result.rows[0].orphans)).toBe(0);
    });

    it('todos os lotes com tomador_id devem ter tomador existente', async () => {
      const result = await query(
        `SELECT COUNT(*) as orphans
         FROM lotes_avaliacao l
         LEFT JOIN tomadors c ON l.tomador_id = c.id
         WHERE l.tomador_id IS NOT NULL AND c.id IS NULL`
      );

      expect(parseInt(result.rows[0].orphans)).toBe(0);
    });

    it('todos os lotes com clinica_id devem ter clínica existente', async () => {
      const result = await query(
        `SELECT COUNT(*) as orphans
         FROM lotes_avaliacao l
         LEFT JOIN clinicas c ON l.clinica_id = c.id
         WHERE l.clinica_id IS NOT NULL AND c.id IS NULL`
      );

      expect(parseInt(result.rows[0].orphans)).toBe(0);
    });
  });

  describe('8. Validações de Dados Existentes', () => {
    it('funcionários de entidade NÃO devem ter clinica_id ou empresa_id', async () => {
      const result = await query(
        `SELECT COUNT(*) as invalidos
         FROM funcionarios
         WHERE tomador_id IS NOT NULL
         AND (clinica_id IS NOT NULL OR empresa_id IS NOT NULL)`
      );

      expect(parseInt(result.rows[0].invalidos)).toBe(0);
    });

    it('funcionários de empresa DEVEM ter clinica_id E empresa_id', async () => {
      const result = await query(
        `SELECT COUNT(*) as invalidos
         FROM funcionarios
         WHERE empresa_id IS NOT NULL
         AND (clinica_id IS NULL OR tomador_id IS NOT NULL)`
      );

      expect(parseInt(result.rows[0].invalidos)).toBe(0);
    });

    it('lotes de entidade NÃO devem ter clinica_id ou empresa_id', async () => {
      const result = await query(
        `SELECT COUNT(*) as invalidos
         FROM lotes_avaliacao
         WHERE tomador_id IS NOT NULL
         AND (clinica_id IS NOT NULL OR empresa_id IS NOT NULL)`
      );

      expect(parseInt(result.rows[0].invalidos)).toBe(0);
    });

    it('lotes de clínica DEVEM ter clinica_id', async () => {
      const result = await query(
        `SELECT COUNT(*) as invalidos
         FROM lotes_avaliacao
         WHERE clinica_id IS NOT NULL
         AND tomador_id IS NOT NULL`
      );

      expect(parseInt(result.rows[0].invalidos)).toBe(0);
    });
  });
});
