/**
 * lib/domain/ports/ILaudoRepository.ts
 *
 * Interface do repositório de Laudos (Port - Hexagonal Architecture)
 *
 * Define o contrato que a infraestrutura deve implementar.
 * Mantém o domain independente de detalhes de persistência.
 */

import { LaudoEntity, LaudoStatus } from '../entities/Laudo';

export interface ILaudoRepository {
  /**
   * Buscar laudo por ID
   */
  buscarPorId(id: number): Promise<LaudoEntity | null>;

  /**
   * Buscar laudo por lote
   */
  buscarPorLote(loteId: number): Promise<LaudoEntity | null>;

  /**
   * Listar laudos por emissor
   */
  listarPorEmissor(emissorCpf: string, limit?: number): Promise<LaudoEntity[]>;

  /**
   * Listar laudos por status
   */
  listarPorStatus(status: LaudoStatus, limit?: number): Promise<LaudoEntity[]>;

  /**
   * Criar novo laudo
   */
  criar(
    laudo: Omit<LaudoEntity, 'id' | 'criadoEm' | 'atualizadoEm'>
  ): Promise<LaudoEntity>;

  /**
   * Atualizar laudo existente
   */
  atualizar(id: number, dados: Partial<LaudoEntity>): Promise<LaudoEntity>;

  /**
   * Deletar laudo (soft delete - muda status para CANCELADO)
   */
  deletar(id: number): Promise<void>;

  /**
   * Verificar integridade do PDF
   */
  verificarIntegridade(
    id: number
  ): Promise<{ valido: boolean; motivo?: string }>;
}

export interface ILaudoCalculosService {
  /**
   * Calcular todos os dados necessários para o laudo
   */
  calcularDadosCompletos(loteId: number): Promise<any>;

  /**
   * Calcular apenas scores por grupo
   */
  calcularScoresPorGrupo(loteId: number): Promise<any[]>;

  /**
   * Gerar interpretações e recomendações
   */
  gerarInterpretacaoRecomendacoes(scores: any[]): Promise<any>;
}

export interface ILaudoPDFGenerator {
  /**
   * Gerar PDF do laudo
   */
  gerarPDF(dados: any): Promise<{ path: string; hash: string }>;

  /**
   * Verificar integridade do PDF
   */
  verificarIntegridadePDF(path: string, hashEsperado: string): Promise<boolean>;
}
