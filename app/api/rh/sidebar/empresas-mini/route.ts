import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireClinica } from '@/lib/session';

export const dynamic = 'force-dynamic';

export type EmpresaMiniStatusIcon =
  | 'ok'
  | 'atencao'
  | 'critico'
  | 'inativo'
  | 'sem_lote';

export interface EmpresaMini {
  id: number;
  nome: string;
  status_icon: EmpresaMiniStatusIcon;
}

interface EmpresaMiniRow {
  id: number;
  nome: string;
  lote_status: string | null;
  status_pagamento: string | null;
  dias_lote: number | null;
  solicitacao_emissao_em: string | null;
}

function calcularStatusIcon(row: EmpresaMiniRow): EmpresaMiniStatusIcon {
  if (!row.lote_status) return 'sem_lote';

  const status = row.lote_status;
  const pagamento = row.status_pagamento;
  const diasLote = row.dias_lote ?? 0;

  // Crítico: lote parado há muitos dias, ou pagamento atrasado
  if (status === 'emissao_solicitada' && diasLote > 7) return 'critico';
  if (pagamento === 'aguardando_pagamento' && diasLote > 10) return 'critico';
  if (status === 'cancelado') return 'critico';

  // Atenção: em emissão ou aguardando pagamento
  if (status === 'emissao_solicitada' || status === 'emissao_em_andamento')
    return 'atencao';
  if (pagamento === 'aguardando_pagamento') return 'atencao';

  // OK: finalizado, laudo emitido, rascunho ou ativo
  if (
    status === 'finalizado' ||
    status === 'laudo_emitido' ||
    status === 'ativo' ||
    status === 'rascunho'
  ) {
    return 'ok';
  }

  return 'inativo';
}

/**
 * GET /api/rh/sidebar/empresas-mini
 * Retorna lista leve de empresas para o sidebar com status health icon.
 * Sem dados pesados — apenas id, nome, status resumido.
 */
export async function GET() {
  let session;
  try {
    session = await requireClinica();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Clínica não identificada';
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const clinicaId = session.clinica_id!;

  try {
    const result = await query<EmpresaMiniRow>(
      `
      SELECT
        ec.id,
        ec.nome,
        la.status       AS lote_status,
        la.status_pagamento,
        la.solicitacao_emissao_em::text,
        EXTRACT(EPOCH FROM (NOW() - COALESCE(la.solicitacao_emissao_em, la.liberado_em, la.criado_em))) / 86400 AS dias_lote
      FROM empresas_clientes ec
      LEFT JOIN LATERAL (
        SELECT status, status_pagamento, solicitacao_emissao_em, liberado_em, criado_em
        FROM lotes_avaliacao
        WHERE empresa_id = ec.id
        ORDER BY numero_ordem DESC
        LIMIT 1
      ) la ON true
      WHERE ec.ativa = true
        AND (
          ec.clinica_id = $1
          OR EXISTS (
            SELECT 1 FROM funcionarios_clinicas fc
            WHERE fc.empresa_id = ec.id AND fc.clinica_id = $1
          )
        )
      ORDER BY ec.nome
      `,
      [clinicaId],
      session
    );

    const empresas: EmpresaMini[] = result.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      status_icon: calcularStatusIcon(row),
    }));

    return NextResponse.json({ empresas });
  } catch (err) {
    console.error('[sidebar/empresas-mini] erro:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
