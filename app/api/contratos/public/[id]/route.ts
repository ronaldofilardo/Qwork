import { NextRequest, NextResponse } from 'next/server';
import { obterContrato } from '@/lib/contratos/contratos';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contratos/public/[id]
 *
 * Endpoint público para visualizar contratos que ainda não foram aceitos.
 * Permite acesso anônimo apenas para contratos pendentes de aceite.
 * Usado por links de suporte para novos usuários (ex: /sucesso-cadastro?contrato_id=112)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contratoId = params.id;
    console.log(
      '[GET /api/contratos/public] Requisição recebida para contrato:',
      contratoId
    );

    if (!contratoId) {
      console.log('[GET /api/contratos/public] ID não fornecido');
      return NextResponse.json(
        { error: 'ID do contrato é obrigatório' },
        { status: 400 }
      );
    }

    const contratoIdNum = parseInt(contratoId);
    console.log('[GET /api/contratos/public] ID numérico:', contratoIdNum);

    const contrato = await obterContrato(contratoIdNum);
    console.log(
      '[GET /api/contratos/public] obterContrato retornou:',
      !!contrato
    );

    if (!contrato) {
      console.log('[GET /api/contratos/public] Contrato não encontrado!');
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    console.log(
      '[GET /api/contratos/public] Contrato encontrado, aceito:',
      contrato.aceito
    );

    // Se contrato foi aceito, permitir visualização e retornar credenciais
    if (contrato.aceito) {
      try {
        // Buscar tomador para calcular credenciais
        const { query } = await import('@/lib/db');
        const tabelaTomador =
          contrato.tipo_tomador === 'clinica' ? 'clinicas' : 'entidades';

        const tomadorRes = await query(
          `SELECT cnpj, responsavel_cpf FROM ${tabelaTomador} WHERE id = $1`,
          [contrato.tomador_id]
        );

        if (tomadorRes.rows.length > 0) {
          const tomador = tomadorRes.rows[0];
          const cleanCnpj = (tomador.cnpj || '').replace(/[./-]/g, '');
          const loginCredencial = tomador.responsavel_cpf || cleanCnpj;
          const senhaCredencial = cleanCnpj.slice(-6);

          return NextResponse.json({
            success: true,
            contrato,
            credenciais: {
              login: loginCredencial,
              senha: senhaCredencial,
            },
          });
        }
      } catch (credErr) {
        console.error('Erro ao buscar credenciais:', credErr);
      }

      return NextResponse.json({
        success: true,
        contrato,
      });
    }

    return NextResponse.json({
      success: true,
      contrato,
    });
  } catch (error) {
    console.error('Erro ao consultar contrato público:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar contrato' },
      { status: 500 }
    );
  }
}
