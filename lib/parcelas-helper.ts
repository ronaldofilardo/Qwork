/**
 * Helper para cálculo de parcelas de pagamento
 */

export interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: string;
  pago: boolean;
  data_pagamento: string | null;
  status: 'pago' | 'pendente';
}

export interface CalculoParcelasParams {
  valorTotal: number;
  numeroParcelas: number;
  dataInicial?: Date;
}

/**
 * Calcula parcelas de um pagamento
 * @param params Parâmetros para cálculo
 * @returns Array de parcelas com valores e datas
 *
 * REGRA CRÍTICA:
 * - 1ª parcela: vencimento IMEDIATO (data do pagamento) - deve ser paga na hora
 * - Demais parcelas: MESMO DIA nos meses subsequentes
 * - Exemplo: 1ª em 27/12, depois 27/01, 27/02, 27/03, 27/04
 */
export function calcularParcelas(params: CalculoParcelasParams): Parcela[] {
  const { valorTotal, numeroParcelas, dataInicial } = params;

  if (numeroParcelas < 1 || numeroParcelas > 12) {
    throw new Error('Número de parcelas deve estar entre 1 e 12');
  }

  if (valorTotal <= 0) {
    throw new Error('Valor total deve ser maior que zero');
  }

  const dataBase = dataInicial || new Date();
  const diaVencimento = dataBase.getDate(); // Guardar o dia para manter nas parcelas seguintes
  const valorParcela = valorTotal / numeroParcelas;
  const parcelas: Parcela[] = [];

  for (let i = 0; i < numeroParcelas; i++) {
    const dataVencimento = new Date(dataBase);

    // Para parcelas seguintes, avançar meses mantendo o mesmo dia
    if (i > 0) {
      // Calcular ano e mês alvo mantendo o offset i
      const year = dataBase.getFullYear();
      const monthIndex = dataBase.getMonth() + i; // 0-based

      // Último dia do mês alvo
      const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
      const day = Math.min(diaVencimento, lastDayOfMonth);

      // Criar nova data com ano, mês e dia ajustados (mantendo hora original)
      const hora = dataBase.getHours();
      const minutos = dataBase.getMinutes();
      const segundos = dataBase.getSeconds();
      const ms = dataBase.getMilliseconds();

      const adjDate = new Date(
        year,
        monthIndex,
        day,
        hora,
        minutos,
        segundos,
        ms
      );
      dataVencimento.setTime(adjDate.getTime());
    }
    // Para primeira parcela (i === 0), usa a dataBase como está

    parcelas.push({
      numero: i + 1,
      valor: Math.round(valorParcela * 100) / 100, // Arredondar para 2 casas
      data_vencimento: dataVencimento.toISOString().split('T')[0],
      pago: i === 0, // Primeira parcela paga imediatamente
      data_pagamento: i === 0 ? new Date().toISOString() : null,
      status: i === 0 ? 'pago' : 'pendente',
    });
  }

  // Ajustar última parcela para compensar arredondamentos
  const somaCalculada = parcelas.reduce((sum, p) => sum + p.valor, 0);
  const diferenca = Math.round((valorTotal - somaCalculada) * 100) / 100;

  if (diferenca !== 0) {
    parcelas[parcelas.length - 1].valor += diferenca;
  }

  return parcelas;
}

/**
 * Valida estrutura de parcelas
 * @param parcelas Array de parcelas a validar
 * @returns true se válido, mensagem de erro caso contrário
 */
export function validarParcelas(parcelas: Parcela[]): {
  valido: boolean;
  erro?: string;
} {
  if (!Array.isArray(parcelas) || parcelas.length === 0) {
    return { valido: false, erro: 'Array de parcelas vazio ou inválido' };
  }

  for (let i = 0; i < parcelas.length; i++) {
    const parcela = parcelas[i];

    if (parcela.numero !== i + 1) {
      return {
        valido: false,
        erro: `Numeração incorreta na parcela ${i + 1}`,
      };
    }

    if (parcela.valor <= 0) {
      return {
        valido: false,
        erro: `Valor inválido na parcela ${parcela.numero}`,
      };
    }

    if (!parcela.data_vencimento) {
      return {
        valido: false,
        erro: `Data de vencimento ausente na parcela ${parcela.numero}`,
      };
    }

    // Validar formato de data
    const dataVencimento = new Date(parcela.data_vencimento);
    if (isNaN(dataVencimento.getTime())) {
      return {
        valido: false,
        erro: `Data de vencimento inválida na parcela ${parcela.numero}`,
      };
    }
  }

  return { valido: true };
}

/**
 * Formatar valor para moeda brasileira
 * @param valor Valor numérico
 * @returns String formatada em R$
 */
export function formatarValorBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Marcar parcela como paga
 * @param parcelas Array de parcelas
 * @param numeroParcela Número da parcela a marcar como paga
 * @returns Array atualizado
 */
export function marcarParcelaPaga(
  parcelas: Parcela[],
  numeroParcela: number
): Parcela[] {
  return parcelas.map((p) => {
    if (p.numero === numeroParcela && !p.pago) {
      return {
        ...p,
        pago: true,
        data_pagamento: new Date().toISOString(),
      };
    }
    return p;
  });
}

/**
 * Obter parcelas pendentes
 * @param parcelas Array de parcelas
 * @returns Array com parcelas não pagas
 */
export function getParcelasPendentes(parcelas: Parcela[]): Parcela[] {
  return parcelas.filter((p) => !p.pago);
}

/**
 * Obter resumo de pagamento
 * @param parcelas Array de parcelas
 * @returns Resumo com totais
 */
export function getResumoPagamento(parcelas: Parcela[]): {
  totalParcelas: number;
  parcelasPagas: number;
  parcelasPendentes: number;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  statusGeral: 'quitado' | 'em_aberto';
} {
  const pagas = parcelas.filter((p) => p.pago);
  const pendentes = parcelas.filter((p) => !p.pago);

  const totalParcelas = parcelas.length;
  const parcelasPagas = pagas.length;

  return {
    totalParcelas: parcelas.length,
    parcelasPagas: pagas.length,
    parcelasPendentes: pendentes.length,
    valorTotal: parcelas.reduce((sum, p) => sum + p.valor, 0),
    valorPago: pagas.reduce((sum, p) => sum + p.valor, 0),
    valorPendente: pendentes.reduce((sum, p) => sum + p.valor, 0),
    statusGeral: parcelasPagas === totalParcelas ? 'quitado' : 'em_aberto',
  };
}

/**
 * Verifica se todas as parcelas estão quitadas
 * @param parcelas Array de parcelas
 * @returns true se todas as parcelas estão pagas
 */
export function isContratoQuitado(parcelas: Parcela[] | null): boolean {
  if (!parcelas || parcelas.length === 0) return false;
  return parcelas.every((p) => p.pago === true || p.status === 'pago');
}

/**
 * Retorna badge de status quitado/em aberto
 * @param parcelas Array de parcelas
 * @returns Objeto com label e cor do badge
 */
export function getStatusBadge(parcelas: Parcela[] | null): {
  label: string;
  colorClass: string;
} {
  const quitado = isContratoQuitado(parcelas);
  return quitado
    ? { label: 'Quitado', colorClass: 'bg-green-100 text-green-800' }
    : { label: 'Em Aberto', colorClass: 'bg-yellow-100 text-yellow-800' };
}
