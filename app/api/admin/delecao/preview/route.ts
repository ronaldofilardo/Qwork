import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/delecao/preview?cnpj=12345678901234
 *
 * Busca tomador por CNPJ (14 dígitos puros) e retorna preview
 * de todos os registros que seriam deletados na cascata.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireRole('admin', false);

    const cnpj = request.nextUrl.searchParams.get('cnpj');
    if (!cnpj || !/^\d{14}$/.test(cnpj)) {
      return NextResponse.json(
        { error: 'CNPJ inválido. Informe 14 dígitos numéricos.' },
        { status: 400 }
      );
    }

    // Buscar na VIEW tomadores (UNION entidades + clinicas)
    const tomadorRes = await query<{
      id: number;
      nome: string;
      cnpj: string;
      tipo: string;
      responsavel_cpf: string | null;
      status: string | null;
    }>(
      `SELECT id, nome, cnpj, tipo, responsavel_cpf, status
       FROM tomadores
       WHERE cnpj = $1
       LIMIT 1`,
      [cnpj]
    );

    if (tomadorRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tomador não encontrado com este CNPJ.' },
        { status: 404 }
      );
    }

    const tomador = tomadorRes.rows[0];
    const isEntidade = tomador.tipo === 'entidade';
    const tomadorId = tomador.id;

    // Coletar IDs auxiliares
    const empresasRes = isEntidade
      ? { rows: [] as { id: number }[] }
      : await query<{ id: number }>(
          `SELECT id FROM empresas_clientes WHERE clinica_id = $1`,
          [tomadorId]
        );
    const empresaIds = empresasRes.rows.map((r) => r.id);

    // IDs de lotes
    let lotesQuery: string;
    let lotesParams: unknown[];
    if (isEntidade) {
      lotesQuery = `SELECT id FROM lotes_avaliacao WHERE entidade_id = $1`;
      lotesParams = [tomadorId];
    } else {
      lotesQuery = `SELECT id FROM lotes_avaliacao WHERE clinica_id = $1 OR empresa_id = ANY($2::int[])`;
      lotesParams = [tomadorId, empresaIds];
    }
    const lotesRes = await query<{ id: number }>(lotesQuery, lotesParams);
    const loteIds = lotesRes.rows.map((r) => r.id);

    // Funcionários vinculados
    let funcQuery: string;
    if (isEntidade) {
      funcQuery = `SELECT DISTINCT f.id, f.cpf FROM funcionarios f
        INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
        WHERE fe.entidade_id = $1`;
    } else {
      funcQuery = `SELECT DISTINCT f.id, f.cpf FROM funcionarios f
        INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
        WHERE fc.clinica_id = $1`;
    }
    const funcRes = await query<{ id: number; cpf: string }>(funcQuery, [
      tomadorId,
    ]);
    const funcCpfs = funcRes.rows.map((r) => r.cpf);

    // Contagens por tabela (cascata)
    const contagens: Record<string, number> = {};

    // Avaliações (via lotes + cpfs)
    if (loteIds.length > 0 || funcCpfs.length > 0) {
      const avalRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM avaliacoes
         WHERE lote_id = ANY($1::int[]) OR funcionario_cpf = ANY($2::varchar[])`,
        [loteIds, funcCpfs]
      );
      contagens.avaliacoes = parseInt(avalRes.rows[0]?.cnt || '0');

      // IDs de avaliações para subqueries
      const avalIdsRes = await query<{ id: number }>(
        `SELECT id FROM avaliacoes
         WHERE lote_id = ANY($1::int[]) OR funcionario_cpf = ANY($2::varchar[])`,
        [loteIds, funcCpfs]
      );
      const avalIds = avalIdsRes.rows.map((r) => r.id);

      if (avalIds.length > 0) {
        const respostasRes = await query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM respostas WHERE avaliacao_id = ANY($1::int[])`,
          [avalIds]
        );
        contagens.respostas = parseInt(respostasRes.rows[0]?.cnt || '0');

        const resultadosRes = await query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM resultados WHERE avaliacao_id = ANY($1::int[])`,
          [avalIds]
        );
        contagens.resultados = parseInt(resultadosRes.rows[0]?.cnt || '0');

        const analiseRes = await query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM analise_estatistica WHERE avaliacao_id = ANY($1::int[])`,
          [avalIds]
        );
        contagens.analise_estatistica = parseInt(
          analiseRes.rows[0]?.cnt || '0'
        );

        const resetsRes = await query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM avaliacao_resets WHERE avaliacao_id = ANY($1::int[])`,
          [avalIds]
        );
        contagens.avaliacao_resets = parseInt(resetsRes.rows[0]?.cnt || '0');
      }
    } else {
      contagens.avaliacoes = 0;
      contagens.respostas = 0;
      contagens.resultados = 0;
      contagens.analise_estatistica = 0;
      contagens.avaliacao_resets = 0;
    }

    // Laudos
    if (loteIds.length > 0) {
      const laudosRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM laudos WHERE lote_id = ANY($1::int[])`,
        [loteIds]
      );
      contagens.laudos = parseInt(laudosRes.rows[0]?.cnt || '0');

      const laudoIdsRes = await query<{ id: number }>(
        `SELECT id FROM laudos WHERE lote_id = ANY($1::int[])`,
        [loteIds]
      );
      const laudoIds = laudoIdsRes.rows.map((r) => r.id);

      if (laudoIds.length > 0) {
        const arqRes = await query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM laudo_arquivos_remotos WHERE laudo_id = ANY($1::int[])`,
          [laudoIds]
        );
        contagens.laudo_arquivos_remotos = parseInt(arqRes.rows[0]?.cnt || '0');

        const dlRes = await query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM laudo_downloads WHERE laudo_id = ANY($1::int[])`,
          [laudoIds]
        );
        contagens.laudo_downloads = parseInt(dlRes.rows[0]?.cnt || '0');

        const comLaudoRes = await query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM comissoes_laudo WHERE laudo_id = ANY($1::int[])`,
          [laudoIds]
        );
        contagens.comissoes_laudo = parseInt(comLaudoRes.rows[0]?.cnt || '0');
      }
    } else {
      contagens.laudos = 0;
      contagens.laudo_arquivos_remotos = 0;
      contagens.laudo_downloads = 0;
      contagens.comissoes_laudo = 0;
    }

    // Lotes
    contagens.lotes_avaliacao = loteIds.length;

    // Jobs/Queue/Audit (via lotes)
    if (loteIds.length > 0) {
      for (const tbl of [
        'laudo_generation_jobs',
        'emissao_queue',
        'fila_emissao',
        'auditoria_laudos',
      ]) {
        const r = await query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM ${tbl} WHERE lote_id = ANY($1::int[])`,
          [loteIds]
        );
        contagens[tbl] = parseInt(r.rows[0]?.cnt || '0');
      }
    }

    // Notificacoes_admin (via lote + clinica)
    if (loteIds.length > 0 || !isEntidade) {
      const notifRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM notificacoes_admin
         WHERE lote_id = ANY($1::int[]) ${!isEntidade ? 'OR clinica_id = $2' : ''}`,
        !isEntidade ? [loteIds, tomadorId] : [loteIds]
      );
      contagens.notificacoes_admin = parseInt(notifRes.rows[0]?.cnt || '0');
    }

    // Funcionários
    contagens.funcionarios = funcRes.rows.length;

    // Vínculos
    if (isEntidade) {
      const feRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM funcionarios_entidades WHERE entidade_id = $1`,
        [tomadorId]
      );
      contagens.funcionarios_entidades = parseInt(feRes.rows[0]?.cnt || '0');
    } else {
      const fcRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM funcionarios_clinicas WHERE clinica_id = $1`,
        [tomadorId]
      );
      contagens.funcionarios_clinicas = parseInt(fcRes.rows[0]?.cnt || '0');
    }

    // Vínculos comissão
    const vcRes = await query<{ cnt: string }>(
      isEntidade
        ? `SELECT COUNT(*) as cnt FROM vinculos_comissao WHERE entidade_id = $1`
        : `SELECT COUNT(*) as cnt FROM vinculos_comissao WHERE clinica_id = $1`,
      [tomadorId]
    );
    contagens.vinculos_comissao = parseInt(vcRes.rows[0]?.cnt || '0');

    // Comissões laudo via entidade
    if (isEntidade) {
      const clRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM comissoes_laudo WHERE entidade_id = $1`,
        [tomadorId]
      );
      contagens.comissoes_laudo_entidade = parseInt(clRes.rows[0]?.cnt || '0');
    }

    // Financial
    const contratosRes = await query<{ cnt: string }>(
      isEntidade
        ? `SELECT COUNT(*) as cnt FROM contratos WHERE entidade_id = $1`
        : `SELECT COUNT(*) as cnt FROM contratos WHERE clinica_id = $1`,
      [tomadorId]
    );
    contagens.contratos = parseInt(contratosRes.rows[0]?.cnt || '0');

    const pagRes = await query<{ cnt: string }>(
      isEntidade
        ? `SELECT COUNT(*) as cnt FROM pagamentos WHERE contrato_id IN (SELECT id FROM contratos WHERE entidade_id = $1)`
        : `SELECT COUNT(*) as cnt FROM pagamentos WHERE clinica_id = $1`,
      [tomadorId]
    );
    contagens.pagamentos = parseInt(pagRes.rows[0]?.cnt || '0');

    const recRes = await query<{ cnt: string }>(
      isEntidade
        ? `SELECT COUNT(*) as cnt FROM recibos WHERE contrato_id IN (SELECT id FROM contratos WHERE entidade_id = $1)`
        : `SELECT COUNT(*) as cnt FROM recibos WHERE clinica_id = $1`,
      [tomadorId]
    );
    contagens.recibos = parseInt(recRes.rows[0]?.cnt || '0');

    // Senhas
    if (isEntidade) {
      const senhasRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM entidades_senhas WHERE entidade_id = $1`,
        [tomadorId]
      );
      contagens.entidades_senhas = parseInt(senhasRes.rows[0]?.cnt || '0');
    } else {
      const senhasRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM clinicas_senhas WHERE clinica_id = $1`,
        [tomadorId]
      );
      contagens.clinicas_senhas = parseInt(senhasRes.rows[0]?.cnt || '0');
    }

    // Usuarios
    const usrRes = await query<{ cnt: string }>(
      isEntidade
        ? `SELECT COUNT(*) as cnt FROM usuarios WHERE entidade_id = $1`
        : `SELECT COUNT(*) as cnt FROM usuarios WHERE clinica_id = $1`,
      [tomadorId]
    );
    contagens.usuarios = parseInt(usrRes.rows[0]?.cnt || '0');

    // Empresas clientes (só clínica)
    if (!isEntidade) {
      contagens.empresas_clientes = empresaIds.length;
    }

    // Leads
    if (isEntidade) {
      const leadsRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM leads_representante WHERE entidade_id = $1`,
        [tomadorId]
      );
      contagens.leads_representante = parseInt(leadsRes.rows[0]?.cnt || '0');
    }

    // MFA
    if (funcCpfs.length > 0) {
      const mfaRes = await query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM mfa_codes WHERE cpf = ANY($1::varchar[])`,
        [funcCpfs]
      );
      contagens.mfa_codes = parseInt(mfaRes.rows[0]?.cnt || '0');
    }

    return NextResponse.json({
      tomador: {
        id: tomador.id,
        nome: tomador.nome,
        cnpj: tomador.cnpj,
        tipo: tomador.tipo,
        responsavel_cpf: tomador.responsavel_cpf,
        status: tomador.status,
      },
      contagens,
    });
  } catch (err) {
    console.error('[admin/delecao/preview] Erro:', err);
    if (err instanceof Error) {
      if (err.message === 'Sem permissão') {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
      if (err.message === 'MFA_REQUIRED') {
        return NextResponse.json({ error: 'MFA_REQUIRED' }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
