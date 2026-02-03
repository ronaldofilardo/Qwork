import { requireRole } from '@/lib/session';
import { query, transaction } from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    // Buscar total de lotes (excluindo cancelados)
    // IMPORTANTE: Apenas lotes que foram SOLICITADOS para emissão (fila_emissao) ou já têm laudo EMITIDO
    const totalQuery = await query(
      `
      SELECT COUNT(DISTINCT la.id) as total
      FROM lotes_avaliacao la
      LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
      LEFT JOIN laudos l ON l.id = la.id
      WHERE la.status != 'cancelado'
        AND (fe.id IS NOT NULL OR (l.id IS NOT NULL AND l.emitido_em IS NOT NULL))
    `,
      []
    );

    const total =
      !totalQuery || !totalQuery.rows || totalQuery.rows.length === 0
        ? 0
        : parseInt(totalQuery.rows[0].total);

    // Buscar lotes paginados (excluindo cancelados)
    // IMPORTANTE: Apenas lotes que foram SOLICITADOS para emissão (fila_emissao) ou já têm laudo EMITIDO
    const lotesQuery = await query(
      `
      SELECT
        la.id,
        la.titulo,
        la.tipo,
        la.status as lote_status,
        la.liberado_em,
        la.modo_emergencia,
        COALESCE(ec.nome, cont.nome) as empresa_nome,
        COALESCE(c.nome, cont.nome) as clinica_nome,
        COUNT(a.id) as total_avaliacoes,
        l.observacoes,
        l.status as status_laudo,
        l.id as laudo_id,
        l.emitido_em,
        l.enviado_em,
        l.hash_pdf,
        l.emissor_cpf,
        f.nome as emissor_nome,
        fe.solicitado_por,
        fe.solicitado_em,
        fe.tipo_solicitante
      FROM lotes_avaliacao la
      LEFT JOIN laudos l ON l.id = la.id
      LEFT JOIN funcionarios f ON l.emissor_cpf = f.cpf
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN clinicas c ON ec.clinica_id = c.id
      LEFT JOIN contratantes cont ON la.contratante_id = cont.id
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
      WHERE la.status != 'cancelado'
        AND (fe.id IS NOT NULL OR (l.id IS NOT NULL AND l.emitido_em IS NOT NULL))
      GROUP BY la.id, la.titulo, la.tipo, la.status, la.liberado_em, la.modo_emergencia, ec.nome, c.nome, cont.nome, l.observacoes, l.status, l.id, l.emitido_em, l.enviado_em, l.hash_pdf, l.emissor_cpf, f.nome, fe.solicitado_por, fe.solicitado_em, fe.tipo_solicitante
      ORDER BY
        CASE
          WHEN la.status = 'ativo' THEN 1
          WHEN la.status = 'concluido' THEN 2
          WHEN la.status = 'finalizado' THEN 3
          WHEN la.status = 'cancelado' THEN 4
        END,
        la.liberado_em DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    // Para detectar laudo emitido também pelo arquivo local, precisamos checar storage
    const fs = await import('fs/promises');
    const path = await import('path');

    const lotes = await Promise.all(
      (lotesQuery.rows || []).map(async (lote) => {
        // Incluir informações de laudo apenas quando realmente existe
        let temLaudo = Boolean(lote.laudo_id);

        let laudoFileExists = false;
        let laudoHashFromFile: string | null = null;

        try {
          const maybeId = temLaudo ? lote.laudo_id : lote.id;
          const finalPath = path.join(
            process.cwd(),
            'storage',
            'laudos',
            `laudo-${maybeId}.pdf`
          );
          console.log(
            `[DEBUG] Checando existência de arquivo local: ${finalPath}`
          );
          await fs.access(finalPath);
          laudoFileExists = true;
          console.log(`[DEBUG] Arquivo local existe para lote ${lote.id}`);

          // Attempt to calculate hash if file exists
          try {
            const buf = await fs.readFile(finalPath);
            laudoHashFromFile = crypto
              .createHash('sha256')
              .update(buf)
              .digest('hex');
            console.log(
              `[DEBUG] Hash calculado a partir do arquivo local: ${laudoHashFromFile?.substring(0, 8)}...`
            );
          } catch (hashErr) {
            console.warn(
              '[WARN] Falha ao calcular hash do arquivo local do laudo:',
              hashErr
            );
            laudoHashFromFile = null;
          }
        } catch (err) {
          console.log(
            `[DEBUG] Arquivo local não encontrado para lote ${lote.id}: ${err?.message || err}`
          );
          laudoFileExists = false;
        }

        // If there is a local file but no laudo record, try to persist a DB record
        if (!temLaudo && laudoFileExists) {
          try {
            // Usar transaction() para garantir que set_config e INSERT rodem na mesma conexão
            await transaction(
              async (tx) => {
                // Setar contexto de usuário antes de INSERT para satisfazer triggers de auditoria
                await tx.query(
                  `SELECT set_config('app.current_user_cpf', $1, true)`,
                  [user.cpf]
                );
                await tx.query(
                  `SELECT set_config('app.current_user_perfil', $1, true)`,
                  [user.perfil]
                );

                // Inserir registro do laudo (id = lote id) se ainda não existir
                await tx.query(
                  `INSERT INTO laudos (id, lote_id, emissor_cpf, status, emitido_em, hash_pdf, criado_em, atualizado_em)
               VALUES ($1, $1, $2, 'emitido', NOW(), $3, NOW(), NOW())
               ON CONFLICT (id) DO NOTHING`,
                  [lote.id, user.cpf, laudoHashFromFile]
                );

                // Garantir que colunas antigas existam (compatibilidade com triggers antigas)
                await tx.query(
                  `ALTER TABLE lotes_avaliacao ADD COLUMN IF NOT EXISTS processamento_em TIMESTAMP`
                );
                await tx.query(
                  `ALTER TABLE lotes_avaliacao ADD COLUMN IF NOT EXISTS setor_id INTEGER`
                );

                // Atualizar lote para marcar como emitido
                await tx.query(
                  `UPDATE lotes_avaliacao SET emitido_em = NOW(), atualizado_em = NOW() WHERE id = $1 AND emitido_em IS NULL`,
                  [lote.id]
                );
              },
              {
                cpf: user.cpf,
                nome: user.nome || 'Emissor',
                perfil: user.perfil,
                clinica_id: null,
                contratante_id: null,
              }
            );

            console.log(
              `[INFO] ✓ Laudo local persistido no banco para lote ${lote.id}`
            );

            // After attempt, mark temLaudo true so the response includes laudo meta
            temLaudo = true;
            // If the DB had no laudo_id previously, set it to lote.id for response
            lote.laudo_id = lote.laudo_id || lote.id;
          } catch (insertErr) {
            console.warn(
              '[WARN] Falha ao persistir laudo local no banco (ignorado):',
              insertErr
            );
            // Mesmo com falha no INSERT, se o arquivo existe, marcar temLaudo como true
            temLaudo = true;
            lote.laudo_id = lote.id;
          }
        }

        // Marcar como emitido se:
        // 1. Existe registro no DB com status adequado OU
        // 2. Existe arquivo local (mesmo sem DB)
        const laudoEmitido =
          laudoFileExists ||
          (temLaudo &&
            (lote.status_laudo === 'emitido' ||
              lote.status_laudo === 'enviado' ||
              lote.hash_pdf ||
              lote.emitido_em));

        const laudoObj = temLaudo
          ? {
              id: lote.laudo_id,
              observacoes: lote.observacoes,
              status: lote.status_laudo || (laudoFileExists ? 'emitido' : null),
              emitido_em: lote.emitido_em,
              enviado_em: lote.enviado_em,
              hash_pdf: lote.hash_pdf || laudoHashFromFile || null,
              emissor_nome: lote.emissor_nome || null,
              emissor_cpf: lote.emissor_cpf || null,
              _emitido: laudoEmitido, // Flag auxiliar para facilitar filtros no frontend
            }
          : laudoFileExists
            ? {
                id: lote.laudo_id || lote.id,
                observacoes: lote.observacoes || null,
                status: 'emitido',
                emitido_em: lote.emitido_em || new Date().toISOString(),
                enviado_em: lote.enviado_em || null,
                hash_pdf: lote.hash_pdf || laudoHashFromFile || null,
                emissor_nome: lote.emissor_nome || null,
                emissor_cpf: lote.emissor_cpf || null,
                _emitido: true,
              }
            : null;

        return {
          id: lote.id,
          titulo: lote.titulo,
          tipo: lote.tipo,
          status: lote.lote_status,
          empresa_nome: lote.empresa_nome,
          clinica_nome: lote.clinica_nome,
          liberado_em: lote.liberado_em,
          total_avaliacoes: lote.total_avaliacoes,
          modo_emergencia: lote.modo_emergencia || false,
          solicitado_por: lote.solicitado_por || null,
          solicitado_em: lote.solicitado_em || null,
          tipo_solicitante: lote.tipo_solicitante || null,
          laudo: laudoObj,
        };
      })
    );

    // REMOVIDO: Cálculo de hash na listagem
    // O hash deve ser calculado APENAS na emissão do laudo (endpoint /pdf)
    // Calcular hash a cada listagem é ineficiente e causa erros de arquivos não encontrados

    // Detectar laudos inconsistentes: laudo existente para lote NÃO concluído — não devem existir em sistema
    try {
      const loteIds = lotes.map((l) => l.id);
      if (loteIds.length > 0) {
        const invalid = await query(
          `SELECT l.id AS laudo_id, l.lote_id, la.status AS lote_status
           FROM laudos l
           JOIN lotes_avaliacao la ON la.id = l.lote_id
           WHERE la.id = ANY($1) AND la.status NOT IN ('concluido','finalizado')`,
          [loteIds]
        );

        if (invalid.rows.length > 0) {
          console.warn(
            `[WARN] Laudos inconsistentes detectados (lote não concluído):`,
            invalid.rows
          );

          // Limpeza opcional - habilitar via env var para evitar remoção automática sem aprovação
          if (process.env.CLEANUP_LAUDOS_BEFORE_CONCLUSAO === '1') {
            const fsCleanup = await import('fs/promises');
            const pathCleanup = await import('path');
            for (const r of invalid.rows) {
              try {
                // Remover arquivo local (se existir)
                const localPath = pathCleanup.join(
                  process.cwd(),
                  'storage',
                  'laudos',
                  `laudo-${r.laudo_id}.pdf`
                );
                await fsCleanup.unlink(localPath).catch(() => {});

                // Remover metadados locais
                await fsCleanup
                  .unlink(
                    pathCleanup.join(
                      process.cwd(),
                      'storage',
                      'laudos',
                      `laudo-${r.laudo_id}.json`
                    )
                  )
                  .catch(() => {});

                // Remover registro no banco (operação deliberada)
                await query('DELETE FROM laudos WHERE id = $1', [r.laudo_id]);

                // Registrar notificação administrativa
                await query(
                  `INSERT INTO notificacoes_admin (tipo, mensagem, lote_id, criado_em) VALUES ('cleanup_laudo_invalido', $1, $2, NOW())`,
                  [
                    `Laudo ${r.laudo_id} removido: lote ${r.lote_id} está em status ${r.lote_status}`,
                    r.lote_id,
                  ]
                );

                console.log(
                  `[CLEANUP] Laudo ${r.laudo_id} removido (lote ${r.lote_id} não concluído)`
                );
              } catch (cleanupErr) {
                console.warn(
                  `[WARN] Falha ao remover laudo inconsistente ${r.laudo_id}:`,
                  cleanupErr
                );
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn(
        '[WARN] Falha ao verificar laudos inconsistentes por lote:',
        err instanceof Error ? err.message : String(err)
      );
    }

    // Validar quais lotes podem emitir laudo usando a função SQL
    const lotesComValidacao = [];
    for (const lote of lotes) {
      try {
        const validacao = await query(
          `SELECT * FROM validar_lote_pre_laudo($1)`,
          [lote.id]
        );

        const resultado = validacao.rows[0] || {
          valido: false,
          alertas: ['Erro ao validar lote'],
          funcionarios_pendentes: 0,
          detalhes: {},
        };

        lotesComValidacao.push({
          ...lote,
          pode_emitir_laudo: resultado.valido || false,
          motivos_bloqueio: resultado.alertas || [],
          taxa_conclusao: resultado.detalhes?.taxa_conclusao || 0,
        });
      } catch (validationError) {
        console.error(`Erro ao validar lote ${lote.id}:`, validationError);
        lotesComValidacao.push({
          ...lote,
          pode_emitir_laudo: false,
          motivos_bloqueio: ['Erro ao validar lote'],
          taxa_conclusao: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      lotes: lotesComValidacao,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Erro ao buscar lotes para emissão:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
