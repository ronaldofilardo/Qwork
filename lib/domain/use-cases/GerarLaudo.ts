/**
 * lib/domain/use-cases/GerarLaudo.ts
 *
 * Use Case: Gerar Laudo Psicossocial Completo
 *
 * Orquestra a geração de laudo incluindo:
 * - Coleta de dados do lote
 * - Cálculos de scores
 * - Geração de PDF
 * - Persistência no banco
 */

import {
  LaudoEntity,
  LaudoStatus,
  LaudoDadosCompletos,
  LaudoBusinessRules,
} from '../entities/Laudo';

export interface GerarLaudoInput {
  loteId: number;
  emissorCpf: string;
}

export interface GerarLaudoOutput {
  laudoId: number;
  status: LaudoStatus;
  pdfPath: string | null;
  pdfHash: string | null;
}

/**
 * Port para repositório de Laudos
 * (implementação em lib/infrastructure/database/repositories/LaudoRepository.ts)
 */
export interface ILaudoRepository {
  buscarPorLote(loteId: number): Promise<LaudoEntity | null>;
  criar(
    laudo: Omit<LaudoEntity, 'id' | 'criadoEm' | 'atualizadoEm'>
  ): Promise<LaudoEntity>;
  atualizar(id: number, dados: Partial<LaudoEntity>): Promise<LaudoEntity>;
}

/**
 * Port para serviço de cálculos
 * (implementação em lib/infrastructure/services/LaudoCalculosService.ts)
 */
export interface ILaudoCalculosService {
  calcularDadosCompletos(loteId: number): Promise<LaudoDadosCompletos>;
}

/**
 * Port para gerador de PDF
 * (implementação em lib/infrastructure/pdf/generators/pdf-laudo-generator.ts)
 */
export interface ILaudoPDFGenerator {
  gerarPDF(dados: LaudoDadosCompletos): Promise<{ path: string; hash: string }>;
}

/**
 * Use Case principal
 */
export class GerarLaudoUseCase {
  constructor(
    private laudoRepository: ILaudoRepository,
    private calculosService: ILaudoCalculosService,
    private pdfGenerator: ILaudoPDFGenerator
  ) {}

  async execute(input: GerarLaudoInput): Promise<GerarLaudoOutput> {
    // 1. Verificar se já existe laudo para o lote
    const laudoExistente = await this.laudoRepository.buscarPorLote(
      input.loteId
    );

    if (laudoExistente) {
      throw new Error(
        `Laudo já existe para lote ${input.loteId} (ID: ${laudoExistente.id})`
      );
    }

    // 2. Calcular dados completos do laudo
    const dadosCompletos = await this.calculosService.calcularDadosCompletos(
      input.loteId
    );

    // 3. Validar regras de negócio
    const laudoRascunho: Partial<LaudoEntity> = {
      loteId: input.loteId,
      emissorCpf: input.emissorCpf,
      status: LaudoStatus.RASCUNHO,
      jsonData: dadosCompletos,
    };

    LaudoBusinessRules.validarEmissao(laudoRascunho);

    // 4. Criar laudo no banco (status: rascunho)
    const laudoCriado = await this.laudoRepository.criar({
      loteId: input.loteId,
      emissorCpf: input.emissorCpf,
      status: LaudoStatus.RASCUNHO,
      pdfPath: null,
      pdfHash: null,
      jsonData: dadosCompletos,
    });

    // 5. Gerar PDF
    const { path: pdfPath, hash: pdfHash } =
      await this.pdfGenerator.gerarPDF(dadosCompletos);

    // 6. Atualizar laudo com PDF e marcar como emitido
    const laudoFinal = await this.laudoRepository.atualizar(laudoCriado.id, {
      pdfPath,
      pdfHash,
      status: LaudoStatus.EMITIDO,
    });

    return {
      laudoId: laudoFinal.id,
      status: laudoFinal.status,
      pdfPath: laudoFinal.pdfPath,
      pdfHash: laudoFinal.pdfHash,
    };
  }
}
