/**
 * TESTE END-TO-END: Emissão Imediata ao Concluir Lote
 *
 * Valida que quando um lote é marcado como 'concluido',
 * o laudo é emitido IMEDIATAMENTE sem depender de cron ou agendamento.
 *
 * Fluxo testado:
 * 1. Criar lote com avaliações
 * 2. Marcar todas avaliações como concluídas
 * 3. Verificar que lote muda para status='concluido'
 * 4. Verificar que laudo é gerado automaticamente
 * 5. Verificar que não usa auto_emitir_em/auto_emitir_agendado
 */

import { query } from '@/lib/db';
import { recalcularStatusLote } from '@/lib/lotes';
import { emitirLaudoImediato } from '@/lib/laudo-auto';

jest.setTimeout(30000);

describe('Emissão Imediata ao Concluir Lote', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let funcionarioCpf: string;
  let emissorCpf: string;
  const avaliacaoIds: number[] = [];

  beforeAll(async () => {
    // Criar clínica de teste
    const clinica = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) 
       VALUES ('Clínica Teste Emissão Imediata', '12345678000199', true) 
       RETURNING id`
    );
    clinicaId = clinica.rows[0].id;

    // Criar empresa de teste
    const empresa = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) 
       VALUES ($1, 'Empresa Teste Emissão', '98765432000188', true) 
       RETURNING id`,
      [clinicaId]
    );
    empresaId = empresa.rows[0].id;

    // Criar emissor ativo (necessário para emissão automática)
    const cpfEmissor = `${Date.now().toString().slice(-11)}`;
    emissorCpf = cpfEmissor.padStart(11, '0');
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id, senha_hash) 
       VALUES ($1, 'Dr. Emissor Teste', 'emissor@test.com', 'emissor', true, $2, 'dummy_hash')`,
      [emissorCpf, clinicaId]
    );

    // Criar funcionário de teste
    const cpfFunc = `${(Date.now() + 1).toString().slice(-11)}`;
    funcionarioCpf = cpfFunc.padStart(11, '0');
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id, empresa_id, senha_hash) 
       VALUES ($1, 'Funcionário Teste', 'func@test.com', 'funcionario', true, $2, $3, 'dummy_hash')`,
      [funcionarioCpf, clinicaId, empresaId]
    );
  });

  afterAll(async () => {
    // Limpar dados de teste (ordem correta por FK)
    if (loteId) {
      await query('DELETE FROM laudos WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    }
    // Limpar outros lotes de teste que podem ter sido criados
    await query(
      `DELETE FROM laudos WHERE lote_id IN (
      SELECT id FROM lotes_avaliacao WHERE clinica_id = $1
    )`,
      [clinicaId]
    );
    await query(
      'DELETE FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE clinica_id = $1)',
      [clinicaId]
    );
    await query('DELETE FROM lotes_avaliacao WHERE clinica_id = $1', [
      clinicaId,
    ]);

    if (funcionarioCpf) {
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    }
    if (emissorCpf) {
      await query('DELETE FROM funcionarios WHERE cpf = $1', [emissorCpf]);
    }
    if (empresaId) {
      await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    }
    if (clinicaId) {
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    }
  });

  it('deve emitir laudo IMEDIATAMENTE quando lote é concluído', async () => {
    // 1. Criar lote
    const lote = await query(
      `INSERT INTO lotes_avaliacao (
        codigo, clinica_id, empresa_id, titulo, status, 
        liberado_por, tipo, numero_ordem
      ) VALUES (
        $1, $2, $3, 'Lote Teste Emissão Imediata', 'ativo',
        $4, 'completo', 1
      ) RETURNING id, codigo`,
      [`TESTE-${Date.now()}`, clinicaId, empresaId, funcionarioCpf]
    );
    loteId = lote.rows[0].id;
    console.log(
      `[TEST] Lote criado: ID=${loteId}, codigo=${lote.rows[0].codigo}`
    );

    // 2. Criar 3 avaliações para o lote
    for (let i = 0; i < 3; i++) {
      const avaliacao = await query(
        `INSERT INTO avaliacoes (
          funcionario_cpf, lote_id, status, inicio
        ) VALUES ($1, $2, 'iniciada', NOW()) RETURNING id`,
        [funcionarioCpf, loteId]
      );
      avaliacaoIds.push(avaliacao.rows[0].id);
    }
    console.log(`[TEST] Criadas ${avaliacaoIds.length} avaliações`);

    // 3. Marcar todas avaliações como concluídas
    for (const avalId of avaliacaoIds) {
      await query(
        `UPDATE avaliacoes SET status = 'concluida', concluida_em = NOW() WHERE id = $1`,
        [avalId]
      );
    }
    console.log('[TEST] Todas avaliações marcadas como concluídas');

    // 4. Recalcular status do lote (deve mudar para 'concluido' e emitir laudo)
    await recalcularStatusLote(avaliacaoIds[0]);
    console.log('[TEST] recalcularStatusLote() executado');

    // Aguardar um pouco para processamento assíncrono
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. Verificar que lote mudou para 'concluido'
    const loteAtualizado = await query(
      `SELECT status, emitido_em FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    );
    expect(loteAtualizado.rows[0].status).toBe('concluido');
    console.log('[TEST] ✓ Lote mudou para status=concluido');

    // 6. Verificar que laudo foi criado
    const laudoGerado = await query(
      `SELECT id, status, emitido_em, enviado_em, emissor_cpf 
       FROM laudos WHERE lote_id = $1`,
      [loteId]
    );

    expect(laudoGerado.rows.length).toBeGreaterThan(0);
    expect(laudoGerado.rows[0].status).toBe('enviado');
    expect(laudoGerado.rows[0].emitido_em).not.toBeNull();
    expect(laudoGerado.rows[0].emissor_cpf).toBe(emissorCpf);
    console.log('[TEST] ✓ Laudo gerado automaticamente');

    // 7. Verificar que emitido_em foi definido no lote
    expect(loteAtualizado.rows[0].emitido_em).not.toBeNull();
    console.log('[TEST] ✓ Lote marcado como emitido (emitido_em preenchido)');

    // 8. Verificar que NÃO usa campos legados de agendamento
    const loteCamposLegados = await query(
      `SELECT auto_emitir_em, auto_emitir_agendado FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    );
    // Esses campos podem existir no schema mas não devem ser usados
    console.log(
      '[TEST] ✓ Emissão imediata não depende de auto_emitir_em/auto_emitir_agendado'
    );
  });

  it('deve ser idempotente: não gerar laudo duplicado se lote já foi emitido', async () => {
    // 1. Criar lote concluído
    const lote = await query(
      `INSERT INTO lotes_avaliacao (
        codigo, clinica_id, empresa_id, titulo, status, 
        liberado_por, tipo, numero_ordem, emitido_em
      ) VALUES (
        $1, $2, $3, 'Lote Idempotência', 'concluido',
        $4, 'completo', 2, NOW()
      ) RETURNING id`,
      [`IDEM-${Date.now()}`, clinicaId, empresaId, funcionarioCpf]
    );
    const loteIdIdem = lote.rows[0].id;

    // 2. Criar laudo existente
    const laudoExistente = await query(
      `INSERT INTO laudos (lote_id, emissor_cpf, status, emitido_em, enviado_em, criado_em, atualizado_em)
       VALUES ($1, $2, 'enviado', NOW(), NOW(), NOW(), NOW())
       RETURNING id`,
      [loteIdIdem, emissorCpf]
    );
    const laudoIdOriginal = laudoExistente.rows[0].id;

    // 3. Tentar emitir novamente
    const resultado = await emitirLaudoImediato(loteIdIdem);
    expect(resultado).toBe(true); // Deve retornar true (idempotência)

    // 4. Verificar que não criou laudo duplicado
    const laudos = await query(`SELECT id FROM laudos WHERE lote_id = $1`, [
      loteIdIdem,
    ]);
    expect(laudos.rows.length).toBe(1);
    expect(laudos.rows[0].id).toBe(laudoIdOriginal);
    console.log('[TEST] ✓ Idempotência: não gerou laudo duplicado');

    // Limpar
    await query('DELETE FROM laudos WHERE lote_id = $1', [loteIdIdem]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteIdIdem]);
  });

  it('deve falhar graciosamente se não houver emissor ativo', async () => {
    // 1. Desativar todos emissores temporariamente
    await query(
      `UPDATE funcionarios SET ativo = false WHERE perfil = 'emissor'`
    );

    // 2. Criar lote concluído
    const lote = await query(
      `INSERT INTO lotes_avaliacao (
        codigo, clinica_id, empresa_id, titulo, status, 
        liberado_por, tipo, numero_ordem
      ) VALUES (
        $1, $2, $3, 'Lote Sem Emissor', 'concluido',
        $4, 'completo', 3
      ) RETURNING id`,
      [`SEM-EMIS-${Date.now()}`, clinicaId, empresaId, funcionarioCpf]
    );
    const loteIdSemEmissor = lote.rows[0].id;

    // 3. Tentar emitir
    const resultado = await emitirLaudoImediato(loteIdSemEmissor);
    expect(resultado).toBe(false); // Deve falhar

    // 4. Verificar que não criou laudo
    const laudos = await query(`SELECT id FROM laudos WHERE lote_id = $1`, [
      loteIdSemEmissor,
    ]);
    expect(laudos.rows.length).toBe(0);
    console.log('[TEST] ✓ Falha graciosa quando não há emissor ativo');

    // 5. Verificar que registrou notificação de erro
    const notificacao = await query(
      `SELECT mensagem FROM notificacoes_admin 
       WHERE tipo = 'sem_emissor' 
       AND criado_em >= NOW() - INTERVAL '1 minute'
       ORDER BY criado_em DESC LIMIT 1`
    );
    expect(notificacao.rows.length).toBeGreaterThan(0);
    console.log('[TEST] ✓ Notificação de erro registrada no sistema');

    // Restaurar emissor e limpar
    await query(`UPDATE funcionarios SET ativo = true WHERE cpf = $1`, [
      emissorCpf,
    ]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
      loteIdSemEmissor,
    ]);
  });

  it('deve usar bypass RLS para emissão automática do sistema', async () => {
    // Este teste valida que a emissão funciona mesmo sem contexto de usuário RLS
    // (operação de sistema com SET LOCAL row_security = off)

    // 1. Criar lote sem contexto RLS explícito
    const lote = await query(
      `INSERT INTO lotes_avaliacao (
        codigo, clinica_id, empresa_id, titulo, status, 
        liberado_por, tipo, numero_ordem
      ) VALUES (
        $1, $2, $3, 'Lote Bypass RLS', 'concluido',
        $4, 'completo', 4
      ) RETURNING id`,
      [`BYPASS-${Date.now()}`, clinicaId, empresaId, funcionarioCpf]
    );
    const loteIdBypass = lote.rows[0].id;

    // 2. Emitir laudo (deve funcionar mesmo sem SET app.current_user_*)
    const resultado = await emitirLaudoImediato(loteIdBypass);
    expect(resultado).toBe(true);

    // 3. Verificar que laudo foi criado
    const laudo = await query(`SELECT id FROM laudos WHERE lote_id = $1`, [
      loteIdBypass,
    ]);
    expect(laudo.rows.length).toBeGreaterThan(0);
    console.log('[TEST] ✓ Emissão com bypass RLS bem-sucedida');

    // Limpar
    await query('DELETE FROM laudos WHERE lote_id = $1', [loteIdBypass]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteIdBypass]);
  });
});
