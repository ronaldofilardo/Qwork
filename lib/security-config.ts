import { securityValidationMiddleware } from '@/lib/security-middleware'
import { runSecurityIntegrityCheck } from '../scripts/security-integrity-check.mjs'

/**
 * CONFIGURAÇÃO DE VALIDAÇÕES DE SEGURANÇA ADICIONAIS
 * ===================================================
 *
 * Este arquivo centraliza todas as validações de segurança
 * que devem ser aplicadas para prevenir inconsistências
 * em RBAC e RLS.
 */

export const SECURITY_CONFIG = {
  // Middleware a ser aplicado globalmente
  middleware: {
    securityValidation: securityValidationMiddleware,
    // Ordem de execução: securityValidation deve vir antes de outras validações
  },

  // Validações automáticas em operações críticas
  validations: {
    // Executar ao fazer login
    onLogin: [
      'validateSessionIntegrity',
      'validateResourceAccess',
      'detectAccessAnomalies'
    ],

    // Executar antes de operações de escrita
    onWriteOperations: [
      'validateUserPermissions',
      'validateDataConsistency',
      'checkBusinessRules'
    ],

    // Executar em operações sensíveis
    onSensitiveOperations: [
      'validateClinicaAssociation',
      'validateEmpresaAccess',
      'auditCriticalChanges'
    ]
  },

  // Verificações periódicas (recomendado: executar diariamente)
  scheduledChecks: {
    securityIntegrityCheck: {
      function: runSecurityIntegrityCheck,
      schedule: '0 2 * * *', // Todos os dias às 2:00 AM
      enabled: true
    }
  },

  // Configurações de resposta a incidentes
  incidentResponse: {
    // Ações automáticas para diferentes severidades
    actions: {
      low: ['log'],
      medium: ['log', 'alert'],
      high: ['log', 'alert', 'notify_admin'],
      critical: ['log', 'alert', 'notify_admin', 'block_access']
    },

    // Destinatários de alertas
    notifications: {
      adminEmails: ['admin@qwork.com.br'],
      securityTeam: ['security@qwork.com.br']
    }
  },

  // Configurações de auditoria
  audit: {
    // Tabelas que devem ter auditoria completa
    auditedTables: [
      'funcionarios',
      'empresas_clientes',
      'clinicas',
      'lotes_avaliacao',
      'avaliacoes'
    ],

    // Eventos que devem ser auditados
    auditedEvents: [
      'LOGIN',
      'LOGOUT',
      'PERMISSION_CHANGE',
      'CLINICA_ASSOCIATION_CHANGE',
      'DATA_ACCESS_VIOLATION',
      'SECURITY_INCIDENT'
    ],

    // Retenção de logs (dias)
    retentionDays: 365
  }
}

/**
 * FUNÇÕES DE VALIDAÇÃO RÁPIDA
 * ===========================
 */

/**
 * Validação rápida de sessão (para uso em APIs)
 */
export async function quickSessionValidation(session: unknown): Promise<boolean> {
  if (!(session as any)?.cpf) return false

  try {
    const { validateSessionIntegrity } = await import('@/lib/security-validation')
    const result = await validateSessionIntegrity(session as any)
    return result.isValid
  } catch {
    return false
  }
}

/**
 * Validação de acesso a recurso (para uso em APIs)
 */
export async function validateResourceAccess(
  session: unknown,
  resourceType: 'empresa' | 'clinica' | 'funcionario',
  resourceId: number
): Promise<boolean> {
  try {
    const { validateResourceAccess: validateResourceAccessFn } = await import('@/lib/security-validation')
    const result = await validateResourceAccessFn(session as any, resourceType, resourceId)
    return result.hasAccess
  } catch {
    return false
  }
}

/**
 * Wrapper para verificação de integridade (para uso programático)
 */
export async function checkSystemIntegrity(): Promise<unknown> {
  return await runSecurityIntegrityCheck()
}