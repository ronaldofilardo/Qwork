/**
 * Utilitário para parsing de arquivos XLSX
 * Converte buffer de arquivo Excel em array de objetos validados
 */

import * as XLSX from 'xlsx';
import { validarCPF, limparCPF } from './cpf-utils';
import { normalizeCNPJ, validarCNPJ } from './validators';

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
    // Usar métodos UTC para evitar shift de fuso horário (xlsx retorna midnight UTC)
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
  const obrigatorias = ['cpf', 'nome', 'data_nascimento', 'setor', 'funcao'];
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
    const cpfRaw = String(row.cpf).trim();
    if (/[a-zA-Z]/.test(cpfRaw)) {
      erros.push('CPF contém letras — apenas números são permitidos');
    } else {
      const cpfLimpo = limparCPF(cpfRaw);
      if (cpfLimpo.length !== 11) {
        erros.push(
          `CPF deve ter 11 dígitos (${cpfLimpo.length} informado${cpfLimpo.length === 1 ? '' : 's'})`
        );
      } else if (!validarCPF(cpfLimpo)) {
        erros.push('CPF inválido — verifique os dígitos verificadores');
      }
    }
  }

  if (!row.nome || String(row.nome).trim() === '') {
    erros.push('Nome é obrigatório');
  } else if (/\d/.test(String(row.nome).trim())) {
    erros.push('Nome não deve conter números');
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

  // Email é opcional, mas se fornecido deve ser válido
  if (row.email && String(row.email).trim() !== '') {
    const email = String(row.email).trim();
    if (!email.includes('@')) {
      erros.push('Email inválido — falta o @');
    } else if (email.indexOf('.', email.indexOf('@')) === -1) {
      erros.push('Email inválido — falta o domínio após @');
    }
  }

  // Validar nivel_cargo se fornecido
  // Para perfil='funcionario', a constraint do banco aceita apenas: 'operacional' ou 'gestao'
  if (row.nivel_cargo) {
    const nivelOriginal = String(row.nivel_cargo).trim();
    const nivelNormalizado = nivelOriginal.toLowerCase();

    // Mapeamento de cargos comuns para níveis permitidos pelo banco
    const mapeamentoCargos: Record<string, string> = {
      // Nível Operacional
      operacional: 'operacional',
      operador: 'operacional',
      assistente: 'operacional',
      auxiliar: 'operacional',
      técnico: 'operacional',
      tecnico: 'operacional',
      analista: 'operacional',
      especialista: 'operacional',

      // Nível Gestão
      gestao: 'gestao',
      coordenador: 'gestao',
      coordenadora: 'gestao',
      supervisor: 'gestao',
      supervisora: 'gestao',
      gerente: 'gestao',
      gestor: 'gestao',
      gestora: 'gestao',
      líder: 'gestao',
      lider: 'gestao',
    };

    const nivelMapeado = mapeamentoCargos[nivelNormalizado];

    if (!nivelMapeado) {
      erros.push(
        `Nível de cargo '${nivelOriginal}' não reconhecido. Use: operacional, gestao, analista, coordenador, gerente, etc.`
      );
    } else {
      // Substituir pelo valor normalizado e mapeado
      row.nivel_cargo = nivelMapeado;
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
    // cellDates:true garante que células de data venham como Date objects (evita erros no parse de serial)
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

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
 * Valida email único dentro do lote (ignora linhas com email vazio)
 */
export function validarEmailsUnicos(rows: FuncionarioImportRow[]): {
  valido: boolean;
  duplicados: string[];
} {
  const emails = new Set<string>();
  const duplicados: string[] = [];

  rows.forEach((row) => {
    // Pular linhas sem email
    if (!row.email || String(row.email).trim() === '') {
      return;
    }
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

/**
 * Localiza a linha Excel de um CPF no array de linhas do arquivo.
 * Retorna o número da linha (base 1, com header em linha 1) ou null se não encontrado.
 */
export function localizarLinhaPorCPF(
  cpf: string,
  rows: FuncionarioImportRow[]
): number | null {
  const cpfBuscado = limparCPF(cpf);
  const idx = rows.findIndex((r) => limparCPF(r.cpf) === cpfBuscado);
  return idx >= 0 ? idx + 2 : null;
}

/**
 * Localiza a linha Excel de uma matrícula no array de linhas do arquivo.
 */
export function localizarLinhaPorMatricula(
  matricula: string,
  rows: FuncionarioImportRow[]
): number | null {
  const m = matricula.trim();
  const idx = rows.findIndex((r) => r.matricula?.trim() === m);
  return idx >= 0 ? idx + 2 : null;
}

/**
 * Localiza a linha Excel de um email no array de linhas do arquivo.
 */
export function localizarLinhaPorEmail(
  email: string,
  rows: FuncionarioImportRow[]
): number | null {
  const emailBuscado = email.toLowerCase().trim();
  const idx = rows.findIndex(
    (r) => r.email && String(r.email).toLowerCase().trim() === emailBuscado
  );
  return idx >= 0 ? idx + 2 : null;
}

/**
 * Valida CPFs únicos retornando mensagens detalhadas com número de linha para cada duplicata.
 */
export function validarCPFsUnicosDetalhado(rows: FuncionarioImportRow[]): {
  valido: boolean;
  details: string[];
} {
  const cpfLinhas = new Map<string, number[]>();
  rows.forEach((row, i) => {
    const cpf = limparCPF(row.cpf);
    if (cpf) {
      const existing = cpfLinhas.get(cpf) ?? [];
      existing.push(i + 2);
      cpfLinhas.set(cpf, existing);
    }
  });

  const details: string[] = [];
  cpfLinhas.forEach((linhas, cpf) => {
    if (linhas.length > 1) {
      details.push(
        `Linha ${linhas[0]}: CPF ${cpf} duplicado no arquivo (também nas linhas ${linhas.slice(1).join(', ')})`
      );
    }
  });

  return { valido: details.length === 0, details };
}

/**
 * Valida emails únicos retornando mensagens detalhadas com número de linha para cada duplicata.
 */
export function validarEmailsUnicosDetalhado(rows: FuncionarioImportRow[]): {
  valido: boolean;
  details: string[];
} {
  const emailLinhas = new Map<string, number[]>();
  rows.forEach((row, i) => {
    if (!row.email || String(row.email).trim() === '') return;
    const email = String(row.email).toLowerCase().trim();
    const existing = emailLinhas.get(email) ?? [];
    existing.push(i + 2);
    emailLinhas.set(email, existing);
  });

  const details: string[] = [];
  emailLinhas.forEach((linhas, email) => {
    if (linhas.length > 1) {
      details.push(
        `Linha ${linhas[0]}: Email ${email} duplicado no arquivo (também nas linhas ${linhas.slice(1).join(', ')})`
      );
    }
  });

  return { valido: details.length === 0, details };
}

/**
 * Valida matrículas únicas retornando mensagens detalhadas com número de linha para cada duplicata.
 */
export function validarMatriculasUnicasDetalhado(
  rows: FuncionarioImportRow[]
): {
  valido: boolean;
  details: string[];
} {
  const matriculaLinhas = new Map<string, number[]>();
  rows.forEach((row, i) => {
    if (!row.matricula || String(row.matricula).trim() === '') return;
    const mat = String(row.matricula).trim();
    const existing = matriculaLinhas.get(mat) ?? [];
    existing.push(i + 2);
    matriculaLinhas.set(mat, existing);
  });

  const details: string[] = [];
  matriculaLinhas.forEach((linhas, mat) => {
    if (linhas.length > 1) {
      details.push(
        `Linha ${linhas[0]}: Matrícula ${mat} duplicada no arquivo (também nas linhas ${linhas.slice(1).join(', ')})`
      );
    }
  });

  return { valido: details.length === 0, details };
}

// ============================================================
// BULK IMPORT: Empresas + Funcionários
// ============================================================

export interface EmpresaFuncionarioImportRow {
  empresa_cnpj: string;
  empresa_nome: string;
  cpf: string;
  nome: string;
  data_nascimento: string;
  setor: string;
  funcao: string;
  email?: string;
  matricula?: string;
  nivel_cargo?: string;
  turno?: string;
  escala?: string;
}

export interface ParseEmpresaFuncionarioResult {
  success: boolean;
  data?: EmpresaFuncionarioImportRow[];
  error?: string;
}

const COLUNAS_OBRIGATORIAS_BULK = [
  'empresa_cnpj',
  'empresa_nome',
  'cpf',
  'nome',
  'data_nascimento',
  'setor',
  'funcao',
] as const;

function normalizarColunasBulk(nome: string): string {
  const n = normalizarNomeColuna(nome);
  if (n.includes('nasc')) return 'data_nascimento';
  if (n.includes('mail')) return 'email';
  if (n.includes('empresa') && n.includes('cnpj')) return 'empresa_cnpj';
  if (n.includes('empresa') && n.includes('nome')) return 'empresa_nome';
  if (n === 'empresa') return 'empresa_nome';
  // Standalone 'cnpj' column interpreted as empresa_cnpj
  if (n === 'cnpj') return 'empresa_cnpj';
  return n;
}

export function parseEmpresaFuncionarioXlsx(
  buffer: Buffer
): ParseEmpresaFuncionarioResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (workbook.SheetNames.length === 0) {
      return { success: false, error: 'Arquivo não contém nenhuma aba' };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    }) as unknown[][];

    if (rawData.length < 2) {
      return {
        success: false,
        error: 'Arquivo vazio ou sem dados (apenas cabeçalho)',
      };
    }

    const headers: string[] = (rawData[0] as unknown[]).map((h) =>
      normalizarColunasBulk(String(h ?? ''))
    );

    const faltando = COLUNAS_OBRIGATORIAS_BULK.filter(
      (col) => !headers.includes(col)
    );
    if (faltando.length > 0) {
      return {
        success: false,
        error: `Colunas obrigatórias ausentes: ${faltando.join(', ')}`,
      };
    }

    const dados: EmpresaFuncionarioImportRow[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as unknown[];
      if (row.every((cell) => !cell || String(cell).trim() === '')) continue;

      const obj: Record<string, unknown> = {};
      headers.forEach((key, idx) => {
        const valor = row[idx];
        obj[key] = valor !== undefined && valor !== null ? valor : '';
      });

      if (obj['cpf']) obj['cpf'] = limparCPF(String(obj['cpf']));
      if (obj['empresa_cnpj'])
        obj['empresa_cnpj'] = normalizeCNPJ(String(obj['empresa_cnpj']));

      dados.push(obj as unknown as EmpresaFuncionarioImportRow);
    }

    if (dados.length === 0) {
      return {
        success: false,
        error: 'Nenhum dado válido encontrado no arquivo',
      };
    }

    return { success: true, data: dados };
  } catch (error) {
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
 * Valida linha individual no formato bulk (empresa + funcionário)
 */
export function validarLinhaEmpresaFuncionario(
  row: EmpresaFuncionarioImportRow,
  lineNumber: number
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  // Validar empresa_cnpj
  if (!row.empresa_cnpj || String(row.empresa_cnpj).trim() === '') {
    erros.push('CNPJ da empresa é obrigatório');
  } else {
    const cnpjNorm = normalizeCNPJ(String(row.empresa_cnpj));
    if (!validarCNPJ(cnpjNorm)) {
      erros.push(`CNPJ inválido: ${row.empresa_cnpj}`);
    } else {
      row.empresa_cnpj = cnpjNorm;
    }
  }

  // Validar empresa_nome
  if (!row.empresa_nome || String(row.empresa_nome).trim().length < 2) {
    erros.push('Nome da empresa deve ter no mínimo 2 caracteres');
  }

  // Reusa validações de funcionário (aceita any)
  const funcResult = validarLinhaFuncionario(
    row as unknown as FuncionarioImportRow,
    lineNumber
  );
  erros.push(...funcResult.erros);

  return { valido: erros.length === 0, erros };
}

/**
 * Verifica que o mesmo CNPJ sempre usa o mesmo nome de empresa no arquivo
 */
export function validarCNPJsEmpresaBulk(rows: EmpresaFuncionarioImportRow[]): {
  valido: boolean;
  erros: string[];
} {
  const cnpjNomeMap = new Map<string, string>();
  const erros: string[] = [];

  rows.forEach((row, idx) => {
    const cnpj = normalizeCNPJ(String(row.empresa_cnpj ?? ''));
    const nome = String(row.empresa_nome ?? '').trim();
    if (!cnpj || !nome) return;

    const existing = cnpjNomeMap.get(cnpj);
    if (existing === undefined) {
      cnpjNomeMap.set(cnpj, nome);
    } else if (existing.toLowerCase() !== nome.toLowerCase()) {
      erros.push(
        `Linha ${idx + 2}: CNPJ ${cnpj} aparece com nome diferente ("${existing}" vs "${nome}")`
      );
    }
  });

  return { valido: erros.length === 0, erros };
}
