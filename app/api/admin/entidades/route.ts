import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

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
    const session = await requireRole(['suporte', 'admin'], false);

    const searchParams = new URL(request.url).searchParams;
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
          cl.id,
          'clinica' as tipo,
          cl.nome,
          cl.cnpj,
          cl.endereco,
          COALESCE(cl.cidade, '') as cidade,
          COALESCE(cl.estado, '') as estado,
          cl.telefone,
          cl.email,
          cl.ativa,
          cl.criado_em,
          cl.responsavel_nome,
          cl.responsavel_cpf,
          cl.responsavel_email,
          cl.cartao_cnpj_path,
          cl.contrato_social_path,
          cl.doc_identificacao_path,
          vc.id AS vinculo_id,
          vc.valor_negociado AS vinculo_valor_negociado,
          r.id AS representante_id,
          r.nome AS representante_nome,
          r.codigo AS representante_codigo
        FROM clinicas cl
        LEFT JOIN LATERAL (
          SELECT v.id, v.valor_negociado, v.representante_id
          FROM vinculos_comissao v
          WHERE v.clinica_id = cl.id AND v.status = 'ativo'
          ORDER BY v.criado_em DESC LIMIT 1
        ) vc ON true
        LEFT JOIN representantes r ON r.id = vc.representante_id
        ORDER BY cl.nome
      `;
    }
    // Se filtrar por entidades
    else if (filtroTipo === 'entidade') {
      sql = `
        SELECT
          e.id,
          'entidade' as tipo,
          e.nome,
          e.cnpj,
          e.endereco,
          COALESCE(e.cidade, '') as cidade,
          COALESCE(e.estado, '') as estado,
          e.telefone,
          e.email,
          e.ativa,
          e.criado_em,
          e.responsavel_nome,
          e.responsavel_cpf,
          e.responsavel_email,
          vc.id AS vinculo_id,
          vc.valor_negociado AS vinculo_valor_negociado,
          r.id AS representante_id,
          r.nome AS representante_nome,
          r.codigo AS representante_codigo
        FROM entidades e
        LEFT JOIN LATERAL (
          SELECT v.id, v.valor_negociado, v.representante_id
          FROM vinculos_comissao v
          WHERE v.entidade_id = e.id AND v.status = 'ativo'
          ORDER BY v.criado_em DESC LIMIT 1
        ) vc ON true
        LEFT JOIN representantes r ON r.id = vc.representante_id
        ORDER BY e.nome
      `;
    }
    // Se não filtrar, buscar AMBAS
    else {
      sql = `
        (
          SELECT
            e.id,
            'entidade' as tipo,
            e.nome,
            e.cnpj,
            e.endereco,
            COALESCE(e.cidade, '') as cidade,
            COALESCE(e.estado, '') as estado,
            e.telefone,
            e.email,
            e.ativa,
            e.criado_em,
            e.responsavel_nome,
            e.responsavel_cpf,
            e.responsavel_email,
            NULL as cartao_cnpj_path,
            NULL as contrato_social_path,
            NULL as doc_identificacao_path,
            vc.id AS vinculo_id,
            vc.valor_negociado AS vinculo_valor_negociado,
            r.id AS representante_id,
            r.nome AS representante_nome,
            r.codigo AS representante_codigo
          FROM entidades e
          LEFT JOIN LATERAL (
            SELECT v.id, v.valor_negociado, v.representante_id
            FROM vinculos_comissao v
            WHERE v.entidade_id = e.id AND v.status = 'ativo'
            ORDER BY v.criado_em DESC LIMIT 1
          ) vc ON true
          LEFT JOIN representantes r ON r.id = vc.representante_id
        )
        UNION ALL
        (
          SELECT
            cl.id,
            'clinica' as tipo,
            cl.nome,
            cl.cnpj,
            cl.endereco,
            COALESCE(cl.cidade, '') as cidade,
            COALESCE(cl.estado, '') as estado,
            cl.telefone,
            cl.email,
            cl.ativa,
            cl.criado_em,
            cl.responsavel_nome,
            cl.responsavel_cpf,
            cl.responsavel_email,
            cl.cartao_cnpj_path,
            cl.contrato_social_path,
            cl.doc_identificacao_path,
            vc.id AS vinculo_id,
            vc.valor_negociado AS vinculo_valor_negociado,
            r.id AS representante_id,
            r.nome AS representante_nome,
            r.codigo AS representante_codigo
          FROM clinicas cl
          LEFT JOIN LATERAL (
            SELECT v.id, v.valor_negociado, v.representante_id
            FROM vinculos_comissao v
            WHERE v.clinica_id = cl.id AND v.status = 'ativo'
            ORDER BY v.criado_em DESC LIMIT 1
          ) vc ON true
          LEFT JOIN representantes r ON r.id = vc.representante_id
        )
        ORDER BY criado_em DESC
      `;
    }

    const result = await query(sql, params, session);

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

      const representante =
        row.representante_id != null
          ? {
              vinculo_id: row.vinculo_id,
              representante_id: row.representante_id,
              nome: row.representante_nome,
              codigo: row.representante_codigo,
              valor_negociado: row.vinculo_valor_negociado
                ? parseFloat(row.vinculo_valor_negociado)
                : null,
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
        tem_documentos: {
          cartao_cnpj: !!row.cartao_cnpj_path,
          contrato_social: !!row.contrato_social_path,
          doc_identificacao: !!row.doc_identificacao_path,
        },
        gestor,
        representante,
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

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

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
