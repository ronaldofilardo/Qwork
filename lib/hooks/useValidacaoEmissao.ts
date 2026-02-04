/**
 * Hook para validação client-side de solicitação de emissão
 *
 * Valida se lote está pronto para emissão antes de enviar request,
 * evitando chamadas desnecessárias ao backend e melhorando UX.
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Dados do lote para validação
 */
export interface DadosValidacaoLote {
  loteId: number;
  status: string;
  totalAvaliacoes: number;
  avaliacoesConcluidas: number;
  avaliacoesInativadas: number;
  temLaudo?: boolean;
  laudoStatus?: string | null;
  emissaoSolicitada?: boolean;
}

/**
 * Resultado da validação
 */
export interface ResultadoValidacaoCliente {
  valido: boolean;
  erros: string[];
  avisos: string[];
  podeEmitir: boolean;
}

/**
 * Hook de validação client-side
 */
export function useValidacaoEmissao(dados: DadosValidacaoLote) {
  const [validacao, setValidacao] = useState<ResultadoValidacaoCliente>({
    valido: false,
    erros: [],
    avisos: [],
    podeEmitir: false,
  });

  useEffect(() => {
    const erros: string[] = [];
    const avisos: string[] = [];

    // 1. Validar status do lote
    if (dados.status !== 'concluido') {
      erros.push(`Lote não está concluído. Status atual: ${dados.status}`);
    }

    // 2. Validar que não tem laudo emitido (imutabilidade)
    if (dados.temLaudo || dados.laudoStatus) {
      erros.push('Laudo já foi emitido para este lote');
    }

    // 3. Validar que emissão não foi solicitada
    if (dados.emissaoSolicitada) {
      erros.push('Emissão já foi solicitada para este lote');
    }

    // 4. Validar que tem avaliações
    if (dados.totalAvaliacoes === 0) {
      erros.push('Lote não possui avaliações');
    }

    // 5. Validar que avaliações ativas estão concluídas
    const avaliacoesAtivas = dados.totalAvaliacoes - dados.avaliacoesInativadas;

    if (avaliacoesAtivas > 0 && dados.avaliacoesConcluidas < avaliacoesAtivas) {
      erros.push(
        `Nem todas as avaliações estão concluídas (${dados.avaliacoesConcluidas}/${avaliacoesAtivas} concluídas)`
      );
    }

    // 6. Avisos (não bloqueiam)
    if (dados.avaliacoesInativadas > 0) {
      avisos.push(
        `${dados.avaliacoesInativadas} avaliação(ões) inativada(s) não serão incluídas no laudo`
      );
    }

    if (avaliacoesAtivas < 3) {
      avisos.push(
        'Lote possui poucas avaliações ativas. Verifique se está correto.'
      );
    }

    // Determinar se pode emitir
    const podeEmitir = erros.length === 0;

    setValidacao({
      valido: erros.length === 0,
      erros,
      avisos,
      podeEmitir,
    });
  }, [
    dados.status,
    dados.totalAvaliacoes,
    dados.avaliacoesConcluidas,
    dados.avaliacoesInativadas,
    dados.temLaudo,
    dados.laudoStatus,
    dados.emissaoSolicitada,
  ]);

  return validacao;
}

/**
 * Validar formulário de emissão (exemplo para outros formulários)
 */
export function validarFormularioEmissao(dados: {
  observacoes?: string;
  emissorCpf?: string;
}): { valido: boolean; erros: Record<string, string> } {
  const erros: Record<string, string> = {};

  // Validar CPF do emissor (se fornecido)
  if (dados.emissorCpf) {
    const cpfLimpo = dados.emissorCpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      erros.emissorCpf = 'CPF deve ter 11 dígitos';
    }
  }

  // Validar observações (tamanho máximo)
  if (dados.observacoes && dados.observacoes.length > 500) {
    erros.observacoes = 'Observações devem ter no máximo 500 caracteres';
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros,
  };
}

/**
 * Validar campo individual (útil para validação em tempo real)
 */
export function validarCampo(
  nome: string,
  valor: any
): { valido: boolean; erro?: string } {
  switch (nome) {
    case 'cpf':
      const cpfLimpo = String(valor).replace(/\D/g, '');
      if (!cpfLimpo) {
        return { valido: false, erro: 'CPF é obrigatório' };
      }
      if (cpfLimpo.length !== 11) {
        return { valido: false, erro: 'CPF deve ter 11 dígitos' };
      }
      return { valido: true };

    case 'observacoes':
      if (String(valor).length > 500) {
        return {
          valido: false,
          erro: 'Máximo de 500 caracteres',
        };
      }
      return { valido: true };

    default:
      return { valido: true };
  }
}
