import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/laudos/[laudoId]
 *
 * Retorna o detalhe completo de um laudo para a cadeia de custódia.
 * Admin NÃO tem acesso a dados pessoais de funcionários (CPF, nome, respostas).
 * A timeline expõe apenas IDs de avaliação e seus status finais.
 */
export async function GET(
  _request: Request,
  { params }: { params: { laudoId: string } }
) {
  try {
    await requireRole('admin');

    const laudoId = parseInt(params.laudoId, 10);
    if (isNaN(laudoId) || laudoId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // ── 1. Dados do laudo + lote + tomador ────────────────────────────────
    const laudoResult = await query(
      `
      SELECT
        ld.id                                    AS laudo_id,
        ld.status,
        ld.hash_pdf,
        ld.observacoes,
        ld.criado_em,
        ld.emitido_em,
        ld.enviado_em,
        ld.atualizado_em,
        ld.arquivo_remoto_uploaded_at,
        -- Emissor
        ld.emissor_cpf,
        COALESCE(f_em.nome, ld.emissor_cpf)      AS emissor_nome,
        -- arquivo (tamanho KB)
        CASE
          WHEN ld.arquivo_remoto_url IS NOT NULL
          THEN COALESCE(ld.arquivo_remoto_size / 1024, 0)
          ELSE NULL
        END                                       AS tamanho_pdf_kb,
        CASE
          WHEN ld.arquivo_remoto_url IS NOT NULL THEN true ELSE false
        END                                       AS tem_arquivo_pdf,
        -- Lote
        l.id                                      AS lote_id,
        l.status                                  AS lote_status,
        l.tipo                                    AS lote_tipo,
        l.liberado_em,
        l.liberado_por,
        l.finalizado_em,
        l.solicitacao_emissao_em,
        l.pago_em,
        COALESCE(f_lib.nome, l.liberado_por)      AS liberado_por_nome,
        -- CPF de quem liberou o lote (armazenado diretamente em liberado_por)
        l.liberado_por                            AS rh_cpf,
        -- Tomador
        COALESCE(ent.nome, c.nome)                 AS tomador_nome,
        COALESCE(ent.cnpj, c.cnpj)                AS tomador_cnpj,
        CASE
          WHEN l.clinica_id IS NOT NULL THEN 'clinica'
          ELSE 'entidade'
        END                                       AS tomador_tipo,
        -- Empresa (cliente da clínica)
        ec.nome                                   AS empresa_nome
      FROM laudos ld
      JOIN lotes_avaliacao l ON l.id = ld.lote_id
      LEFT JOIN funcionarios  f_em  ON f_em.cpf  = ld.emissor_cpf
      LEFT JOIN funcionarios  f_lib ON f_lib.cpf = l.liberado_por
      LEFT JOIN clinicas      c     ON c.id  = l.clinica_id
      LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
      LEFT JOIN entidades     ent   ON ent.id = l.entidade_id
      WHERE ld.id = $1
      `,
      [laudoId]
    );

    if (laudoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Laudo não encontrado' },
        { status: 404 }
      );
    }

    const laudo = laudoResult.rows[0];

    // ── 2. Avaliações do lote — somente ID e status (sem dados pessoais) ──
    const avaliacoesResult = await query(
      `
      SELECT
        a.id            AS avaliacao_id,
        a.status,
        a.funcionario_cpf,
        a.inicio        AS iniciada_em,
        a.envio         AS concluida_em,
        a.atualizado_em AS atualizado_em
      FROM avaliacoes a
      WHERE a.lote_id = $1
      ORDER BY a.id
      `,
      [laudo.lote_id]
    );

    // ── 3. Eventos de auditoria_laudos (emissão, envio, erros) ───────────
    const auditoriaLaudosResult = await query(
      `
      SELECT
        al.acao,
        al.status        AS status_evento,
        al.observacoes,
        al.ip_address,
        al.emissor_nome,
        al.emissor_cpf,
        al.criado_em
      FROM auditoria_laudos al
      WHERE al.laudo_id = $1
      ORDER BY al.criado_em ASC
      `,
      [laudoId]
    );

    // ── 3b. Eventos relacionados à solicitação de emissão ───────────────
    const solicitacaoEmissaoResult =
      laudo.solicitacao_emissao_em &&
      auditoriaLaudosResult.rows.find((ev) => {
        // Procura evento de emissão mais próximo ao timestamp de solicitação (até 30 segundos)
        const diff = Math.abs(
          new Date(ev.criado_em).getTime() -
            new Date(laudo.solicitacao_emissao_em).getTime()
        );
        return diff < 30000 && ev.acao.includes('emissao'); // 30 segundos de tolerância
      });

    // ── 4. Monta timeline ordenada por timestamp ──────────────────────────
    type RawEvent = {
      tipo: 'lote' | 'avaliacao' | 'laudo' | 'envio';
      label: string;
      timestamp: string;
      actor?: string;
      ip?: string;
      detalhe?: string;
    };

    const timeline: RawEvent[] = [];

    // Liberação do lote
    if (laudo.liberado_em) {
      timeline.push({
        tipo: 'lote',
        label: 'Ciclo liberado',
        timestamp: laudo.liberado_em,
        actor: laudo.rh_cpf || undefined,
      });
    }

    // Avaliações concluídas (sem inativadas)
    for (const av of avaliacoesResult.rows) {
      if (av.status === 'concluida' && av.concluida_em) {
        timeline.push({
          tipo: 'avaliacao',
          label: `Avaliação #${av.avaliacao_id} concluída`,
          timestamp: av.concluida_em,
          actor: av.funcionario_cpf ?? undefined,
        });
      }
    }

    // Finalização do lote
    if (laudo.finalizado_em) {
      timeline.push({
        tipo: 'lote',
        label: 'Lote finalizado',
        timestamp: laudo.finalizado_em,
        actor: laudo.rh_cpf || undefined,
      });
    }

    // Solicitação de emissão
    if (laudo.solicitacao_emissao_em) {
      const solicitadorCpf =
        solicitacaoEmissaoResult?.emissor_cpf ||
        laudo.rh_cpf ||
        laudo.emissor_cpf ||
        undefined;

      timeline.push({
        tipo: 'laudo',
        label: 'Solicitação de emissão',
        timestamp: laudo.solicitacao_emissao_em,
        actor: solicitadorCpf,
      });
    }

    // Pagamento
    if (laudo.pago_em) {
      timeline.push({
        tipo: 'laudo',
        label: 'Pagamento confirmado',
        timestamp: laudo.pago_em,
        actor: laudo.emissor_cpf ?? undefined,
      });
    }

    // Eventos de auditoria_laudos (emissão, envio ao Backblaze, erros)
    for (const ev of auditoriaLaudosResult.rows) {
      const labelMap: Record<string, string> = {
        emissao_automatica: 'Laudo emitido (automático)',
        emissao_manual: 'Laudo emitido (manual)',
        envio_automatico: 'Laudo enviado ao Backblaze (automático)',
        envio_manual: 'Laudo enviado ao Backblaze (manual)',
        reprocessamento_manual: 'Reprocessamento manual solicitado',
        erro: 'Erro registrado no processamento',
      };
      timeline.push({
        tipo:
          ev.acao === 'envio_automatico' || ev.acao === 'envio_manual'
            ? 'envio'
            : 'laudo',
        label: labelMap[ev.acao] ?? ev.acao,
        timestamp: ev.criado_em,
        actor: ev.emissor_cpf ?? ev.emissor_nome ?? undefined,
        ip: ev.ip_address ?? undefined,
        detalhe: ev.observacoes ?? undefined,
      });
    }

    // Fallback: usa timestamps do próprio laudo se auditoria_laudos vazio
    if (auditoriaLaudosResult.rows.length === 0) {
      if (laudo.emitido_em) {
        timeline.push({
          tipo: 'laudo',
          label: 'Laudo emitido',
          timestamp: laudo.emitido_em,
          actor: laudo.emissor_cpf ?? laudo.emissor_nome ?? undefined,
        });
      }
      if (laudo.enviado_em) {
        timeline.push({
          tipo: 'envio',
          label: 'Laudo enviado ao Backblaze',
          timestamp: laudo.enviado_em,
          actor: laudo.emissor_cpf ?? laudo.emissor_nome ?? undefined,
        });
      }
    }

    // Envio ao bucket (arquivo_remoto_uploaded_at no registro do laudo)
    if (laudo.arquivo_remoto_uploaded_at) {
      timeline.push({
        tipo: 'envio',
        label: 'Arquivo enviado ao bucket',
        timestamp: laudo.arquivo_remoto_uploaded_at,
        actor: laudo.emissor_cpf || undefined,
      });
    }

    // Ordenar cronologicamente
    timeline.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // ── 5. Contagem de avaliações concluídas ─────────────────────────────
    const concluidas = avaliacoesResult.rows.filter(
      (av) => av.status === 'concluida'
    ).length;

    const response = {
      success: true,
      laudo: {
        laudo_id: laudo.laudo_id,
        status: laudo.status,
        hash_pdf: laudo.hash_pdf,
        observacoes: laudo.observacoes,
        criado_em: laudo.criado_em,
        emitido_em: laudo.emitido_em,
        enviado_em: laudo.enviado_em,
        tamanho_pdf_kb: laudo.tamanho_pdf_kb,
        tem_arquivo_pdf: laudo.tem_arquivo_pdf,
        emissor_nome: laudo.emissor_nome,
        emissor_cpf: laudo.emissor_cpf,
        arquivo_remoto_uploaded_at: laudo.arquivo_remoto_uploaded_at,
      },
      lote: {
        lote_id: laudo.lote_id,
        status: laudo.lote_status,
        tipo: laudo.lote_tipo,
        liberado_em: laudo.liberado_em,
        liberado_por_nome: laudo.liberado_por_nome,
        liberado_por_cpf: laudo.rh_cpf,
        solicitacao_emissao_em: laudo.solicitacao_emissao_em,
        pago_em: laudo.pago_em,
      },
      tomador: {
        nome: laudo.tomador_nome,
        cnpj: laudo.tomador_cnpj,
        tipo: laudo.tomador_tipo,
      },
      empresa_nome: laudo.empresa_nome ?? null,
      avaliacoes_resumo: {
        concluidas,
      },
      timeline,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar detalhe do laudo:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
