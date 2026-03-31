/**
 * laudo-guard.ts
 *
 * Sistema de Proteção Permanente contra Deleção de Laudos
 *
 * Laudos são documentos 100% imutáveis após emissão.
 * Nenhum arquivo de laudo pode ser deletado — nem localmente
 * (storage/laudos/) nem remotamente no Backblaze (prefixo laudos/).
 *
 * As funções deste módulo são chamadas como guards em TODAS as
 * operações de deleção de arquivos relacionados a laudos e devem
 * lançar LaudoDeletionBlockedError antes de qualquer operação ser
 * executada.
 *
 * Exceção deliberada: storage/laudos/pending/ contém arquivos
 * temporários pré-confirmação cujo ciclo de vida é controlado.
 */

import path from 'path';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Prefixo de chave Backblaze que está protegido contra deleção */
export const LAUDOS_BACKBLAZE_PROTECTED_PREFIX = 'laudos/';

/**
 * Sufixo de path local protegido.
 * Qualquer path que contenha este segmento está protegido,
 * exceto quando o path também contém o segmento PENDING_SEGMENT.
 */
const LAUDOS_LOCAL_SEGMENT = path.join('storage', 'laudos');

/**
 * Sub-diretório temporário dentro de storage/laudos que é permitido deletar.
 * Contém arquivos pré-upload que ainda não foram confirmados.
 */
const PENDING_SEGMENT = path.join('storage', 'laudos', 'pending');

// ─── Erro especializado ───────────────────────────────────────────────────────

/**
 * Erro lançado quando uma tentativa de deleção de laudo é bloqueada.
 * Possui código único para permitir catch seletivo.
 */
export class LaudoDeletionBlockedError extends Error {
  readonly code = 'LAUDO_DELETION_BLOCKED' as const;

  constructor(target: string, context: 'backblaze' | 'local') {
    const where =
      context === 'backblaze' ? 'Backblaze bucket' : 'storage local';
    super(
      `[LAUDO-GUARD] Deleção de laudo BLOQUEADA (${where}): "${target}". ` +
        'Laudos são imutáveis e nunca podem ser deletados. ' +
        'Consulte lib/storage/laudo-guard.ts para entender a política.'
    );
    this.name = 'LaudoDeletionBlockedError';
    // Garantir que instanceof funciona corretamente em ambientes transpilados
    Object.setPrototypeOf(this, LaudoDeletionBlockedError.prototype);
  }
}

// ─── Guards públicos ──────────────────────────────────────────────────────────

/**
 * Verifica se uma chave Backblaze está protegida contra deleção.
 *
 * Lança LaudoDeletionBlockedError se a chave começa com "laudos/".
 *
 * @param key - Chave (path) do objeto no bucket Backblaze
 * @throws {LaudoDeletionBlockedError} se a chave for um laudo
 *
 * @example
 * assertNotLaudoBackblazeKey('laudos/lote-1/laudo-123.pdf'); // lança
 * assertNotLaudoBackblazeKey('health/check.txt');            // ok
 */
export function assertNotLaudoBackblazeKey(key: string): void {
  const normalizedKey = key.replace(/\\/g, '/');
  if (normalizedKey.startsWith(LAUDOS_BACKBLAZE_PROTECTED_PREFIX)) {
    throw new LaudoDeletionBlockedError(key, 'backblaze');
  }
}

/**
 * Verifica se um path local está protegido contra deleção.
 *
 * Lança LaudoDeletionBlockedError se o path normalizado contém
 * "storage/laudos" MAS não contém "storage/laudos/pending".
 *
 * @param filePath - Caminho absoluto ou relativo do arquivo local
 * @throws {LaudoDeletionBlockedError} se o path for um laudo protegido
 *
 * @example
 * assertNotLaudoLocalPath('/app/storage/laudos/laudo-5.pdf');             // lança
 * assertNotLaudoLocalPath('/app/storage/laudos/pending/temp-abc.pdf.tmp'); // ok (pending é permitido)
 * assertNotLaudoLocalPath('/app/public/uploads/doc.pdf');                  // ok
 */
export function assertNotLaudoLocalPath(filePath: string): void {
  const normalizedPath = path.normalize(filePath);
  const hasLaudosSegment = normalizedPath.includes(LAUDOS_LOCAL_SEGMENT);
  const hasPendingSegment = normalizedPath.includes(PENDING_SEGMENT);

  if (hasLaudosSegment && !hasPendingSegment) {
    throw new LaudoDeletionBlockedError(filePath, 'local');
  }
}
