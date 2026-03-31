/**
 * GET /api/representante/me
 * Retorna dados da sessão do representante logado (validados no banco).
 * Usado pelo dashboard e demais páginas do portal do representante.
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sess = requireRepresentante();

    // Buscar dados completos e frescos do banco
    const result = await query(
      `SELECT id, nome, email, codigo, status, tipo_pessoa, telefone,
              cpf, cnpj,
              aceite_termos, aceite_disclaimer_nv, aceite_politica_privacidade, criado_em, aprovado_em,
              banco_codigo, agencia, conta, tipo_conta, titular_conta,
              pix_chave, pix_tipo,
              dados_bancarios_status, dados_bancarios_solicitado_em,
              dados_bancarios_confirmado_em
       FROM representantes WHERE id = $1 LIMIT 1`,
      [sess.representante_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ representante: result.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
