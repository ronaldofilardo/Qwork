import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { asaasClient } from '@/lib/asaas/client';
import { mapMetodoPagamentoToAsaasBillingType } from '@/lib/asaas/mappers';
import {
  calcularSplit,
  montarSplitAsaas,
  type OpcoesSplitCompleto,
} from '@/lib/asaas/subconta';

export const dynamic = 'force-dynamic';

const CriarPagamentoSchema = z.object({
  tomador_id: z.number().int().positive().optional(),
  entidade_id: z.number().int().positive().optional(), // backward compat
  contrato_id: z.number().int().positive().nullable().optional(),
  valor_total: z.number().positive(),
  metodo: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD']).default('PIX'),
  lote_id: z.number().int().positive().nullable().optional(),
  parcelas: z.number().int().min(1).max(12).default(1),
});

export async function POST(request: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido (JSON esperado)' },
        { status: 400 }
      );
    }

    const parsed = CriarPagamentoSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      tomador_id,
      entidade_id,
      contrato_id,
      valor_total,
      metodo,
      lote_id,
      parcelas,
    } = parsed.data;

    const numeroParcelas = Math.max(1, Math.min(12, Number(parcelas) || 1));

    const finalTomadorId = tomador_id ?? entidade_id;

    if (!finalTomadorId) {
      return NextResponse.json(
        { error: 'ID do tomador é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados do tomador
    const tomadorResult = await query(
      `SELECT t.id, t.nome, t.status, 
              COALESCE(t.numero_funcionarios_estimado, 1) as numero_funcionarios,
              t.tipo,
              e.cnpj as entidade_cnpj,
              e.email as entidade_email,
              c.cnpj as clinica_cnpj,
              c.email as clinica_email
       FROM tomadores t
       LEFT JOIN entidades e ON t.tipo = 'entidade' AND e.id = t.id
       LEFT JOIN clinicas c ON t.tipo = 'clinica' AND c.id = t.id
       WHERE t.id = $1`,
      [finalTomadorId]
    );

    if (tomadorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }

    const tomador = tomadorResult.rows[0];
    const cnpj = tomador.entidade_cnpj || tomador.clinica_cnpj;
    const email = tomador.entidade_email || tomador.clinica_email;

    if (!cnpj || !email) {
      return NextResponse.json(
        { error: 'Dados incompletos do tomador (CNPJ ou email ausente)' },
        { status: 400 }
      );
    }

    // Verificar isenção de pagamento
    const isentoRes = await query(
      `SELECT isento_pagamento FROM ${tomador.tipo === 'clinica' ? 'clinicas' : 'entidades'} WHERE id = $1`,
      [finalTomadorId]
    );
    if (isentoRes.rows[0]?.isento_pagamento === true) {
      return NextResponse.json({
        isento: true,
        message: 'Tomador isento de pagamento',
      });
    }

    // Converter método de pagamento
    const asaasBillingType = mapMetodoPagamentoToAsaasBillingType(metodo);

    // Criar registro de pagamento no banco
    const columnName =
      tomador.tipo === 'entidade' ? 'entidade_id' : 'clinica_id';
    const pagamentoResult = await query(
      `INSERT INTO pagamentos (
        ${columnName}, contrato_id, valor, status, metodo, plataforma_nome, dados_adicionais
      ) VALUES ($1, $2, $3, 'pendente', $4, 'Asaas', $5) RETURNING id`,
      [
        finalTomadorId,
        contrato_id || null,
        valor_total,
        metodo.toLowerCase(),
        // Gravar lote_id no JSONB para facilitar reconciliação sem N+1 API calls
        JSON.stringify({ lote_id: lote_id ?? null }),
      ]
    );

    const pagamentoId = pagamentoResult.rows[0].id;

    // Inicializar cliente Asaas
    const asaas = asaasClient;

    // Criar ou buscar cliente no Asaas
    let asaasCustomerId: string;
    try {
      const customer = await asaas.createCustomer({
        name: tomador.nome,
        cpfCnpj: cnpj,
        email: email,
        notificationDisabled: false,
      });
      asaasCustomerId = customer.id;
    } catch (err: any) {
      console.error('[ASAAS] Erro ao criar cliente:', err);

      // Marcar pagamento como erro
      try {
        await query(`UPDATE pagamentos SET status = 'erro' WHERE id = $1`, [
          pagamentoId,
        ]);
      } catch {}

      return NextResponse.json(
        { error: `Erro ao criar cliente: ${err.message}` },
        { status: 500 }
      );
    }

    // Criar cobrança no Asaas
    try {
      // Criar externalReference com lote_id se disponível para vincular no webhook
      const externalReference = lote_id
        ? `lote_${lote_id}_pagamento_${pagamentoId}`
        : `pagamento_${pagamentoId}`;

      console.log('[Asaas] 🔵 Criando pagamento:', {
        lote_id,
        tomador_id: finalTomadorId,
        valor_total,
        metodo: asaasBillingType,
        externalReference,
        pagamento_id: pagamentoId,
      });

      const valorTotal = Number(valor_total);
      const valorParcela =
        numeroParcelas > 1
          ? Math.round((valorTotal / numeroParcelas) * 100) / 100
          : valorTotal;

      const payment = await asaas.createPayment({
        customer: asaasCustomerId,
        billingType: asaasBillingType,
        value: valorTotal,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
          .toISOString()
          .split('T')[0],
        description: lote_id
          ? `Emissão de Laudo - Lote #${lote_id}`
          : `Pagamento de Avaliação - Lote`,
        externalReference,
        ...(numeroParcelas > 1 &&
          (asaasBillingType === 'BOLETO' ||
            asaasBillingType === 'CREDIT_CARD') && {
            installmentCount: numeroParcelas,
            installmentValue: valorParcela,
          }),
      });

      console.log('[Asaas] ✅ Pagamento criado no Asaas:', {
        asaas_payment_id: payment.id,
        asaas_status: payment.status,
        invoice_url: payment.invoiceUrl,
        lote_id,
        pagamento_id: pagamentoId,
      });

      const webhookUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXT_PUBLIC_URL ||
        'http://localhost:3000';
      console.log(
        '[Asaas] ⚠️  IMPORTANTE: Webhook deve ser enviado para:',
        `${webhookUrl}/api/webhooks/asaas`
      );
      console.log(
        '[Asaas] 🔗 Verifique se esta URL está configurada no painel Asaas Sandbox!'
      );

      // Gerar detalhes_parcelas JSONB quando parcelado
      let detalhesParcelas = null;
      if (numeroParcelas > 1) {
        const baseDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        detalhesParcelas = Array.from({ length: numeroParcelas }, (_, i) => {
          const venc = new Date(baseDue);
          venc.setMonth(venc.getMonth() + i);
          return {
            numero: i + 1,
            valor: valorParcela,
            data_vencimento: venc.toISOString().split('T')[0],
            pago: false,
            status: 'pendente',
          };
        });
      }

      // Atualizar pagamento com dados do Asaas
      await query(
        `UPDATE pagamentos 
         SET asaas_customer_id = $1,
             asaas_payment_id = $2,
             asaas_payment_url = $3,
             asaas_invoice_url = $4,
             asaas_due_date = $5,
             numero_parcelas = $7,
             detalhes_parcelas = $8
         WHERE id = $6`,
        [
          asaasCustomerId,
          payment.id,
          payment.invoiceUrl || null,
          payment.invoiceUrl || null,
          payment.dueDate,
          pagamentoId,
          numeroParcelas,
          detalhesParcelas ? JSON.stringify(detalhesParcelas) : null,
        ]
      );

      // Se for PIX, buscar QR Code
      let pixData = null;
      if (asaasBillingType === 'PIX') {
        try {
          const pixQrCode = await asaas.getPixQrCode(payment.id);
          pixData = {
            payload: pixQrCode.payload,
            encodedImage: pixQrCode.encodedImage,
            expirationDate: pixQrCode.expirationDate,
          };

          // Atualizar no banco
          await query(
            `UPDATE pagamentos 
             SET asaas_pix_qrcode = $1,
                 asaas_pix_qrcode_image = $2
             WHERE id = $3`,
            [pixQrCode.payload, pixQrCode.encodedImage, pagamentoId]
          );
        } catch (pixErr: any) {
          console.error('[ASAAS] Erro ao buscar QR Code PIX:', pixErr);
        }
      }

      // Se for Boleto, buscar URL
      let boletoUrl = null;
      if (asaasBillingType === 'BOLETO') {
        boletoUrl = payment.bankSlipUrl || payment.invoiceUrl;
        if (boletoUrl) {
          await query(
            `UPDATE pagamentos 
             SET asaas_boleto_url = $1
             WHERE id = $2`,
            [boletoUrl, pagamentoId]
          );
        }
      }

      // ---------------------------------------------------------------
      // Split de comissionamento: buscar vínculo ativo para o tomador
      // ---------------------------------------------------------------
      try {
        // Buscar configurações dinâmicas do gateway (taxa_transacao, boleto, pix, cartão)
        // Estas são gerenciadas pelo admin em: admin > financeiro > sociedade > taxas
        const configGatewayRes = await query(
          `SELECT codigo, descricao, tipo, valor, ativo
           FROM configuracoes_gateway
           WHERE ativo = true`
        );
        const configuracoesGateway = configGatewayRes.rows as Array<{
          codigo: string;
          descricao: string | null;
          tipo: 'taxa_fixa' | 'percentual';
          valor: number;
          ativo: boolean;
        }>;

        const vinculoRes = await query(
          `SELECT vc.id AS vinculo_id,
                  vc.representante_id,
                  r.asaas_wallet_id,
                  r.modelo_comissionamento,
                  r.percentual_comissao,
                  vc.percentual_comissao_representante,
                  r.status AS rep_status,
                  r.valor_custo_fixo_clinica,
                  r.valor_custo_fixo_entidade
           FROM vinculos_comissao vc
           JOIN representantes r ON r.id = vc.representante_id
           WHERE (vc.entidade_id = $1 OR vc.clinica_id = $1)
             AND vc.status = 'ativo'
             AND r.asaas_wallet_id IS NOT NULL
             AND r.modelo_comissionamento IS NOT NULL
             AND r.status = 'apto'
             AND vc.data_expiracao > NOW()
           LIMIT 1`,
          [finalTomadorId]
        );

        if (vinculoRes.rows.length > 0) {
          const v = vinculoRes.rows[0] as {
            vinculo_id: number;
            representante_id: number;
            asaas_wallet_id: string;
            modelo_comissionamento: 'percentual' | 'custo_fixo';
            percentual_comissao?: number | null;
            percentual_comissao_representante?: number | null;
            valor_custo_fixo_entidade?: number | null;
            valor_custo_fixo_clinica?: number | null;
            rep_status: string;
          };

          const tipoProduto =
            tomador.tipo === 'clinica' ? 'clinica' : 'entidade';

          // Usar percentual negociado no vínculo; fallback para global do representante
          const percRepFinal =
            v.percentual_comissao_representante ??
            v.percentual_comissao ??
            undefined;
          const valorCustoFixoRep =
            tipoProduto === 'clinica'
              ? (v.valor_custo_fixo_clinica ?? undefined)
              : (v.valor_custo_fixo_entidade ?? undefined);

          // Para modelo custo_fixo, o fixedValue Asaas deve ser o total do rep
          // por parcela = custoFixo × numAvaliacoes / numeroParcelas.
          // Ex: R$5 × 10 avaliações / 1 parcela = R$50 (por parcela Asaas).
          let custoFixoParaSplit: number | undefined = undefined;
          let numAvaliacoesLote = 1;
          if (
            v.modelo_comissionamento === 'custo_fixo' &&
            valorCustoFixoRep !== undefined
          ) {
            // Buscar avaliações liberadas do lote (status != rascunho)
            if (lote_id && lote_id > 0) {
              try {
                const avalCountRes = await query<{ count: string }>(
                  `SELECT COUNT(a.id)::int AS count
                   FROM avaliacoes a
                   WHERE a.lote_id = $1 AND a.status != 'rascunho'`,
                  [lote_id]
                );
                const counted = parseInt(
                  avalCountRes.rows[0]?.count ?? '0',
                  10
                );
                if (counted > 0) numAvaliacoesLote = counted;
              } catch {
                // fallback: numAvaliacoesLote = 1
              }
            }
            const totalCustoFixo =
              Number(valorCustoFixoRep) * numAvaliacoesLote;
            custoFixoParaSplit = totalCustoFixo / numeroParcelas;
          }

          // L3 fix: split deve ser calculado sobre o valor POR PARCELA, não o total.
          // O Asaas aplica fixedValue a cada parcela individualmente, portanto se
          // usar valorTotal o rep receria N × valorCorreto.
          const splitResult = calcularSplit(
            v.modelo_comissionamento,
            valorParcela,
            tipoProduto,
            percRepFinal !== undefined ? Number(percRepFinal) : undefined,
            custoFixoParaSplit !== undefined
              ? custoFixoParaSplit
              : valorCustoFixoRep !== undefined
                ? Number(valorCustoFixoRep)
                : undefined,
            {
              metodoPagamento: metodo,
              // Configurações do gateway lidas do banco (taxa_transacao, boleto, pix, cartão)
              // Garante que tx/transação configurada pelo admin seja usada no cálculo
              configuracoes: configuracoesGateway,
              numeroParcelas,
            }
          );

          if (splitResult.viavel) {
            // Buscar wallets dos beneficiários societários (impostos QWork + sócios)
            const sociedadeRes = await query(
              `SELECT codigo, asaas_wallet_id, percentual_participacao
               FROM beneficiarios_sociedade
               WHERE codigo IN ('qwork', 'ronaldo', 'antonio')
                 AND ativo = true`
            );
            const impostosWalletId =
              (
                sociedadeRes.rows.find(
                  (b: { codigo: string; asaas_wallet_id: string | null }) =>
                    b.codigo === 'qwork'
                ) as { asaas_wallet_id: string | null } | undefined
              )?.asaas_wallet_id ?? null;
            const beneficiariosSocios = (
              sociedadeRes.rows as Array<{
                codigo: string;
                asaas_wallet_id: string | null;
                percentual_participacao: string | number;
              }>
            )
              .filter((b) => b.codigo !== 'qwork' && b.asaas_wallet_id)
              .map((b) => ({
                walletId: b.asaas_wallet_id,
                percentual: Number(b.percentual_participacao),
              }));

            const opcoesCompleto: OpcoesSplitCompleto = {
              impostosWalletId,
              beneficiarios: beneficiariosSocios,
            };

            const splits = montarSplitAsaas(
              v.asaas_wallet_id,
              splitResult,
              opcoesCompleto
            );
            if (splits) {
              await asaasClient.adicionarSplitAoPayment(payment.id, splits);

              // Calcular valores para cada sócio (para auditoria)
              const totalPercSocios = beneficiariosSocios.reduce(
                (s, b) => s + b.percentual,
                0
              );
              let valorSocioRonaldo = 0;
              let valorSocioAntonio = 0;
              if (totalPercSocios > 0 && splitResult.valorQWork > 0) {
                const benRonaldo = beneficiariosSocios.find((_, i) => i === 0);
                const benAntonio = beneficiariosSocios.find((_, i) => i === 1);
                if (benRonaldo) {
                  valorSocioRonaldo =
                    Math.round(
                      ((splitResult.valorQWork * benRonaldo.percentual) /
                        totalPercSocios) *
                        100
                    ) / 100;
                }
                if (benAntonio) {
                  valorSocioAntonio =
                    Math.round(
                      (splitResult.valorQWork - valorSocioRonaldo) * 100
                    ) / 100;
                }
              }

              // Registrar na auditoria societária
              try {
                await query(
                  `INSERT INTO auditoria_sociedade_pagamentos
                     (pagamento_id, asaas_payment_id, tomador_id, lote_id,
                      modo_operacao, status,
                      valor_bruto, valor_impostos, valor_representante,
                      valor_socio_ronaldo, valor_socio_antonio,
                      detalhes)
                   VALUES ($1, $2, $3, $4, 'split', 'executado',
                           $5, $6, $7, $8, $9, $10)`,
                  [
                    pagamentoId,
                    payment.id,
                    finalTomadorId,
                    lote_id ?? null,
                    valorParcela,
                    splitResult.valorImpostos ?? 0,
                    splitResult.valorRepresentante,
                    valorSocioRonaldo,
                    valorSocioAntonio,
                    JSON.stringify({
                      modelo: splitResult.modelo,
                      percentualAplicado:
                        splitResult.percentualAplicado ?? null,
                      baseLiquida: splitResult.baseLiquida ?? null,
                      valorGateway: splitResult.valorGateway ?? null,
                      valorQWork: splitResult.valorQWork,
                      numeroParcelas,
                      splitItemsCount: splits.length,
                      impostosWalletConfigurado: Boolean(impostosWalletId),
                      sociosCount: beneficiariosSocios.length,
                    }),
                  ]
                );
              } catch (auditErr) {
                // Auditoria não deve bloquear o pagamento
                console.error(
                  '[ASAAS] Erro ao registrar auditoria societária:',
                  auditErr
                );
              }

              console.log('[ASAAS] ✅ Split configurado:', {
                parcela: valorParcela,
                rep: splitResult.valorRepresentante,
                impostos: splitResult.valorImpostos ?? 0,
                socioRonaldo: valorSocioRonaldo,
                socioAntonio: valorSocioAntonio,
                qwork: splitResult.valorQWork,
                total_splits: splits.length,
              });
            }
            // Comissão será criada automaticamente pelo webhook (criarComissaoAutomatica)
            // quando o pagamento for confirmado no Asaas
          }
        }
      } catch (splitErr) {
        // Split não deve bloquear o pagamento
        console.error(
          '[ASAAS] Erro ao aplicar split — pagamento prossegue sem split:',
          splitErr
        );
      }
      // ---------------------------------------------------------------

      // Retornar resposta formatada para CheckoutAsaas
      return NextResponse.json({
        success: true,
        pagamento: {
          id: pagamentoId,
          status: payment.status,
          asaas_payment_id: payment.id,
          asaas_payment_url: payment.invoiceUrl,
          asaas_boleto_url: boletoUrl,
          asaas_invoice_url: payment.invoiceUrl,
          asaas_pix_qrcode: pixData?.payload,
          asaas_pix_qrcode_image: pixData?.encodedImage,
          asaas_due_date: payment.dueDate,
        },
        pixQrCode: pixData,
        bankSlipUrl: boletoUrl,
        paymentUrl: payment.invoiceUrl,
        dueDate: payment.dueDate,
        billingType: asaasBillingType,
      });
    } catch (err: any) {
      console.error('[ASAAS] Erro ao criar pagamento:', err);

      // Marcar pagamento como erro
      await query(`UPDATE pagamentos SET status = 'erro' WHERE id = $1`, [
        pagamentoId,
      ]);

      return NextResponse.json(
        { error: `Erro ao criar pagamento: ${err.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[ASAAS] Erro na rota /api/pagamento/asaas/criar:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
