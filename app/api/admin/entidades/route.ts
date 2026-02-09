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
    const filtroTipo = searchParams.get('tipo'); // 'clinica' ou 'entidade' ou null (todos)

    // ARQUITETURA SEGREGADA:
    // - entidades = tomadores PARTICULARES (contrato direto)
    // - clinicas = tomadores MEDICINA OCUPACIONAL (através de empresa)
    // As tabelas são independentes - NÃO há FK entre elas
    // Usamos UNION para combinar os dados de ambas as tabelas

    let sql = '';
    const params: string[] = [];

    // Se filtrar por clinicas
    if (filtroTipo === 'clinica') {
      sql = `
        SELECT
          id,
          'clinica' as tipo,
          nome,
          cnpj,
          endereco,
          COALESCE(cidade, '') as cidade,
          COALESCE(estado, '') as estado,
          telefone,
          email,
          ativa,
          criado_em,
          responsavel_nome,
          responsavel_cpf,
          responsavel_email
        FROM clinicas
        ORDER BY nome
      `;
    }
    // Se filtrar por entidades
    else if (filtroTipo === 'entidade') {
      sql = `
        SELECT
          id,
          'entidade' as tipo,
          nome,
          cnpj,
          endereco,
          COALESCE(cidade, '') as cidade,
          COALESCE(estado, '') as estado,
          telefone,
          email,
          ativa,
          criado_em,
          responsavel_nome,
          responsavel_cpf,
          responsavel_email
        FROM entidades
        ORDER BY nome
      `;
    }
    // Se não filtrar, buscar AMBAS
    else {
      sql = `
        (
          SELECT
            id,
            'entidade' as tipo,
            nome,
            cnpj,
            endereco,
            COALESCE(cidade, '') as cidade,
            COALESCE(estado, '') as estado,
            telefone,
            email,
            ativa,
            criado_em,
            responsavel_nome,
            responsavel_cpf,
            responsavel_email
          FROM entidades
        )
        UNION ALL
        (
          SELECT
            id,
            'clinica' as tipo,
            nome,
            cnpj,
            endereco,
            COALESCE(cidade, '') as cidade,
            COALESCE(estado, '') as estado,
            telefone,
            email,
            ativa,
            criado_em,
            responsavel_nome,
            responsavel_cpf,
            responsavel_email
          FROM clinicas
        )
        ORDER BY tipo, nome
      `;
    }

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
    if (filtroTipo) {
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
