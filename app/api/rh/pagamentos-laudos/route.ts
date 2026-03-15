import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import {
  normalizarDetalhesParcelas,
  type Parcela,
} from '@/lib/parcelas-helper';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const session = await requireRole(['rh']);

    let clinicaId = session.clinica_id;
    let entidadeId = session.entidade_id;

    if (!clinicaId && !entidadeId) {
      const vinculoClinicaRes = await query(
        `SELECT fc.clinica_id 
         FROM funcionarios f
         INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
         WHERE f.cpf = $1 AND f.ativo = true AND fc.ativo = true
         LIMIT 1`,
        [session.cpf]
      );

      if (vinculoClinicaRes.rows.length > 0) {
        clinicaId = vinculoClinicaRes.rows[0].clinica_id;
      } else {
        const vinculoEntidadeRes = await query(
          `SELECT fe.entidade_id 
           FROM funcionarios f
           INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
           WHERE f.cpf = $1 AND f.ativo = true AND fe.ativo = true
           LIMIT 1`,
          [session.cpf]
        );

        if (vinculoEntidadeRes.rows.length > 0) {
          entidadeId = vinculoEntidadeRes.rows[0].entidade_id;
        }
      }
    }

    if (!clinicaId && !entidadeId) {
      return NextResponse.json(
        { error: 'Você não está vinculado a uma clínica ou entidade' },
        { status: 403 }
      );
    }

    // Buscar pagamentos com dados de lotes e laudos
    let pagamentosResult;

    if (clinicaId) {
      pagamentosResult = await query(
        `SELECT 
          p.id,
          p.valor,
          p.metodo,
          p.status,
          p.numero_parcelas,
          p.detalhes_parcelas,
          p.numero_funcionarios,
          p.valor_por_funcionario,
          p.recibo_numero,
          p.recibo_url,
          p.data_pagamento,
          p.data_confirmacao,
          p.criado_em,
          p.contrato_id,
          -- Lote mais recente associado à clínica
          (
            SELECT la.id FROM lotes_avaliacao la
            WHERE la.clinica_id = p.clinica_id
            ORDER BY la.criado_em DESC LIMIT 1
          ) as lote_id,
          (
            SELECT la.id::text FROM lotes_avaliacao la
            WHERE la.clinica_id = p.clinica_id
            ORDER BY la.criado_em DESC LIMIT 1
          ) as lote_codigo,
          (
            SELECT la.numero_ordem FROM lotes_avaliacao la
            WHERE la.clinica_id = p.clinica_id
            ORDER BY la.criado_em DESC LIMIT 1
          ) as lote_numero,
          -- Laudo associado ao lote mais recente
          (
            SELECT l.id FROM laudos l
            INNER JOIN lotes_avaliacao la ON la.id = l.lote_id
            WHERE la.clinica_id = p.clinica_id
            ORDER BY l.emitido_em DESC NULLS LAST LIMIT 1
          ) as laudo_id
        FROM pagamentos p
        WHERE p.clinica_id = $1
          AND p.status IN ('pago', 'processando', 'pendente')
        ORDER BY p.criado_em DESC
        LIMIT 20`,
        [clinicaId]
      );
    } else {
      pagamentosResult = await query(
        `SELECT 
          p.id,
          p.valor,
          p.metodo,
          p.status,
          p.numero_parcelas,
          p.detalhes_parcelas,
          p.numero_funcionarios,
          p.valor_por_funcionario,
          p.recibo_numero,
          p.recibo_url,
          p.data_pagamento,
          p.data_confirmacao,
          p.criado_em,
          p.contrato_id,
          -- Lote mais recente associado à entidade
          (
            SELECT la.id FROM lotes_avaliacao la
            WHERE la.contratante_id = p.entidade_id
            ORDER BY la.criado_em DESC LIMIT 1
          ) as lote_id,
          (
            SELECT la.id::text FROM lotes_avaliacao la
            WHERE la.contratante_id = p.entidade_id
            ORDER BY la.criado_em DESC LIMIT 1
          ) as lote_codigo,
          (
            SELECT la.numero_ordem FROM lotes_avaliacao la
            WHERE la.contratante_id = p.entidade_id
            ORDER BY la.criado_em DESC LIMIT 1
          ) as lote_numero,
          -- Laudo associado ao lote mais recente
          (
            SELECT l.id FROM laudos l
            INNER JOIN lotes_avaliacao la ON la.id = l.lote_id
            WHERE la.contratante_id = p.entidade_id
            ORDER BY l.emitido_em DESC NULLS LAST LIMIT 1
          ) as laudo_id
        FROM pagamentos p
        WHERE p.entidade_id = $1
          AND p.status IN ('pago', 'processando', 'pendente')
        ORDER BY p.criado_em DESC
        LIMIT 20`,
        [entidadeId]
      );
    }

    const pagamentos = pagamentosResult.rows.map((row: any) => ({
      id: row.id,
      valor: parseFloat(row.valor),
      metodo: row.metodo,
      status: row.status,
      numeroParcelas: row.numero_parcelas ?? 1,
      detalhesParcelas: row.detalhes_parcelas
        ? normalizarDetalhesParcelas(
            Array.isArray(row.detalhes_parcelas)
              ? (row.detalhes_parcelas as Parcela[])
              : (JSON.parse(row.detalhes_parcelas) as Parcela[]),
            row.status,
            row.data_pagamento ?? row.data_confirmacao ?? null
          )
        : null,
      numeroFuncionarios: row.numero_funcionarios ?? null,
      valorPorFuncionario: row.valor_por_funcionario
        ? parseFloat(row.valor_por_funcionario)
        : null,
      reciboNumero: row.recibo_numero ?? null,
      reciboUrl: row.recibo_url ?? null,
      dataPagamento: row.data_pagamento ?? null,
      dataConfirmacao: row.data_confirmacao ?? null,
      criadoEm: row.criado_em,
      contratoId: row.contrato_id ?? null,
      loteId: row.lote_id ?? null,
      loteCodigo: row.lote_codigo ?? null,
      loteNumero: row.lote_numero ?? null,
      laudoId: row.laudo_id ?? null,
    }));

    return NextResponse.json({ pagamentos });
  } catch (error) {
    console.error('Erro ao buscar pagamentos de laudos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};
