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
  responsavel_nome: string | null;
  responsavel_cargo: string | null;
  responsavel_celular: string | null;
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
     * Busca CLÍNICAS e ENTIDADES com contrato pendente de aceite via UNION ALL.
     *
     * As duas tabelas são separadas no banco (`clinicas` e `entidades`), mas
     * compartilham a mesma sequence global de IDs, garantindo IDs
     * globalmente únicos. O UNION ALL une os resultados de ambas antes de
     * fazer o JOIN com contratos.
     *
     * Status relevantes:
     *   - aguardando_aceite_contrato : fluxo parou exatamente no aceite do contrato
     *   - aguardando_aceite          : fluxo parou antes do aceite (link da proposta)
     *   - pendente                   : cadastro chegou mas nenhum avanço
     *
     * O filtro de tipo é sempre passado como $1 ('todos' significa sem filtro).
     */
    const sql = `
      SELECT
        t.id,
        t.nome,
        t.cnpj,
        t.email,
        t.telefone,
        t.status,
        t.criado_em,
        t.tipo,
        t.responsavel_nome,
        t.responsavel_cargo,
        t.responsavel_celular,
        c.id        AS contrato_id,
        c.criado_em AS contrato_criado_em
      FROM (
        SELECT id, nome, cnpj, email, telefone, status, criado_em, tipo, ativa,
               responsavel_nome, responsavel_cargo, responsavel_celular
        FROM entidades
        UNION ALL
        SELECT id, nome, cnpj, email, telefone, status, criado_em, tipo, ativa,
               responsavel_nome, responsavel_cargo, responsavel_celular
        FROM clinicas
      ) t
      LEFT JOIN contratos c ON c.tomador_id = t.id AND c.tipo_tomador = t.tipo
      WHERE c.aceito = false
        AND t.status IN (
          'aguardando_aceite_contrato',
          'aguardando_aceite',
          'pendente'
        )
        AND ($1 = 'todos' OR t.tipo = $1)
      ORDER BY COALESCE(c.criado_em, t.criado_em) DESC
    `;

    const result = await query<PreCadastroItem>(sql, [tipo]);

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
