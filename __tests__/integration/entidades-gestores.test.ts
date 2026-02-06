/**
 * Testes de Integração: Entidades (Gestor)
 *
 * Valida que:
 * - Entidades [gestor] geram DIRETAMENTE funcionários, avaliações e lotes
 * - NÃO passam por clínica ou empresa intermediária
 * - contratante_id é usado para vínculo
 * - clinica_id e empresa_id devem ser NULL para funcionários de entidade
 */

import { query } from '@/lib/db';

describe('Entidades (Gestor) - Criação Direta', () => {
  let contratanteId: number;
  let gestorCpf: string;
  let funcionarioCpf: string;
  let loteId: number;
  let avaliacaoId: number;

  beforeAll(async () => {
    // Criar contratante tipo 'entidade'
    const timestamp = Date.now();
    const cnpj = `${String(timestamp).slice(-8)}0001${String(timestamp % 100).padStart(2, '0')}`;
    const email = `entidade${timestamp}@teste.com`;

    const contratanteResult = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa, pagamento_confirmado
      ) VALUES (
        'entidade', $1, $2, $3, '1199999999', 'Rua Teste', 'São Paulo', 'SP', '01234567',
        'Responsável Teste', '12345678901', $4, '11988888888',
        true, true
      ) RETURNING id`,
      [
        `Entidade Teste ${timestamp}`,
        cnpj,
        email,
        `responsavel${timestamp}@teste.com`,
      ]
    );

    contratanteId = contratanteResult.rows[0].id;
    expect(contratanteId).toBeGreaterThan(0);

    // Criar gestor da entidade na tabela usuarios
    gestorCpf = `${String(timestamp).slice(-11)}`;
    const gestorEmail = `gestor${timestamp}@teste.com`;

    await query(
      `INSERT INTO usuarios (
        cpf, nome, email, senha_hash, tipo_usuario, entidade_id, ativo
      ) VALUES ($1, $2, $3, $4, 'gestor', $5, true)`,
      [
        gestorCpf,
        'Gestor Teste',
        gestorEmail,
        '$2b$10$dummyhash',
        contratanteId,
      ]
    );
  });

  afterAll(async () => {
    // Limpeza
    if (avaliacaoId) {
      await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
    }
    if (loteId) {
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    }
    if (funcionarioCpf) {
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    }
    if (gestorCpf) {
      await query('DELETE FROM usuarios WHERE cpf = $1', [gestorCpf]);
    }
    if (contratanteId) {
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  describe('1. Criar Funcionário de Entidade', () => {
    it('deve criar funcionário vinculado diretamente à entidade (contratante_id)', async () => {
      const timestamp = Date.now();
      funcionarioCpf = `${String(timestamp + 1).slice(-11)}`;
      const funcEmail = `func${timestamp}@teste.com`;

      const result = await query(
        `INSERT INTO funcionarios (
          cpf, nome, email, senha_hash, perfil, contratante_id, ativo, nivel_cargo
        ) VALUES ($1, $2, $3, $4, 'funcionario', $5, true, 'operacional')
        RETURNING id, cpf, contratante_id, clinica_id, empresa_id`,
        [
          funcionarioCpf,
          'Funcionário Entidade Teste',
          funcEmail,
          '$2b$10$dummyhash',
          contratanteId,
        ]
      );

      expect(result.rows.length).toBe(1);
      const funcionario = result.rows[0];

      // VALIDAÇÕES CRÍTICAS
      expect(funcionario.contratante_id).toBe(contratanteId);
      expect(funcionario.clinica_id).toBeNull(); // Não deve ter clinica_id
      expect(funcionario.empresa_id).toBeNull(); // Não deve ter empresa_id
    });

    it('deve respeitar constraint: funcionário de entidade NÃO pode ter clinica_id', async () => {
      const timestamp = Date.now();
      const cpfInvalido = `${String(timestamp + 2).slice(-11)}`;

      await expect(
        query(
          `INSERT INTO funcionarios (
            cpf, nome, email, senha_hash, perfil, contratante_id, clinica_id, ativo, nivel_cargo
          ) VALUES ($1, 'Teste Inválido', 'invalido@teste.com', 'hash', 'funcionario', $2, 1, true, 'operacional')`,
          [cpfInvalido, contratanteId]
        )
      ).rejects.toThrow();
    });

    it('deve respeitar constraint: funcionário de entidade NÃO pode ter empresa_id', async () => {
      const timestamp = Date.now();
      const cpfInvalido = `${String(timestamp + 3).slice(-11)}`;

      await expect(
        query(
          `INSERT INTO funcionarios (
            cpf, nome, email, senha_hash, perfil, contratante_id, empresa_id, ativo, nivel_cargo
          ) VALUES ($1, 'Teste Inválido', 'invalido@teste.com', 'hash', 'funcionario', $2, 1, true, 'operacional')`,
          [cpfInvalido, contratanteId]
        )
      ).rejects.toThrow();
    });
  });

  describe('2. Criar Lote de Entidade', () => {
    it('deve criar lote vinculado diretamente à entidade (contratante_id)', async () => {
      const timestamp = Date.now();
      const codigo = `ENT-${timestamp}`;

      const result = await query(
        `INSERT INTO lotes_avaliacao (
          contratante_id, codigo, titulo, tipo, status, liberado_por, numero_ordem
        ) VALUES ($1, $2, $3, 'completo', 'ativo', $4, 1)
        RETURNING id, contratante_id, clinica_id, empresa_id`,
        [contratanteId, codigo, `Lote Teste Entidade ${timestamp}`, gestorCpf]
      );

      expect(result.rows.length).toBe(1);
      loteId = result.rows[0].id;
      const lote = result.rows[0];

      // VALIDAÇÕES CRÍTICAS
      expect(lote.contratante_id).toBe(contratanteId);
      expect(lote.clinica_id).toBeNull(); // Lote de entidade NÃO tem clinica_id
      expect(lote.empresa_id).toBeNull(); // Lote de entidade NÃO tem empresa_id
    });

    it('deve listar lotes apenas da entidade do gestor', async () => {
      const result = await query(
        `SELECT id, contratante_id, clinica_id, empresa_id
         FROM lotes_avaliacao
         WHERE contratante_id = $1 AND clinica_id IS NULL AND empresa_id IS NULL`,
        [contratanteId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].contratante_id).toBe(contratanteId);
    });
  });

  describe('3. Criar Avaliação de Entidade', () => {
    it('deve criar avaliação para funcionário da entidade', async () => {
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

    it('deve validar que avaliação está vinculada ao funcionário correto da entidade', async () => {
      expect(avaliacaoId).toBeGreaterThan(0);

      const result = await query(
        `SELECT a.id, a.funcionario_cpf, f.contratante_id, f.clinica_id, f.empresa_id
         FROM avaliacoes a
         JOIN funcionarios f ON a.funcionario_cpf = f.cpf
         WHERE a.id = $1`,
        [avaliacaoId]
      );

      expect(result.rows.length).toBe(1);
      const dados = result.rows[0];

      expect(dados.contratante_id).toBe(contratanteId);
      expect(dados.clinica_id).toBeNull();
      expect(dados.empresa_id).toBeNull();
    });
  });

  describe('4. Validar Estrutura Organizacional', () => {
    it('deve confirmar que entidade NÃO tem clínica associada', async () => {
      const result = await query(
        `SELECT c.id, c.tipo,
                (SELECT COUNT(*) FROM clinicas WHERE contratante_id = c.id) as tem_clinica
         FROM contratantes c
         WHERE c.id = $1 AND c.tipo = 'entidade'`,
        [contratanteId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tipo).toBe('entidade');
      expect(result.rows[0].tem_clinica).toBe(0);
    });

    it('deve validar fluxo completo: Entidade → Funcionários → Lotes → Avaliações', async () => {
      const result = await query(
        `SELECT 
          c.id as contratante_id,
          c.tipo as contratante_tipo,
          f.cpf as funcionario_cpf,
          f.contratante_id as func_contratante_id,
          f.clinica_id as func_clinica_id,
          l.id as lote_id,
          l.contratante_id as lote_contratante_id,
          a.id as avaliacao_id
         FROM contratantes c
         LEFT JOIN funcionarios f ON f.contratante_id = c.id
         LEFT JOIN lotes_avaliacao l ON l.contratante_id = c.id
         LEFT JOIN avaliacoes a ON a.lote_id = l.id AND a.funcionario_cpf = f.cpf
         WHERE c.id = $1`,
        [contratanteId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      const dados = result.rows[0];

      // Validar hierarquia
      expect(dados.contratante_tipo).toBe('entidade');
      expect(dados.func_contratante_id).toBe(contratanteId);
      expect(dados.func_clinica_id).toBeNull();
      expect(dados.lote_contratante_id).toBe(contratanteId);
      expect(dados.avaliacao_id).toBe(avaliacaoId);
    });
  });

  describe('5. Validar Constraints do Banco', () => {
    it('deve validar que constraint usuarios_gestor_check existe e funciona', async () => {
      const constraintCheck = await query(
        `SELECT conname FROM pg_constraint WHERE conname = 'usuarios_gestor_check'`
      );

      expect(constraintCheck.rows.length).toBe(1);

      // Tentar criar gestor sem entidade_id (deve falhar)
      const timestamp = Date.now();
      const cpfInvalido = `${String(timestamp + 4).slice(-11)}`;

      await expect(
        query(
          `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, ativo)
           VALUES ($1, 'Gestor Inválido', 'invalido@teste.com', 'hash', 'gestor', true)`,
          [cpfInvalido]
        )
      ).rejects.toThrow();
    });

    it('deve validar que constraint funcionarios_owner_check existe e funciona', async () => {
      const constraintCheck = await query(
        `SELECT conname FROM pg_constraint WHERE conname = 'funcionarios_owner_check'`
      );

      expect(constraintCheck.rows.length).toBe(1);
    });

    it('deve validar enum usuario_tipo_enum contém gestor (não gestor)', async () => {
      const enumCheck = await query(
        `SELECT enumlabel FROM pg_enum 
         WHERE enumtypid = 'usuario_tipo_enum'::regtype 
         ORDER BY enumlabel`
      );

      const labels = enumCheck.rows.map((r) => r.enumlabel);

      expect(labels).toContain('gestor');
      expect(labels).not.toContain('gestor');
    });
  });

  describe('6. Validar View gestores', () => {
    it('deve listar gestor na view gestores', async () => {
      const viewCheck = await query(
        `SELECT cpf, usuario_tipo, entidade_id, clinica_id
         FROM gestores
         WHERE cpf = $1`,
        [gestorCpf]
      );

      expect(viewCheck.rows.length).toBe(1);
      const gestor = viewCheck.rows[0];

      expect(gestor.usuario_tipo).toBe('gestor');
      expect(gestor.entidade_id).toBe(contratanteId);
      expect(gestor.clinica_id).toBeNull();
    });
  });
});
