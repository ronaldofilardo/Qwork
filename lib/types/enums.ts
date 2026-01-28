/**
 * Tipos centralizados do sistema QWork
 * ÚNICA FONTE DE VERDADE para tipos de dados
 * Sincronizado com ENUMs do banco de dados (migrations/006)
 */

/**
 * Perfis de usuário válidos no sistema
 * @enum {string}
 */
export enum PerfilUsuario {
  FUNCIONARIO = 'funcionario',
  RH = 'rh',
  ADMIN = 'admin',
  // Emissor é um usuário INDEPENDENTE: NÃO deve ser associado a `clinica_id`/`empresa_id`.
  // Acesso global para emissão de laudos; a visibilidade é gerida por RLS explicitamente.
  EMISSOR = 'emissor',
  GESTOR_ENTIDADE = 'gestor_entidade',
  CADASTRO = 'cadastro',
}

export type PerfilUsuarioType =
  | 'funcionario'
  | 'rh'
  | 'admin'
  | 'emissor'
  | 'gestor_entidade'
  | 'cadastro';

/**
 * Status de avaliação
 * @enum {string}
 */
export enum StatusAvaliacao {
  INICIADA = 'iniciada',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDA = 'concluida',
  INATIVADA = 'inativada',
}

export type StatusAvaliacaoType =
  | 'iniciada'
  | 'em_andamento'
  | 'concluida'
  | 'inativada';

/**
 * Status de lote de avaliações
 * @enum {string}
 */
export enum StatusLote {
  ATIVO = 'ativo',
  CANCELADO = 'cancelado',
  FINALIZADO = 'finalizado',
  CONCLUIDO = 'concluido',
}

export type StatusLoteType = 'ativo' | 'cancelado' | 'finalizado' | 'concluido';

/**
 * Status de laudo
 * @enum {string}
 */
export enum StatusLaudo {
  EMITIDO = 'emitido',
  ENVIADO = 'enviado',
}

export type StatusLaudoType = 'emitido' | 'enviado';

/**
 * Tipo de lote de avaliações
 * @enum {string}
 */
export enum TipoLote {
  COMPLETO = 'completo',
  OPERACIONAL = 'operacional',
  GESTAO = 'gestao',
}

export type TipoLoteType = 'completo' | 'operacional' | 'gestao';

/**
 * Nível de cargo
 * @enum {string}
 */
export enum NivelCargo {
  OPERACIONAL = 'operacional',
  GESTAO = 'gestao',
}

export type NivelCargoType = 'operacional' | 'gestao';

/**
 * Validadores de tipo
 */
export const TypeValidators = {
  isPerfil: (value: string): value is PerfilUsuarioType => {
    return Object.values(PerfilUsuario).includes(value as PerfilUsuario);
  },

  isStatusAvaliacao: (value: string): value is StatusAvaliacaoType => {
    return Object.values(StatusAvaliacao).includes(value as StatusAvaliacao);
  },

  isStatusLote: (value: string): value is StatusLoteType => {
    return Object.values(StatusLote).includes(value as StatusLote);
  },

  isStatusLaudo: (value: string): value is StatusLaudoType => {
    return Object.values(StatusLaudo).includes(value as StatusLaudo);
  },

  isTipoLote: (value: string): value is TipoLoteType => {
    return Object.values(TipoLote).includes(value as TipoLote);
  },

  isNivelCargo: (value: string): value is NivelCargoType => {
    return Object.values(NivelCargo).includes(value as NivelCargo);
  },
};

/**
 * Arrays de valores válidos (para uso em validações)
 */
export const PERFIS_VALIDOS: PerfilUsuarioType[] = [
  'funcionario',
  'rh',
  'admin',
  'emissor',
  'gestor_entidade',
];
export const STATUS_AVALIACAO_VALIDOS: StatusAvaliacaoType[] = [
  'iniciada',
  'em_andamento',
  'concluida',
  'inativada',
];
export const STATUS_LOTE_VALIDOS: StatusLoteType[] = [
  'ativo',
  'cancelado',
  'finalizado',
  'concluido',
];
export const STATUS_LAUDO_VALIDOS: StatusLaudoType[] = ['emitido', 'enviado'];
export const TIPO_LOTE_VALIDOS: TipoLoteType[] = [
  'completo',
  'operacional',
  'gestao',
];
export const NIVEL_CARGO_VALIDOS: NivelCargoType[] = ['operacional', 'gestao'];
/**
 * Status de contratação personalizada
 * Sincronizado com enum status_contratacao_personalizada (migration 021)
 * @enum {string}
 */
export enum StatusContratacaoPersonalizada {
  PRE_CADASTRO = 'pre_cadastro',
  AGUARDANDO_VALOR_ADMIN = 'aguardando_valor_admin',
  VALOR_DEFINIDO = 'valor_definido',
  AGUARDANDO_PAGAMENTO = 'aguardando_pagamento',
  PAGAMENTO_CONFIRMADO = 'pagamento_confirmado',
  ATIVO = 'ativo',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado',
}

export type StatusContratacaoPersonalizadaType =
  | 'pre_cadastro'
  | 'aguardando_valor_admin'
  | 'valor_definido'
  | 'aguardando_pagamento'
  | 'pagamento_confirmado'
  | 'ativo'
  | 'rejeitado'
  | 'cancelado';

/**
 * Tipo de plano de contratação
 * @enum {string}
 */
export enum TipoPlano {
  FIXO = 'fixo',
  PERSONALIZADO = 'personalizado',
  BASICO = 'basico',
  PREMIUM = 'premium',
}

export type TipoPlanoType = 'fixo' | 'personalizado' | 'basico' | 'premium';

/**
 * Tipo de contratante
 * @enum {string}
 */
export enum TipoContratante {
  CLINICA = 'clinica',
  ENTIDADE = 'entidade',
}

export type TipoContratanteType = 'clinica' | 'entidade';

/**
 * Validadores de tipo expandidos
 */
export const ExtendedTypeValidators = {
  ...TypeValidators,

  isStatusContratacaoPersonalizada: (
    value: string
  ): value is StatusContratacaoPersonalizadaType => {
    return Object.values(StatusContratacaoPersonalizada).includes(
      value as StatusContratacaoPersonalizada
    );
  },

  isTipoPlano: (value: string): value is TipoPlanoType => {
    return Object.values(TipoPlano).includes(value as TipoPlano);
  },

  isTipoContratante: (value: string): value is TipoContratanteType => {
    return Object.values(TipoContratante).includes(value as TipoContratante);
  },
};

/**
 * Arrays de valores válidos para contratação
 */
export const STATUS_CONTRATACAO_PERSONALIZADA_VALIDOS: StatusContratacaoPersonalizadaType[] =
  [
    'pre_cadastro',
    'aguardando_valor_admin',
    'valor_definido',
    'aguardando_pagamento',
    'pagamento_confirmado',
    'ativo',
    'rejeitado',
    'cancelado',
  ];

export const TIPO_PLANO_VALIDOS: TipoPlanoType[] = ['fixo', 'personalizado'];

export const TIPO_CONTRATANTE_VALIDOS: TipoContratanteType[] = [
  'clinica',
  'entidade',
];

/**
 * Mapeamento de labels para exibição
 */
export const StatusContratacaoPersonalizadaLabels: Record<
  StatusContratacaoPersonalizadaType,
  string
> = {
  pre_cadastro: 'Pré-cadastro',
  aguardando_valor_admin: 'Aguardando Definição de Valor',
  valor_definido: 'Valor Definido',
  aguardando_pagamento: 'Aguardando Pagamento',
  pagamento_confirmado: 'Pagamento Confirmado',
  ativo: 'Ativo',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
};

export const TipoPlanoLabels: Record<TipoPlanoType, string> = {
  fixo: 'Plano Fixo',
  personalizado: 'Plano Personalizado',
  basico: 'Plano Básico',
  premium: 'Plano Premium',
};

export const TipoContratanteLabels: Record<TipoContratanteType, string> = {
  clinica: 'Serviço de Medicina Ocupacional',
  entidade: 'Empresa Privada',
};
