/**
 * GET /api/representante/equipe/vendedores/[id] — dados completos do vendedor (inclui perfil)
 * PATCH /api/representante/equipe/vendedores/[id] — edita dados do vendedor
 *
 * Permitido: nome, email, sexo, endereco, cidade, estado, cep (via vendedores_perfil + usuarios)
 * Bloqueado: cpf (imutável após cadastro), dados bancários (exclusivo do suporte)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import type { Session } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  nome: z.string().min(2).max(200).trim().optional(),
  email: z.string().email().max(100).optional().nullable(),
  sexo: z.enum(['masculino', 'feminino']).optional().nullable(),
  endereco: z.string().max(500).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().length(2).optional().nullable(),
  cep: z.string().max(9).optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    const vendedorId = parseInt(params.id, 10);
    if (isNaN(vendedorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    const result = await query(
      `SELECT
         u.id             AS vendedor_id,
         u.nome           AS vendedor_nome,
         u.email          AS vendedor_email,
         u.cpf            AS vendedor_cpf,
         vp.codigo        AS codigo_vendedor,
         vp.sexo,
         vp.endereco,
         vp.cidade,
         vp.estado,
         vp.cep
       FROM hierarquia_comercial hc
       JOIN usuarios u ON u.id = hc.vendedor_id
       LEFT JOIN vendedores_perfil vp ON vp.usuario_id = u.id
       WHERE hc.vendedor_id = $1 AND hc.representante_id = $2 AND hc.ativo = true
       LIMIT 1`,
      [vendedorId, sess.representante_id],
      rlsSess
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado na sua equipe' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendedor: result.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    const vendedorId = parseInt(params.id, 10);
    if (isNaN(vendedorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    // Verificar que o vendedor pertence à equipe do representante
    const vinculo = await query(
      `SELECT hc.id, u.nome AS vendedor_nome
       FROM hierarquia_comercial hc
       JOIN usuarios u ON u.id = hc.vendedor_id
       WHERE hc.vendedor_id = $1 AND hc.representante_id = $2 AND hc.ativo = true
       LIMIT 1`,
      [vendedorId, sess.representante_id],
      rlsSess
    );

    if (vinculo.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado na sua equipe' },
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

    // Atualizar tabela usuarios (nome, email)
    const usuarioFields: Record<string, unknown> = {};
    if (data.nome !== undefined) usuarioFields['nome'] = data.nome;
    if (data.email !== undefined) usuarioFields['email'] = data.email;

    if (Object.keys(usuarioFields).length > 0) {
      const uKeys = Object.keys(usuarioFields);
      const uValues = Object.values(usuarioFields);
      const uSet = uKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      await query(
        `UPDATE usuarios SET ${uSet} WHERE id = $${uKeys.length + 1}`,
        [...uValues, vendedorId],
        rlsSess
      );
    }

    // Atualizar tabela vendedores_perfil (sexo, endereco, cidade, estado, cep)
    const perfilFields: Record<string, unknown> = {};
    if (data.sexo !== undefined) perfilFields['sexo'] = data.sexo;
    if (data.endereco !== undefined) perfilFields['endereco'] = data.endereco;
    if (data.cidade !== undefined) perfilFields['cidade'] = data.cidade;
    if (data.estado !== undefined) perfilFields['estado'] = data.estado;
    if (data.cep !== undefined) perfilFields['cep'] = data.cep;

    if (Object.keys(perfilFields).length > 0) {
      const pKeys = Object.keys(perfilFields);
      const pValues = Object.values(perfilFields);
      const pSet = pKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      await query(
        `UPDATE vendedores_perfil SET ${pSet} WHERE usuario_id = $${pKeys.length + 1}`,
        [...pValues, vendedorId],
        rlsSess
      );
    }

    return NextResponse.json({
      success: true,
      vendedor_id: vendedorId,
      campos_atualizados: Object.keys(data),
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
