import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
    const { titulo, descricao, dataFiltro, loteReferenciaId, tipo } =
      await req.json();

    const contratanteId = session.contratante_id as number;

    // ✅ PADRONIZAÇÃO: Gestor sempre registrado como liberado_por
    // O CPF do gestor autenticado é usado mesmo que não seja funcionário formal
    // Isso garante rastreabilidade e consistência com o fluxo RH

    // Buscar as empresas que têm funcionários vinculados a esta entidade
    const empresasRes = await queryAsGestorEntidade(
      `SELECT DISTINCT empresa_id FROM funcionarios WHERE contratante_id = $1 AND empresa_id IS NOT NULL AND ativo = true`,
      [contratanteId]
    );

    // Verificar se existem funcionários vinculados diretamente à entidade (empresa_id IS NULL)
    const hasEntidadeFuncsRes = await queryAsGestorEntidade(
      `SELECT 1 FROM funcionarios WHERE contratante_id = $1 AND empresa_id IS NULL AND ativo = true LIMIT 1`,
      [contratanteId]
    );

    const resultados: any[] = [];

    for (const row of empresasRes.rows) {
      const empresaId = row.empresa_id;

      // Validar lote de referência quando fornecido (deve pertencer à mesma empresa)
      if (loteReferenciaId) {
        const loteRefCheck = await queryAsGestorEntidade(
          `SELECT id, empresa_id FROM lotes_avaliacao WHERE id = $1 AND empresa_id = $2`,
          [loteReferenciaId, empresaId]
        );
        if (loteRefCheck.rowCount === 0) {
          // pular esta empresa
          continue;
        }
      }

      // Verificar empresa e obter clinica
      const empresaCheck = await queryAsGestorEntidade(
        `SELECT ec.id, ec.nome, ec.clinica_id FROM empresas_clientes ec WHERE ec.id = $1 AND ec.ativa = true`,
        [empresaId]
      );

      if (empresaCheck.rowCount === 0) {
        continue; // pular empresas inativas
      }

      // Próximo número de ordem por empresa
      const numeroOrdemResult = await queryAsGestorEntidade(
        `SELECT obter_proximo_numero_ordem($1) as numero_ordem`,
        [empresaId]
      );
      const numeroOrdem = numeroOrdemResult.rows[0].numero_ordem;

      // Calcular elegibilidade usando função existente por empresa
      const elegibilidadeResult = await queryAsGestorEntidade(
        `SELECT * FROM calcular_elegibilidade_lote($1, $2)`,
        [empresaId, numeroOrdem]
      );
      let funcionariosElegiveis = elegibilidadeResult.rows;

      console.log(
        `[ENTIDADE-EMPRESA] Empresa ${String(empresaId)}: ${funcionariosElegiveis.length} funcionários elegíveis`
      );
      console.log(
        `[DEBUG] Elegíveis:`,
        funcionariosElegiveis.map((f: any) => ({
          cpf: f.funcionario_cpf,
          nome: f.funcionario_nome,
        }))
      );

      // Aplicar filtros adicionais (dataFiltro / tipo)
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
        `[ENTIDADE-EMPRESA] Após filtros: ${funcionariosElegiveis.length} funcionários`
      );
      console.log(`[DEBUG] DataFiltro: ${dataFiltro}, Tipo: ${tipo}`);

      if (funcionariosElegiveis.length === 0) {
        resultados.push({
          empresaId,
          empresaNome: empresaCheck.rows[0].nome,
          created: false,
          message: 'Nenhum funcionário elegível encontrado',
        });
        continue;
      }

      // ✅ CORREÇÃO: Entity usa contratante_id (não clinica_id/empresa_id)
      // XOR constraint exige: contratante_id OU clinica_id (não ambos)
      // Usa queryAsGestorEntidade() diretamente pois sessão já foi validada em requireEntity()
      // Usa apenas ID (sem geração de codigo)
      const loteResult = await queryAsGestorEntidade(
        `INSERT INTO lotes_avaliacao (contratante_id, titulo, descricao, tipo, status, liberado_por, numero_ordem) VALUES ($1, $2, $3, $4, 'ativo', $5, $6) RETURNING id, liberado_em, numero_ordem`,
        [
          contratanteId,
          titulo || `Lote ${String(numeroOrdem)}`,
          descricao ||
            `Lote ${String(numeroOrdem)} liberado para entidade ${contratanteId}. Inclui ${funcionariosElegiveis.length} funcionário(s) elegíveis da empresa ${String(empresaCheck.rows[0].nome)}.`,
          tipo || 'completo',
          session.cpf,
          numeroOrdem,
        ]
      );

      const lote = loteResult.rows[0];

      // IMPORTANTE: Reservar ID do laudo igual ao ID do lote
      // Isso garante que laudo.id === lote.id sempre
      // O laudo será preenchido quando emissor clicar "Gerar Laudo"
      await queryAsGestorEntidade(
        `INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
         VALUES ($1, $1, 'rascunho', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [lote.id]
      );

      // Criar avaliações para cada funcionário
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

      // Registrar auditoria da liberação do lote para a empresa
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
              empresa_id: empresaId,
              empresa_nome: String(empresaCheck.rows[0].nome),
              tipo: tipo || 'completo',
              titulo:
                titulo ||
                `Lote ${String(lote.numero_ordem)} - ${String(codigo)}`,
              descricao: descricao || null,
              data_filtro: dataFiltro || null,
              lote_referencia_id: loteReferenciaId || null,
              id: lote.id,
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
          'Erro ao registrar auditoria (entidade empresa):',
          auditError
        );
      }

      resultados.push({
        empresaId,
        empresaNome: empresaCheck.rows[0].nome,
        created: true,
        loteId: lote.id,
        numero_ordem: lote.numero_ordem,
        avaliacoesCriadas,
        funcionariosConsiderados: funcionariosElegiveis.length,
      });
    }

    // Se houver funcionários vinculados diretamente à entidade, processar um lote "da entidade"
    if (hasEntidadeFuncsRes.rowCount > 0) {
      // Usar nome do contratante para exibir
      const contratanteRes = await queryAsGestorEntidade(
        `SELECT nome FROM contratantes WHERE id = $1`,
        [contratanteId]
      );
      const contratanteNome =
        contratanteRes.rowCount > 0 ? contratanteRes.rows[0].nome : 'Entidade';

      // Próximo numero de ordem para lotes sem empresa (usamos empresa_id IS NULL)
      const numeroOrdemResult = await queryAsGestorEntidade(
        `SELECT COALESCE(MAX(numero_ordem), 0) + 1 as numero_ordem FROM lotes_avaliacao WHERE empresa_id IS NULL`
      );
      const numeroOrdem = numeroOrdemResult.rows[0].numero_ordem;

      // Calcular elegibilidade para contratante usando função nova
      const elegibilidadeResult = await queryAsGestorEntidade(
        `SELECT * FROM calcular_elegibilidade_lote_contratante($1::integer, $2::integer)`,
        [contratanteId, numeroOrdem]
      );

      let funcionariosElegiveis = elegibilidadeResult.rows;

      console.log(
        `[ENTIDADE-CONTRATANTE] Contratante ${contratanteId}: ${funcionariosElegiveis.length} funcionários elegíveis`
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
        `[ENTIDADE-CONTRATANTE] Após filtros: ${funcionariosElegiveis.length} funcionários`
      );
      console.log(`[DEBUG] DataFiltro: ${dataFiltro}, Tipo: ${tipo}`);

      if (funcionariosElegiveis.length > 0) {
        const codigoResult = await queryAsGestorEntidade(
          `SELECT usar apenas ID do lote() as codigo`
        );
        const codigo = codigoResult.rows[0].codigo;

        // ✅ CORREÇÃO: Lote de entidade usa apenas contratante_id
        // XOR constraint: contratante_id (não clinica_id/empresa_id)
        // Usa queryAsGestorEntidade() diretamente pois sessão já foi validada em requireEntity()
        const loteResult = await queryAsGestorEntidade(
          `INSERT INTO lotes_avaliacao (codigo, contratante_id, titulo, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, $3, $4, $5, 'ativo', $6, $7) RETURNING id, codigo, liberado_em, numero_ordem`,
          [
            codigo,
            contratanteId,
            titulo || `Lote ${String(numeroOrdem)} - ${String(codigo)}`,
            descricao ||
              `Lote ${String(numeroOrdem)} liberado para ${String(contratanteNome)}. Inclui ${funcionariosElegiveis.length} funcionário(s) elegíveis vinculados diretamente à entidade.`,
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

        // Registrar auditoria da liberação do lote (contratante)
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
                contratante_id: contratanteId,
                contratante_nome: contratanteNome,
                tipo: tipo || 'completo',
                titulo:
                  titulo ||
                  `Lote ${String(lote.numero_ordem)} - ${String(codigo)}`,
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
            'Erro ao registrar auditoria (entidade contratante):',
            auditError
          );
        }

        resultados.push({
          empresaId: null,
          empresaNome: contratanteNome,
          created: true,
          loteId: lote.id,
          numero_ordem: lote.numero_ordem,
          avaliacoesCriadas,
          funcionariosConsiderados: funcionariosElegiveis.length,
        });
      } else {
        resultados.push({
          empresaId: null,
          empresaNome: contratanteNome,
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
            'Não foram encontrados funcionários elegíveis para avaliação nas empresas vinculadas a esta entidade. Verifique se há funcionários ativos cadastrados.',
        },
        { status: 400 }
      );
    }

    // Verificar se todos os lotes falharam por falta de funcionários
    const todosNaoElegiveis = resultados.every((r) => !r.created);
    const mensagensErro = resultados
      .filter((r) => !r.created)
      .map((r) => `${r.empresaNome}: ${r.message}`);

    if (todosNaoElegiveis) {
      return NextResponse.json(
        {
          error: 'Nenhum funcionário elegível encontrado',
          success: false,
          detalhes: `Não foram encontrados funcionários elegíveis para avaliação em nenhuma das empresas processadas:\n${mensagensErro.join('\n')}\n\nVerifique os critérios de elegibilidade ou cadastre novos funcionários.`,
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
