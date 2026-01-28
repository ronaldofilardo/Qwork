import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { logAudit, extractRequestInfo } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic';
/**
 * POST /api/admin/gestores-rh/substituir
 * 
 * Substitui um gestor RH por outro (desativa antigo e cria novo)
 * Operação atômica em transação para garantir integridade
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole('admin')

    const { 
      cpf_antigo, 
      cpf_novo, 
      nome_novo, 
      email_novo, 
      senha_novo 
    } = await request.json()

    // Validações
    if (!cpf_antigo || !cpf_novo || !nome_novo) {
      return NextResponse.json(
        { error: 'CPF antigo, novo CPF e nome são obrigatórios' },
        { status: 400 }
      )
    }

    if (cpf_novo.length !== 11) {
      return NextResponse.json(
        { error: 'Novo CPF deve ter 11 dígitos' },
        { status: 400 }
      )
    }

    if (cpf_antigo === cpf_novo) {
      return NextResponse.json(
        { error: 'O novo CPF deve ser diferente do antigo' },
        { status: 400 }
      )
    }

    // Verificar se o gestor antigo existe e é RH ativo
    const antigoCheck = await query(
      'SELECT cpf, nome, email, perfil, clinica_id, ativo FROM funcionarios WHERE cpf = $1',
      [cpf_antigo]
    )

    if (antigoCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Gestor RH antigo não encontrado' },
        { status: 404 }
      )
    }

    const gestorAntigo = antigoCheck.rows[0] as Record<string, any>

    if (gestorAntigo.perfil !== 'rh') {
      return NextResponse.json(
        { error: 'Usuário antigo não é gestor RH' },
        { status: 400 }
      )
    }

    if (!gestorAntigo.ativo) {
      return NextResponse.json(
        { error: 'Gestor RH antigo já está inativo' },
        { status: 400 }
      )
    }

    const clinicaId = gestorAntigo.clinica_id

    // Verificar se a clínica existe
    const clinicaCheck = await query(
      'SELECT id, nome FROM clinicas WHERE id = $1',
      [clinicaId]
    )

    if (clinicaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o novo CPF já existe
    const novoCheck = await query(
      'SELECT cpf FROM funcionarios WHERE cpf = $1',
      [cpf_novo]
    )

    if (novoCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Novo CPF já cadastrado no sistema' },
        { status: 409 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha_novo || '123456', 10)

    // Transação: Criar novo e desativar antigo
    try {
      await query('BEGIN')

      // Desabilitar temporariamente a trigger para permitir a substituição
      await query(`ALTER TABLE funcionarios DISABLE TRIGGER trigger_validar_rh_obrigatorio`)

      // 1. Desativar o RH antigo primeiro
      const antigoResult = await query(`
        UPDATE funcionarios
        SET ativo = false, atualizado_em = CURRENT_TIMESTAMP
        WHERE cpf = $1 AND perfil = 'rh'
        RETURNING cpf, nome, email, ativo, clinica_id, atualizado_em
      `, [cpf_antigo])

      // 2. Criar novo gestor RH (agora pode ser ativo pois o antigo foi desativado)
      const novoResult = await query(`
        INSERT INTO funcionarios (
          cpf, nome, email, senha_hash, perfil, clinica_id, ativo
        ) VALUES ($1, $2, $3, $4, 'rh', $5, true)
        RETURNING cpf, nome, email, ativo, clinica_id, criado_em
      `, [cpf_novo, nome_novo, email_novo, senhaHash, clinicaId])

      const gestorNovo = novoResult.rows[0] as Record<string, any>

      // Reabilitar a trigger
      await query(`ALTER TABLE funcionarios ENABLE TRIGGER trigger_validar_rh_obrigatorio`)

      await query('COMMIT')

      // Registrar auditoria para ambas as operações
      const { ipAddress, userAgent } = extractRequestInfo(request)

      // Auditoria: Criação do novo
      await logAudit({
        resource: 'funcionarios',
        action: 'INSERT',
        resourceId: cpf_novo,
        newData: gestorNovo,
        ipAddress,
        userAgent,
      })

      // Auditoria: Desativação do antigo
      await logAudit({
        resource: 'funcionarios',
        action: 'UPDATE',
        resourceId: cpf_antigo,
        oldData: gestorAntigo,
        newData: antigoResult.rows[0] as Record<string, any>,
        ipAddress,
        userAgent,
      })

      return NextResponse.json({
        success: true,
        message: 'Gestor RH substituído com sucesso',
        gestor_antigo: antigoResult.rows[0] as Record<string, any>,
        gestor_novo: gestorNovo,
        clinica: clinicaCheck.rows[0] as Record<string, any>
      }, { status: 200 })

    } catch (dbError) {
      await query('ROLLBACK')
      throw dbError
    }

  } catch (error) {
    console.error('Erro ao substituir gestor RH:', error)

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Erro de constraint única (já existe outro RH ativo)
    if (error instanceof Error && error.message.includes('idx_funcionarios_clinica_rh_ativo')) {
      return NextResponse.json(
        { error: 'Já existe outro gestor RH ativo nesta clínica' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
