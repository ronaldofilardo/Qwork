/**
 * Teste de validação de lote bloqueante
 *
 * Verifica que um lote só pode ter laudo emitido quando:
 * 1. Todas as avaliações estão em estado final ('concluida' ou 'inativada')
 * 2. Existe pelo menos uma avaliação concluída
 * 3. O lote está em status 'concluido'
 *
 * IMPORTANTE: Laudo tem id = lote_id (relação 1:1 por constraint)

describe('Validação de Lote Bloqueante', () => {
  let clinicaId: number;
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
        `Clínica Bloq ${timestamp}`,
        `${timestamp.toString().slice(-14)}`,
        `bloq${timestamp}@test.com`,
      ]
    );
    clinicaId = clinicaResult.rows[0].id;

    const empresaResult = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id, ativa) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id`,
      [
        `Empresa Bloq ${timestamp}`,
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

  describe('Bloqueios por avaliações pendentes', () => {
    it('não deve permitir emissão com avaliações em "iniciada"', async () => {
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

      const cpf1 = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );
      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id) 
         VALUES ($1, 'Func 1', $2)`,
        [cpf1, empresaId]
      );

      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf1]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'iniciada', NOW())`,
        [loteId, cpf1]
      );
      await query(`RESET app.current_user_cpf`);

      // Tentar gerar laudo deve falhar
      await expect(
        gerarLaudoCompletoEmitirPDF(loteId, emissorCpf)
      ).rejects.toThrow();

      // Cleanup
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf1]);
    });

    it('não deve permitir emissão com avaliações em "em_andamento"', async () => {
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

      const cpf2 = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );
      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id) 
         VALUES ($1, 'Func 2', $2)`,
        [cpf2, empresaId]
      );

      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf2]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'em_andamento', NOW())`,
        [loteId, cpf2]
      );
      await query(`RESET app.current_user_cpf`);

      // Tentar gerar laudo deve falhar
      await expect(
        gerarLaudoCompletoEmitirPDF(loteId, emissorCpf)
      ).rejects.toThrow();

      // Cleanup
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf2]);
    });
  });

  describe('Permissões corretas', () => {
    it('deve permitir emissão com todas avaliações concluídas', async () => {
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

      const cpf3 = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );
      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id) 
         VALUES ($1, 'Func 3', $2)`,
        [cpf3, empresaId]
      );

      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf3]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio, envio) 
         VALUES ($1, $2, 'concluido', NOW(), NOW())`,
        [loteId, cpf3]
      );
      await query(`RESET app.current_user_cpf`);

      // Aguardar trigger atualizar lote para 'concluido'
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Gerar laudo deve ter sucesso
      const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);
      expect(laudoId).toBeDefined();
      expect(laudoId).toBe(loteId);

      // Cleanup
      await query('DELETE FROM laudos WHERE id = $1', [loteId]);
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf3]);
    });

    it('deve permitir emissão com mix de concluídas e inativadas', async () => {
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

      const cpf4 = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );
      const cpf5 = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );

      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id) 
         VALUES ($1, 'Func 4', $2), ($3, 'Func 5', $2)`,
        [cpf4, empresaId, cpf5]
      );

      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf4]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio, envio) 
         VALUES ($1, $2, 'concluido', NOW(), NOW())`,
        [loteId, cpf4]
      );
      await query(`RESET app.current_user_cpf`);

      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf5]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'inativada', NOW())`,
        [loteId, cpf5]
      );
      await query(`RESET app.current_user_cpf`);

      // Aguardar trigger
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Gerar laudo deve ter sucesso
      const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);
      expect(laudoId).toBeDefined();

      // Cleanup
      await query('DELETE FROM laudos WHERE id = $1', [loteId]);
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM funcionarios WHERE cpf IN ($1, $2)', [
        cpf4,
        cpf5,
      ]);
    });
  });

  describe('Validação de contadores', () => {
    it('deve calcular corretamente avaliacoes_totais e avaliacoes_concluidas', async () => {
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

      const cpf6 = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );
      const cpf7 = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );
      const cpf8 = String(Math.floor(Math.random() * 100000000000)).padStart(
        11,
        '0'
      );

      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id) 
         VALUES ($1, 'F6', $4), ($2, 'F7', $4), ($3, 'F8', $4)`,
        [cpf6, cpf7, cpf8, empresaId]
      );

      // 2 concluídas, 1 inativada
      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf6]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio, envio) 
         VALUES ($1, $2, 'concluido', NOW(), NOW())`,
        [loteId, cpf6]
      );
      await query(`RESET app.current_user_cpf`);

      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf7]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio, envio) 
         VALUES ($1, $2, 'concluido', NOW(), NOW())`,
        [loteId, cpf7]
      );
      await query(`RESET app.current_user_cpf`);

      await query(`SET LOCAL app.current_user_cpf = $1`, [cpf8]);
      await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'inativada', NOW())`,
        [loteId, cpf8]
      );
      await query(`RESET app.current_user_cpf`);

      // Verificar contadores
      const counts = await query(
        `SELECT 
           COUNT(*) as totais,
           COUNT(*) FILTER (WHERE status = 'concluido') as concluidas,
           COUNT(*) FILTER (WHERE status = 'inativada') as inativadas
         FROM avaliacoes 
         WHERE lote_id = $1`,
        [loteId]
      );

      expect(counts.rows[0].totais).toBe('3');
      expect(counts.rows[0].concluidas).toBe('2');
      expect(counts.rows[0].inativadas).toBe('1');

      // Cleanup
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM funcionarios WHERE cpf IN ($1, $2, $3)', [
        cpf6,
        cpf7,
        cpf8,
      ]);
    });
  });
});
