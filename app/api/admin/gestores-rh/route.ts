import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';
/**
 * GET /api/admin/gestores-rh
 *
 * Lista todos os gestores RH do sistema.
 *
 * NOTA: Gestores RH são armazenados em `funcionarios` com
 * `usuario_tipo = 'rh'` para separação lógica clara.
 */
export async function GET() {
  try {
    await requireRole('admin');

    // ❌ PROBLEMA: Admin NÃO deve ter acesso a clinicas e empresas_clientes
    // Este endpoint precisa ser movido para /api/rh/ ou reimplementado
    // Query original fazia JOIN com clinicas e empresas_clientes

    return NextResponse.json(
      {
        error:
          'Endpoint temporariamente desativado - admin não deve acessar clínicas/empresas',
        details:
          'Gestores RH devem ser gerenciados via interface de RH, não admin',
      },
      { status: 403 }
    );

    /* Query original problemática:
    const result = await query(`
      SELECT 
        f.cpf,
        f.nome,
        f.email,
        f.usuario_tipo,
        f.perfil,
        f.ativo,
        f.clinica_id,
        c.nome as clinica_nome,  -- ❌ Admin não pode acessar clinicas
        f.criado_em,
        COUNT(DISTINCT ec.id) as total_empresas_geridas  -- ❌ Admin não pode acessar empresas_clientes
      FROM funcionarios f
      LEFT JOIN clinicas c ON c.id = f.clinica_id
      LEFT JOIN empresas_clientes ec ON ec.clinica_id = f.clinica_id
      WHERE f.usuario_tipo = 'rh'
      GROUP BY f.cpf, f.nome, f.email, f.usuario_tipo, f.perfil, f.ativo, f.clinica_id, c.nome, f.criado_em
      ORDER BY c.nome, f.nome
    `);

    return NextResponse.json({
      success: true,
      gestores: result.rows,
    });
    */
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
 * ❌ DESATIVADO: Admin NÃO deve criar gestores RH porque:
 * 1. Gestores RH estão vinculados a clínicas (admin não acessa clinicas)
 * 2. Criação de RH deve ser feita no cadastro da clínica
 * 3. Admin não deve validar existência de clínicas
 */
export async function POST(_request: NextRequest) {
  try {
    await requireRole('admin');

    return NextResponse.json(
      {
        error: 'Endpoint desativado - admin não gerencia gestores RH',
        details:
          'Gestores RH são criados automaticamente no cadastro da clínica',
      },
      { status: 403 }
    );

    /* Código original problemático:
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

    // ❌ PROBLEMA: Verificar se clínica existe
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

    // ❌ PROBLEMA: Verificar se já existe RH ativo na clínica
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

    // Criar gestor RH em USUARIOS (não em funcionarios)
    const result = await query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo, criado_em, atualizado_em)
       VALUES ($1, $2, $3, $4, 'rh', $5, true, NOW(), NOW())
       RETURNING cpf, nome, email, ativo, clinica_id, criado_em`,
      [cpfLimpo, nome, email, senhaHash, clinica_id]
    );

    // Registrar auditoria
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logAudit({
      resource: 'usuarios',
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
    */
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
