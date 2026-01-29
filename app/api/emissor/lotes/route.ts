import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validarLotesParaLaudo } from '@/lib/validacao-lote-laudo';

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
    const totalQuery = await query(
      `
      SELECT COUNT(*) as total
      FROM lotes_avaliacao la
      WHERE la.status != 'cancelado'
    `,
      []
    );

    const total =
      !totalQuery || !totalQuery.rows || totalQuery.rows.length === 0
        ? 0
        : parseInt(totalQuery.rows[0].total);

    // Buscar lotes paginados (excluindo cancelados)
    const lotesQuery = await query(
      `
      SELECT
        la.id,
        la.codigo,
        la.titulo,
        la.tipo,
        la.status as lote_status,
        la.liberado_em,
        la.auto_emitir_em,
        la.modo_emergencia,
        COALESCE(ec.nome, cont.nome) as empresa_nome,
        COALESCE(c.nome, cont.nome) as clinica_nome,
        COUNT(a.id) as total_avaliacoes,
        l.observacoes,
        l.status as status_laudo,
        l.id as laudo_id,
        l.emitido_em,
        l.enviado_em,
        l.hash_pdf
      FROM lotes_avaliacao la
      LEFT JOIN laudos l ON l.id = la.id
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN clinicas c ON ec.clinica_id = c.id
      LEFT JOIN contratantes cont ON la.contratante_id = cont.id
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.status != 'cancelado'
      GROUP BY la.id, la.codigo, la.titulo, la.tipo, la.status, la.liberado_em, la.auto_emitir_em, la.modo_emergencia, ec.nome, c.nome, cont.nome, l.observacoes, l.status, l.id, l.emitido_em, l.enviado_em, l.hash_pdf
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
      let previsaoEmissao = null;
      if (lote.auto_emitir_em) {
        const data = new Date(lote.auto_emitir_em);
        previsaoEmissao = {
          data: data.toISOString(),
          formatada: data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      }

      // Atenção: um laudo SÓ é considerado válido/exibido se o lote estiver em 'concluido' ou 'finalizado'.
      // Isso evita tratar laudos inexistentes antes da conclusão do lote — estado inválido/dados inconsistentes
      const loteFinalizado = ['concluido', 'finalizado'].includes(
        lote.lote_status
      );

      return {
        id: lote.id,
        codigo: lote.codigo,
        titulo: lote.titulo,
        tipo: lote.tipo,
        status: lote.lote_status,
        empresa_nome: lote.empresa_nome,
        clinica_nome: lote.clinica_nome,
        liberado_em: lote.liberado_em,
        total_avaliacoes: lote.total_avaliacoes,
        emissao_automatica: lote.auto_emitir_em ? true : false,
        previsao_emissao: previsaoEmissao,
        processamento_em: lote.processamento_em || null,
        modo_emergencia: lote.modo_emergencia || false,
        laudo:
          lote.laudo_id && loteFinalizado
            ? {
                id: lote.laudo_id,
                observacoes: lote.observacoes,
                status:
                  lote.status_laudo === 'rascunho'
                    ? 'enviado'
                    : lote.status_laudo,
                emitido_em: lote.emitido_em,
                enviado_em: lote.enviado_em,
                hash_pdf: lote.hash_pdf,
              }
            : null,
      };
    });

    // Fallback: se laudo existe (e lote for concluído) mas hash não está no DB, tentar calcular a partir do arquivo
    await Promise.all(
      lotes.map(async (lote) => {
        if (lote.laudo?.id && !lote.laudo.hash_pdf) {
          // segurança extra: garantir que lote esteja de fato finalizado (evitar trabalhar com laudos em estado inválido)
          if (!['concluido', 'finalizado'].includes(lote.status)) return;

          // Se SKIP_LAUDO_HASH ativo, pular este processo de recalculo
          const shouldSkipHash =
            process.env.SKIP_LAUDO_HASH === '1' ||
            process.env.SKIP_LAUDO_HASH === 'true';
          if (shouldSkipHash) {
            console.log(
              `[DEBUG] SKIP_LAUDO_HASH ativo — pulando recalculo de hash para laudo ${lote.laudo.id}`
            );
            return;
          }

          try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const crypto = await import('crypto');
            const filePath = path.join(
              process.cwd(),
              'storage',
              'laudos',
              `laudo-${lote.laudo.id}.pdf`
            );
            const buf = await fs.readFile(filePath);
            const h = crypto.createHash('sha256').update(buf).digest('hex');
            try {
              await query(
                `UPDATE laudos SET hash_pdf = $2, atualizado_em = NOW() WHERE id = $1 AND (hash_pdf IS NULL OR hash_pdf = '')`,
                [lote.laudo.id, h]
              );
              lote.laudo.hash_pdf = h;
            } catch (dbErr: any) {
              // Tratamento especial para trigger de imutabilidade (não tentar sobrescrever laudos emitidos)
              if (
                dbErr &&
                (dbErr.code === '23506' ||
                  /imutabil/i.test(String(dbErr.message || '')))
              ) {
                console.warn(
                  `[WARN] Não foi possível persistir hash para laudo ${lote.laudo.id} devido a imutabilidade (ignorado): ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`
                );
              } else {
                throw dbErr;
              }
            }
          } catch (err) {
            // se arquivo não existir, ignorar — a geração normal cuidará disso
            console.warn(
              `Não foi possível calcular hash para laudo ${lote.laudo?.id}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }
      })
    );

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
            const fs = await import('fs/promises');
            const path = await import('path');
            for (const r of invalid.rows) {
              try {
                // Remover arquivo local (se existir)
                const localPath = path.join(
                  process.cwd(),
                  'storage',
                  'laudos',
                  `laudo-${r.laudo_id}.pdf`
                );
                await fs.unlink(localPath).catch(() => {});

                // Remover metadados locais
                await fs
                  .unlink(
                    path.join(
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

    // Validar quais lotes podem emitir laudo
    const loteIds = lotes.map((l) => l.id);
    const validacoes = await validarLotesParaLaudo(loteIds);

    // Adicionar informações de validação aos lotes
    const lotesComValidacao = lotes.map((lote) => {
      const validacao = validacoes.get(lote.id);
      return {
        ...lote,
        pode_emitir_laudo: validacao?.pode_emitir_laudo || false,
        motivos_bloqueio: validacao?.motivos_bloqueio || [],
        taxa_conclusao: validacao?.detalhes.taxa_conclusao || 0,
      };
    });

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
