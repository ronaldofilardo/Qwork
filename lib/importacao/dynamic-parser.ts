/**
 * Parser dinâmico de planilhas — lê QUALQUER formato de Excel/CSV
 * e extrai cabeçalhos + dados com base em um mapeamento fornecido pelo usuário.
 */

import * as XLSX from 'xlsx';
import { parseDateCell } from '@/lib/xlsxParser';
import { limparCPF } from '@/lib/cpf-utils';
import { normalizeCNPJ } from '@/lib/validators';

/** Mapeamento de uma coluna da planilha para um campo do QWork */
export interface ColumnMapping {
  /** Índice da coluna na planilha (0-based) */
  indice: number;
  /** Nome original da coluna na planilha */
  nomeOriginal: string;
  /** Campo do QWork para o qual mapeia */
  campoQWork: string;
}

/** Coluna detectada na planilha com dados de preview */
export interface DetectedColumn {
  indice: number;
  nomeOriginal: string;
  exemploDados: string[];
}

/** Resultado da análise de cabeçalhos */
export interface HeaderAnalysis {
  success: boolean;
  colunas: DetectedColumn[];
  totalLinhas: number;
  error?: string;
}

/** Linha importada com campos mapeados */
export interface MappedRow {
  [campo: string]: string;
}

/** Resultado do parsing completo */
export interface FullParseResult {
  success: boolean;
  data?: MappedRow[];
  totalLinhas: number;
  error?: string;
}

/**
 * Normaliza nome de coluna: minúsculas, sem acentos, underscores.
 * Reexportado de lógica interna do xlsxParser.
 */
export function normalizarNomeColuna(nome: string): string {
  return nome
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Lê um buffer de planilha e retorna os cabeçalhos + primeiras N linhas como preview.
 */
export function parseSpreadsheetHeaders(
  buffer: Buffer,
  previewRows = 10
): HeaderAnalysis {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        colunas: [],
        totalLinhas: 0,
        error: 'Arquivo não contém nenhuma aba',
      };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawData.length < 1) {
      return {
        success: false,
        colunas: [],
        totalLinhas: 0,
        error: 'Arquivo vazio',
      };
    }

    const rawHeaders = rawData[0] as unknown[];
    const dataRows = rawData.slice(1);

    const colunas: DetectedColumn[] = rawHeaders.map((h, idx) => {
      const nome = String(h ?? '').trim();
      const exemplos: string[] = [];
      for (let r = 0; r < Math.min(previewRows, dataRows.length); r++) {
        const row = dataRows[r];
        if (
          row &&
          row[idx] !== undefined &&
          row[idx] !== null &&
          String(row[idx]).trim() !== ''
        ) {
          exemplos.push(String(row[idx]).trim().substring(0, 100));
        }
      }
      return { indice: idx, nomeOriginal: nome, exemploDados: exemplos };
    });

    // Filtrar colunas sem nome e sem dados
    const colunasValidas = colunas.filter(
      (c) => c.nomeOriginal !== '' || c.exemploDados.length > 0
    );

    return {
      success: true,
      colunas: colunasValidas,
      totalLinhas: dataRows.filter(
        (row) =>
          Array.isArray(row) &&
          row.some(
            (cell) =>
              cell !== undefined && cell !== null && String(cell).trim() !== ''
          )
      ).length,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      colunas: [],
      totalLinhas: 0,
      error: `Erro ao processar arquivo: ${msg}`,
    };
  }
}

/**
 * Lê todas as linhas da planilha aplicando o mapeamento fornecido pelo usuário.
 */
export function parseSpreadsheetAllRows(
  buffer: Buffer,
  mapeamento: ColumnMapping[]
): FullParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        totalLinhas: 0,
        error: 'Arquivo não contém nenhuma aba',
      };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawData.length < 2) {
      return {
        success: false,
        totalLinhas: 0,
        error: 'Arquivo vazio ou sem dados (apenas cabeçalho)',
      };
    }

    const dataRows = rawData.slice(1);
    const dados: MappedRow[] = [];

    for (const row of dataRows) {
      if (!Array.isArray(row)) continue;

      // Pular linhas completamente vazias
      const hasData = row.some(
        (cell) =>
          cell !== undefined && cell !== null && String(cell).trim() !== ''
      );
      if (!hasData) continue;

      const obj: MappedRow = {};

      for (const map of mapeamento) {
        const rawValue = row[map.indice];
        let value = rawValue !== undefined && rawValue !== null ? rawValue : '';

        // Normalizar valores conforme o tipo de campo
        const campo = map.campoQWork;

        if (campo === 'cpf') {
          const cpfLimpo = limparCPF(String(value));
          // CPF com 10 dígitos: inserir zero como primeiro dígito (correção automática)
          if (cpfLimpo.length === 10) {
            obj[campo] = '0' + cpfLimpo;
            obj['__cpf_corrigido'] = '1'; // sinaliza para o validador emitir aviso
          } else {
            obj[campo] = cpfLimpo;
          }
          continue; // já atribuímos em obj[campo] acima
        } else if (campo === 'cnpj_empresa') {
          value = normalizeCNPJ(String(value));
        } else if (
          campo === 'data_nascimento' ||
          campo === 'data_admissao' ||
          campo === 'data_demissao'
        ) {
          const parsed = parseDateCell(value);
          value = parsed ?? '';
        } else {
          value = String(value).trim();
        }

        obj[campo] = String(value);
      }

      dados.push(obj);
    }

    return {
      success: true,
      data: dados,
      totalLinhas: dados.length,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      totalLinhas: 0,
      error: `Erro ao processar arquivo: ${msg}`,
    };
  }
}
