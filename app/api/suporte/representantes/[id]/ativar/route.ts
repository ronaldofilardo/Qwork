/**
 * POST /api/suporte/representantes/[id]/ativar
 *
 * Etapa 2 da aprovação de comissionamento: o Suporte cria a subconta Asaas
 * para o representante e o ativa, movendo o status para 'apto'.
 *
 * Fluxo:
 * 1. Verifica que o rep está em 'aprovacao_comercial' e tem modelo definido
 * 2. Cria subconta Asaas via API (dados bancários do representante)
 * 3. Salva o walletId retornado em representantes.asaas_wallet_id
 * 4. Muda status para 'apto'
 *
 * Se Asaas retorna erro OU walletId já existe, a ativação ainda prossegue
 * — o walletId pode ser preenchido manualmente depois via PATCH.
 *
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { asaasClient } from '@/lib/asaas/client';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Buscar representante com todos os dados necessários
    const result = await query(
      `SELECT id, nome, email, telefone, cpf, cnpj, tipo_pessoa,
              status, modelo_comissionamento, asaas_wallet_id,
              banco_codigo, agencia, conta, tipo_conta, titular_conta
       FROM representantes
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    const rep = result.rows[0] as {
      id: number;
      nome: string;
      email: string;
      telefone?: string | null;
      cpf?: string | null;
      cnpj?: string | null;
      tipo_pessoa: 'pj';
      status: string;
      modelo_comissionamento?: string | null;
      asaas_wallet_id?: string | null;
      banco_codigo?: string | null;
      agencia?: string | null;
      conta?: string | null;
      tipo_conta?: string | null;
      titular_conta?: string | null;
    };

    if (rep.status !== 'aprovacao_comercial') {
      return NextResponse.json(
        {
          error: `Representante está com status '${rep.status}'. Apenas 'aprovacao_comercial' pode ser ativado pelo Suporte.`,
          code: 'STATUS_INVALIDO',
        },
        { status: 409 }
      );
    }

    if (!rep.modelo_comissionamento) {
      return NextResponse.json(
        {
          error:
            'Modelo de comissionamento não definido. O Comercial deve aprovar primeiro.',
        },
        { status: 409 }
      );
    }

    // Tentar criar subconta Asaas (falha não bloqueia ativação)
    let walletId: string | null = rep.asaas_wallet_id ?? null;
    let asaasErro: string | null = null;

    if (!walletId) {
      try {
        const cpfCnpj = rep.cnpj;
        if (!cpfCnpj) throw new Error('CNPJ não preenchido');

        const dados = {
          nome: rep.nome,
          email: rep.email,
          cpfCnpj,
          telefone: rep.telefone ?? undefined,
          ...(rep.banco_codigo && rep.agencia && rep.conta
            ? {
                bankAccount: {
                  bank: { code: rep.banco_codigo },
                  accountName: rep.nome,
                  ownerName: rep.titular_conta ?? rep.nome,
                  cpfCnpj,
                  agency: rep.agencia,
                  account: rep.conta,
                  bankAccountType:
                    rep.tipo_conta === 'poupanca'
                      ? ('CONTA_POUPANCA' as const)
                      : ('CONTA_CORRENTE' as const),
                },
              }
            : {}),
        };

        const subconta = await asaasClient.criarSubcontaRepresentante(dados);
        walletId = subconta.walletId ?? null;
      } catch (asaasErr) {
        asaasErro =
          asaasErr instanceof Error ? asaasErr.message : String(asaasErr);
        console.warn(
          '[POST /api/suporte/representantes/[id]/ativar] Asaas subconta falhou:',
          asaasErro
        );
      }
    }

    // Ativar representante (independente do resultado Asaas)
    await query(
      `UPDATE representantes
       SET status         = 'apto',
           asaas_wallet_id = $1,
           aprovado_em    = NOW(),
           aprovado_por_cpf = $2,
           atualizado_em  = NOW()
       WHERE id = $3`,
      [walletId, session.cpf, id]
    );

    console.info(
      JSON.stringify({
        event: 'suporte_ativou_representante',
        representante_id: id,
        asaas_wallet_id: walletId,
        asaas_erro: asaasErro,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      ok: true,
      message: 'Representante ativado com sucesso.',
      asaas_wallet_id: walletId,
      ...(asaasErro
        ? { aviso_asaas: `Subconta Asaas não criada: ${asaasErro}` }
        : {}),
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[POST /api/suporte/representantes/[id]/ativar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
