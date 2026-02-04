/**
 * Serviço de Logs de Erro Estruturados
 *
 * Fornece logging estruturado com:
 * - Códigos de erro padronizados
 * - Stack traces quando disponível
 * - Contexto adicional
 * - Integração com Sentry (quando disponível)
 * - Mensagens legíveis para usuários
 */

/**
 * Códigos de erro padronizados
 */
export enum CodigoErro {
  // Erros de validação (4xx)
  LOTE_NAO_ENCONTRADO = 'E4001',
  LOTE_NAO_CONCLUIDO = 'E4002',
  LAUDO_JA_EMITIDO = 'E4003',
  AVALIACOES_INCOMPLETAS = 'E4004',
  PERMISSAO_NEGADA = 'E4005',
  DADOS_INVALIDOS = 'E4006',

  // Erros de geração (5xx)
  ERRO_GERAR_PDF = 'E5001',
  ERRO_UPLOAD_STORAGE = 'E5002',
  ERRO_BANCO_DADOS = 'E5003',
  ERRO_INTERNO = 'E5004',
  TIMEOUT_GERACAO = 'E5005',

  // Erros de integridade (5xx)
  HASH_INVALIDO = 'E5101',
  ARQUIVO_CORROMPIDO = 'E5102',
  DADOS_INCONSISTENTES = 'E5103',
}

/**
 * Nível de severidade do erro
 */
export enum NivelSeveridade {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Estrutura de um erro padronizado
 */
export interface ErroEstruturado {
  codigo: CodigoErro;
  mensagem: string;
  mensagemUsuario: string;
  severidade: NivelSeveridade;
  timestamp: Date;
  contexto?: Record<string, any>;
  stackTrace?: string;
  usuario?: string;
  recurso?: string;
}

/**
 * Mapear código para mensagem legível
 */
const MENSAGENS_USUARIO: Record<CodigoErro, string> = {
  [CodigoErro.LOTE_NAO_ENCONTRADO]:
    'O lote solicitado não foi encontrado. Verifique o número do lote.',
  [CodigoErro.LOTE_NAO_CONCLUIDO]:
    'Este lote ainda não está concluído. Finalize todas as avaliações antes de emitir o laudo.',
  [CodigoErro.LAUDO_JA_EMITIDO]:
    'O laudo já foi emitido para este lote. Não é possível gerar novamente.',
  [CodigoErro.AVALIACOES_INCOMPLETAS]:
    'Existem avaliações pendentes. Complete todas as avaliações antes de solicitar emissão.',
  [CodigoErro.PERMISSAO_NEGADA]:
    'Você não tem permissão para realizar esta ação.',
  [CodigoErro.DADOS_INVALIDOS]:
    'Os dados fornecidos são inválidos. Verifique e tente novamente.',

  [CodigoErro.ERRO_GERAR_PDF]:
    'Erro ao gerar o PDF do laudo. Tente novamente em alguns instantes.',
  [CodigoErro.ERRO_UPLOAD_STORAGE]:
    'Erro ao enviar o arquivo para armazenamento. Verifique sua conexão.',
  [CodigoErro.ERRO_BANCO_DADOS]:
    'Erro no banco de dados. Entre em contato com o suporte se o problema persistir.',
  [CodigoErro.ERRO_INTERNO]:
    'Erro interno do sistema. Nossa equipe foi notificada.',
  [CodigoErro.TIMEOUT_GERACAO]:
    'O tempo limite para geração foi excedido. Tente novamente com menos avaliações.',

  [CodigoErro.HASH_INVALIDO]:
    'O hash do arquivo é inválido. O arquivo pode estar corrompido.',
  [CodigoErro.ARQUIVO_CORROMPIDO]:
    'O arquivo está corrompido e não pode ser processado.',
  [CodigoErro.DADOS_INCONSISTENTES]:
    'Os dados estão inconsistentes. Entre em contato com o suporte.',
};

/**
 * Classe de erro customizada
 */
export class ErroQWork extends Error {
  public readonly codigo: CodigoErro;
  public readonly mensagemUsuario: string;
  public readonly severidade: NivelSeveridade;
  public readonly contexto?: Record<string, any>;

  constructor(
    codigo: CodigoErro,
    mensagem: string,
    contexto?: Record<string, any>,
    severidade: NivelSeveridade = NivelSeveridade.ERROR
  ) {
    super(mensagem);
    this.name = 'ErroQWork';
    this.codigo = codigo;
    this.mensagemUsuario = MENSAGENS_USUARIO[codigo];
    this.severidade = severidade;
    this.contexto = contexto;

    // Capturar stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErroQWork);
    }
  }

  /**
   * Converter para objeto estruturado
   */
  toJSON(): ErroEstruturado {
    return {
      codigo: this.codigo,
      mensagem: this.message,
      mensagemUsuario: this.mensagemUsuario,
      severidade: this.severidade,
      timestamp: new Date(),
      contexto: this.contexto,
      stackTrace: this.stack,
    };
  }
}

/**
 * Logger de erros
 */
export class ErrorLogger {
  /**
   * Logar erro estruturado
   */
  static log(erro: ErroQWork | Error, contextoAdicional?: Record<string, any>) {
    const timestamp = new Date().toISOString();

    // Se é ErroQWork, usar estrutura completa
    if (erro instanceof ErroQWork) {
      const erroEstruturado = erro.toJSON();

      // Adicionar contexto adicional
      if (contextoAdicional) {
        erroEstruturado.contexto = {
          ...erroEstruturado.contexto,
          ...contextoAdicional,
        };
      }

      // Log no console (em produção, enviar para serviço de log)
      console.error(
        `[${timestamp}] [${erroEstruturado.severidade.toUpperCase()}] [${erroEstruturado.codigo}]`,
        erroEstruturado.mensagem,
        erroEstruturado.contexto
      );

      // Enviar para Sentry se disponível
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(erro, {
          tags: {
            codigo: erroEstruturado.codigo,
            severidade: erroEstruturado.severidade,
          },
          contexts: {
            erro: erroEstruturado.contexto,
          },
        });
      }

      return erroEstruturado;
    }

    // Erro genérico
    const erroGenerico: ErroEstruturado = {
      codigo: CodigoErro.ERRO_INTERNO,
      mensagem: erro.message,
      mensagemUsuario: MENSAGENS_USUARIO[CodigoErro.ERRO_INTERNO],
      severidade: NivelSeveridade.ERROR,
      timestamp: new Date(),
      contexto: contextoAdicional,
      stackTrace: erro.stack,
    };

    console.error(`[${timestamp}] [ERROR]`, erro.message, contextoAdicional);

    // Enviar para Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(erro, {
        contexts: { erro: contextoAdicional },
      });
    }

    return erroGenerico;
  }

  /**
   * Logar warning
   */
  static warn(mensagem: string, contexto?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARNING]`, mensagem, contexto);

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(mensagem, {
        level: 'warning',
        contexts: { contexto },
      });
    }
  }

  /**
   * Logar info
   */
  static info(mensagem: string, contexto?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO]`, mensagem, contexto);
  }
}

/**
 * Converter erro do backend em ErroQWork
 */
export function converterErroBackend(
  erro: any,
  contexto?: Record<string, any>
): ErroQWork {
  // Se já tem código de erro
  if (erro.codigo && Object.values(CodigoErro).includes(erro.codigo)) {
    return new ErroQWork(
      erro.codigo,
      erro.mensagem || erro.message,
      { ...erro.contexto, ...contexto },
      erro.severidade || NivelSeveridade.ERROR
    );
  }

  // Tentar mapear mensagem para código conhecido
  const mensagem = erro.message || erro.error || String(erro);

  if (mensagem.includes('não encontrado')) {
    return new ErroQWork(CodigoErro.LOTE_NAO_ENCONTRADO, mensagem, contexto);
  }

  if (mensagem.includes('não está concluído')) {
    return new ErroQWork(CodigoErro.LOTE_NAO_CONCLUIDO, mensagem, contexto);
  }

  if (mensagem.includes('já foi emitido')) {
    return new ErroQWork(CodigoErro.LAUDO_JA_EMITIDO, mensagem, contexto);
  }

  if (mensagem.includes('permissão') || mensagem.includes('autorizado')) {
    return new ErroQWork(CodigoErro.PERMISSAO_NEGADA, mensagem, contexto);
  }

  if (mensagem.includes('timeout')) {
    return new ErroQWork(CodigoErro.TIMEOUT_GERACAO, mensagem, contexto);
  }

  // Erro genérico
  return new ErroQWork(CodigoErro.ERRO_INTERNO, mensagem, contexto);
}

/**
 * Exibir erro para usuário (retorna mensagem amigável)
 */
export function getMensagemErroUsuario(erro: any): string {
  if (erro instanceof ErroQWork) {
    return erro.mensagemUsuario;
  }

  const erroConvertido = converterErroBackend(erro);
  return erroConvertido.mensagemUsuario;
}
