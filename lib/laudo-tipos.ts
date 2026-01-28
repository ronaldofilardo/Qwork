// Tipos para o sistema de laudos padronizados

export type CategoriaRisco = 'baixo' | 'medio' | 'alto';
export type ClassificacaoSemaforo = 'verde' | 'amarelo' | 'vermelho';

export interface ScoreGrupo {
  grupo: number;
  dominio: string;
  descricao: string;
  tipo: 'positiva' | 'negativa';
  media: number;
  desvioPadrao: number;
  mediaMenosDP: number;
  mediaMaisDP: number;
  categoriaRisco: CategoriaRisco;
  classificacaoSemaforo: ClassificacaoSemaforo;
  rotuloCategoria?: string; // Rótulo textual: 'Excelente', 'Monitorar', 'Atenção Necessária', 'Crítico'
  acaoRecomendada: string;
}

export interface DadosGeraisEmpresa {
  empresaAvaliada: string;
  cnpj: string;
  endereco: string;
  periodoAvaliacoes: {
    dataLiberacao: string;
    dataUltimaConclusao: string;
  };
  totalFuncionariosAvaliados: number;
  percentualConclusao: number;
  amostra: {
    operacional: number;
    gestao: number;
  };
  loteCodigo: string;
}

export interface InterpretacaoRecomendacoes {
  textoPrincipal: string;
  gruposAtencao: ScoreGrupo[];
  gruposMonitoramento: ScoreGrupo[];
  gruposExcelente: ScoreGrupo[];
  gruposAltoRisco?: ScoreGrupo[];
  conclusao: string;
}

export interface ObservacoesConclusao {
  observacoesLaudo?: string; // opcional - só incluir se houver conteúdo
  textoConclusao: string;
  dataEmissao: string;
  assinatura: {
    nome: string;
    titulo: string;
    registro: string;
    empresa: string;
  };
}

export interface LaudoPadronizado {
  etapa1: DadosGeraisEmpresa;
  etapa2?: ScoreGrupo[];
  etapa3?: InterpretacaoRecomendacoes;
  etapa4?: ObservacoesConclusao;
  // Etapas futuras serão adicionadas aqui
  observacoesEmissor?: string;
  status: 'emitido' | 'enviado';
  criadoEm: string;
  emitidoEm?: string;
  enviadoEm?: string;
  hashPdf?: string;
}
