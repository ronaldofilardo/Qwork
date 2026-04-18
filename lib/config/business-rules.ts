/**
 * Constantes de regras de negócio — Single Source of Truth
 *
 * IMPORTANTE: Qualquer alteração aqui afeta backend E frontend.
 * A trigger no banco (Migration 1130) também usa este valor.
 */

/** Percentual mínimo de conclusão de avaliações para solicitar emissão de laudo */
export const PERCENTUAL_MINIMO_EMISSAO = 70;

/** Prazo de expiração de leads (dias) */
export const PRAZO_EXPIRACAO_LEAD_DIAS = 90;

/** Vigência padrão de vínculos de comissão (dias) */
export const VIGENCIA_VINCULO_COMISSAO_DIAS = 365;

/** Máximo de parcelas permitidas */
export const MAX_PARCELAS = 12;
