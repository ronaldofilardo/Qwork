import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/entidade/liberar-lote
 *
 * Criar lote de avaliação para a entidade
 *
 * Arquitetura Segregada:
 * - ENTIDADE (particular): gestor > funcionários diretos > lote > avaliações
 * - Autenticação: requireEntity() retorna { entidade_id, perfil: 'gestor' }
 * - Isolamento: lotes criados com entidade_id (XOR constraint: entidade_id OU clinica_id)
 * - Funcionários filtrados por: func.tomador_id = entidade_id
 *
 * @param {Request} req - POST body com tipo de lote
 * @returns {Object} { success, lote_id, titulo, ... } ou erro
 */
export const POST = async (req: Request) => {
  let session;
  try {
    session = await requireEntity();
  } catch {
    return NextResponse.json(
      {
        error:
          'Acesso negado - apenas gestores de entidade podem Iniciar Ciclos',
        success: false,
      },
      { status: 403 }
    );
  }

  try {
    // Parse do body (pode estar vazio)
    let descricao, dataFiltro, tipo;
    try {
      const body = await req.json();
      descricao = body.descricao;
      dataFiltro = body.dataFiltro;
      tipo = body.tipo;
    } catch {
      // Body vazio ou inválido - usar valores padrão
      console.log(
        '[LIBERAR-LOTE] Body vazio ou inválido, usando valores padrão'
      );
    }

    const entidadeId = session.entidade_id as number;

    // ✅ PADRONIZAÇÃO: Gestor sempre registrado como liberado_por
    // O CPF do gestor autenticado é usado mesmo que não seja funcionário formal
    // Isso garante rastreabilidade e consistência com o fluxo RH

    // ⚠️ ARQUITETURA: Entidades não se conectam com clínicas/empresas
    // Conforme diagrama do sistema:
    // - Entidade → Funcionários (direto via funcionarios_entidades)
    // - Clínica → EmpresaX → Funcionários (via funcionarios_clinicas)
    // Entidades e Clínicas são ambos TOMADORES independentes

    // Verificar se existem funcionários vinculados diretamente à entidade
    // Nota: Usa tabela intermediária funcionarios_entidades (arquitetura segregada)
    const hasEntidadeFuncsRes = await queryAsGestorEntidade(
      `SELECT 1 
       FROM funcionarios_entidades fe
       INNER JOIN funcionarios f ON f.id = fe.funcionario_id
       WHERE fe.entidade_id = $1 AND fe.ativo = true AND f.ativo = true 
       LIMIT 1`,
      [entidadeId]
    );

    const resultados: any[] = [];

    // Processar lote para funcionários vinculados diretamente à entidade
    if (hasEntidadeFuncsRes.rowCount > 0) {
      // Usar nome da entidade para exibir
      const entidadeRes = await queryAsGestorEntidade(
        `SELECT nome FROM entidades WHERE id = $1`,
        [entidadeId]
      );
      const entidadeNome =
        entidadeRes.rowCount > 0 ? entidadeRes.rows[0].nome : 'Entidade';

      // Próximo numero de ordem para lotes sem empresa (usamos empresa_id IS NULL)
      const numeroOrdemResult = await queryAsGestorEntidade(
        `SELECT COALESCE(MAX(numero_ordem), 0) + 1 as numero_ordem FROM lotes_avaliacao WHERE empresa_id IS NULL`
      );
      const numeroOrdem = numeroOrdemResult.rows[0].numero_ordem;

      // Calcular elegibilidade para tomador usando função nova
      const elegibilidadeResult = await queryAsGestorEntidade(
        `SELECT * FROM calcular_elegibilidade_lote_tomador($1::integer, $2::integer)`,
        [entidadeId, numeroOrdem]
      );

      let funcionariosElegiveis = elegibilidadeResult.rows;

      console.log(
        `[ENTIDADE-tomador] tomador ${entidadeId}: ${funcionariosElegiveis.length} funcionários elegíveis`
      );
      console.log(
        `[DEBUG] Elegíveis:`,
        funcionariosElegiveis.map((f: any) => ({
          cpf: f.funcionario_cpf,
          nome: f.funcionario_nome,
        }))
      );

      // Aplicar mesmos filtros adicionais (dataFiltro / tipo)
      if (dataFiltro && dataFiltro !== 'all') {
        const dataFiltroResult = await queryAsGestorEntidade(
          `SELECT cpf FROM funcionarios WHERE cpf = ANY($1::char(11)[]) AND criado_em > $2`,
          [funcionariosElegiveis.map((f: any) => f.funcionario_cpf), dataFiltro]
        );
        const cpfs = dataFiltroResult.rows.map((r: any) => r.cpf);
        funcionariosElegiveis = funcionariosElegiveis.filter((f: any) =>
          cpfs.includes(f.funcionario_cpf)
        );
      }

      if (tipo && tipo !== 'completo') {
        const nivelDesejado = tipo === 'operacional' ? 'operacional' : 'gestao';
        const nivelFiltroResult = await queryAsGestorEntidade(
          `SELECT cpf FROM funcionarios WHERE cpf = ANY($1::char(11)[]) AND nivel_cargo = $2`,
          [
            funcionariosElegiveis.map((f: any) => f.funcionario_cpf),
            nivelDesejado,
          ]
        );
        const cpfsComNivel = nivelFiltroResult.rows.map((r: any) => r.cpf);
        funcionariosElegiveis = funcionariosElegiveis.filter((f: any) =>
          cpfsComNivel.includes(f.funcionario_cpf)
        );
      }

      console.log(
        `[ENTIDADE-tomador] Após filtros: ${funcionariosElegiveis.length} funcionários`
      );
      console.log(`[DEBUG] DataFiltro: ${dataFiltro}, Tipo: ${tipo}`);

      if (funcionariosElegiveis.length > 0) {
        // ✅ CORREÇÃO: Lote de entidade usa entidade_id (não tomador_id)
        // Usa queryAsGestorEntidade() diretamente pois sessão já foi validada em requireEntity()
        const loteResult = await queryAsGestorEntidade(
          `INSERT INTO lotes_avaliacao (entidade_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, $3, 'ativo', $4, $5) RETURNING id, liberado_em, numero_ordem`,
          [
            entidadeId,
            descricao ||
              `Lote ${String(numeroOrdem)} liberado para ${String(entidadeNome)}. Inclui ${funcionariosElegiveis.length} funcionário(s) elegíveis vinculados diretamente à entidade.`,
            tipo || 'completo',
            session.cpf,
            numeroOrdem,
          ]
        );

        const lote = loteResult.rows[0];

        const agora = new Date().toISOString();
        let avaliacoesCriadas = 0;

        for (const func of funcionariosElegiveis) {
          try {
            await queryAsGestorEntidade(
              `INSERT INTO avaliacoes (funcionario_cpf, status, inicio, lote_id) VALUES ($1, 'iniciada', $2, $3)`,
              [func.funcionario_cpf, agora, lote.id]
            );
            avaliacoesCriadas++;
          } catch (error) {
            console.error(
              'Erro ao criar avaliação para',
              func.funcionario_cpf,
              error
            );
          }
        }

        // Registrar auditoria da liberação do lote (tomador)
        try {
          await queryAsGestorEntidade(
            `INSERT INTO audit_logs (user_cpf, action, resource, resource_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              session.cpf,
              'liberar_lote',
              'lotes_avaliacao',
              lote.id,
              JSON.stringify({
                entidade_id: entidadeId,
                entidade_nome: entidadeNome,
                tipo: tipo || 'completo',
                lote_id: lote.id,
                descricao: descricao || null,
                data_filtro: dataFiltro || null,
                numero_ordem: lote.numero_ordem,
                avaliacoes_criadas: avaliacoesCriadas,
                total_funcionarios: funcionariosElegiveis.length,
              }),
              req.headers.get('x-forwarded-for') ||
                req.headers.get('x-real-ip') ||
                'unknown',
            ]
          );
        } catch (auditError) {
          console.error(
            'Erro ao registrar auditoria (entidade tomador):',
            auditError
          );
        }

        resultados.push({
          empresaId: null,
          empresaNome: entidadeNome,
          created: true,
          loteId: lote.id,
          numero_ordem: lote.numero_ordem,
          avaliacoesCriadas,
          funcionariosConsiderados: funcionariosElegiveis.length,
        });
      } else {
        resultados.push({
          empresaId: null,
          empresaNome: entidadeNome,
          created: false,
          message: 'Nenhum funcionário elegível encontrado para a entidade',
        });
      }
    }

    if (resultados.length === 0) {
      return NextResponse.json(
        {
          error: 'Nenhum lote foi criado - não há funcionários elegíveis',
          success: false,
          detalhes:
            'Não foram encontrados funcionários elegíveis para avaliação vinculados diretamente a esta entidade. Verifique se há funcionários ativos cadastrados.',
        },
        { status: 400 }
      );
    }

    // Verificar se o lote falhou por falta de funcionários
    const todosNaoElegiveis = resultados.every((r) => !r.created);
    const mensagensErro = resultados
      .filter((r) => !r.created)
      .map((r) => `${r.empresaNome}: ${r.message}`);

    if (todosNaoElegiveis) {
      return NextResponse.json(
        {
          error: 'Nenhum funcionário elegível encontrado',
          success: false,
          detalhes: `Não foram encontrados funcionários elegíveis para avaliação na entidade:\n${mensagensErro.join('\n')}\n\nVerifique os critérios de elegibilidade ou cadastre novos funcionários.`,
          resultados,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitação de liberação processada para a entidade',
        resultados,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao Iniciar Ciclo por entidade:', error);
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
