/**
 * Gerador de Senha por Data de Nascimento
 *
 * Gera senha padrão baseada na data de nascimento do funcionário
 * Formato: DDMMYYYY (8 dígitos)
 *
 * Exemplo: 24/10/1974 → 24101974
 */

import { isDataValida } from './date-validator';

/**
 * Gera senha a partir da data de nascimento
 * @param dataNascimento - Data em formato ISO (YYYY-MM-DD) ou BR (DD/MM/YYYY)
 * @returns String de 8 dígitos no formato DDMMYYYY
 * @throws Error se data for inválida
 */
export function gerarSenhaDeNascimento(dataNascimento: string): string {
  if (!dataNascimento || typeof dataNascimento !== 'string') {
    throw new Error('Data de nascimento é obrigatória');
  }

  let dia: string;
  let mes: string;
  let ano: string;

  // Normalizar entrada: remover espaços
  const entrada = dataNascimento.trim();

  // Detectar formato e extrair componentes
  if (entrada.includes('/')) {
    // Formato BR: DD/MM/YYYY ou DD/MM/YY
    const partes = entrada.split('/');
    if (partes.length !== 3) {
      throw new Error(
        'Data de nascimento inválida. Use DD/MM/YYYY, YYYY-MM-DD ou DDMMYYYY'
      );
    }
    dia = partes[0].padStart(2, '0');
    mes = partes[1].padStart(2, '0');
    ano = partes[2];

    // Se ano tem 2 dígitos, assumir 19XX ou 20XX
    if (ano.length === 2) {
      const anoNum = parseInt(ano, 10);
      ano = anoNum >= 0 && anoNum <= 30 ? `20${ano}` : `19${ano}`;
    }
  } else if (entrada.includes('-')) {
    // Formato ISO: YYYY-MM-DD
    const partes = entrada.split('-');
    if (partes.length !== 3) {
      throw new Error(
        'Data de nascimento inválida. Use DD/MM/YYYY, YYYY-MM-DD ou DDMMYYYY'
      );
    }
    ano = partes[0];
    mes = partes[1].padStart(2, '0');
    dia = partes[2].padStart(2, '0');
  } else if (/^\d{8}$/.test(entrada)) {
    // Formato sem separador com 8 dígitos: pode ser DDMMYYYY ou YYYYMMDD
    // Heurística: se primeiros 4 dígitos >= 1900 e <= ano atual, é YYYYMMDD
    // Caso contrário é DDMMYYYY
    const primeirosPrimeiros4 = parseInt(entrada.substring(0, 4), 10);
    const anoAtual = new Date().getFullYear();

    if (primeirosPrimeiros4 >= 1900 && primeirosPrimeiros4 <= anoAtual) {
      // Formato YYYYMMDD
      ano = entrada.substring(0, 4);
      mes = entrada.substring(4, 6).padStart(2, '0');
      dia = entrada.substring(6, 8).padStart(2, '0');
    } else {
      // Formato DDMMYYYY
      dia = entrada.substring(0, 2).padStart(2, '0');
      mes = entrada.substring(2, 4).padStart(2, '0');
      ano = entrada.substring(4, 8);
    }
  } else if (/^\d{6}$/.test(entrada)) {
    // Formato com 6 dígitos: DDMMYY ou YYMMDD
    // Assumir DDMMYY (data brasileira com ano curto)
    dia = entrada.substring(0, 2).padStart(2, '0');
    mes = entrada.substring(2, 4).padStart(2, '0');
    const anoAbreviado = entrada.substring(4, 6);
    const anoNum = parseInt(anoAbreviado, 10);
    ano =
      anoNum >= 0 && anoNum <= 30 ? `20${anoAbreviado}` : `19${anoAbreviado}`;
  } else {
    throw new Error(
      'Data de nascimento inválida. Use DD/MM/YYYY, YYYY-MM-DD ou DDMMYYYY'
    );
  }

  // Validar componentes
  const diaNum = parseInt(dia, 10);
  const mesNum = parseInt(mes, 10);
  const anoNum = parseInt(ano, 10);

  if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
    throw new Error('Dia inválido na data de nascimento');
  }

  if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
    throw new Error('Mês inválido na data de nascimento');
  }

  if (isNaN(anoNum) || anoNum < 1900 || anoNum > new Date().getFullYear()) {
    throw new Error('Ano inválido na data de nascimento');
  }

  // ✅ CRÍTICO: Validação de data real (rejeita 31/02/1990, etc)
  if (!isDataValida(diaNum, mesNum, anoNum)) {
    throw new Error(
      `Data de nascimento impossível: ${dia}/${mes}/${ano}. Verifique dia e mês.`
    );
  }

  // Garantir 4 dígitos no ano
  const anoFormatado = ano.padStart(4, '0');

  // Retornar no formato DDMMYYYY
  return `${dia}${mes}${anoFormatado}`;
}
