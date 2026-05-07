import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { withTransaction } from '@/lib/db-transaction';
import { requireRole } from '@/lib/session';
import { StatusAvaliacao } from '@/lib/types/avaliacao-status';
import { StatusLote } from '@/lib/types/lote-status';

export const dynamic = 'force-dynamic';

async function updateLotesStatus(cpf: string) {
  // Buscar lotes que têm avaliações deste funcionário
  const lotesResult = await query(
    `
    SELECT DISTINCT la.id, la.status
    FROM lotes_avaliacao la
    JOIN avaliacoes a ON la.id = a.lote_id
    WHERE a.funcionario_cpf = $1
  `,
    [cpf]
  );

  console.log(
    `[INFO] Atualizando ${lotesResult.rowCount} lotes afetados pelo funcionário ${cpf}`
  );

  for (const lote of lotesResult.rows) {
    // Recalcular status do lote baseado na fórmula 70%
    // liberadas = status NOT IN ('rascunho', 'inativada')
    // threshold = FLOOR(0.7 * liberadas)
    const statsResult = await query(
      `
      SELECT
        COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada')) as liberadas,
        COUNT(*) FILTER (WHERE a.status = $1) as concluidas
      FROM avaliacoes a
      WHERE a.lote_id = $2
    `,
      [StatusAvaliacao.CONCLUIDA, lote.id]
    );

    const { liberadas, concluidas } = statsResult.rows[0];
    const liberadasNum = parseInt(liberadas) || 0;
    const concluidasNum = parseInt(concluidas) || 0;

    console.log(
      `[DEBUG] Lote ${lote.id}: ${liberadasNum} liberadas, ${concluidasNum} concluídas, status atual: ${lote.status}`
    );

    // Não alterar status manuais (cancelado, finalizado)
    if ([StatusLote.CANCELADO, StatusLote.FINALIZADO].includes(lote.status)) {
      console.log(
        `[INFO] Lote ${lote.id} possui status manual '${lote.status}', não será alterado`
      );
      continue;
    }

    // Calcular novo status baseado nas avaliações (fórmula 70%)
    let novoStatus = StatusLote.ATIVO;
    if (liberadasNum === 0) {
      novoStatus = StatusLote.RASCUNHO; // Nenhuma avaliação liberada
    } else if (concluidasNum >= Math.floor(0.7 * liberadasNum)) {
      novoStatus = StatusLote.CONCLUIDO; // 70% ou mais concluídas
    }

    if (novoStatus !== lote.status) {
      // Atualizar status do lote
      await query('UPDATE lotes_avaliacao SET status = $1 WHERE id = $2', [
        novoStatus,
        lote.id,
      ]);
      console.log(
        `[INFO] Lote ${lote.id} alterado de '${lote.status}' para '${novoStatus}'`
      );

      if (novoStatus === StatusLote.CONCLUIDO) {
        // REMOVIDO: Emissão automática de laudo
        // pronto para solicitação de emissão manual pelo RH/Entidade
        console.log(
          `[INFO] Lote ${lote.id} está concluído e pronto para solicitação de emissão manual`
        );
      }
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole('rh');
    const body = await request.json();
    const { cpfs, ativo } = body;

    if (
      !Array.isArray(cpfs) ||
      cpfs.length === 0 ||
      typeof ativo !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Lista de CPFs e status ativo são obrigatórios' },
        { status: 400 }
      );
    }

    // Limite de segurança: máximo 50 funcionários por operação
    if (cpfs.length > 50) {
      return NextResponse.json(
        { error: 'Operação limitada a 50 funcionários por vez' },
        { status: 400 }
      );
    }

    // clinica_id vem da sessão — a coluna foi removida de funcionarios na migration 605
    const clinicaId = session.clinica_id;
    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não identificada na sessão do RH' },
        { status: 500 }
      );
    }

    // empresa_id opcional: escopa a operação para uma empresa específica da clínica
    const { empresa_id: empresaId } = body ?? {};

    // Verificar se todos os funcionários têm vínculo com a clínica (escopo por empresa se fornecida)
    const placeholders = cpfs.map((_, i) => `$${i + 1}`).join(',');
    const funcResult = empresaId
      ? await query(
          `SELECT DISTINCT f.cpf, fc.ativo as vinculo_ativo
           FROM funcionarios f
           INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
           WHERE f.cpf IN (${placeholders})
             AND fc.clinica_id = $${cpfs.length + 1}
             AND fc.empresa_id = $${cpfs.length + 2}`,
          [...cpfs, clinicaId, empresaId]
        )
      : await query(
          `SELECT DISTINCT f.cpf, fc.ativo as vinculo_ativo
           FROM funcionarios f
           INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
           WHERE f.cpf IN (${placeholders})
             AND fc.clinica_id = $${cpfs.length + 1}`,
          [...cpfs, clinicaId]
        );

    if (funcResult.rows.length !== cpfs.length) {
      return NextResponse.json(
        {
          error:
            'Um ou mais funcionários não foram encontrados ou não pertencem à sua clínica',
        },
        { status: 404 }
      );
    }

    // Filtrar apenas os que precisam ser atualizados (compara vinculo_ativo, não global)
    const cpfsParaAtualizar = funcResult.rows
      .filter((func) => func.vinculo_ativo !== ativo)
      .map((func) => func.cpf as string);

    if (cpfsParaAtualizar.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os funcionários já estão no status desejado',
      });
    }

    const totalAtualizado = await withTransaction(async (client) => {
      const updPlaceholders = cpfsParaAtualizar
        .map((_, i) => `$${i + 1}`)
        .join(',');

      // Atualizar funcionarios_clinicas — status segregado por empresa/clínica
      if (empresaId) {
        await client.query(
          `UPDATE funcionarios_clinicas fc
           SET ativo = $${cpfsParaAtualizar.length + 1}, atualizado_em = NOW()
           FROM funcionarios f
           WHERE fc.funcionario_id = f.id
             AND f.cpf IN (${updPlaceholders})
             AND fc.clinica_id = $${cpfsParaAtualizar.length + 2}
             AND fc.empresa_id = $${cpfsParaAtualizar.length + 3}`,
          [...cpfsParaAtualizar, ativo, clinicaId, empresaId]
        );
      } else {
        await client.query(
          `UPDATE funcionarios_clinicas fc
           SET ativo = $${cpfsParaAtualizar.length + 1}, atualizado_em = NOW()
           FROM funcionarios f
           WHERE fc.funcionario_id = f.id
             AND f.cpf IN (${updPlaceholders})
             AND fc.clinica_id = $${cpfsParaAtualizar.length + 2}`,
          [...cpfsParaAtualizar, ativo, clinicaId]
        );
      }

      // Se inativando: marcar avaliações como inativadas (escopadas por empresa se fornecida)
      if (!ativo) {
        for (const cpf of cpfsParaAtualizar) {
          if (empresaId) {
            const r = await client.query(
              `UPDATE avaliacoes a
               SET status = $1
               FROM lotes_avaliacao la
               WHERE a.lote_id = la.id
                 AND a.funcionario_cpf = $2
                 AND la.empresa_id = $3
                 AND a.status NOT IN ('concluida', 'concluido', 'inativada')
               RETURNING a.id`,
              [StatusAvaliacao.INATIVADA, cpf, empresaId]
            );
            console.log(
              `[INFO] Inativadas ${r.rowCount} avaliações do funcionário ${cpf} (empresa ${empresaId})`
            );
          } else {
            const r = await client.query(
              `UPDATE avaliacoes a
               SET status = $1
               FROM lotes_avaliacao la
               INNER JOIN empresas_clientes ec ON la.empresa_id = ec.id
               WHERE a.lote_id = la.id
                 AND a.funcionario_cpf = $2
                 AND ec.clinica_id = $3
                 AND a.status NOT IN ('concluida', 'concluido', 'inativada')
               RETURNING a.id`,
              [StatusAvaliacao.INATIVADA, cpf, clinicaId]
            );
            console.log(
              `[INFO] Inativadas ${r.rowCount} avaliações do funcionário ${cpf} (clínica ${clinicaId})`
            );
          }
        }
      }

      return cpfsParaAtualizar.length;
    });

    // Atualizar status dos lotes afetados
    for (const cpf of cpfsParaAtualizar) {
      await updateLotesStatus(cpf);
    }

    return NextResponse.json({
      success: true,
      message: ativo
        ? `${totalAtualizado} funcionário(s) reativado(s) com sucesso.`
        : `${totalAtualizado} funcionário(s) desligado(s) da empresa. Avaliações não concluídas foram marcadas como inativadas, mas dados e histórico foram preservados.`,
    });
  } catch (error) {
    console.error('Erro na operação em lote:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
