/**
 * Módulo centralizado para ativação de contratantes
 *
 * Garante que NENHUM contratante seja ativado sem pagamento confirmado
 * Todos os setters de `ativa = true` devem passar por esta função
 */

import { query, criarContaResponsavel } from './db';
import { logAudit } from './audit';

export interface AtivarContratanteParams {
  contratante_id: number;
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

export interface AtivarContratanteResult {
  success: boolean;
  contratante_id: number;
  message: string;
  warning?: string;
}

/**
 * Ativa um contratante de forma segura e auditada
 *
 * Regras de negócio:
 * 1. Só ativa se pagamento_confirmado = true (ou isenção manual)
 * 2. Só ativa se status permitir (não pode ativar 'cancelado')
 * 3. Registra em audit_logs obrigatoriamente
 * 4. Valida transição de estado
 *
 * @throws Error se validações falharem ou se banco rejeitar
 */
export async function ativarContratante(
  params: AtivarContratanteParams
): Promise<AtivarContratanteResult> {
  const { contratante_id, motivo, admin_cpf, isencao_manual = false } = params;

  if (!contratante_id) {
    throw new Error('contratante_id é obrigatório');
  }

  if (!motivo || motivo.trim().length < 10) {
    throw new Error('motivo deve ter pelo menos 10 caracteres');
  }

  if (isencao_manual && !admin_cpf) {
    throw new Error('isenção manual requer admin_cpf obrigatoriamente');
  }

  await query('BEGIN');

  try {
    // Buscar estado atual do contratante
    const contratanteResult = await query(
      `SELECT id, nome, ativa, pagamento_confirmado, status 
       FROM contratantes 
       WHERE id = $1`,
      [contratante_id]
    );

    if (contratanteResult.rows.length === 0) {
      throw new Error(`Contratante ${contratante_id} não encontrado`);
    }

    const contratante = contratanteResult.rows[0];

    // Validar estado atual
    if (contratante.ativa) {
      await query('ROLLBACK');
      return {
        success: false,
        contratante_id,
        message: 'Contratante já está ativo',
      };
    }

    if (contratante.status === 'cancelado') {
      throw new Error('Não é possível ativar contratante cancelado');
    }

    // Validar pagamento confirmado (ou isenção manual)
    if (!contratante.pagamento_confirmado && !isencao_manual) {
      throw new Error(
        'Não é possível ativar contratante sem pagamento confirmado. Use isencao_manual apenas em casos excepcionais.'
      );
    }

    // Atualizar para ativo
    await query(
      `UPDATE contratantes 
       SET ativa = true,
           status = 'aprovado',
           data_liberacao_login = COALESCE(data_liberacao_login, NOW()),
           aprovado_em = COALESCE(aprovado_em, NOW())
       WHERE id = $1`,
      [contratante_id]
    );

    // Se for clínica, criar registro na tabela clinicas
    // CRÍTICO: Necessário para que RH possa criar empresas/funcionários
    const contratanteTipo = await query(
      `SELECT tipo, nome, cnpj, email, telefone, endereco, cidade, estado 
       FROM contratantes 
       WHERE id = $1`,
      [contratante_id]
    );

    if (
      contratanteTipo.rows.length > 0 &&
      contratanteTipo.rows[0].tipo === 'clinica'
    ) {
      const contData = contratanteTipo.rows[0];
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, contratante_id, ativa)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (cnpj)
         DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, telefone = EXCLUDED.telefone, endereco = EXCLUDED.endereco, contratante_id = EXCLUDED.contratante_id, ativa = true, atualizado_em = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          contData.nome,
          contData.cnpj,
          contData.email,
          contData.telefone,
          contData.endereco,
          contratante_id,
        ]
      );

      if (clinicaResult.rows.length > 0) {
        console.log(
          `[ATIVAR_CONTRATANTE] Clínica criada/atualizada com ID: ${clinicaResult.rows[0].id} para contratante ${contratante_id}`
        );
      }
    }

    // Registrar auditoria OBRIGATÓRIA
    await logAudit(
      {
        resource: 'contratantes',
        action: 'ACTIVATE',
        resourceId: contratante_id,
        oldData: {
          ativa: false,
          status: contratante.status,
        },
        newData: {
          ativa: true,
          status: 'aprovado',
        },
        details: JSON.stringify({
          motivo,
          isencao_manual,
          pagamento_confirmado: contratante.pagamento_confirmado,
          ativado_por: admin_cpf || 'sistema_automatico',
          timestamp: new Date().toISOString(),
        }),
      },
      { cpf: admin_cpf, perfil: 'admin' }
    );

    await query('COMMIT');

    // Criar conta responsável APÓS ativação bem-sucedida
    const result: AtivarContratanteResult = {
      success: true,
      contratante_id,
      message: `Contratante ${contratante.nome} ativado com sucesso`,
    };

    try {
      await criarContaResponsavel(contratante_id);
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
          event: 'contratante_ativado_isencao_manual',
          contratante_id,
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
 * Desativa um contratante de forma segura
 * Útil para suspensão de serviço ou cancelamento
 */
export async function desativarContratante(
  contratante_id: number,
  motivo: string,
  admin_cpf: string
): Promise<AtivarContratanteResult> {
  if (!contratante_id || !motivo || !admin_cpf) {
    throw new Error('Todos os parâmetros são obrigatórios');
  }

  await query('BEGIN');

  try {
    const contratanteResult = await query(
      `SELECT id, nome, ativa, status FROM contratantes WHERE id = $1`,
      [contratante_id]
    );

    if (contratanteResult.rows.length === 0) {
      throw new Error(`Contratante ${contratante_id} não encontrado`);
    }

    const contratante = contratanteResult.rows[0];

    if (!contratante.ativa) {
      await query('ROLLBACK');
      return {
        success: false,
        contratante_id,
        message: 'Contratante já está inativo',
      };
    }

    await query(
      `UPDATE contratantes 
       SET ativa = false,
           status = 'suspenso'
       WHERE id = $1`,
      [contratante_id]
    );

    await logAudit(
      {
        resource: 'contratantes',
        action: 'DEACTIVATE',
        resourceId: contratante_id,
        oldData: {
          ativa: true,
          status: contratante.status,
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
      contratante_id,
      message: `Contratante ${contratante.nome} desativado com sucesso`,
    };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}
