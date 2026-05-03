import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tomadores/[id]/credenciais
 *
 * Endpoint público para recuperar credenciais de um tomador após aceitar contrato.
 * Usado por links de sucesso para novos usuários (ex: /sucesso-cadastro?id=57&contrato_id=122)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tomadorId = params.id;

    if (!tomadorId) {
      return NextResponse.json(
        { error: 'ID do tomador é obrigatório' },
        { status: 400 }
      );
    }

    const tomadorIdNum = parseInt(tomadorId);
    if (isNaN(tomadorIdNum) || tomadorIdNum <= 0) {
      return NextResponse.json(
        { error: 'ID do tomador inválido' },
        { status: 400 }
      );
    }

    // Primeiro, buscar o contrato mais recente para este tomador
    // para confirmar que foi aceito
    const contratoRes = await query(
      `SELECT id, aceito, tipo_tomador FROM contratos 
       WHERE tomador_id = $1 
       ORDER BY criado_em DESC 
       LIMIT 1`,
      [tomadorIdNum]
    );

    if (contratoRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum contrato encontrado para este tomador' },
        { status: 404 }
      );
    }

    const contrato = contratoRes.rows[0];

    if (!contrato.aceito) {
      return NextResponse.json(
        { error: 'Contrato ainda não foi aceito' },
        { status: 400 }
      );
    }

    // Buscar dados do tomador (clínica ou entidade)
    const tabelaTomador =
      contrato.tipo_tomador === 'clinica' ? 'clinicas' : 'entidades';

    const tomadorRes = await query(
      `SELECT cnpj, responsavel_cpf FROM ${tabelaTomador} WHERE id = $1`,
      [tomadorIdNum]
    );

    if (tomadorRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }

    const tomador = tomadorRes.rows[0];
    const cleanCnpj = (tomador.cnpj || '').replace(/[./-]/g, '');
    const loginCredencial = tomador.responsavel_cpf || cleanCnpj;
    const senhaCredencial = cleanCnpj.slice(-6);

    return NextResponse.json({
      success: true,
      tomador: {
        id: tomadorIdNum,
        tipo: contrato.tipo_tomador,
        ativa: true, // Se chegou aqui com contrato aceito, deveria estar ativo
      },
      credenciais: {
        login: loginCredencial,
        senha: senhaCredencial,
      },
    });
  } catch (error) {
    console.error('[GET /api/tomadores/[id]/credenciais] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao recuperar credenciais' },
      { status: 500 }
    );
  }
}
