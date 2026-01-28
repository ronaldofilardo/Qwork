import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import { validarEmail } from '@/lib/validators';
import bcrypt from 'bcryptjs';

/**
 * PATCH /api/admin/emissores/[cpf]
 *
 * Atualiza dados de um emissor específico
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cpf: string } }
) {
  try {
    const session = await requireRole('admin', false);

    const data = await request.json();
    const { ativo, nome, email, senha } = data;

    // Verificar se o usuário existe e é emissor
    const userCheck = await query(
      'SELECT cpf, nome, email, ativo, clinica_id, perfil FROM funcionarios WHERE cpf = $1',
      [params.cpf],
      session
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Emissor não encontrado' },
        { status: 404 }
      );
    }

    if (userCheck.rows[0].perfil !== 'emissor') {
      return NextResponse.json(
        { error: 'Usuário não é emissor' },
        { status: 400 }
      );
    }

    const estadoAnterior = userCheck.rows[0];

    // Validar email se fornecido
    if (email && !validarEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Construir query de atualização dinâmica
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCounter = 1;

    if (typeof ativo === 'boolean') {
      updates.push(`ativo = $${paramCounter}`);
      values.push(ativo);
      paramCounter++;
    }

    if (nome) {
      updates.push(`nome = $${paramCounter}`);
      values.push(nome);
      paramCounter++;
    }

    if (email) {
      updates.push(`email = $${paramCounter}`);
      values.push(email);
      paramCounter++;
    }

    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      updates.push(`senha_hash = $${paramCounter}`);
      values.push(senhaHash);
      paramCounter++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    updates.push(`atualizado_em = CURRENT_TIMESTAMP`);

    // Adicionar CPF como último parâmetro
    values.push(params.cpf);

    const result = await query(
      `
      UPDATE funcionarios
      SET ${updates.join(', ')}
      WHERE cpf = $${paramCounter} AND perfil = 'emissor'
      RETURNING cpf, nome, email, ativo, clinica_id, atualizado_em
    `,
      values,
      session
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Erro ao atualizar emissor' },
        { status: 500 }
      );
    }

    const emissorAtualizado = result.rows[0];

    // Registrar auditoria
    await logAudit({
      resource: 'funcionarios',
      action: 'UPDATE',
      resourceId: params.cpf,
      oldData: estadoAnterior,
      newData: emissorAtualizado,
      ...extractRequestInfo(request),
    });

    return NextResponse.json({
      success: true,
      emissor: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar emissor:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
