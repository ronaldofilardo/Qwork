/**
 * lib/db/comissionamento/nf-rpa.ts
 *
 * Gestão de NF/RPA: envio pelo representante e aprovação/rejeição pelo admin.
 */

import { query } from '../query';
import type { Session } from '../../session';
import { registrarAuditoria } from './auditoria';
import { calcularMesPagamentoPorEnvioNf } from './utils';

/** Registra envio de NF pelo representante e recalcula mes_pagamento */
export async function registrarNfRep(
  comissaoId: number,
  representanteId: number,
  nfPath: string,
  nfNomeArquivo: string,
  cpf?: string
): Promise<{
  comissao: Record<string, unknown> | null;
  previsao: { mes_pagamento: string; data_prevista_pagamento: string } | null;
  erro?: string;
}> {
  // Verificar comissão pertence ao rep e está em status válido
  const comissaoResult = await query(
    `SELECT id, status, nf_rpa_enviada_em FROM comissoes_laudo WHERE id = $1 AND representante_id = $2 LIMIT 1`,
    [comissaoId, representanteId]
  );
  if (comissaoResult.rows.length === 0) {
    return { comissao: null, previsao: null, erro: 'Comissão não encontrada.' };
  }
  const comissao = comissaoResult.rows[0];

  // Status válidos para envio de NF
  const statusPermitidos = ['pendente_nf', 'congelada_aguardando_admin'];
  if (!statusPermitidos.includes(comissao.status)) {
    return {
      comissao: null,
      previsao: null,
      erro: `NF não pode ser enviada para comissão com status '${comissao.status}'.`,
    };
  }

  // Recalcular mes_pagamento pela regra das 18h do dia 5
  const agora = new Date();
  const previsao = calcularMesPagamentoPorEnvioNf(agora);

  // Se temos CPF do representante, passamos como sessão mínima para o wrapper
  // executar SET LOCAL app.current_user_cpf antes do UPDATE, satisfazendo o trigger de auditoria.
  const querySession = cpf
    ? ({ cpf, perfil: 'representante', nome: '' } as unknown as Session)
    : undefined;

  // Atualizar comissão
  const updated = await query(
    `UPDATE comissoes_laudo
     SET nf_path = $3,
         nf_nome_arquivo = $4,
         nf_rpa_enviada_em = NOW(),
         nf_rpa_rejeitada_em = NULL,
         nf_rpa_motivo_rejeicao = NULL,
         mes_pagamento = $5::date,
         status = 'nf_em_analise',
         motivo_congelamento = NULL,
         atualizado_em = NOW()
     WHERE id = $1 AND representante_id = $2
     RETURNING *`,
    [
      comissaoId,
      representanteId,
      nfPath,
      nfNomeArquivo,
      previsao.mes_pagamento,
    ],
    querySession
  );

  return { comissao: updated.rows[0] ?? null, previsao };
}

/** Admin aprova ou rejeita NF de uma comissão */
export async function processarNfAdmin(
  comissaoId: number,
  acao: 'aprovar' | 'rejeitar',
  motivo?: string,
  adminCpf?: string
): Promise<{ comissao: Record<string, unknown> | null; erro?: string }> {
  const comissaoResult = await query(
    `SELECT * FROM comissoes_laudo WHERE id = $1 LIMIT 1`,
    [comissaoId]
  );
  if (comissaoResult.rows.length === 0) {
    return { comissao: null, erro: 'Comissão não encontrada.' };
  }
  const comissao = comissaoResult.rows[0];

  if (!comissao.nf_rpa_enviada_em) {
    return {
      comissao: null,
      erro: 'Nenhuma NF/RPA foi enviada para esta comissão.',
    };
  }

  if (acao === 'aprovar') {
    if (comissao.status !== 'nf_em_analise') {
      return {
        comissao: null,
        erro: `Só é possível aprovar NF de comissão com status 'nf_em_analise'. Status atual: '${comissao.status}'.`,
      };
    }

    const updated = await query(
      `UPDATE comissoes_laudo
       SET status = 'liberada',
           nf_rpa_aprovada_em = NOW(),
           data_liberacao = NOW(),
           atualizado_em = NOW()
       WHERE id = $1 RETURNING *`,
      [comissaoId]
    );

    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissaoId,
      status_anterior: comissao.status,
      status_novo: 'liberada',
      triggador: 'admin_action',
      motivo: 'NF/RPA aprovada pelo admin',
      criado_por_cpf: adminCpf ?? null,
    });

    return { comissao: updated.rows[0] ?? null };
  }

  // Rejeitar — exige status nf_em_analise (F-03)
  if (comissao.status !== 'nf_em_analise') {
    return {
      comissao: null,
      erro: `Só é possível rejeitar NF de comissão com status 'nf_em_analise'. Status atual: '${comissao.status}'.`,
    };
  }

  if (!motivo?.trim()) {
    return {
      comissao: null,
      erro: 'Motivo é obrigatório para rejeição de NF.',
    };
  }

  const updated = await query(
    `UPDATE comissoes_laudo
     SET status = 'pendente_nf',
         motivo_congelamento = NULL,
         nf_rpa_rejeitada_em = NOW(),
         nf_rpa_motivo_rejeicao = $2,
         nf_rpa_aprovada_em = NULL,
         atualizado_em = NOW()
     WHERE id = $1 RETURNING *`,
    [comissaoId, motivo.trim()]
  );

  await registrarAuditoria({
    tabela: 'comissoes_laudo',
    registro_id: comissaoId,
    status_anterior: comissao.status,
    status_novo: 'pendente_nf',
    triggador: 'admin_action',
    motivo: `NF/RPA rejeitada: ${motivo.trim()}`,
    criado_por_cpf: adminCpf ?? null,
  });

  return { comissao: updated.rows[0] ?? null };
}
