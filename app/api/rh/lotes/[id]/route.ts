import { getSession, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  const user = getSession();
  if (!user) {
    return NextResponse.json(
      { error: 'Não autorizado', success: false },
      { status: 401 }
    );
  }

  if (user.perfil !== 'rh') {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const loteId = params.id;

    // Buscar detalhes do lote com empresa_id
    const loteQuery = await query(
      `
      SELECT
        la.id,
        la.descricao,
        la.tipo,
        la.status,
        la.liberado_em,
        f.nome as liberado_por_nome,
        ec.id as empresa_id,
        ec.nome as empresa_nome,
        ec.clinica_id,
        -- Informações de fila de emissão
        CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as emissao_solicitada,
        fe.solicitado_em as emissao_solicitado_em,
        -- Informações de laudo
        CASE 
          WHEN l.id IS NOT NULL AND (l.status = 'enviado' OR l.hash_pdf IS NOT NULL) 
          THEN true 
          ELSE false 
        END as tem_laudo,
        l.id as laudo_id,
        l.status as laudo_status,
        l.hash_pdf,
        l.emissor_cpf,
        f2.nome as emissor_nome,
        l.emitido_em
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
      LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
      LEFT JOIN laudos l ON l.lote_id = la.id
      LEFT JOIN funcionarios f2 ON l.emissor_cpf = f2.cpf
      WHERE la.id = $1 AND ec.ativa = true
    `,
      [loteId]
    );

    if (loteQuery.rowCount === 0) {
      return NextResponse.json(
        {
          error: 'Lote não encontrado',
          success: false,
        },
        { status: 404 }
      );
    }

    const lote = loteQuery.rows[0];

    // Verificar se existe arquivo local mesmo sem registro no DB
    let laudoFileExists = false;
    let laudoHashFromFile: string | null = null;

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const crypto = await import('crypto');

      const laudoId = lote.laudo_id || lote.id;
      const filePath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        `laudo-${laudoId}.pdf`
      );
      await fs.access(filePath);
      laudoFileExists = true;

      // Calcular hash do arquivo
      const buf = await fs.readFile(filePath);
      laudoHashFromFile = crypto.createHash('sha256').update(buf).digest('hex');
    } catch {
      // Arquivo não existe localmente, usar dados do DB apenas
    }

    // Se existe arquivo mas não tem registro, atualizar flags
    if (laudoFileExists && !lote.tem_laudo) {
      lote.tem_laudo = true;
      lote.laudo_id = lote.laudo_id || lote.id;
      lote.hash_pdf = laudoHashFromFile;
      lote.laudo_status = 'emitido';
    }

    // Usar requireRHWithEmpresaAccess para validar permissões com mapeamento de clínica
    try {
      await requireRHWithEmpresaAccess(lote.empresa_id);
    } catch (permError) {
      console.log(
        '[DEBUG] requireRHWithEmpresaAccess falhou para lote:',
        permError
      );
      return NextResponse.json(
        {
          error: 'Você não tem permissão para acessar este lote',
          success: false,
          error_code: 'permission_clinic_mismatch',
          hint: 'Verifique se o seu usuário pertence à mesma clínica desta empresa. Caso necessário, contate o administrador da clínica ou o suporte.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      lote: {
        id: lote.id,
        empresa_id: lote.empresa_id,
        empresa_nome: lote.empresa_nome,
        descricao: lote.descricao,
        tipo: lote.tipo,
        status: lote.status,
        liberado_em: lote.liberado_em,
        liberado_por_nome: lote.liberado_por_nome,
        emissao_solicitada: lote.emissao_solicitada || false,
        emissao_solicitado_em: lote.emissao_solicitado_em || null,
        tem_laudo: lote.tem_laudo || false,
        laudo_id: lote.laudo_id || null,
        laudo_status: lote.laudo_status || null,
        hash_pdf: lote.hash_pdf || null,
        emissor_cpf: lote.emissor_cpf || null,
        emissor_nome: lote.emissor_nome || null,
        emitido_em: lote.emitido_em || null,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar lote:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
