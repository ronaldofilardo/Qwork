import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PostBodySchema = z.object({
  nome: z.string().min(1).max(255),
  mapeamentos: z
    .array(
      z.object({
        nomeOriginal: z.string(),
        campoQWork: z.string(),
      })
    )
    .min(1),
  nivelCargoMap: z.record(z.string(), z.string()).optional(),
});

/** GET /api/entidade/importacao/templates — lista os templates do usuário autenticado nesta entidade */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireEntity();

    const result = await queryAsGestorEntidade(
      `SELECT id, nome, mapeamentos, nivel_cargo_map, criado_em
       FROM importacao_templates
       WHERE entidade_id = $1 AND criado_por_cpf = $2
       ORDER BY criado_em DESC`,
      [session.entidade_id, session.cpf]
    );

    const templates = result.rows.map((row) => ({
      id: String(row.id as number),
      nome: row.nome as string,
      criadoEm: new Date(row.criado_em as Date).toLocaleDateString('pt-BR'),
      mapeamentos: row.mapeamentos as Array<{
        nomeOriginal: string;
        campoQWork: string;
      }>,
      nivelCargoMap:
        (row.nivel_cargo_map as Record<string, string>) ?? undefined,
    }));

    return NextResponse.json({ templates });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    console.error('[templates/entidade] GET error:', err);
    return NextResponse.json(
      { error: 'Erro ao buscar templates' },
      { status: 500 }
    );
  }
}

/** POST /api/entidade/importacao/templates — cria um novo template para o usuário autenticado */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireEntity();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    const parsed = PostBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nome, mapeamentos, nivelCargoMap } = parsed.data;

    const result = await queryAsGestorEntidade(
      `INSERT INTO importacao_templates
         (nome, entidade_id, criado_por_cpf, mapeamentos, nivel_cargo_map)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, criado_em`,
      [
        nome,
        session.entidade_id,
        session.cpf,
        JSON.stringify(mapeamentos),
        nivelCargoMap ? JSON.stringify(nivelCargoMap) : null,
      ]
    );

    const row = result.rows[0];
    return NextResponse.json(
      {
        template: {
          id: String(row.id as number),
          nome,
          criadoEm: new Date(row.criado_em as Date).toLocaleDateString('pt-BR'),
          mapeamentos,
          nivelCargoMap,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    console.error('[templates/entidade] POST error:', err);
    return NextResponse.json(
      { error: 'Erro ao criar template' },
      { status: 500 }
    );
  }
}
