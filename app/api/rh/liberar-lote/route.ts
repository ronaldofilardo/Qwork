import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
import { queryAsGestorRH } from '@/lib/db-gestor';
import { withTransactionAsGestor } from '@/lib/db-transaction';
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
  // codigo removido - apenas ID é usado
  liberado_em: string;
  numero_ordem: number;
}

// CodigoResult removido - não usado mais

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
    const { empresaId, descricao, dataFiltro, loteReferenciaId, tipo } =
      (await req.json()) as {
        empresaId: number;
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

    // Obter próximo número de ordem do lote (usar contexto de gestor RH para set_config e auditoria)
    const numeroOrdemResult = await queryAsGestorRH<NumeroOrdemResult>(
      `SELECT obter_proximo_numero_ordem($1) as numero_ordem`,
      [empresaId]
    );
    const numeroOrdem = numeroOrdemResult.rows[0].numero_ordem;

    console.log(`[INFO] Gerando lote ${numeroOrdem} para empresa ${empresaId}`);

    // Usar função de elegibilidade para determinar quais funcionários devem ser incluídos (contexto do gestor)
    const elegibilidadeResult = await queryAsGestorRH<FuncionarioElegivel>(
      `SELECT * FROM calcular_elegibilidade_lote($1, $2)`,
      [empresaId, numeroOrdem]
    );

    let funcionariosElegiveis = elegibilidadeResult.rows;

    console.log(
      `[INFO] ${funcionariosElegiveis.length} funcionários elegíveis encontrados pela função de índice`
    );
    console.log(
      `[DEBUG] Funcionários elegíveis:`,
      funcionariosElegiveis.map((f) => ({
        cpf: f.funcionario_cpf,
        nome: f.funcionario_nome,
        motivo: f.motivo_inclusao,
      }))
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
      const dataFiltroResult = await queryAsGestorRH<{ cpf: string }>(
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
      const nivelFiltroResult = await queryAsGestorRH<{ cpf: string }>(
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

    console.log(
      `[DEBUG] Funcionários após todos os filtros: ${funcionarios.length}`
    );
    console.log(
      `[DEBUG] DataFiltro: ${dataFiltro}, Tipo: ${tipo}, LoteReferencia: ${loteReferenciaId}`
    );

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

    // ✅ CORREÇÃO: Usar transação explícita para garantir contexto de auditoria
    // withTransactionAsGestor mantém app.current_user_cpf durante toda a transação
    // Isso evita erro "SECURITY: app.current_user_cpf not set" após falhas parciais

    const resultado = await withTransactionAsGestor(async (client) => {
      // Verificar se o CPF do usuário está presente em `entidades_senhas`.
      // A FK `lotes_avaliacao.liberado_por` referencia `entidades_senhas(cpf)`,
      // então somente atribuímos o CPF se existir o registro — caso contrário usamos NULL.
      const liberadoPorCheck = await client.query<{ exists: boolean }>(
        `SELECT 1 FROM entidades_senhas WHERE cpf = $1 LIMIT 1`,
        [user.cpf]
      );
      const liberadoPor = liberadoPorCheck.rowCount > 0 ? user.cpf : null;

      // Criar o lote - Gestores RH usam query direta (não RLS)
      // Usa apenas ID (sem geração de codigo)
      const loteResult = await client.query<LoteResult>(
        `
          INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, liberado_em, numero_ordem
        `,
        [
          empresaCheck.rows[0].clinica_id,
          empresaId,
          descricao ||
            `Lote ${numeroOrdem} liberado para ${empresaCheck.rows[0].nome}. Inclui ${funcionarios.length} funcionário(s) elegíveis.`,
          tipo || 'completo',
          'ativo', // Status ativo para que vá diretamente para "laudo-para-emitir"
          liberadoPor,
          numeroOrdem,
        ]
      );

      const lote = loteResult.rows[0];

      // IMPORTANTE: Reservar ID do laudo igual ao ID do lote
      // Isso garante que laudo.id === lote.id sempre
      // O laudo será preenchido quando emissor clicar "Gerar Laudo"
      // ✅ SAVEPOINT: Isola erro do laudo para não abortar toda a transação
      try {
        await client.query('SAVEPOINT laudo_reserva');
        await client.query(
          `INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
           VALUES ($1, $1, 'rascunho', NOW(), NOW())`,
          [lote.id]
        );
        await client.query('RELEASE SAVEPOINT laudo_reserva');
      } catch (laudoReservaErr: any) {
        // Rollback apenas do SAVEPOINT, não da transação inteira
        await client.query('ROLLBACK TO SAVEPOINT laudo_reserva');
        console.warn(
          `[WARN] Falha ao reservar laudo para lote ${lote.id}: ${laudoReservaErr.message}`
        );
      }

      // NÃO criar laudo automaticamente ao Iniciar Ciclo
      // Laudo será criado apenas quando emissor efetivamente emitir via /api/emissor/laudos/[loteId]
      // Isso evita laudos "rascunho" ficarem travados no sistema

      // Criar avaliações para cada funcionário
      const agora = new Date().toISOString();
      let avaliacoesCriadas = 0;
      const detalhes = [];
      const errosDetalhados = [];
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
          await client.query(
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
            `[ERRO] Falha ao criar avaliação para ${func.funcionario_cpf} (${func.funcionario_nome}):`,
            error
          );
          const mensagemErro =
            error instanceof Error ? error.message : 'Erro desconhecido';
          errosDetalhados.push({
            cpf: func.funcionario_cpf,
            nome: func.funcionario_nome,
            erro: mensagemErro,
          });
          detalhes.push({
            cpf: func.funcionario_cpf,
            nome: func.funcionario_nome,
            motivo_inclusao: func.motivo_inclusao,
            status: 'erro',
            erro: mensagemErro,
          });
        }
      }

      // Verificar se pelo menos uma avaliação foi criada
      if (avaliacoesCriadas === 0) {
        throw new Error(
          `Nenhuma avaliação foi criada. Erros: ${errosDetalhados.map((e) => `${e.nome}: ${e.erro}`).join('; ')}`
        );
      }

      return {
        lote,
        avaliacoesCriadas,
        detalhes,
        errosDetalhados,
        resumoInclusao,
      };
    });

    // Validar resultado da transação
    if (resultado.avaliacoesCriadas === 0) {
      console.error(`[ERRO CRÍTICO] Nenhuma avaliação foi criada.`);
      console.error('[ERRO] Detalhes dos erros:', resultado.errosDetalhados);

      return NextResponse.json(
        {
          error:
            'Falha ao criar avaliações. Nenhum funcionário pôde ser incluído no lote.',
          success: false,
          detalhes:
            resultado.errosDetalhados.length > 0
              ? `Erros encontrados: ${resultado.errosDetalhados.map((e) => `${e.nome} (${e.cpf}): ${e.erro}`).join('; ')}`
              : 'Nenhuma avaliação foi criada com sucesso',
          funcionarios_com_erro: resultado.errosDetalhados,
        },
        { status: 500 }
      );
    }

    // Retornar sucesso com dados do lote criado
    return NextResponse.json({
      success: true,
      loteId: resultado.lote.id,
      numero_ordem: resultado.lote.numero_ordem,
      liberado_em: resultado.lote.liberado_em,
      avaliacoes_criadas: resultado.avaliacoesCriadas,
      total_funcionarios: funcionarios.length,
      resumo_inclusao: resultado.resumoInclusao,
      detalhes: resultado.detalhes,
    } as const);
  } catch (error) {
    console.error('[ERRO] Erro ao Iniciar Ciclo:', error);
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
