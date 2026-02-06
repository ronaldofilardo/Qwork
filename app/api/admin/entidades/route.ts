import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/entidades
 * Retorna lista de entidades (clínicas e entidades) com seus gestores
 * Query params: ?tipo=clinica|entidade (opcional)
 *
 * IMPORTANTE: Admin precisa visualizar entidades para gerenciar usuários gestores,
 * mas não pode modificar dados operacionais (funcionários, avaliações, lotes)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo'); // 'clinica' ou 'entidade' ou null (todos)

    // Query que busca entidades e usa os campos responsavel_* como gestor
    // NOTA: A relação usuarios-clinicas-entidades ainda não está implementada no banco
    // Por enquanto, usamos apenas os dados de responsavel_* da tabela entidades
    let sql = `
      SELECT
        c.id,
        c.tipo,
        c.nome,
        c.cnpj,
        c.endereco,
        c.cidade,
        c.estado,
        c.telefone,
        c.email,
        c.ativa,
        c.criado_em,
        c.responsavel_nome,
        c.responsavel_cpf,
        c.responsavel_email
      FROM entidades c
    `;

    const params: string[] = [];

    if (tipo && (tipo === 'clinica' || tipo === 'entidade')) {
      sql += ' WHERE c.tipo = $1';
      params.push(tipo);
    }

    sql += ' ORDER BY c.tipo, c.nome';

    const result = await query(sql, params);

    // Transformar dados para estrutura esperada pelo frontend
    const entidades = result.rows.map((row) => {
      // Usar campos responsavel_* da tabela entidades
      const gestor = row.responsavel_cpf
        ? {
            nome: row.responsavel_nome,
            cpf: row.responsavel_cpf,
            email: row.responsavel_email,
            perfil: row.tipo === 'clinica' ? 'rh' : 'gestor',
          }
        : null;

      return {
        id: row.id,
        tipo: row.tipo,
        nome: row.nome,
        cnpj: row.cnpj,
        endereco: row.endereco,
        cidade: row.cidade,
        estado: row.estado,
        telefone: row.telefone,
        email: row.email,
        ativo: row.ativa,
        created_at: row.criado_em,
        gestor,
      };
    });

    // Se query com tipo específico, retornar com total
    if (tipo) {
      return NextResponse.json({
        success: true,
        total: entidades.length,
        entidades,
      });
    }

    // Se query sem filtro, retornar lista completa
    return NextResponse.json({
      success: true,
      entidades,
    });
  } catch (error) {
    console.error('Erro ao buscar entidades:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar entidades',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
