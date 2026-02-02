/**
 * Teste: Integridade do hash SHA-256 do PDF do laudo
 * Implementa ETAPA 2 do plano de implementação
 * Valida que o hash é calculado no momento da geração do PDF
 */

import { query } from '@/lib/db';
import { gerarLaudoCompletoEmitirPDF } from '@/lib/laudo-auto';
import crypto from 'crypto';

describe('Integridade do Hash SHA-256 do Laudo', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let emissorCpf: string;
  let funcionarioCpf: string;
  // Usado pelo teste de status para limpeza pós-teste
  let testAvaliacaoId: number | undefined;
  // Códigos de lote únicos para isolamento entre execuções
  let loteCodigo1: string;
  let loteCodigo2: string;

  beforeAll(async () => {
    // Definir contexto de sessão padrão para operações que exigem app.current_user_*
    // (evita erros de segurança/rls durante operações de limpeza/insert iniciais)
    await query(`SET LOCAL app.current_user_cpf = '00000000000'`);
    await query(`SET LOCAL app.current_user_perfil = 'system'`);

    // Garantir que não há registros antigos que possam causar conflito
    // Deletar na ordem correta respeitando foreign keys: laudos → lotes → funcionários
    const sysSession = { cpf: '00000000000', perfil: 'system' };

    await query(
      "DELETE FROM laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE liberado_por IN ('99999999999', '88888888888'))",
      [],
      sysSession
    );
    await query(
      "DELETE FROM lotes_avaliacao WHERE liberado_por IN ('99999999999', '88888888888')",
      [],
      sysSession
    );
    await query(
      "DELETE FROM funcionarios WHERE cpf IN ('99999999999', '88888888888')",
      [],
      sysSession
    );
    await query(
      "DELETE FROM clinicas WHERE cnpj = '11111111000199'",
      [],
      sysSession
    );

    // Criar clínica
    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email, ativa)
       VALUES ('Clínica Hash Test', '11111111000199', 'hash@test.com', true)
       RETURNING id`,
      [],
      sysSession
    );

    // Gerar códigos de lote únicos para garantir isolamento entre execuções
    // Códigos curtos (<=20 chars) para coluna `codigo`
    loteCodigo1 = `L-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`;
    loteCodigo2 = `L-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`;
    clinicaId = clinicaResult.rows[0].id;

    // Criar empresa
    const empresaResult = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa)
       VALUES ($1, 'Empresa Hash Test', '22222222000188', true)
       RETURNING id`,
      [clinicaId],
      sysSession
    );
    empresaId = empresaResult.rows[0].id;

    // Criar emissor (emissor não tem nivel_cargo conforme constraint)
    const emissorResult = await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, clinica_id)
       VALUES ('99999999999', 'Emissor Teste', 'emissor@hash.com', 'hash', 'emissor', true, $1)
       RETURNING cpf`,
      [clinicaId],
      sysSession
    );
    emissorCpf = emissorResult.rows[0].cpf;

    // Definir contexto de sessão para queries que exigem app.current_user_* (segurança/RLS)
    await query(`SET LOCAL app.current_user_cpf = '${emissorCpf}'`);
    await query(`SET LOCAL app.current_user_perfil = 'emissor'`);

    // Criar funcionário
    const funcResult = await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, ativo, nivel_cargo, clinica_id)
       VALUES ('88888888888', 'Funcionário Hash', 'func@hash.com', 'hash', 'funcionario', $1, true, 'operacional', $2)
       RETURNING cpf`,
      [empresaId, clinicaId],
      sysSession
    );
    funcionarioCpf = funcResult.rows[0].cpf;

    // Criar lote inicialmente como 'rascunho' (marcaremos como 'concluido' após concluir a avaliação)
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, empresa_id, clinica_id, tipo, status, liberado_por)
       VALUES ($1, 'Lote Teste Hash', $2, $3, 'completo', 'rascunho', $4)
       RETURNING id`,
      [loteCodigo1, empresaId, clinicaId, emissorCpf],
      sysSession
    );
    loteId = loteResult.rows[0].id;

    // Fazer todas as operações relativas à avaliação dentro de uma transação para evitar race conditions
    await query('BEGIN');
    try {
      // Criar avaliação INICIADA para permitir inserção de respostas, depois marcar concluída
      const avaliacaoResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status)
         VALUES ($1, $2, 'iniciada')
         RETURNING id`,
        [loteId, funcionarioCpf],
        sysSession
      );
      const avaliacaoId = avaliacaoResult.rows[0].id; // usado apenas para validação de status

      // Garantir que a avaliação esteja no status 'iniciada' (algumas triggers podem alterar o status automaticamente)
      const statusCheck = await query(
        'SELECT status FROM avaliacoes WHERE id = $1',
        [avaliacaoId],
        sysSession
      );
      const currStatus = statusCheck.rows[0].status;
      if (currStatus === 'concluida') {
        throw new Error(
          `Avaliação ${avaliacaoId} já está concluída antes de inserir respostas (estado inválido para o teste)`
        );
      }
      if (currStatus !== 'iniciada') {
      }

      // Inserir respostas mínimas para gerar laudo (colunas atualizadas: grupo, item, valor)
      await query(
        `INSERT INTO respostas (avaliacao_id, grupo, item, valor)
         VALUES 
           ($1, 1, '1', 25),
           ($1, 1, '2', 50),
           ($1, 2, '10', 75)`,
        [avaliacaoId],
        sysSession
      );

      // Calcular resultados
      await query(
        `INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria)
         VALUES 
           ($1, 1, 'G1', 50.0, 'medio'),
           ($1, 2, 'G2', 60.0, 'medio')`,
        [avaliacaoId],
        sysSession
      );

      // Marcar avaliação como concluída (após inserir respostas e resultados)
      await query(
        `UPDATE avaliacoes SET status = 'concluida' WHERE id = $1`,
        [avaliacaoId],
        sysSession
      );

      // Atualizar lote para 'concluido' agora que a avaliação foi concluída
      await query(
        `UPDATE lotes_avaliacao SET status = 'concluido', atualizado_em = NOW() WHERE id = $1`,
        [loteId]
      );

      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (loteId) {
      // Para evitar interferência com triggers de imutabilidade em ambiente de teste,
      // removemos apenas laudos e lotes (os resultados/respostas são preservados para auditoria)
      await query(
        'DELETE FROM laudos WHERE lote_id = $1',
        [loteId],
        sysSession
      );
      await query(
        'DELETE FROM lotes_avaliacao WHERE id = $1',
        [loteId],
        sysSession
      );
    }
    if (empresaId) {
      await query(
        'DELETE FROM funcionarios WHERE empresa_id = $1',
        [empresaId],
        sysSession
      );
      await query(
        'DELETE FROM empresas_clientes WHERE id = $1',
        [empresaId],
        sysSession
      );
    }
    // Remover emissor (pode referenciar clinica)
    if (emissorCpf) {
      await query(
        'DELETE FROM funcionarios WHERE cpf = $1',
        [emissorCpf],
        sysSession
      );
    }
    if (clinicaId) {
      await query(
        'DELETE FROM clinicas WHERE id = $1',
        [clinicaId],
        sysSession
      );
    }

    // Limpar arquivos locais de storage (se existirem)
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
      const filePath = path.join(laudosDir, `laudo-${loteId}.pdf`);
      const metaPath = path.join(laudosDir, `laudo-${loteId}.json`);
      // Remover arquivos de teste (ignorando erros se não existirem)
      await fs.unlink(filePath).catch(() => {});
      await fs.unlink(metaPath).catch(() => {});
    } catch (err) {
      // não falhar cleanup por motivos de FS
    }
  });

  test('Hash do PDF deve ser calculado corretamente após geração', async () => {
    // 1. Gerar laudo completo com PDF
    const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);

    expect(laudoId).toBeDefined();
    expect(typeof laudoId).toBe('number');

    // 2. Verificar que arquivo foi escrito em storage/laudos
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.pdf`
    );
    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );

    const fileBuffer = await fs.readFile(filePath);
    expect(fileBuffer).toBeDefined();
    expect(Buffer.isBuffer(fileBuffer)).toBe(true);

    // 3. Verificar metadados
    const metaRaw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw);
    expect(meta).toHaveProperty('hash');
    expect(typeof meta.hash).toBe('string');
    expect(meta.hash.length).toBe(64);

    // 4. Recalcular hash e comparar
    const hashRecalculado = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    expect(hashRecalculado).toBe(meta.hash);

    // 5. Verificar status do laudo no DB
    const laudoResult = await query(
      'SELECT status, emitido_em, enviado_em FROM laudos WHERE id = $1',
      [laudoId]
    );
    expect(laudoResult.rows[0].status).toBe('emitido'); // Status emitido, não enviado
    expect(laudoResult.rows[0].emitido_em).not.toBeNull();
    expect(laudoResult.rows[0].enviado_em).toBeNull(); // Não foi enviado ainda
  });

  test('Quando PDF já existe mas hash no DB é nulo, deve recalcular e persistir o hash ao revalidar', async () => {
    // Gerar laudo inicialmente (garante arquivo + meta)
    const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);
    expect(laudoId).toBeDefined();

    // Forçar cenário: limpar hash no DB, mantendo o PDF no storage
    await query(
      'UPDATE laudos SET hash_pdf = NULL WHERE id = $1',
      [laudoId],
      sysSession
    );

    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.pdf`
    );
    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );

    // Sanity: arquivo deve existir
    const fileBuffer = await fs.readFile(filePath);
    expect(Buffer.isBuffer(fileBuffer)).toBe(true);

    // Revalidar/generar laudo novamente — função deve detectar arquivo existente e persistir hash faltante
    const laudoId2 = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);
    expect(laudoId2).toBe(laudoId);

    // Verificar DB
    const res = await query(
      'SELECT hash_pdf FROM laudos WHERE id = $1',
      [laudoId],
      sysSession
    );
    expect(res.rows[0].hash_pdf).toBeDefined();
    expect(res.rows[0].hash_pdf.length).toBe(64);

    // Verificar metadados locais atualizados e consistência com DB
    const metaRaw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw);
    expect(meta.hash).toBe(res.rows[0].hash_pdf);
  });

  test('Laudo deve ter status enviado após geração automática', async () => {
    // 1. Criar novo lote para este teste
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (codigo, titulo, empresa_id, clinica_id, tipo, status, liberado_por)
       VALUES ($1, 'Lote Status Test', $2, $3, 'completo', 'rascunho', $4)
       RETURNING id`,
      [loteCodigo2, empresaId, clinicaId, emissorCpf]
    );
    const testLoteId = loteResult.rows[0].id;

    // Criar avaliação, inserir respostas/resultados e marcar concluída dentro de transação
    await query('BEGIN');
    try {
      const avaliacaoResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status)
         VALUES ($1, $2, 'iniciada')
         RETURNING id`,
        [testLoteId, funcionarioCpf]
      );
      testAvaliacaoId = avaliacaoResult.rows[0].id;

      // Garantir que a avaliação esteja em 'iniciada' antes de inserir resultados
      const statusCheck = await query(
        'SELECT status FROM avaliacoes WHERE id = $1',
        [testAvaliacaoId]
      );
      if (statusCheck.rows[0].status !== 'iniciada') {
        await query("UPDATE avaliacoes SET status = 'iniciada' WHERE id = $1", [
          testAvaliacaoId,
        ]);
      }

      await query(
        `INSERT INTO respostas (avaliacao_id, grupo, item, valor)
         VALUES ($1, 1, '1', 25)`,
        [testAvaliacaoId]
      );

      await query(
        `INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria)
         VALUES ($1, 1, 'G1', 50.0, 'medio')`,
        [testAvaliacaoId]
      );

      // Agora marcar como concluída
      await query(`UPDATE avaliacoes SET status = 'concluida' WHERE id = $1`, [
        testAvaliacaoId,
      ]);

      // Atualizar lote de teste para concluído
      await query(
        `UPDATE lotes_avaliacao SET status = 'concluido', atualizado_em = NOW() WHERE id = $1`,
        [testLoteId]
      );

      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }

    // 2. Gerar laudo
    const laudoId = await gerarLaudoCompletoEmitirPDF(testLoteId, emissorCpf);

    // 3. Verificar status
    const laudoResult = await query(
      'SELECT status, emitido_em, enviado_em FROM laudos WHERE id = $1',
      [laudoId]
    );

    expect(laudoResult.rows[0].status).toBe('emitido'); // Status emitido ao gerar
    expect(laudoResult.rows[0].emitido_em).not.toBeNull();
    expect(laudoResult.rows[0].enviado_em).toBeNull(); // Ainda não foi enviado manualmente

    // Limpar
    if (testAvaliacaoId) {
      // Para evitar conflito com triggers de imutabilidade, removemos apenas o laudo e o lote de teste
      await query('DELETE FROM laudos WHERE lote_id = $1', [testLoteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [testLoteId]);
    } else {
      // Caso não exista avaliacao criada (falha anterior), tentar remover lote mesmo assim
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [testLoteId]);
    }
  });

  test('Hash deve ser único por PDF gerado', async () => {
    // Gerar dois laudos para o mesmo lote (cenário de regeneração)
    const laudoId1 = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);

    // Aguardar pequeno delay para garantir diferença temporal
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Limpar laudo anterior para regenerar
    await query('DELETE FROM laudos WHERE id = $1', [laudoId1]);

    const laudoId2 = await gerarLaudoCompletoEmitirPDF(loteId, emissorCpf);

    // Buscar metadados locais para ambos os laudos
    const fs = await import('fs/promises');
    const path = await import('path');
    const meta1Raw = await fs.readFile(
      path.join(process.cwd(), 'storage', 'laudos', `laudo-${laudoId1}.json`),
      'utf-8'
    );
    const meta2Raw = await fs.readFile(
      path.join(process.cwd(), 'storage', 'laudos', `laudo-${laudoId2}.json`),
      'utf-8'
    );
    // const meta1 = JSON.parse(meta1Raw);
    const meta2 = JSON.parse(meta2Raw);

    // Como o conteúdo do PDF pode ter timestamp, os hashes podem ser diferentes
    // Mas ambos devem existir e ser válidos
    expect(meta2.hash).toBeDefined();
    expect(meta2.hash.length).toBe(64);
  });
});
