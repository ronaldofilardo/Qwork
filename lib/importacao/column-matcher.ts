/**
 * Motor de sugestão de mapeamento — "liga os pontos" entre colunas
 * da planilha e campos do QWork usando heurísticas de nome e formato.
 */

import type { DetectedColumn } from './dynamic-parser';
import { normalizarNomeColuna } from './dynamic-parser';

/** Sugestão de mapeamento para uma coluna */
export interface ColumnSuggestion {
  indice: number;
  nomeOriginal: string;
  sugestaoQWork: string | null;
  confianca: number;
  exemploDados: string[];
}

/** Definição de um campo QWork com sinônimos */
interface CampoQWork {
  campo: string;
  label: string;
  obrigatorio: boolean;
  sinonimos: string[];
  formatoRegex?: RegExp;
}

/** Campos QWork disponíveis para mapeamento no MVP */
const CAMPOS_QWORK: CampoQWork[] = [
  {
    campo: 'nome_empresa',
    label: 'Nome da Empresa',
    obrigatorio: false,
    sinonimos: [
      'unidade',
      'razao_social',
      'razao social',
      'empresa',
      'tomador',
      'nome_unidade',
      'nome unidade',
      'empresa_nome',
      'nome_empresa',
      'razao',
      'companhia',
      'organizacao',
      'firma',
    ],
  },
  {
    campo: 'cnpj_empresa',
    label: 'CNPJ da Empresa',
    obrigatorio: true,
    sinonimos: [
      'cnpj',
      'cnpj_unidade',
      'cnpj unidade',
      'cnpj_empresa',
      'cnpj empresa',
      'documento_empresa',
      'documento empresa',
    ],
    formatoRegex: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,
  },
  {
    campo: 'cpf',
    label: 'CPF',
    obrigatorio: false,
    sinonimos: [
      'cpf',
      'cpf_funcionario',
      'cpf funcionario',
      'cpf_funcionário',
      'documento',
      'doc',
      'nr_cpf',
    ],
    formatoRegex: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  },
  {
    campo: 'nome',
    label: 'Nome do Funcionário',
    obrigatorio: true,
    sinonimos: [
      'nome',
      'funcionario',
      'funcionário',
      'nome_funcionario',
      'nome_funcionário',
      'nome_funcionario',
      'nome funcionario',
      'nome_completo',
      'nome completo',
      'colaborador',
    ],
  },
  {
    campo: 'data_nascimento',
    label: 'Data de Nascimento',
    obrigatorio: true,
    sinonimos: [
      'nascimento',
      'dt_nascimento',
      'data_nascimento',
      'data nascimento',
      'dt_nasc',
      'data_nasc',
      'data nasc',
      'dt nasc',
      'data_de_nascimento',
      'data de nascimento',
    ],
    formatoRegex: /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/,
  },
  {
    campo: 'data_admissao',
    label: 'Data de Admissão',
    obrigatorio: false,
    sinonimos: [
      'admissao',
      'admissão',
      'dt_admissao',
      'dt_admissão',
      'data_admissao',
      'data_admissão',
      'data admissao',
      'data admissão',
      'dt admissao',
      'dt admissão',
      'data_de_admissao',
      'contratacao',
      'contratação',
    ],
    formatoRegex: /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/,
  },
  {
    campo: 'data_demissao',
    label: 'Data de Demissão',
    obrigatorio: false,
    sinonimos: [
      'demissao',
      'demissão',
      'dt_demissao',
      'dt_demissão',
      'data_demissao',
      'data_demissão',
      'data demissao',
      'data demissão',
      'dt demissao',
      'dt demissão',
      'data_de_demissao',
      'desligamento',
      'rescisao',
      'rescisão',
    ],
    formatoRegex: /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/,
  },
  {
    campo: 'funcao',
    label: 'Cargo / Função',
    obrigatorio: true,
    sinonimos: [
      'cargo',
      'funcao',
      'função',
      'nome_cargo',
      'nome cargo',
      'cargo_funcao',
      'atividade',
      'ocupacao',
      'ocupação',
      'profissao',
    ],
  },
  {
    campo: 'nivel_cargo',
    label: 'Nível de Cargo',
    obrigatorio: false,
    sinonimos: [
      'nivel_cargo',
      'nivel cargo',
      'nível cargo',
      'nivel_de_cargo',
      'nivel de cargo',
      'nível de cargo',
      'classificacao_cargo',
      'classificacao cargo',
      'nivel_hierarquico',
      'nivel hierarquico',
      'nível hierárquico',
    ],
  },
  {
    campo: 'setor',
    label: 'Setor / Departamento',
    obrigatorio: false,
    sinonimos: [
      'setor',
      'departamento',
      'area',
      'área',
      'lotacao',
      'lotação',
      'divisao',
      'divisão',
      'secao',
      'seção',
    ],
  },
  {
    campo: 'matricula',
    label: 'Matrícula',
    obrigatorio: false,
    sinonimos: [
      'matricula',
      'matrícula',
      'registro',
      'mat',
      'nr_matricula',
      'codigo_funcionario',
      'cod_funcionario',
    ],
  },
  {
    campo: 'email',
    label: 'E-mail',
    obrigatorio: false,
    sinonimos: [
      'email',
      'e_mail',
      'correio',
      'endereco_email',
      'endereco email',
    ],
    formatoRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
];

/** Retorna a lista de campos QWork disponíveis para mapeamento */
export function getCamposQWork(): Array<{
  campo: string;
  label: string;
  obrigatorio: boolean;
}> {
  return CAMPOS_QWORK.map((c) => ({
    campo: c.campo,
    label: c.label,
    obrigatorio: c.obrigatorio,
  }));
}

/** Retorna os campos obrigatórios */
export function getCamposObrigatorios(): string[] {
  return CAMPOS_QWORK.filter((c) => c.obrigatorio).map((c) => c.campo);
}

/**
 * Retorna a lista de campos QWork para o fluxo de importação de Entidade.
 * Remove cnpj_empresa e nome_empresa — entidades não possuem o conceito de empresa-cliente.
 */
export function getCamposQWorkEntidade(): Array<{
  campo: string;
  label: string;
  obrigatorio: boolean;
}> {
  const CAMPOS_EXCLUIDOS = new Set(['cnpj_empresa', 'nome_empresa']);
  return CAMPOS_QWORK.filter((c) => !CAMPOS_EXCLUIDOS.has(c.campo)).map((c) => ({
    campo: c.campo,
    label: c.label,
    obrigatorio: c.obrigatorio,
  }));
}

/**
 * Retorna os campos obrigatórios para o fluxo de importação de Entidade.
 * Não inclui cnpj_empresa.
 */
export function getCamposObrigatoriosEntidade(): string[] {
  const CAMPOS_EXCLUIDOS = new Set(['cnpj_empresa', 'nome_empresa']);
  return CAMPOS_QWORK.filter(
    (c) => c.obrigatorio && !CAMPOS_EXCLUIDOS.has(c.campo)
  ).map((c) => c.campo);
}

/**
 * Gera sugestões de mapeamento para as colunas detectadas numa planilha.
 */
export function sugerirMapeamento(
  colunas: DetectedColumn[]
): ColumnSuggestion[] {
  const usados = new Set<string>();
  const sugestoes: ColumnSuggestion[] = [];

  // Calcular scores para todas as combinações
  const scores: Array<{
    colIdx: number;
    campo: string;
    score: number;
  }> = [];

  for (const col of colunas) {
    const nomeNorm = normalizarNomeColuna(col.nomeOriginal);

    for (const def of CAMPOS_QWORK) {
      let score = 0;

      // 1. Match exato de sinônimos normalizados
      const matchExato = def.sinonimos.some(
        (s) => normalizarNomeColuna(s) === nomeNorm
      );
      if (matchExato) {
        score = 1.0;
      } else {
        // 2. Match parcial: sinônimo contido no nome ou vice-versa
        const matchParcial = def.sinonimos.some((s) => {
          const sNorm = normalizarNomeColuna(s);
          return nomeNorm.includes(sNorm) || sNorm.includes(nomeNorm);
        });
        if (matchParcial) {
          score = 0.7;
        }
      }

      // 3. Boost de formato dos dados
      if (score > 0 && def.formatoRegex && col.exemploDados.length > 0) {
        const matchCount = col.exemploDados.filter((d) =>
          def.formatoRegex!.test(d)
        ).length;
        const ratio = matchCount / col.exemploDados.length;
        if (ratio > 0.5) {
          score = Math.min(score + 0.1, 1.0);
        }
      }

      // 4. Se score zero mas formato bate bem (detecção por dados)
      if (score === 0 && def.formatoRegex && col.exemploDados.length > 0) {
        const matchCount = col.exemploDados.filter((d) =>
          def.formatoRegex!.test(d)
        ).length;
        const ratio = matchCount / col.exemploDados.length;
        if (ratio >= 0.8) {
          score = 0.5;
        }
      }

      if (score > 0) {
        scores.push({ colIdx: col.indice, campo: def.campo, score });
      }
    }
  }

  // Ordenar por score decrescente e resolver conflitos greedily
  scores.sort((a, b) => b.score - a.score);

  const colunaMapeada = new Set<number>();

  for (const s of scores) {
    if (usados.has(s.campo) || colunaMapeada.has(s.colIdx)) continue;
    usados.add(s.campo);
    colunaMapeada.add(s.colIdx);

    const col = colunas.find((c) => c.indice === s.colIdx)!;
    sugestoes.push({
      indice: col.indice,
      nomeOriginal: col.nomeOriginal,
      sugestaoQWork: s.campo,
      confianca: s.score,
      exemploDados: col.exemploDados,
    });
  }

  // Adicionar colunas sem match
  for (const col of colunas) {
    if (!colunaMapeada.has(col.indice)) {
      sugestoes.push({
        indice: col.indice,
        nomeOriginal: col.nomeOriginal,
        sugestaoQWork: null,
        confianca: 0,
        exemploDados: col.exemploDados,
      });
    }
  }

  // Ordenar pelo índice original da coluna
  sugestoes.sort((a, b) => a.indice - b.indice);

  return sugestoes;
}

/**
 * Verifica quais campos obrigatórios não foram mapeados.
 */
export function verificarCamposObrigatorios(
  mapeamento: Array<{ campoQWork: string }>
): string[] {
  const mapeados = new Set(mapeamento.map((m) => m.campoQWork));
  return getCamposObrigatorios().filter((campo) => !mapeados.has(campo));
}
