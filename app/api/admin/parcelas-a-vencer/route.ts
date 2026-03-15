/**
 * GET /api/admin/parcelas-a-vencer — lista parcelas pendentes de pagamentos parcelados (admin)
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  normalizarDetalhesParcelas,
  type Parcela,
} from '@/lib/parcelas-helper';

export const dynamic = 'force-dynamic';

interface ParcelaJsonb {
  numero: number;
  valor: number;
  data_vencimento: string;
  pago: boolean;
  data_pagamento: string | null;
  status?: 'pago' | 'pendente' | 'cancelado';
}

export async function GET() {
  try {
    await requireRole('admin', false);

    // Buscar pagamentos parcelados com detalhes_parcelas
    const result = await query<{
      pagamento_id: number;
      entidade_id: number | null;
      clinica_id: number | null;
      valor: string;
      numero_parcelas: number;
      detalhes_parcelas: ParcelaJsonb[] | string;
      status: string;
      metodo: string | null;
      criado_em: string;
      entidade_nome: string | null;
      entidade_cnpj: string | null;
      lote_id: number | null;
    }>(
      // DISTINCT ON garante apenas o pagamento mais recente por lote,
      // evitando duplicatas quando múltiplos pagamentos existem para o mesmo lote.
      `SELECT DISTINCT ON (COALESCE((p.dados_adicionais->>'lote_id')::int, -p.id))
         p.id AS pagamento_id,
         p.entidade_id,
         p.clinica_id,
         p.valor,
         p.numero_parcelas,
         p.detalhes_parcelas,
         p.status,
         p.metodo,
         p.criado_em,
         COALESCE(e.nome, cl.nome) AS entidade_nome,
         COALESCE(e.cnpj, cl.cnpj) AS entidade_cnpj,
         COALESCE((p.dados_adicionais->>'lote_id')::int, la.id) AS lote_id
       FROM pagamentos p
       LEFT JOIN entidades e ON e.id = p.entidade_id
       LEFT JOIN clinicas cl ON cl.id = p.clinica_id
       LEFT JOIN LATERAL (
         SELECT id FROM lotes_avaliacao
         WHERE (p.clinica_id IS NOT NULL AND clinica_id = p.clinica_id)
            OR (p.entidade_id IS NOT NULL AND entidade_id = p.entidade_id)
         ORDER BY id DESC
         LIMIT 1
       ) la ON true
       WHERE p.numero_parcelas > 1
         AND p.detalhes_parcelas IS NOT NULL
       ORDER BY COALESCE((p.dados_adicionais->>'lote_id')::int, -p.id), p.criado_em DESC`
    );

    const parcelas: {
      pagamento_id: number;
      entidade_nome: string;
      entidade_cnpj: string;
      lote_id: number | null;
      valor_total: number;
      valor_parcela: number;
      parcela_numero: number;
      total_parcelas: number;
      data_vencimento: string;
      metodo: string | null;
      vencida: boolean;
      dias_para_vencimento: number;
    }[] = [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const row of result.rows) {
      let detalhes: ParcelaJsonb[];
      try {
        detalhes =
          typeof row.detalhes_parcelas === 'string'
            ? JSON.parse(row.detalhes_parcelas)
            : row.detalhes_parcelas;
      } catch {
        continue;
      }

      if (!Array.isArray(detalhes)) continue;

      // Normaliza stale: pagamento confirmado mas detalhes_parcelas nunca atualizado pelo webhook
      detalhes = normalizarDetalhesParcelas(
        detalhes as unknown as Parcela[],
        row.status,
        null
      ) as ParcelaJsonb[];

      for (const parcela of detalhes) {
        // Filtrar apenas parcelas pendentes (não pagas)
        const isPendente =
          !parcela.pago && (!parcela.status || parcela.status === 'pendente');
        if (!isPendente) continue;

        const vencimento = new Date(parcela.data_vencimento);
        vencimento.setHours(0, 0, 0, 0);
        const diffMs = vencimento.getTime() - hoje.getTime();
        const diasParaVencimento = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        parcelas.push({
          pagamento_id: row.pagamento_id,
          entidade_nome: row.entidade_nome || 'N/A',
          entidade_cnpj: row.entidade_cnpj || '',
          lote_id: row.lote_id,
          valor_total: parseFloat(row.valor),
          valor_parcela: parcela.valor,
          parcela_numero: parcela.numero,
          total_parcelas: row.numero_parcelas,
          data_vencimento: parcela.data_vencimento,
          metodo: row.metodo,
          vencida: diasParaVencimento < 0,
          dias_para_vencimento: diasParaVencimento,
        });
      }
    }

    // Ordenar: vencidas primeiro, depois por data de vencimento mais próxima
    parcelas.sort((a, b) => a.dias_para_vencimento - b.dias_para_vencimento);

    return NextResponse.json({ parcelas, total: parcelas.length });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/admin/parcelas-a-vencer]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
