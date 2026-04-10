import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { VALOR_TAXA_MANUTENCAO } from '@/lib/manutencao-taxa';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/manutencao/empresa/[id]/confirmar
 * Gera cobrança de taxa de manutenção para uma empresa de clínica específica.
 * Apenas administradores e suporte têm acesso.
 *
 * Ação:
 *   - Verifica que a empresa ainda deve a taxa (valida novamente no servidor)
 *   - Cria registro em 'pagamentos' com tipo_cobranca='manutencao', valor=R$250
 *   - Marca empresas_clientes.manutencao_ja_cobrada = true
 *   - Retorna pagamento_id para o suporte usar no fluxo de "Gerar Link"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.perfil !== 'admin' && session.perfil !== 'suporte') {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });
  }

  const empresaId = parseInt(params.id, 10);
  if (isNaN(empresaId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    // Validar novamente no servidor
    const empresaRes = await query(
      `SELECT
         ec.id, ec.nome, ec.cnpj, ec.clinica_id,
         ec.manutencao_ja_cobrada,
         ec.limite_primeira_cobranca_manutencao,
         ec.ativa,
         cl.nome AS clinica_nome
       FROM empresas_clientes ec
       JOIN clinicas cl ON cl.id = ec.clinica_id
       WHERE ec.id = $1`,
      [empresaId]
    );

    if (empresaRes.rowCount === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    const empresa = empresaRes.rows[0];

    if (!empresa.ativa) {
      return NextResponse.json({ error: 'Empresa inativa' }, { status: 400 });
    }

    if (empresa.manutencao_ja_cobrada) {
      return NextResponse.json(
        { error: 'Taxa de manutenção já foi gerada para esta empresa' },
        { status: 409 }
      );
    }

    if (!empresa.limite_primeira_cobranca_manutencao) {
      return NextResponse.json(
        { error: 'Empresa não possui data limite de manutenção configurada' },
        { status: 400 }
      );
    }

    const limite = new Date(empresa.limite_primeira_cobranca_manutencao);
    if (limite > new Date()) {
      return NextResponse.json(
        { error: 'Prazo de 90 dias ainda não venceu para esta empresa' },
        { status: 400 }
      );
    }

    // Verificar se já existe laudo emitido para lotes desta empresa
    const laudoRes = await query(
      `SELECT 1
       FROM laudos l
       JOIN lotes_avaliacao la ON la.id = l.lote_id
       WHERE la.empresa_id = $1
         AND l.status IN ('emitido', 'enviado')
       LIMIT 1`,
      [empresaId]
    );

    if (laudoRes.rowCount > 0) {
      return NextResponse.json(
        {
          error:
            'Empresa já possui laudo emitido — taxa de manutenção não aplicável',
        },
        { status: 409 }
      );
    }

    // Criar pagamento com tipo_cobranca='manutencao' vinculado à clínica e à empresa
    const pagamentoRes = await query(
      `INSERT INTO pagamentos
         (clinica_id, empresa_id, valor, status, tipo_cobranca, metodo, observacoes, criado_em, atualizado_em)
       VALUES
         ($1, $2, $3, 'pendente', 'manutencao', 'boleto',
          'Taxa de manutenção — empresa ' || $4 || ' — emitida por suporte em ' || NOW()::text,
          NOW(), NOW())
       RETURNING id`,
      [empresa.clinica_id, empresaId, VALOR_TAXA_MANUTENCAO, empresa.nome]
    );

    const pagamentoId = pagamentoRes.rows[0].id as number;

    // Marcar empresa como cobrada (evita duplicação)
    await query(
      `UPDATE empresas_clientes
       SET manutencao_ja_cobrada = true, atualizado_em = NOW()
       WHERE id = $1`,
      [empresaId]
    );

    console.info(
      JSON.stringify({
        event: 'taxa_manutencao_gerada',
        tipo: 'empresa_clinica',
        empresa_id: empresaId,
        clinica_id: empresa.clinica_id,
        pagamento_id: pagamentoId,
        valor: VALOR_TAXA_MANUTENCAO,
        gerado_por: session.cpf ?? 'suporte',
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json(
      {
        success: true,
        pagamento_id: pagamentoId,
        valor: VALOR_TAXA_MANUTENCAO,
        empresa_nome: empresa.nome,
        clinica_nome: empresa.clinica_nome,
        message: 'Cobrança de taxa de manutenção gerada com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      '[POST /api/admin/manutencao/empresa/confirmar] Erro:',
      error
    );
    return NextResponse.json(
      { error: 'Erro ao gerar cobrança de manutenção' },
      { status: 500 }
    );
  }
}
