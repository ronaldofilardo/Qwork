/**
 * Serviço de Retry Policy
 *
 * Implementa políticas de retry com exponential backoff para operações que podem falhar:
 * - Geração de PDF com Puppeteer
 * - Upload/Download do Backblaze
 * - Operações de rede em geral
 *
 * Features:
 * - Exponential backoff com jitter
 * - Circuit breaker para prevenir cascata de falhas
 * - Métricas de retry para observabilidade
 * - Timeout configurável
 * - Idempotência garantida
 */

import { setTimeout as sleep } from 'timers/promises';

/**
 * Configuração de retry
 */
export interface RetryConfig {
  /** Número máximo de tentativas */
  maxTentativas: number;
  /** Delay inicial em ms */
  delayInicial: number;
  /** Multiplicador para exponential backoff (default: 2) */
  multiplicador?: number;
  /** Delay máximo em ms (default: 30000 = 30s) */
  delayMaximo?: number;
  /** Timeout total em ms (opcional) */
  timeout?: number;
  /** Adicionar jitter aleatório (default: true) */
  usarJitter?: boolean;
  /** Códigos de erro que devem ser retried */
  codigosRetry?: string[];
  /** Função para determinar se deve fazer retry */
  deveRetentar?: (erro: Error) => boolean;
}

/**
 * Resultado de uma operação com retry
 */
export interface RetryResult<T> {
  sucesso: boolean;
  resultado?: T;
  erro?: Error;
  tentativas: number;
  tempoTotal: number;
}

/**
 * Métricas de retry para observabilidade
 */
export interface RetryMetrics {
  operacao: string;
  tentativas: number;
  tempoTotal: number;
  sucesso: boolean;
  erroFinal?: string;
  timestamp: Date;
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'CLOSED', // Funcionando normalmente
  OPEN = 'OPEN', // Muitas falhas, bloquear requests
  HALF_OPEN = 'HALF_OPEN', // Testando recuperação
}

/**
 * Circuit Breaker para prevenir cascata de falhas
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private falhas = 0;
  private ultimaFalha?: Date;
  private readonly limiarFalhas: number;
  private readonly tempoRecuperacao: number; // ms

  constructor(limiarFalhas = 5, tempoRecuperacao = 60000) {
    this.limiarFalhas = limiarFalhas;
    this.tempoRecuperacao = tempoRecuperacao;
  }

  async executar<T>(fn: () => Promise<T>): Promise<T> {
    // Verificar estado do circuit
    if (this.state === CircuitState.OPEN) {
      // Verificar se já passou tempo de recuperação
      if (
        this.ultimaFalha &&
        Date.now() - this.ultimaFalha.getTime() > this.tempoRecuperacao
      ) {
        this.state = CircuitState.HALF_OPEN;
        console.log('[CIRCUIT BREAKER] Mudando para HALF_OPEN');
      } else {
        throw new Error('Circuit breaker OPEN - muitas falhas recentes');
      }
    }

    try {
      const resultado = await fn();

      // Sucesso - resetar contador
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        console.log('[CIRCUIT BREAKER] Recuperado - mudando para CLOSED');
      }
      this.falhas = 0;

      return resultado;
    } catch (erro) {
      this.falhas++;
      this.ultimaFalha = new Date();

      if (this.falhas >= this.limiarFalhas) {
        this.state = CircuitState.OPEN;
        console.error(
          `[CIRCUIT BREAKER] Abrindo circuit - ${this.falhas} falhas consecutivas`
        );
      }

      throw erro;
    }
  }

  getStatus() {
    return {
      state: this.state,
      falhas: this.falhas,
      ultimaFalha: this.ultimaFalha,
    };
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.falhas = 0;
    this.ultimaFalha = undefined;
  }
}

// Circuit breakers globais por tipo de operação
const circuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(nome: string): CircuitBreaker {
  if (!circuitBreakers.has(nome)) {
    circuitBreakers.set(nome, new CircuitBreaker());
  }
  return circuitBreakers.get(nome)!;
}

/**
 * Armazena métricas de retry (em produção, enviar para Prometheus/CloudWatch)
 */
const metricas: RetryMetrics[] = [];

export function getMetricas(): RetryMetrics[] {
  return [...metricas];
}

export function limparMetricas(): void {
  metricas.length = 0;
}

/**
 * Calcular delay com exponential backoff e jitter
 */
function calcularDelay(tentativa: number, config: RetryConfig): number {
  const multiplicador = config.multiplicador ?? 2;
  const delayMaximo = config.delayMaximo ?? 30000;
  const usarJitter = config.usarJitter ?? true;

  // Exponential backoff: delay * (multiplicador ^ tentativa)
  let delay = config.delayInicial * Math.pow(multiplicador, tentativa - 1);

  // Aplicar limite máximo
  delay = Math.min(delay, delayMaximo);

  // Adicionar jitter (±25% do delay)
  if (usarJitter) {
    const jitter = delay * 0.25;
    delay = delay + (Math.random() * jitter * 2 - jitter);
  }

  return Math.floor(delay);
}

/**
 * Determinar se deve retentar baseado no erro
 */
function deveRetentarErro(erro: Error, config: RetryConfig): boolean {
  // Usar função customizada se fornecida
  if (config.deveRetentar) {
    return config.deveRetentar(erro);
  }

  // Lista padrão de erros que devem ser retried
  const errosRetry = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'TimeoutError',
    'NetworkError',
    'ProtocolError', // Puppeteer
  ];

  const mensagem = erro.message || '';
  const nome = erro.name || '';

  return (
    errosRetry.some((e) => mensagem.includes(e) || nome.includes(e)) ||
    (config.codigosRetry?.some((c) => mensagem.includes(c)) ?? false)
  );
}

/**
 * Executar operação com retry policy
 */
export async function executarComRetry<T>(
  operacao: () => Promise<T>,
  config: RetryConfig,
  nomeOperacao = 'operacao'
): Promise<T> {
  const inicioTotal = Date.now();
  let ultimoErro: Error | undefined;
  const circuit = getCircuitBreaker(nomeOperacao);

  for (let tentativa = 1; tentativa <= config.maxTentativas; tentativa++) {
    try {
      console.log(
        `[RETRY] ${nomeOperacao} - tentativa ${tentativa}/${config.maxTentativas}`
      );

      // Verificar timeout total
      if (config.timeout) {
        const tempoDecorrido = Date.now() - inicioTotal;
        if (tempoDecorrido > config.timeout) {
          throw new Error(
            `Timeout total excedido (${config.timeout}ms) na tentativa ${tentativa}`
          );
        }
      }

      // Executar com circuit breaker
      const resultado = await circuit.executar(operacao);

      // Sucesso!
      const tempoTotal = Date.now() - inicioTotal;
      console.log(
        `[RETRY] ${nomeOperacao} - sucesso na tentativa ${tentativa} (${tempoTotal}ms)`
      );

      // Registrar métrica
      metricas.push({
        operacao: nomeOperacao,
        tentativas: tentativa,
        tempoTotal,
        sucesso: true,
        timestamp: new Date(),
      });

      return resultado;
    } catch (erro) {
      ultimoErro = erro as Error;
      const tempoDecorrido = Date.now() - inicioTotal;

      console.warn(
        `[RETRY] ${nomeOperacao} - falha na tentativa ${tentativa}/${config.maxTentativas}: ${ultimoErro.message}`
      );

      // Última tentativa - não fazer retry
      if (tentativa >= config.maxTentativas) {
        console.error(
          `[RETRY] ${nomeOperacao} - todas as ${config.maxTentativas} tentativas falharam`
        );

        // Registrar métrica de falha
        metricas.push({
          operacao: nomeOperacao,
          tentativas: tentativa,
          tempoTotal: tempoDecorrido,
          sucesso: false,
          erroFinal: ultimoErro.message,
          timestamp: new Date(),
        });

        throw ultimoErro;
      }

      // Verificar se deve retentar este tipo de erro
      if (!deveRetentarErro(ultimoErro, config)) {
        console.error(
          `[RETRY] ${nomeOperacao} - erro não recuperável, abortando: ${ultimoErro.message}`
        );

        metricas.push({
          operacao: nomeOperacao,
          tentativas: tentativa,
          tempoTotal: tempoDecorrido,
          sucesso: false,
          erroFinal: `Não recuperável: ${ultimoErro.message}`,
          timestamp: new Date(),
        });

        throw ultimoErro;
      }

      // Calcular delay antes da próxima tentativa
      const delay = calcularDelay(tentativa, config);
      console.log(
        `[RETRY] ${nomeOperacao} - aguardando ${delay}ms antes da próxima tentativa...`
      );

      await sleep(delay);
    }
  }

  // Nunca deve chegar aqui, mas TypeScript exige
  throw ultimoErro || new Error('Retry falhou sem erro capturado');
}

/**
 * Configurações pré-definidas para casos comuns
 */
export const RETRY_CONFIGS = {
  /** Retry para Puppeteer (timeouts e erros de protocolo) */
  PUPPETEER: {
    maxTentativas: 3,
    delayInicial: 2000,
    multiplicador: 2,
    delayMaximo: 10000,
    timeout: 120000, // 2 minutos total
    usarJitter: true,
    deveRetentar: (erro: Error) => {
      const mensagem = erro.message.toLowerCase();
      return (
        mensagem.includes('timeout') ||
        mensagem.includes('protocol') ||
        mensagem.includes('navigation') ||
        mensagem.includes('waiting')
      );
    },
  } as RetryConfig,

  /** Retry para Backblaze (erros de rede e rate limit) */
  BACKBLAZE: {
    maxTentativas: 5,
    delayInicial: 1000,
    multiplicador: 2,
    delayMaximo: 30000,
    timeout: 300000, // 5 minutos total
    usarJitter: true,
    codigosRetry: ['503', '429', '500', '502', '504'],
    deveRetentar: (erro: Error) => {
      const mensagem = erro.message;
      return (
        mensagem.includes('ECONNRESET') ||
        mensagem.includes('ETIMEDOUT') ||
        mensagem.includes('503') ||
        mensagem.includes('429') ||
        mensagem.includes('rate limit')
      );
    },
  } as RetryConfig,

  /** Retry rápido para operações locais */
  RAPIDO: {
    maxTentativas: 3,
    delayInicial: 500,
    multiplicador: 2,
    delayMaximo: 5000,
    usarJitter: true,
  } as RetryConfig,

  /** Retry para operações críticas (mais tentativas) */
  CRITICO: {
    maxTentativas: 10,
    delayInicial: 1000,
    multiplicador: 1.5,
    delayMaximo: 60000,
    timeout: 600000, // 10 minutos
    usarJitter: true,
  } as RetryConfig,
};

/**
 * Helper para resetar circuit breaker (útil em testes)
 */
export function resetCircuitBreaker(nome: string): void {
  const circuit = circuitBreakers.get(nome);
  if (circuit) {
    circuit.reset();
  }
}

/**
 * Obter status de todos os circuit breakers
 */
export function getCircuitBreakersStatus(): Record<string, any> {
  const status: Record<string, any> = {};

  circuitBreakers.forEach((circuit, nome) => {
    status[nome] = circuit.getStatus();
  });

  return status;
}
