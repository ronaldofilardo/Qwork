/**
 * ClinicaConfiguracaoService
 * Gerencia configurações e campos customizáveis por clínica
 */

import { query } from '@/lib/db';

export interface ClinicaConfiguracao {
  id: number;
  clinica_id: number;
  campos_customizados: Record<string, any>;
  logo_url?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  template_relatorio_id?: number;
  incluir_logo_relatorios: boolean;
  formato_data_preferencial: string;
  criado_em: Date;
  atualizado_em: Date;
  atualizado_por_cpf?: string;
}

export interface AtualizarConfiguracaoDTO {
  campos_customizados?: Record<string, any>;
  logo_url?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  template_relatorio_id?: number;
  incluir_logo_relatorios?: boolean;
  formato_data_preferencial?: string;
}

export class ClinicaConfiguracaoService {
  /**
   * Buscar configuração de uma clínica
   */
  static async buscarPorClinica(
    clinicaId: number
  ): Promise<ClinicaConfiguracao | null> {
    const resultado = await query(
      'SELECT * FROM clinica_configuracoes WHERE clinica_id = $1',
      [clinicaId]
    );

    return resultado.rows[0] || null;
  }

  /**
   * Criar ou atualizar configuração (upsert)
   */
  static async salvar(
    clinicaId: number,
    dto: AtualizarConfiguracaoDTO,
    cpfEditor: string
  ): Promise<ClinicaConfiguracao> {
    const resultado = await query(
      `INSERT INTO clinica_configuracoes (
        clinica_id, campos_customizados, logo_url, cor_primaria, cor_secundaria,
        template_relatorio_id, incluir_logo_relatorios, formato_data_preferencial,
        atualizado_por_cpf
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (clinica_id) 
      DO UPDATE SET
        campos_customizados = COALESCE($2, clinica_configuracoes.campos_customizados),
        logo_url = COALESCE($3, clinica_configuracoes.logo_url),
        cor_primaria = COALESCE($4, clinica_configuracoes.cor_primaria),
        cor_secundaria = COALESCE($5, clinica_configuracoes.cor_secundaria),
        template_relatorio_id = COALESCE($6, clinica_configuracoes.template_relatorio_id),
        incluir_logo_relatorios = COALESCE($7, clinica_configuracoes.incluir_logo_relatorios),
        formato_data_preferencial = COALESCE($8, clinica_configuracoes.formato_data_preferencial),
        atualizado_por_cpf = $9,
        atualizado_em = NOW()
      RETURNING *`,
      [
        clinicaId,
        dto.campos_customizados
          ? JSON.stringify(dto.campos_customizados)
          : null,
        dto.logo_url || null,
        dto.cor_primaria || null,
        dto.cor_secundaria || null,
        dto.template_relatorio_id || null,
        dto.incluir_logo_relatorios ?? null,
        dto.formato_data_preferencial || null,
        cpfEditor,
      ]
    );

    return resultado.rows[0];
  }

  /**
   * Obter valor de campo customizado específico
   */
  static async obterCampoCustomizado(
    clinicaId: number,
    chave: string
  ): Promise<any> {
    const resultado = await query(
      'SELECT obter_config_clinica($1, $2) as valor',
      [clinicaId, chave]
    );

    return resultado.rows[0]?.valor || null;
  }

  /**
   * Adicionar campo customizado
   */
  static async adicionarCampoCustomizado(
    clinicaId: number,
    chave: string,
    valor: any,
    cpfEditor: string
  ): Promise<ClinicaConfiguracao> {
    // Buscar configuração atual
    let config = await this.buscarPorClinica(clinicaId);

    // Se não existir, criar uma vazia
    if (!config) {
      config = await this.salvar(
        clinicaId,
        { campos_customizados: {} },
        cpfEditor
      );
    }

    // Atualizar campo customizado
    const camposAtualizados = {
      ...config.campos_customizados,
      [chave]: valor,
    };

    return await this.salvar(
      clinicaId,
      { campos_customizados: camposAtualizados },
      cpfEditor
    );
  }

  /**
   * Remover campo customizado
   */
  static async removerCampoCustomizado(
    clinicaId: number,
    chave: string,
    cpfEditor: string
  ): Promise<ClinicaConfiguracao | null> {
    const config = await this.buscarPorClinica(clinicaId);

    if (!config) {
      return null;
    }

    const camposAtualizados = { ...config.campos_customizados };
    delete camposAtualizados[chave];

    return await this.salvar(
      clinicaId,
      { campos_customizados: camposAtualizados },
      cpfEditor
    );
  }

  /**
   * Validar cor hexadecimal
   */
  static validarCor(cor: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(cor);
  }

  /**
   * Obter cores da clínica ou padrão
   */
  static async obterCores(clinicaId: number): Promise<{
    primaria: string;
    secundaria: string;
  }> {
    const config = await this.buscarPorClinica(clinicaId);

    return {
      primaria: config?.cor_primaria || '#FF6B00',
      secundaria: config?.cor_secundaria || '#0066CC',
    };
  }

  /**
   * Listar todas as configurações (admin)
   */
  static async listarTodas(): Promise<ClinicaConfiguracao[]> {
    const resultado = await query(
      `SELECT cc.*, c.nome_fantasia AS clinica_nome
       FROM clinica_configuracoes cc
       LEFT JOIN clinicas c ON cc.clinica_id = c.id
       ORDER BY c.nome_fantasia`
    );

    return resultado.rows;
  }
}
