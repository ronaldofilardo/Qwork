/**
 * EntidadeConfiguracaoService
 * Gerencia configurações de branding (logo, cores) por entidade
 * Espelho de ClinicaConfiguracaoService para entidades diretas
 */

import { query } from '@/lib/db';

export interface EntidadeConfiguracao {
  id: number;
  entidade_id: number;
  logo_url?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  criado_em: Date;
  atualizado_em: Date;
  atualizado_por_cpf?: string;
}

export interface AtualizarEntidadeConfiguracaoDTO {
  logo_url?: string | null;
  cor_primaria?: string;
  cor_secundaria?: string;
}

export class EntidadeConfiguracaoService {
  static async buscarPorEntidade(
    entidadeId: number
  ): Promise<EntidadeConfiguracao | null> {
    const resultado = await query(
      'SELECT * FROM entidade_configuracoes WHERE entidade_id = $1',
      [entidadeId]
    );

    return resultado.rows[0] || null;
  }

  static async salvar(
    entidadeId: number,
    dto: AtualizarEntidadeConfiguracaoDTO,
    cpfEditor: string
  ): Promise<EntidadeConfiguracao> {
    const resultado = await query(
      `INSERT INTO entidade_configuracoes (
        entidade_id, logo_url, cor_primaria, cor_secundaria, atualizado_por_cpf
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (entidade_id)
      DO UPDATE SET
        logo_url = COALESCE($2, entidade_configuracoes.logo_url),
        cor_primaria = COALESCE($3, entidade_configuracoes.cor_primaria),
        cor_secundaria = COALESCE($4, entidade_configuracoes.cor_secundaria),
        atualizado_por_cpf = $5,
        atualizado_em = NOW()
      RETURNING *`,
      [
        entidadeId,
        dto.logo_url ?? null,
        dto.cor_primaria || null,
        dto.cor_secundaria || null,
        cpfEditor,
      ]
    );

    return resultado.rows[0];
  }

  static async removerLogo(
    entidadeId: number,
    cpfEditor: string
  ): Promise<EntidadeConfiguracao | null> {
    const resultado = await query(
      `UPDATE entidade_configuracoes
       SET logo_url = NULL, atualizado_por_cpf = $2, atualizado_em = NOW()
       WHERE entidade_id = $1
       RETURNING *`,
      [entidadeId, cpfEditor]
    );

    return resultado.rows[0] || null;
  }

  static validarCor(cor: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(cor);
  }
}
