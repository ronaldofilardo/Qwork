/**
 * NotificationService
 * Gerencia criação, leitura e arquivamento de notificações
 */

import { query } from '@/lib/db';

export type TipoNotificacao =
  | 'pre_cadastro_criado'
  | 'valor_definido'
  | 'pagamento_confirmado'
  | 'contratacao_ativa'
  | 'rejeicao_admin'
  | 'cancelamento_gestor'
  | 'sla_excedido'
  | 'alerta_geral';

export type PrioridadeNotificacao = 'baixa' | 'media' | 'alta' | 'critica';

export type DestinatarioTipo = 'admin' | 'gestor' | 'funcionario';

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  prioridade: PrioridadeNotificacao;
  destinatario_cpf: string;
  destinatario_tipo: DestinatarioTipo;
  titulo: string;
  mensagem: string;
  dados_contexto?: Record<string, any>;
  link_acao?: string;
  botao_texto?: string;
  lida: boolean;
  data_leitura?: Date;
  arquivada: boolean;
  contratacao_personalizada_id?: number;
  criado_em: Date;
  expira_em?: Date;
  // Campos da view
  contratacao_status?: string;
  tomador_nome?: string;
  expirada?: boolean;
}

export interface CriarNotificacaoDTO {
  tipo: TipoNotificacao;
  prioridade?: PrioridadeNotificacao;
  destinatario_cpf: string;
  destinatario_tipo: DestinatarioTipo;
  titulo: string;
  mensagem: string;
  dados_contexto?: Record<string, any>;
  link_acao?: string;
  botao_texto?: string;
  contratacao_personalizada_id?: number;
  expira_em?: Date;
}

export interface ContagemNotificacoes {
  destinatario_cpf: string;
  destinatario_tipo: DestinatarioTipo;
  total_nao_lidas: number;
  criticas: number;
  altas: number;
  ultima_notificacao?: Date;
}

export class NotificationService {
  /**
   * Criar notificação manual (além das automáticas via triggers)
   */
  static async criar(dto: CriarNotificacaoDTO): Promise<Notificacao> {
    const resultado = await query(
      `INSERT INTO notificacoes (
        tipo, prioridade, destinatario_cpf, destinatario_tipo,
        titulo, mensagem, dados_contexto, link_acao, botao_texto,
        contratacao_personalizada_id, expira_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        dto.tipo,
        dto.prioridade || 'media',
        dto.destinatario_cpf,
        dto.destinatario_tipo,
        dto.titulo,
        dto.mensagem,
        dto.dados_contexto ? JSON.stringify(dto.dados_contexto) : null,
        dto.link_acao || null,
        dto.botao_texto || null,
        dto.contratacao_personalizada_id || null,
        dto.expira_em || null,
      ]
    );

    return resultado.rows[0];
  }

  /**
   * Listar notificações de um usuário (com filtros)
   */
  static async listar(
    destinatarioCpf: string,
    destinatarioTipo: DestinatarioTipo,
    opcoes?: {
      apenasnaoLidas?: boolean;
      limite?: number;
      offset?: number;
    }
  ): Promise<Notificacao[]> {
    const { apenasnaoLidas = false, limite = 50, offset = 0 } = opcoes || {};

    const resultado = await query(
      `SELECT * FROM vw_notificacoes_dashboard
       WHERE destinatario_cpf = $1 
         AND destinatario_tipo = $2
         AND tipo != $3
         ${apenasnaoLidas ? 'AND lida = FALSE' : ''}
       ORDER BY 
         CASE prioridade
           WHEN 'critica' THEN 1
           WHEN 'alta' THEN 2
           WHEN 'media' THEN 3
           WHEN 'baixa' THEN 4
         END,
         criado_em DESC
       LIMIT $4 OFFSET $5`,
      [destinatarioCpf, destinatarioTipo, 'parcela_pendente', limite, offset]
    );

    return resultado.rows;
  }

  /**
   * Buscar notificação por ID
   */
  static async buscarPorId(
    notificacaoId: number,
    destinatarioCpf: string
  ): Promise<Notificacao | null> {
    const resultado = await query(
      'SELECT * FROM notificacoes WHERE id = $1 AND destinatario_cpf = $2',
      [notificacaoId, destinatarioCpf]
    );

    return resultado.rows[0] || null;
  }

  /**
   * Marcar notificação(ões) como lida(s)
   */
  static async marcarComoLida(
    notificacaoIds: number[],
    destinatarioCpf: string
  ): Promise<number> {
    const resultado = await query(
      'SELECT marcar_notificacoes_lidas($1::INTEGER[], $2::TEXT)',
      [notificacaoIds, destinatarioCpf]
    );

    return resultado.rows[0].marcar_notificacoes_lidas;
  }

  /**
   * Marcar todas como lidas
   */
  static async marcarTodasComoLidas(
    destinatarioCpf: string,
    destinatarioTipo: DestinatarioTipo
  ): Promise<number> {
    const resultado = await query(
      `UPDATE notificacoes
       SET lida = TRUE, data_leitura = NOW()
       WHERE destinatario_cpf = $1 
         AND destinatario_tipo = $2
         AND lida = FALSE
       RETURNING id`,
      [destinatarioCpf, destinatarioTipo]
    );

    return resultado.rowCount || 0;
  }

  /**
   * Arquivar notificação
   */
  static async arquivar(
    notificacaoId: number,
    destinatarioCpf: string
  ): Promise<boolean> {
    const resultado = await query(
      `UPDATE notificacoes
       SET arquivada = TRUE
       WHERE id = $1 AND destinatario_cpf = $2
       RETURNING id`,
      [notificacaoId, destinatarioCpf]
    );

    return (resultado.rowCount || 0) > 0;
  }

  /**
   * Obter contagem de não lidas
   */
  static async contarNaoLidas(
    destinatarioCpf: string,
    destinatarioTipo: DestinatarioTipo
  ): Promise<ContagemNotificacoes | null> {
    const resultado = await query(
      `SELECT * FROM vw_notificacoes_nao_lidas
       WHERE destinatario_cpf = $1 AND destinatario_tipo = $2`,
      [destinatarioCpf, destinatarioTipo]
    );

    return resultado.rows[0] || null;
  }

  /**
   * Deletar notificações expiradas (job de limpeza)
   */
  static async limparExpiradas(): Promise<number> {
    const resultado = await query(
      `DELETE FROM notificacoes
       WHERE expira_em IS NOT NULL 
         AND expira_em < NOW()
       RETURNING id`
    );

    return resultado.rowCount || 0;
  }

  /**
   * Arquivar notificações antigas automaticamente
   */
  static async arquivarAntigas(): Promise<number> {
    const resultado = await query('SELECT arquivar_notificacoes_antigas()');
    return resultado.rows[0].arquivar_notificacoes_antigas;
  }

  /**
   * Criar notificação de broadcast para todos admins
   */
  static async notificarTodosAdmins(
    dto: Omit<CriarNotificacaoDTO, 'destinatario_cpf' | 'destinatario_tipo'>
  ): Promise<number> {
    const resultado = await query(
      `INSERT INTO notificacoes (
        tipo, prioridade, destinatario_cpf, destinatario_tipo,
        titulo, mensagem, dados_contexto, link_acao, botao_texto,
        contratacao_personalizada_id, expira_em
      )
      SELECT 
        $1, $2, u.cpf, 'admin',
        $3, $4, $5, $6, $7, $8, $9
      FROM usuarios u
      WHERE u.role = 'admin' AND u.ativo = TRUE
      RETURNING id`,
      [
        dto.tipo,
        dto.prioridade || 'media',
        dto.titulo,
        dto.mensagem,
        dto.dados_contexto ? JSON.stringify(dto.dados_contexto) : null,
        dto.link_acao || null,
        dto.botao_texto || null,
        dto.contratacao_personalizada_id || null,
        dto.expira_em || null,
      ]
    );

    return resultado.rowCount || 0;
  }

  /**
   * Buscar notificações críticas não lidas
   */
  static async buscarCriticas(
    destinatarioCpf: string,
    destinatarioTipo: DestinatarioTipo
  ): Promise<Notificacao[]> {
    const resultado = await query(
      `SELECT * FROM vw_notificacoes_dashboard
       WHERE destinatario_cpf = $1 
         AND destinatario_tipo = $2
         AND prioridade = 'critica'
         AND lida = FALSE
       ORDER BY criado_em DESC`,
      [destinatarioCpf, destinatarioTipo]
    );

    return resultado.rows;
  }
}
