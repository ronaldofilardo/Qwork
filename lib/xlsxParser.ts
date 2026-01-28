/**
 * Utilitário para parsing de arquivos XLSX
 * Converte buffer de arquivo Excel em array de objetos validados
 */

import * as XLSX from 'xlsx';
import { validarCPF, limparCPF } from './cpf-utils';

export interface FuncionarioImportRow {
  cpf: string;
  nome: string;
  data_nascimento: string; // ISO YYYY-MM-DD
  setor: string;
  funcao: string;
  email: string;
  senha?: string;
  matricula?: string;
  nivel_cargo?: string;
  turno?: string;
  escala?: string;
}

export interface ParseResult {
  success: boolean;
  data?: FuncionarioImportRow[];
  error?: string;
}

/**
 * Normaliza nome de coluna para formato padrão
 * Remove acentos, converte para minúsculas, remove espaços extras
 */
function normalizarNomeColuna(nome: string): string {
  // Lowercase, remove accents, convert non-alphanum to underscore, collapse underscores
  return nome
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Collapse repeated underscores
    .replace(/^_|_$/g, ''); // Trim leading/trailing underscore
}

/**
 * Tenta converter valores de célula para formato ISO (YYYY-MM-DD)
 */
export function parseDateCell(value: any): string | null {
  if (!value && value !== 0) return null;

  // Se for objeto Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  // Se for número (serial do Excel)
  if (typeof value === 'number') {
    // XLSX.SSF pode ajudar, mas aqui convertemos aproximando a partir da data base 1899-12-31
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Se for string, aceitar dd/mm/yyyy ou yyyy-mm-dd
  let str = String(value).trim();
  // Remover prefixos de timezone malformados (ex: "+0200 ") que podem ser colocados por alguns geradores
  str = str.replace(/^[+\-]\d{2}(:?\d{2})?\s*/, '');
  // Não aceitar datas que não sigam explicitamente dd/mm/yyyy ou yyyy-mm-dd para evitar interpretações ambíguas

  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/;

  if (ddmmyyyy.test(str)) {
    const m = str.replace(ddmmyyyy, '$2');
    const d = str.replace(ddmmyyyy, '$1');
    const y = str.replace(ddmmyyyy, '$3');
    return `${y}-${m}-${d}`;
  }

  if (iso.test(str)) {
    return str;
  }

  // Não aceitar parsing genérico para evitar interpretações ambíguas (ex: strings com prefixos de timezone)
  return null;
}

/**
 * Valida se todas as colunas obrigatórias estão presentes
 */
function validarColunas(colunas: string[]): {
  valido: boolean;
  faltando: string[];
} {
  const obrigatorias = [
    'cpf',
    'nome',
    'data_nascimento',
    'setor',
    'funcao',
    'email',
  ];
  const faltando = obrigatorias.filter((col) => !colunas.includes(col));

  return {
    valido: faltando.length === 0,
    faltando,
  };
}

/**
 * Valida linha individual de dados
 */
export function validarLinhaFuncionario(
  row: any,
  _lineNumber: number
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  // Validar campos obrigatórios
  if (!row.cpf || String(row.cpf).trim() === '') {
    erros.push('CPF é obrigatório');
  } else {
    const cpfLimpo = limparCPF(String(row.cpf));
    if (!validarCPF(cpfLimpo)) {
      erros.push('CPF inválido');
    }
    if (cpfLimpo.length !== 11) {
      erros.push('CPF deve ter 11 dígitos');
    }
  }

  if (!row.nome || String(row.nome).trim() === '') {
    erros.push('Nome é obrigatório');
  }

  // Data de nascimento obrigatória e válida
  if (!row.data_nascimento) {
    erros.push('Data de nascimento é obrigatória');
  } else {
    const iso = parseDateCell(row.data_nascimento);
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!iso || !isoPattern.test(iso)) {
      erros.push('Data de nascimento inválida. Use dd/mm/aaaa');
    } else {
      // validar faixa de ano (mínimo 1900, máximo ano atual)
      const year = parseInt(iso.slice(0, 4), 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        erros.push(
          'Data de nascimento inválida. Ano fora do intervalo aceitável'
        );
      } else {
        // substituir pelo valor normalizado
        row.data_nascimento = iso;
      }
    }
  }

  if (!row.setor || String(row.setor).trim() === '') {
    erros.push('Setor é obrigatório');
  }

  if (!row.funcao || String(row.funcao).trim() === '') {
    erros.push('Função é obrigatória');
  }

  if (!row.email || String(row.email).trim() === '') {
    erros.push('Email é obrigatório');
  } else {
    const email = String(row.email).trim();
    if (!email.includes('@') || !email.includes('.')) {
      erros.push('Email inválido');
    }
  }

  // Validar nivel_cargo se fornecido
  if (row.nivel_cargo) {
    const niveisPermitidos = [
      'operacional',
      'gestao',
      'gerencial',
      'diretoria',
    ];
    const nivelNormalizado = String(row.nivel_cargo).toLowerCase().trim();
    if (!niveisPermitidos.includes(nivelNormalizado)) {
      erros.push(
        `Nível de cargo inválido. Permitidos: ${niveisPermitidos.join(', ')}`
      );
    }
  }

  if (erros.length > 0) {
    // console.debug('Row validation failed:', row, erros);
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Converte buffer de arquivo XLSX em array de objetos
 * @param buffer - Buffer do arquivo XLSX
 * @returns ParseResult com dados ou erro
 */
export function parseXlsxBufferToRows(buffer: Buffer): ParseResult {
  try {
    // Ler workbook do buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Verificar se há pelo menos uma aba
    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        error: 'Arquivo não contém nenhuma aba',
      };
    }

    // Pegar primeira aba
    const primeiraAba = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[primeiraAba];

    // Converter para JSON (array de objetos)
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Retorna array de arrays
      defval: '', // Valor padrão para células vazias
      blankrows: false, // Ignora linhas completamente vazias
    });

    if (rawData.length < 2) {
      return {
        success: false,
        error: 'Arquivo vazio ou sem dados (apenas cabeçalho)',
      };
    }

    // Extrair e normalizar cabeçalhos
    const rawHeaders = rawData[0];
    const headers: string[] = rawHeaders.map((h: any) => {
      const n = normalizarNomeColuna(String(h || ''));
      // Aceitar variações como 'data_nascimento', 'data_de_nascimento', 'nascimento'
      if (n.includes('nasc')) return 'data_nascimento';
      // Normalizar email (e-mail, e_mail, email)
      if (n.includes('mail')) return 'email';
      return n;
    });

    // Validar colunas obrigatórias
    // DEBUG: log headers when tests fail
    // console.debug('Parsed headers:', headers);
    const validacaoColunas = validarColunas(headers);
    if (!validacaoColunas.valido) {
      return {
        success: false,
        error: `Colunas obrigatórias ausentes: ${validacaoColunas.faltando.join(', ')}`,
      };
    }

    // Converter linhas em objetos
    const dados: FuncionarioImportRow[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];

      // Ignorar linhas vazias
      if (row.every((cell: any) => !cell || String(cell).trim() === '')) {
        continue;
      }

      // Criar objeto com chaves normalizadas
      const obj: any = {};
      headers.forEach((key, idx) => {
        const valor = row[idx];
        obj[key] = valor !== undefined && valor !== null ? valor : '';
      });

      // Limpar CPF
      if (obj.cpf) {
        obj.cpf = limparCPF(String(obj.cpf));
      }

      dados.push(obj as FuncionarioImportRow);
    }

    if (dados.length === 0) {
      return {
        success: false,
        error: 'Nenhum dado válido encontrado no arquivo',
      };
    }

    return {
      success: true,
      data: dados,
    };
  } catch (error) {
    console.error('Erro ao fazer parsing de XLSX:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Erro ao processar arquivo: ${error.message}`
          : 'Erro desconhecido ao processar arquivo',
    };
  }
}

/**
 * Valida email único dentro do lote
 */
export function validarEmailsUnicos(rows: FuncionarioImportRow[]): {
  valido: boolean;
  duplicados: string[];
} {
  const emails = new Set<string>();
  const duplicados: string[] = [];

  rows.forEach((row) => {
    const email = row.email.toLowerCase().trim();
    if (emails.has(email)) {
      duplicados.push(email);
    } else {
      emails.add(email);
    }
  });

  return {
    valido: duplicados.length === 0,
    duplicados,
  };
}

/**
 * Valida CPFs únicos dentro do lote
 */
export function validarCPFsUnicos(rows: FuncionarioImportRow[]): {
  valido: boolean;
  duplicados: string[];
} {
  const cpfs = new Set<string>();
  const duplicados: string[] = [];

  rows.forEach((row) => {
    const cpf = limparCPF(row.cpf);
    if (cpfs.has(cpf)) {
      duplicados.push(cpf);
    } else {
      cpfs.add(cpf);
    }
  });

  return {
    valido: duplicados.length === 0,
    duplicados,
  };
}
