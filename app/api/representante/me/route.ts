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
      `SELECT r.id, r.nome, r.email, r.status, r.tipo_pessoa, r.telefone,
              r.cpf, r.cnpj,
              r.aceite_termos, r.aceite_disclaimer_nv, r.aceite_politica_privacidade, r.criado_em, r.aprovado_em,
              r.banco_codigo, r.agencia, r.conta, r.tipo_conta, r.titular_conta,
              r.pix_chave, r.pix_tipo, r.asaas_wallet_id,
              r.dados_bancarios_status, r.dados_bancarios_solicitado_em,
              r.dados_bancarios_confirmado_em,
              r.modelo_comissionamento, r.percentual_comissao,
              r.valor_custo_fixo_entidade, r.valor_custo_fixo_clinica,
              COALESCE(rs.primeira_senha_alterada, TRUE) = FALSE AS precisa_trocar_senha
       FROM representantes r
       LEFT JOIN representantes_senhas rs ON rs.representante_id = r.id
       WHERE r.id = $1 LIMIT 1`,
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
