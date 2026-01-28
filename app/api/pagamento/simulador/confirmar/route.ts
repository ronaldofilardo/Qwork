import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contratante_id,
      contrato_id,
      _plano_id,
      numero_parcelas,
      metodo_pagamento,
    } = body;

    if (!contratante_id) {
      return NextResponse.json(
        { error: 'contratante_id é obrigatório' },
        { status: 400 }
      );
    }

    // Validar contratante (incluir dados do responsável para criar login)
    const contratanteRes = await query(
      'SELECT id, nome, cnpj, status, responsavel_cpf, responsavel_nome, responsavel_email FROM contratantes WHERE id = $1',
      [contratante_id]
    );
    if (contratanteRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 404 }
      );
    }

    // Validar contrato aceito (se informado) ou buscar contrato aceito existente
    let contratoIdValido = contrato_id || null;
    if (contratoIdValido) {
      const ctr = await query(
        'SELECT id, aceito FROM contratos WHERE id = $1 AND contratante_id = $2',
        [contratoIdValido, contratante_id]
      );
      if (ctr.rows.length === 0 || !ctr.rows[0].aceito) {
        return NextResponse.json(
          { error: 'Contrato deve ser aceito antes do simulador' },
          { status: 400 }
        );
      }
    } else {
      const ctr = await query(
        'SELECT id FROM contratos WHERE contratante_id = $1 AND aceito = true LIMIT 1',
        [contratante_id]
      );
      if (ctr.rows.length === 0) {
        return NextResponse.json(
          { error: 'Contrato deve ser aceito antes do simulador' },
          { status: 400 }
        );
      }
      contratoIdValido = ctr.rows[0].id;
    }

    // Calcular valor (simples): usar contrato.valor_total se disponível
    let valorTotal = null as number | null;
    try {
      const cRes = await query(
        'SELECT valor_total FROM contratos WHERE id = $1',
        [contratoIdValido]
      );
      if (cRes.rows.length > 0)
        valorTotal = parseFloat(cRes.rows[0].valor_total || 0);
    } catch {
      // ignore
    }

    // Criar pagamento marcado como pago (simulação)
    const metodo = metodo_pagamento || 'avista';
    const numeroParc = numero_parcelas || 1;

    const insert = await query(
      `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, numero_parcelas, data_pagamento)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id`,
      [contratante_id, contratoIdValido, valorTotal, 'pago', metodo, numeroParc]
    );

    const pagamentoId = insert.rows[0].id;

    // [NOVO FLUXO] Recibo NÃO é mais gerado automaticamente (fluxo removido por decisão de produto)
    console.log(
      '[SIMULADOR] Geração automática de recibo DESATIVADA - novo fluxo'
    );

    // Ativar contratante e criar login
    try {
      await query(
        `UPDATE contratantes SET status = 'aprovado', ativa = true, pagamento_confirmado = true, aprovado_em = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1`,
        [contratante_id]
      );

      // Criar login simples (se não existir)
      const contratante = contratanteRes.rows[0];
      const cpf = contratante.responsavel_cpf || null;

      if (cpf) {
        const exists = await query(
          'SELECT cpf FROM funcionarios WHERE cpf = $1',
          [cpf]
        );
        if (exists.rows.length === 0) {
          const cnpjRow = await query(
            'SELECT cnpj FROM contratantes WHERE id = $1',
            [contratante_id]
          );
          const cnpjLimpo = (cnpjRow.rows[0]?.cnpj || '').replace(/\D/g, '');
          const senhaInicial = cnpjLimpo.slice(-6) || 'changeme';
          try {
            await query('BEGIN');
            await query(
              `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, criado_em, atualizado_em)
               VALUES ($1,$2,$3,$4,'emissor',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
              [
                cpf,
                contratante.nome || cpf,
                contratante.email || null,
                senhaInicial,
              ]
            );
            await query('COMMIT');
          } catch (txErr) {
            try {
              await query('ROLLBACK');
            } catch {}
            console.error('[SIMULADOR] Erro ao criar login:', txErr);
          }
        }
      }
    } catch (activationErr) {
      console.error('[SIMULADOR] Erro na ativação:', activationErr);
    }

    return NextResponse.json(
      {
        success: true,
        pagamento_id: pagamentoId,
        contratante_id,
        acesso_liberado: true,
        login_liberado: true,
        redirect_to: '/',
        show_receipt_info: true,
        recibo: null, // Recibo não é mais gerado automaticamente
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      '[SIMULADOR] Erro processando confirmação do simulador:',
      error
    );
    return NextResponse.json(
      { error: 'Erro na confirmação do simulador', details: error?.message },
      { status: 500 }
    );
  }
}
