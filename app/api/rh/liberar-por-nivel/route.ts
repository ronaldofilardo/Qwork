import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const session = await requireRole('rh')

    const { nivelCargo } = await request.json()

    if (!nivelCargo || !['operacional', 'gestao'].includes(nivelCargo)) {
      return NextResponse.json(
        { error: 'Nível de cargo inválido. Use: operacional ou gestao' },
        { status: 400 }
      )
    }

    // Obter a clínica do RH logado
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (rhResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário RH não encontrado' }, { status: 404 })
    }

    const clinicaId = rhResult.rows[0].clinica_id

    // Buscar funcionários do nível específico na mesma clínica
    const funcionariosResult = await query(
      `SELECT cpf, nome, setor, funcao, empresa_id 
       FROM funcionarios 
       WHERE clinica_id = $1 AND nivel_cargo = $2 AND perfil = 'funcionario'`,
      [clinicaId, nivelCargo]
    )

    if (funcionariosResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Nenhum funcionário ${nivelCargo} encontrado nesta clínica` },
        { status: 404 }
      )
    }

    let avaliacoesCreated = 0
    const avaliacoesExistentes = 0

    // Criar avaliações para todos os funcionários do nível
    for (const funcionario of funcionariosResult.rows) {
      try {
        // Sempre criar nova avaliação, independente de avaliações anteriores
        await query(
          `INSERT INTO avaliacoes (funcionario_cpf, status)
           VALUES ($1, 'iniciada')`,
          [funcionario.cpf]
        )
        avaliacoesCreated++
      } catch (err) {
        console.error(`Erro ao criar avaliação para CPF ${funcionario.cpf}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Avaliações liberadas para funcionários ${nivelCargo}`,
      totalFuncionarios: funcionariosResult.rows.length,
      avaliacoesCreated,
      avaliacoesExistentes,
      nivelCargo
    })
  } catch (error) {
    console.error('Erro ao liberar avaliações por nível:', error)
    return NextResponse.json(
      { error: 'Erro ao liberar avaliações' },
      { status: 500 }
    )
  }
}
