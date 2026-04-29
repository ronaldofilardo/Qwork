/**
 * Tipos do Sistema de Comissionamento QWork
 * ÚNICA FONTE DE VERDADE para entidades do módulo de representantes.
 * Sincronizado com ENUMs e tabelas da migration 500_sistema_comissionamento.sql
 */

// ---------------------------------------------------------------------------
// ENUMs (string unions — espelham os tipos PostgreSQL)
// ---------------------------------------------------------------------------

/**
 * Ciclo de vida do representante.
 *
 * ativo           → cadastro feito, pode indicar, mas comissões ficam retidas
 * apto_pendente   → documentação entregue, aguardando validação do admin
 * apto            → validado: comissões ficam retidas até admin liberar
 * suspenso        → investigação administrativa (comissões congeladas)
 * desativado      → encerramento permanente
 * rejeitado       → cadastro recusado na triagem inicial
 */
export type StatusRepresentante =
  | 'ativo'
  | 'apto_pendente'
  | 'apto'
  | 'suspenso'
  | 'desativado'
  | 'rejeitado'
  | 'aguardando_senha'
  | 'expirado'
  | 'aprovacao_comercial';

/** Tipo de pessoa — somente PJ desde migration 1209 */
export type TipoPessoaRepresentante = 'pj';

/**
 * Ciclo de vida de um lead (CNPJ indicado pelo representante).
 *
 * pendente   → dentro da janela de 90 dias, aguardando cadastro do cliente
 * convertido → cliente concluiu o cadastro dentro do prazo
 * expirado   → 90 dias passaram sem cadastro (token invalida automaticamente)
 */
export type StatusLead = 'pendente' | 'convertido' | 'expirado';

/** Como o CNPJ do lead foi vinculado ao representante durante o cadastro */
export type TipoConversaoLead =
  | 'link_representante' // cliente usou o link/token gerado pelo rep
  | 'codigo_representante' // cliente inseriu código manualmente no cadastro
  | 'verificacao_cnpj'; // sistema detectou CNPJ na lista, cadastro direto

/**
 * Ciclo de vida do vínculo de comissionamento (cobre 1 ano a partir do cadastro).
 *
 * ativo     → dentro da vigência; laudos geram comissões
 * inativo   → 90 dias sem laudo emitido (reverte para ativo ao emitir novo laudo)
 * suspenso  → representante suspenso
 * encerrado → expirou (1 ano) e não foi renovado; ou cancelado
 */
export type StatusVinculo = 'ativo' | 'inativo' | 'suspenso' | 'encerrado';

/**
 * Máquina de estados das comissões (por laudo emitido+pago).
 *
 * retida                     → aguardando liberação manual pelo admin
 * congelada_aguardando_admin → pendência administrativa genérica
 * liberada                   → pronta para pagamento
 * paga                       → pagamento confirmado pelo admin
 * cancelada                  → cancelada (vínculo encerrado ou admin cancelou)
 */
export type StatusComissao =
  | 'retida'
  | 'congelada_aguardando_admin'
  | 'liberada'
  | 'paga'
  | 'cancelada';

/**
 * Motivo do congelamento — espelha o enum motivo_congelamento do PostgreSQL.
 */
export type MotivoCongelamento =
  | 'vinculo_encerrado'
  | 'rep_suspenso'
  | 'aguardando_revisao';

/** Tipo de ator que dispara uma transição de auditoria */
export type Triggador =
  | 'job'
  | 'admin_action'
  | 'suporte_action'
  | 'rep_action'
  | 'sistema';

// ---------------------------------------------------------------------------
// Interfaces (espelham as linhas das tabelas PostgreSQL)
// ---------------------------------------------------------------------------

/**
 * Representante comercial — espelha public.representantes
 */
export interface Representante {
  id: number;
  tipo_pessoa: TipoPessoaRepresentante;
  nome: string;
  email: string;
  telefone: string;
  // PJ: CNPJ + cpf_responsavel_pj obrigatórios
  cpf?: string | null;
  cnpj?: string | null;
  cpf_responsavel_pj?: string | null;
  // Dados bancários
  banco_codigo?: string | null;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null; // corrente, poupança
  titular_conta?: string | null;
  pix_chave?: string | null;
  pix_tipo?: string | null; // cpf, cnpj, email, telefone, aleatoria
  // Documentação (paths para storage)
  doc_identificacao_path?: string | null;
  comprovante_conta_path?: string | null;
  // Comissão: percentual individual definido pelo admin (NULL = não definido)
  percentual_comissao?: number | null;
  // Novo modelo de comissionamento
  modelo_comissionamento?: ModeloComissionamento | null;
  asaas_wallet_id?: string | null;
  // Status e controle
  status: StatusRepresentante;
  aceite_termos: boolean;
  aceite_termos_em?: string | null;
  aceite_disclaimer_nv: boolean;
  aceite_disclaimer_nv_em?: string | null;
  // Conflito PF/PJ
  bloqueio_conflito_pf_id?: number | null;
  // Auditoria
  criado_em: string;
  atualizado_em: string;
  aprovado_em?: string | null;
  aprovado_por_cpf?: string | null;
}

/** Representante com contagens agregadas (usado nas listagens do admin) */
export interface RepresentanteComResumo extends Representante {
  total_leads: number;
  leads_convertidos: number;
  total_vinculos: number;
  vinculos_ativos: number;
  total_comissoes: number;
  valor_total_pago: number;
}

/**
 * Lead / indicação — espelha public.leads_representante
 */
export interface LeadRepresentante {
  id: number;
  representante_id: number;
  cnpj: string;
  razao_social?: string | null;
  contato_nome?: string | null;
  contato_email?: string | null;
  contato_telefone?: string | null;
  // Controle de prazo (90 dias exatos)
  criado_em: string;
  data_expiracao: string;
  // Status
  status: StatusLead;
  tipo_conversao?: TipoConversaoLead | null;
  // Preenchido quando convertido
  entidade_id?: number | null;
  data_conversao?: string | null;
  // Token de link de convite (gerado on-demand)
  token_atual?: string | null;
  token_gerado_em?: string | null;
  token_expiracao?: string | null;
  // Auditoria
  atualizado_em: string;
}

/**
 * Vínculo de comissão — espelha public.vinculos_comissao
 */
export interface VinculoComissao {
  id: number;
  representante_id: number;
  entidade_id?: number | null;
  clinica_id?: number | null;
  lead_id?: number | null;
  // Período do vínculo (1 ano)
  data_inicio: string;
  data_expiracao: string;
  // Status
  status: StatusVinculo;
  // Controle de inatividade
  ultimo_laudo_em?: string | null;
  // Auditoria
  criado_em: string;
  atualizado_em: string;
  encerrado_em?: string | null;
  encerrado_motivo?: string | null;
}

/**
 * Comissão por laudo — espelha public.comissoes_laudo
 */
export interface ComissaoLaudo {
  id: number;
  vinculo_id: number;
  representante_id: number;
  entidade_id: number;
  laudo_id: number;
  // FK para o lote de avaliação que originou esta comissão
  lote_pagamento_id?: number | null;
  // Valores
  valor_laudo: number;
  percentual_comissao: number; // % individual do representante (copiado no momento da geração)
  valor_comissao: number; // valor_laudo × percentual_comissao / 100
  // Status
  status: StatusComissao;
  motivo_congelamento?: MotivoCongelamento | null;
  // Ciclo de pagamento
  mes_emissao: string; // primeiro dia do mês de emissão (DATE)
  mes_pagamento?: string | null; // primeiro dia do mês previsto de pagamento
  // Datas de transição
  data_emissao_laudo: string;
  data_aprovacao?: string | null;
  data_liberacao?: string | null;
  data_pagamento?: string | null;
  comprovante_pagamento_path?: string | null;
  // Auditoria
  criado_em: string;
  atualizado_em: string;
}

/**
 * Auditoria de transições — espelha public.comissionamento_auditoria
 */
export interface ComissionamentoAuditoria {
  id: number;
  tabela: string;
  registro_id: number;
  status_anterior?: string | null;
  status_novo: string;
  triggador: Triggador;
  motivo?: string | null;
  dados_extras?: Record<string, unknown> | null;
  criado_por_cpf?: string | null;
  criado_em: string;
}

// ---------------------------------------------------------------------------
// DTOs de entrada (API requests)
// ---------------------------------------------------------------------------

/** Body para auto-cadastro do representante (somente PJ) */
export interface CriarRepresentanteDTO {
  nome: string;
  email: string;
  tipo_pessoa: TipoPessoaRepresentante;
  telefone: string;
  // PJ
  cnpj?: string;
  cpf_responsavel_pj?: string;
  // Bancário
  banco_codigo?: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: string;
  titular_conta?: string;
  pix_chave?: string;
  pix_tipo?: string;
  // Termos
  aceite_termos: boolean;
  aceite_disclaimer_nv: boolean;
}

/** Body para criar/registrar um lead */
export interface CriarLeadDTO {
  cnpj: string;
  razao_social?: string;
  contato_nome?: string;
  contato_email?: string;
  contato_telefone?: string;
}

/** Body para admin alterar status do representante */
export interface AlterarStatusRepresentanteDTO {
  novo_status: StatusRepresentante;
  motivo?: string;
}

/** Body para admin executar ação em comissão */
export interface AcaoComissaoDTO {
  acao: 'liberar' | 'pagar' | 'congelar' | 'cancelar' | 'descongelar';
  motivo?: string;
  comprovante_path?: string;
}

/** Body para admin gerar comissão a partir de lote pago */
export interface GerarComissaoDTO {
  lote_pagamento_id: number;
  vinculo_id: number;
  representante_id: number;
  valor_laudo: number;
  laudo_id?: number | null;
  entidade_id?: number | null;
  clinica_id?: number | null;
}

// ---------------------------------------------------------------------------
// DTOs de resposta (API responses)
// ---------------------------------------------------------------------------

export interface LeadComRepresentante extends LeadRepresentante {
  representante_nome: string;
}

export interface VinculoComDetalhes extends VinculoComissao {
  entidade_nome: string;
  entidade_cnpj: string;
  total_comissoes: number;
  valor_total_pago: number;
  valor_pendente: number;
  dias_para_expirar: number;
}

export interface ComissaoComDetalhes extends ComissaoLaudo {
  representante_nome: string;
  representante_email: string;
  representante_tipo_pessoa: TipoPessoaRepresentante;
  entidade_nome: string;
  numero_laudo?: string | null;
}

/** Resumo financeiro do representante */
export interface ResumoComissoesRepresentante {
  pendentes: number;
  liberadas: number;
  pagas: number;
  valor_pendente: number;
  valor_liberado: number;
  valor_pago_total: number;
}

/** Resumo financeiro para o admin */
export interface ResumoComissoesAdmin {
  total_comissoes: number;
  pendentes_nf: number;
  em_analise: number;
  liberadas: number;
  pagas: number;
  congeladas: number;
  valor_a_pagar: number;
  valor_pago_total: number;
}

// ---------------------------------------------------------------------------
// Constantes de negócio
// ---------------------------------------------------------------------------

export const COMISSIONAMENTO_CONSTANTS = {
  /** Janela de validade do lead em dias */
  LEAD_EXPIRY_DAYS: 90,
  /** Duração do vínculo em meses */
  VINCULO_DURACAO_MESES: 12,
  /** Dias sem laudo para marcar vínculo como inativo */
  VINCULO_INATIVO_DIAS: 90,
  /** Dia do mês de pagamento (dia 15) */
  DIA_PAGAMENTO: 15,
} as const;

// ---------------------------------------------------------------------------
// Modelo de comissionamento
// ---------------------------------------------------------------------------

/** Modelo de comissionamento do representante */
export type ModeloComissionamento = 'percentual' | 'custo_fixo';
