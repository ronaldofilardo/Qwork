/**
 * Serviço de Validação Centralizada de Laudos
 *
 * Centraliza todas as validações relacionadas a laudos e emissões para:
 * - Evitar duplicação de código entre backend e frontend
 * - Garantir consistência nas regras de negócio
 * - Facilitar manutenção e evolução
 * - Validar imutabilidade e integridade de dados
 */

import { query } from '@/lib/db';
import {
  StatusLoteType,
  validarTransicaoStatus,
} from '@/lib/types/lote-status';
import crypto from 'crypto';

/**
 * Resultado de validação com detalhes
 */
export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
  avisos?: string[];
  dados?: Record<string, any>;
}

/**
 * Dados do lote para validação
 */
export interface DadosLote {
  id: number;
  status: StatusLoteType;
  hash_pdf?: string | null;
  emitido_em?: string | null;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
}

/**
 * Validar se lote pode ter emissão solicitada
 */
export async function validarSolicitacaoEmissao(
  loteId: number
): Promise<ResultadoValidacao> {
  const erros: string[] = [];
  const avisos: string[] = [];

  try {
    // Buscar dados do lote com contagens
    const resultado = await query(
      `SELECT 
        la.id,
        la.status,
        la.hash_pdf,
        la.emitido_em,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        l.id as laudo_id,
        l.status as laudo_status
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN laudos l ON la.id = l.lote_id
      WHERE la.id = $1
      GROUP BY la.id, la.status, la.hash_pdf, la.emitido_em, l.id, l.status`,
      [loteId]
    );

    if (resultado.rows.length === 0) {
      erros.push('Lote não encontrado');
      return { valido: false, erros };
    }

    const lote = resultado.rows[0];

    // 1. Validar status do lote
    if (lote.status !== 'concluido') {
      erros.push(`Lote não está concluído. Status atual: ${lote.status}`);
    }

    // 2. Validar que não tem laudo já emitido (imutabilidade)
    if (lote.laudo_id && lote.laudo_status) {
      erros.push(
        `Laudo já foi ${lote.laudo_status} para este lote. Operação não permitida.`
      );
    }

    // 3. Validar que tem avaliações
    if (lote.total_avaliacoes === 0) {
      erros.push('Lote não possui avaliações');
    }

    // 4. Validar que todas avaliações ativas estão concluídas
    const avaliacoesAtivas = lote.total_avaliacoes - lote.avaliacoes_inativadas;
    if (avaliacoesAtivas > 0 && lote.avaliacoes_concluidas < avaliacoesAtivas) {
      erros.push(
        `Nem todas as avaliações estão concluídas (${lote.avaliacoes_concluidas}/${avaliacoesAtivas})`
      );
    }

    // 5. Avisos
    if (lote.avaliacoes_inativadas > 0) {
      avisos.push(
        `${lote.avaliacoes_inativadas} avaliação(ões) inativada(s) não serão incluídas no laudo`
      );
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos,
      dados: {
        loteId: lote.id,
        status: lote.status,
        totalAvaliacoes: lote.total_avaliacoes,
        avaliacoesAtivas: avaliacoesAtivas,
        avaliacoesConcluidas: lote.avaliacoes_concluidas,
      },
    };
  } catch (error) {
    console.error('[ERRO] Erro ao validar solicitação de emissão:', error);
    erros.push('Erro interno ao validar lote');
    return { valido: false, erros };
  }
}

/**
 * Validar se laudo pode ser gerado (emissor)
 */
export async function validarGeracaoLaudo(
  loteId: number,
  emissorCpf: string
): Promise<ResultadoValidacao> {
  const erros: string[] = [];
  const avisos: string[] = [];

  try {
    // Buscar dados do lote
    const resultado = await query(
      `SELECT 
        la.id,
        la.status,
        la.hash_pdf,
        COUNT(a.id) FILTER (WHERE a.status != 'inativada') as avaliacoes_ativas,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida') as avaliacoes_concluidas,
        l.id as laudo_id,
        l.status as laudo_status,
        l.emissor_cpf
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN laudos l ON la.id = l.lote_id
      WHERE la.id = $1
      GROUP BY la.id, la.status, la.hash_pdf, l.id, l.status, l.emissor_cpf`,
      [loteId]
    );

    if (resultado.rows.length === 0) {
      erros.push('Lote não encontrado');
      return { valido: false, erros };
    }

    const lote = resultado.rows[0];

    // 1. Validar que emissão foi solicitada
    if (
      lote.status !== 'emissao_solicitada' &&
      lote.status !== 'emissao_em_andamento'
    ) {
      erros.push(
        `Emissão não foi solicitada para este lote. Status: ${lote.status}`
      );
    }

    // 2. Validar imutabilidade - não pode ter laudo enviado
    if (lote.laudo_status === 'enviado') {
      erros.push('Laudo já foi enviado. Não é possível gerar novamente.');
    }

    // 3. Validar que emissor está autorizado (se já existe laudo em rascunho)
    if (lote.laudo_id && lote.emissor_cpf && lote.emissor_cpf !== emissorCpf) {
      avisos.push(
        `Este lote já possui um laudo em rascunho de outro emissor (${lote.emissor_cpf})`
      );
    }

    // 4. Validar avaliações
    if (lote.avaliacoes_ativas === 0) {
      erros.push('Lote não possui avaliações ativas');
    }

    if (lote.avaliacoes_concluidas < lote.avaliacoes_ativas) {
      erros.push(
        `Nem todas as avaliações estão concluídas (${lote.avaliacoes_concluidas}/${lote.avaliacoes_ativas})`
      );
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos,
      dados: {
        loteId: lote.id,
        status: lote.status,
        laudoExistente: Boolean(lote.laudo_id),
      },
    };
  } catch (error) {
    console.error('[ERRO] Erro ao validar geração de laudo:', error);
    erros.push('Erro interno ao validar lote');
    return { valido: false, erros };
  }
}

/**
 * Validar hash SHA-256 do PDF
 */
export function validarHashPDF(
  hash: string | null | undefined
): ResultadoValidacao {
  const erros: string[] = [];

  if (!hash) {
    erros.push('Hash do PDF não foi fornecido');
    return { valido: false, erros };
  }

  // Validar formato SHA-256 (64 caracteres hexadecimais)
  const regexSHA256 = /^[a-f0-9]{64}$/i;
  if (!regexSHA256.test(hash)) {
    erros.push('Hash inválido. Deve ser SHA-256 (64 caracteres hexadecimais)');
    return { valido: false, erros };
  }

  return { valido: true, erros: [], dados: { hash } };
}

/**
 * Calcular hash SHA-256 de um buffer
 */
export function calcularHashSHA256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validar se PDF está íntegro comparando hash
 */
export async function validarIntegridadePDF(
  loteId: number,
  pdfBuffer: Buffer
): Promise<ResultadoValidacao> {
  const erros: string[] = [];

  try {
    // Buscar hash armazenado
    const resultado = await query(
      'SELECT hash_pdf FROM lotes_avaliacao WHERE id = $1',
      [loteId]
    );

    if (resultado.rows.length === 0) {
      erros.push('Lote não encontrado');
      return { valido: false, erros };
    }

    const hashArmazenado = resultado.rows[0].hash_pdf;

    if (!hashArmazenado) {
      erros.push('Hash do PDF não está registrado no banco');
      return { valido: false, erros };
    }

    // Calcular hash do buffer fornecido
    const hashCalculado = calcularHashSHA256(pdfBuffer);

    if (hashCalculado !== hashArmazenado) {
      erros.push(
        'Hash do PDF não corresponde ao armazenado. Arquivo pode estar corrompido.'
      );
      return {
        valido: false,
        erros,
        dados: {
          hashEsperado: hashArmazenado,
          hashCalculado,
        },
      };
    }

    return {
      valido: true,
      erros: [],
      dados: {
        hash: hashCalculado,
        integro: true,
      },
    };
  } catch (error) {
    console.error('[ERRO] Erro ao validar integridade do PDF:', error);
    erros.push('Erro interno ao validar integridade');
    return { valido: false, erros };
  }
}

/**
 * Validar transição de status do lote
 */
export function validarMudancaStatus(
  statusAtual: StatusLoteType,
  novoStatus: StatusLoteType
): ResultadoValidacao {
  const resultado = validarTransicaoStatus(statusAtual, novoStatus);

  if (!resultado.valido) {
    return {
      valido: false,
      erros: [resultado.erro || 'Transição de status inválida'],
    };
  }

  return {
    valido: true,
    erros: [],
    dados: {
      statusAnterior: statusAtual,
      novoStatus,
    },
  };
}

/**
 * Validar que laudo não foi alterado (imutabilidade)
 */
export async function validarImutabilidadeLaudo(
  loteId: number
): Promise<ResultadoValidacao> {
  const erros: string[] = [];

  try {
    const resultado = await query(
      `SELECT 
        l.id,
        l.status,
        l.hash_pdf,
        l.emitido_em,
        l.enviado_em,
        COUNT(al.id) as num_alteracoes
      FROM laudos l
      LEFT JOIN auditoria_laudos al ON l.lote_id = al.lote_id
        AND al.acao IN ('atualizar_laudo', 'reemitir_laudo')
      WHERE l.lote_id = $1
      GROUP BY l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em`,
      [loteId]
    );

    if (resultado.rows.length === 0) {
      // Sem laudo ainda, OK
      return { valido: true, erros: [] };
    }

    const laudo = resultado.rows[0];

    // Se laudo foi enviado, não pode ser alterado
    if (laudo.status === 'enviado') {
      erros.push(
        'Laudo já foi enviado. Operação não permitida (imutabilidade).'
      );
    }

    // Verificar número de alterações (limite de segurança)
    if (laudo.num_alteracoes > 5) {
      erros.push(
        `Laudo foi alterado ${laudo.num_alteracoes} vezes. Limite excedido para segurança.`
      );
    }

    return {
      valido: erros.length === 0,
      erros,
      dados: {
        laudoId: laudo.id,
        status: laudo.status,
        numeroAlteracoes: laudo.num_alteracoes,
      },
    };
  } catch (error) {
    console.error('[ERRO] Erro ao validar imutabilidade:', error);
    erros.push('Erro interno ao validar imutabilidade');
    return { valido: false, erros };
  }
}

/**
 * Validação completa antes de emissão
 */
export async function validarEmissaoCompleta(
  loteId: number,
  emissorCpf: string
): Promise<ResultadoValidacao> {
  const todosErros: string[] = [];
  const todosAvisos: string[] = [];

  // 1. Validar geração de laudo
  const validacaoGeracao = await validarGeracaoLaudo(loteId, emissorCpf);
  todosErros.push(...validacaoGeracao.erros);
  if (validacaoGeracao.avisos) {
    todosAvisos.push(...validacaoGeracao.avisos);
  }

  // 2. Validar imutabilidade
  const validacaoImutabilidade = await validarImutabilidadeLaudo(loteId);
  todosErros.push(...validacaoImutabilidade.erros);

  return {
    valido: todosErros.length === 0,
    erros: todosErros,
    avisos: todosAvisos.length > 0 ? todosAvisos : undefined,
  };
}
