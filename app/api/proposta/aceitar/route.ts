import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getBaseUrl } from '@/lib/utils/get-base-url';

/**
 * POST /api/proposta/aceitar
 *
 * Entidade aceita proposta personalizada
 * Atualiza status e redireciona para página de contrato
 *
 * Body:
 * - contratacao_id: ID da contratação personalizada
 *
 * Retorna:
 * - redirect_url: URL do contrato para aceite
 * - contrato_id: ID do contrato criado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contratacao_id } = body;

    if (!contratacao_id) {
      return NextResponse.json(
        { error: 'contratacao_id é obrigatório' },
        { status: 400 }
      );
    }

    try {
      await query('BEGIN');

      // Buscar contratacao_personalizada
      const contratacaoResult = await query(
        `SELECT 
          cp.*,
          e.nome AS entidade_nome,
          e.cnpj,
          e.responsavel_nome,
          e.plano_id
        FROM contratacao_personalizada cp
        JOIN entidades e ON cp.entidade_id = e.id
        WHERE cp.id = $1`,
        [contratacao_id]
      );

      if (contratacaoResult.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          { error: 'Contratação não encontrada' },
          { status: 404 }
        );
      }

      const contratacao = contratacaoResult.rows[0];

      if (contratacao.status !== 'valor_definido') {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error: `Proposta não pode ser aceita no status "${contratacao.status}"`,
          },
          { status: 400 }
        );
      }

      // Criar contrato padrão
      const contratoConteudo = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PLANO PERSONALIZADO

ENTIDADE: ${contratacao.entidade_nome}
CNPJ: ${contratacao.cnpj}
RESPONSÁVEL: ${contratacao.responsavel_nome}

PLANO: Personalizado
NÚMERO DE FUNCIONÁRIOS: ${contratacao.numero_funcionarios_estimado}
VALOR POR FUNCIONÁRIO: R$ ${parseFloat(contratacao.valor_por_funcionario).toFixed(2)}
VALOR TOTAL: R$ ${parseFloat(contratacao.valor_total_estimado).toFixed(2)}

[Cláusulas do contrato padrão serão inseridas aqui]

Status: Aguardando Aceite da Entidade`;

      const contratoResult = await query(
        `INSERT INTO contratos (
          entidade_id,
          plano_id,
          numero_funcionarios,
          valor_total,
          status,
          conteudo,
          conteudo_gerado
        ) VALUES ($1, $2, $3, $4, 'aguardando_aceite', $5, $5)
        RETURNING id`,
        [
          contratacao.entidade_id,
          contratacao.plano_id,
          contratacao.numero_funcionarios_estimado,
          contratacao.valor_total_estimado,
          contratoConteudo,
        ]
      );

      const contratoId = contratoResult.rows[0].id;

      // Atualizar status da contratacao_personalizada
      await query(
        `UPDATE contratacao_personalizada 
        SET status = 'aguardando_aceite_contrato',
            atualizado_em = NOW()
        WHERE id = $1`,
        [contratacao_id]
      );

      // Registrar auditoria
      await logAudit({
        resource: 'contratacao_personalizada',
        action: 'UPDATE',
        resourceId: contratacao_id,
        details: JSON.stringify({
          entidade_id: contratacao.entidade_id,
          entidade_nome: contratacao.entidade_nome,
          numero_funcionarios: contratacao.numero_funcionarios_estimado,
          valor_total: contratacao.valor_total_estimado,
          contrato_id: contratoId,
          severity: 'medium',
        }),
      });

      await query('COMMIT');

      // Log estruturado
      console.info(
        JSON.stringify({
          event: 'personalizado_proposta_aceita',
          contratacao_id,
          entidade_id: contratacao.entidade_id,
          contrato_id: contratoId,
          numero_funcionarios: contratacao.numero_funcionarios_estimado,
          valor_total: contratacao.valor_total_estimado,
        })
      );

      const baseUrl = getBaseUrl();

      return NextResponse.json({
        success: true,
        message: 'Proposta aceita com sucesso',
        redirect_url: `${baseUrl}/sucesso-cadastro?id=${contratacao.entidade_id}&contrato_id=${contratoId}&origem=personalizado`,
        contrato_id: contratoId,
        contratacao_id,
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[PROPOSTA] Erro ao aceitar proposta:', error);

    return NextResponse.json(
      {
        error: 'Erro ao aceitar proposta',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
