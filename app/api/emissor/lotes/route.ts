import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

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
    // Exibe lotes que foram solicitados para emissão OU já têm laudo emitido
    const totalQuery = await query(
      `
      SELECT COUNT(DISTINCT la.id) as total
      FROM lotes_avaliacao la
      LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
      LEFT JOIN laudos l ON l.id = la.id
      WHERE la.status != 'cancelado'
        AND (fe.id IS NOT NULL OR (l.id IS NOT NULL AND l.emitido_em IS NOT NULL))
        AND (la.status_pagamento = 'pago' OR la.status_pagamento IS NULL)
    `,
      []
    );

    const total =
      !totalQuery || !totalQuery.rows || totalQuery.rows.length === 0
        ? 0
        : parseInt(totalQuery.rows[0].total);

    // Buscar lotes paginados (excluindo cancelados)
    // Exibe lotes que foram solicitados para emissão OU já têm laudo emitido
    const lotesQuery = await query(
      `
      SELECT
        la.id,
        la.descricao,
        la.tipo,
        la.status as lote_status,
        la.liberado_em,
        ec.nome as empresa_nome,
        c.nome as clinica_nome,
        COUNT(a.id) as total_avaliacoes,
        l.observacoes,
        l.status as status_laudo,
        l.id as laudo_id,
        l.emitido_em,
        l.enviado_em,
        l.hash_pdf,
        l.emissor_cpf,
        l.arquivo_remoto_key,
        l.arquivo_remoto_url,
        l.arquivo_remoto_uploaded_at,
        f.nome as emissor_nome,
        fe.solicitado_por,
        fe.solicitado_em,
        fe.tipo_solicitante
      FROM lotes_avaliacao la
      LEFT JOIN laudos l ON l.id = la.id
      LEFT JOIN funcionarios f ON l.emissor_cpf = f.cpf
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN clinicas c ON ec.clinica_id = c.id
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
      WHERE la.status != 'cancelado'
        AND (fe.id IS NOT NULL OR (l.id IS NOT NULL AND l.emitido_em IS NOT NULL))
        AND (la.status_pagamento = 'pago' OR la.status_pagamento IS NULL)
      GROUP BY la.id, la.descricao, la.tipo, la.status, la.liberado_em, ec.nome, c.nome, l.observacoes, l.status, l.id, l.emitido_em, l.enviado_em, l.hash_pdf, l.emissor_cpf, l.arquivo_remoto_key, l.arquivo_remoto_url, l.arquivo_remoto_uploaded_at, f.nome, fe.solicitado_por, fe.solicitado_em, fe.tipo_solicitante
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

    const lotes = (lotesQuery.rows || []).map((lote) => {
      // Informações de laudo vêm do banco de dados
      const temLaudo = Boolean(lote.laudo_id);

      // ⚠️ IMPORTANTE: Para o EMISSOR, laudo é considerado 'emitido' quando:
      // - Tem status='emitido' OU 'enviado'
      // Emissor precisa ver laudos emitidos ANTES de enviá-los ao bucket (para revisar e enviar)
      // A validação de bucket é apenas para RH/Entidade (solicitantes)
      const laudoEmitido =
        temLaudo &&
        (lote.status_laudo === 'emitido' || lote.status_laudo === 'enviado');

      const laudoObj = temLaudo
        ? {
            id: lote.laudo_id,
            observacoes: lote.observacoes,
            status: lote.status_laudo || null,
            emitido_em: lote.emitido_em,
            enviado_em: lote.enviado_em,
            hash_pdf: lote.hash_pdf || null,
            emissor_nome: lote.emissor_nome || null,
            emissor_cpf: lote.emissor_cpf || null,
            arquivo_remoto_key: lote.arquivo_remoto_key || null,
            arquivo_remoto_url: lote.arquivo_remoto_url || null,
            arquivo_remoto_uploaded_at: lote.arquivo_remoto_uploaded_at || null,
            _emitido: laudoEmitido,
          }
        : null;

      return {
        id: lote.id,
        descricao: lote.descricao || `Lote #${lote.id}`,
        tipo: lote.tipo,
        status: lote.lote_status,
        empresa_nome: lote.empresa_nome,
        clinica_nome: lote.clinica_nome,
        liberado_em: lote.liberado_em,
        total_avaliacoes: lote.total_avaliacoes,
        solicitado_por: lote.solicitado_por || null,
        solicitado_em: lote.solicitado_em || null,
        tipo_solicitante: lote.tipo_solicitante || null,
        laudo: laudoObj,
      };
    });

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
