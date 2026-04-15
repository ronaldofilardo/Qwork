/**
 * lib/db/comissionamento/auditoria.ts
 *
 * Auditoria de transições de status e efeitos colaterais
 * de mudanças de status do representante.
 */

import { query } from '../query';
import type { Triggador } from '../../types/comissionamento';

/** Registra transição de status na tabela de auditoria */
export async function registrarAuditoria(data: {
  tabela: string;
  registro_id: number;
  status_anterior?: string | null;
  status_novo: string;
  triggador: Triggador;
  motivo?: string | null;
  dados_extras?: Record<string, unknown> | null;
  criado_por_cpf?: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO comissionamento_auditoria
       (tabela, registro_id, status_anterior, status_novo, triggador, motivo, dados_extras, criado_por_cpf)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.tabela,
      data.registro_id,
      data.status_anterior ?? null,
      data.status_novo,
      data.triggador,
      data.motivo ?? null,
      data.dados_extras ? JSON.stringify(data.dados_extras) : null,
      data.criado_por_cpf ?? null,
    ]
  );
}

// ---------------------------------------------------------------------------
// Efeitos colaterais de mudança de status do representante
// ---------------------------------------------------------------------------

/** Congelar comissões quando representante é suspenso */
export async function congelarComissoesRepSuspenso(representanteId: number) {
  return query(
    `UPDATE comissoes_laudo
     SET status = 'congelada_rep_suspenso', motivo_congelamento = 'rep_suspenso', atualizado_em = NOW()
     WHERE representante_id = $1 AND status::text IN ('retida', 'pendente_consolidacao', 'liberada')
     RETURNING id`,
    [representanteId]
  );
}

/** Suspender vínculos ativos quando representante é suspenso */
export async function suspenderVinculosRep(representanteId: number) {
  return query(
    `UPDATE vinculos_comissao SET status = 'suspenso', atualizado_em = NOW()
     WHERE representante_id = $1 AND status = 'ativo'
     RETURNING id`,
    [representanteId]
  );
}

/** Restaurar vínculos ao reverter suspensão */
export async function restaurarVinculosRep(representanteId: number) {
  return query(
    `UPDATE vinculos_comissao SET status = 'ativo', atualizado_em = NOW()
     WHERE representante_id = $1 AND status = 'suspenso'
     RETURNING id`,
    [representanteId]
  );
}

/** Liberar comissões retidas quando rep se torna apto (somente vínculos ativos/inativos).
 *  Só libera parcelas cuja parcela_confirmada_em IS NOT NULL (parcela efetivamente paga).
 *  Comissões provisionadas de parcelas futuras (parcela_confirmada_em IS NULL) aguardam
 *  o webhook da respectiva parcela para serem ativadas automaticamente.
 */
export async function liberarComissoesRetidas(representanteId: number) {
  return query(
    `UPDATE comissoes_laudo
     SET status = 'pendente_consolidacao', data_aprovacao = NOW(), atualizado_em = NOW()
     WHERE representante_id = $1
       AND status = 'retida'
       AND parcela_confirmada_em IS NOT NULL
       AND vinculo_id IN (
         SELECT id FROM vinculos_comissao
         WHERE representante_id = $1 AND status IN ('ativo','inativo')
       )
     RETURNING id`,
    [representanteId]
  );
}

/** Encerrar vínculos e cancelar comissões quando rep é desativado */
export async function encerrarTudoRep(representanteId: number) {
  await query(
    `UPDATE vinculos_comissao
     SET status = 'encerrado', encerrado_em = NOW(), encerrado_motivo = 'Representante desativado', atualizado_em = NOW()
     WHERE representante_id = $1 AND status IN ('ativo','inativo','suspenso')`,
    [representanteId]
  );
  await query(
    `UPDATE comissoes_laudo
     SET status = 'cancelada', atualizado_em = NOW()
     WHERE representante_id = $1 AND status::text IN ('retida','pendente_consolidacao','liberada','congelada_rep_suspenso','congelada_aguardando_admin')`,
    [representanteId]
  );
}
