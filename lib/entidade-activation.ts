/**
 * Módulo centralizado para ativação de entidades
 *
 * Garante que NENHUMA entidade seja ativada sem pagamento confirmado
 * Todos os setters de `ativa = true` devem passar por esta função
 * (Anteriormente contratante-activation - renomeado na Migration 420)
 */

import { query, criarContaResponsavel } from './db';
import { logAudit } from './audit';

export interface AtivarEntidadeParams {
  entidade_id: number;
  motivo: string;
  /**
   * CPF do admin que está fazendo a ativação manual (caso excepcional)
   * Se undefined, considera ativação automática pelo sistema
   */
  admin_cpf?: string;
  /**
   * Flag de isenção manual - só deve ser true em casos excepcionais auditados
   * Requer admin_cpf obrigatoriamente
   */
  isencao_manual?: boolean;
}

export interface AtivarEntidadeResult {
  success: boolean;
  entidade_id: number;
  message: string;
  warning?: string;
}

/**
 * Ativa uma entidade de forma segura e auditada
 *
 * Regras de negócio:
 * 1. Só ativa se pagamento_confirmado = true (ou isenção manual)
 * 2. Só ativa se status permitir (não pode ativar 'cancelado')
 * 3. Registra em audit_logs obrigatoriamente
 * 4. Valida transição de estado
 *
 * @throws Error se validações falharem ou se banco rejeitar
 */
export async function ativarEntidade(
  params: AtivarEntidadeParams
): Promise<AtivarEntidadeResult> {
  const { entidade_id, motivo, admin_cpf, isencao_manual = false } = params;

  if (!entidade_id) {
    throw new Error('entidade_id é obrigatório');
  }

  if (!motivo || motivo.trim().length < 10) {
    throw new Error('motivo deve ter pelo menos 10 caracteres');
  }

  if (isencao_manual && !admin_cpf) {
    throw new Error('isenção manual requer admin_cpf obrigatoriamente');
  }

  await query('BEGIN');

  try {
    // Buscar estado atual da entidade
    const entidadeResult = await query(
      `SELECT id, nome, ativa, pagamento_confirmado, status 
       FROM entidades 
       WHERE id = $1`,
      [entidade_id]
    );

    if (entidadeResult.rows.length === 0) {
      throw new Error(`Entidade ${entidade_id} não encontrada`);
    }

    const entidade = entidadeResult.rows[0];

    // Validar estado atual
    if (entidade.ativa) {
      await query('ROLLBACK');
      return {
        success: false,
        entidade_id,
        message: 'Entidade já está ativa',
      };
    }

    if (entidade.status === 'cancelado') {
      throw new Error('Não é possível ativar entidade cancelada');
    }

    // Validar pagamento confirmado (ou isenção manual)
    if (!entidade.pagamento_confirmado && !isencao_manual) {
      throw new Error(
        'Não é possível ativar entidade sem pagamento confirmado. Use isencao_manual apenas em casos excepcionais.'
      );
    }

    // Atualizar para ativo
    await query(
      `UPDATE entidades 
       SET ativa = true,
           status = 'aprovado',
           data_liberacao_login = COALESCE(data_liberacao_login, NOW()),
           aprovado_em = COALESCE(aprovado_em, NOW())
       WHERE id = $1`,
      [entidade_id]
    );

    // Se for clínica, criar registro na tabela clinicas
    // CRÍTICO: Necessário para que RH possa criar empresas/funcionários
    const entidadeTipo = await query(
      `SELECT tipo, nome, cnpj, email, telefone, endereco, cidade, estado 
       FROM entidades 
       WHERE id = $1`,
      [entidade_id]
    );

    if (
      entidadeTipo.rows.length > 0 &&
      entidadeTipo.rows[0].tipo === 'clinica'
    ) {
      const contData = entidadeTipo.rows[0];
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, entidade_id, ativa)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (cnpj)
         DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, telefone = EXCLUDED.telefone, endereco = EXCLUDED.endereco, entidade_id = EXCLUDED.entidade_id, ativa = true, atualizado_em = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          contData.nome,
          contData.cnpj,
          contData.email,
          contData.telefone,
          contData.endereco,
          entidade_id,
        ]
      );

      if (clinicaResult.rows.length > 0) {
        console.log(
          `[ATIVAR_ENTIDADE] Clínica criada/atualizada com ID: ${clinicaResult.rows[0].id} para entidade ${entidade_id}`
        );
      }
    }

    // Registrar auditoria OBRIGATÓRIA
    await logAudit(
      {
        resource: 'entidades',
        action: 'ACTIVATE',
        resourceId: entidade_id,
        oldData: {
          ativa: false,
          status: entidade.status,
        },
        newData: {
          ativa: true,
          status: 'aprovado',
        },
        details: JSON.stringify({
          motivo,
          isencao_manual,
          pagamento_confirmado: entidade.pagamento_confirmado,
          ativado_por: admin_cpf || 'sistema_automatico',
          timestamp: new Date().toISOString(),
        }),
      },
      { cpf: admin_cpf, perfil: 'admin' }
    );

    await query('COMMIT');

    // Criar conta responsável APÓS ativação bem-sucedida
    const result: AtivarEntidadeResult = {
      success: true,
      entidade_id,
      message: `Entidade ${entidade.nome} ativada com sucesso`,
    };

    try {
      await criarContaResponsavel(entidade_id);
    } catch (accountError) {
      console.error('Erro ao criar conta responsável:', accountError);
      // Não falha a ativação por erro na criação da conta
      // A conta pode ser criada manualmente pelo admin
      result.warning =
        (result.warning || '') +
        ' Conta responsável não foi criada automaticamente. Criar manualmente.';
    }

    if (isencao_manual) {
      result.warning =
        'ATENÇÃO: Ativação manual sem pagamento confirmado. Ação auditada.';
      console.warn(
        JSON.stringify({
          event: 'entidade_ativada_isencao_manual',
          entidade_id,
          admin_cpf,
          motivo,
          timestamp: new Date().toISOString(),
        })
      );
    }

    return result;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Desativa uma entidade de forma segura
 * Útil para suspensão de serviço ou cancelamento
 */
export async function desativarEntidade(
  entidade_id: number,
  motivo: string,
  admin_cpf: string
): Promise<AtivarEntidadeResult> {
  if (!entidade_id || !motivo || !admin_cpf) {
    throw new Error('Todos os parâmetros são obrigatórios');
  }

  await query('BEGIN');

  try {
    const entidadeResult = await query(
      `SELECT id, nome, ativa, status FROM entidades WHERE id = $1`,
      [entidade_id]
    );

    if (entidadeResult.rows.length === 0) {
      throw new Error(`Entidade ${entidade_id} não encontrada`);
    }

    const entidade = entidadeResult.rows[0];

    if (!entidade.ativa) {
      await query('ROLLBACK');
      return {
        success: false,
        entidade_id,
        message: 'Entidade já está inativa',
      };
    }

    await query(
      `UPDATE entidades 
       SET ativa = false,
           status = 'suspenso'
       WHERE id = $1`,
      [entidade_id]
    );

    await logAudit(
      {
        resource: 'entidades',
        action: 'DEACTIVATE',
        resourceId: entidade_id,
        oldData: {
          ativa: true,
          status: entidade.status,
        },
        newData: {
          ativa: false,
          status: 'suspenso',
        },
        details: JSON.stringify({
          motivo,
          desativado_por: admin_cpf,
          timestamp: new Date().toISOString(),
          severity: 'medium',
        }),
      },
      { cpf: admin_cpf, perfil: 'admin' }
    );

    await query('COMMIT');

    return {
      success: true,
      entidade_id,
      message: `Entidade ${entidade.nome} desativada com sucesso`,
    };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

// === RETROCOMPATIBILIDADE - DEPRECATED ===
// Aliases para garantir que código antigo continue funcionando
// Remover após verificar que não há mais uso no código
/** @deprecated Use ativarEntidade instead */
export const ativarContratante = ativarEntidade;
/** @deprecated Use desativarEntidade instead */
export const desativarContratante = desativarEntidade;
