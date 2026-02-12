/**
 * Gerador de Senha por Data de Nascimento
 *
 * Gera senha padrão baseada na data de nascimento do funcionário
 * Formato: DDMMYYYY (8 dígitos)
 *
 * Exemplo: 24/10/1974 → 24101974
 */

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

  // Detectar formato e extrair componentes
  if (dataNascimento.includes('/')) {
    // Formato BR: DD/MM/YYYY ou DD/MM/YY
    const partes = dataNascimento.split('/');
    if (partes.length !== 3) {
      throw new Error(
        'Data de nascimento inválida. Use DD/MM/YYYY ou YYYY-MM-DD'
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
  } else if (dataNascimento.includes('-')) {
    // Formato ISO: YYYY-MM-DD
    const partes = dataNascimento.split('-');
    if (partes.length !== 3) {
      throw new Error(
        'Data de nascimento inválida. Use DD/MM/YYYY ou YYYY-MM-DD'
      );
    }
    ano = partes[0];
    mes = partes[1].padStart(2, '0');
    dia = partes[2].padStart(2, '0');
  } else {
    throw new Error(
      'Data de nascimento inválida. Use DD/MM/YYYY ou YYYY-MM-DD'
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

  // Garantir 4 dígitos no ano
  const anoFormatado = ano.padStart(4, '0');

  // Retornar no formato DDMMYYYY
  return `${dia}${mes}${anoFormatado}`;
}
