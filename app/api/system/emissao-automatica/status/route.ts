import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Monitorar status da emissão automática
export const GET = async (_req: Request) => {
  const user = await requireRole(['admin', 'emissor']);
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    // 1. Verificar emissor ativo único
    const emissores = await query(`
      SELECT cpf, nome, email
      FROM funcionarios
      WHERE perfil = 'emissor' AND ativo = true
    `);

    const emissorStatus = {
      ok: emissores.rows.length === 1,
      total: emissores.rows.length,
      emissor: emissores.rows.length === 1 ? emissores.rows[0] : null,
      erro:
        emissores.rows.length === 0
          ? 'Nenhum emissor ativo no sistema'
          : emissores.rows.length > 1
            ? 'Múltiplos emissores ativos detectados'
            : null,
    };

    // 2. Lotes aguardando emissão (FASE 1)
    const lotesAguardandoEmissao = await query(`
      SELECT 
        la.id, 
        la.codigo, 
        la.titulo, 
        la.status,
        la.auto_emitir_em,
        COALESCE(ec.nome, cont.nome) as empresa_nome,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas
      FROM lotes_avaliacao la
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN contratantes cont ON la.contratante_id = cont.id
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.status = 'concluido'
        AND la.auto_emitir_em <= NOW()
        AND la.auto_emitir_agendado = true
        AND la.id NOT IN (
          SELECT lote_id FROM laudos WHERE status = 'enviado'
        )
      GROUP BY la.id, la.codigo, la.titulo, la.status, la.auto_emitir_em, ec.nome, cont.nome
      ORDER BY la.auto_emitir_em ASC
    `);

    // 3. Laudos aguardando envio (FASE 2)
    const laudosAguardandoEnvio = await query(`
      SELECT 
        l.id as laudo_id,
        l.lote_id,
        l.emitido_em,
        l.hash_pdf,
        la.codigo,
        la.titulo,
        COALESCE(ec.nome, cont.nome) as empresa_nome
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN contratantes cont ON la.contratante_id = cont.id
    AND l.status IN ('emitido', 'enviado')
        AND la.laudo_enviado_em IS NULL
      ORDER BY l.emitido_em ASC
    `);

    // Filtrar somente laudos que possuem arquivo local existente em storage/laudos
    const fs = await import('fs/promises');
    const path = await import('path');
    const laudosFiltrados: any[] = [];
    for (const row of laudosAguardandoEnvio.rows) {
      const filePath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        `laudo-${row.laudo_id}.pdf`
      );
      try {
        await fs.access(filePath);
        laudosFiltrados.push(row);
      } catch {
        // arquivo ausente — ignorar (será necessário reemitir ou investigar)
        console.warn(
          `[STATUS] Arquivo local ausente para laudo ${row.laudo_id}: ${filePath}`
        );
      }
    }

    // Substituir pela lista filtrada para o response
    const lotesAgendadosFuturo = await query(`
      SELECT 
        la.id,
        la.codigo,
        la.titulo,
        la.status,
        la.auto_emitir_em,
        COALESCE(ec.nome, cont.nome) as empresa_nome,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas
      FROM lotes_avaliacao la
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN contratantes cont ON la.contratante_id = cont.id
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.status IN ('pendente', 'concluido')
        AND la.auto_emitir_em > NOW()
        AND la.auto_emitir_agendado = true
      GROUP BY la.id, la.codigo, la.titulo, la.status, la.auto_emitir_em, ec.nome, cont.nome
      ORDER BY la.auto_emitir_em ASC
      LIMIT 10
    `);

    // 5. Últimas emissões automáticas (últimas 24h)
    const ultimasEmissoes = await query(`
      SELECT 
        al.lote_id,
        al.laudo_id,
        al.emissor_cpf,
        al.emissor_nome,
        al.acao,
        al.status,
        al.criado_em,
        la.codigo,
        ec.nome as empresa_nome
      FROM auditoria_laudos al
      JOIN lotes_avaliacao la ON al.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      WHERE al.acao IN ('emissao_automatica', 'envio_automatico', 'emissao_automatica_erro', 'envio_automatico_erro')
        AND al.criado_em >= NOW() - INTERVAL '24 hours'
      ORDER BY al.criado_em DESC
      LIMIT 20
    `);

    // 6. Erros recentes (últimas 24h)
    const errosRecentes = await query(`
      SELECT 
        na.id,
        na.tipo,
        na.mensagem,
        na.lote_id,
        na.criado_em,
        la.codigo
      FROM notificacoes_admin na
      LEFT JOIN lotes_avaliacao la ON na.lote_id = la.id
      WHERE na.tipo IN ('sem_emissor', 'multiplos_emissores', 'erro_emissao_auto', 'erro_envio_auto')
        AND na.criado_em >= NOW() - INTERVAL '24 hours'
      ORDER BY na.criado_em DESC
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      emissor: emissorStatus,
      fila: {
        fase1_aguardando_emissao: {
          total: lotesAguardandoEmissao.rows.length,
          lotes: lotesAguardandoEmissao.rows,
        },
        fase2_aguardando_envio: {
          total: laudosFiltrados.length,
          laudos: laudosFiltrados,
        },
        agendados_futuro: {
          total: lotesAgendadosFuturo.rows.length,
          lotes: lotesAgendadosFuturo.rows,
        },
      },
      historico: {
        ultimas_emissoes: ultimasEmissoes.rows,
        erros_recentes: errosRecentes.rows,
      },
    });
  } catch (error) {
    console.error('[GET /api/system/emissao-automatica/status] Erro:', error);
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
