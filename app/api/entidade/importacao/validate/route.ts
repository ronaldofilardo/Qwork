import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import {
  parseSpreadsheetAllRows,
  type ColumnMapping,
} from '@/lib/importacao/dynamic-parser';
import { validarDadosImportacao } from '@/lib/importacao/data-validator';
import { query } from '@/lib/db';
import { limparCPF } from '@/lib/cpf-utils';
import { parseDateCell } from '@/lib/xlsxParser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/entidade/importacao/validate
 * Recebe arquivo + mapeamento confirmado, valida dados e consulta banco.
 * Versão para Entidade — sem lógica de empresa/CNPJ, vínculos em funcionarios_entidades.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const mapeamentoRaw = formData.get('mapeamento');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    if (!mapeamentoRaw || typeof mapeamentoRaw !== 'string') {
      return NextResponse.json(
        { error: 'Mapeamento de colunas não enviado' },
        { status: 400 }
      );
    }

    let mapeamento: ColumnMapping[];
    try {
      mapeamento = JSON.parse(mapeamentoRaw);
      if (!Array.isArray(mapeamento) || mapeamento.length === 0) {
        throw new Error('Mapeamento vazio');
      }
    } catch {
      return NextResponse.json(
        { error: 'Mapeamento de colunas inválido' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse com mapeamento
    const parsed = parseSpreadsheetAllRows(buffer, mapeamento);
    if (!parsed.success || !parsed.data) {
      return NextResponse.json(
        { error: parsed.error ?? 'Erro ao processar arquivo' },
        { status: 400 }
      );
    }

    // Validação de formato — CNPJ ignorado para fluxo de Entidade
    const validacao = validarDadosImportacao(parsed.data, {
      ignorarCnpj: true,
    });

    // Validação de self-assignment: gestor não pode se cadastrar como funcionário
    const gestorCpfLimpo = limparCPF(session.cpf ?? '');
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const cpfLimpo = limparCPF(row.cpf ?? '');
      if (cpfLimpo === gestorCpfLimpo && cpfLimpo.length === 11) {
        validacao.erros.push({
          linha: i + 2,
          campo: 'cpf',
          valor: row.cpf ?? '',
          mensagem:
            'Você não pode se cadastrar como funcionário da própria entidade',
          severidade: 'erro',
        });
      }
    }

    // Consultar banco para duplicidades
    const cpfs = parsed.data
      .map((r) => limparCPF(r.cpf ?? ''))
      .filter((c) => c.length === 11);
    const cpfsUnicos = [...new Set(cpfs)];

    let funcionariosExistentes = 0;
    let funcionariosParaInativar = 0;
    let funcionariosJaInativos = 0;
    let funcionariosAReadmitir = 0;
    const avisosDb: typeof validacao.avisos = [];
    const existingFuncaoMap = new Map<string, string | null>();
    // nivel_cargo é lido de funcionarios_entidades (per-entidade), não da tabela global funcionarios.
    // Isso evita bleeding de nivel_cargo entre entidades diferentes para o mesmo CPF.
    const perEntidadeNivelMap = new Map<string, string | null>();
    const existingNomeMap = new Map<string, string>();
    const cpfsVinculadosNaEntidade = new Set<string>();

    if (cpfsUnicos.length > 0) {
      // Buscar funcionários existentes (inclui funcao, nivel_cargo e nome para detectar mudanças)
      const existResult = await query(
        'SELECT id, cpf, nome, funcao FROM funcionarios WHERE cpf = ANY($1)',
        [cpfsUnicos]
      );
      const existingCpfs = new Set<string>();
      for (const r of existResult.rows as {
        cpf: string;
        nome: string | null;
        funcao: string | null;
      }[]) {
        existingCpfs.add(r.cpf.trim());
        existingFuncaoMap.set(r.cpf.trim(), r.funcao);
        if (r.nome) existingNomeMap.set(r.cpf.trim(), r.nome);
      }
      funcionariosExistentes = existingCpfs.size;

      // Buscar vínculos existentes na entidade (tabela funcionarios_entidades)
      if (funcionariosExistentes > 0) {
        const cpfArray = [...existingCpfs];
        const vinculosResult = await query(
          `SELECT fe.funcionario_id, fe.ativo, fe.data_desvinculo, fe.nivel_cargo, f.cpf
           FROM funcionarios_entidades fe
           JOIN funcionarios f ON f.id = fe.funcionario_id
           WHERE f.cpf = ANY($1) AND fe.entidade_id = $2`,
          [cpfArray, entidadeId]
        );

        for (const vinculo of vinculosResult.rows) {
          const cpfTrim = (vinculo.cpf as string).trim();
          cpfsVinculadosNaEntidade.add(cpfTrim);
          // Registrar nivel_cargo per-entidade (não global)
          perEntidadeNivelMap.set(cpfTrim, (vinculo.nivel_cargo as string | null) || null);
          for (let i = 0; i < parsed.data.length; i++) {
            const row = parsed.data[i];
            if (limparCPF(row.cpf ?? '') === cpfTrim) {
              const dataDem = row.data_demissao ?? '';
              const dataAdmRaw = row.data_admissao ?? '';

              if (dataDem && dataDem.trim() !== '') {
                if (vinculo.ativo) {
                  funcionariosParaInativar++;
                  avisosDb.push({
                    linha: i + 2,
                    campo: 'cpf',
                    valor: cpfTrim,
                    mensagem: 'Funcionário será inativado',
                    severidade: 'aviso',
                  });
                }
              } else if (!vinculo.ativo) {
                const dataAdmParsed = dataAdmRaw
                  ? parseDateCell(dataAdmRaw)
                  : null;
                const dataDesvinculo = vinculo.data_desvinculo
                  ? new Date(vinculo.data_desvinculo as string)
                  : null;

                const isReadmissao =
                  dataAdmParsed &&
                  (!dataDesvinculo || new Date(dataAdmParsed) > dataDesvinculo);

                if (isReadmissao) {
                  funcionariosAReadmitir++;
                  avisosDb.push({
                    linha: i + 2,
                    campo: 'data_admissao',
                    valor: cpfTrim,
                    mensagem:
                      'Funcionário será readmitido (admissão mais recente que a saída)',
                    severidade: 'aviso',
                  });
                } else {
                  funcionariosJaInativos++;
                  avisosDb.push({
                    linha: i + 2,
                    campo: 'cpf',
                    valor: cpfTrim,
                    mensagem:
                      'Funcionário já está inativo — não será reativado automaticamente',
                    severidade: 'aviso',
                  });
                }
              }
            }
          }
        }
      }
    }

    // Coletar funções únicas para o modal de nivel_cargo (somente linhas válidas)
    const temNivelCargoDirecto = mapeamento.some(
      (m) => m.campoQWork === 'nivel_cargo'
    );
    const linhasComErroSetValidate = new Set(
      validacao.erros.map((e) => e.linha)
    );
    const linhasValidasParaFuncoes = parsed.data.filter(
      (_, i) => !linhasComErroSetValidate.has(i + 2)
    );
    const funcoesUnicas = temNivelCargoDirecto
      ? []
      : [
          ...new Set(
            linhasValidasParaFuncoes
              .map((r) => (r.funcao ?? '').trim())
              .filter(Boolean)
          ),
        ].sort();

    // Detectar mudanças de função
    type NivelCargoValue = 'gestao' | 'operacional' | null;
    type MudancaRoleDetalhe = {
      nome: string;
      funcaoAnterior: string;
      nivelAtual: NivelCargoValue;
      empresa: string;
    };
    const funcoesNovasPorMudancaRole = new Set<string>();
    const mudancaRoleDetalhesMap = new Map<string, MudancaRoleDetalhe[]>();
    const mudancaRoleCpfsAdicionados = new Map<string, Set<string>>();

    for (const row of linhasValidasParaFuncoes) {
      const cpf = limparCPF(row.cpf ?? '');
      const novaFuncao = (row.funcao ?? '').trim();
      if (
        !novaFuncao ||
        novaFuncao === 'Não informado' ||
        !cpfsVinculadosNaEntidade.has(cpf)
      )
        continue;
      const funcaoAtual = (existingFuncaoMap.get(cpf) ?? '').trim();
      if (funcaoAtual !== novaFuncao) {
        funcoesNovasPorMudancaRole.add(novaFuncao);
        const nomePlanilha = (row.nome as string | undefined)?.trim() || '';
        const nomeDb = existingNomeMap.get(cpf) || '';
        const pareceIniciais = /^([A-Za-zÀ-ÿ]\.\s*){2,}$/.test(
          nomePlanilha.trim()
        );
        const nomeCompleto = !nomePlanilha
          ? nomeDb
          : pareceIniciais
            ? nomeDb || nomePlanilha
            : nomePlanilha;
        const nivelRaw = perEntidadeNivelMap.get(cpf) ?? null;
        const nivelAtual: NivelCargoValue =
          nivelRaw === 'gestao' || nivelRaw === 'operacional' ? nivelRaw : null;
        if (!mudancaRoleDetalhesMap.has(novaFuncao)) {
          mudancaRoleDetalhesMap.set(novaFuncao, []);
        }
        if (!mudancaRoleCpfsAdicionados.has(novaFuncao)) {
          mudancaRoleCpfsAdicionados.set(novaFuncao, new Set());
        }
        const cpfsRole = mudancaRoleCpfsAdicionados.get(novaFuncao)!;
        if (!cpfsRole.has(cpf)) {
          cpfsRole.add(cpf);
          mudancaRoleDetalhesMap.get(novaFuncao)!.push({
            nome: nomeCompleto,
            funcaoAnterior: funcaoAtual,
            nivelAtual,
            empresa: '', // Entidade não tem empresa — campo ficará vazio
          });
        }
      }
    }
    const funcoesComMudancaRole = [...funcoesNovasPorMudancaRole].sort();

    // Detectar mudanças de nivel_cargo quando mapeado diretamente
    const funcoesComMudancaNivel = new Set<string>();
    type MudancaNivelDetalhe = {
      nome: string;
      nivelAtual: NivelCargoValue;
      nivelProposto: NivelCargoValue;
      empresa: string;
    };
    const mudancaNivelDetalhesMap = new Map<string, MudancaNivelDetalhe[]>();
    const mudancaNivelCpfsAdicionados = new Map<string, Set<string>>();

    if (temNivelCargoDirecto) {
      for (const row of linhasValidasParaFuncoes) {
        const cpf = limparCPF(row.cpf ?? '');
        const funcao = (row.funcao ?? '').trim();
        if (!funcao || !cpfsVinculadosNaEntidade.has(cpf)) continue;
        const funcaoAtual = (existingFuncaoMap.get(cpf) ?? '').trim();
        if (funcaoAtual !== funcao) continue;

        const nivelBancoRaw = perEntidadeNivelMap.get(cpf) ?? null;
        const nivelBanco: NivelCargoValue =
          nivelBancoRaw === 'gestao' || nivelBancoRaw === 'operacional'
            ? nivelBancoRaw
            : null;
        const nivelPlanilhaRaw = ((row.nivel_cargo as string | undefined) ?? '')
          .trim()
          .toLowerCase();
        const nivelPlanilha: NivelCargoValue =
          nivelPlanilhaRaw === 'gestao' || nivelPlanilhaRaw === 'operacional'
            ? nivelPlanilhaRaw
            : null;

        if (nivelBanco !== nivelPlanilha) {
          funcoesComMudancaNivel.add(funcao);
          const nomePlanilha = (row.nome as string | undefined)?.trim() || '';
          const nomeDb = existingNomeMap.get(cpf) || '';
          const pareceIniciais = /^([A-Za-zÀ-ÿ]\.\s*){2,}$/.test(
            nomePlanilha.trim()
          );
          const nomeCompleto = !nomePlanilha
            ? nomeDb
            : pareceIniciais
              ? nomeDb || nomePlanilha
              : nomePlanilha;
          if (!mudancaNivelDetalhesMap.has(funcao)) {
            mudancaNivelDetalhesMap.set(funcao, []);
          }
          if (!mudancaNivelCpfsAdicionados.has(funcao)) {
            mudancaNivelCpfsAdicionados.set(funcao, new Set());
          }
          const cpfsNivel = mudancaNivelCpfsAdicionados.get(funcao)!;
          if (!cpfsNivel.has(cpf)) {
            cpfsNivel.add(cpf);
            mudancaNivelDetalhesMap.get(funcao)!.push({
              nome: nomeCompleto,
              nivelAtual: nivelBanco,
              nivelProposto: nivelPlanilha,
              empresa: '',
            });
          }
        }
      }
    }

    // Construir funcoesNivelInfo
    interface FuncaoNivelInfoBuild {
      cpfs: Set<string>;
      novosCpfs: Set<string>;
      existentesCpfs: Set<string>;
      niveisSet: Set<NivelCargoValue>;
      semNivelNaPlanilha: Set<string>;
      semNivelNaPlanilhaDetalhes: Array<{ nome: string; empresa: string; cpf: string }>;
    }
    const funcaoInfoMap = new Map<string, FuncaoNivelInfoBuild>();

    for (const row of linhasValidasParaFuncoes) {
      const cpfRow = limparCPF(row.cpf ?? '');
      const funcaoRow = (row.funcao ?? '').trim() || 'Não informado';

      if (!funcaoInfoMap.has(funcaoRow)) {
        funcaoInfoMap.set(funcaoRow, {
          cpfs: new Set(),
          novosCpfs: new Set(),
          existentesCpfs: new Set(),
          niveisSet: new Set(),
          semNivelNaPlanilha: new Set(),
          semNivelNaPlanilhaDetalhes: [],
        });
      }
      const info = funcaoInfoMap.get(funcaoRow)!;
      info.cpfs.add(cpfRow);

      if (temNivelCargoDirecto) {
        const nivelPlanilhaRaw = ((row.nivel_cargo as string | undefined) ?? '')
          .trim()
          .toLowerCase();
        if (
          nivelPlanilhaRaw !== 'gestao' &&
          nivelPlanilhaRaw !== 'operacional'
        ) {
          if (!info.semNivelNaPlanilha.has(cpfRow)) {
            const nomeFunc = (row.nome as string | undefined)?.trim() || '';
            info.semNivelNaPlanilhaDetalhes.push({
              nome: nomeFunc,
              empresa: '',
              cpf: cpfRow,
            });
          }
          info.semNivelNaPlanilha.add(cpfRow);
        }
      }

      if (cpfsVinculadosNaEntidade.has(cpfRow)) {
        info.existentesCpfs.add(cpfRow);
        const nivelRaw = perEntidadeNivelMap.get(cpfRow) ?? null;
        const nivelNorm: NivelCargoValue =
          nivelRaw === 'gestao' || nivelRaw === 'operacional' ? nivelRaw : null;
        info.niveisSet.add(nivelNorm);
      } else {
        info.novosCpfs.add(cpfRow);
      }
    }

    const funcoesNivelInfo = [...funcaoInfoMap.entries()]
      .map(([funcao, info]) => ({
        funcao,
        qtdFuncionarios: info.cpfs.size,
        qtdNovos: info.novosCpfs.size,
        qtdExistentes: info.existentesCpfs.size,
        niveisAtuais: [...info.niveisSet] as NivelCargoValue[],
        isMudancaRole: funcoesNovasPorMudancaRole.has(funcao),
        isMudancaNivel: funcoesComMudancaNivel.has(funcao),
        temNivelNuloExistente:
          info.niveisSet.has(null) && info.existentesCpfs.size > 0,
        qtdSemNivelNaPlanilha: info.semNivelNaPlanilha.size,
        funcionariosSemNivel: info.semNivelNaPlanilhaDetalhes,
        funcionariosComMudanca: mudancaRoleDetalhesMap.get(funcao) ?? [],
        funcionariosComMudancaNivel: mudancaNivelDetalhesMap.get(funcao) ?? [],
      }))
      .sort((a, b) => {
        if (a.isMudancaRole !== b.isMudancaRole)
          return a.isMudancaRole ? -1 : 1;
        if (a.qtdSemNivelNaPlanilha > 0 !== b.qtdSemNivelNaPlanilha > 0)
          return a.qtdSemNivelNaPlanilha > 0 ? -1 : 1;
        const aRequerAtencao = a.qtdNovos > 0 || a.temNivelNuloExistente;
        const bRequerAtencao = b.qtdNovos > 0 || b.temNivelNuloExistente;
        if (aRequerAtencao !== bRequerAtencao) return aRequerAtencao ? -1 : 1;
        return a.funcao.localeCompare(b.funcao, 'pt-BR');
      });

    return NextResponse.json({
      success: true,
      data: {
        valido: validacao.valido,
        resumo: {
          ...validacao.resumo,
          funcionariosExistentes,
          // Funcionários novos = CPFs sem vínculo com esta entidade. Um CPF em outra entidade ainda é novo aqui.
          funcionariosNovos: (() => {
            const novosCpfs = new Set<string>();
            const linhasComErroSet = new Set(validacao.erros.map((e) => e.linha));
            for (let i = 0; i < parsed.data.length; i++) {
              if (linhasComErroSet.has(i + 2)) continue;
              const cpf = limparCPF(parsed.data[i].cpf ?? '');
              if (!cpf) continue;
              if (!cpfsVinculadosNaEntidade.has(cpf)) novosCpfs.add(cpf);
            }
            return novosCpfs.size;
          })(),
          funcionariosParaInativar,
          funcionariosJaInativos,
          funcionariosAReadmitir,
        },
        funcoesUnicas,
        funcoesComMudancaRole,
        funcoesNivelInfo,
        temNivelCargoDirecto,
        erros: validacao.erros,
        avisos: (() => {
          const linhasComAvisoDb = new Set(avisosDb.map((a) => a.linha));
          const avisosBase = validacao.avisos.filter(
            (a) =>
              !(a.campo === 'data_demissao' && linhasComAvisoDb.has(a.linha))
          );
          return [...avisosBase, ...avisosDb];
        })(),
      },
    });
  } catch (error: unknown) {
    console.error('[entidade/importacao/validate] Erro:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Entidade não encontrada') ||
        error.message.includes('Acesso restrito') ||
        error.message.includes('Entidade inativa')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (
        error.message.includes('Não autenticado') ||
        error.message.includes('não é gestor')
      ) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
