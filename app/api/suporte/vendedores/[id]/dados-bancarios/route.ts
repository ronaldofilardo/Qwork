/**
 * GET  /api/suporte/vendedores/[id]/dados-bancarios — retorna dados bancários do vendedor
 * PATCH /api/suporte/vendedores/[id]/dados-bancarios — atualiza dados bancários (auditado)
 *
 * Acesso exclusivo ao perfil 'suporte'.
 * Toda edição é auditada em comissionamento_auditoria (triggador = 'admin_action').
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  banco_codigo: z.string().max(10).optional().nullable(),
  agencia: z.string().max(20).optional().nullable(),
  conta: z.string().max(30).optional().nullable(),
  tipo_conta: z
    .enum(['corrente', 'poupanca', 'pagamento'])
    .optional()
    .nullable(),
  titular_conta: z.string().max(200).optional().nullable(),
  pix_chave: z.string().max(200).optional().nullable(),
  pix_tipo: z
    .enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'])
    .optional()
    .nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireRole(['suporte'], false);

    const usuarioId = parseInt(params.id, 10);
    if (isNaN(usuarioId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que o usuário existe e é vendedor
    const userCheck = await query(
      `SELECT id, nome FROM usuarios WHERE id = $1 AND tipo_usuario = 'vendedor' LIMIT 1`,
      [usuarioId]
    );
    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    const result = await query(
      `SELECT vdb.banco_codigo, vdb.agencia, vdb.conta, vdb.tipo_conta,
              vdb.titular_conta, vdb.pix_chave, vdb.pix_tipo, vdb.atualizado_em
       FROM usuarios u
       LEFT JOIN vendedores_dados_bancarios vdb ON vdb.usuario_id = u.id
       WHERE u.id = $1`,
      [usuarioId]
    );

    // Se não tiver dados bancários, as colunas serão null (LEFT JOIN)
    const dados = result.rows[0] ?? null;

    return NextResponse.json({
      vendedor: userCheck.rows[0],
      dados_bancarios: dados,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[GET /api/suporte/vendedores/[id]/dados-bancarios]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte'], false);

    const usuarioId = parseInt(params.id, 10);
    if (isNaN(usuarioId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que o usuário existe e é vendedor
    const userCheck = await query(
      `SELECT id, nome FROM usuarios WHERE id = $1 AND tipo_usuario = 'vendedor' LIMIT 1`,
      [usuarioId]
    );
    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // UPSERT — cria ou atualiza os dados bancários
    const result = await query(
      `INSERT INTO vendedores_dados_bancarios (
         usuario_id, banco_codigo, agencia, conta, tipo_conta,
         titular_conta, pix_chave, pix_tipo
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (usuario_id) DO UPDATE SET
         banco_codigo  = EXCLUDED.banco_codigo,
         agencia       = EXCLUDED.agencia,
         conta         = EXCLUDED.conta,
         tipo_conta    = EXCLUDED.tipo_conta,
         titular_conta = EXCLUDED.titular_conta,
         pix_chave     = EXCLUDED.pix_chave,
         pix_tipo      = EXCLUDED.pix_tipo,
         atualizado_em = NOW()
       RETURNING *`,
      [
        usuarioId,
        data.banco_codigo ?? null,
        data.agencia ?? null,
        data.conta ?? null,
        data.tipo_conta ?? null,
        data.titular_conta ?? null,
        data.pix_chave ?? null,
        data.pix_tipo ?? null,
      ]
    );

    // Auditoria obrigatória — tabela comissionamento_auditoria
    try {
      await query(
        `INSERT INTO comissionamento_auditoria
           (tabela, registro_id, status_anterior, status_novo, triggador, motivo)
         VALUES ('vendedores_dados_bancarios', $1, 'dados_bancarios_anteriores', 'dados_bancarios_atualizados', 'admin_action', $2)`,
        [
          usuarioId,
          `Dados bancários do vendedor ${String(userCheck.rows[0].nome)} editados pelo suporte ${session.cpf}`,
        ]
      );
    } catch (auditErr) {
      // Auditoria não bloqueia a operação principal
      console.error(
        '[auditoria] Erro ao inserir auditoria bancária:',
        auditErr
      );
    }

    console.info(
      JSON.stringify({
        event: 'suporte_vendedor_dados_bancarios_editados',
        usuario_id: usuarioId,
        campos: Object.keys(data),
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({ dados_bancarios: result.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[PATCH /api/suporte/vendedores/[id]/dados-bancarios]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
