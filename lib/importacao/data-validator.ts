/**
 * Validador de dados para importação dinâmica de funcionários/empresas.
 * Categoriza erros como CRÍTICO (bloqueiam linha) ou AVISO (não bloqueiam).
 */

import { validarCPF, limparCPF } from '@/lib/cpf-utils';
import { validarCNPJ } from '@/lib/validators';
import { parseDateCell } from '@/lib/xlsxParser';
import type { MappedRow } from './dynamic-parser';

export type ErrorSeverity = 'erro' | 'aviso';

export interface ValidationIssue {
  linha: number;
  campo: string;
  valor: string;
  mensagem: string;
  severidade: ErrorSeverity;
}

export interface ValidationSummary {
  totalLinhas: number;
  linhasValidas: number;
  linhasComErros: number;
  empresasUnicas: number;
  cpfsUnicos: number;
  cpfsDuplicadosNoArquivo: number;
  linhasComDemissao: number;
}

export interface ValidationResult {
  valido: boolean;
  resumo: ValidationSummary;
  erros: ValidationIssue[];
  avisos: ValidationIssue[];
}

/**
 * Valida todas as linhas importadas contra as regras de negócio.
 * Não consulta o banco — validação puramente de formato e consistência.
 * @param rows Linhas mapeadas da planilha
 * @param options.ignorarCnpj Quando true, ausência de cnpj_empresa não gera erro bloqueante (fluxo Entidade)
 */
export function validarDadosImportacao(
  rows: MappedRow[],
  options?: { ignorarCnpj?: boolean }
): ValidationResult {
  const ignorarCnpj = options?.ignorarCnpj ?? false;
  const erros: ValidationIssue[] = [];
  const avisos: ValidationIssue[] = [];
  const cpfSet = new Map<string, number[]>();
  const empresasSet = new Set<string>();
  let linhasValidas = 0;
  let linhasComErros = 0;
  let linhasComDemissao = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const linha = i + 2; // +2 por header e índice 0-based
    const errosLinha: ValidationIssue[] = [];

    // === CPF (obrigatório) ===
    const cpfRaw = row.cpf ?? '';
    const cpfCorrigido = row['__cpf_corrigido'] === '1';
    if (!cpfRaw || cpfRaw.trim() === '') {
      errosLinha.push({
        linha,
        campo: 'cpf',
        valor: cpfRaw,
        mensagem: 'CPF é obrigatório',
        severidade: 'erro',
      });
    } else {
      const cpfLimpo = limparCPF(cpfRaw);
      if (cpfLimpo.length !== 11) {
        errosLinha.push({
          linha,
          campo: 'cpf',
          valor: cpfRaw,
          mensagem: `CPF deve ter 11 dígitos (${cpfLimpo.length} informados)`,
          severidade: 'erro',
        });
      } else if (!validarCPF(cpfLimpo)) {
        errosLinha.push({
          linha,
          campo: 'cpf',
          valor: cpfRaw,
          mensagem: 'CPF inválido — dígitos verificadores incorretos',
          severidade: 'erro',
        });
      } else {
        if (cpfCorrigido) {
          avisos.push({
            linha,
            campo: 'cpf',
            valor: cpfRaw,
            mensagem: `CPF com 10 dígitos: zero inserido como primeiro dígito (CPF: ${cpfLimpo}). Verifique se o dado está correto.`,
            severidade: 'aviso',
          });
        }
        // Rastrear duplicados
        const existing = cpfSet.get(cpfLimpo) ?? [];
        existing.push(linha);
        cpfSet.set(cpfLimpo, existing);
      }
    }

    // === Nome (obrigatório) ===
    const nome = row.nome ?? '';
    if (!nome || nome.trim() === '') {
      errosLinha.push({
        linha,
        campo: 'nome',
        valor: nome,
        mensagem: 'Nome do funcionário é obrigatório',
        severidade: 'erro',
      });
    }

    // === Nome da Empresa (opcional — auxiliar para criação, sem validação bloqueante) ===
    // Não valida nome_empresa como obrigatório: o CNPJ é o único agregador de empresa.

    // === CNPJ da Empresa (obrigatório no fluxo clínica; ignorado no fluxo entidade) ===
    const cnpjEmpresa = row.cnpj_empresa ?? '';
    if (!ignorarCnpj) {
      if (!cnpjEmpresa || cnpjEmpresa.trim() === '') {
        errosLinha.push({
          linha,
          campo: 'cnpj_empresa',
          valor: cnpjEmpresa,
          mensagem: 'CNPJ da empresa é obrigatório',
          severidade: 'erro',
        });
      } else if (!validarCNPJ(cnpjEmpresa)) {
        errosLinha.push({
          linha,
          campo: 'cnpj_empresa',
          valor: cnpjEmpresa,
          mensagem: 'CNPJ da empresa inválido',
          severidade: 'erro',
        });
      } else {
        empresasSet.add(cnpjEmpresa.trim());
      }
    }

    // === Data de Nascimento (obrigatória) ===
    const dataNasc = row.data_nascimento ?? '';
    if (!dataNasc || dataNasc.trim() === '') {
      errosLinha.push({
        linha,
        campo: 'data_nascimento',
        valor: dataNasc,
        mensagem: 'Data de nascimento é obrigatória',
        severidade: 'erro',
      });
    } else {
      const iso = parseDateCell(dataNasc);
      if (!iso) {
        errosLinha.push({
          linha,
          campo: 'data_nascimento',
          valor: dataNasc,
          mensagem: 'Data de nascimento inválida. Use dd/mm/aaaa',
          severidade: 'erro',
        });
      } else {
        const year = parseInt(iso.slice(0, 4), 10);
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) {
          errosLinha.push({
            linha,
            campo: 'data_nascimento',
            valor: dataNasc,
            mensagem:
              'Data de nascimento com ano fora do intervalo (1900 a atual)',
            severidade: 'erro',
          });
        }
      }
    }

    // === Cargo / Função (aviso — não bloqueia importação) ===
    const funcao = row.funcao ?? '';
    if (!funcao || funcao.trim() === '') {
      errosLinha.push({
        linha,
        campo: 'funcao',
        valor: funcao,
        mensagem: 'Cargo / Função não informado — funcionário será importado sem função definida',
        severidade: 'aviso',
      });
    }

    // === Data de Admissão (opcional, recomendada) ===
    const dataAdm = row.data_admissao ?? '';
    if (dataAdm && dataAdm.trim() !== '') {
      const iso = parseDateCell(dataAdm);
      if (!iso) {
        errosLinha.push({
          linha,
          campo: 'data_admissao',
          valor: dataAdm,
          mensagem: 'Data de admissão inválida. Use dd/mm/aaaa',
          severidade: 'erro',
        });
      }
    }

    // === Data de Demissão (opcional — define status) ===
    const dataDem = row.data_demissao ?? '';
    if (dataDem && dataDem.trim() !== '') {
      const isoDem = parseDateCell(dataDem);
      if (!isoDem) {
        errosLinha.push({
          linha,
          campo: 'data_demissao',
          valor: dataDem,
          mensagem: 'Data de demissão inválida. Use dd/mm/aaaa',
          severidade: 'erro',
        });
      } else {
        linhasComDemissao++;
        // Validar consistência: demissão >= admissão
        if (dataAdm && dataAdm.trim() !== '') {
          const isoAdm = parseDateCell(dataAdm);
          if (isoAdm && isoDem < isoAdm) {
            errosLinha.push({
              linha,
              campo: 'data_demissao',
              valor: dataDem,
              mensagem: 'Data de demissão anterior à data de admissão',
              severidade: 'erro',
            });
          }
        }
        avisos.push({
          linha,
          campo: 'data_demissao',
          valor: dataDem,
          mensagem: 'Funcionário será marcado como INATIVO nesta empresa',
          severidade: 'aviso',
        });
      }
    }

    // === Email (opcional mas validável) ===
    const email = row.email ?? '';
    if (email && email.trim() !== '') {
      if (
        !email.includes('@') ||
        email.indexOf('.', email.indexOf('@')) === -1
      ) {
        errosLinha.push({
          linha,
          campo: 'email',
          valor: email,
          mensagem: 'Email inválido',
          severidade: 'erro',
        });
      }
    }

    if (errosLinha.length > 0) {
      linhasComErros++;
      erros.push(...errosLinha);
    } else {
      linhasValidas++;
    }
  }

  // CPFs duplicados no arquivo
  let cpfsDuplicados = 0;
  cpfSet.forEach((linhas, cpf) => {
    if (linhas.length > 1) {
      cpfsDuplicados++;
      avisos.push({
        linha: linhas[0],
        campo: 'cpf',
        valor: cpf,
        mensagem: `CPF aparece ${linhas.length} vezes no arquivo (linhas ${linhas.join(', ')})`,
        severidade: 'aviso',
      });
    }
  });

  return {
    valido: linhasComErros === 0,
    resumo: {
      totalLinhas: rows.length,
      linhasValidas,
      linhasComErros,
      empresasUnicas: empresasSet.size,
      cpfsUnicos: cpfSet.size,
      cpfsDuplicadosNoArquivo: cpfsDuplicados,
      linhasComDemissao,
    },
    erros,
    avisos,
  };
}
