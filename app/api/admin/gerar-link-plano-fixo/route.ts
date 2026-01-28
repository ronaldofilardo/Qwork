import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { getBaseUrl } from '@/lib/utils/get-base-url';

/**
 * POST /api/admin/gerar-link-plano-fixo
 *
 * Gera link de pagamento direto para planos fixos e personalizados
 * Permite regenerar links de pagamento para contratantes aguardando pagamento
 *
 * Requisitos:
 * - Sessão de admin válida
 * - Contratante com status 'aguardando_pagamento'
 * - Contratante com plano_id associado (fixo ou personalizado)
 * - Para planos fixos: numero_funcionarios_estimado no cadastro
 * - Para planos personalizados: contrato com valor_total definido
 *
 * Body:
 * - contratante_id: ID do contratante
 *
 * Retorna:
 * - payment_link: URL completa do simulador com parâmetros diretos
 */
export async function POST(request: NextRequest) {
  try {
    // Validar sessão de admin
    const session = getSession();
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        {
          error: 'Acesso negado. Apenas admins podem gerar links de pagamento.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contratante_id } = body;

    // Validação de entrada
    if (!contratante_id) {
      return NextResponse.json(
        { error: 'contratante_id é obrigatório' },
        { status: 400 }
      );
    }

    let transactionStarted = false;

    try {
      // Buscar dados completos do contratante
      const contratanteResult = await query(
        `SELECT 
          c.id,
          c.nome,
          c.cnpj,
          c.responsavel_nome,
          c.responsavel_email,
          c.status,
          c.plano_id,
          c.numero_funcionarios_estimado,
          c.ativa,
          c.pagamento_confirmado,
          p.nome AS plano_nome,
          p.tipo AS plano_tipo,
          p.preco AS plano_preco,
          p.caracteristicas AS plano_caracteristicas
        FROM contratantes c
        LEFT JOIN planos p ON c.plano_id = p.id
        WHERE c.id = $1`,
        [contratante_id]
      );

      if (contratanteResult.rows.length === 0) {
        console.warn('[ADMIN] contratante not found for id', contratante_id);
        // Não iniciamos transação antes da busca; nada a dar rollback aqui
        return NextResponse.json(
          { error: 'Contratante não encontrado' },
          { status: 404 }
        );
      }

      const contratante = contratanteResult.rows[0];
      console.log('[ADMIN] contratante loaded', {
        contratante_id,
        contratante,
      });

      // Iniciar transação somente após confirmar que o contratante existe
      await query('BEGIN');
      transactionStarted = true;

      // Validações de estado
      // Preferir mensagem de 'já está ativo' quando ambos flags estão setados
      if (contratante.ativa) {
        console.warn(
          '[ADMIN] contratante ativa true for id',
          contratante_id,
          contratante
        );
        if (transactionStarted) await query('ROLLBACK');
        return NextResponse.json(
          {
            error: 'Contratante já está ativo. Não é necessário reenviar link.',
            contratante_status: contratante.status,
          },
          { status: 400 }
        );
      }

      if (contratante.pagamento_confirmado) {
        console.warn(
          '[ADMIN] pagamento_confirmado true for contratante',
          contratante_id,
          contratante
        );
        if (transactionStarted) await query('ROLLBACK');
        return NextResponse.json(
          {
            error:
              'Contratante já tem pagamento confirmado. Não é necessário reenviar link.',
            contratante_status: contratante.status,
          },
          { status: 400 }
        );
      }

      // Validar que tem plano associado
      if (!contratante.plano_id) {
        console.warn(
          '[ADMIN] contratante missing plano_id',
          contratante_id,
          contratante
        );
        if (transactionStarted) await query('ROLLBACK');
        return NextResponse.json(
          {
            error:
              'Contratante não possui plano associado. Configure o plano antes de gerar link.',
          },
          { status: 400 }
        );
      }

      let numeroFuncionarios: number;
      let valorTotal: number;
      let precoPorFuncionario: number;

      if (contratante.plano_tipo === 'fixo') {
        console.log('[ADMIN] branch=fixed plan');
        // Validar número de funcionários para plano fixo
        if (
          !contratante.numero_funcionarios_estimado ||
          contratante.numero_funcionarios_estimado <= 0
        ) {
          console.warn(
            '[ADMIN] numero_funcionarios_estimado invalid',
            contratante_id,
            contratante.numero_funcionarios_estimado
          );
          if (transactionStarted) await query('ROLLBACK');
          return NextResponse.json(
            {
              error:
                'Número de funcionários não foi informado no cadastro. Atualize os dados do contratante antes de gerar link.',
            },
            { status: 400 }
          );
        }

        numeroFuncionarios = parseInt(contratante.numero_funcionarios_estimado);
        precoPorFuncionario = parseFloat(contratante.plano_preco);

        // Validar limite do plano (se houver)
        const limiteCaracteristicas =
          contratante.plano_caracteristicas?.limite_funcionarios;
        const limitePlano = limiteCaracteristicas
          ? parseInt(limiteCaracteristicas)
          : null;

        if (limitePlano && numeroFuncionarios > limitePlano) {
          console.warn('[ADMIN] numeroFuncionarios exceeds limit', {
            contratante_id,
            numeroFuncionarios,
            limitePlano,
          });
          if (transactionStarted) await query('ROLLBACK');
          return NextResponse.json(
            {
              error: `Número de funcionários (${numeroFuncionarios}) excede o limite do plano ${contratante.plano_nome} (${limitePlano}).`,
              numero_funcionarios: numeroFuncionarios,
              limite_plano: limitePlano,
            },
            { status: 400 }
          );
        }

        // Calcular valor total para plano fixo
        valorTotal = precoPorFuncionario * numeroFuncionarios;
      } else if (contratante.plano_tipo === 'personalizado') {
        console.log('[ADMIN] branch=personalized plan');
        console.log('[ADMIN] personalized: calling contratoResult', {
          contratante_id,
          plano_id: contratante.plano_id,
        });
        // Para plano personalizado, buscar valor do contrato
        const contratoResult = await query(
          `SELECT numero_funcionarios, valor_total FROM contratos
           WHERE contratante_id = $1 AND plano_id = $2
           ORDER BY criado_em DESC LIMIT 1`,
          [contratante_id, contratante.plano_id]
        );

        if (contratoResult.rows.length === 0) {
          console.warn(
            '[ADMIN] contrato not found for contratante',
            contratante_id
          );
          if (transactionStarted) await query('ROLLBACK');
          return NextResponse.json(
            {
              error:
                'Contrato não encontrado para plano personalizado. Configure o valor antes de gerar link.',
            },
            { status: 400 }
          );
        }

        const contrato = contratoResult.rows[0];
        console.log('[ADMIN] contratoResult', { contratoResult });
        numeroFuncionarios = parseInt(contrato.numero_funcionarios) || 1;
        valorTotal = parseFloat(contrato.valor_total);
        precoPorFuncionario = valorTotal / numeroFuncionarios; // Valor médio por funcionário
      } else {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error: `Tipo de plano "${contratante.plano_tipo}" não suportado para geração de link.`,
            plano_tipo: contratante.plano_tipo,
          },
          { status: 400 }
        );
      }

      // Buscar ou criar contrato
      let contratoId = null;
      const contratoExistenteResult = await query(
        `SELECT id FROM contratos 
         WHERE contratante_id = $1 
         ORDER BY criado_em DESC 
         LIMIT 1`,
        [contratante_id]
      );

      console.log('[ADMIN] contratoExistenteResult', {
        contratoExistenteResult,
      });
      if (contratoExistenteResult.rows.length > 0) {
        contratoId = contratoExistenteResult.rows[0].id;

        // Atualizar contrato existente
        await query(
          `UPDATE contratos 
           SET plano_id = $2,
               numero_funcionarios = $3,
               valor_total = $4,
               status = 'aguardando_pagamento'
           WHERE id = $1`,
          [contratoId, contratante.plano_id, numeroFuncionarios, valorTotal]
        );
      } else {
        // Criar novo contrato
        const contratoConteudo = `Contrato de Serviço - ${contratante.plano_nome}

Contratante: ${contratante.nome}
CNPJ: ${contratante.cnpj}
Responsável: ${contratante.responsavel_nome}

Plano: ${contratante.plano_nome}
Número de Funcionários: ${numeroFuncionarios}
Valor por Funcionário: R$ ${precoPorFuncionario.toFixed(2)}
Valor Total: R$ ${valorTotal.toFixed(2)}

Status: Aguardando Pagamento`;

        const novoContratoResult = await query(
          `INSERT INTO contratos (
            contratante_id,
            plano_id,
            numero_funcionarios,
            valor_total,
            status,
            conteudo,
            conteudo_gerado
          ) VALUES ($1, $2, $3, $4, 'aguardando_pagamento', $5, $5)
          RETURNING id`,
          [
            contratante_id,
            contratante.plano_id,
            numeroFuncionarios,
            valorTotal,
            contratoConteudo,
          ]
        );

        console.log('[ADMIN] novoContratoResult', { novoContratoResult });
        contratoId = novoContratoResult.rows[0].id;
      }

      // Atualizar status do contratante
      await query(
        `UPDATE contratantes 
         SET status = 'aguardando_pagamento',
             ativa = false,
             pagamento_confirmado = false
         WHERE id = $1`,
        [contratante_id]
      );

      // Registrar auditoria
      await logAudit({
        resource: 'contratantes',
        action: 'GENERATE_PAYMENT_LINK',
        resourceId: contratante_id,
        details: JSON.stringify({
          tipo_plano: contratante.plano_tipo,
          plano_id: contratante.plano_id,
          plano_nome: contratante.plano_nome,
          numero_funcionarios: numeroFuncionarios,
          valor_total: valorTotal,
          contrato_id: contratoId,
          severity: 'low',
        }),
      });

      await query('COMMIT');

      // Construir URL do link de pagamento (sem token)
      const baseUrl = getBaseUrl();
      const paymentLink = `${baseUrl}/pagamento/simulador?contratante_id=${contratante_id}&plano_id=${contratante.plano_id}&numero_funcionarios=${numeroFuncionarios}&contrato_id=${contratoId}&retry=true`;

      // Log estruturado
      console.info(
        JSON.stringify({
          event: `payment_link_generated_${contratante.plano_tipo}`,
          contratante_id,
          contratante_nome: contratante.nome,
          plano_id: contratante.plano_id,
          plano_nome: contratante.plano_nome,
          numero_funcionarios: numeroFuncionarios,
          valor_total: valorTotal,
          generated_by: session.cpf,
          generated_by_name: session.nome,
        })
      );

      return NextResponse.json({
        success: true,
        message: 'Link de pagamento gerado com sucesso',
        data: {
          payment_link: paymentLink,
          contrato_id: contratoId,
          payment_info: {
            plano_nome: contratante.plano_nome,
            plano_tipo: contratante.plano_tipo,
            numero_funcionarios: numeroFuncionarios,
            valor_por_funcionario: precoPorFuncionario,
            valor_total: valorTotal,
          },
          contratante_info: {
            id: contratante_id,
            nome: contratante.nome,
            cnpj: contratante.cnpj,
            responsavel_nome: contratante.responsavel_nome,
            responsavel_email: contratante.responsavel_email,
          },
        },
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error(
      '[ADMIN] Erro ao gerar link de pagamento para plano fixo:',
      error
    );

    return NextResponse.json(
      {
        error: 'Erro ao gerar link de pagamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
