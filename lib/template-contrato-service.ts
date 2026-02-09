/**
 * TemplateContratoService
 * Gerencia templates editáveis de contratos
 */

import { query } from '@/lib/db';

export type TipoTemplate = 'plano_fixo' | 'plano_personalizado' | 'padrao';

export interface TemplateContrato {
  id: number;
  nome: string;
  descricao?: string;
  tipo_template: TipoTemplate;
  conteudo: string;
  ativo: boolean;
  padrao: boolean;
  versao: number;
  criado_em: Date;
  criado_por_cpf?: string;
  atualizado_em: Date;
  atualizado_por_cpf?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CriarTemplateDTO {
  nome: string;
  descricao?: string;
  tipo_template: TipoTemplate;
  conteudo: string;
  ativo?: boolean;
  padrao?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface RenderizarContratoDTO {
  template_id: number;
  variaveis: {
    tomador_nome: string;
    tomador_cnpj: string;
    valor_total: number;
    valor_total_extenso?: string;
    valor_por_funcionario: number;
    numero_funcionarios: number;
    prazo_meses?: number;
    data_inicio?: string;
    data_contrato: string;
    [key: string]: any;
  };
}

export class TemplateContratoService {
  /**
   * Listar todos os templates
   */
  static async listar(
    tipo?: TipoTemplate,
    apenasAtivos = true
  ): Promise<TemplateContrato[]> {
    let sql = 'SELECT * FROM templates_contrato WHERE 1=1';
    const params: any[] = [];

    if (tipo) {
      params.push(tipo);
      sql += ` AND tipo_template = $${params.length}`;
    }

    if (apenasAtivos) {
      sql += ' AND ativo = TRUE';
    }

    sql += ' ORDER BY padrao DESC, nome ASC';

    const resultado = await query(sql, params);
    return resultado.rows;
  }

  /**
   * Buscar template padrão por tipo
   */
  static async buscarPadrao(
    tipo: TipoTemplate
  ): Promise<TemplateContrato | null> {
    const resultado = await query(
      'SELECT * FROM templates_contrato WHERE tipo_template = $1 AND padrao = TRUE AND ativo = TRUE LIMIT 1',
      [tipo]
    );

    return resultado.rows[0] || null;
  }

  /**
   * Buscar template por ID
   */
  static async buscarPorId(id: number): Promise<TemplateContrato | null> {
    const resultado = await query(
      'SELECT * FROM templates_contrato WHERE id = $1',
      [id]
    );
    return resultado.rows[0] || null;
  }

  /**
   * Criar novo template
   */
  static async criar(
    dto: CriarTemplateDTO,
    cpfCriador: string
  ): Promise<TemplateContrato> {
    const resultado = await query(
      `INSERT INTO templates_contrato (
        nome, descricao, tipo_template, conteudo, ativo, padrao,
        tags, metadata, criado_por_cpf, atualizado_por_cpf
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
      RETURNING *`,
      [
        dto.nome,
        dto.descricao || null,
        dto.tipo_template,
        dto.conteudo,
        dto.ativo !== false,
        dto.padrao || false,
        dto.tags || null,
        dto.metadata ? JSON.stringify(dto.metadata) : null,
        cpfCriador,
      ]
    );

    return resultado.rows[0];
  }

  /**
   * Atualizar template existente
   */
  static async atualizar(
    id: number,
    dados: Partial<CriarTemplateDTO>,
    cpfEditor: string
  ): Promise<TemplateContrato | null> {
    const campos: string[] = [];
    const valores: any[] = [];

    if (dados.nome !== undefined) {
      campos.push('nome');
      valores.push(dados.nome);
    }
    if (dados.descricao !== undefined) {
      campos.push('descricao');
      valores.push(dados.descricao);
    }
    if (dados.conteudo !== undefined) {
      campos.push('conteudo');
      valores.push(dados.conteudo);
    }
    if (dados.ativo !== undefined) {
      campos.push('ativo');
      valores.push(dados.ativo);
    }
    if (dados.padrao !== undefined) {
      campos.push('padrao');
      valores.push(dados.padrao);
    }
    if (dados.tags !== undefined) {
      campos.push('tags');
      valores.push(dados.tags);
    }
    if (dados.metadata !== undefined) {
      campos.push('metadata');
      valores.push(JSON.stringify(dados.metadata));
    }

    campos.push('atualizado_por_cpf');
    valores.push(cpfEditor);

    campos.push('versao');
    valores.push('versao + 1');

    valores.push(id);

    const sql = `
      UPDATE templates_contrato
      SET ${campos.map((c, i) => `${c} = $${i + 1}`).join(', ')}
      WHERE id = $${valores.length}
      RETURNING *
    `;

    const resultado = await query(sql, valores);
    return resultado.rows[0] || null;
  }

  /**
   * Renderizar template com variáveis
   */
  static renderizarTemplate(
    conteudoTemplate: string,
    variaveis: Record<string, any>
  ): string {
    let resultado = conteudoTemplate;

    // Substituir placeholders {{variavel}} pelos valores
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
   * Gerar contrato renderizado
   */
  static async gerarContrato(dto: RenderizarContratoDTO): Promise<string> {
    const template = await this.buscarPorId(dto.template_id);

    if (!template) {
      throw new Error('Template não encontrado');
    }

    if (!template.ativo) {
      throw new Error('Template está inativo');
    }

    return this.renderizarTemplate(template.conteudo, dto.variaveis);
  }

  /**
   * Deletar template (soft delete - desativar)
   */
  static async deletar(id: number): Promise<boolean> {
    const resultado = await query(
      'UPDATE templates_contrato SET ativo = FALSE WHERE id = $1 RETURNING id',
      [id]
    );

    return (resultado.rowCount || 0) > 0;
  }

  /**
   * Clonar template (criar cópia)
   */
  static async clonar(
    id: number,
    novoNome: string,
    cpfCriador: string
  ): Promise<TemplateContrato> {
    const original = await this.buscarPorId(id);

    if (!original) {
      throw new Error('Template original não encontrado');
    }

    return await this.criar(
      {
        nome: novoNome,
        descricao: `Copia de: ${original.nome}`,
        tipo_template: original.tipo_template,
        conteudo: original.conteudo,
        ativo: true,
        padrao: false,
        tags: original.tags,
        metadata: original.metadata,
      },
      cpfCriador
    );
  }
}
