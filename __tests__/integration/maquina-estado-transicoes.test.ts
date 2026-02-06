/**
 * Teste de transições de status da máquina de estado
 *
 * Estados de lote:
 * - 'ativo' (inicial) → 'concluido' → 'laudo_emitido' → 'finalizado'
 *
 * Estados de avaliação:
 * - 'iniciada' (inicial) → 'em_andamento' → 'concluida' (feminino) ou 'inativada'
 * 
 * Estados de laudo:
 * - Relação 1:1 com lote (laudo.id = lote_id por constraint)
  let empresaId: number;
  let emissorCpf: string;

  beforeAll(async () => {
    // Desabilitar triggers temporariamente para setup rápido
    await query(`SET session_replication_role = 'replica'`);

    const timestamp = Date.now();
    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email, ativa) 
       VALUES ($1, $2, $3, true) 
       RETURNING id`,
      [
        `Clínica Estados ${timestamp}`,
        `${timestamp.toString().slice(-14)}`,
        `estados${timestamp}@test.com`,
      ]
    );
    clinicaId = clinicaResult.rows[0].id;

    const empresaResult = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id, ativa) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id`,
      [
        `Empresa Estados ${timestamp}`,
        `${(timestamp + 1).toString().slice(-14)}`,
        `empresa${timestamp}@test.com`,
        clinicaId,
      ]
    );
    empresaId = empresaResult.rows[0].id;

    emissorCpf = '53051173991';

    // Reabilitar triggers para os testes
    await query(`SET session_replication_role = 'origin'`);
  });

  afterAll(async () => {
    await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
  });

  describe('Estados de Lote', () => {
    it('deve criar lote com status inicial "ativo"', async () => {
      const maxOrdemResult = await query(
        `SELECT COALESCE(MAX(numero_ordem), 0) as max_ordem 
         FROM lotes_avaliacao 
         WHERE empresa_id = $1`,
        [empresaId]
      );
      const numeroOrdem = maxOrdemResult.rows[0].max_ordem + 1;

      const result = await query(
        `INSERT INTO lotes_avaliacao 
         (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por) 
         VALUES ($1, $2, 'completo', 'ativo', $3, $4) 
         RETURNING id, status`,
        [empresaId, clinicaId, numeroOrdem, emissorCpf]
      );

      expect(result.rows[0].status).toBe('ativo');

      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
        result.rows[0].id,
      ]);
    });

    it('deve transicionar de "ativo" para "concluido" quando avaliações finalizadas', async () => {
      const maxOrdemResult = await query(
        `SELECT COALESCE(MAX(numero_ordem), 0) as max_ordem 
         FROM lotes_avaliacao 
         WHERE empresa_id = $1`,
        [empresaId]
      );
      const numeroOrdem = maxOrdemResult.rows[0].max_ordem + 1;

      const loteResult = await query(
        `INSERT INTO lotes_avaliacao 
         (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por) 
         VALUES ($1, $2, 'completo', 'ativo', $3, $4) 
         RETURNING id`,
        [empresaId, clinicaId, numeroOrdem, emissorCpf]
      );
      const loteId = loteResult.rows[0].id;

      const cpf = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );
      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id) 
         VALUES ($1, 'Test', $2)`,
        [cpf, empresaId]
      );

      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio, envio) 
         VALUES ($1, $2, 'concluido', NOW(), NOW())`,
        [loteId, cpf]
      );
      await query(`RESET app.current_user_cpf`);

      // Aguardar trigger
      await new Promise((resolve) => setTimeout(resolve, 100));

      const check = await query(
        `SELECT status FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      expect(check.rows[0].status).toBe('concluido');

      // Cleanup
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf]);
    });

    it('não deve permitir "rascunho" como status inicial de lote', async () => {
      const maxOrdemResult = await query(
        `SELECT COALESCE(MAX(numero_ordem), 0) as max_ordem 
         FROM lotes_avaliacao 
         WHERE empresa_id = $1`,
        [empresaId]
      );
      const numeroOrdem = maxOrdemResult.rows[0].max_ordem + 1;

      // Status 'rascunho' não é válido para lotes na nova máquina de estado
      await expect(
        query(
          `INSERT INTO lotes_avaliacao 
           (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por) 
           VALUES ($1, $2, 'completo', 'rascunho', $3, $4) 
           RETURNING id`,
          [empresaId, clinicaId, numeroOrdem, emissorCpf]
        )
      ).rejects.toThrow();
    });
  });

  describe('Estados de Avaliação', () => {
    let loteId: number;
    let funcionarioCpf: string;

    beforeEach(async () => {
      const maxOrdemResult = await query(
        `SELECT COALESCE(MAX(numero_ordem), 0) as max_ordem 
         FROM lotes_avaliacao 
         WHERE empresa_id = $1`,
        [empresaId]
      );
      const numeroOrdem = maxOrdemResult.rows[0].max_ordem + 1;

      const loteResult = await query(
        `INSERT INTO lotes_avaliacao 
         (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por) 
         VALUES ($1, $2, 'completo', 'ativo', $3, $4) 
         RETURNING id`,
        [empresaId, clinicaId, numeroOrdem, emissorCpf]
      );
      loteId = loteResult.rows[0].id;

      funcionarioCpf = String(
        Math.floor(Math.random() * 100000000000)
      ).padStart(11, '0');
      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id) 
         VALUES ($1, 'Funcionário Teste', $2)`,
        [funcionarioCpf, empresaId]
      );
    });

    afterEach(async () => {
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    });

    it('deve criar avaliação com status inicial "iniciada"', async () => {
      await query(`SET LOCAL app.current_user_cpf = $1`, [funcionarioCpf]);
      const result = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'iniciada', NOW()) 
         RETURNING id, status`,
        [loteId, funcionarioCpf]
      );
      await query(`RESET app.current_user_cpf`);

      expect(result.rows[0].status).toBe('iniciada');
    });

    it('deve transicionar de "iniciada" para "em_andamento"', async () => {
      await query(`SET LOCAL app.current_user_cpf = $1`, [funcionarioCpf]);
      const avalResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'iniciada', NOW()) 
         RETURNING id`,
        [loteId, funcionarioCpf]
      );
      await query(`RESET app.current_user_cpf`);

      const avaliacaoId = avalResult.rows[0].id;

      await query(
        `UPDATE avaliacoes SET status = 'em_andamento' WHERE id = $1`,
        [avaliacaoId]
      );

      const check = await query(`SELECT status FROM avaliacoes WHERE id = $1`, [
        avaliacaoId,
      ]);

      expect(check.rows[0].status).toBe('em_andamento');
    });

    it('deve transicionar de "em_andamento" para "concluido"', async () => {
      await query(`SET LOCAL app.current_user_cpf = $1`, [funcionarioCpf]);
      const avalResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'em_andamento', NOW()) 
         RETURNING id`,
        [loteId, funcionarioCpf]
      );
      await query(`RESET app.current_user_cpf`);

      const avaliacaoId = avalResult.rows[0].id;

      await query(
        `UPDATE avaliacoes SET status = 'concluido', envio = NOW() WHERE id = $1`,
        [avaliacaoId]
      );

      const check = await query(`SELECT status FROM avaliacoes WHERE id = $1`, [
        avaliacaoId,
      ]);

      expect(check.rows[0].status).toBe('concluido');
    });

    it('deve permitir transição direta de "iniciada" para "inativada"', async () => {
      await query(`SET LOCAL app.current_user_cpf = $1`, [funcionarioCpf]);
      const avalResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'iniciada', NOW()) 
         RETURNING id`,
        [loteId, funcionarioCpf]
      );
      await query(`RESET app.current_user_cpf`);

      const avaliacaoId = avalResult.rows[0].id;

      await query(`UPDATE avaliacoes SET status = 'inativada' WHERE id = $1`, [
        avaliacaoId,
      ]);

      const check = await query(`SELECT status FROM avaliacoes WHERE id = $1`, [
        avaliacaoId,
      ]);

      expect(check.rows[0].status).toBe('inativada');
    });

    it('não deve permitir "concluida" (com acento) - estado obsoleto', async () => {
      await query(`SET LOCAL app.current_user_cpf = $1`, [funcionarioCpf]);
      await expect(
        query(
          `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
           VALUES ($1, $2, 'concluida', NOW())`,
          [loteId, funcionarioCpf]
        )
      ).rejects.toThrow();
      await query(`RESET app.current_user_cpf`);
    });
  });

  describe('Valores enum válidos', () => {
    it('deve listar valores válidos para status de lote', async () => {
      const result = await query(
        `SELECT enumlabel 
         FROM pg_enum 
         WHERE enumtypid = 'status_lote'::regtype 
         ORDER BY enumlabel`,
        []
      );

      const valores = result.rows.map((r) => r.enumlabel);

      // Não deve conter 'rascunho'
      expect(valores).not.toContain('rascunho');

      // Deve conter os estados válidos
      expect(valores).toContain('ativo');
      expect(valores).toContain('concluido');
    });

    it('deve listar valores válidos para status de avaliação', async () => {
      const result = await query(
        `SELECT enumlabel 
         FROM pg_enum 
         WHERE enumtypid = 'status_avaliacao'::regtype 
         ORDER BY enumlabel`,
        []
      );

      const valores = result.rows.map((r) => r.enumlabel);

      expect(valores).toContain('iniciada');
      expect(valores).toContain('em_andamento');
      expect(valores).toContain('concluido');
      expect(valores).toContain('inativada');

      // Não deve conter 'concluida' (com acento)
      expect(valores).not.toContain('concluida');
    });
  });
});
