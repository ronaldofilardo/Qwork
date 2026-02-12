import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { registrarAceite } from '@/lib/termos/registrar-aceite';
import { query } from '@/lib/db';
import { extrairContextoRequisicao } from '@/lib/auditoria/auditoria';

export const dynamic = 'force-dynamic';

/**
 * POST /api/termos/registrar
 * Registra o aceite de um termo (termos_uso ou politica_privacidade)
 * Body: { termo_tipo: 'termos_uso' | 'politica_privacidade' }
 */
export async function POST(request: Request) {
  try {
    const session = getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { termo_tipo } = await request.json();

    // Validação
    if (!['termos_uso', 'politica_privacidade'].includes(termo_tipo)) {
      return NextResponse.json(
        { error: 'Tipo de termo inválido' },
        { status: 400 }
      );
    }

    if (session.perfil !== 'rh' && session.perfil !== 'gestor') {
      return NextResponse.json(
        { error: 'Aceite não requerido para este perfil' },
        { status: 400 }
      );
    }

    // Buscar dados da entidade para redundância
    let entidadeDados: any;

    if (session.perfil === 'rh') {
      const clinicaRes = await query(
        `SELECT id, cnpj, nome FROM clinicas WHERE id = $1`,
        [session.clinica_id]
      );
      if (clinicaRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Clínica não encontrada' },
          { status: 404 }
        );
      }
      entidadeDados = {
        entidade_id: clinicaRes.rows[0].id,
        entidade_cnpj: clinicaRes.rows[0].cnpj,
        entidade_tipo: 'clinica' as const,
        entidade_nome: clinicaRes.rows[0].nome,
      };
    } else {
      // gestor
      const entidadeRes = await query(
        `SELECT id, cnpj, nome FROM entidades WHERE id = $1`,
        [session.entidade_id]
      );
      if (entidadeRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Entidade não encontrada' },
          { status: 404 }
        );
      }
      entidadeDados = {
        entidade_id: entidadeRes.rows[0].id,
        entidade_cnpj: entidadeRes.rows[0].cnpj,
        entidade_tipo: 'entidade' as const,
        entidade_nome: entidadeRes.rows[0].nome,
      };
    }

    // Extrair contexto da requisição
    const contexto = extrairContextoRequisicao(request);

    // Registrar aceite
    const resultado = await registrarAceite({
      usuario_cpf: session.cpf,
      usuario_tipo: session.perfil,
      usuario_entidade_id: entidadeDados.entidade_id,
      termo_tipo,
      ip_address: contexto.ip_address,
      user_agent: contexto.user_agent,
      sessao_id: (session as any).sessionToken || 'unknown',
      entidade_cnpj: entidadeDados.entidade_cnpj,
      entidade_tipo: entidadeDados.entidade_tipo,
      entidade_nome: entidadeDados.entidade_nome,
      responsavel_nome: session.nome || 'Usuário',
    });

    return NextResponse.json({
      success: true,
      termo_tipo,
      aceito_em: resultado.aceito_em,
    });
  } catch (error: any) {
    console.error('[TERMOS] Erro ao registrar aceite:', error);
    
    // HOTFIX: Retornar mensagem específica se migrations não foram executadas
    if (error?.message?.includes('TABLES_NOT_MIGRATED') || error?.code === '42P01') {
      return NextResponse.json(
        { 
          error: 'Recurso temporariamente indisponível',
          message: 'O sistema de aceite de termos está sendo preparado. Por favor, tente novamente em alguns instantes.',
          code: 'FEATURE_NOT_READY'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao registrar aceite' },
      { status: 500 }
    );
  }
}
