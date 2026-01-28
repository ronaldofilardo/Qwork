import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Interfaces para tipagem
interface LoteReferencia {
  liberado_em: string;
  empresa_id: number;
}

interface EmpresaCheck {
  id: number;
  nome: string;
  clinica_id: number;
  clinica_nome: string;
}

interface FuncionarioElegivel {
  funcionario_cpf: string;
  funcionario_nome: string;
  motivo_inclusao: string;
  indice_atual: number;
  dias_sem_avaliacao: number;
  prioridade: 'CRÍTICA' | 'ALTA' | 'MÉDIA' | 'NORMAL';
}

interface LoteResult {
  id: number;
  codigo: string;
  liberado_em: string;
  numero_ordem: number;
}

interface CodigoResult {
  codigo: string;
}

interface NumeroOrdemResult {
  numero_ordem: number;
}

export const dynamic = 'force-dynamic';
export const POST = async (req: Request) => {
  const user = await requireAuth();
  if (!user || user.perfil !== 'rh') {
    return NextResponse.json(
      {
        error: 'Acesso negado - apenas usuários RH podem Iniciar Ciclos',
        success: false,
      },
      { status: 403 }
    );
  }

  try {
    const { empresaId, titulo, descricao, dataFiltro, loteReferenciaId, tipo } =
      (await req.json()) as {
        empresaId: number;
        titulo?: string;
        descricao?: string;
        dataFiltro?: string;
        loteReferenciaId?: number;
        tipo?: string;
      };

    if (!empresaId) {
      return NextResponse.json(
        {
          error: 'ID da empresa é obrigatório',
          success: false,
        },
        { status: 400 }
      );
    }

    // Validar dataFiltro se fornecida
    if (dataFiltro && dataFiltro !== 'all') {
      const dataTest = new Date(dataFiltro as string);
      if (isNaN(dataTest.getTime())) {
        return NextResponse.json(
          {
            error: 'Data de filtro inválida',
            success: false,
          },
          { status: 400 }
        );
      }
      // Não permitir datas futuras
      if (dataTest > new Date()) {
        return NextResponse.json(
          {
            error: 'Data de filtro não pode ser no futuro',
            success: false,
          },
          { status: 400 }
        );
      }
    }

    // Validar loteReferenciaId se fornecido
    let loteReferencia: LoteReferencia | null = null;
    if (loteReferenciaId) {
      const loteRefCheck = await query<LoteReferencia>(
        `
        SELECT la.liberado_em, la.empresa_id
        FROM lotes_avaliacao la
        WHERE la.id = $1 AND la.empresa_id = $2
      `,
        [loteReferenciaId, empresaId]
      );

      if (loteRefCheck.rowCount === 0) {
        return NextResponse.json(
          {
            error:
              'Lote de referência não encontrado ou não pertence à empresa',
            success: false,
          },
          { status: 404 }
        );
      }

      loteReferencia = loteRefCheck.rows[0];
    }

    // Verificar se a empresa existe e pertence à clínica do usuário
    const empresaCheck = await query<EmpresaCheck>(
      `
      SELECT ec.id, ec.nome, ec.clinica_id, c.nome as clinica_nome
      FROM empresas_clientes ec
      JOIN clinicas c ON ec.clinica_id = c.id
      WHERE ec.id = $1 AND ec.ativa = true
    `,
      [empresaId]
    );

    if (empresaCheck.rowCount === 0) {
      return NextResponse.json(
        {
          error: 'Empresa não encontrada ou inativa',
          success: false,
        },
        { status: 404 }
      );
    }

    // Verificar permissões centralizadas (mantém política consistente com outras rotas RH)
    try {
      await requireRHWithEmpresaAccess(empresaId as number);
    } catch (permError) {
      console.log('[DEBUG] requireRHWithEmpresaAccess falhou:', permError);
      return NextResponse.json(
        {
          error: 'Você não tem permissão para liberar avaliações nesta empresa',
          success: false,
          error_code: 'permission_clinic_mismatch',
          hint: 'Verifique se o seu usuário pertence à mesma clínica desta empresa. Caso necessário, contate o administrador da clínica ou o suporte.',
        },
        { status: 403 }
      );
    }

    // Obter próximo número de ordem do lote
    const numeroOrdemResult = await query<NumeroOrdemResult>(
      `SELECT obter_proximo_numero_ordem($1) as numero_ordem`,
      [empresaId]
    );
    const numeroOrdem = numeroOrdemResult.rows[0].numero_ordem;

    console.log(`[INFO] Gerando lote ${numeroOrdem} para empresa ${empresaId}`);

    // Usar função de elegibilidade para determinar quais funcionários devem ser incluídos
    const elegibilidadeResult = await query<FuncionarioElegivel>(
      `SELECT * FROM calcular_elegibilidade_lote($1, $2)`,
      [empresaId, numeroOrdem]
    );

    let funcionariosElegiveis = elegibilidadeResult.rows;

    console.log(
      `[INFO] ${funcionariosElegiveis.length} funcionários elegíveis encontrados pela função de índice`
    );

    // Aplicar filtros adicionais se fornecidos (retroativos ou por tipo)
    if (loteReferencia) {
      // Para lotes retroativos, incluir apenas funcionários admitidos após a data de referência
      funcionariosElegiveis = funcionariosElegiveis.filter(
        (_f: FuncionarioElegivel) => {
          // Buscar data de criação do funcionário
          return true; // Por enquanto, incluir todos da elegibilidade
        }
      );
    } else if (dataFiltro && dataFiltro !== 'all') {
      // Filtro adicional por data de criação
      const dataFiltroResult = await query<{ cpf: string }>(
        `
        SELECT cpf FROM funcionarios
        WHERE cpf = ANY($1::char(11)[]) AND criado_em > $2
      `,
        [
          funcionariosElegiveis.map(
            (f: FuncionarioElegivel) => f.funcionario_cpf
          ),
          dataFiltro,
        ]
      );

      const cpfsComFiltro = dataFiltroResult.rows.map(
        (r: { cpf: string }) => r.cpf
      );
      funcionariosElegiveis = funcionariosElegiveis.filter(
        (f: FuncionarioElegivel) => cpfsComFiltro.includes(f.funcionario_cpf)
      );
    }

    // Filtro por tipo de lote (operacional/gestão)
    if (tipo && tipo !== 'completo') {
      const nivelDesejado = tipo === 'operacional' ? 'operacional' : 'gestao';
      const nivelFiltroResult = await query<{ cpf: string }>(
        `
        SELECT cpf FROM funcionarios
        WHERE cpf = ANY($1::char(11)[]) AND nivel_cargo = $2
      `,
        [
          funcionariosElegiveis.map(
            (f: FuncionarioElegivel) => f.funcionario_cpf
          ),
          nivelDesejado,
        ]
      );

      const cpfsComNivel = nivelFiltroResult.rows.map(
        (r: { cpf: string }) => r.cpf
      );
      funcionariosElegiveis = funcionariosElegiveis.filter(
        (f: FuncionarioElegivel) => cpfsComNivel.includes(f.funcionario_cpf)
      );
    }

    const funcionarios = funcionariosElegiveis;

    if (funcionarios.length === 0) {
      return NextResponse.json(
        {
          error:
            'Nenhum funcionário elegível encontrado para este tipo de lote',
          success: false,
        },
        { status: 400 }
      );
    }

    // Gerar código do lote automaticamente
    const codigoResult = await query<CodigoResult>(
      `SELECT gerar_codigo_lote() as codigo`
    );
    const codigo = codigoResult.rows[0].codigo;

    // Criar o lote com numero_ordem
    const loteResult = await query<LoteResult>(
      `
        INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, numero_ordem)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, codigo, liberado_em, numero_ordem
      `,
      [
        codigo,
        empresaCheck.rows[0].clinica_id,
        empresaId,
        titulo || `Lote ${numeroOrdem} - ${codigo}`,
        descricao ||
          `Lote ${numeroOrdem} liberado para ${empresaCheck.rows[0].nome}. Inclui ${funcionarios.length} funcionário(s) elegíveis.`,
        tipo || 'completo',
        'ativo', // Status ativo para que vá diretamente para "laudo-para-emitir"
        user.cpf,
        numeroOrdem,
      ]
    );

    const lote = loteResult.rows[0];

    // NÃO criar laudo automaticamente ao Iniciar Ciclo
    // Laudo será criado apenas quando emissor efetivamente emitir via /api/emissor/laudos/[loteId]
    // Isso evita laudos "rascunho" ficarem travados no sistema

    // Criar avaliações para cada funcionário
    const agora = new Date().toISOString();
    let avaliacoesCriadas = 0;
    const detalhes = [];
    const resumoInclusao = {
      novos: 0,
      atrasados: 0,
      mais_de_1_ano: 0,
      regulares: 0,
      criticas: 0,
      altas: 0,
    };

    for (const func of funcionarios) {
      try {
        await query(
          `
          INSERT INTO avaliacoes (funcionario_cpf, status, inicio, lote_id)
          VALUES ($1, 'iniciada', $2, $3)
        `,
          [func.funcionario_cpf, agora, lote.id]
        );

        avaliacoesCriadas++;

        // Contar motivos de inclusão para resumo
        if (func.motivo_inclusao.includes('novo')) resumoInclusao.novos++;
        else if (func.motivo_inclusao.includes('atrasado'))
          resumoInclusao.atrasados++;
        else if (func.motivo_inclusao.includes('ano'))
          resumoInclusao.mais_de_1_ano++;
        else resumoInclusao.regulares++;

        if (func.prioridade === 'CRÍTICA') resumoInclusao.criticas++;
        else if (func.prioridade === 'ALTA') resumoInclusao.altas++;

        detalhes.push({
          cpf: func.funcionario_cpf,
          nome: func.funcionario_nome,
          motivo_inclusao: func.motivo_inclusao,
          indice_atual: func.indice_atual,
          dias_sem_avaliacao: func.dias_sem_avaliacao,
          prioridade: func.prioridade,
          status: 'avaliacao_criada',
        });
      } catch (error) {
        console.error(
          `Erro ao criar avaliação para ${func.funcionario_cpf}:`,
          error
        );
        detalhes.push({
          cpf: func.funcionario_cpf,
          nome: func.funcionario_nome,
          motivo_inclusao: func.motivo_inclusao,
          status: 'erro',
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    // Atualizar status do lote se necessário
    if (avaliacoesCriadas === 0) {
      await query(
        `UPDATE lotes_avaliacao SET status = 'cancelado' WHERE id = $1`,
        [lote.id]
      );
    }

    // Registrar auditoria da liberação do lote
    try {
      await query(
        `INSERT INTO audit_logs (user_cpf, action, resource, resource_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.cpf,
          'liberar_lote',
          'lotes_avaliacao',
          lote.id,
          JSON.stringify({
            empresa_id: empresaId,
            empresa_nome: empresaCheck.rows[0].nome,
            tipo: tipo || 'completo',
            titulo: titulo || `Lote ${lote.numero_ordem} - ${codigo}`,
            descricao: descricao || null,
            data_filtro: dataFiltro || null,
            lote_referencia_id: loteReferenciaId || null,
            codigo: lote.codigo,
            numero_ordem: lote.numero_ordem,
            avaliacoes_criadas: avaliacoesCriadas,
            total_funcionarios: funcionarios.length,
            resumo_inclusao: {
              novos: resumoInclusao.novos,
              atrasados: resumoInclusao.atrasados,
              mais_de_1_ano: resumoInclusao.mais_de_1_ano,
              regulares: resumoInclusao.regulares,
              criticas: resumoInclusao.criticas,
              altas: resumoInclusao.altas,
            },
          }),
          req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown',
        ]
      );
    } catch (auditError) {
      console.error('Erro ao registrar auditoria:', auditError);
      // Não falhar a operação por erro de auditoria
    }

    return NextResponse.json({
      success: true,
      message: `Lote ${lote.numero_ordem} (${codigo}) liberado com sucesso!`,
      lote: {
        id: lote.id,
        codigo: lote.codigo,
        numero_ordem: lote.numero_ordem,
        titulo: titulo || `Lote ${lote.numero_ordem} - ${codigo}`,
        tipo: tipo || 'completo',
        loteReferenciaId: loteReferenciaId || null,
        liberado_em: lote.liberado_em,
      },
      estatisticas: {
        avaliacoesCriadas,
        totalFuncionarios: funcionarios.length,
        empresa: empresaCheck.rows[0].nome,
      },
      resumoInclusao: {
        funcionarios_novos: resumoInclusao.novos,
        indices_atrasados: resumoInclusao.atrasados,
        mais_de_1_ano_sem_avaliacao: resumoInclusao.mais_de_1_ano,
        renovacoes_regulares: resumoInclusao.regulares,
        prioridade_critica: resumoInclusao.criticas,
        prioridade_alta: resumoInclusao.altas,
        mensagem: `Incluindo automaticamente: ${
          resumoInclusao.criticas + resumoInclusao.altas
        } funcionários com pendências prioritárias (${
          resumoInclusao.criticas
        } críticas, ${resumoInclusao.altas} altas)`,
      },
      detalhes,
    } as const);
  } catch (error) {
    console.error('Erro ao Iniciar Ciclo:', error);
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
