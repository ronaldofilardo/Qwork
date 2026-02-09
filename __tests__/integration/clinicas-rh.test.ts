/**
 * Testes de Integração: Clínicas (RH)
 *
 * Valida que:
 * - Clínicas [rh] geram EMPRESAS (clientes)
 * - Cada EMPRESA tem funcionários, avaliações e lotes
 * - Tabela empresas SEMPRE vinculada à clinica (clinica_id NOT NULL)
 * - Funcionários de empresa têm empresa_id + clinica_id (NÃO tomador_id)
 */

import { query } from '@/lib/db';

describe('Clínicas (RH) - Gestão de Empresas', () => {
  let tomadorClinicaId: number;
  let clinicaId: number;
  let rhCpf: string;
  let empresaId: number;
  let funcionarioCpf: string;
  let loteId: number;
  let avaliacaoId: number;

  beforeAll(async () => {
    // 1. Criar tomador tipo 'clinica'
    const timestamp = Date.now();
    const cnpj = `${String(timestamp).slice(-8)}0002${String(timestamp % 100).padStart(2, '0')}`;
    const email = `clinica${timestamp}@teste.com`;

    const tomadorResult = await query(
      `INSERT INTO tomadors (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa, pagamento_confirmado
      ) VALUES (
        'clinica', $1, $2, $3, '1199999999', 'Rua Teste', 'São Paulo', 'SP', '01234567',
        'Responsável Clínica', '98765432100', $4, '11988888888',
        true, true
      ) RETURNING id`,
      [
        `Clínica Teste ${timestamp}`,
        cnpj,
        email,
        `resp_clinica${timestamp}@teste.com`,
      ]
    );

    tomadorClinicaId = tomadorResult.rows[0].id;

    // 2. Criar registro na tabela clinicas
    const clinicaResult = await query(
      `INSERT INTO clinicas (tomador_id, nome, ativa, criado_em)
       VALUES ($1, $2, true, NOW())
       RETURNING id`,
      [tomadorClinicaId, `Clínica Teste ${timestamp}`]
    );

    clinicaId = clinicaResult.rows[0].id;
    expect(clinicaId).toBeGreaterThan(0);

    // 3. Criar gestor RH na tabela usuarios
    rhCpf = `${String(timestamp + 1000).slice(-11)}`;
    const rhEmail = `rh${timestamp}@teste.com`;

    await query(
      `INSERT INTO usuarios (
        cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo
      ) VALUES ($1, $2, $3, $4, 'rh', $5, true)`,
      [rhCpf, 'RH Teste', rhEmail, '$2b$10$dummyhash', clinicaId]
    );
  });

  afterAll(async () => {
    // Limpeza na ordem correta
    if (avaliacaoId) {
      await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
    }
    if (loteId) {
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    }
    if (funcionarioCpf) {
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    }
    if (empresaId) {
      await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    }
    if (rhCpf) {
      await query('DELETE FROM usuarios WHERE cpf = $1', [rhCpf]);
    }
    if (clinicaId) {
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    }
    if (tomadorClinicaId) {
      await query('DELETE FROM tomadors WHERE id = $1', [
        tomadorClinicaId,
      ]);
    }
  });

  describe('1. Criar Empresa Cliente', () => {
    it('deve criar empresa SEMPRE vinculada à clínica (clinica_id NOT NULL)', async () => {
      const timestamp = Date.now();
      const empresaCnpj = `${String(timestamp).slice(-8)}0003${String(timestamp % 100).padStart(2, '0')}`;

      const result = await query(
        `INSERT INTO empresas_clientes (
          nome, cnpj, email, telefone, endereco, clinica_id, ativa
        ) VALUES ($1, $2, $3, '1188888888', 'Rua Empresa', $4, true)
        RETURNING id, clinica_id, tomador_id`,
        [
          `Empresa Cliente ${timestamp}`,
          empresaCnpj,
          `empresa${timestamp}@teste.com`,
          clinicaId,
        ]
      );

      expect(result.rows.length).toBe(1);
      empresaId = result.rows[0].id;
      const empresa = result.rows[0];

      // VALIDAÇÕES CRÍTICAS
      expect(empresa.clinica_id).toBe(clinicaId);
      expect(empresa.clinica_id).not.toBeNull(); // NUNCA pode ser NULL
      expect(empresa.tomador_id).toBeNull(); // Empresa vincula-se à clínica, não à tomador
    });

    it('deve falhar ao tentar criar empresa SEM clinica_id', async () => {
      const timestamp = Date.now();
      const empresaCnpj = `${String(timestamp + 1).slice(-8)}0004${String(timestamp % 100).padStart(2, '0')}`;

      await expect(
        query(
          `INSERT INTO empresas_clientes (
            nome, cnpj, email, telefone, endereco, ativa
          ) VALUES ($1, $2, $3, '1188888888', 'Rua Empresa', true)`,
          [
            `Empresa Inválida ${timestamp}`,
            empresaCnpj,
            `invalida${timestamp}@teste.com`,
          ]
        )
      ).rejects.toThrow(); // Deve falhar por violação de NOT NULL
    });

    it('deve listar empresas apenas da clínica do RH', async () => {
      const result = await query(
        `SELECT id, nome, clinica_id, tomador_id
         FROM empresas_clientes
         WHERE clinica_id = $1`,
        [clinicaId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((empresa) => {
        expect(empresa.clinica_id).toBe(clinicaId);
        expect(empresa.tomador_id).toBeNull();
      });
    });
  });

  describe('2. Criar Funcionário de Empresa', () => {
    it('deve criar funcionário vinculado à empresa E à clínica (empresa_id + clinica_id)', async () => {
      expect(empresaId).toBeGreaterThan(0);

      const timestamp = Date.now();
      funcionarioCpf = `${String(timestamp + 2000).slice(-11)}`;
      const funcEmail = `func_emp${timestamp}@teste.com`;

      const result = await query(
        `INSERT INTO funcionarios (
          cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, ativo, nivel_cargo
        ) VALUES ($1, $2, $3, $4, 'funcionario', $5, $6, true, 'operacional')
        RETURNING id, cpf, empresa_id, clinica_id, tomador_id`,
        [
          funcionarioCpf,
          'Funcionário Empresa Teste',
          funcEmail,
          '$2b$10$dummyhash',
          empresaId,
          clinicaId,
        ]
      );

      expect(result.rows.length).toBe(1);
      const funcionario = result.rows[0];

      // VALIDAÇÕES CRÍTICAS
      expect(funcionario.empresa_id).toBe(empresaId);
      expect(funcionario.clinica_id).toBe(clinicaId);
      expect(funcionario.tomador_id).toBeNull(); // Funcionário de empresa NÃO tem tomador_id
    });

    it('deve falhar ao criar funcionário de empresa SEM clinica_id', async () => {
      const timestamp = Date.now();
      const cpfInvalido = `${String(timestamp + 3000).slice(-11)}`;

      await expect(
        query(
          `INSERT INTO funcionarios (
            cpf, nome, email, senha_hash, perfil, empresa_id, ativo, nivel_cargo
          ) VALUES ($1, 'Inválido', 'inv@teste.com', 'hash', 'funcionario', $2, true, 'operacional')`,
          [cpfInvalido, empresaId]
        )
      ).rejects.toThrow();
    });

    it('deve falhar ao criar funcionário de empresa COM tomador_id', async () => {
      const timestamp = Date.now();
      const cpfInvalido = `${String(timestamp + 4000).slice(-11)}`;

      await expect(
        query(
          `INSERT INTO funcionarios (
            cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, tomador_id, ativo, nivel_cargo
          ) VALUES ($1, 'Inválido', 'inv@teste.com', 'hash', 'funcionario', $2, $3, 999, true, 'operacional')`,
          [cpfInvalido, empresaId, clinicaId]
        )
      ).rejects.toThrow();
    });
  });

  describe('3. Criar Lote de Clínica/Empresa', () => {
    it('deve criar lote vinculado à empresa E à clínica', async () => {
      expect(empresaId).toBeGreaterThan(0);

      const timestamp = Date.now();
      const codigo = `CLI-${timestamp}`;

      const result = await query(
        `INSERT INTO lotes_avaliacao (
          clinica_id, empresa_id, codigo, titulo, tipo, status, liberado_por, numero_ordem
        ) VALUES ($1, $2, $3, $4, 'completo', 'ativo', $5, 1)
        RETURNING id, clinica_id, empresa_id, tomador_id`,
        [clinicaId, empresaId, codigo, `Lote Teste Clínica ${timestamp}`, rhCpf]
      );

      expect(result.rows.length).toBe(1);
      loteId = result.rows[0].id;
      const lote = result.rows[0];

      // VALIDAÇÕES CRÍTICAS
      expect(lote.clinica_id).toBe(clinicaId);
      expect(lote.empresa_id).toBe(empresaId);
      expect(lote.tomador_id).toBeNull(); // Lote de clínica NÃO tem tomador_id
    });

    it('deve listar lotes apenas da clínica do RH', async () => {
      const result = await query(
        `SELECT id, clinica_id, empresa_id, tomador_id
         FROM lotes_avaliacao
         WHERE clinica_id = $1`,
        [clinicaId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach((lote) => {
        expect(lote.clinica_id).toBe(clinicaId);
        expect(lote.tomador_id).toBeNull();
      });
    });
  });

  describe('4. Criar Avaliação de Clínica/Empresa', () => {
    it('deve criar avaliação para funcionário da empresa', async () => {
      expect(loteId).toBeGreaterThan(0);
      expect(funcionarioCpf).toBeTruthy();

      const result = await query(
        `INSERT INTO avaliacoes (
          funcionario_cpf, lote_id, status, criado_em
        ) VALUES ($1, $2, 'iniciada', NOW())
        RETURNING id, funcionario_cpf, lote_id`,
        [funcionarioCpf, loteId]
      );

      expect(result.rows.length).toBe(1);
      avaliacaoId = result.rows[0].id;
      const avaliacao = result.rows[0];

      expect(avaliacao.funcionario_cpf).toBe(funcionarioCpf);
      expect(avaliacao.lote_id).toBe(loteId);
    });

    it('deve validar hierarquia: avaliação → funcionário → empresa → clínica', async () => {
      expect(avaliacaoId).toBeGreaterThan(0);

      const result = await query(
        `SELECT 
          a.id as avaliacao_id,
          f.cpf as funcionario_cpf,
          f.empresa_id,
          f.clinica_id as func_clinica_id,
          f.tomador_id,
          e.id as empresa_id,
          e.clinica_id as empresa_clinica_id,
          l.clinica_id as lote_clinica_id
         FROM avaliacoes a
         JOIN funcionarios f ON a.funcionario_cpf = f.cpf
         JOIN empresas_clientes e ON f.empresa_id = e.id
         JOIN lotes_avaliacao l ON a.lote_id = l.id
         WHERE a.id = $1`,
        [avaliacaoId]
      );

      expect(result.rows.length).toBe(1);
      const dados = result.rows[0];

      // Validar toda a hierarquia
      expect(dados.func_clinica_id).toBe(clinicaId);
      expect(dados.empresa_clinica_id).toBe(clinicaId);
      expect(dados.lote_clinica_id).toBe(clinicaId);
      expect(dados.tomador_id).toBeNull();
    });
  });

  describe('5. Validar Estrutura Organizacional', () => {
    it('deve confirmar que clínica TEM tomador vinculado', async () => {
      const result = await query(
        `SELECT c.id, c.tomador_id, ct.tipo
         FROM clinicas c
         JOIN tomadors ct ON c.tomador_id = ct.id
         WHERE c.id = $1`,
        [clinicaId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tomador_id).toBe(tomadorClinicaId);
      expect(result.rows[0].tipo).toBe('clinica');
    });

    it('deve validar fluxo completo: Clínica → Empresas → Funcionários → Lotes → Avaliações', async () => {
      const result = await query(
        `SELECT 
          c.id as clinica_id,
          e.id as empresa_id,
          e.clinica_id as empresa_clinica_id,
          f.cpf as funcionario_cpf,
          f.empresa_id as func_empresa_id,
          f.clinica_id as func_clinica_id,
          l.id as lote_id,
          l.clinica_id as lote_clinica_id,
          a.id as avaliacao_id
         FROM clinicas c
         LEFT JOIN empresas_clientes e ON e.clinica_id = c.id
         LEFT JOIN funcionarios f ON f.empresa_id = e.id
         LEFT JOIN lotes_avaliacao l ON l.clinica_id = c.id AND l.empresa_id = e.id
         LEFT JOIN avaliacoes a ON a.lote_id = l.id AND a.funcionario_cpf = f.cpf
         WHERE c.id = $1 AND e.id = $2`,
        [clinicaId, empresaId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      const dados = result.rows[0];

      // Validar hierarquia completa
      expect(dados.clinica_id).toBe(clinicaId);
      expect(dados.empresa_clinica_id).toBe(clinicaId);
      expect(dados.func_clinica_id).toBe(clinicaId);
      expect(dados.func_empresa_id).toBe(empresaId);
      expect(dados.lote_clinica_id).toBe(clinicaId);
      expect(dados.avaliacao_id).toBe(avaliacaoId);
    });

    it('deve validar que TODAS as empresas da clínica têm clinica_id NOT NULL', async () => {
      const result = await query(
        `SELECT COUNT(*) as total_empresas,
                COUNT(CASE WHEN clinica_id IS NULL THEN 1 END) as empresas_sem_clinica
         FROM empresas_clientes
         WHERE clinica_id = $1 OR clinica_id IS NULL`,
        [clinicaId]
      );

      expect(result.rows[0].empresas_sem_clinica).toBe(0); // ZERO empresas sem clinica_id
    });
  });

  describe('6. Validar Constraints do Banco', () => {
    it('deve validar que empresas_clientes.clinica_id é NOT NULL', async () => {
      const columnCheck = await query(
        `SELECT is_nullable
         FROM information_schema.columns
         WHERE table_name = 'empresas_clientes' AND column_name = 'clinica_id'`
      );

      expect(columnCheck.rows.length).toBe(1);
      expect(columnCheck.rows[0].is_nullable).toBe('NO');
    });

    it('deve validar foreign key empresas_clientes → clinicas', async () => {
      const fkCheck = await query(
        `SELECT conname
         FROM pg_constraint
         WHERE conrelid = 'empresas_clientes'::regclass
         AND contype = 'f'
         AND conname LIKE '%clinica%'`
      );

      expect(fkCheck.rows.length).toBeGreaterThan(0);
    });
  });

  describe('7. Validar View gestores', () => {
    it('deve listar RH na view gestores', async () => {
      const viewCheck = await query(
        `SELECT cpf, usuario_tipo, clinica_id, entidade_id
         FROM gestores
         WHERE cpf = $1`,
        [rhCpf]
      );

      expect(viewCheck.rows.length).toBe(1);
      const gestor = viewCheck.rows[0];

      expect(gestor.usuario_tipo).toBe('rh');
      expect(gestor.clinica_id).toBe(clinicaId);
      expect(gestor.entidade_id).toBeNull();
    });
  });
});
