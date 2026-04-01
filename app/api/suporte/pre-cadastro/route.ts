/**
 * app/api/suporte/pre-cadastro/route.ts
 *
 * Lista entidades/clínicas que concluíram o cadastro mas ainda não aceitaram
 * o contrato (pré-cadastros com contrato pendente).
 *
 * Usado no painel de suporte para que o operador possa gerar o link de aceite
 * de contrato e enviá-lo por fora da plataforma.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';
import { query } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  tipo: z.enum(['clinica', 'entidade', 'todos']).optional().default('todos'),
});

export interface PreCadastroItem {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string | null;
  status: string;
  criado_em: string;
  contrato_id: number;
  contrato_criado_em: string;
  tipo: 'clinica' | 'entidade';
}

export interface PreCadastroResponse {
  success: boolean;
  total: number;
  pre_cadastros: PreCadastroItem[];
}

/**
 * GET /api/suporte/pre-cadastro
 *
 * Query params:
 *   tipo?: 'clinica' | 'entidade' | 'todos' (default: 'todos')
 *
 * Retorna entidades que:
 * - Possuem um contrato gerado (contratos.aceito = false)
 * - Status indica que o fluxo está parado no aceite do contrato
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = getSession();
    assertRoles(session, [ROLES.SUPORTE]);

    const { searchParams } = new URL(request.url);
    const parseResult = QuerySchema.safeParse({
      tipo: searchParams.get('tipo') ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { tipo } = parseResult.data;

    /*
     * Busca entidades com contrato pendente de aceite.
     * A coluna `entidades.tipo` distingue 'clinica' de 'entidade'.
     * Status relevantes:
     *   - aguardando_aceite_contrato : fluxo parou exatamente no aceite do contrato
     *   - aguardando_aceite          : fluxo parou antes do aceite (link da proposta)
     *   - pendente                   : cadastro chegou mas nenhum avanço
     *
     * Priorizamos entidades que JÁ POSSUEM um contrato gerado (JOIN INNER).
     */
    const tipoFilter = tipo !== 'todos' ? `AND e.tipo = $1` : '';
    const params: string[] = tipo !== 'todos' ? [tipo] : [];

    const sql = `
      SELECT
        e.id,
        e.nome,
        e.cnpj,
        e.email,
        e.telefone,
        e.status,
        e.criado_em,
        e.tipo,
        c.id       AS contrato_id,
        c.criado_em AS contrato_criado_em
      FROM entidades e
      INNER JOIN contratos c ON c.tomador_id = e.id
      WHERE c.aceito = false
        AND e.status IN (
          'aguardando_aceite_contrato',
          'aguardando_aceite',
          'pendente'
        )
        ${tipoFilter}
      ORDER BY c.criado_em DESC
    `;

    const result = await query<PreCadastroItem>(sql, params);

    return NextResponse.json<PreCadastroResponse>({
      success: true,
      total: result.rows.length,
      pre_cadastros: result.rows,
    });
  } catch (error: unknown) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('[PRE-CADASTRO] Erro ao listar pré-cadastros:', error);
    return NextResponse.json(
      { error: 'Erro interno ao listar pré-cadastros' },
      { status: 500 }
    );
  }
}
