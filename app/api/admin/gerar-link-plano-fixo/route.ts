import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { getBaseUrl } from '@/lib/utils/get-base-url';

/**
 * POST /api/admin/gerar-link-plano-fixo
 *
 * Gera link de pagamento direto para planos fixos e personalizados
 * Permite regenerar links de pagamento para tomadors aguardando pagamento
 *
 * Requisitos:
 * - Sessão de admin válida
 * - tomador com status 'aguardando_pagamento'
 * - tomador com plano_id associado (fixo ou personalizado)
 * - Para planos fixos: numero_funcionarios_estimado no cadastro
 * - Para planos personalizados: contrato com valor_total definido
 *
 * Body:
 * - tomador_id: ID do tomador
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
    const { tomador_id } = body;

    // Validação de entrada
    if (!tomador_id) {
      return NextResponse.json(
        { error: 'tomador_id é obrigatório' },
        { status: 400 }
      );
    }

    let transactionStarted = false;

    try {
      // Buscar dados completos do tomador
      const tomadorResult = await query(
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
        FROM tomadors c
        LEFT JOIN planos p ON c.plano_id = p.id
        WHERE c.id = $1`,
        [tomador_id]
      );

      if (tomadorResult.rows.length === 0) {
        console.warn('[ADMIN] tomador not found for id', tomador_id);
        // Não iniciamos transação antes da busca; nada a dar rollback aqui
        return NextResponse.json(
          { error: 'tomador não encontrado' },
          { status: 404 }
        );
      }

      const tomador = tomadorResult.rows[0];
      console.log('[ADMIN] tomador loaded', {
        tomador_id,
        tomador,
      });

      // Iniciar transação somente após confirmar que o tomador existe
      await query('BEGIN');
      transactionStarted = true;

      // Validações de estado
      // Preferir mensagem de 'já está ativo' quando ambos flags estão setados
      if (tomador.ativa) {
        console.warn(
          '[ADMIN] tomador ativa true for id',
          tomador_id,
          tomador
        );
        if (transactionStarted) await query('ROLLBACK');
        return NextResponse.json(
          {
            error: 'tomador já está ativo. Não é necessário reenviar link.',
            tomador_status: tomador.status,
          },
          { status: 400 }
        );
      }

      if (tomador.pagamento_confirmado) {
        console.warn(
          '[ADMIN] pagamento_confirmado true for tomador',
          tomador_id,
          tomador
        );
        if (transactionStarted) await query('ROLLBACK');
        return NextResponse.json(
          {
            error:
              'tomador já tem pagamento confirmado. Não é necessário reenviar link.',
            tomador_status: tomador.status,
          },
          { status: 400 }
        );
      }

      // Validar que tem plano associado
      if (!tomador.plano_id) {
        console.warn(
          '[ADMIN] tomador missing plano_id',
          tomador_id,
          tomador
        );
        if (transactionStarted) await query('ROLLBACK');
        return NextResponse.json(
          {
            error:
              'tomador não possui plano associado. Configure o plano antes de gerar link.',
          },
          { status: 400 }
        );
      }

      let numeroFuncionarios: number;
      let valorTotal: number;
      let precoPorFuncionario: number;

      if (tomador.plano_tipo === 'fixo') {
        console.log('[ADMIN] branch=fixed plan');
        // Validar número de funcionários para plano fixo
        if (
          !tomador.numero_funcionarios_estimado ||
          tomador.numero_funcionarios_estimado <= 0
        ) {
          console.warn(
            '[ADMIN] numero_funcionarios_estimado invalid',
            tomador_id,
            tomador.numero_funcionarios_estimado
          );
          if (transactionStarted) await query('ROLLBACK');
          return NextResponse.json(
            {
              error:
                'Número de funcionários não foi informado no cadastro. Atualize os dados do tomador antes de gerar link.',
            },
            { status: 400 }
          );
        }

        numeroFuncionarios = parseInt(tomador.numero_funcionarios_estimado);
        precoPorFuncionario = parseFloat(tomador.plano_preco);

        // Validar limite do plano (se houver)
        const limiteCaracteristicas =
          tomador.plano_caracteristicas?.limite_funcionarios;
        const limitePlano = limiteCaracteristicas
          ? parseInt(limiteCaracteristicas)
          : null;

        if (limitePlano && numeroFuncionarios > limitePlano) {
          console.warn('[ADMIN] numeroFuncionarios exceeds limit', {
            tomador_id,
            numeroFuncionarios,
            limitePlano,
          });
          if (transactionStarted) await query('ROLLBACK');
          return NextResponse.json(
            {
              error: `Número de funcionários (${numeroFuncionarios}) excede o limite do plano ${tomador.plano_nome} (${limitePlano}).`,
              numero_funcionarios: numeroFuncionarios,
              limite_plano: limitePlano,
            },
            { status: 400 }
          );
        }

        // Calcular valor total para plano fixo
        valorTotal = precoPorFuncionario * numeroFuncionarios;
      } else if (tomador.plano_tipo === 'personalizado') {
        console.log('[ADMIN] branch=personalized plan');
        console.log('[ADMIN] personalized: calling contratoResult', {
          tomador_id,
          plano_id: tomador.plano_id,
        });
        // Para plano personalizado, buscar valor do contrato
        const contratoResult = await query(
          `SELECT numero_funcionarios, valor_total FROM contratos
           WHERE tomador_id = $1 AND plano_id = $2
           ORDER BY criado_em DESC LIMIT 1`,
          [tomador_id, tomador.plano_id]
        );

        if (contratoResult.rows.length === 0) {
          console.warn(
            '[ADMIN] contrato not found for tomador',
            tomador_id
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
            error: `Tipo de plano "${tomador.plano_tipo}" não suportado para geração de link.`,
            plano_tipo: tomador.plano_tipo,
          },
          { status: 400 }
        );
      }

      // Buscar ou criar contrato
      let contratoId = null;
      const contratoExistenteResult = await query(
        `SELECT id FROM contratos 
         WHERE tomador_id = $1 
         ORDER BY criado_em DESC 
         LIMIT 1`,
        [tomador_id]
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
          [contratoId, tomador.plano_id, numeroFuncionarios, valorTotal]
        );
      } else {
        // Criar novo contrato
        const contratoConteudo = `Contrato de Serviço - ${tomador.plano_nome}

tomador: ${tomador.nome}
CNPJ: ${tomador.cnpj}
Responsável: ${tomador.responsavel_nome}

Plano: ${tomador.plano_nome}
Número de Funcionários: ${numeroFuncionarios}
Valor por Funcionário: R$ ${precoPorFuncionario.toFixed(2)}
Valor Total: R$ ${valorTotal.toFixed(2)}

Status: Aguardando Pagamento`;

        const novoContratoResult = await query(
          `INSERT INTO contratos (
            tomador_id,
            plano_id,
            numero_funcionarios,
            valor_total,
            status,
            conteudo,
            conteudo_gerado
          ) VALUES ($1, $2, $3, $4, 'aguardando_pagamento', $5, $5)
          RETURNING id`,
          [
            tomador_id,
            tomador.plano_id,
            numeroFuncionarios,
            valorTotal,
            contratoConteudo,
          ]
        );

        console.log('[ADMIN] novoContratoResult', { novoContratoResult });
        contratoId = novoContratoResult.rows[0].id;
      }

      // Atualizar status do tomador
      await query(
        `UPDATE tomadors 
         SET status = 'aguardando_pagamento',
             ativa = false,
             pagamento_confirmado = false
         WHERE id = $1`,
        [tomador_id]
      );

      // Registrar auditoria
      await logAudit({
        resource: 'tomadors',
        action: 'GENERATE_PAYMENT_LINK',
        resourceId: tomador_id,
        details: JSON.stringify({
          tipo_plano: tomador.plano_tipo,
          plano_id: tomador.plano_id,
          plano_nome: tomador.plano_nome,
          numero_funcionarios: numeroFuncionarios,
          valor_total: valorTotal,
          contrato_id: contratoId,
          severity: 'low',
        }),
      });

      await query('COMMIT');

      // Construir URL do link de pagamento (sem token)
      const baseUrl = getBaseUrl();
      const paymentLink = `${baseUrl}/pagamento/simulador?tomador_id=${tomador_id}&plano_id=${tomador.plano_id}&numero_funcionarios=${numeroFuncionarios}&contrato_id=${contratoId}&retry=true`;

      // Log estruturado
      console.info(
        JSON.stringify({
          event: `payment_link_generated_${tomador.plano_tipo}`,
          tomador_id,
          tomador_nome: tomador.nome,
          plano_id: tomador.plano_id,
          plano_nome: tomador.plano_nome,
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
            plano_nome: tomador.plano_nome,
            plano_tipo: tomador.plano_tipo,
            numero_funcionarios: numeroFuncionarios,
            valor_por_funcionario: precoPorFuncionario,
            valor_total: valorTotal,
          },
          tomador_info: {
            id: tomador_id,
            nome: tomador.nome,
            cnpj: tomador.cnpj,
            responsavel_nome: tomador.responsavel_nome,
            responsavel_email: tomador.responsavel_email,
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
