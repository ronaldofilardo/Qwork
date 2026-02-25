import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('admin');

    const { ativa } = await request.json()
    const clinicaId = parseInt(params.id)

    if (isNaN(clinicaId)) {
      return NextResponse.json({ error: 'ID da clínica inválido' }, { status: 400 })
    }

    if (typeof ativa !== 'boolean') {
      return NextResponse.json({ error: 'Status ativa deve ser boolean' }, { status: 400 })
    }

    const result = await query(
      `UPDATE clinicas 
       SET ativa = $1, atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, nome, cnpj, email, telefone, endereco, ativa, criado_em`,
      [ativa, clinicaId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar clínica:', error)
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clinicaId = parseInt(params.id)

    if (isNaN(clinicaId)) {
      return NextResponse.json({ error: 'ID da clínica inválido' }, { status: 400 })
    }

    // Verificar se a clínica tem funcionários associados
    const funcionariosResult = await query(
      'SELECT COUNT(*) as count FROM funcionarios WHERE clinica_id = $1',
      [clinicaId]
    )

    if (parseInt(funcionariosResult.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir clínica com funcionários associados' }, 
        { status: 409 }
      )
    }

    const result = await query(
      'DELETE FROM clinicas WHERE id = $1 RETURNING id',
      [clinicaId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Clínica excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir clínica:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}