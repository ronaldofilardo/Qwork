/**
 * lib/sanitize.ts
 *
 * Sanitização de input para prevenir XSS e injection attacks.
 * Remove caracteres perigosos mas preserva conteúdo legível.
 */

/**
 * Sanitiza string para uso em atributos HTML (remove quotes, escapes especiais).
 * Use para: data attributes, meta tags, inline styles.
 */
export function sanitizeHtmlAttribute(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .substring(0, 1000); // Limitar tamanho
}

/**
 * Sanitiza string para uso como texto em HTML.
 * Escapa < > & para prevenir XSS.
 * Preserva new lines e espaços.
 */
export function sanitizeHtmlText(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .substring(0, 5000); // Limitar tamanho
}

/**
 * Sanitiza input para uso em SQL LIKE queries.
 * Remove wildcards perigosos mas permite busca básica.
 */
export function sanitizeSqlLike(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/[%_\\]/g, '\\$&') // Escapar wildcards SQL
    .substring(0, 100);
}

/**
 * Sanitiza nome/campo com permissão limitada de caracteres.
 * Apenas alphanuméricas, espaço, e alguns símbolos comuns.
 */
export function sanitizeTextField(value: string, maxLen: number = 256): string {
  if (!value || typeof value !== 'string') return '';
  // Remover caracteres de controle, escapar HTML
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // Remover controle chars
    .replace(/[<>"{}&]/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '{': '&#123;',
        '}': '&#125;',
        '&': '&amp;',
      };
      return map[char] || char;
    })
    .substring(0, maxLen);
}

/**
 * Remove qualquer tag HTML/script.
 * Use para content de usuário que será armazenado (comments, descriptions).
 */
export function stripHtmlTags(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '') // Remove todas as tags
    .substring(0, 5000);
}

/**
 * Valida e sanitiza CPF.
 * Aceita padrão com ou sem formatação.
 */
export function sanitizeCpf(value: string): string {
  if (!value || typeof value !== 'string') return '';
  // Remover apenas dígitos
  const cleaned = value.replace(/\D/g, '');
  if (!/^\d{11}$/.test(cleaned)) throw new Error('CPF inválido');
  return cleaned;
}

/**
 * Valida e sanitiza CNPJ.
 */
export function sanitizeCnpj(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const cleaned = value.replace(/\D/g, '');
  if (!/^\d{14}$/.test(cleaned)) throw new Error('CNPJ inválido');
  return cleaned;
}

/**
 * Valida e sanitiza email simples.
 */
export function sanitizeEmail(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase();
  // Validação regex simples (production: usar library dedicada)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Email inválido');
  }
  return trimmed.substring(0, 254);
}

/**
 * Valida URL e previne javascript: schemes.
 */
export function sanitizeUrl(value: string): string {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    if (!/^https?:/.test(url.protocol)) throw new Error('Protocolo inválido');
    return url.toString();
  } catch {
    throw new Error('URL inválida');
  }
}
