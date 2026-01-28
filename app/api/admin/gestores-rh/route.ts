import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import { validarCPF, limparCPF } from '@/lib/cpf-utils';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
/**
 * GET /api/admin/gestores-rh
 *
 * Lista todos os gestores RH do sistema
 */
export async function GET() {
  try {
    await requireRole('admin');

    const result = await query(`
      SELECT 
        f.cpf,
        f.nome,
        f.email,
        f.ativo,
        f.clinica_id,
        c.nome as clinica_nome,
        f.criado_em,
        COUNT(DISTINCT ec.id) as total_empresas_geridas
      FROM funcionarios f
      LEFT JOIN clinicas c ON c.id = f.clinica_id
      LEFT JOIN empresas_clientes ec ON ec.clinica_id = f.clinica_id
      WHERE f.perfil = 'rh'
      GROUP BY f.cpf, f.nome, f.email, f.ativo, f.clinica_id, c.nome, f.criado_em
      ORDER BY c.nome, f.nome
    `);

    return NextResponse.json({
      success: true,
      gestores: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar gestores RH:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/gestores-rh
 *
 * Cria novo gestor RH e associa a uma clínica
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole('admin');

    const { cpf, nome, email, senha, clinica_id } = await request.json();

    // Validações
    if (!cpf || !nome || !clinica_id) {
      return NextResponse.json(
        { error: 'CPF, nome e clínica são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar CPF completo (com dígitos verificadores)
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Verificar se clínica existe
    const clinicaResult = await query('SELECT id FROM clinicas WHERE id = $1', [
      clinica_id,
    ]);

    if (clinicaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se CPF já existe
    const cpfExists = await query(
      'SELECT cpf FROM funcionarios WHERE cpf = $1',
      [cpfLimpo]
    );

    if (cpfExists.rows.length > 0) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }

    // Verificar se já existe RH ativo na clínica
    const rhAtivoCheck = await query(
      "SELECT cpf, nome FROM funcionarios WHERE clinica_id = $1 AND perfil = 'rh' AND ativo = true",
      [clinica_id]
    );

    if (rhAtivoCheck.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Já existe um gestor RH ativo nesta clínica',
          gestor_ativo: rhAtivoCheck.rows[0] as Record<string, any>,
        },
        { status: 409 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha || '123456', 10);

    // Criar gestor RH
    const result = await query(
      `
      INSERT INTO funcionarios (
        cpf, nome, email, senha_hash, perfil, clinica_id, ativo
      ) VALUES ($1, $2, $3, $4, 'rh', $5, true)
      RETURNING cpf, nome, email, ativo, clinica_id, criado_em
    `,
      [cpfLimpo, nome, email, senhaHash, clinica_id]
    );

    // Registrar auditoria
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logAudit({
      resource: 'funcionarios',
      action: 'INSERT',
      resourceId: cpfLimpo,
      newData: result.rows[0] as Record<string, any>,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        gestor: result.rows[0] as Record<string, any>,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar gestor RH:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
