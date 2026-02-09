/**
 * lib/domain/entities/Laudo.ts
 *
 * Entidade de domínio: Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)
 *
 * Representa um laudo técnico gerado para um lote de avaliações,
 * contendo análises, scores e recomendações.
 */

export interface LaudoEntity {
  id: number;
  loteId: number;
  emissorCpf: string;
  status: LaudoStatus;
  pdfPath: string | null;
  pdfHash: string | null;
  jsonData: LaudoDadosCompletos | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export enum LaudoStatus {
  RASCUNHO = 'rascunho',
  APROVADO = 'aprovado',
  EMITIDO = 'emitido',
  CANCELADO = 'cancelado',
}

export interface LaudoDadosCompletos {
  etapa1: DadosGeraisEmpresa;
  etapa2: ScorePorGrupo[];
  etapa3: InterpretacaoRecomendacoes;
  etapa4: ObservacoesConclusao;
}

export interface DadosGeraisEmpresa {
  empresa: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  totalFuncionarios: number;
  avaliacoesCompletadas: number;
  dataColeta: string;
}

export interface ScorePorGrupo {
  grupo: string;
  score: number;
  classificacao: 'baixo' | 'medio' | 'alto' | 'muito_alto';
  interpretacao: string;
}

export interface InterpretacaoRecomendacoes {
  analiseGeral: string;
  pontosAtencao: string[];
  recomendacoes: string[];
}

export interface ObservacoesConclusao {
  observacoes: string;
  conclusao: string;
  dataEmissao: string;
  emissorNome: string;
  emissorCpf: string;
}

/**
 * Validações de negócio
 */
export class LaudoBusinessRules {
  static validarEmissao(laudo: Partial<LaudoEntity>): void {
    if (!laudo.loteId) {
      throw new Error('Lote ID é obrigatório para emissão de laudo');
    }

    if (!laudo.emissorCpf) {
      throw new Error('Emissor CPF é obrigatório');
    }

    if (laudo.status === LaudoStatus.CANCELADO) {
      throw new Error('Não é possível emitir laudo cancelado');
    }
  }

  static validarAprovacao(laudo: LaudoEntity): void {
    if (laudo.status !== LaudoStatus.RASCUNHO) {
      throw new Error('Apenas laudos em rascunho podem ser aprovados');
    }

    if (!laudo.jsonData) {
      throw new Error('Laudo sem dados não pode ser aprovado');
    }
  }

  static validarCancelamento(laudo: LaudoEntity): void {
    if (laudo.status === LaudoStatus.EMITIDO) {
      throw new Error('Laudos já emitidos não podem ser cancelados');
    }
  }
}
