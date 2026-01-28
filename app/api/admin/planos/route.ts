import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';
// GET /api/admin/planos - Listar todos os planos
export async function GET(_request: NextRequest) {
  try {
    // Verificar se usuário é admin
    const session = await requireRole(['admin'], false);

    // Buscar planos
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
      ORDER BY ativo DESC, nome ASC`,
      [],
      session
    );

    return NextResponse.json({
      success: true,
      planos: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Erro ao listar planos' },
      { status: 500 }
    );
  }
}

// POST /api/admin/planos - Criar novo plano
export async function POST(request: NextRequest) {
  try {
    // Verificar se usuário é admin
    const _session = await requireRole(['admin']);

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

    // Verificar se já existe plano com mesmo nome
    const existing = await query('SELECT id FROM planos WHERE nome = $1', [
      nome,
    ]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um plano com este nome' },
        { status: 400 }
      );
    }

    // Criar plano
    const result = await query(
      `INSERT INTO planos (nome, tipo, descricao, preco, caracteristicas, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, tipo, preco, caracteristicas, ativo`,
      [
        nome,
        tipo,
        descricao || null,
        tipo === 'fixo' ? preco : null,
        JSON.stringify(caracteristicas || []),
        ativo !== false, // default true
      ]
    );

    return NextResponse.json({
      success: true,
      plano: result.rows[0],
      message: 'Plano criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 });
  }
}
