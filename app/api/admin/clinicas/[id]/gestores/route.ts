import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

/**
 * GET /api/admin/clinicas/[id]/gestores
 * 
 * Lista gestores RH (perfil 'rh') associados a uma clínica específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar permissão de admin
    await requireRole('admin')

    const clinicaId = parseInt(params.id)

    if (isNaN(clinicaId)) {
      return NextResponse.json({ error: 'ID da clínica inválido' }, { status: 400 })
    }

    // Verificar se a clínica existe (busca em contratantes)
    const clinicaResult = await query<{ id: number; nome: string; responsavel_nome: string; responsavel_cpf: string; responsavel_email: string; responsavel_celular: string }>(
      'SELECT id, nome, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular FROM contratantes WHERE id = $1 AND tipo = \'clinica\'',
      [clinicaId]
    )

    if (clinicaResult.rows.length === 0) {
      return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 })
    }

    const clinica = clinicaResult.rows[0]

    // Buscar gestores RH da clínica (mantém busca em funcionarios para RHs adicionais)
    interface GestorRow {
      cpf: string
      nome: string
      email: string
      ativo: boolean
      criado_em: string
      atualizado_em: string
      total_empresas_geridas: string
    }

    const result = await query<GestorRow>(`
      SELECT 
        f.cpf,
        f.nome,
        f.email,
        f.ativo,
        f.criado_em,
        f.atualizado_em,
        COUNT(DISTINCT ec.id) as total_empresas_geridas
      FROM funcionarios f
      LEFT JOIN empresas_clientes ec ON ec.clinica_id = f.clinica_id
      WHERE f.clinica_id = $1 AND f.perfil = 'rh'
      GROUP BY f.cpf, f.nome, f.email, f.ativo, f.criado_em, f.atualizado_em
      ORDER BY f.nome
    `, [clinicaId])

    // Adicionar responsável do contratante à lista
    const gestores = [
      {
        cpf: clinica.responsavel_cpf,
        nome: clinica.responsavel_nome,
        email: clinica.responsavel_email,
        ativo: true,
        criado_em: null,
        atualizado_em: null,
        total_empresas_geridas: '0',
        is_responsavel: true
      },
      ...result.rows.map(g => ({ ...g, is_responsavel: false }))
    ]

    return NextResponse.json({
      success: true,
      clinica: {
        id: clinica.id,
        nome: clinica.nome
      },
      gestores
    })
  } catch (error) {
    console.error('Erro ao buscar gestores da clínica:', error)
    
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
