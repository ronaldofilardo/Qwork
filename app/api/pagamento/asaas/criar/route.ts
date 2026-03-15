import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { asaasClient } from '@/lib/asaas/client';
import { mapMetodoPagamentoToAsaasBillingType } from '@/lib/asaas/mappers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tomador_id,
      entidade_id, // backward compat
      contrato_id,
      _plano_id,
      _numero_funcionarios,
      valor_total,
      metodo = 'PIX', // PIX, BOLETO, CREDIT_CARD
      lote_id, // ID do lote de emissão (opcional)
      parcelas = 1, // Número de parcelas (1-12, apenas BOLETO e CREDIT_CARD)
    } = body;

    const numeroParcelas = Math.max(1, Math.min(12, Number(parcelas) || 1));

    const finalTomadorId = tomador_id || entidade_id;

    if (!finalTomadorId) {
      return NextResponse.json(
        { error: 'ID do tomador é obrigatório' },
        { status: 400 }
      );
    }

    if (!valor_total || valor_total <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Buscar dados do tomador
    const tomadorResult = await query(
      `SELECT t.id, t.nome, t.plano_id, t.status, 
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
