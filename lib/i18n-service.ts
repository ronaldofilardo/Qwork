/**
 * I18nService
 * Serviço de internacionalização (multi-idioma) para notificações
 */

import { query } from '@/lib/db';

export type IdiomaSuportado = 'pt_BR' | 'en_US' | 'es_ES';

export interface Traducao {
  id: number;
  chave_traducao: string;
  idioma: IdiomaSuportado;
  conteudo: string;
  categoria: 'titulo' | 'mensagem' | 'botao' | 'geral';
  criado_em: Date;
  atualizado_em: Date;
}

export interface CriarTraducaoDTO {
  chave_traducao: string;
  idioma: IdiomaSuportado;
  conteudo: string;
  categoria: 'titulo' | 'mensagem' | 'botao' | 'geral';
}

export class I18nService {
  /**
   * Obter tradução por chave e idioma
   */
  static async obterTraducao(
    chave: string,
    idioma: IdiomaSuportado = 'pt_BR'
  ): Promise<string> {
    const resultado = await query('SELECT obter_traducao($1, $2) as traducao', [
      chave,
      idioma,
    ]);

    return resultado.rows[0]?.traducao || chave;
  }

  /**
   * Renderizar texto com variáveis
   */
  static renderizarTexto(
    template: string,
    variaveis: Record<string, any>
  ): string {
    let resultado = template;

    Object.keys(variaveis).forEach((chave) => {
      const regex = new RegExp(`{{${chave}}}`, 'g');
      const valor =
        variaveis[chave] !== null && variaveis[chave] !== undefined
          ? String(variaveis[chave])
          : '';
      resultado = resultado.replace(regex, valor);
    });

    return resultado;
  }

  /**
   * Obter tradução renderizada com variáveis
   */
  static async obterTraducaoRenderizada(
    chave: string,
    variaveis: Record<string, any>,
    idioma: IdiomaSuportado = 'pt_BR'
  ): Promise<string> {
    const template = await this.obterTraducao(chave, idioma);
    return this.renderizarTexto(template, variaveis);
  }

  /**
   * Criar ou atualizar tradução
   */
  static async salvarTraducao(dto: CriarTraducaoDTO): Promise<Traducao> {
    const resultado = await query(
      `INSERT INTO notificacoes_traducoes (chave_traducao, idioma, conteudo, categoria)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (chave_traducao, idioma)
       DO UPDATE SET
         conteudo = $3,
         categoria = $4,
         atualizado_em = NOW()
       RETURNING *`,
      [dto.chave_traducao, dto.idioma, dto.conteudo, dto.categoria]
    );

    return resultado.rows[0];
  }

  /**
   * Listar traduções por chave (todos os idiomas)
   */
  static async listarPorChave(chave: string): Promise<Traducao[]> {
    const resultado = await query(
      'SELECT * FROM notificacoes_traducoes WHERE chave_traducao = $1 ORDER BY idioma',
      [chave]
    );

    return resultado.rows;
  }

  /**
   * Listar todas as chaves de tradução
   */
  static async listarChaves(): Promise<string[]> {
    const resultado = await query(
      'SELECT DISTINCT chave_traducao FROM notificacoes_traducoes ORDER BY chave_traducao'
    );

    return resultado.rows.map((r) => r.chave_traducao);
  }

  /**
   * Obter idioma preferencial de uma clínica
   */
  static async obterIdiomaClinica(clinicaId: number): Promise<IdiomaSuportado> {
    const resultado = await query(
      'SELECT idioma_preferencial FROM clinicas WHERE id = $1',
      [clinicaId]
    );

    return resultado.rows[0]?.idioma_preferencial || 'pt_BR';
  }

  /**
   * Atualizar idioma preferencial de uma clínica
   */
  static async atualizarIdiomaClinica(
    clinicaId: number,
    idioma: IdiomaSuportado
  ): Promise<boolean> {
    const resultado = await query(
      'UPDATE clinicas SET idioma_preferencial = $1 WHERE id = $2 RETURNING id',
      [idioma, clinicaId]
    );

    return (resultado.rowCount || 0) > 0;
  }

  /**
   * Obter todas as traduções de uma categoria
   */
  static async listarPorCategoria(
    categoria: Traducao['categoria'],
    idioma?: IdiomaSuportado
  ): Promise<Traducao[]> {
    let sql = 'SELECT * FROM notificacoes_traducoes WHERE categoria = $1';
    const params: any[] = [categoria];

    if (idioma) {
      params.push(idioma);
      sql += ` AND idioma = $${params.length}`;
    }

    sql += ' ORDER BY chave_traducao, idioma';

    const resultado = await query(sql, params);
    return resultado.rows;
  }

  /**
   * Deletar tradução
   */
  static async deletar(
    chave: string,
    idioma: IdiomaSuportado
  ): Promise<boolean> {
    const resultado = await query(
      'DELETE FROM notificacoes_traducoes WHERE chave_traducao = $1 AND idioma = $2 RETURNING id',
      [chave, idioma]
    );

    return (resultado.rowCount || 0) > 0;
  }

  /**
   * Importar traduções em lote
   */
  static async importarTraducoes(
    traducoes: CriarTraducaoDTO[]
  ): Promise<{ sucesso: number; erro: number }> {
    let sucesso = 0;
    let erro = 0;

    for (const traducao of traducoes) {
      try {
        await this.salvarTraducao(traducao);
        sucesso++;
      } catch {
        erro++;
      }
    }

    return { sucesso, erro };
  }

  /**
   * Obter mapa completo de traduções para um idioma
   */
  static async obterMapaTraducoes(
    idioma: IdiomaSuportado = 'pt_BR'
  ): Promise<Record<string, string>> {
    const resultado = await query(
      'SELECT chave_traducao, conteudo FROM notificacoes_traducoes WHERE idioma = $1',
      [idioma]
    );

    const mapa: Record<string, string> = {};
    resultado.rows.forEach((row) => {
      mapa[row.chave_traducao] = row.conteudo;
    });

    return mapa;
  }

  /**
   * Verificar se tradução existe
   */
  static async traducaoExiste(
    chave: string,
    idioma: IdiomaSuportado
  ): Promise<boolean> {
    const resultado = await query(
      'SELECT 1 FROM notificacoes_traducoes WHERE chave_traducao = $1 AND idioma = $2',
      [chave, idioma]
    );

    return (resultado.rowCount || 0) > 0;
  }

  /**
   * Obter estatísticas de tradução
   */
  static async obterEstatisticas(): Promise<{
    total_chaves: number;
    traducoes_por_idioma: Record<IdiomaSuportado, number>;
    chaves_incompletas: string[];
  }> {
    const totalChaves = await query(
      'SELECT COUNT(DISTINCT chave_traducao) as total FROM notificacoes_traducoes'
    );

    const porIdioma = await query(
      'SELECT idioma, COUNT(*) as total FROM notificacoes_traducoes GROUP BY idioma'
    );

    const incompletas = await query(`
      SELECT DISTINCT chave_traducao
      FROM notificacoes_traducoes
      GROUP BY chave_traducao
      HAVING COUNT(DISTINCT idioma) < 3
    `);

    const traducoesPorIdioma: Record<IdiomaSuportado, number> = {
      pt_BR: 0,
      en_US: 0,
      es_ES: 0,
    };

    porIdioma.rows.forEach((row) => {
      traducoesPorIdioma[row.idioma as IdiomaSuportado] = parseInt(row.total);
    });

    return {
      total_chaves: parseInt(totalChaves.rows[0]?.total || '0'),
      traducoes_por_idioma: traducoesPorIdioma,
      chaves_incompletas: incompletas.rows.map((r) => r.chave_traducao),
    };
  }
}
