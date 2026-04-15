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
 * apto_pendente   → NF/RPA entregue, aguardando validação do admin
 * apto            → validado: comissões em status "pendente_nf" fluem normalmente
 * apto_bloqueado  → PJ cadastrada com CPF de PF existente, aguarda resolução
 * suspenso        → investigação administrativa (comissões congeladas)
 * desativado      → encerramento permanente
 * rejeitado       → cadastro recusado na triagem inicial
 */
export type StatusRepresentante =
  | 'ativo'
  | 'apto_pendente'
  | 'apto'
  | 'apto_bloqueado'
  | 'suspenso'
  | 'desativado'
  | 'rejeitado'
  | 'aguardando_senha'
  | 'expirado'
  | 'aprovacao_comercial';

/** Pessoa Física ou Jurídica */
export type TipoPessoaRepresentante = 'pf' | 'pj';

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
 * retida                     → rep não é "apto" ainda; guardada até aprovação
 * pendente_consolidacao      → novo fluxo: parcela paga, aguardando fechamento do ciclo mensal
 * pendente_nf                → legado: rep é apto; aguardando envio de NF individual
 * nf_em_analise              → legado: NF/RPA enviada; aguardando validação do admin
 * congelada_rep_suspenso     → rep suspenso; aguarda resolução
 * congelada_aguardando_admin → pendência administrativa genérica
 * liberada                   → NF do ciclo aprovada; pronta para pagamento
 * paga                       → pagamento confirmado pelo admin
 * cancelada                  → cancelada (vínculo encerrado ou admin cancelou)
 */
export type StatusComissao =
  | 'retida'
  | 'pendente_consolidacao'
  | 'pendente_nf'
  | 'nf_em_analise'
  | 'congelada_rep_suspenso'
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
  | 'nf_rpa_rejeitada'
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
  // PF: CPF obrigatório; PJ: CNPJ + cpf_responsavel_pj obrigatórios
  cpf?: string | null;
  cnpj?: string | null;
  cpf_responsavel_pj?: string | null;
  // Código público único de rastreamento (ex: K7X2Q9P3)
  codigo: string;
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
  // NF/RPA
  nf_rpa_enviada_em?: string | null;
  nf_rpa_aprovada_em?: string | null;
  nf_rpa_rejeitada_em?: string | null;
  nf_rpa_motivo_rejeicao?: string | null;
  nf_path?: string | null; // caminho relativo do arquivo NF/RPA no storage
  nf_nome_arquivo?: string | null; // nome original do arquivo enviado
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

/** Body para auto-cadastro do representante */
export interface CriarRepresentanteDTO {
  nome: string;
  email: string;
  tipo_pessoa: TipoPessoaRepresentante;
  telefone: string;
  // PF
  cpf?: string;
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

/** Body para admin aprovar/rejeitar NF */
export interface AcaoNfDTO {
  acao: 'aprovar' | 'rejeitar';
  motivo?: string;
}

// ---------------------------------------------------------------------------
// DTOs de resposta (API responses)
// ---------------------------------------------------------------------------

export interface LeadComRepresentante extends LeadRepresentante {
  representante_nome: string;
  representante_codigo: string;
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
  representante_codigo: string;
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
  /** Dia do mês de corte para NF/RPA (até 18h) */
  DIA_CORTE_NF: 5,
  /** Hora limite para envio de NF no dia de corte */
  HORA_CORTE_NF: 18,
  /** Dia do mês de pagamento (dia 15) */
  DIA_PAGAMENTO: 15,
  /** Tamanho máximo do arquivo NF/RPA em bytes (2 MB) */
  NF_MAX_SIZE_BYTES: 2 * 1024 * 1024,
  /** Tipos MIME aceitos para upload de NF/RPA */
  NF_TIPOS_ACEITOS: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ] as readonly string[],
  /** Extensões aceitas para NF/RPA */
  NF_EXTENSOES_ACEITAS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.pdf',
  ] as readonly string[],
} as const;

// ---------------------------------------------------------------------------
// Novo modelo de comissionamento (migration 600)
// ---------------------------------------------------------------------------

/** Modelo de comissionamento do representante */
export type ModeloComissionamento = 'percentual' | 'custo_fixo';

/** Status do ciclo mensal de comissão */
export type StatusCicloComissao =
  | 'aberto'
  | 'aguardando_nf_rpa'
  | 'nf_rpa_enviada'
  | 'validado'
  | 'vencido';

/** Status do repasse (split Asaas) */
export type StatusRepasseSplit = 'pendente' | 'confirmado' | 'estornado';

/**
 * Ciclo mensal de comissão — espelha public.ciclos_comissao_mensal
 */
export interface CicloComissaoMensal {
  id: number;
  representante_id: number;
  /** Formato: YYYY-MM (ex: "2025-07") */
  mes_ano: string;
  valor_total_recebido: number;
  status: StatusCicloComissao;
  nf_rpa_path?: string | null;
  nf_rpa_nome_arquivo?: string | null;
  data_envio_nf_rpa?: string | null;
  data_validacao_suporte?: string | null;
  validado_por_cpf?: string | null;
  data_bloqueio?: string | null;
  criado_em: string;
  atualizado_em: string;
}

/**
 * Repasse split Asaas — espelha public.repasses_split
 */
export interface RepasseSplit {
  id: number;
  representante_id: number;
  ciclo_id: number;
  vinculo_id?: number | null;
  laudo_id?: number | null;
  asaas_payment_id?: string | null;
  valor_total_laudo: number;
  valor_qwork: number;
  valor_representante: number;
  modelo_utilizado: ModeloComissionamento;
  percentual_aplicado?: number | null;
  status: StatusRepasseSplit;
  data_criacao: string;
  data_confirmacao?: string | null;
  data_estorno?: string | null;
}
