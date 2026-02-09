/**
 * Strategy Pattern para gerenciar diferentes tipos de planos
 * Permite extensibilidade sem modificar código existente (Open-Closed Principle)
 */

import { TipoPlanoType } from './types/enums';

/**
 * Interface base para estratégias de plano
 * Interface Segregation: Apenas métodos necessários para todos os planos
 */
export interface IPlanoStrategy {
  /**
   * Tipo do plano
   */
  tipo: TipoPlanoType;

  /**
   * Validar dados específicos do plano
   */
  validarDados(dados: unknown): ValidationResult;

  /**
   * Calcular valor total do plano
   */
  calcularValorTotal(dados: DadosPlano): number;

  /**
   * Gerar conteúdo do contrato específico do plano
   */
  gerarConteudoContrato(
    dados: DadosPlano,
    dadostomador: Dadostomador
  ): Promise<string>;

  /**
   * Processar pagamento de acordo com regras do plano
   */
  processarPagamento(
    dados: DadosPlano,
    dadosPagamento: DadosPagamento
  ): ResultadoPagamento;

  /**
   * Verificar se tomador pode usar este plano
   */
  verificarElegibilidade(tomadorId: number): boolean;
}

/**
 * Tipos auxiliares
 */
export interface ValidationResult {
  valido: boolean;
  erros?: string[];
}

export interface DadosPlano {
  planoId: number;
  numeroFuncionarios?: number;
  valorPorFuncionario?: number;
  valorFixo?: number;
  periodicidade?: 'mensal' | 'anual';
  parcelas?: number;
}

export interface Dadostomador {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  tipo: 'clinica' | 'entidade';
  responsavel: {
    nome: string;
    cpf: string;
    cargo: string;
    email: string;
  };
}

export interface DadosPagamento {
  metodo: 'pix' | 'boleto' | 'cartao';
  valor: number;
  parcelas?: number;
  dadosCartao?: {
    numero: string;
    nome: string;
    validade: string;
    cvv: string;
  };
}

export interface ResultadoPagamento {
  sucesso: boolean;
  transacaoId?: string;
  erro?: string;
  urlBoleto?: string;
  qrCodePix?: string;
}

/**
 * Estratégia para Plano Fixo
 */
export class PlanoFixoStrategy implements IPlanoStrategy {
  tipo: TipoPlanoType = 'fixo';

  validarDados(dados: unknown): ValidationResult {
    const erros: string[] = [];

    if (!dados || typeof dados !== 'object') {
      erros.push('Dados inválidos');
      return { valido: false, erros };
    }

    const d = dados as DadosPlano;

    if (!d.numeroFuncionarios || d.numeroFuncionarios < 1) {
      erros.push(
        'Número de funcionários é obrigatório e deve ser maior que zero'
      );
    }

    if (!d.valorFixo || d.valorFixo <= 0) {
      erros.push('Valor fixo é obrigatório e deve ser maior que zero');
    }

    return {
      valido: erros.length === 0,
      erros: erros.length > 0 ? erros : undefined,
    };
  }

  calcularValorTotal(dados: DadosPlano): number {
    // Para plano fixo, o valor é por funcionário vezes quantidade
    const valorUnitario = dados.valorFixo || 0;
    const quantidade = dados.numeroFuncionarios || 1;
    return valorUnitario * quantidade;
  }

  async gerarConteudoContrato(
    dados: DadosPlano,
    dadostomador: Dadostomador
  ): Promise<string> {
    const valorTotal = this.calcularValorTotal(dados);
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    return Promise.resolve(`
CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PLANO FIXO
QWORK - AVALIAÇÃO PSICOSSOCIAL

Data: ${dataAtual}

tomador: ${dadostomador.nome}
CNPJ: ${dadostomador.cnpj}
Tipo: ${dadostomador.tipo === 'clinica' ? 'Serviço de Medicina Ocupacional' : 'Empresa Privada'}
Endereço: ${dadostomador.endereco}, ${dadostomador.cidade}/${dadostomador.estado}

Representante Legal:
Nome: ${dadostomador.responsavel.nome}
CPF: ${dadostomador.responsavel.cpf}
Cargo: ${dadostomador.responsavel.cargo}

CLÁUSULA PRIMEIRA - DO OBJETO
Prestação de serviços de avaliação psicossocial através da plataforma QWork.

CLÁUSULA SEGUNDA - DO PLANO
Plano: Fixo Anual por Funcionário
Quantidade de funcionários: ${dados.numeroFuncionarios}
Valor unitário anual: R$ ${(dados.valorFixo || 0).toFixed(2)}
Valor total anual: R$ ${valorTotal.toFixed(2)}

CLÁUSULA TERCEIRA - DO PAGAMENTO
Forma de pagamento: ${dados.periodicidade === 'mensal' ? 'Mensal' : 'Anual'}
${dados.parcelas && dados.parcelas > 1 ? `Parcelamento: ${dados.parcelas}x sem juros` : ''}

CLÁUSULA QUARTA - DA VIGÊNCIA
Vigência de 12 (doze) meses a partir da data de assinatura.

[Demais cláusulas padrão...]
`);
  }

  processarPagamento(
    _dados: DadosPlano,
    _dadosPagamento: DadosPagamento
  ): ResultadoPagamento {
    // Simular processamento de pagamento
    // Em produção, integrar com gateway real
    return {
      sucesso: true,
      transacaoId: `TXN-FIXO-${Date.now()}`,
    };
  }

  verificarElegibilidade(_tomadorId: number): boolean {
    // Plano fixo está disponível para todos
    return true;
  }
}

/**
 * Estratégia para Plano Personalizado
 */
export class PlanoPersonalizadoStrategy implements IPlanoStrategy {
  tipo: TipoPlanoType = 'personalizado';

  validarDados(dados: unknown): ValidationResult {
    const erros: string[] = [];

    if (!dados || typeof dados !== 'object') {
      erros.push('Dados inválidos');
      return { valido: false, erros };
    }

    const d = dados as DadosPlano;

    if (!d.numeroFuncionarios || d.numeroFuncionarios < 1) {
      erros.push(
        'Número de funcionários é obrigatório e deve ser maior que zero'
      );
    }

    // Para plano personalizado, valor é definido pelo admin posteriormente
    // Não validamos valor aqui

    return {
      valido: erros.length === 0,
      erros: erros.length > 0 ? erros : undefined,
    };
  }

  calcularValorTotal(dados: DadosPlano): number {
    // Para plano personalizado, valor é calculado após admin definir
    if (!dados.valorPorFuncionario) {
      throw new Error('Valor por funcionário não foi definido pelo admin');
    }
    return dados.valorPorFuncionario * (dados.numeroFuncionarios || 1);
  }

  async gerarConteudoContrato(
    dados: DadosPlano,
    dadostomador: Dadostomador
  ): Promise<string> {
    if (!dados.valorPorFuncionario) {
      throw new Error(
        'Valor por funcionário deve ser definido antes de gerar contrato'
      );
    }

    const valorTotal = this.calcularValorTotal(dados);
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    return Promise.resolve(`
CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PLANO PERSONALIZADO
QWORK - AVALIAÇÃO PSICOSSOCIAL PARA MEDICINA OCUPACIONAL

Data: ${dataAtual}

tomador: ${dadostomador.nome}
CNPJ: ${dadostomador.cnpj}
Tipo: Serviço de Medicina Ocupacional
Endereço: ${dadostomador.endereco}, ${dadostomador.cidade}/${dadostomador.estado}

Representante Legal:
Nome: ${dadostomador.responsavel.nome}
CPF: ${dadostomador.responsavel.cpf}
Cargo: ${dadostomador.responsavel.cargo}

CLÁUSULA PRIMEIRA - DO OBJETO
Prestação de serviços personalizados de avaliação psicossocial para Medicina Ocupacional.

CLÁUSULA SEGUNDA - DO PLANO PERSONALIZADO
Plano: Personalizado para Medicina Ocupacional
Quantidade estimada de funcionários: ${dados.numeroFuncionarios}
Valor por funcionário: R$ ${(dados.valorPorFuncionario || 0).toFixed(2)}
Valor total estimado: R$ ${valorTotal.toFixed(2)}

OBSERVAÇÃO: O valor final será ajustado conforme o número real de funcionários avaliados.

CLÁUSULA TERCEIRA - DO PAGAMENTO
Forma de pagamento: Conforme negociação específica
${dados.parcelas && dados.parcelas > 1 ? `Parcelamento: até ${dados.parcelas}x` : ''}

CLÁUSULA QUARTA - DA VIGÊNCIA
Vigência conforme acordo específico entre as partes.

CLÁUSULA QUINTA - DAS ESPECIFICIDADES DO SERVIÇO MÉDICO OCUPACIONAL
[Cláusulas específicas para serviços de Medicina Ocupacional...]

[Demais cláusulas personalizadas...]
`);
  }

  processarPagamento(
    _dados: DadosPlano,
    _dadosPagamento: DadosPagamento
  ): ResultadoPagamento {
    // Plano personalizado pode ter regras especiais de pagamento
    // Simular processamento
    return {
      sucesso: true,
      transacaoId: `TXN-PERS-${Date.now()}`,
    };
  }

  verificarElegibilidade(_tomadorId: number): boolean {
    // Plano personalizado disponível apenas para serviços de Medicina Ocupacional
    // Em produção, verificar tipo do tomador no banco
    return true;
  }
}

/**
 * Factory para criar estratégia baseada no tipo de plano
 * Factory Pattern + Dependency Inversion
 */
export class PlanoStrategyFactory {
  private static strategies: Map<TipoPlanoType, IPlanoStrategy> = new Map([
    ['fixo', new PlanoFixoStrategy()],
    ['personalizado', new PlanoPersonalizadoStrategy()],
    // Adicionar outras estratégias conforme necessário
  ]);

  static getStrategy(tipo: TipoPlanoType): IPlanoStrategy {
    const strategy = this.strategies.get(tipo);
    if (!strategy) {
      throw new Error(`Estratégia não encontrada para tipo de plano: ${tipo}`);
    }
    return strategy;
  }

  static registrarStrategy(
    tipo: TipoPlanoType,
    strategy: IPlanoStrategy
  ): void {
    this.strategies.set(tipo, strategy);
  }
}
