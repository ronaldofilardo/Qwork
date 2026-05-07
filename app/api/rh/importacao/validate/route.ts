import { NextResponse } from 'next/server';
import { requireClinica } from '@/lib/session';
import {
  parseSpreadsheetAllRows,
  type ColumnMapping,
} from '@/lib/importacao/dynamic-parser';
import { validarDadosImportacao } from '@/lib/importacao/data-validator';
import { query } from '@/lib/db';
import { limparCPF } from '@/lib/cpf-utils';
import { normalizeCNPJ } from '@/lib/validators';
import { parseDateCell } from '@/lib/xlsxParser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rh/importacao/validate
 * Recebe arquivo + mapeamento confirmado, valida dados e consulta banco.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireClinica();
    const clinicaId = session.clinica_id;

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

    // Validação de formato
    const validacao = validarDadosImportacao(parsed.data);

    // Validação de self-assignment: responsável não pode se cadastrar como funcionário
    const responsavelCpfLimpo = limparCPF(session.cpf ?? '');
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const cpfLimpo = limparCPF(row.cpf ?? '');
      if (cpfLimpo === responsavelCpfLimpo && cpfLimpo.length === 11) {
        validacao.erros.push({
          linha: i + 2,
          campo: 'cpf',
          valor: row.cpf ?? '',
          mensagem:
            'Você não pode se cadastrar como funcionário da própria clínica',
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
    const existingNomeMap = new Map<string, string>();
    const existingDataNascMap = new Map<string, string | null>();
    // CPF → nome da empresa (vínculo ativo mais recente)
    const existingEmpresaMap = new Map<string, string>();
    // CPFs com vínculo nesta clínica (ativo ou inativo) — escopa detecção de mudanças de função/nível
    const cpfsVinculadosNaClinica = new Set<string>();
    const perCnpjNivelMap = new Map<string, string | null>();

    if (cpfsUnicos.length > 0) {
      // Buscar funcionários existentes (inclui funcao e nome para detectar mudanças e sugerir classificação)
      const existResult = await query(
        'SELECT id, cpf, nome, funcao, data_nascimento FROM funcionarios WHERE cpf = ANY($1)',
        [cpfsUnicos]
      );
      const existingCpfs = new Set<string>();
      for (const r of existResult.rows as {
        cpf: string;
        nome: string | null;
        funcao: string | null;
        data_nascimento: any;
      }[]) {
        existingCpfs.add(r.cpf.trim());
        existingFuncaoMap.set(r.cpf.trim(), r.funcao);
        if (r.nome) existingNomeMap.set(r.cpf.trim(), r.nome);
        // Converter data_nascimento para ISO string (pode vir como Date do driver PostgreSQL)
        let dataNascStr: string | null = null;
        if (r.data_nascimento) {
          if (typeof r.data_nascimento === 'string') {
            dataNascStr = r.data_nascimento;
          } else if (r.data_nascimento instanceof Date) {
            const y = r.data_nascimento.getUTCFullYear();
            const m = String(r.data_nascimento.getUTCMonth() + 1).padStart(
              2,
              '0'
            );
            const d = String(r.data_nascimento.getUTCDate()).padStart(2, '0');
            dataNascStr = `${y}-${m}-${d}`;
          }
        }
        existingDataNascMap.set(r.cpf.trim(), dataNascStr ?? null);
      }
      funcionariosExistentes = existingCpfs.size;

      // Buscar vínculos existentes na clínica (com nivel_cargo do vínculo para segregação por empresa)
      if (funcionariosExistentes > 0) {
        const cpfArray = [...existingCpfs];
        const vinculosResult = await query(
          `SELECT fc.funcionario_id, fc.empresa_id, fc.ativo, fc.data_desvinculo, fc.nivel_cargo,
                  f.cpf, ec.nome as empresa_nome, ec.cnpj as empresa_cnpj
           FROM funcionarios_clinicas fc
           JOIN funcionarios f ON f.id = fc.funcionario_id
           JOIN empresas_clientes ec ON ec.id = fc.empresa_id
           WHERE f.cpf = ANY($1) AND fc.clinica_id = $2`,
          [cpfArray, clinicaId]
        );

        // Preencher mapa por-CNPJ de nivel_cargo: chave="CPF|CNPJ_normalizado", valor=fc.nivel_cargo
        for (const v of vinculosResult.rows) {
          const cnpjNorm = normalizeCNPJ(v.empresa_cnpj as string);
          perCnpjNivelMap.set(
            `${(v.cpf as string).trim()}|${cnpjNorm}`,
            (v.nivel_cargo as string | null) || null
          );
        }

        for (const vinculo of vinculosResult.rows) {
          const cpfTrim = (vinculo.cpf as string).trim();
          cpfsVinculadosNaClinica.add(cpfTrim);
          // Mapear CPF → empresa para uso no modal de confirmação de nível
          if (!existingEmpresaMap.has(cpfTrim)) {
            existingEmpresaMap.set(
              cpfTrim,
              (vinculo.empresa_nome as string) || ''
            );
          }
          // Encontrar linhas no arquivo com este CPF
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
                    mensagem: `Funcionário será inativado na empresa "${vinculo.empresa_nome}"`,
                    severidade: 'aviso',
                  });
                }
              } else if (!vinculo.ativo) {
                // Verificar se é uma readmissão (nova data de admissão > data de desvinculo)
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
                    mensagem: `Funcionário será readmitido na empresa "${vinculo.empresa_nome}" (admissão mais recente que a saída)`,
                    severidade: 'aviso',
                  });
                } else {
                  funcionariosJaInativos++;
                  avisosDb.push({
                    linha: i + 2,
                    campo: 'cpf',
                    valor: cpfTrim,
                    mensagem: `Funcionário já está inativo na empresa "${vinculo.empresa_nome}" — não será reativado automaticamente`,
                    severidade: 'aviso',
                  });
                }
              }
            }
          }
        }
      }

      // Verificar divergência de data_nascimento para funcionários já existentes no banco
      for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i];
        const cpf = limparCPF(row.cpf ?? '');
        if (!existingDataNascMap.has(cpf)) continue;
        const dbDate = existingDataNascMap.get(cpf) ?? null;
        if (!dbDate) continue; // banco sem data_nascimento: não bloqueia
        const planilhaDateRaw =
          (row.data_nascimento as string | undefined) ?? '';
        if (!planilhaDateRaw) continue; // ausente → já capturado como erro pelo data-validator
        const planilhaDateIso = parseDateCell(planilhaDateRaw);
        if (!planilhaDateIso) continue; // inválida → já capturado pelo data-validator
        if (planilhaDateIso !== dbDate) {
          const fmt = (iso: string) => {
            const [y, m, d] = iso.split('-');
            return `${d}/${m}/${y}`;
          };
          validacao.erros.push({
            linha: i + 2,
            campo: 'data_nascimento',
            valor: planilhaDateRaw,
            mensagem: `Funcionário com CPF ${cpf} já cadastrado com data de nascimento diferente. Banco: ${fmt(dbDate)} | Planilha: ${fmt(planilhaDateIso)}. Corrija a planilha.`,
            severidade: 'erro',
          });
        }
      }
    }

    // Coletar funcoes únicas para o modal de nivel_cargo (somente linhas válidas)
    // Suprimir modal quando nivel_cargo está diretamente mapeado como coluna
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

    // Detectar funções novas oriundas de mudança de função de funcionários existentes
    // (sempre calculado, independente de mapeamento direto de nivel_cargo)
    // Também guarda detalhes por CPF para o modal de confirmação de nível
    type NivelCargoValue = 'gestao' | 'operacional' | null;
    type MudancaRoleDetalhe = {
      nome: string;
      funcaoAnterior: string;
      nivelAtual: NivelCargoValue;
      empresa: string;
    };
    const funcoesNovasPorMudancaRole = new Set<string>();
    // Mapa: funcaoNova -> lista de detalhes dos funcionários que mudaram
    const mudancaRoleDetalhesMap = new Map<string, MudancaRoleDetalhe[]>();
    // Rastreador de CPFs por funcao para deduplicação precisa (evita falsos positivos por colisão de iniciais)
    const mudancaRoleCpfsAdicionados = new Map<string, Set<string>>();

    for (const row of linhasValidasParaFuncoes) {
      const cpf = limparCPF(row.cpf ?? '');
      const novaFuncao = (row.funcao ?? '').trim();
      if (
        !novaFuncao ||
        novaFuncao === 'Não informado' ||
        !cpfsVinculadosNaClinica.has(cpf)
      )
        continue;
      const funcaoAtual = (existingFuncaoMap.get(cpf) ?? '').trim();
      if (funcaoAtual !== novaFuncao) {
        funcoesNovasPorMudancaRole.add(novaFuncao);
        // Nome: planilha sempre tem prioridade quando não vazia e não parece máscara de iniciais.
        // Detecta padrões de iniciais: "J. S.", "J.S.", "P. A. C.", etc.
        const nomePlanilha = (row.nome as string | undefined)?.trim() || '';
        const nomeDb = existingNomeMap.get(cpf) || '';
        const pareceIniciaisMudancaRole = /^([A-Za-zÀ-ÿ]\.\s*){2,}$/.test(
          nomePlanilha.trim()
        );
        const nomeCompleto = !nomePlanilha
          ? nomeDb
          : pareceIniciaisMudancaRole
            ? nomeDb || nomePlanilha
            : nomePlanilha;
        // Lookup por-CNPJ: se funcionário já tem vínculo nesta empresa, usa nivel_cargo do vínculo; senão null
        const cnpjRow = normalizeCNPJ(row.cnpj_empresa ?? '');
        const nivelRaw = perCnpjNivelMap.get(`${cpf}|${cnpjRow}`) ?? null;
        const nivelAtual: NivelCargoValue =
          nivelRaw === 'gestao' || nivelRaw === 'operacional' ? nivelRaw : null;
        // Chave composta funcao|cnpj para segregar por empresa
        const chaveRole = `${novaFuncao}|${cnpjRow}`;
        if (!mudancaRoleDetalhesMap.has(chaveRole)) {
          mudancaRoleDetalhesMap.set(chaveRole, []);
        }
        // Deduplicar por CPF (um funcionário pode aparecer em várias linhas da planilha)
        if (!mudancaRoleCpfsAdicionados.has(chaveRole)) {
          mudancaRoleCpfsAdicionados.set(chaveRole, new Set());
        }
        const cpfsRole = mudancaRoleCpfsAdicionados.get(chaveRole)!;
        if (!cpfsRole.has(cpf)) {
          cpfsRole.add(cpf);
          mudancaRoleDetalhesMap.get(chaveRole)!.push({
            nome: nomeCompleto,
            funcaoAnterior: funcaoAtual,
            nivelAtual,
            empresa:
              (existingEmpresaMap.get(cpf) ?? '') ||
              (() => {
                const n =
                  (row.nome_empresa as string | undefined)?.trim() || '';
                const c =
                  (row.cnpj_empresa as string | undefined)?.trim() || '';
                return n && c ? `${n} (${c})` : n || c || '';
              })(),
          });
        }
      }
    }
    const funcoesComMudancaRole = [...funcoesNovasPorMudancaRole].sort();

    // Detectar mudanças de nivel_cargo (planilha propõe nível diferente do banco)
    // Só relevante quando a planilha tem coluna nivel_cargo mapeada
    const funcoesComMudancaNivel = new Set<string>();
    type MudancaNivelDetalhe = {
      nome: string;
      nivelAtual: NivelCargoValue;
      nivelProposto: NivelCargoValue;
      empresa: string;
    };
    const mudancaNivelDetalhesMap = new Map<string, MudancaNivelDetalhe[]>();
    // Rastreador de CPFs por funcao para deduplicação precisa no bloco de nivel
    const mudancaNivelCpfsAdicionados = new Map<string, Set<string>>();

    if (temNivelCargoDirecto) {
      for (const row of linhasValidasParaFuncoes) {
        const cpf = limparCPF(row.cpf ?? '');
        const funcao = (row.funcao ?? '').trim();
        if (!funcao || !cpfsVinculadosNaClinica.has(cpf)) continue;
        // Apenas funcionários que NÃO mudaram de função (esses já são cobertos por isMudancaRole)
        const funcaoAtual = (existingFuncaoMap.get(cpf) ?? '').trim();
        if (funcaoAtual !== funcao) continue;

        // Lookup por-CNPJ para nivel_cargo do vínculo
        const cnpjRow = normalizeCNPJ(row.cnpj_empresa ?? '');
        const nivelBancoRaw = perCnpjNivelMap.get(`${cpf}|${cnpjRow}`) ?? null;
        const nivelBanco: NivelCargoValue =
          nivelBancoRaw === 'gestao' || nivelBancoRaw === 'operacional'
            ? nivelBancoRaw
            : null;
        const nivelPlanilhaRaw = ((row.nivel_cargo as string | undefined) ?? '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const nivelPlanilha: NivelCargoValue =
          nivelPlanilhaRaw === 'gestao' || nivelPlanilhaRaw === 'operacional'
            ? nivelPlanilhaRaw
            : null;

        if (nivelBanco !== nivelPlanilha) {
          // Chave composta funcao|cnpj para segregar mudanças de nível por empresa
          const chaveNivel = `${funcao}|${cnpjRow}`;
          funcoesComMudancaNivel.add(chaveNivel);
          // Nome: planilha sempre tem prioridade quando não vazia e não parece máscara de iniciais.
          // Detecta padrões de iniciais: "J. S.", "J.S.", "P. A. C.", etc.
          const nomePlanilha = (row.nome as string | undefined)?.trim() || '';
          const nomeDb = existingNomeMap.get(cpf) || '';
          const pareceIniciaisNivel = /^([A-Za-zÀ-ÿ]\.\s*){2,}$/.test(
            nomePlanilha.trim()
          );
          const nomeCompleto = !nomePlanilha
            ? nomeDb
            : pareceIniciaisNivel
              ? nomeDb || nomePlanilha
              : nomePlanilha;
          if (!mudancaNivelDetalhesMap.has(chaveNivel)) {
            mudancaNivelDetalhesMap.set(chaveNivel, []);
          }
          // Deduplicar por CPF
          if (!mudancaNivelCpfsAdicionados.has(chaveNivel)) {
            mudancaNivelCpfsAdicionados.set(chaveNivel, new Set());
          }
          const cpfsNivel = mudancaNivelCpfsAdicionados.get(chaveNivel)!;
          if (!cpfsNivel.has(cpf)) {
            cpfsNivel.add(cpf);
            mudancaNivelDetalhesMap.get(chaveNivel)!.push({
              nome: nomeCompleto,
              nivelAtual: nivelBanco,
              nivelProposto: nivelPlanilha,
              empresa:
                (existingEmpresaMap.get(cpf) ?? '') ||
                (() => {
                  const n =
                    (row.nome_empresa as string | undefined)?.trim() || '';
                  const c =
                    (row.cnpj_empresa as string | undefined)?.trim() || '';
                  return n && c ? `${n} (${c})` : n || c || '';
                })(),
            });
          }
        }
      }
    }

    // Construir funcoesNivelInfo: dados ricos por função para a etapa dedicada de classificação de nível
    interface FuncaoNivelInfoBuild {
      /** Nome de exibição da função */
      funcao: string;
      /** CNPJ normalizado da empresa (chave de segregação) */
      empresa_cnpj: string;
      /** Nome de exibição da empresa */
      empresa_nome: string;
      cpfs: Set<string>;
      novosCpfs: Set<string>;
      existentesCpfs: Set<string>;
      niveisSet: Set<NivelCargoValue>;
      /** CPFs cujo nivel_cargo está vazio/inválido na planilha (rastreado quando temNivelCargoDirecto=true) */
      semNivelNaPlanilha: Set<string>;
      /** Detalhes dos funcionários sem nível (para agrupamento visual por empresa no step 4) */
      semNivelNaPlanilhaDetalhes: Array<{
        nome: string;
        empresa: string;
        cpf: string;
      }>;
    }
    // Chave composta: "${funcao}|${cnpj}" — segrega nivel_cargo por empresa+função
    const funcaoInfoMap = new Map<string, FuncaoNivelInfoBuild>();

    for (const row of linhasValidasParaFuncoes) {
      const cpfRow = limparCPF(row.cpf ?? '');
      // Funcionários sem função são agrupados sob 'Não informado' (chave usada no execute route)
      const funcaoRow = (row.funcao ?? '').trim() || 'Não informado';
      const cnpjInfoRow = normalizeCNPJ(row.cnpj_empresa ?? '');
      const nomeEmpresaRow = (row.nome_empresa ?? '').trim();
      // Chave composta funcao|cnpj — mesmo nome de função em empresas distintas = entradas distintas
      const chaveRow = `${funcaoRow}|${cnpjInfoRow}`;

      if (!funcaoInfoMap.has(chaveRow)) {
        funcaoInfoMap.set(chaveRow, {
          funcao: funcaoRow,
          empresa_cnpj: cnpjInfoRow,
          empresa_nome: nomeEmpresaRow,
          cpfs: new Set(),
          novosCpfs: new Set(),
          existentesCpfs: new Set(),
          niveisSet: new Set(),
          semNivelNaPlanilha: new Set(),
          semNivelNaPlanilhaDetalhes: [],
        });
      }
      const info = funcaoInfoMap.get(chaveRow)!;
      // Atualizar nome da empresa se ainda não definido
      if (!info.empresa_nome && nomeEmpresaRow)
        info.empresa_nome = nomeEmpresaRow;
      info.cpfs.add(cpfRow);

      if (cpfsVinculadosNaClinica.has(cpfRow)) {
        info.existentesCpfs.add(cpfRow);
        // Lookup por-CNPJ para nivel_cargo do vínculo (cnpjInfoRow já definido acima)
        const nivelRaw =
          perCnpjNivelMap.get(`${cpfRow}|${cnpjInfoRow}`) ?? null;
        const nivelNorm: NivelCargoValue =
          nivelRaw === 'gestao' || nivelRaw === 'operacional' ? nivelRaw : null;
        info.niveisSet.add(nivelNorm);
      } else {
        info.novosCpfs.add(cpfRow);
      }

      // Rastreia funcionários (novos OU existentes) sem nivel_cargo válido na planilha.
      // Crítico quando temNivelCargoDirecto=true: novos com célula vazia não são detectados
      // pelo bloco funcoesComMudancaNivel (que só verifica existentes), resultando em
      // importação silenciosa com nivel_cargo=null.
      if (temNivelCargoDirecto) {
        const nivelNaPlanilha = ((row.nivel_cargo as string | undefined) ?? '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const nivelValido =
          nivelNaPlanilha === 'gestao' || nivelNaPlanilha === 'operacional';
        if (!nivelValido) {
          if (!info.semNivelNaPlanilha.has(cpfRow)) {
            const nomeRow = (row.nome as string | undefined)?.trim() || '';
            const nomeEmpresa =
              (row.nome_empresa as string | undefined)?.trim() || '';
            const cnpjEmpresa =
              (row.cnpj_empresa as string | undefined)?.trim() || '';
            const empresaRow =
              nomeEmpresa && cnpjEmpresa
                ? `${nomeEmpresa} (${cnpjEmpresa})`
                : nomeEmpresa || cnpjEmpresa || '';
            info.semNivelNaPlanilhaDetalhes.push({
              nome: nomeRow,
              empresa: empresaRow,
              cpf: cpfRow,
            });
          }
          info.semNivelNaPlanilha.add(cpfRow);
        }
      }
    }

    const funcoesNivelInfo = [...funcaoInfoMap.entries()]
      .map(([chave, info]) => ({
        // Chave composta "funcao|cnpj" — usada como key no nivelCargoMap do frontend
        chave,
        funcao: info.funcao,
        empresa_cnpj: info.empresa_cnpj,
        empresa_nome: info.empresa_nome,
        qtdFuncionarios: info.cpfs.size,
        qtdNovos: info.novosCpfs.size,
        qtdExistentes: info.existentesCpfs.size,
        niveisAtuais: [...info.niveisSet] as NivelCargoValue[],
        // isMudancaRole usa funcao (nome) pois funcoesNovasPorMudancaRole não é segregado por CNPJ
        isMudancaRole: funcoesNovasPorMudancaRole.has(info.funcao),
        // isMudancaNivel usa chave pois funcoesComMudancaNivel é segregado por CNPJ
        isMudancaNivel: funcoesComMudancaNivel.has(chave),
        temNivelNuloExistente:
          info.niveisSet.has(null) && info.existentesCpfs.size > 0,
        qtdSemNivelNaPlanilha: info.semNivelNaPlanilha.size,
        funcionariosSemNivel: info.semNivelNaPlanilhaDetalhes,
        funcionariosComMudanca: mudancaRoleDetalhesMap.get(chave) ?? [],
        funcionariosComMudancaNivel: mudancaNivelDetalhesMap.get(chave) ?? [],
      }))
      .sort((a, b) => {
        // Prioridade: mudanças de função > novos sem nível > demais
        if (a.isMudancaRole !== b.isMudancaRole)
          return a.isMudancaRole ? -1 : 1;
        const aRequerAtencao =
          a.qtdNovos > 0 ||
          a.temNivelNuloExistente ||
          a.qtdSemNivelNaPlanilha > 0;
        const bRequerAtencao =
          b.qtdNovos > 0 ||
          b.temNivelNuloExistente ||
          b.qtdSemNivelNaPlanilha > 0;
        if (aRequerAtencao !== bRequerAtencao) return aRequerAtencao ? -1 : 1;
        return a.funcao.localeCompare(b.funcao, 'pt-BR');
      });

    // Contar empresas novas vs existentes
    const nomeEmpresas = new Set<string>();
    const cnpjEmpresas = new Set<string>();
    for (const row of parsed.data) {
      if (row.nome_empresa)
        nomeEmpresas.add(row.nome_empresa.trim().toUpperCase());
      if (row.cnpj_empresa) cnpjEmpresas.add(normalizeCNPJ(row.cnpj_empresa));
    }

    let empresasNovas = nomeEmpresas.size;
    let empresasExistentes = 0;

    if (cnpjEmpresas.size > 0) {
      const cnpjArray = [...cnpjEmpresas].filter((c) => c.length > 0);
      if (cnpjArray.length > 0) {
        const existEmpResult = await query(
          'SELECT cnpj FROM empresas_clientes WHERE cnpj = ANY($1) AND clinica_id = $2',
          [cnpjArray, clinicaId]
        );
        empresasExistentes = existEmpResult.rows.length;
        empresasNovas = Math.max(0, nomeEmpresas.size - empresasExistentes);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        valido: validacao.valido,
        resumo: {
          ...validacao.resumo,
          empresasNovas,
          empresasExistentes,
          funcionariosExistentes,
          // Funcionários novos = pares (CPF, empresa) sem vínculo existente nesta clínica.
          // Um CPF já cadastrado em outro CNPJ ainda é considerado novo para a empresa importada.
          funcionariosNovos: (() => {
            const novasCombinacoes = new Set<string>();
            const linhasComErroSet = new Set(
              validacao.erros.map((e) => e.linha)
            );
            for (let i = 0; i < parsed.data.length; i++) {
              if (linhasComErroSet.has(i + 2)) continue;
              const row = parsed.data[i];
              const cpf = limparCPF(row.cpf ?? '');
              const cnpj = normalizeCNPJ(row.cnpj_empresa ?? '');
              if (!cpf) continue;
              const key = `${cpf}|${cnpj}`;
              if (!perCnpjNivelMap.has(key)) {
                novasCombinacoes.add(key);
              }
            }
            return novasCombinacoes.size;
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
        // Deduplicar: avisos do DB (com nome de empresa) sobrepõem avisos genéricos de data_demissao
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
    console.error('[importacao/validate] Erro:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Clínica não identificada') ||
        error.message.includes('Acesso restrito') ||
        error.message.includes('Clínica inativa')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('Não autenticado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
