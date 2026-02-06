import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/session';

// GET /api/admin/planos/[id] - Buscar plano específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se usuário é admin
    const _session = await requireRole(['admin']);

    const { id } = params;

    const result = await query(
      `SELECT 
        id, 
        nome, 
        tipo, 
        descricao, 
        preco, 
        caracteristicas,
        ativo,
        created_at AS criado_em,
        updated_at AS atualizado_em
      FROM planos
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plano: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar plano' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/planos/[id] - Atualizar plano
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se usuário é admin
    const _session = await requireRole(['admin']);

    const { id } = params;
    const body = await request.json();
    const { nome, tipo, descricao, preco, caracteristicas, ativo } = body;

    // Validações
    if (!nome || !tipo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, tipo' },
        { status: 400 }
      );
    }

    if (!['fixo', 'personalizado'].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo inválido. Use 'fixo' ou 'personalizado'" },
        { status: 400 }
      );
    }

    if (tipo === 'fixo' && (preco === undefined || preco === null)) {
      return NextResponse.json(
        { error: 'Preço é obrigatório para planos fixos' },
        { status: 400 }
      );
    }

    if (tipo === 'fixo' && preco < 0) {
      return NextResponse.json(
        { error: 'Preço não pode ser negativo' },
        { status: 400 }
      );
    }

    // Verificar se plano existe
    const existing = await query('SELECT id FROM planos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe outro plano com mesmo nome
    const duplicateName = await query(
      'SELECT id FROM planos WHERE nome = $1 AND id != $2',
      [nome, id]
    );
    if (duplicateName.rows.length > 0) {
      return NextResponse.json(
        { error: 'Já existe outro plano com este nome' },
        { status: 400 }
      );
    }

    // Atualizar plano
    const result = await query(
      `UPDATE planos
       SET nome = $1, 
           tipo = $2, 
           descricao = $3, 
           preco = $4, 
           caracteristicas = $5, 
           ativo = $6,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, nome, tipo, preco, caracteristicas, ativo`,
      [
        nome,
        tipo,
        descricao || null,
        tipo === 'fixo' ? preco : null,
        JSON.stringify(caracteristicas || []),
        ativo !== false, // default true
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      plano: result.rows[0],
      message: 'Plano atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/planos/[id] - Excluir plano
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se usuário é admin
    const session = await requireRole(['admin']);

    const { id } = params;

    // Verificar se plano existe
    const existing = await query(
      'SELECT id, nome, tipo, preco FROM planos WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Requer senha do admin e justificativa para exclusão (mesmo se não estiver em uso)
    let body: any = {};
    try {
      // proteger contra request.json() em corpos vazios (gera SyntaxError em undici)
      body = await request.json();
    } catch (err: any) {
      console.error(
        'Corpo da requisição ausente ou inválido em DELETE /api/admin/planos/[id]:',
        err?.message || err
      );
      return NextResponse.json(
        {
          error:
            'Corpo da requisição inválido ou ausente. Envie JSON com admin_password e motivo.',
        },
        { status: 400 }
      );
    }

    const { admin_password, motivo } = body;

    if (!admin_password || typeof admin_password !== 'string') {
      return NextResponse.json(
        { error: 'admin_password é obrigatório para excluir um plano' },
        { status: 400 }
      );
    }

    if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
      return NextResponse.json(
        { error: 'motivo é obrigatório para excluir um plano' },
        { status: 400 }
      );
    }

    // Validar senha do admin (procurar primeiro em funcionarios, depois em usuarios)
    try {
      let hash: string | null = null;

      // Tentar encontrar admin em funcionarios (legacy / admin local)
      const adminRow = await query(
        "SELECT senha_hash FROM funcionarios WHERE cpf = $1 AND perfil = 'admin' AND ativo = true",
        [session.cpf]
      );

      if (adminRow.rows.length > 0) {
        hash = adminRow.rows[0].senha_hash;
        console.log(
          '[DELETE PLAN] Admin encontrado em funcionarios para validação de senha'
        );
      } else {
        // Fallback: tentar em usuarios (gestores/adm migrados)
        const uRow = await query(
          "SELECT senha_hash FROM usuarios WHERE cpf = $1 AND role IN ('admin') AND ativo = true",
          [session.cpf]
        );
        if (uRow.rows.length > 0) {
          hash = uRow.rows[0].senha_hash;
          console.log(
            '[DELETE PLAN] Admin encontrado em usuarios para validação de senha'
          );
        }
      }

      if (!hash) {
        return NextResponse.json(
          { error: 'Administrador não encontrado' },
          { status: 403 }
        );
      }

      const valid = await bcrypt.compare(admin_password, hash);

      if (!valid) {
        return NextResponse.json(
          { error: 'Senha do admin inválida' },
          { status: 403 }
        );
      }
    } catch (err) {
      console.error('Erro ao validar senha do admin:', err);
      return NextResponse.json(
        { error: 'Erro ao validar senha do admin' },
        { status: 500 }
      );
    }

    // Executar exclusão em transação usando múltiplas chamadas preparadas
    // (o driver do pg não aceita múltiplos comandos em um único prepared statement)
    try {
      await query('BEGIN');
      // SET LOCAL não aceita placeholders em alguns contexts; usar literal escapado
      const safeCpf = String(session.cpf).replace(/'/g, "''");
      const safePerfil = String(session.perfil).replace(/'/g, "''");
      await query(`SET LOCAL app.current_user_cpf = '${safeCpf}'`);
      await query(`SET LOCAL app.current_user_perfil = '${safePerfil}'`);

      await query(
        `INSERT INTO audit_logs
        (user_cpf, user_perfil, action, resource, resource_id, old_data, details)
        VALUES ($1, $2, 'DELETE', 'planos', $3, $4, $5)`,
        [
          session.cpf,
          session.perfil,
          id,
          JSON.stringify(existing.rows[0]),
          motivo,
        ]
      );

      await query(
        'UPDATE contratantes SET plano_id = NULL WHERE plano_id = $1',
        [id]
      );
      await query('DELETE FROM planos WHERE id = $1', [id]);
      await query('COMMIT');
    } catch (err: any) {
      console.error('Erro ao excluir plano (transação):', err);
      try {
        await query('ROLLBACK');
      } catch (rerr) {
        console.error('Erro ao efetuar ROLLBACK:', rerr);
      }

      // Tratamento específico para violação de FK — fornecer resposta útil ao cliente
      if (err && err.code === '23503') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Não foi possível excluir o plano: existem recursos dependentes (ex.: contratos, tokens ou histórico). Remova ou reatribua dependências e tente novamente.',
            detail: err.detail || null,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao excluir plano' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plano excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir plano:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir plano' },
      { status: 500 }
    );
  }
}
