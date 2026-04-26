/**
 * POST /api/admin/tomadores/isentar
 * Concede isenção total de cobranças a um tomador pelo CNPJ.
 * Apenas admin pode usar esta rota.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin', false);

    const body = await request.json();
    const cnpjRaw: unknown = body?.cnpj;

    if (typeof cnpjRaw !== 'string') {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    const cnpj = cnpjRaw.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      return NextResponse.json(
        { error: 'CNPJ inválido — deve ter 14 dígitos' },
        { status: 400 }
      );
    }

    // Tentar clinicas primeiro
    const clinicaRes = await query(
      `UPDATE clinicas SET isento_pagamento = true, atualizado_em = CURRENT_TIMESTAMP
       WHERE cnpj = $1 OR REPLACE(cnpj, '.', '') = $1 OR REPLACE(REPLACE(REPLACE(cnpj,'.','-'),'/',''),'-','') = $1
       RETURNING id, nome`,
      [cnpj]
    );

    if (clinicaRes.rows.length > 0) {
      const { id, nome } = clinicaRes.rows[0] as { id: number; nome: string };

      const contexto = extrairContextoRequisicao(request);
      try {
        await registrarAuditoria({
          entidade_tipo: 'tomador',
          entidade_id: id,
          acao: 'atualizar',
          metadados: {
            operacao: 'isentar_parceiro',
            tipo_tomador: 'clinica',
            cnpj,
          },
          ...contexto,
        });
      } catch (err) {
        console.warn('[isentar] Falha ao registrar auditoria:', err);
      }

      return NextResponse.json({ id, nome, tipo: 'clinica' });
    }

    // Tentar entidades
    const entidadeRes = await query(
      `UPDATE entidades SET isento_pagamento = true, atualizado_em = CURRENT_TIMESTAMP
       WHERE cnpj = $1 OR REPLACE(cnpj, '.', '') = $1 OR REPLACE(REPLACE(REPLACE(cnpj,'.','-'),'/',''),'-','') = $1
       RETURNING id, nome`,
      [cnpj]
    );

    if (entidadeRes.rows.length > 0) {
      const { id, nome } = entidadeRes.rows[0] as { id: number; nome: string };

      const contexto = extrairContextoRequisicao(request);
      try {
        await registrarAuditoria({
          entidade_tipo: 'tomador',
          entidade_id: id,
          acao: 'atualizar',
          metadados: {
            operacao: 'isentar_parceiro',
            tipo_tomador: 'entidade',
            cnpj,
          },
          ...contexto,
        });
      } catch (err) {
        console.warn('[isentar] Falha ao registrar auditoria:', err);
      }

      return NextResponse.json({ id, nome, tipo: 'entidade' });
    }

    return NextResponse.json(
      { error: 'Tomador não encontrado para o CNPJ informado' },
      { status: 404 }
    );
  } catch (error: unknown) {
    const e = error as Error;
    if (
      e.message === 'Não autenticado' ||
      e.message === 'Sem permissão' ||
      e.message.startsWith('Acesso restrito')
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('[POST /api/admin/tomadores/isentar]', e);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
